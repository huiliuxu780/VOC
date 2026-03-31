from datetime import datetime

from sqlalchemy import DateTime, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class JobRun(Base):
    __tablename__ = "job_run"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_id: Mapped[str] = mapped_column(String(64), unique=True)
    job_id: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    total_input: Mapped[int] = mapped_column(Integer, default=0)
    success_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class JobRunStage(Base):
    __tablename__ = "job_run_stage"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_id: Mapped[str] = mapped_column(String(64))
    stage_name: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), default="pending")
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)


class IngestRecord(Base):
    __tablename__ = "ingest_record"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_id: Mapped[str] = mapped_column(String(64))
    datasource_id: Mapped[int] = mapped_column(Integer)
    raw_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    mapping_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(32), default="success")
    error_reason: Mapped[str] = mapped_column(String(255), default="")


class AnalysisRecord(Base):
    __tablename__ = "analysis_record"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_id: Mapped[str] = mapped_column(String(64))
    record_key: Mapped[str] = mapped_column(String(128))
    label_result: Mapped[dict] = mapped_column(JSON, default=dict)
    sentiment_result: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(32), default="success")


class AnalysisStageDetail(Base):
    __tablename__ = "analysis_stage_detail"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_record_id: Mapped[int] = mapped_column(Integer)
    stage_name: Mapped[str] = mapped_column(String(64))
    input_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    output_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(32), default="success")
    error_detail: Mapped[str] = mapped_column(Text, default="")


class OutputRecord(Base):
    __tablename__ = "output_record"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_id: Mapped[str] = mapped_column(String(64))
    output_type: Mapped[str] = mapped_column(String(32), default="table")
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(32), default="success")


class RunFailureDetail(Base):
    __tablename__ = "run_failure_detail"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_id: Mapped[str] = mapped_column(String(64))
    record_id: Mapped[str] = mapped_column(String(128))
    category: Mapped[str] = mapped_column(String(32), default="system_error")
    node: Mapped[str] = mapped_column(String(64), default="unknown")
    error_type: Mapped[str] = mapped_column(String(64), default="unknown")
    detail: Mapped[str] = mapped_column(Text, default="")
    input_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    output_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    retry_status: Mapped[str] = mapped_column(String(32), default="none")
    retry_run_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
