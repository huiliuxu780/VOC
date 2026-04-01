from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.time_utils import utc_now
from app.db.session import Base


class DataSourceConfig(Base):
    __tablename__ = "datasource_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128), unique=True)
    code: Mapped[str] = mapped_column(String(64), unique=True)
    source_type: Mapped[str] = mapped_column(String(32))
    owner: Mapped[str] = mapped_column(String(64), default="unknown")
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    extra_config: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class DataSourceMappingConfig(Base):
    __tablename__ = "datasource_mapping_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    datasource_id: Mapped[int] = mapped_column(Integer)
    version: Mapped[str] = mapped_column(String(32), default="v1")
    mapping_rules: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class InternalFieldDefinition(Base):
    __tablename__ = "internal_field_definition"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    field_name: Mapped[str] = mapped_column(String(64), unique=True)
    field_desc: Mapped[str] = mapped_column(String(255), default="")


class LabelCategory(Base):
    __tablename__ = "label_category"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True)
    description: Mapped[str] = mapped_column(String(255), default="")


class LabelNode(Base):
    __tablename__ = "label_node"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category_id: Mapped[int] = mapped_column(Integer)
    parent_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    level: Mapped[int] = mapped_column(Integer)
    name: Mapped[str] = mapped_column(String(128))
    code: Mapped[str] = mapped_column(String(64), unique=True)
    is_leaf: Mapped[bool] = mapped_column(Boolean, default=False)
    llm_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    default_prompt_version: Mapped[str] = mapped_column(String(32), default="v1")


class PromptConfig(Base):
    __tablename__ = "prompt_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    label_node_id: Mapped[int] = mapped_column(Integer)
    name: Mapped[str] = mapped_column(String(128))
    version: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(16), default="draft")
    system_prompt: Mapped[str] = mapped_column(Text)
    user_prompt_template: Mapped[str] = mapped_column(Text)
    output_schema: Mapped[dict] = mapped_column(JSON, default=dict)


class PromptExample(Base):
    __tablename__ = "prompt_example"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    prompt_id: Mapped[int] = mapped_column(Integer)
    example_type: Mapped[str] = mapped_column(String(16))
    content: Mapped[str] = mapped_column(Text)


class ModelConfig(Base):
    __tablename__ = "model_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    model_key: Mapped[str] = mapped_column(String(64), unique=True)
    model_vendor: Mapped[str] = mapped_column(String(32))
    model_version: Mapped[str] = mapped_column(String(32))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class PipelineTemplate(Base):
    __tablename__ = "pipeline_template"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128), unique=True)
    node_configs: Mapped[dict] = mapped_column(JSON, default=dict)


class JobConfig(Base):
    __tablename__ = "job_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    code: Mapped[str] = mapped_column(String(64), unique=True)
    job_type: Mapped[str] = mapped_column(String(32))
    datasource_id: Mapped[int] = mapped_column(Integer)
    schedule_expr: Mapped[str] = mapped_column(String(64), default="manual")
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    output_type: Mapped[str] = mapped_column(String(16), default="table")
    pipeline_config: Mapped[dict] = mapped_column(JSON, default=dict)
