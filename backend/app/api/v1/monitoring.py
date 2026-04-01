from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.monitoring import AlertRecord, ApiHealthStats, QueueHealthStats
from app.models.runtime import JobRun
from app.schemas.monitoring import DashboardMetrics, TrendPoint

router = APIRouter()
ALERT_TRANSITIONS = {
    "ack": {"next": "ack", "allowed_from": {"open"}},
    "resolve": {"next": "resolved", "allowed_from": {"open", "ack"}},
    "reopen": {"next": "open", "allowed_from": {"resolved"}},
}


def _iso_now() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def _build_hourly_trend() -> list[TrendPoint]:
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    baseline = [220, 280, 250, 320, 300, 355]
    minute_factor = datetime.utcnow().minute % 7
    points: list[TrendPoint] = []
    for index, value in enumerate(baseline):
        hour = now - timedelta(hours=(len(baseline) - 1 - index))
        adjusted = value + (minute_factor * (1 if index % 2 == 0 else -1))
        points.append(TrendPoint(t=hour.strftime("%H:%M"), run=max(80, adjusted)))
    return points


def _seed_history(status: str) -> list[dict]:
    history = [
        {
            "action": "created",
            "from_status": None,
            "to_status": "open",
            "actor": "system",
            "at": _iso_now(),
        }
    ]
    if status == "ack":
        history.append(
            {
                "action": "ack",
                "from_status": "open",
                "to_status": "ack",
                "actor": "system",
                "at": _iso_now(),
            }
        )
    return history


def _seed_alerts_if_empty(db: Session) -> None:
    count = int(db.scalar(select(func.count()).select_from(AlertRecord)) or 0)
    if count > 0:
        return

    seed_items = [
        {
            "alert_type": "queue_backlog",
            "severity": "P1",
            "status": "open",
            "detail": {
                "message": "Queue backlog exceeds threshold",
                "queue": "voc_raw_comment",
                "history": _seed_history("open"),
            },
        },
        {
            "alert_type": "model_error_rate",
            "severity": "P2",
            "status": "ack",
            "detail": {
                "message": "Model error rate trend up",
                "model": "gpt-4.1-mini",
                "history": _seed_history("ack"),
            },
        },
        {
            "alert_type": "datasource_timeout",
            "severity": "P3",
            "status": "open",
            "detail": {
                "message": "Datasource timeout spikes",
                "datasource": "HTTP-comments",
                "history": _seed_history("open"),
            },
        },
    ]
    for item in seed_items:
        db.add(AlertRecord(**item))
    db.commit()


def _seed_queue_health_if_empty(db: Session) -> None:
    count = int(db.scalar(select(func.count()).select_from(QueueHealthStats)) or 0)
    if count > 0:
        return

    db.add_all(
        [
            QueueHealthStats(queue_name="voc_raw_comment", backlog=1294, consumer_lag=182, status="warning"),
            QueueHealthStats(queue_name="voc_analysis_task", backlog=184, consumer_lag=27, status="healthy"),
            QueueHealthStats(queue_name="voc_retry_queue", backlog=39, consumer_lag=6, status="healthy"),
        ]
    )
    db.commit()


def _seed_api_health_if_empty(db: Session) -> None:
    count = int(db.scalar(select(func.count()).select_from(ApiHealthStats)) or 0)
    if count > 0:
        return

    db.add_all(
        [
            ApiHealthStats(api_name="llm.classify", success_rate=0.981, p95_latency_ms=1360, status="healthy"),
            ApiHealthStats(api_name="llm.relevance", success_rate=0.972, p95_latency_ms=1180, status="healthy"),
            ApiHealthStats(api_name="embedding.similarity", success_rate=0.953, p95_latency_ms=890, status="warning"),
        ]
    )
    db.commit()


def _refresh_monitoring(db: Session) -> None:
    _seed_alerts_if_empty(db)
    _seed_queue_health_if_empty(db)
    _seed_api_health_if_empty(db)


def _normalize_detail(detail: dict | None) -> dict:
    payload = dict(detail or {})
    if not isinstance(payload.get("history"), list):
        payload["history"] = []
    return payload


def _alert_to_dict(alert: AlertRecord) -> dict:
    return {
        "id": alert.id,
        "type": alert.alert_type,
        "severity": alert.severity,
        "status": alert.status,
        "detail": _normalize_detail(alert.detail),
        "created_at": alert.created_at,
    }


def _append_alert_history(detail: dict | None, action: str, from_status: str, to_status: str, actor: str) -> dict:
    payload = _normalize_detail(detail)
    history = list(payload["history"])
    history.append(
        {
            "action": action,
            "from_status": from_status,
            "to_status": to_status,
            "actor": actor,
            "at": _iso_now(),
        }
    )
    payload["history"] = history
    payload["last_action"] = action
    payload["last_action_at"] = history[-1]["at"]
    return payload


@router.get("/dashboard", response_model=DashboardMetrics)
def dashboard_metrics(db: Session = Depends(get_db)) -> DashboardMetrics:
    _refresh_monitoring(db)
    runs = db.scalars(select(JobRun)).all()

    if runs:
        total_processed = sum(max(0, run.success_count) + max(0, run.failed_count) for run in runs)
        success_total = sum(max(0, run.success_count) for run in runs)
        queue_backlog = sum(max(0, run.total_input - run.success_count) for run in runs if run.status == "running")
        if total_processed <= 0:
            total_processed = 128420
            model_success_rate = 0.976
        else:
            model_success_rate = success_total / total_processed
    else:
        total_processed = 128420
        model_success_rate = 0.976
        queue_backlog = 1294

    open_alerts = int(
        db.scalar(select(func.count()).select_from(AlertRecord).where(AlertRecord.status == "open")) or 0
    )
    if queue_backlog <= 0:
        queue_backlog = 1294

    return DashboardMetrics(
        total_processed=total_processed,
        model_success_rate=model_success_rate,
        queue_backlog=queue_backlog,
        open_alerts=open_alerts,
    )


@router.get("/trend", response_model=list[TrendPoint])
def trend_metrics() -> list[TrendPoint]:
    return _build_hourly_trend()


@router.get("/datasources")
def datasource_metrics() -> list[dict]:
    return [
        {"datasource": "HTTP-comments", "success_rate": 0.984, "latency_ms": 330},
        {"datasource": "Kafka-hotline", "success_rate": 0.973, "latency_ms": 210},
    ]


@router.get("/models")
def model_metrics() -> list[dict]:
    return [
        {"model": "gpt-4.1-mini", "calls": 42210, "avg_latency_ms": 1240, "error_rate": 0.019},
        {"model": "deepseek-v3", "calls": 12904, "avg_latency_ms": 920, "error_rate": 0.023},
    ]


@router.get("/queues")
def queue_health_metrics(db: Session = Depends(get_db)) -> list[dict]:
    _refresh_monitoring(db)
    rows = db.scalars(select(QueueHealthStats).order_by(desc(QueueHealthStats.id))).all()
    return [
        {
            "queue": row.queue_name,
            "backlog": row.backlog,
            "consumer_lag": row.consumer_lag,
            "status": row.status,
        }
        for row in rows
    ]


@router.get("/apis")
def api_health_metrics(db: Session = Depends(get_db)) -> list[dict]:
    _refresh_monitoring(db)
    rows = db.scalars(select(ApiHealthStats).order_by(desc(ApiHealthStats.id))).all()
    return [
        {
            "api": row.api_name,
            "success_rate": row.success_rate,
            "p95_latency_ms": row.p95_latency_ms,
            "status": row.status,
        }
        for row in rows
    ]


@router.get("/alerts")
def alert_records(
    status: str = Query(default="all"),
    severity: str = Query(default="all"),
    db: Session = Depends(get_db),
) -> list[dict]:
    _refresh_monitoring(db)
    stmt = select(AlertRecord)
    if status != "all":
        stmt = stmt.where(AlertRecord.status == status)
    if severity != "all":
        stmt = stmt.where(AlertRecord.severity == severity)
    rows = db.scalars(stmt.order_by(desc(AlertRecord.created_at), desc(AlertRecord.id))).all()
    return [_alert_to_dict(row) for row in rows]


@router.get("/alerts/{alert_id}")
def alert_record_detail(alert_id: int, db: Session = Depends(get_db)) -> dict:
    _refresh_monitoring(db)
    alert = db.scalar(select(AlertRecord).where(AlertRecord.id == alert_id))
    if alert is None:
        raise HTTPException(status_code=404, detail="alert not found")
    return _alert_to_dict(alert)


def _update_alert_status(alert_id: int, action: str, db: Session, actor: str = "operator") -> dict:
    _refresh_monitoring(db)
    alert = db.scalar(select(AlertRecord).where(AlertRecord.id == alert_id))
    if alert is None:
        raise HTTPException(status_code=404, detail="alert not found")

    transition = ALERT_TRANSITIONS[action]
    next_status = str(transition["next"])
    allowed_from = set(transition["allowed_from"])
    if alert.status == next_status:
        return _alert_to_dict(alert)
    if alert.status not in allowed_from:
        raise HTTPException(status_code=409, detail=f"cannot {action} alert from status={alert.status}")

    previous_status = alert.status
    alert.status = next_status
    alert.detail = _append_alert_history(
        detail=alert.detail,
        action=action,
        from_status=previous_status,
        to_status=next_status,
        actor=actor,
    )
    db.commit()
    db.refresh(alert)
    return _alert_to_dict(alert)


@router.post("/alerts/{alert_id}/ack")
def ack_alert(
    alert_id: int,
    actor: str = Query(default="operator"),
    db: Session = Depends(get_db),
) -> dict:
    return _update_alert_status(alert_id=alert_id, action="ack", db=db, actor=actor)


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    actor: str = Query(default="operator"),
    db: Session = Depends(get_db),
) -> dict:
    return _update_alert_status(alert_id=alert_id, action="resolve", db=db, actor=actor)


@router.post("/alerts/{alert_id}/reopen")
def reopen_alert(
    alert_id: int,
    actor: str = Query(default="operator"),
    db: Session = Depends(get_db),
) -> dict:
    return _update_alert_status(alert_id=alert_id, action="reopen", db=db, actor=actor)
