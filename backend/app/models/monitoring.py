from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.time_utils import utc_now
from app.db.session import Base


class ModelUsageStats(Base):
    __tablename__ = "model_usage_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    model_key: Mapped[str] = mapped_column(String(64))
    calls: Mapped[int] = mapped_column(Integer, default=0)
    token_used: Mapped[int] = mapped_column(Integer, default=0)
    avg_latency_ms: Mapped[float] = mapped_column(Float, default=0)
    error_rate: Mapped[float] = mapped_column(Float, default=0)
    snapshot_time: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class DataSourceStats(Base):
    __tablename__ = "datasource_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    datasource_id: Mapped[int] = mapped_column(Integer)
    success_rate: Mapped[float] = mapped_column(Float, default=1)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    throughput: Mapped[int] = mapped_column(Integer, default=0)
    snapshot_time: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class QueueHealthStats(Base):
    __tablename__ = "queue_health_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    queue_name: Mapped[str] = mapped_column(String(128))
    backlog: Mapped[int] = mapped_column(Integer, default=0)
    consumer_lag: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(16), default="healthy")


class ApiHealthStats(Base):
    __tablename__ = "api_health_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    api_name: Mapped[str] = mapped_column(String(128))
    success_rate: Mapped[float] = mapped_column(Float, default=1)
    p95_latency_ms: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(16), default="healthy")


class AlertRecord(Base):
    __tablename__ = "alert_record"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    alert_type: Mapped[str] = mapped_column(String(32))
    severity: Mapped[str] = mapped_column(String(8), default="P3")
    detail: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(16), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
