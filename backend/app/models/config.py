from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, JSON, String, Text
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


class LabelTaxonomy(Base):
    __tablename__ = "label_taxonomy"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    code: Mapped[str] = mapped_column(String(64), unique=True)
    description: Mapped[str] = mapped_column(Text, default="")
    business_scope: Mapped[list[str]] = mapped_column(JSON, default=list)
    category_scope: Mapped[list[str]] = mapped_column(JSON, default=list)
    owner: Mapped[str] = mapped_column(String(64), default="")
    status: Mapped[str] = mapped_column(String(16), default="draft")
    current_version_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    node_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    created_by: Mapped[str] = mapped_column(String(64), default="system")
    updated_by: Mapped[str] = mapped_column(String(64), default="system")


class LabelTaxonomyVersion(Base):
    __tablename__ = "label_taxonomy_version"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    taxonomy_id: Mapped[str] = mapped_column(String(64), index=True)
    version: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(16), default="draft")
    change_log: Mapped[str] = mapped_column(Text, default="")
    node_count: Mapped[int] = mapped_column(Integer, default=0)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    created_by: Mapped[str] = mapped_column(String(64), default="system")
    updated_by: Mapped[str] = mapped_column(String(64), default="system")


class LabelTaxonomyNode(Base):
    __tablename__ = "label_taxonomy_node"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    taxonomy_version_id: Mapped[str] = mapped_column(String(64), index=True)
    parent_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    name: Mapped[str] = mapped_column(String(128))
    code: Mapped[str] = mapped_column(String(64))
    level: Mapped[int] = mapped_column(Integer, default=1)
    path_names: Mapped[list[str]] = mapped_column(JSON, default=list)
    path_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    is_leaf: Mapped[bool] = mapped_column(Boolean, default=False)
    llm_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(16), default="enabled")
    category_scope: Mapped[list[str]] = mapped_column(JSON, default=list)
    business_scope: Mapped[list[str]] = mapped_column(JSON, default=list)
    remark: Mapped[str] = mapped_column(Text, default="")
    has_config: Mapped[bool] = mapped_column(Boolean, default=False)
    has_examples: Mapped[bool] = mapped_column(Boolean, default=False)
    config_status: Mapped[str] = mapped_column(String(16), default="empty")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class LabelTaxonomyNodeConfig(Base):
    __tablename__ = "label_taxonomy_node_config"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    label_node_id: Mapped[str] = mapped_column(String(64), index=True)
    version: Mapped[str] = mapped_column(String(32), default="v1.0")
    prompt_name: Mapped[str] = mapped_column(String(128), default="")
    definition: Mapped[str] = mapped_column(Text, default="")
    decision_rule: Mapped[str] = mapped_column(Text, default="")
    exclude_rule: Mapped[str] = mapped_column(Text, default="")
    tagging_rule: Mapped[str] = mapped_column(Text, default="")
    system_prompt: Mapped[str] = mapped_column(Text, default="")
    user_prompt_template: Mapped[str] = mapped_column(Text, default="")
    output_schema: Mapped[str] = mapped_column(Text, default="")
    post_process_rule: Mapped[str] = mapped_column(Text, default="")
    fallback_strategy: Mapped[str] = mapped_column(Text, default="")
    risk_note: Mapped[str] = mapped_column(Text, default="")
    remark: Mapped[str] = mapped_column(Text, default="")
    model_name: Mapped[str] = mapped_column(String(64), default="")
    temperature: Mapped[float] = mapped_column(Float, default=0.1)
    status: Mapped[str] = mapped_column(String(16), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    created_by: Mapped[str] = mapped_column(String(64), default="system")
    updated_by: Mapped[str] = mapped_column(String(64), default="system")


class LabelTaxonomyNodeExample(Base):
    __tablename__ = "label_taxonomy_node_example"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    label_node_id: Mapped[str] = mapped_column(String(64), index=True)
    example_type: Mapped[str] = mapped_column(String(16), default="positive")
    content: Mapped[str] = mapped_column(Text, default="")
    expected_label: Mapped[str] = mapped_column(String(64), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class LabelTaxonomyNodeConfigVersion(Base):
    __tablename__ = "label_taxonomy_node_config_version"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    label_node_id: Mapped[str] = mapped_column(String(64), index=True)
    config_id: Mapped[str] = mapped_column(String(64), index=True)
    config_version: Mapped[str] = mapped_column(String(32), default="v1.0")
    status: Mapped[str] = mapped_column(String(16), default="draft")
    snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class LabelTaxonomyNodeTestRecord(Base):
    __tablename__ = "label_taxonomy_node_test_record"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    label_node_id: Mapped[str] = mapped_column(String(64), index=True)
    input_text: Mapped[str] = mapped_column(Text, default="")
    raw_output: Mapped[str] = mapped_column(Text, default="")
    parsed_output: Mapped[dict] = mapped_column(JSON, default=dict)
    hit_label: Mapped[str] = mapped_column(String(64), default="")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    latency: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


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
