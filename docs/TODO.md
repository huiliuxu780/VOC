# Project TODO

Last updated: 2026-04-02 (API contract snapshot CI enabled)

## P0 - Core Delivery

- [x] Persist config modules to database instead of in-memory arrays.
  Scope: `datasource`, `labels`, `prompts`, `jobs` config CRUD.
  Done on: 2026-04-01.
  Delivered: datasource/jobs API config storage switched from in-memory arrays to DB tables with startup-safe seed + validation.
- [x] Complete end-to-end Prompt management flow.
  Done on: 2026-04-01.
  Delivered: backend DB CRUD + publish/test + frontend list/editor/test integration.
- [x] Complete end-to-end Label management flow.
  Done on: 2026-04-01.
  Delivered: backend DB CRUD + move/delete + frontend list/detail/editor integration.
- [x] Complete end-to-end Pipeline designer flow.
  Done on: 2026-04-01.
  Delivered: backend job pipeline config GET/PUT + frontend job-scoped load/edit/save integration.

## P1 - Platform Capability

- [x] Implement missing APIs defined in design doc.
  Done on: 2026-04-01.
  Delivered: `/monitoring/queues` + `/monitoring/apis` + `/settings/models` (`GET/PUT`) implemented and routed.
- [x] Replace pipeline mock with staged execution service.
  Done on: 2026-04-01.
  Delivered: `run_pipeline_mock` replaced by background staged executor; trigger + run retry + single-failure retry now all schedule staged execution.
- [x] Add backend unit/integration tests for critical APIs.
  Done on: 2026-04-01.
  Delivered: `backend/tests/test_pipeline_execution_service.py` + `backend/tests/test_monitoring_settings_apis.py`, covering staged pipeline execution and monitoring/settings critical APIs.
- [x] Add frontend component/page tests for key workflows.
  Done on: 2026-04-01.
  Delivered: lightweight Vitest test baseline + workflow-focused tests for API client, pipeline store, and page helper logic (Prompt/Label/Pipeline).

## P2 - Engineering Quality

- [x] Unify frontend dropdown style with shared dark select component.
  Done on: 2026-04-01.
  Delivered: replace all native `<select>` usage with shared `Select` component and verify globally.
- [x] Fix encoding issues in design doc and keep one clean Chinese version.
  Done on: 2026-04-02.
  Delivered: verified `docs/voc-ai-labeling-platform-design.md` as UTF-8 clean Chinese baseline, added explicit encoding/canonical-version note to prevent future drift.
- [x] Add changelog/release notes hygiene (template + update discipline).
  Done on: 2026-04-02.
  Delivered: added `CHANGELOG.md`, `docs/release-notes-template.md`, and updated `docs/release-runbook.md` + `README.md` to enforce changelog-first release discipline.
- [x] Add API contract snapshot checks to CI (schema drift guard).
  Done on: 2026-04-02.
  Delivered: added OpenAPI snapshot checker script + baseline snapshot + dedicated GitHub Actions workflow (`API Contract Check`) with drift artifact upload.

## Ongoing Rules

- Keep this file as the single source of truth for pending work.
- Update statuses when a task starts/completes.
- Add date and owner when a task moves to in-progress.
