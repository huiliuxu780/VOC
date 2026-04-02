from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import asc, desc, func, select
from sqlalchemy.orm import Session

from app.core.time_utils import utc_now
from app.db.session import get_db
from app.models.config import LabelTaxonomy, LabelTaxonomyNode, LabelTaxonomyVersion
from app.schemas.taxonomy import LabelTaxonomyIn, LabelTaxonomyNodeOut, LabelTaxonomyOut, LabelTaxonomyVersionOut

router = APIRouter()


def _to_taxonomy_out(item: LabelTaxonomy) -> LabelTaxonomyOut:
    return LabelTaxonomyOut(
        id=item.id,
        name=item.name,
        code=item.code,
        description=item.description,
        businessScope=item.business_scope or [],
        categoryScope=item.category_scope or [],
        owner=item.owner,
        status=item.status,
        currentVersionId=item.current_version_id,
        nodeCount=item.node_count,
        createdAt=item.created_at,
        updatedAt=item.updated_at,
        createdBy=item.created_by,
        updatedBy=item.updated_by,
    )


def _to_version_out(item: LabelTaxonomyVersion) -> LabelTaxonomyVersionOut:
    return LabelTaxonomyVersionOut(
        id=item.id,
        taxonomyId=item.taxonomy_id,
        version=item.version,
        status=item.status,
        changeLog=item.change_log,
        nodeCount=item.node_count,
        publishedAt=item.published_at,
        createdAt=item.created_at,
        updatedAt=item.updated_at,
        createdBy=item.created_by,
        updatedBy=item.updated_by,
    )


def _to_node_out(item: LabelTaxonomyNode) -> LabelTaxonomyNodeOut:
    return LabelTaxonomyNodeOut(
        id=item.id,
        taxonomyVersionId=item.taxonomy_version_id,
        parentId=item.parent_id,
        name=item.name,
        code=item.code,
        level=item.level,
        pathNames=item.path_names or [],
        pathIds=item.path_ids or [],
        isLeaf=item.is_leaf,
        llmEnabled=item.llm_enabled,
        sortOrder=item.sort_order,
        status=item.status,
        categoryScope=item.category_scope or [],
        businessScope=item.business_scope or [],
        remark=item.remark,
        hasConfig=item.has_config,
        hasExamples=item.has_examples,
        configStatus=item.config_status,
        createdAt=item.created_at,
        updatedAt=item.updated_at,
    )


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:12]}"


def _validate_taxonomy_status(status: str) -> None:
    if status not in {"draft", "published", "archived"}:
        raise HTTPException(status_code=422, detail="invalid taxonomy status")


def _validate_taxonomy_code(code: str) -> None:
    if not code:
        raise HTTPException(status_code=422, detail="taxonomy code required")
    if not all(ch.isalnum() or ch in {"_", "-"} for ch in code):
        raise HTTPException(status_code=422, detail="taxonomy code only allows letters/numbers/_/-")


def _validate_unique_code(db: Session, code: str, exclude_id: str | None = None) -> None:
    stmt = select(LabelTaxonomy).where(LabelTaxonomy.code == code)
    if exclude_id is not None:
        stmt = stmt.where(LabelTaxonomy.id != exclude_id)
    exists = db.scalar(stmt)
    if exists is not None:
        raise HTTPException(status_code=409, detail="taxonomy code already exists")


def _seed_taxonomies_if_empty(db: Session) -> None:
    count = int(db.scalar(select(func.count()).select_from(LabelTaxonomy)) or 0)
    if count > 0:
        return

    now = utc_now()
    taxonomy_id = "tax-install-service"
    version_id = "ver-install-v1-1"
    version_v1_id = "ver-install-v1-0"
    nodes = [
        LabelTaxonomyNode(
            id="node-install-root",
            taxonomy_version_id=version_id,
            parent_id=None,
            name="安装服务",
            code="L1_INSTALL",
            level=1,
            path_names=["安装服务"],
            path_ids=["node-install-root"],
            is_leaf=False,
            llm_enabled=True,
            sort_order=1,
            status="enabled",
            category_scope=["家电", "家居"],
            business_scope=["安装服务", "客服"],
            has_config=True,
            has_examples=True,
            config_status="published",
            created_at=now,
            updated_at=now,
        ),
        LabelTaxonomyNode(
            id="node-install-delay",
            taxonomy_version_id=version_id,
            parent_id="node-install-root",
            name="安装超时",
            code="L2_INSTALL_DELAY",
            level=2,
            path_names=["安装服务", "安装超时"],
            path_ids=["node-install-root", "node-install-delay"],
            is_leaf=True,
            llm_enabled=True,
            sort_order=2,
            status="enabled",
            category_scope=["家电"],
            business_scope=["安装服务"],
            has_config=True,
            has_examples=True,
            config_status="draft",
            created_at=now,
            updated_at=now,
        ),
        LabelTaxonomyNode(
            id="node-install-reschedule",
            taxonomy_version_id=version_id,
            parent_id="node-install-root",
            name="改约问题",
            code="L2_INSTALL_RESCHEDULE",
            level=2,
            path_names=["安装服务", "改约问题"],
            path_ids=["node-install-root", "node-install-reschedule"],
            is_leaf=True,
            llm_enabled=True,
            sort_order=3,
            status="enabled",
            category_scope=["家电"],
            business_scope=["安装服务"],
            has_config=False,
            has_examples=False,
            config_status="empty",
            created_at=now,
            updated_at=now,
        ),
    ]

    db.add_all(
        [
            LabelTaxonomy(
                id=taxonomy_id,
                name="安装服务 VOC 标签体系",
                code="VOC_INSTALL_SERVICE",
                description="用于安装预约、履约、超时、服务态度等用户声音结构化打标。",
                business_scope=["安装服务", "客服"],
                category_scope=["家电", "家居"],
                owner="VOC Ops",
                status="draft",
                current_version_id=version_id,
                node_count=3,
                created_at=now,
                updated_at=now,
                created_by="system",
                updated_by="system",
            ),
            LabelTaxonomyVersion(
                id=version_v1_id,
                taxonomy_id=taxonomy_id,
                version="v1.0",
                status="published",
                change_log="初始发布版本",
                node_count=2,
                published_at=now,
                created_at=now,
                updated_at=now,
            ),
            LabelTaxonomyVersion(
                id=version_id,
                taxonomy_id=taxonomy_id,
                version="v1.1",
                status="draft",
                change_log="补充安装重试与改约规则",
                node_count=3,
                created_at=now,
                updated_at=now,
            ),
            LabelTaxonomy(
                id="tax-after-sale",
                name="售后问题 VOC 标签体系",
                code="VOC_AFTER_SALE",
                description="用于售后流程、退款、维修时效相关标签识别。",
                business_scope=["售后", "客服"],
                category_scope=["家电"],
                owner="AfterSale Team",
                status="published",
                current_version_id="ver-after-sale-v2-0",
                node_count=2,
                created_at=now,
                updated_at=now,
                created_by="system",
                updated_by="system",
            ),
            LabelTaxonomyVersion(
                id="ver-after-sale-v2-0",
                taxonomy_id="tax-after-sale",
                version="v2.0",
                status="published",
                change_log="新增物流破损与补发判定",
                node_count=2,
                published_at=now,
                created_at=now,
                updated_at=now,
            ),
            LabelTaxonomyNode(
                id="node-after-sale-root",
                taxonomy_version_id="ver-after-sale-v2-0",
                parent_id=None,
                name="售后问题",
                code="L1_AFTER_SALE",
                level=1,
                path_names=["售后问题"],
                path_ids=["node-after-sale-root"],
                is_leaf=False,
                llm_enabled=True,
                sort_order=1,
                status="enabled",
                category_scope=["家电"],
                business_scope=["售后"],
                has_config=True,
                has_examples=True,
                config_status="published",
                created_at=now,
                updated_at=now,
            ),
            LabelTaxonomyNode(
                id="node-after-sale-refund",
                taxonomy_version_id="ver-after-sale-v2-0",
                parent_id="node-after-sale-root",
                name="退款进度",
                code="L2_REFUND_PROGRESS",
                level=2,
                path_names=["售后问题", "退款进度"],
                path_ids=["node-after-sale-root", "node-after-sale-refund"],
                is_leaf=True,
                llm_enabled=True,
                sort_order=2,
                status="enabled",
                category_scope=["家电"],
                business_scope=["售后"],
                has_config=True,
                has_examples=True,
                config_status="published",
                created_at=now,
                updated_at=now,
            ),
            *nodes,
        ]
    )
    db.commit()


def _refresh_taxonomies(db: Session) -> None:
    _seed_taxonomies_if_empty(db)


def _get_taxonomy_or_404(db: Session, taxonomy_id: str) -> LabelTaxonomy:
    row = db.scalar(select(LabelTaxonomy).where(LabelTaxonomy.id == taxonomy_id))
    if row is None:
        raise HTTPException(status_code=404, detail="taxonomy not found")
    return row


def _get_version_or_404(db: Session, taxonomy_id: str, version_id: str) -> LabelTaxonomyVersion:
    row = db.scalar(select(LabelTaxonomyVersion).where(LabelTaxonomyVersion.id == version_id))
    if row is None:
        raise HTTPException(status_code=404, detail="taxonomy version not found")
    if row.taxonomy_id != taxonomy_id:
        raise HTTPException(status_code=404, detail="taxonomy/version mismatch")
    return row


@router.get("", response_model=list[LabelTaxonomyOut])
def list_taxonomies(db: Session = Depends(get_db)) -> list[LabelTaxonomyOut]:
    _refresh_taxonomies(db)
    rows = db.scalars(select(LabelTaxonomy).order_by(desc(LabelTaxonomy.updated_at), asc(LabelTaxonomy.id))).all()
    return [_to_taxonomy_out(row) for row in rows]


@router.get("/{taxonomy_id}", response_model=LabelTaxonomyOut)
def get_taxonomy(taxonomy_id: str, db: Session = Depends(get_db)) -> LabelTaxonomyOut:
    _refresh_taxonomies(db)
    row = _get_taxonomy_or_404(db, taxonomy_id)
    return _to_taxonomy_out(row)


@router.post("", response_model=LabelTaxonomyOut)
def create_taxonomy(payload: LabelTaxonomyIn, db: Session = Depends(get_db)) -> LabelTaxonomyOut:
    _refresh_taxonomies(db)
    _validate_taxonomy_status(payload.status)
    _validate_taxonomy_code(payload.code)
    _validate_unique_code(db, payload.code)

    now = utc_now()
    taxonomy_id = _gen_id("tax")
    version_id = _gen_id("ver")
    created = LabelTaxonomy(
        id=taxonomy_id,
        name=payload.name,
        code=payload.code,
        description=payload.description,
        business_scope=payload.businessScope,
        category_scope=payload.categoryScope,
        owner=payload.owner,
        status=payload.status,
        current_version_id=version_id,
        node_count=0,
        created_at=now,
        updated_at=now,
        created_by="api",
        updated_by="api",
    )
    created_version = LabelTaxonomyVersion(
        id=version_id,
        taxonomy_id=taxonomy_id,
        version="v1.0",
        status="draft",
        change_log="initial draft version",
        node_count=0,
        created_at=now,
        updated_at=now,
        created_by="api",
        updated_by="api",
    )
    db.add(created)
    db.add(created_version)
    db.commit()
    db.refresh(created)
    return _to_taxonomy_out(created)


@router.put("/{taxonomy_id}", response_model=LabelTaxonomyOut)
def update_taxonomy(taxonomy_id: str, payload: LabelTaxonomyIn, db: Session = Depends(get_db)) -> LabelTaxonomyOut:
    _refresh_taxonomies(db)
    _validate_taxonomy_status(payload.status)
    _validate_taxonomy_code(payload.code)
    row = _get_taxonomy_or_404(db, taxonomy_id)
    _validate_unique_code(db, payload.code, exclude_id=taxonomy_id)

    row.name = payload.name
    row.code = payload.code
    row.description = payload.description
    row.business_scope = payload.businessScope
    row.category_scope = payload.categoryScope
    row.owner = payload.owner
    row.status = payload.status
    row.updated_at = utc_now()
    row.updated_by = "api"
    db.commit()
    db.refresh(row)
    return _to_taxonomy_out(row)


@router.get("/{taxonomy_id}/versions", response_model=list[LabelTaxonomyVersionOut])
def list_taxonomy_versions(taxonomy_id: str, db: Session = Depends(get_db)) -> list[LabelTaxonomyVersionOut]:
    _refresh_taxonomies(db)
    _get_taxonomy_or_404(db, taxonomy_id)
    rows = db.scalars(
        select(LabelTaxonomyVersion)
        .where(LabelTaxonomyVersion.taxonomy_id == taxonomy_id)
        .order_by(desc(LabelTaxonomyVersion.updated_at), desc(LabelTaxonomyVersion.version))
    ).all()
    return [_to_version_out(row) for row in rows]


@router.get("/{taxonomy_id}/versions/{version_id}", response_model=LabelTaxonomyVersionOut)
def get_taxonomy_version(taxonomy_id: str, version_id: str, db: Session = Depends(get_db)) -> LabelTaxonomyVersionOut:
    _refresh_taxonomies(db)
    row = _get_version_or_404(db, taxonomy_id, version_id)
    return _to_version_out(row)


@router.get("/{taxonomy_id}/versions/{version_id}/tree", response_model=list[LabelTaxonomyNodeOut])
def get_taxonomy_tree(taxonomy_id: str, version_id: str, db: Session = Depends(get_db)) -> list[LabelTaxonomyNodeOut]:
    _refresh_taxonomies(db)
    _get_version_or_404(db, taxonomy_id, version_id)
    rows = db.scalars(
        select(LabelTaxonomyNode)
        .where(LabelTaxonomyNode.taxonomy_version_id == version_id)
        .order_by(asc(LabelTaxonomyNode.level), asc(LabelTaxonomyNode.sort_order), asc(LabelTaxonomyNode.name))
    ).all()
    return [_to_node_out(row) for row in rows]
