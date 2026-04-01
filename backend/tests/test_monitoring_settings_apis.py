from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.v1.monitoring import api_health_metrics, queue_health_metrics
from app.api.v1.settings import list_model_configs, update_model_configs
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.schemas.settings import ModelConfigBulkUpdate, ModelConfigUpdateItem


def test_monitoring_queue_and_api_metrics_have_expected_shape() -> None:
    init_db()
    with SessionLocal() as db:
        queues = queue_health_metrics(db)
        apis = api_health_metrics(db)

    assert queues, "expected seeded queue health metrics"
    assert apis, "expected seeded api health metrics"

    queue = queues[0]
    assert {"queue", "backlog", "consumer_lag", "status"}.issubset(queue.keys())
    assert isinstance(queue["backlog"], int)
    assert isinstance(queue["consumer_lag"], int)

    api = apis[0]
    assert {"api", "success_rate", "p95_latency_ms", "status"}.issubset(api.keys())
    assert isinstance(api["success_rate"], float)


def test_settings_models_list_and_update_roundtrip() -> None:
    init_db()
    extra_key = f"pytest-model-{uuid4().hex[:8]}"

    with SessionLocal() as db:
        before = list_model_configs(db)
        assert before, "expected seeded model configs"

        payload = ModelConfigBulkUpdate(
            items=[
                ModelConfigUpdateItem(
                    model_key="gpt-4.1-mini",
                    model_vendor="openai",
                    model_version="2026-03",
                    enabled=True,
                ),
                ModelConfigUpdateItem(
                    model_key=extra_key,
                    model_vendor="internal",
                    model_version="v0.1",
                    enabled=False,
                ),
            ]
        )
        after_update = update_model_configs(payload, db)
        after = list_model_configs(db)

    keys = {item.model_key for item in after_update}
    assert "gpt-4.1-mini" in keys
    assert extra_key in keys

    updated_item = next(item for item in after if item.model_key == "gpt-4.1-mini")
    assert updated_item.model_version == "2026-03"

    new_item = next(item for item in after if item.model_key == extra_key)
    assert new_item.model_vendor == "internal"
    assert new_item.enabled is False


def test_settings_models_reject_duplicate_model_key_payload() -> None:
    init_db()
    duplicated_key = f"dup-model-{uuid4().hex[:6]}"
    payload = ModelConfigBulkUpdate(
        items=[
            ModelConfigUpdateItem(
                model_key=duplicated_key,
                model_vendor="vendor-a",
                model_version="v1",
                enabled=True,
            ),
            ModelConfigUpdateItem(
                model_key=duplicated_key,
                model_vendor="vendor-b",
                model_version="v2",
                enabled=False,
            ),
        ]
    )

    with SessionLocal() as db:
        with pytest.raises(HTTPException) as exc:
            update_model_configs(payload, db)

    assert exc.value.status_code == 422
    assert str(exc.value.detail) == "duplicate model_key in payload"
