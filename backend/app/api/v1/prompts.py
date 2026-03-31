from fastapi import APIRouter

from app.schemas.prompt import PromptConfigIn, PromptConfigOut

router = APIRouter()
_prompts: list[PromptConfigOut] = [
    PromptConfigOut(
        id=1,
        label_node_id=3,
        name="安装失败判定 Prompt",
        version="v3.1",
        status="published",
        system_prompt="你是 VOC 标签判定专家。",
        user_prompt_template="输入：{{content_text}}",
    )
]


@router.get("", response_model=list[PromptConfigOut])
def list_prompts() -> list[PromptConfigOut]:
    return _prompts


@router.post("", response_model=PromptConfigOut)
def create_prompt(payload: PromptConfigIn) -> PromptConfigOut:
    item = PromptConfigOut(id=len(_prompts) + 1, status="draft", **payload.model_dump())
    _prompts.append(item)
    return item


@router.post("/{prompt_id}/publish")
def publish_prompt(prompt_id: int) -> dict:
    return {"prompt_id": prompt_id, "status": "published"}


@router.post("/{prompt_id}/test")
def test_prompt(prompt_id: int, sample: dict) -> dict:
    return {
        "prompt_id": prompt_id,
        "input": sample,
        "output": {"label": "预约安装超时", "score": 0.88},
    }
