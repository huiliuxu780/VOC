from celery import Celery

from app.core.config import settings

celery_app = Celery("voc_worker", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.task_default_queue = "voc_jobs"


@celery_app.task(name="jobs.run_pipeline")
def run_pipeline_task(run_id: str) -> dict:
    return {"run_id": run_id, "status": "queued"}
