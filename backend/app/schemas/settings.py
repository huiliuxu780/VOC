from pydantic import BaseModel, Field


class ModelConfigItem(BaseModel):
    id: int
    model_key: str
    model_vendor: str
    model_version: str
    enabled: bool


class ModelConfigUpdateItem(BaseModel):
    model_key: str = Field(..., min_length=1, max_length=64)
    model_vendor: str = Field(..., min_length=1, max_length=32)
    model_version: str = Field(..., min_length=1, max_length=32)
    enabled: bool = True


class ModelConfigBulkUpdate(BaseModel):
    items: list[ModelConfigUpdateItem]
