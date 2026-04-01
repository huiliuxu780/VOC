from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import asc, func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.config import ModelConfig
from app.schemas.settings import ModelConfigBulkUpdate, ModelConfigItem

router = APIRouter()

_SEED_MODELS = [
    {"model_key": "gpt-4.1-mini", "model_vendor": "openai", "model_version": "2026-01", "enabled": True},
    {"model_key": "deepseek-v3", "model_vendor": "deepseek", "model_version": "v3", "enabled": True},
    {"model_key": "qwen-max-v1", "model_vendor": "qwen", "model_version": "v1", "enabled": True},
]


def _seed_models_if_empty(db: Session) -> None:
    count = int(db.scalar(select(func.count()).select_from(ModelConfig)) or 0)
    if count > 0:
        return
    for item in _SEED_MODELS:
        db.add(ModelConfig(**item))
    db.commit()


def _refresh_models(db: Session) -> None:
    _seed_models_if_empty(db)


def _to_out(item: ModelConfig) -> ModelConfigItem:
    return ModelConfigItem(
        id=item.id,
        model_key=item.model_key,
        model_vendor=item.model_vendor,
        model_version=item.model_version,
        enabled=item.enabled,
    )


@router.get("/models", response_model=list[ModelConfigItem])
def list_model_configs(db: Session = Depends(get_db)) -> list[ModelConfigItem]:
    _refresh_models(db)
    rows = db.scalars(select(ModelConfig).order_by(asc(ModelConfig.id))).all()
    return [_to_out(row) for row in rows]


@router.put("/models", response_model=list[ModelConfigItem])
def update_model_configs(payload: ModelConfigBulkUpdate, db: Session = Depends(get_db)) -> list[ModelConfigItem]:
    _refresh_models(db)
    keys = [item.model_key for item in payload.items]
    if len(keys) != len(set(keys)):
        raise HTTPException(status_code=422, detail="duplicate model_key in payload")

    existing_rows = db.scalars(select(ModelConfig)).all()
    existing_by_key = {item.model_key: item for item in existing_rows}

    for item in payload.items:
        row = existing_by_key.get(item.model_key)
        if row is None:
            db.add(ModelConfig(**item.model_dump()))
            continue
        row.model_vendor = item.model_vendor
        row.model_version = item.model_version
        row.enabled = item.enabled

    db.commit()
    rows = db.scalars(select(ModelConfig).order_by(asc(ModelConfig.id))).all()
    return [_to_out(row) for row in rows]
