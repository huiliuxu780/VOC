from fastapi import APIRouter

from app.api.v1 import datasource, jobs, label_nodes, label_taxonomies, labels, monitoring, prompts, settings

api_router = APIRouter()
api_router.include_router(datasource.router, prefix="/datasources", tags=["datasources"])
api_router.include_router(labels.router, prefix="/labels", tags=["labels"])
api_router.include_router(label_taxonomies.router, prefix="/label-taxonomies", tags=["label-taxonomies"])
api_router.include_router(label_nodes.router, prefix="/label-nodes", tags=["label-nodes"])
api_router.include_router(prompts.router, prefix="/prompts", tags=["prompts"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
