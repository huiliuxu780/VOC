from pydantic import BaseModel, Field


class LabelNodeBase(BaseModel):
    category_id: int
    parent_id: int | None = None
    level: int = Field(ge=1, le=4)
    name: str
    code: str
    is_leaf: bool = False
    llm_enabled: bool = True
    default_prompt_version: str = "v1"


class LabelNodeIn(LabelNodeBase):
    pass


class LabelNodeOut(LabelNodeBase):
    id: int


class LabelMoveIn(BaseModel):
    parent_id: int | None = None
