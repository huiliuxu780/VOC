from fastapi import APIRouter, HTTPException

from app.schemas.datasource import DataSourceCreate, DataSourceOut, MappingPreviewRequest

router = APIRouter()
_datasources: list[DataSourceOut] = [
    DataSourceOut(id=1, name="电商评论 HTTP 拉取", code="DS_HTTP_001", source_type="HTTP", owner="Growth", enabled=True),
    DataSourceOut(id=2, name="安装回访 Excel 导入", code="DS_EXCEL_001", source_type="Excel", owner="Ops", enabled=False),
]


@router.get("", response_model=list[DataSourceOut])
def list_datasources() -> list[DataSourceOut]:
    return _datasources


@router.post("", response_model=DataSourceOut)
def create_datasource(payload: DataSourceCreate) -> DataSourceOut:
    new_item = DataSourceOut(id=len(_datasources) + 1, **payload.model_dump())
    _datasources.append(new_item)
    return new_item


@router.get("/{datasource_id}", response_model=DataSourceOut)
def get_datasource(datasource_id: int) -> DataSourceOut:
    for item in _datasources:
        if item.id == datasource_id:
            return item
    raise HTTPException(status_code=404, detail="datasource not found")


@router.post("/{datasource_id}/test-connection")
def test_connection(datasource_id: int) -> dict:
    return {"datasource_id": datasource_id, "status": "ok", "latency_ms": 126}


@router.get("/{datasource_id}/schema")
def get_field_schema(datasource_id: int) -> dict:
    return {
        "datasource_id": datasource_id,
        "fields": ["raw_id", "msg", "ext.user.uid", "ext.order.brand", "event_time"],
    }


@router.post("/{datasource_id}/mapping/preview")
def preview_mapping(datasource_id: int, payload: MappingPreviewRequest) -> dict:
    return {
        "datasource_id": datasource_id,
        "preview": {
            "source_id": payload.sample_payload.get("raw_id", "NA"),
            "content_text": payload.sample_payload.get("msg", ""),
            "brand_name": payload.sample_payload.get("ext", {}).get("order", {}).get("brand", "UNKNOWN"),
        },
    }
