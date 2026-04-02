from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.api.v1.label_taxonomies import (
    create_taxonomy,
    get_taxonomy,
    get_taxonomy_tree,
    get_taxonomy_version,
    list_taxonomies,
    update_taxonomy,
)
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.schemas.taxonomy import LabelTaxonomyIn


def test_label_taxonomy_seed_list_and_tree_shape() -> None:
    init_db()

    with SessionLocal() as db:
        rows = list_taxonomies(db)
        assert rows, "expected taxonomy seed data"

        target = rows[0]
        assert target.currentVersionId, "expected seeded current version id"
        version = get_taxonomy_version(target.id, target.currentVersionId, db)
        assert version.taxonomyId == target.id

        tree = get_taxonomy_tree(target.id, target.currentVersionId, db)
        assert tree, "expected seeded taxonomy tree"
        assert tree[0].taxonomyVersionId == target.currentVersionId
        assert all(node.level >= 1 for node in tree)


def test_label_taxonomy_create_and_update_roundtrip() -> None:
    init_db()

    with SessionLocal() as db:
        created = create_taxonomy(
            LabelTaxonomyIn(
                name="Pytest Taxonomy",
                code="PYTEST_TAXONOMY",
                description="created in pytest",
                businessScope=["qa"],
                categoryScope=["test"],
                owner="pytest",
                status="draft",
            ),
            db,
        )
        assert created.id
        assert created.currentVersionId
        assert created.code == "PYTEST_TAXONOMY"

        loaded = get_taxonomy(created.id, db)
        assert loaded.name == "Pytest Taxonomy"

        updated = update_taxonomy(
            created.id,
            LabelTaxonomyIn(
                name="Pytest Taxonomy Updated",
                code="PYTEST_TAXONOMY",
                description="updated in pytest",
                businessScope=["qa", "ops"],
                categoryScope=["test"],
                owner="pytest-user",
                status="published",
            ),
            db,
        )
        assert updated.name == "Pytest Taxonomy Updated"
        assert updated.status == "published"
        assert updated.owner == "pytest-user"


def test_label_taxonomy_rejects_duplicate_code() -> None:
    init_db()

    with SessionLocal() as db:
        create_taxonomy(
            LabelTaxonomyIn(
                name="Tax A",
                code="DUP_CODE",
                description="",
                businessScope=[],
                categoryScope=[],
                owner="",
                status="draft",
            ),
            db,
        )
        with pytest.raises(HTTPException) as exc:
            create_taxonomy(
                LabelTaxonomyIn(
                    name="Tax B",
                    code="DUP_CODE",
                    description="",
                    businessScope=[],
                    categoryScope=[],
                    owner="",
                    status="draft",
                ),
                db,
            )

    assert exc.value.status_code == 409
    assert str(exc.value.detail) == "taxonomy code already exists"
