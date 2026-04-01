from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import asc, func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.config import LabelCategory, LabelNode
from app.schemas.label import LabelMoveIn, LabelNodeIn, LabelNodeOut

router = APIRouter()


def _seed_labels_if_empty(db: Session) -> None:
    count = int(db.scalar(select(func.count()).select_from(LabelNode)) or 0)
    if count > 0:
        return

    category = db.scalar(select(LabelCategory).where(LabelCategory.name == "VOC Primary Labels"))
    if category is None:
        category = LabelCategory(name="VOC Primary Labels", description="Default category for MVP seeds")
        db.add(category)
        db.commit()
        db.refresh(category)

    l1 = LabelNode(
        category_id=category.id,
        parent_id=None,
        level=1,
        name="产品问题",
        code="L1_PRODUCT",
        is_leaf=False,
        llm_enabled=True,
        default_prompt_version="v1",
    )
    db.add(l1)
    db.flush()

    l2 = LabelNode(
        category_id=category.id,
        parent_id=l1.id,
        level=2,
        name="安装问题",
        code="L2_INSTALL",
        is_leaf=False,
        llm_enabled=True,
        default_prompt_version="v3.1",
    )
    db.add(l2)
    db.flush()

    l3 = LabelNode(
        category_id=category.id,
        parent_id=l2.id,
        level=3,
        name="安装失败",
        code="L3_INSTALL_FAIL",
        is_leaf=True,
        llm_enabled=True,
        default_prompt_version="v3.1",
    )
    db.add(l3)
    db.commit()


def _refresh_labels(db: Session) -> None:
    _seed_labels_if_empty(db)


def _to_out(item: LabelNode) -> LabelNodeOut:
    return LabelNodeOut(
        id=item.id,
        category_id=item.category_id,
        parent_id=item.parent_id,
        level=item.level,
        name=item.name,
        code=item.code,
        is_leaf=item.is_leaf,
        llm_enabled=item.llm_enabled,
        default_prompt_version=item.default_prompt_version,
    )


def _validate_parent_level(db: Session, payload: LabelNodeIn) -> None:
    if payload.parent_id is None:
        if payload.level != 1:
            raise HTTPException(status_code=422, detail="root label must have level=1")
        return

    parent = db.scalar(select(LabelNode).where(LabelNode.id == payload.parent_id))
    if parent is None:
        raise HTTPException(status_code=404, detail="parent label not found")
    if parent.category_id != payload.category_id:
        raise HTTPException(status_code=422, detail="parent category mismatch")
    expected_level = parent.level + 1
    if payload.level != expected_level:
        raise HTTPException(status_code=422, detail=f"child level should be {expected_level}")


def _validate_code_unique(db: Session, code: str, exclude_id: int | None = None) -> None:
    stmt = select(LabelNode).where(LabelNode.code == code)
    if exclude_id is not None:
        stmt = stmt.where(LabelNode.id != exclude_id)
    exists = db.scalar(stmt)
    if exists is not None:
        raise HTTPException(status_code=409, detail="label code already exists")


@router.get("/tree", response_model=list[LabelNodeOut])
def get_label_tree(db: Session = Depends(get_db)) -> list[LabelNodeOut]:
    _refresh_labels(db)
    rows = db.scalars(select(LabelNode).order_by(asc(LabelNode.level), asc(LabelNode.id))).all()
    return [_to_out(item) for item in rows]


@router.get("/{label_id}", response_model=LabelNodeOut)
def get_label(label_id: int, db: Session = Depends(get_db)) -> LabelNodeOut:
    _refresh_labels(db)
    row = db.scalar(select(LabelNode).where(LabelNode.id == label_id))
    if row is None:
        raise HTTPException(status_code=404, detail="label not found")
    return _to_out(row)


@router.post("", response_model=LabelNodeOut)
def create_label(payload: LabelNodeIn, db: Session = Depends(get_db)) -> LabelNodeOut:
    _refresh_labels(db)
    _validate_parent_level(db, payload)
    _validate_code_unique(db, payload.code)

    item = LabelNode(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return _to_out(item)


@router.put("/{label_id}", response_model=LabelNodeOut)
def update_label(label_id: int, payload: LabelNodeIn, db: Session = Depends(get_db)) -> LabelNodeOut:
    _refresh_labels(db)
    row = db.scalar(select(LabelNode).where(LabelNode.id == label_id))
    if row is None:
        raise HTTPException(status_code=404, detail="label not found")

    _validate_parent_level(db, payload)
    _validate_code_unique(db, payload.code, exclude_id=label_id)

    row.category_id = payload.category_id
    row.parent_id = payload.parent_id
    row.level = payload.level
    row.name = payload.name
    row.code = payload.code
    row.is_leaf = payload.is_leaf
    row.llm_enabled = payload.llm_enabled
    row.default_prompt_version = payload.default_prompt_version
    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.post("/{label_id}/move", response_model=LabelNodeOut)
def move_label(label_id: int, payload: LabelMoveIn, db: Session = Depends(get_db)) -> LabelNodeOut:
    _refresh_labels(db)
    row = db.scalar(select(LabelNode).where(LabelNode.id == label_id))
    if row is None:
        raise HTTPException(status_code=404, detail="label not found")

    if payload.parent_id == label_id:
        raise HTTPException(status_code=422, detail="label cannot be parent of itself")

    if payload.parent_id is None:
        row.parent_id = None
        row.level = 1
    else:
        parent = db.scalar(select(LabelNode).where(LabelNode.id == payload.parent_id))
        if parent is None:
            raise HTTPException(status_code=404, detail="target parent not found")
        if parent.category_id != row.category_id:
            raise HTTPException(status_code=422, detail="parent category mismatch")
        row.parent_id = parent.id
        row.level = parent.level + 1

    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.delete("/{label_id}")
def delete_label(label_id: int, db: Session = Depends(get_db)) -> dict:
    _refresh_labels(db)
    row = db.scalar(select(LabelNode).where(LabelNode.id == label_id))
    if row is None:
        raise HTTPException(status_code=404, detail="label not found")

    has_children = db.scalar(select(func.count()).select_from(LabelNode).where(LabelNode.parent_id == label_id)) or 0
    if int(has_children) > 0:
        raise HTTPException(status_code=409, detail="cannot delete label with children")

    db.delete(row)
    db.commit()
    return {"label_id": label_id, "status": "deleted"}
