from pydantic import BaseModel


class JobConfigIn(BaseModel):
    name: str
    code: str
    job_type: str
    datasource_id: int
    schedule_expr: str = "manual"
    output_type: str = "table"


class JobConfigOut(JobConfigIn):
    id: int
    enabled: bool


class TriggerResponse(BaseModel):
    run_id: str
    status: str


class PipelineNodeConfig(BaseModel):
    key: str
    enabled: bool
    model: str
    prompt_version: str


class JobPipelineConfigOut(BaseModel):
    job_id: int
    nodes: list[PipelineNodeConfig]


class JobPipelineConfigUpdate(BaseModel):
    nodes: list[PipelineNodeConfig]
