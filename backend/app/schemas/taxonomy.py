from datetime import datetime

from pydantic import BaseModel, Field


class LabelTaxonomyBase(BaseModel):
    name: str
    code: str
    description: str = ""
    businessScope: list[str] = Field(default_factory=list)
    categoryScope: list[str] = Field(default_factory=list)
    owner: str = ""
    status: str = "draft"


class LabelTaxonomyIn(LabelTaxonomyBase):
    pass


class LabelTaxonomyOut(LabelTaxonomyBase):
    id: str
    currentVersionId: str | None = None
    nodeCount: int | None = 0
    createdAt: datetime
    updatedAt: datetime
    createdBy: str | None = None
    updatedBy: str | None = None


class LabelTaxonomyVersionOut(BaseModel):
    id: str
    taxonomyId: str
    version: str
    status: str
    changeLog: str = ""
    nodeCount: int = 0
    publishedAt: datetime | None = None
    createdAt: datetime
    updatedAt: datetime
    createdBy: str | None = None
    updatedBy: str | None = None


class LabelTaxonomyNodeOut(BaseModel):
    id: str
    taxonomyVersionId: str
    parentId: str | None = None
    name: str
    code: str
    level: int
    pathNames: list[str] = Field(default_factory=list)
    pathIds: list[str] = Field(default_factory=list)
    isLeaf: bool
    llmEnabled: bool
    sortOrder: int
    status: str
    categoryScope: list[str] = Field(default_factory=list)
    businessScope: list[str] = Field(default_factory=list)
    remark: str = ""
    hasConfig: bool = False
    hasExamples: bool = False
    configStatus: str = "empty"
    createdAt: datetime
    updatedAt: datetime
