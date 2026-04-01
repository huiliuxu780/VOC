from pydantic import BaseModel


class PromptConfigIn(BaseModel):
    label_node_id: int
    name: str
    version: str
    system_prompt: str
    user_prompt_template: str


class PromptConfigOut(PromptConfigIn):
    id: int
    status: str


class PromptConfigUpdate(BaseModel):
    label_node_id: int
    name: str
    version: str
    status: str
    system_prompt: str
    user_prompt_template: str
