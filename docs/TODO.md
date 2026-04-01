# Project TODO

Last updated: 2026-04-01 (Prompt + Label flow completed)

## P0 - Core Delivery

- [ ] Persist config modules to database instead of in-memory arrays.
  Scope: `datasource`, `labels`, `prompts`, `jobs` config CRUD.
  Progress: `prompts/labels` completed; `datasource/jobs config` still in-memory.
- [x] Complete end-to-end Prompt management flow.
  Done on: 2026-04-01.
  Delivered: backend DB CRUD + publish/test + frontend list/editor/test integration.
- [x] Complete end-to-end Label management flow.
  Done on: 2026-04-01.
  Delivered: backend DB CRUD + move/delete + frontend list/detail/editor integration.
- [ ] Complete end-to-end Pipeline designer flow.
  Scope: save/load pipeline config per job + frontend integration.
  Current state: local zustand-only state.

## P1 - Platform Capability

- [ ] Implement missing APIs defined in design doc.
  Candidates: `/monitoring/queues`, `/monitoring/apis`, `/settings/models`.
- [ ] Replace pipeline mock with staged execution service.
  Current state: `run_pipeline_mock` placeholder.
- [ ] Add backend unit/integration tests for critical APIs.
- [ ] Add frontend component/page tests for key workflows.

## P2 - Engineering Quality

- [ ] Fix encoding issues in design doc and keep one clean Chinese version.
- [ ] Add changelog/release notes hygiene (template + update discipline).
- [ ] Add API contract snapshot checks to CI (schema drift guard).

## Ongoing Rules

- Keep this file as the single source of truth for pending work.
- Update statuses when a task starts/completes.
- Add date and owner when a task moves to in-progress.
