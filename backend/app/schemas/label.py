from pydantic import BaseModel


class LabelNodeIn(BaseModel):
    category_id: int
    parent_id: int | None = None
    level: int
    name: str
    code: str


class LabelNodeOut(LabelNodeIn):
    id: int
