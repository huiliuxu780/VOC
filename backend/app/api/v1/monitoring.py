from fastapi import APIRouter

from app.schemas.monitoring import DashboardMetrics

router = APIRouter()


@router.get("/dashboard", response_model=DashboardMetrics)
def dashboard_metrics() -> DashboardMetrics:
    return DashboardMetrics(
        total_processed=128420,
        model_success_rate=0.976,
        queue_backlog=1294,
        open_alerts=7,
    )


@router.get("/datasources")
def datasource_metrics() -> list[dict]:
    return [
        {"datasource": "HTTP-评论", "success_rate": 0.984, "latency_ms": 330},
        {"datasource": "Kafka-热线", "success_rate": 0.973, "latency_ms": 210},
    ]


@router.get("/models")
def model_metrics() -> list[dict]:
    return [
        {"model": "gpt-4.1-mini", "calls": 42210, "avg_latency_ms": 1240, "error_rate": 0.019},
        {"model": "deepseek-v3", "calls": 12904, "avg_latency_ms": 920, "error_rate": 0.023},
    ]


@router.get("/alerts")
def alert_records() -> list[dict]:
    return [
        {"severity": "P1", "type": "queue_backlog", "status": "open"},
        {"severity": "P2", "type": "model_error_rate", "status": "ack"},
    ]
