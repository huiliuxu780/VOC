from __future__ import annotations

import json
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import Session

from app.api.v1.label_taxonomies import ensure_taxonomy_seed
from app.core.time_utils import utc_now
from app.db.session import get_db
from app.models.config import (
    LabelTaxonomyNode,
    LabelTaxonomyNodeConfig,
    LabelTaxonomyNodeConfigVersion,
    LabelTaxonomyNodeExample,
    LabelTaxonomyNodeTestRecord,
)
from app.schemas.taxonomy import (
    LabelNodeConfigDiffItem,
    LabelNodeConfigIn,
    LabelNodeConfigOut,
    LabelNodeConfigVersionDiffOut,
    LabelNodeConfigVersionOut,
    LabelNodeExampleIn,
    LabelNodeExampleOut,
    LabelNodeExampleUpdateIn,
    LabelNodeTestIn,
    LabelNodeTestRecordPageOut,
    LabelNodeTestOut,
    LabelNodeTestRecordOut,
)

router = APIRouter()


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:12]}"


def _get_node_or_404(db: Session, node_id: str) -> LabelTaxonomyNode:
    node = db.scalar(select(LabelTaxonomyNode).where(LabelTaxonomyNode.id == node_id))
    if node is None:
        raise HTTPException(status_code=404, detail="label node not found")
    return node


def _get_example_or_404(db: Session, node_id: str, example_id: str) -> LabelTaxonomyNodeExample:
    row = db.scalar(
        select(LabelTaxonomyNodeExample).where(
            LabelTaxonomyNodeExample.id == example_id,
            LabelTaxonomyNodeExample.label_node_id == node_id,
        )
    )
    if row is None:
        raise HTTPException(status_code=404, detail="label node example not found")
    return row


def _get_config_version_or_404(
    db: Session,
    node_id: str,
    version_id: str,
) -> LabelTaxonomyNodeConfigVersion:
    row = db.scalar(
        select(LabelTaxonomyNodeConfigVersion).where(
            LabelTaxonomyNodeConfigVersion.id == version_id,
            LabelTaxonomyNodeConfigVersion.label_node_id == node_id,
        )
    )
    if row is None:
        raise HTTPException(status_code=404, detail="config version not found")
    return row


def _to_node_config_out(item: LabelTaxonomyNodeConfig) -> LabelNodeConfigOut:
    return LabelNodeConfigOut(
        id=item.id,
        labelNodeId=item.label_node_id,
        version=item.version,
        promptName=item.prompt_name,
        definition=item.definition,
        decisionRule=item.decision_rule,
        excludeRule=item.exclude_rule,
        taggingRule=item.tagging_rule,
        systemPrompt=item.system_prompt,
        userPromptTemplate=item.user_prompt_template,
        outputSchema=item.output_schema,
        postProcessRule=item.post_process_rule,
        fallbackStrategy=item.fallback_strategy,
        riskNote=item.risk_note,
        remark=item.remark,
        modelName=item.model_name,
        temperature=item.temperature,
        status=item.status,
        createdAt=item.created_at,
        updatedAt=item.updated_at,
        createdBy=item.created_by,
        updatedBy=item.updated_by,
    )


def _to_node_config_version_out(item: LabelTaxonomyNodeConfigVersion) -> LabelNodeConfigVersionOut:
    return LabelNodeConfigVersionOut(
        id=item.id,
        labelNodeId=item.label_node_id,
        configId=item.config_id,
        configVersion=item.config_version,
        status=item.status,
        snapshot=item.snapshot,
        createdAt=item.created_at,
    )


def _to_node_example_out(item: LabelTaxonomyNodeExample) -> LabelNodeExampleOut:
    return LabelNodeExampleOut(
        id=item.id,
        labelNodeId=item.label_node_id,
        exampleType=item.example_type,
        content=item.content,
        expectedLabel=item.expected_label,
        note=item.note,
        createdAt=item.created_at,
        updatedAt=item.updated_at,
    )


def _to_test_out(record: LabelTaxonomyNodeTestRecord) -> LabelNodeTestOut:
    return LabelNodeTestOut(
        nodeId=record.label_node_id,
        rawOutput=record.raw_output,
        parsedOutput=record.parsed_output,
        hitLabel=record.hit_label,
        confidence=record.confidence,
        latency=record.latency,
        errorMessage=record.error_message,
    )


def _to_test_record_out(record: LabelTaxonomyNodeTestRecord) -> LabelNodeTestRecordOut:
    payload = _to_test_out(record)
    return LabelNodeTestRecordOut(
        id=record.id,
        inputText=record.input_text,
        createdAt=record.created_at,
        **payload.model_dump(),
    )


_CONFIG_DIFF_FIELDS = [
    "version",
    "promptName",
    "definition",
    "decisionRule",
    "excludeRule",
    "taggingRule",
    "systemPrompt",
    "userPromptTemplate",
    "outputSchema",
    "postProcessRule",
    "fallbackStrategy",
    "riskNote",
    "remark",
    "modelName",
    "temperature",
    "status",
]


def _to_diff_value(value: object) -> object:
    if isinstance(value, (str, int, float, bool, list, dict)) or value is None:
        return value
    return str(value)


def _build_config_version_diff(
    from_row: LabelTaxonomyNodeConfigVersion,
    to_row: LabelTaxonomyNodeConfigVersion,
) -> LabelNodeConfigVersionDiffOut:
    from_snapshot = from_row.snapshot if isinstance(from_row.snapshot, dict) else {}
    to_snapshot = to_row.snapshot if isinstance(to_row.snapshot, dict) else {}
    extra_fields = sorted((set(from_snapshot.keys()) | set(to_snapshot.keys())) - set(_CONFIG_DIFF_FIELDS))
    ordered_fields = [*_CONFIG_DIFF_FIELDS, *extra_fields]

    changes: list[LabelNodeConfigDiffItem] = []
    for field in ordered_fields:
        from_value = _to_diff_value(from_snapshot.get(field))
        to_value = _to_diff_value(to_snapshot.get(field))
        if from_value == to_value:
            continue
        changes.append(
            LabelNodeConfigDiffItem(
                field=field,
                fromValue=from_value,
                toValue=to_value,
            )
        )

    return LabelNodeConfigVersionDiffOut(
        fromVersionId=from_row.id,
        toVersionId=to_row.id,
        changes=changes,
    )


def _config_snapshot(config: LabelTaxonomyNodeConfig) -> dict:
    return {
        "version": config.version,
        "promptName": config.prompt_name,
        "definition": config.definition,
        "decisionRule": config.decision_rule,
        "excludeRule": config.exclude_rule,
        "taggingRule": config.tagging_rule,
        "systemPrompt": config.system_prompt,
        "userPromptTemplate": config.user_prompt_template,
        "outputSchema": config.output_schema,
        "postProcessRule": config.post_process_rule,
        "fallbackStrategy": config.fallback_strategy,
        "riskNote": config.risk_note,
        "remark": config.remark,
        "modelName": config.model_name,
        "temperature": config.temperature,
        "status": config.status,
    }


def _append_config_version(db: Session, config: LabelTaxonomyNodeConfig) -> None:
    db.add(
        LabelTaxonomyNodeConfigVersion(
            id=_gen_id("cfgver"),
            label_node_id=config.label_node_id,
            config_id=config.id,
            config_version=config.version,
            status=config.status,
            snapshot=_config_snapshot(config),
            created_at=utc_now(),
        )
    )


def _seed_node_details_if_missing(db: Session) -> None:
    config_count = int(db.scalar(select(func.count()).select_from(LabelTaxonomyNodeConfig)) or 0)
    example_count = int(db.scalar(select(func.count()).select_from(LabelTaxonomyNodeExample)) or 0)
    if config_count > 0 and example_count > 0:
        return

    node_delay = db.scalar(select(LabelTaxonomyNode).where(LabelTaxonomyNode.id == "node-install-delay"))
    node_refund = db.scalar(select(LabelTaxonomyNode).where(LabelTaxonomyNode.id == "node-after-sale-refund"))
    now = utc_now()

    if config_count == 0 and node_delay is not None:
        config = LabelTaxonomyNodeConfig(
            id="cfg-node-install-delay-v1",
            label_node_id=node_delay.id,
            version="v1.1",
            prompt_name="Install Delay Decision",
            definition="Detect installation appointments that exceed committed SLA.",
            decision_rule="Hit when text states installation delay/timeout under appointment context.",
            exclude_rule="Exclude logistics-only delay without installation appointment signals.",
            tagging_rule="Output label L2_INSTALL_DELAY when matched.",
            system_prompt="You are VOC taxonomy classifier. Return structured JSON.",
            user_prompt_template="Input: {{content_text}}",
            output_schema='{"label":"string","confidence":"number","reason":"string"}',
            post_process_rule="Set uncertain=true when confidence < 0.5.",
            fallback_strategy="Fallback to L1_INSTALL when uncertain.",
            risk_note="Need to disambiguate logistics delay vs installation delay.",
            model_name="gpt-4.1-mini",
            temperature=0.1,
            status="draft",
            created_at=now,
            updated_at=now,
            created_by="seed",
            updated_by="seed",
        )
        db.add(config)
        _append_config_version(db, config)
        node_delay.has_config = True
        node_delay.config_status = "draft"
        node_delay.updated_at = now

    if example_count == 0 and node_delay is not None:
        db.add_all(
            [
                LabelTaxonomyNodeExample(
                    id="ex-install-delay-pos-1",
                    label_node_id=node_delay.id,
                    example_type="positive",
                    content="Installation appointment is delayed by one week and no callback.",
                    expected_label="L2_INSTALL_DELAY",
                    note="Typical positive sample",
                    created_at=now,
                    updated_at=now,
                ),
                LabelTaxonomyNodeExample(
                    id="ex-install-delay-neg-1",
                    label_node_id=node_delay.id,
                    example_type="negative",
                    content="Logistics is late but installation is completed on time.",
                    expected_label="L2_INSTALL_DELAY",
                    note="Negative sample that should be excluded",
                    created_at=now,
                    updated_at=now,
                ),
            ]
        )
        node_delay.has_examples = True
        node_delay.updated_at = now

    if node_refund is not None and example_count == 0:
        db.add(
            LabelTaxonomyNodeExample(
                id="ex-refund-progress-pos-1",
                label_node_id=node_refund.id,
                example_type="positive",
                content="Refund request pending for three days, user asks for progress.",
                expected_label="L2_REFUND_PROGRESS",
                note="Refund progress positive sample",
                created_at=now,
                updated_at=now,
            )
        )
        node_refund.has_examples = True
        node_refund.updated_at = now

    db.commit()


def _refresh_node_data(db: Session) -> None:
    ensure_taxonomy_seed(db)
    _seed_node_details_if_missing(db)


def _upsert_default_config(db: Session, node: LabelTaxonomyNode) -> LabelTaxonomyNodeConfig:
    existing = db.scalar(select(LabelTaxonomyNodeConfig).where(LabelTaxonomyNodeConfig.label_node_id == node.id))
    if existing is not None:
        return existing

    now = utc_now()
    created = LabelTaxonomyNodeConfig(
        id=_gen_id("cfg"),
        label_node_id=node.id,
        version="v1.0",
        prompt_name=f"{node.name} Decision",
        definition=f"Classify whether user text belongs to node {node.name} ({node.code}).",
        decision_rule="Judge by semantic and context signals.",
        system_prompt="You are VOC taxonomy classifier. Return structured JSON.",
        user_prompt_template="Input: {{content_text}}",
        output_schema='{"label":"string","confidence":"number","reason":"string"}',
        model_name="gpt-4.1-mini",
        temperature=0.1,
        status="draft",
        created_at=now,
        updated_at=now,
        created_by="api",
        updated_by="api",
    )
    db.add(created)
    _append_config_version(db, created)
    node.has_config = True
    node.config_status = "draft"
    node.updated_at = now
    db.commit()
    db.refresh(created)
    return created


@router.get("/{node_id}/config", response_model=LabelNodeConfigOut)
def get_node_config(node_id: str, db: Session = Depends(get_db)) -> LabelNodeConfigOut:
    _refresh_node_data(db)
    node = _get_node_or_404(db, node_id)
    config = _upsert_default_config(db, node)
    return _to_node_config_out(config)


@router.get("/{node_id}/config/versions", response_model=list[LabelNodeConfigVersionOut])
def list_node_config_versions(node_id: str, db: Session = Depends(get_db)) -> list[LabelNodeConfigVersionOut]:
    _refresh_node_data(db)
    _get_node_or_404(db, node_id)
    rows = db.scalars(
        select(LabelTaxonomyNodeConfigVersion)
        .where(LabelTaxonomyNodeConfigVersion.label_node_id == node_id)
        .order_by(desc(LabelTaxonomyNodeConfigVersion.created_at), desc(LabelTaxonomyNodeConfigVersion.id))
    ).all()
    return [_to_node_config_version_out(row) for row in rows]


@router.get("/{node_id}/config/versions/compare", response_model=LabelNodeConfigVersionDiffOut)
def compare_node_config_versions(
    node_id: str,
    from_version_id: str = Query(..., alias="fromVersionId"),
    to_version_id: str = Query(..., alias="toVersionId"),
    db: Session = Depends(get_db),
) -> LabelNodeConfigVersionDiffOut:
    _refresh_node_data(db)
    _get_node_or_404(db, node_id)
    from_row = _get_config_version_or_404(db, node_id, from_version_id)
    to_row = _get_config_version_or_404(db, node_id, to_version_id)
    return _build_config_version_diff(from_row, to_row)


@router.put("/{node_id}/config", response_model=LabelNodeConfigOut)
def upsert_node_config(node_id: str, payload: LabelNodeConfigIn, db: Session = Depends(get_db)) -> LabelNodeConfigOut:
    _refresh_node_data(db)
    node = _get_node_or_404(db, node_id)
    if payload.status not in {"draft", "published"}:
        raise HTTPException(status_code=422, detail="invalid config status")

    row = db.scalar(select(LabelTaxonomyNodeConfig).where(LabelTaxonomyNodeConfig.label_node_id == node_id))
    now = utc_now()
    if row is None:
        row = LabelTaxonomyNodeConfig(
            id=_gen_id("cfg"),
            label_node_id=node_id,
            created_at=now,
            updated_at=now,
            created_by="api",
            updated_by="api",
        )
        db.add(row)

    row.version = payload.version
    row.prompt_name = payload.promptName
    row.definition = payload.definition
    row.decision_rule = payload.decisionRule
    row.exclude_rule = payload.excludeRule
    row.tagging_rule = payload.taggingRule
    row.system_prompt = payload.systemPrompt
    row.user_prompt_template = payload.userPromptTemplate
    row.output_schema = payload.outputSchema
    row.post_process_rule = payload.postProcessRule
    row.fallback_strategy = payload.fallbackStrategy
    row.risk_note = payload.riskNote
    row.remark = payload.remark
    row.model_name = payload.modelName
    row.temperature = payload.temperature
    row.status = payload.status
    row.updated_at = now
    row.updated_by = "api"

    node.has_config = True
    node.config_status = payload.status
    node.updated_at = now
    _append_config_version(db, row)
    db.commit()
    db.refresh(row)
    return _to_node_config_out(row)


@router.get("/{node_id}/examples", response_model=list[LabelNodeExampleOut])
def list_node_examples(node_id: str, db: Session = Depends(get_db)) -> list[LabelNodeExampleOut]:
    _refresh_node_data(db)
    _get_node_or_404(db, node_id)
    rows = db.scalars(
        select(LabelTaxonomyNodeExample)
        .where(LabelTaxonomyNodeExample.label_node_id == node_id)
        .order_by(desc(LabelTaxonomyNodeExample.updated_at), asc(LabelTaxonomyNodeExample.id))
    ).all()
    return [_to_node_example_out(row) for row in rows]


@router.post("/{node_id}/examples", response_model=LabelNodeExampleOut)
def create_node_example(node_id: str, payload: LabelNodeExampleIn, db: Session = Depends(get_db)) -> LabelNodeExampleOut:
    _refresh_node_data(db)
    node = _get_node_or_404(db, node_id)
    if payload.exampleType not in {"positive", "negative", "boundary", "counter"}:
        raise HTTPException(status_code=422, detail="invalid example type")

    now = utc_now()
    row = LabelTaxonomyNodeExample(
        id=_gen_id("ex"),
        label_node_id=node_id,
        example_type=payload.exampleType,
        content=payload.content,
        expected_label=payload.expectedLabel,
        note=payload.note,
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    node.has_examples = True
    node.updated_at = now
    db.commit()
    db.refresh(row)
    return _to_node_example_out(row)


@router.put("/{node_id}/examples/{example_id}", response_model=LabelNodeExampleOut)
def update_node_example(
    node_id: str,
    example_id: str,
    payload: LabelNodeExampleUpdateIn,
    db: Session = Depends(get_db),
) -> LabelNodeExampleOut:
    _refresh_node_data(db)
    _get_node_or_404(db, node_id)
    if payload.exampleType not in {"positive", "negative", "boundary", "counter"}:
        raise HTTPException(status_code=422, detail="invalid example type")

    row = _get_example_or_404(db, node_id, example_id)
    row.example_type = payload.exampleType
    row.content = payload.content
    row.expected_label = payload.expectedLabel
    row.note = payload.note
    row.updated_at = utc_now()
    db.commit()
    db.refresh(row)
    return _to_node_example_out(row)


@router.delete("/{node_id}/examples/{example_id}")
def delete_node_example(node_id: str, example_id: str, db: Session = Depends(get_db)) -> dict:
    _refresh_node_data(db)
    node = _get_node_or_404(db, node_id)
    row = _get_example_or_404(db, node_id, example_id)
    db.delete(row)

    remain = int(
        db.scalar(
            select(func.count())
            .select_from(LabelTaxonomyNodeExample)
            .where(LabelTaxonomyNodeExample.label_node_id == node_id, LabelTaxonomyNodeExample.id != example_id)
        )
        or 0
    )
    node.has_examples = remain > 0
    node.updated_at = utc_now()
    db.commit()
    return {"exampleId": example_id, "status": "deleted"}


@router.post("/{node_id}/test", response_model=LabelNodeTestOut)
def run_node_test(node_id: str, payload: LabelNodeTestIn, db: Session = Depends(get_db)) -> LabelNodeTestOut:
    _refresh_node_data(db)
    node = _get_node_or_404(db, node_id)
    config = _upsert_default_config(db, node)

    text = payload.contentText.strip()
    lower = text.lower()
    keywords = [node.name.lower(), node.code.lower()]
    hit = any(keyword and keyword in lower for keyword in keywords)
    if not hit and ("delay" in lower or "timeout" in lower or "超时" in text):
        hit = "DELAY" in node.code

    confidence = 0.87 if hit else 0.42
    parsed_output = {
        "label": node.code if hit else "UNMATCHED",
        "confidence": confidence,
        "reason": "keyword_match" if hit else "no_strong_signal",
        "model": config.model_name or "gpt-4.1-mini",
    }
    raw_output = json.dumps(parsed_output, ensure_ascii=False)

    record = LabelTaxonomyNodeTestRecord(
        id=_gen_id("tr"),
        label_node_id=node.id,
        input_text=text,
        raw_output=raw_output,
        parsed_output=parsed_output,
        hit_label=parsed_output["label"],
        confidence=confidence,
        latency=128,
        error_message=None,
        created_at=utc_now(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _to_test_out(record)


@router.get("/{node_id}/test-records", response_model=LabelNodeTestRecordPageOut)
def list_node_test_records(
    node_id: str,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=200),
    hit_label: str | None = Query(default=None, alias="hitLabel"),
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> LabelNodeTestRecordPageOut:
    _refresh_node_data(db)
    _get_node_or_404(db, node_id)
    conditions = [LabelTaxonomyNodeTestRecord.label_node_id == node_id]
    if hit_label and hit_label != "all":
        conditions.append(LabelTaxonomyNodeTestRecord.hit_label == hit_label)

    keyword = q.strip() if q else ""
    if keyword:
        like_keyword = f"%{keyword}%"
        conditions.append(
            or_(
                LabelTaxonomyNodeTestRecord.input_text.ilike(like_keyword),
                LabelTaxonomyNodeTestRecord.hit_label.ilike(like_keyword),
                LabelTaxonomyNodeTestRecord.raw_output.ilike(like_keyword),
            )
        )

    total = int(db.scalar(select(func.count()).select_from(LabelTaxonomyNodeTestRecord).where(*conditions)) or 0)
    rows = db.scalars(
        select(LabelTaxonomyNodeTestRecord)
        .where(*conditions)
        .order_by(desc(LabelTaxonomyNodeTestRecord.created_at), desc(LabelTaxonomyNodeTestRecord.id))
        .offset(offset)
        .limit(limit)
    ).all()
    items = [_to_test_record_out(row) for row in rows]
    return LabelNodeTestRecordPageOut(
        items=items,
        total=total,
        offset=offset,
        limit=limit,
        hasMore=offset + len(items) < total,
    )
