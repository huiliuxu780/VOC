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
