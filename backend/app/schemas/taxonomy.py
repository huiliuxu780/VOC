from datetime import datetime
from typing import Any

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


class LabelNodeConfigBase(BaseModel):
    version: str = "v1.0"
    promptName: str = ""
    definition: str = ""
    decisionRule: str = ""
    excludeRule: str = ""
    taggingRule: str = ""
    systemPrompt: str = ""
    userPromptTemplate: str = ""
    outputSchema: str = ""
    postProcessRule: str = ""
    fallbackStrategy: str = ""
    riskNote: str = ""
    remark: str = ""
    modelName: str = ""
    temperature: float = 0.1
    status: str = "draft"


class LabelNodeConfigIn(LabelNodeConfigBase):
    pass


class LabelNodeConfigOut(LabelNodeConfigBase):
    id: str
    labelNodeId: str
    createdAt: datetime
    updatedAt: datetime
    createdBy: str | None = None
    updatedBy: str | None = None


class LabelNodeExampleBase(BaseModel):
    exampleType: str = "positive"
    content: str
    expectedLabel: str = ""
    note: str = ""


class LabelNodeExampleIn(LabelNodeExampleBase):
    pass


class LabelNodeExampleUpdateIn(LabelNodeExampleBase):
    pass


class LabelNodeExampleOut(LabelNodeExampleBase):
    id: str
    labelNodeId: str
    createdAt: datetime
    updatedAt: datetime


class LabelNodeTestIn(BaseModel):
    contentText: str


class LabelNodeTestOut(BaseModel):
    nodeId: str
    rawOutput: str
    parsedOutput: dict
    hitLabel: str
    confidence: float
    latency: int
    errorMessage: str | None = None


class LabelNodeTestRecordOut(LabelNodeTestOut):
    id: str
    inputText: str
    createdAt: datetime


class LabelNodeConfigVersionOut(BaseModel):
    id: str
    labelNodeId: str
    configId: str
    configVersion: str
    status: str
    snapshot: dict
    createdAt: datetime


class LabelNodeConfigDiffItem(BaseModel):
    field: str
    fromValue: Any
    toValue: Any


class LabelNodeConfigVersionDiffOut(BaseModel):
    fromVersionId: str
    toVersionId: str
    changes: list[LabelNodeConfigDiffItem] = Field(default_factory=list)


class LabelNodeTestRecordPageOut(BaseModel):
    items: list[LabelNodeTestRecordOut]
    total: int
    offset: int
    limit: int
    hasMore: bool
