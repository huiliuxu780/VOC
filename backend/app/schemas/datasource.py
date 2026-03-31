from pydantic import BaseModel, Field


class DataSourceBase(BaseModel):
    name: str = Field(..., max_length=128)
    code: str = Field(..., max_length=64)
    source_type: str
    owner: str = "unknown"
    enabled: bool = True


class DataSourceCreate(DataSourceBase):
    extra_config: dict = {}


class DataSourceOut(DataSourceBase):
    id: int


class MappingPreviewRequest(BaseModel):
    sample_payload: dict
    mapping_rules: dict
