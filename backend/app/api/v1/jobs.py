from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc, func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.config import DataSourceConfig, JobConfig
from app.models.runtime import JobRun, JobRunStage, RunFailureDetail
from app.schemas.job import JobConfigIn, JobConfigOut, TriggerResponse
from app.services.pipeline_runner import run_pipeline_mock

router = APIRouter()

DEFAULT_STAGES = ["pre_filter", "relevance_analysis", "label_classify", "sentiment_analysis"]

_seed_jobs: list[dict] = [
    {
        "name": "HTTP Review Batch",
        "code": "JOB_HTTP_REVIEW",
        "job_type": "batch",
        "datasource_id": 1,
        "schedule_expr": "manual",
        "enabled": True,
        "output_type": "table",
        "pipeline_config": {},
    },
    {
        "name": "Kafka Stream Consumer",
        "code": "JOB_KAFKA_STREAM",
        "job_type": "stream",
        "datasource_id": 3,
        "schedule_expr": "*/5 * * * *",
        "enabled": True,
        "output_type": "table",
        "pipeline_config": {},
    },
]

_seed_runs: dict[str, list[dict]] = {
    "JOB_HTTP_REVIEW": [
        {
            "run_id": "RUN-20260331-001",
            "status": "success",
            "success_count": 1280,
            "failed_count": 21,
            "started_at": "2026-03-31T09:10:00",
            "ended_at": "2026-03-31T09:15:12",
        },
        {
            "run_id": "RUN-20260331-002",
            "status": "partial_success",
            "success_count": 1011,
            "failed_count": 66,
            "started_at": "2026-03-31T11:00:00",
            "ended_at": "2026-03-31T11:07:49",
        },
    ],
    "JOB_KAFKA_STREAM": [
        {
            "run_id": "RUN-20260331-003",
            "status": "running",
            "success_count": 320,
            "failed_count": 2,
            "started_at": "2026-03-31T13:00:00",
            "ended_at": None,
        }
    ],
}

_seed_stages: dict[str, list[dict]] = {
    "RUN-20260331-001": [
        {"stage_name": "pre_filter", "status": "success", "duration_ms": 420},
        {"stage_name": "relevance_analysis", "status": "success", "duration_ms": 1030},
        {"stage_name": "label_classify", "status": "success", "duration_ms": 1560},
        {"stage_name": "sentiment_analysis", "status": "success", "duration_ms": 860},
    ],
    "RUN-20260331-002": [
        {"stage_name": "pre_filter", "status": "success", "duration_ms": 610},
        {"stage_name": "relevance_analysis", "status": "success", "duration_ms": 1480},
        {"stage_name": "label_classify", "status": "partial_success", "duration_ms": 1760},
        {"stage_name": "sentiment_analysis", "status": "success", "duration_ms": 920},
    ],
    "RUN-20260331-003": [
        {"stage_name": "pre_filter", "status": "success", "duration_ms": 390},
        {"stage_name": "relevance_analysis", "status": "running", "duration_ms": 780},
        {"stage_name": "label_classify", "status": "pending", "duration_ms": 0},
        {"stage_name": "sentiment_analysis", "status": "pending", "duration_ms": 0},
    ],
}

_seed_failures: dict[str, list[dict]] = {
    "RUN-20260331-001": [
        {
            "record_id": "REC-1102",
            "error_type": "schema_mismatch",
            "category": "system_error",
            "node": "pre_filter",
            "detail": "Field ext_json is not compatible with schema",
            "input_payload": {"ext_json": "abc"},
            "output_payload": {"reason": "invalid schema"},
        },
        {
            "record_id": "REC-1178",
            "error_type": "timeout",
            "category": "model_error",
            "node": "label_classify",
            "detail": "Model call timeout over 3000ms",
            "input_payload": {"content": "install timeout"},
            "output_payload": {"timeout_ms": 3100},
        },
    ],
    "RUN-20260331-002": [
        {
            "record_id": "REC-2081",
            "error_type": "label_empty",
            "category": "business_error",
            "node": "label_classify",
            "detail": "Label decision is empty",
            "input_payload": {"content": "empty label case"},
            "output_payload": {"label": None},
        },
        {
            "record_id": "REC-2199",
            "error_type": "voc_irrelevant",
            "category": "business_error",
            "node": "relevance_analysis",
            "detail": "Text is not relevant to VOC",
            "input_payload": {"content": "promotion campaign"},
            "output_payload": {"relevance": 0.1},
        },
        {
            "record_id": "REC-2245",
            "error_type": "parse_failed",
            "category": "system_error",
            "node": "sentiment_analysis",
            "detail": "Failed to parse model JSON output",
            "input_payload": {"content": "sentiment output malformed"},
            "output_payload": {"raw": "<invalid json>"},
        },
    ],
    "RUN-20260331-003": [
        {
            "record_id": "REC-3022",
            "error_type": "pending_retry",
            "category": "transient_error",
            "node": "relevance_analysis",
            "detail": "Waiting for retry window",
            "input_payload": {"content": "retry later"},
            "output_payload": {"state": "pending"},
        }
    ],
}


def _to_job_out(item: JobConfig) -> JobConfigOut:
    return JobConfigOut(
        id=item.id,
        name=item.name,
        code=item.code,
        job_type=item.job_type,
        datasource_id=item.datasource_id,
        schedule_expr=item.schedule_expr,
        output_type=item.output_type,
        enabled=item.enabled,
    )


def _seed_jobs_if_empty(db: Session) -> None:
    count = int(db.scalar(select(func.count()).select_from(JobConfig)) or 0)
    if count > 0:
        return

    for item in _seed_jobs:
        db.add(JobConfig(**item))
    db.commit()


def _refresh_jobs(db: Session) -> None:
    _seed_jobs_if_empty(db)


def _seed_runtime_if_empty(db: Session) -> None:
    run_count = int(db.scalar(select(func.count()).select_from(JobRun)) or 0)
    if run_count > 0:
        return

    for job_code, run_items in _seed_runs.items():
        job_id = db.scalar(select(JobConfig.id).where(JobConfig.code == job_code))
        if job_id is None:
            continue
        for run in run_items:
            started_at = datetime.fromisoformat(run["started_at"]) if run["started_at"] else datetime.utcnow()
            ended_at = datetime.fromisoformat(run["ended_at"]) if run["ended_at"] else None
            db.add(
                JobRun(
                    run_id=run["run_id"],
                    job_id=job_id,
                    status=run["status"],
                    total_input=run["success_count"] + run["failed_count"],
                    success_count=run["success_count"],
                    failed_count=run["failed_count"],
                    started_at=started_at,
                    ended_at=ended_at,
                )
            )

    for run_id, stages in _seed_stages.items():
        for stage in stages:
            db.add(
                JobRunStage(
                    run_id=run_id,
                    stage_name=stage["stage_name"],
                    status=stage["status"],
                    duration_ms=stage["duration_ms"],
                )
            )

    for run_id, failures in _seed_failures.items():
        for item in failures:
            db.add(
                RunFailureDetail(
                    run_id=run_id,
                    record_id=item["record_id"],
                    category=item["category"],
                    node=item["node"],
                    error_type=item["error_type"],
                    detail=item["detail"],
                    input_payload=item.get("input_payload", {}),
                    output_payload=item.get("output_payload", {}),
                )
            )

    db.commit()


def _advance_running_runs(db: Session) -> None:
    now = datetime.utcnow()
    running_runs = db.scalars(select(JobRun).where(JobRun.status == "running")).all()
    changed = False

    for run in running_runs:
        stages = db.scalars(select(JobRunStage).where(JobRunStage.run_id == run.run_id).order_by(JobRunStage.id)).all()
        if not stages:
            continue

        elapsed = max(0.0, (now - run.started_at).total_seconds()) if run.started_at else 0.0
        step_seconds = 2.0
        total_steps = len(stages)
        completed_steps = int(elapsed // step_seconds)

        if completed_steps >= total_steps:
            for idx, stage in enumerate(stages):
                stage.status = "success"
                if stage.duration_ms <= 0:
                    stage.duration_ms = 500 + idx * 180
            run.status = "success"
            if run.total_input <= 0:
                run.total_input = 1
            run.success_count = run.total_input
            run.failed_count = 0
            if run.ended_at is None:
                run.ended_at = now
            changed = True
            continue

        for idx, stage in enumerate(stages):
            if idx < completed_steps:
                if stage.status != "success":
                    stage.status = "success"
                    if stage.duration_ms <= 0:
                        stage.duration_ms = 500 + idx * 180
                    changed = True
            elif idx == completed_steps:
                stage.status = "running"
                stage.duration_ms = max(stage.duration_ms, int((elapsed % step_seconds) * 1000))
                changed = True
            else:
                if stage.status != "pending":
                    stage.status = "pending"
                    changed = True

        if run.total_input > 0:
            progress = min(0.95, elapsed / (total_steps * step_seconds))
            success_count = int(run.total_input * progress)
            failed_count = max(0, run.total_input - success_count)
            if run.success_count != success_count or run.failed_count != failed_count:
                run.success_count = success_count
                run.failed_count = failed_count
                changed = True

    if changed:
        db.commit()


def _sync_failure_retry_status(db: Session) -> None:
    retry_items = db.scalars(select(RunFailureDetail).where(RunFailureDetail.retry_run_id.isnot(None))).all()
    if not retry_items:
        return

    run_ids = {item.retry_run_id for item in retry_items if item.retry_run_id}
    run_map: dict[str, JobRun] = {}
    if run_ids:
        for run in db.scalars(select(JobRun).where(JobRun.run_id.in_(run_ids))).all():
            run_map[run.run_id] = run

    changed = False
    for item in retry_items:
        retry_run = run_map.get(item.retry_run_id or "")
        if retry_run is None:
            continue
        if retry_run.status == "success":
            next_status = "success"
        elif retry_run.status in {"failed", "partial_success"}:
            next_status = "failed"
        elif retry_run.status in {"running", "pending"}:
            next_status = "running"
        else:
            next_status = item.retry_status
        if item.retry_status != next_status:
            item.retry_status = next_status
            changed = True

    if changed:
        db.commit()


def _refresh_runtime(db: Session) -> None:
    _refresh_jobs(db)
    _seed_runtime_if_empty(db)
    _advance_running_runs(db)
    _sync_failure_retry_status(db)


def _run_to_dict(run: JobRun) -> dict:
    return {
        "run_id": run.run_id,
        "status": run.status,
        "success_count": run.success_count,
        "failed_count": run.failed_count,
        "started_at": run.started_at,
        "ended_at": run.ended_at,
    }


def _stage_to_dict(stage: JobRunStage) -> dict:
    return {"stage_name": stage.stage_name, "status": stage.status, "duration_ms": stage.duration_ms}


def _failure_to_dict(item: RunFailureDetail) -> dict:
    return {
        "record_id": item.record_id,
        "error_type": item.error_type,
        "category": item.category,
        "node": item.node,
        "detail": item.detail,
        "input_payload": item.input_payload,
        "output_payload": item.output_payload,
        "retry_status": item.retry_status,
        "retry_run_id": item.retry_run_id,
    }


def _failure_detail_with_timeline(db: Session, item: RunFailureDetail) -> dict:
    stages = db.scalars(select(JobRunStage).where(JobRunStage.run_id == item.run_id).order_by(JobRunStage.id)).all()
    timeline = []
    for stage in stages:
        if stage.stage_name == item.node:
            input_payload = item.input_payload or {}
            output_payload = item.output_payload or {}
        else:
            input_payload = {"record_id": item.record_id, "stage": stage.stage_name}
            output_payload = {"status": stage.status}
        timeline.append(
            {
                "stage_name": stage.stage_name,
                "status": stage.status,
                "duration_ms": stage.duration_ms,
                "input_payload": input_payload,
                "output_payload": output_payload,
            }
        )

    result = _failure_to_dict(item)
    result["stage_timeline"] = timeline
    return result


@router.get("", response_model=list[JobConfigOut])
def list_jobs(db: Session = Depends(get_db)) -> list[JobConfigOut]:
    _refresh_jobs(db)
    rows = db.scalars(select(JobConfig).order_by(asc(JobConfig.id))).all()
    return [_to_job_out(row) for row in rows]


@router.post("", response_model=JobConfigOut)
def create_job(payload: JobConfigIn, db: Session = Depends(get_db)) -> JobConfigOut:
    _refresh_jobs(db)

    code_exists = db.scalar(select(JobConfig).where(JobConfig.code == payload.code))
    if code_exists is not None:
        raise HTTPException(status_code=409, detail="job code already exists")

    datasource = db.scalar(select(DataSourceConfig).where(DataSourceConfig.id == payload.datasource_id))
    if datasource is None:
        raise HTTPException(status_code=404, detail="datasource not found")

    row = JobConfig(enabled=True, pipeline_config={}, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_job_out(row)


@router.post("/{job_id}/trigger", response_model=TriggerResponse)
def trigger_job(job_id: int, db: Session = Depends(get_db)) -> TriggerResponse:
    _refresh_runtime(db)
    job = db.scalar(select(JobConfig).where(JobConfig.id == job_id))
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")

    run_id = f"RUN-{uuid4().hex[:10]}"
    now = datetime.utcnow()
    db.add(
        JobRun(
            run_id=run_id,
            job_id=job_id,
            status="running",
            total_input=0,
            success_count=0,
            failed_count=0,
            started_at=now,
            ended_at=None,
        )
    )
    for stage_name in DEFAULT_STAGES:
        db.add(JobRunStage(run_id=run_id, stage_name=stage_name, status="pending", duration_ms=0))
    db.commit()

    run_pipeline_mock(run_id)
    return TriggerResponse(run_id=run_id, status="running")


@router.get("/{job_id}/runs")
def list_job_runs(job_id: int, status: str | None = Query(default=None), db: Session = Depends(get_db)) -> list[dict]:
    _refresh_runtime(db)
    job = db.scalar(select(JobConfig.id).where(JobConfig.id == job_id))
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")

    stmt = select(JobRun).where(JobRun.job_id == job_id)
    if status and status != "all":
        stmt = stmt.where(JobRun.status == status)
    stmt = stmt.order_by(desc(JobRun.started_at))
    rows = db.scalars(stmt).all()
    return [_run_to_dict(row) for row in rows]


@router.get("/runs/{run_id}/stages")
def get_run_stages(run_id: str, db: Session = Depends(get_db)) -> list[dict]:
    _refresh_runtime(db)
    rows = db.scalars(select(JobRunStage).where(JobRunStage.run_id == run_id).order_by(JobRunStage.id)).all()
    return [_stage_to_dict(row) for row in rows]


@router.get("/runs/{run_id}/failures")
def get_run_failures(
    run_id: str,
    category: str | None = Query(default=None),
    node: str | None = Query(default=None),
    error_type: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=200),
    sort_by: str = Query(default="record_id"),
    sort_order: str = Query(default="asc"),
    db: Session = Depends(get_db),
) -> dict:
    _refresh_runtime(db)
    conditions = [RunFailureDetail.run_id == run_id]
    if category and category != "all":
        conditions.append(RunFailureDetail.category == category)
    if node and node != "all":
        conditions.append(RunFailureDetail.node == node)
    if error_type and error_type != "all":
        conditions.append(RunFailureDetail.error_type == error_type)

    sort_map = {
        "record_id": RunFailureDetail.record_id,
        "category": RunFailureDetail.category,
        "node": RunFailureDetail.node,
        "error_type": RunFailureDetail.error_type,
    }
    order_col = sort_map.get(sort_by, RunFailureDetail.record_id)
    order_clause = desc(order_col) if sort_order.lower() == "desc" else asc(order_col)

    total = int(db.scalar(select(func.count()).select_from(RunFailureDetail).where(*conditions)) or 0)
    rows = db.scalars(select(RunFailureDetail).where(*conditions).order_by(order_clause).offset(offset).limit(limit)).all()
    return {"items": [_failure_to_dict(row) for row in rows], "total": total, "offset": offset, "limit": limit}


@router.get("/runs/{run_id}/failures/{record_id}")
def get_run_failure_detail(run_id: str, record_id: str, db: Session = Depends(get_db)) -> dict:
    _refresh_runtime(db)
    row = db.scalar(
        select(RunFailureDetail)
        .where(RunFailureDetail.run_id == run_id, RunFailureDetail.record_id == record_id)
        .order_by(desc(RunFailureDetail.id))
    )
    if row is None:
        raise HTTPException(status_code=404, detail="failure record not found")
    return _failure_detail_with_timeline(db, row)


@router.get("/runs/{run_id}/failure-summary")
def get_run_failure_summary(run_id: str, db: Session = Depends(get_db)) -> dict:
    _refresh_runtime(db)
    rows = db.execute(
        select(RunFailureDetail.category, func.count())
        .where(RunFailureDetail.run_id == run_id)
        .group_by(RunFailureDetail.category)
    ).all()
    by_category = {category: count for category, count in rows}
    total = int(sum(by_category.values()))
    return {"total": total, "by_category": by_category}


@router.get("/runs/{run_id}/failure-node-stats")
def get_run_failure_node_stats(run_id: str, db: Session = Depends(get_db)) -> list[dict]:
    _refresh_runtime(db)
    rows = db.execute(
        select(RunFailureDetail.node, func.count())
        .where(RunFailureDetail.run_id == run_id)
        .group_by(RunFailureDetail.node)
        .order_by(desc(func.count()))
    ).all()
    return [{"node": node, "count": count} for node, count in rows]


@router.post("/runs/{run_id}/retry")
def retry_run(run_id: str, db: Session = Depends(get_db)) -> dict:
    _refresh_runtime(db)
    source_run = db.scalar(select(JobRun).where(JobRun.run_id == run_id))
    if source_run is None:
        raise HTTPException(status_code=404, detail="run not found")

    new_run_id = f"RUN-{uuid4().hex[:10]}"
    now = datetime.utcnow()
    db.add(
        JobRun(
            run_id=new_run_id,
            job_id=source_run.job_id,
            status="running",
            total_input=source_run.total_input,
            success_count=0,
            failed_count=0,
            started_at=now,
            ended_at=None,
        )
    )
    stage_names = db.scalars(select(JobRunStage.stage_name).where(JobRunStage.run_id == run_id).order_by(JobRunStage.id)).all()
    for stage_name in stage_names or DEFAULT_STAGES:
        db.add(JobRunStage(run_id=new_run_id, stage_name=stage_name, status="pending", duration_ms=0))
    db.commit()
    return {"old_run_id": run_id, "new_run_id": new_run_id, "status": "queued"}


@router.post("/runs/{run_id}/failures/{record_id}/retry")
def retry_single_failure(run_id: str, record_id: str, db: Session = Depends(get_db)) -> dict:
    _refresh_runtime(db)
    source_run = db.scalar(select(JobRun).where(JobRun.run_id == run_id))
    if source_run is None:
        raise HTTPException(status_code=404, detail="run not found")

    failure = db.scalar(
        select(RunFailureDetail)
        .where(RunFailureDetail.run_id == run_id, RunFailureDetail.record_id == record_id)
        .order_by(desc(RunFailureDetail.id))
    )
    if failure is None:
        raise HTTPException(status_code=404, detail="failure record not found")

    new_run_id = f"RUN-{uuid4().hex[:10]}"
    now = datetime.utcnow()
    db.add(
        JobRun(
            run_id=new_run_id,
            job_id=source_run.job_id,
            status="running",
            total_input=1,
            success_count=0,
            failed_count=0,
            started_at=now,
            ended_at=None,
        )
    )
    stage_names = db.scalars(select(JobRunStage.stage_name).where(JobRunStage.run_id == run_id).order_by(JobRunStage.id)).all()
    for stage_name in stage_names or DEFAULT_STAGES:
        db.add(JobRunStage(run_id=new_run_id, stage_name=stage_name, status="pending", duration_ms=0))

    failure.retry_status = "queued"
    failure.retry_run_id = new_run_id
    db.commit()
    return {"run_id": run_id, "record_id": record_id, "retry_run_id": new_run_id, "status": "queued"}
