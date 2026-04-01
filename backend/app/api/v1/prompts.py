from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.config import PromptConfig
from app.schemas.prompt import PromptConfigIn, PromptConfigOut, PromptConfigUpdate

router = APIRouter()


def _seed_prompts_if_empty(db: Session) -> None:
    count = int(db.scalar(select(func.count()).select_from(PromptConfig)) or 0)
    if count > 0:
        return

    db.add(
        PromptConfig(
            label_node_id=3,
            name="安装失败判定 Prompt",
            version="v3.1",
            status="published",
            system_prompt="你是 VOC 标签判定专家，请根据标签定义输出结构化 JSON。",
            user_prompt_template="输入文本：{{content_text}}",
            output_schema={"label": "string", "score": "float", "reason": "string"},
        )
    )
    db.commit()


def _refresh_prompts(db: Session) -> None:
    _seed_prompts_if_empty(db)


def _to_prompt_out(item: PromptConfig) -> PromptConfigOut:
    return PromptConfigOut(
        id=item.id,
        label_node_id=item.label_node_id,
        name=item.name,
        version=item.version,
        status=item.status,
        system_prompt=item.system_prompt,
        user_prompt_template=item.user_prompt_template,
    )


def _extract_text(sample: dict) -> str:
    value = sample.get("content_text")
    if isinstance(value, str):
        return value
    value = sample.get("msg")
    if isinstance(value, str):
        return value
    return str(sample)


@router.get("", response_model=list[PromptConfigOut])
def list_prompts(
    status: str = Query(default="all"),
    label_node_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[PromptConfigOut]:
    _refresh_prompts(db)
    stmt = select(PromptConfig)
    if status != "all":
        stmt = stmt.where(PromptConfig.status == status)
    if label_node_id is not None:
        stmt = stmt.where(PromptConfig.label_node_id == label_node_id)
    rows = db.scalars(stmt.order_by(desc(PromptConfig.id))).all()
    return [_to_prompt_out(row) for row in rows]


@router.get("/{prompt_id}", response_model=PromptConfigOut)
def get_prompt(prompt_id: int, db: Session = Depends(get_db)) -> PromptConfigOut:
    _refresh_prompts(db)
    row = db.scalar(select(PromptConfig).where(PromptConfig.id == prompt_id))
    if row is None:
        raise HTTPException(status_code=404, detail="prompt not found")
    return _to_prompt_out(row)


@router.post("", response_model=PromptConfigOut)
def create_prompt(payload: PromptConfigIn, db: Session = Depends(get_db)) -> PromptConfigOut:
    _refresh_prompts(db)
    exists = db.scalar(
        select(PromptConfig).where(
            PromptConfig.label_node_id == payload.label_node_id,
            PromptConfig.version == payload.version,
        )
    )
    if exists is not None:
        raise HTTPException(status_code=409, detail="prompt version already exists for current label")

    row = PromptConfig(status="draft", output_schema={"label": "string", "score": "float"}, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_prompt_out(row)


@router.put("/{prompt_id}", response_model=PromptConfigOut)
def update_prompt(prompt_id: int, payload: PromptConfigUpdate, db: Session = Depends(get_db)) -> PromptConfigOut:
    _refresh_prompts(db)
    row = db.scalar(select(PromptConfig).where(PromptConfig.id == prompt_id))
    if row is None:
        raise HTTPException(status_code=404, detail="prompt not found")

    row.label_node_id = payload.label_node_id
    row.name = payload.name
    row.version = payload.version
    row.status = payload.status
    row.system_prompt = payload.system_prompt
    row.user_prompt_template = payload.user_prompt_template
    db.commit()
    db.refresh(row)
    return _to_prompt_out(row)


@router.post("/{prompt_id}/publish")
def publish_prompt(prompt_id: int, db: Session = Depends(get_db)) -> dict:
    _refresh_prompts(db)
    row = db.scalar(select(PromptConfig).where(PromptConfig.id == prompt_id))
    if row is None:
        raise HTTPException(status_code=404, detail="prompt not found")
    row.status = "published"
    db.commit()
    return {"prompt_id": prompt_id, "status": "published"}


@router.post("/{prompt_id}/test")
def test_prompt(prompt_id: int, sample: dict, db: Session = Depends(get_db)) -> dict:
    _refresh_prompts(db)
    row = db.scalar(select(PromptConfig).where(PromptConfig.id == prompt_id))
    if row is None:
        raise HTTPException(status_code=404, detail="prompt not found")

    text = _extract_text(sample)
    lower_text = text.lower()
    if "超时" in text or "timeout" in lower_text:
        output = {"label": "预约安装超时", "score": 0.91, "reason": "Matched timeout intent"}
    elif "安装" in text:
        output = {"label": "安装失败", "score": 0.84, "reason": "Matched install keyword"}
    else:
        output = {"label": "无关反馈", "score": 0.63, "reason": "No strong install signal"}

    return {
        "prompt_id": prompt_id,
        "prompt_name": row.name,
        "prompt_version": row.version,
        "input": sample,
        "output": output,
    }
