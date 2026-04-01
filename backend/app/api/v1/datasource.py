from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import asc, func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.config import DataSourceConfig
from app.schemas.datasource import DataSourceCreate, DataSourceOut, MappingPreviewRequest

router = APIRouter()


def _seed_datasources_if_empty(db: Session) -> None:
    count = int(db.scalar(select(func.count()).select_from(DataSourceConfig)) or 0)
    if count > 0:
        return

    db.add_all(
        [
            DataSourceConfig(
                name="Ecom HTTP Ingest",
                code="DS_HTTP_001",
                source_type="HTTP",
                owner="Growth",
                enabled=True,
                extra_config={"base_url": "https://api.example.com/comments"},
            ),
            DataSourceConfig(
                name="Install Excel Import",
                code="DS_EXCEL_001",
                source_type="Excel",
                owner="Ops",
                enabled=False,
                extra_config={"sheet": "Sheet1"},
            ),
            DataSourceConfig(
                name="Hotline Kafka Stream",
                code="DS_KAFKA_001",
                source_type="Kafka",
                owner="Ops",
                enabled=True,
                extra_config={"topic": "voc.hotline"},
            ),
        ]
    )
    db.commit()


def _refresh_datasources(db: Session) -> None:
    _seed_datasources_if_empty(db)


def _to_out(item: DataSourceConfig) -> DataSourceOut:
    return DataSourceOut(
        id=item.id,
        name=item.name,
        code=item.code,
        source_type=item.source_type,
        owner=item.owner,
        enabled=item.enabled,
    )


def _get_datasource_or_404(db: Session, datasource_id: int) -> DataSourceConfig:
    row = db.scalar(select(DataSourceConfig).where(DataSourceConfig.id == datasource_id))
    if row is None:
        raise HTTPException(status_code=404, detail="datasource not found")
    return row


@router.get("", response_model=list[DataSourceOut])
def list_datasources(db: Session = Depends(get_db)) -> list[DataSourceOut]:
    _refresh_datasources(db)
    rows = db.scalars(select(DataSourceConfig).order_by(asc(DataSourceConfig.id))).all()
    return [_to_out(row) for row in rows]


@router.post("", response_model=DataSourceOut)
def create_datasource(payload: DataSourceCreate, db: Session = Depends(get_db)) -> DataSourceOut:
    _refresh_datasources(db)
    name_exists = db.scalar(select(DataSourceConfig).where(DataSourceConfig.name == payload.name))
    if name_exists is not None:
        raise HTTPException(status_code=409, detail="datasource name already exists")

    code_exists = db.scalar(select(DataSourceConfig).where(DataSourceConfig.code == payload.code))
    if code_exists is not None:
        raise HTTPException(status_code=409, detail="datasource code already exists")

    row = DataSourceConfig(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.get("/{datasource_id}", response_model=DataSourceOut)
def get_datasource(datasource_id: int, db: Session = Depends(get_db)) -> DataSourceOut:
    _refresh_datasources(db)
    row = _get_datasource_or_404(db, datasource_id)
    return _to_out(row)


@router.post("/{datasource_id}/test-connection")
def test_connection(datasource_id: int, db: Session = Depends(get_db)) -> dict:
    _refresh_datasources(db)
    _get_datasource_or_404(db, datasource_id)
    return {"datasource_id": datasource_id, "status": "ok", "latency_ms": 126}


@router.get("/{datasource_id}/schema")
def get_field_schema(datasource_id: int, db: Session = Depends(get_db)) -> dict:
    _refresh_datasources(db)
    _get_datasource_or_404(db, datasource_id)
    return {
        "datasource_id": datasource_id,
        "fields": ["raw_id", "msg", "ext.user.uid", "ext.order.brand", "event_time"],
    }


@router.post("/{datasource_id}/mapping/preview")
def preview_mapping(datasource_id: int, payload: MappingPreviewRequest, db: Session = Depends(get_db)) -> dict:
    _refresh_datasources(db)
    _get_datasource_or_404(db, datasource_id)
    return {
        "datasource_id": datasource_id,
        "preview": {
            "source_id": payload.sample_payload.get("raw_id", "NA"),
            "content_text": payload.sample_payload.get("msg", ""),
            "brand_name": payload.sample_payload.get("ext", {}).get("order", {}).get("brand", "UNKNOWN"),
        },
    }
