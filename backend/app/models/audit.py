from datetime import datetime

from sqlalchemy import DateTime, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.time_utils import utc_now
from app.db.session import Base


class OperationLog(Base):
    __tablename__ = "operation_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_name: Mapped[str] = mapped_column(String(64), default="system")
    action: Mapped[str] = mapped_column(String(128))
    target_type: Mapped[str] = mapped_column(String(64))
    target_id: Mapped[str] = mapped_column(String(64))
    extra: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class ConfigChangeLog(Base):
    __tablename__ = "config_change_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    config_type: Mapped[str] = mapped_column(String(64))
    config_key: Mapped[str] = mapped_column(String(128))
    before_snapshot: Mapped[str] = mapped_column(Text, default="")
    after_snapshot: Mapped[str] = mapped_column(Text, default="")
    changed_by: Mapped[str] = mapped_column(String(64), default="system")
    changed_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
