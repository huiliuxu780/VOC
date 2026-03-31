from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    total_processed: int
    model_success_rate: float
    queue_backlog: int
    open_alerts: int
