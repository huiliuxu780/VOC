from fastapi import APIRouter

from app.schemas.label import LabelNodeIn, LabelNodeOut

router = APIRouter()
_labels: list[LabelNodeOut] = [
    LabelNodeOut(id=1, category_id=1, parent_id=None, level=1, name="产品问题", code="L1_PRODUCT"),
    LabelNodeOut(id=2, category_id=1, parent_id=1, level=2, name="安装问题", code="L2_INSTALL"),
    LabelNodeOut(id=3, category_id=1, parent_id=2, level=3, name="安装失败", code="L3_INSTALL_FAIL"),
]


@router.get("/tree", response_model=list[LabelNodeOut])
def get_label_tree() -> list[LabelNodeOut]:
    return _labels


@router.post("", response_model=LabelNodeOut)
def create_label(payload: LabelNodeIn) -> LabelNodeOut:
    item = LabelNodeOut(id=len(_labels) + 1, **payload.model_dump())
    _labels.append(item)
    return item


@router.put("/{label_id}", response_model=LabelNodeOut)
def update_label(label_id: int, payload: LabelNodeIn) -> LabelNodeOut:
    for idx, node in enumerate(_labels):
        if node.id == label_id:
            _labels[idx] = LabelNodeOut(id=label_id, **payload.model_dump())
            return _labels[idx]
    return LabelNodeOut(id=label_id, **payload.model_dump())
