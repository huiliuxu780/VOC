from __future__ import annotations

from app.api.v1.label_nodes import (
    create_node_example,
    delete_node_example,
    get_node_config,
    list_node_config_versions,
    list_node_examples,
    list_node_test_records,
    run_node_test,
    update_node_example,
    upsert_node_config,
)
from app.api.v1.label_taxonomies import get_taxonomy_tree
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.schemas.taxonomy import LabelNodeConfigIn, LabelNodeExampleIn, LabelNodeExampleUpdateIn, LabelNodeTestIn


def test_label_node_config_get_upsert_and_versions() -> None:
    init_db()

    with SessionLocal() as db:
        config = get_node_config("node-install-delay", db)
        assert config.labelNodeId == "node-install-delay"
        assert config.systemPrompt

        updated = upsert_node_config(
            "node-install-delay",
            LabelNodeConfigIn(
                version="v1.2",
                promptName="Install Delay Decision - Updated",
                definition="updated definition",
                decisionRule="updated rule",
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

        versions = list_node_config_versions("node-install-delay", db)
        assert versions, "expected config versions"
        assert versions[0].labelNodeId == "node-install-delay"

        tree = get_taxonomy_tree("tax-install-service", "ver-install-v1-1", db)
        target_node = next(item for item in tree if item.id == "node-install-delay")
        assert target_node.hasConfig is True
        assert target_node.configStatus == "published"


def test_label_node_examples_create_update_delete_roundtrip() -> None:
    init_db()

    with SessionLocal() as db:
        before = list_node_examples("node-install-delay", db)
        assert before, "expected seeded examples"

        created = create_node_example(
            "node-install-delay",
            LabelNodeExampleIn(
                exampleType="boundary",
                content="Installer may arrive late but no explicit timeout statement.",
                expectedLabel="L2_INSTALL_DELAY",
                note="boundary sample",
            ),
            db,
        )
        assert created.exampleType == "boundary"
        assert created.labelNodeId == "node-install-delay"

        updated = update_node_example(
            "node-install-delay",
            created.id,
            LabelNodeExampleUpdateIn(
                exampleType="counter",
                content="Counter sample content",
                expectedLabel="UNMATCHED",
                note="counter sample",
            ),
            db,
        )
        assert updated.exampleType == "counter"
        assert updated.content == "Counter sample content"

        deleted = delete_node_example("node-install-delay", created.id, db)
        assert deleted["status"] == "deleted"
        assert deleted["exampleId"] == created.id

        after = list_node_examples("node-install-delay", db)
        assert len(after) == len(before)


def test_label_node_test_and_records_api() -> None:
    init_db()

    with SessionLocal() as db:
        result = run_node_test("node-install-delay", LabelNodeTestIn(contentText="appointment timeout and no callback"), db)
        assert result.nodeId == "node-install-delay"
        assert isinstance(result.rawOutput, str)
        assert isinstance(result.parsedOutput, dict)
        assert "label" in result.parsedOutput
        assert result.latency > 0

        records = list_node_test_records("node-install-delay", 20, db)
        assert records, "expected persisted test records"
        assert records[0].nodeId == "node-install-delay"
        assert records[0].inputText
