from __future__ import annotations

import os
from pathlib import Path
from tempfile import gettempdir
from time import sleep
from uuid import uuid4

import pytest

_TEST_DB_PATH = Path(gettempdir()) / f"voc_backend_test_{uuid4().hex}.db"
os.environ["VOC_DB_URL"] = f"sqlite:///{_TEST_DB_PATH.as_posix()}"
_SQLITE_SIDE_CAR_SUFFIXES = ("", "-wal", "-shm", "-journal")
_UNLINK_RETRIES = 5
_UNLINK_RETRY_DELAY_SECONDS = 0.1


def _cleanup_sqlite_db_files() -> None:
    for suffix in _SQLITE_SIDE_CAR_SUFFIXES:
        candidate = Path(f"{_TEST_DB_PATH}{suffix}")
        for attempt in range(_UNLINK_RETRIES):
            try:
                candidate.unlink(missing_ok=True)
                break
            except PermissionError:
                if attempt == _UNLINK_RETRIES - 1:
                    # Avoid failing the whole suite on Windows file-lock timing.
                    break
                sleep(_UNLINK_RETRY_DELAY_SECONDS * (attempt + 1))


@pytest.fixture(scope="session", autouse=True)
def _cleanup_test_db_file() -> None:
    yield
    from app.db.session import engine

    engine.dispose()
    _cleanup_sqlite_db_files()


@pytest.fixture(autouse=True)
def _reset_db_between_tests() -> None:
    from app.db.session import Base, engine

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    engine.dispose()
