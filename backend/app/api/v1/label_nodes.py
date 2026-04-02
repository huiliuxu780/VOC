from __future__ import annotations

import json
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import asc, desc, func, select
from sqlalchemy.orm import Session

from app.api.v1.label_taxonomies import ensure_taxonomy_seed
from app.core.time_utils import utc_now
from app.db.session import get_db
from app.models.config import LabelTaxonomyNode, LabelTaxonomyNodeConfig, LabelTaxonomyNodeExample
from app.schemas.taxonomy import (
    LabelNodeConfigIn,
    LabelNodeConfigOut,
    LabelNodeExampleIn,
    LabelNodeExampleOut,
    LabelNodeTestIn,
    LabelNodeTestOut,
)

router = APIRouter()


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:12]}"


def _get_node_or_404(db: Session, node_id: str) -> LabelTaxonomyNode:
    node = db.scalar(select(LabelTaxonomyNode).where(LabelTaxonomyNode.id == node_id))
    if node is None:
        raise HTTPException(status_code=404, detail="label node not found")
    return node


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


def _seed_node_details_if_missing(db: Session) -> None:
    config_count = int(db.scalar(select(func.count()).select_from(LabelTaxonomyNodeConfig)) or 0)
    example_count = int(db.scalar(select(func.count()).select_from(LabelTaxonomyNodeExample)) or 0)
    if config_count > 0 and example_count > 0:
        return

    node_delay = db.scalar(select(LabelTaxonomyNode).where(LabelTaxonomyNode.id == "node-install-delay"))
    node_refund = db.scalar(select(LabelTaxonomyNode).where(LabelTaxonomyNode.id == "node-after-sale-refund"))
    now = utc_now()

    if config_count == 0 and node_delay is not None:
        db.add(
            LabelTaxonomyNodeConfig(
                id="cfg-node-install-delay-v1",
                label_node_id=node_delay.id,
                version="v1.1",
                prompt_name="安装超时判定",
                definition="用户反馈预约安装未按承诺时间完成。",
                decision_rule="文本包含超时、延期且主体为安装履约流程时命中。",
                exclude_rule="仅物流延迟且未涉及安装流程时排除。",
                tagging_rule="命中输出 L2_INSTALL_DELAY。",
                system_prompt="你是 VOC 标签判定专家，按定义输出 JSON。",
                user_prompt_template="输入文本：{{content_text}}",
                output_schema='{"label":"string","confidence":"number","reason":"string"}',
                post_process_rule="confidence < 0.5 时标记 uncertain=true。",
                fallback_strategy="无法判断时回退到 L1_INSTALL。",
                risk_note="晚到可能是物流晚到，需结合安装语义。",
                model_name="gpt-4.1-mini",
                temperature=0.1,
                status="draft",
                created_at=now,
                updated_at=now,
            )
        )
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
                    content="预约安装延后一周，客服一直没有回电。",
                    expected_label="L2_INSTALL_DELAY",
                    note="典型安装超时正例",
                    created_at=now,
                    updated_at=now,
                ),
                LabelTaxonomyNodeExample(
                    id="ex-install-delay-neg-1",
                    label_node_id=node_delay.id,
                    example_type="negative",
                    content="物流晚了一天，但安装当天按时完成。",
                    expected_label="L2_INSTALL_DELAY",
                    note="应排除的负例",
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
                content="退款申请三天了还没到账，想看进度。",
                expected_label="L2_REFUND_PROGRESS",
                note="售后退款进度正例",
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
        prompt_name=f"{node.name}判定",
        definition=f"判定是否属于节点 {node.name} ({node.code})。",
        decision_rule="结合语义和上下文进行判断。",
        system_prompt="你是 VOC 标签判定专家，输出结构化 JSON。",
        user_prompt_template="输入文本：{{content_text}}",
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


@router.post("/{node_id}/test", response_model=LabelNodeTestOut)
def run_node_test(node_id: str, payload: LabelNodeTestIn, db: Session = Depends(get_db)) -> LabelNodeTestOut:
    _refresh_node_data(db)
    node = _get_node_or_404(db, node_id)
    config = _upsert_default_config(db, node)

    text = payload.contentText.strip()
    lower = text.lower()
    keywords = [node.name.lower(), node.code.lower()]
    hit = any(keyword and keyword in lower for keyword in keywords)
    if not hit and ("delay" in lower or "超时" in text):
        hit = "DELAY" in node.code

    confidence = 0.87 if hit else 0.42
    parsed_output = {
        "label": node.code if hit else "UNMATCHED",
        "confidence": confidence,
        "reason": "keyword_match" if hit else "no_strong_signal",
        "model": config.model_name or "gpt-4.1-mini",
    }
    raw_output = json.dumps(parsed_output, ensure_ascii=False)

    return LabelNodeTestOut(
        nodeId=node.id,
        rawOutput=raw_output,
        parsedOutput=parsed_output,
        hitLabel=parsed_output["label"],
        confidence=confidence,
        latency=128,
        errorMessage=None,
    )
