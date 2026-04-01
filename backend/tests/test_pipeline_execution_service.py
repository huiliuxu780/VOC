from __future__ import annotations

from datetime import datetime
from time import sleep
from uuid import uuid4

from sqlalchemy import desc, func, select

from app.api.v1.jobs import DEFAULT_STAGES, list_jobs, retry_run, retry_single_failure, trigger_job
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.models.runtime import JobRun, JobRunStage, RunFailureDetail


def _wait_for_terminal_run(run_id: str, timeout_seconds: float = 15.0, step_seconds: float = 0.25) -> JobRun:
    deadline = datetime.utcnow().timestamp() + timeout_seconds
    last_status = "<missing>"
    while datetime.utcnow().timestamp() < deadline:
        with SessionLocal() as db:
            run = db.scalar(select(JobRun).where(JobRun.run_id == run_id))
            if run is not None:
                last_status = run.status
                if run.status in {"success", "partial_success", "failed"}:
                    db.expunge(run)
                    return run
        sleep(step_seconds)
    raise AssertionError(f"run {run_id} did not reach terminal status in time (last_status={last_status})")


def _get_first_job_id() -> int:
    init_db()
    with SessionLocal() as db:
        jobs = list_jobs(db)
        assert jobs, "expected at least one job config"
        return jobs[0].id


def test_trigger_job_runs_staged_pipeline_to_terminal() -> None:
    job_id = _get_first_job_id()

    with SessionLocal() as db:
        trigger_result = trigger_job(job_id, db)
        run_id = trigger_result.run_id

    final_run = _wait_for_terminal_run(run_id)
    assert final_run.status in {"success", "partial_success"}
    assert final_run.ended_at is not None
    assert final_run.total_input > 0
    assert final_run.success_count + final_run.failed_count == final_run.total_input

    with SessionLocal() as db:
        stages = db.scalars(select(JobRunStage).where(JobRunStage.run_id == run_id).order_by(JobRunStage.id)).all()
        failures_count = int(
            db.scalar(select(func.count()).select_from(RunFailureDetail).where(RunFailureDetail.run_id == run_id)) or 0
        )

    assert len(stages) == len(DEFAULT_STAGES)
    assert all(stage.status == "success" for stage in stages)
    if final_run.failed_count > 0:
        assert failures_count > 0


def test_retry_run_uses_staged_pipeline_execution() -> None:
    job_id = _get_first_job_id()

    with SessionLocal() as db:
        trigger_result = trigger_job(job_id, db)
        base_run_id = trigger_result.run_id

    _wait_for_terminal_run(base_run_id)

    with SessionLocal() as db:
        retry_result = retry_run(base_run_id, db)
        new_run_id = retry_result["new_run_id"]
        assert retry_result["status"] == "queued"

    retried_run = _wait_for_terminal_run(new_run_id)
    assert retried_run.status in {"success", "partial_success"}
    assert retried_run.total_input > 0


def test_retry_single_failure_schedules_and_completes_retry_run() -> None:
    job_id = _get_first_job_id()
    run_id = f"RUN-TEST-{uuid4().hex[:10]}"
    record_id = f"REC-TEST-{uuid4().hex[:8]}"

    with SessionLocal() as db:
        db.add(
            JobRun(
                run_id=run_id,
                job_id=job_id,
                status="partial_success",
                total_input=1,
                success_count=0,
                failed_count=1,
                started_at=datetime.utcnow(),
                ended_at=datetime.utcnow(),
            )
        )
        for stage_name in DEFAULT_STAGES:
            db.add(JobRunStage(run_id=run_id, stage_name=stage_name, status="success", duration_ms=200))
        db.add(
            RunFailureDetail(
                run_id=run_id,
                record_id=record_id,
                category="model_error",
                node="label_classify",
                error_type="timeout",
                detail="test failure record",
                input_payload={"text": "sample"},
                output_payload={"error": "timeout"},
            )
        )
        db.commit()

    with SessionLocal() as db:
        retry_result = retry_single_failure(run_id, record_id, db)
        retry_run_id = retry_result["retry_run_id"]
        assert retry_result["status"] == "queued"

        updated_failure = db.scalar(
            select(RunFailureDetail)
            .where(RunFailureDetail.run_id == run_id, RunFailureDetail.record_id == record_id)
            .order_by(desc(RunFailureDetail.id))
        )
        assert updated_failure is not None
        assert updated_failure.retry_status == "queued"
        assert updated_failure.retry_run_id == retry_run_id

    single_retry_run = _wait_for_terminal_run(retry_run_id)
    assert single_retry_run.status in {"success", "partial_success"}
