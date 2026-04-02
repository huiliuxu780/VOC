from __future__ import annotations

from app.api.v1.label_nodes import create_node_example, get_node_config, list_node_examples, run_node_test, upsert_node_config
from app.api.v1.label_taxonomies import get_taxonomy_tree
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.schemas.taxonomy import LabelNodeConfigIn, LabelNodeExampleIn, LabelNodeTestIn


def test_label_node_config_get_and_upsert() -> None:
    init_db()

    with SessionLocal() as db:
        config = get_node_config("node-install-delay", db)
        assert config.labelNodeId == "node-install-delay"
        assert config.systemPrompt

        updated = upsert_node_config(
            "node-install-delay",
            LabelNodeConfigIn(
                version="v1.2",
                promptName="安装超时判定-更新",
                definition="更新后的定义",
                decisionRule="更新规则",
                excludeRule="",
                taggingRule="",
                systemPrompt="updated system prompt",
                userPromptTemplate="{{content_text}}",
                outputSchema='{"label":"string"}',
                postProcessRule="",
                fallbackStrategy="",
                riskNote="",
                remark="pytest update",
                modelName="gpt-4.1-mini",
                temperature=0.2,
                status="published",
            ),
            db,
        )
        assert updated.version == "v1.2"
        assert updated.status == "published"

        tree = get_taxonomy_tree("tax-install-service", "ver-install-v1-1", db)
        target_node = next(item for item in tree if item.id == "node-install-delay")
        assert target_node.hasConfig is True
        assert target_node.configStatus == "published"


def test_label_node_examples_list_and_create() -> None:
    init_db()

    with SessionLocal() as db:
        before = list_node_examples("node-install-delay", db)
        assert before, "expected seeded examples"

        created = create_node_example(
            "node-install-delay",
            LabelNodeExampleIn(
                exampleType="boundary",
                content="用户说安装师傅快到了但未明确超时。",
                expectedLabel="L2_INSTALL_DELAY",
                note="边界样本",
            ),
            db,
        )
        assert created.exampleType == "boundary"
        assert created.labelNodeId == "node-install-delay"

        after = list_node_examples("node-install-delay", db)
        assert len(after) == len(before) + 1


def test_label_node_test_api_returns_expected_shape() -> None:
    init_db()

    with SessionLocal() as db:
        result = run_node_test("node-install-delay", LabelNodeTestIn(contentText="预约安装超时还没人联系"), db)

    assert result.nodeId == "node-install-delay"
    assert isinstance(result.rawOutput, str)
    assert isinstance(result.parsedOutput, dict)
    assert "label" in result.parsedOutput
    assert result.latency > 0
