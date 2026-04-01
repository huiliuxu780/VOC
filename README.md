# VOC AI Labeling Platform (MVP)

本仓库中的开发代理与协作者，默认需要遵循仓库根目录下的 `AGENTS.md`。

This repository contains a front-end and back-end MVP for VOC labeling operations.

- Frontend: `frontend/` (React + Vite + Tailwind)
- Backend: `backend/` (FastAPI + SQLAlchemy)

## MVP Trial (One Command)

Start both services:

```powershell
.\run-mvp.ps1
```

Stop both services:

```powershell
.\stop-mvp.ps1
```

Run smoke check (health + key APIs + alert flow):

```powershell
.\smoke-mvp.ps1
```

Skip alert lifecycle mutation in smoke check:

```powershell
.\smoke-mvp.ps1 -SkipAlertFlow
```

Run release checklist (build + smoke + API snapshots):

```powershell
.\release-check.ps1
```

By default, the checklist runs smoke with `-SkipAlertFlow` and writes artifacts under `.release-check/<timestamp>/`.

Run release checklist and include alert lifecycle mutation:

```powershell
.\release-check.ps1 -RunAlertFlow
```

Prepare/create release tag:

```powershell
.\release-tag.ps1 -Version v0.2.0 -RunReleaseCheck -DryRun
.\release-tag.ps1 -Version v0.2.0 -RunReleaseCheck
.\release-tag.ps1 -Version v0.2.0 -PushTag
```

## CI

- `MVP Smoke Check`: runs on `push/pull_request` to `main`
- `API Contract Check`: runs on `push/pull_request` to `main` and checks OpenAPI snapshot drift
- `Release Check`: runs on version tags (`v*`) or manually via GitHub Actions

Run API contract snapshot check locally:

```powershell
python backend/scripts/check_openapi_snapshot.py --baseline backend/contracts/openapi.snapshot.json
```

Release runbook: `docs/release-runbook.md`
Changelog: `CHANGELOG.md`
Release notes template: `docs/release-notes-template.md`
Project TODO board: `docs/TODO.md`

Default URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:8000`
- Health: `http://127.0.0.1:8000/health`

## Manual Start

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

If dependency install is slow:

```powershell
cd frontend
powershell -ExecutionPolicy Bypass -File .\setup-deps.ps1 -NoAudit
```

### Backend

Recommended (auto Python path resolution):

```powershell
.\start-api.ps1 -Port 8000
```

Alternative:

```powershell
cd backend
pip install -e .
python -m uvicorn app.main:app --reload --port 8000
```

## API Prefixes

- `/api/v1/datasources`
- `/api/v1/labels`
- `/api/v1/prompts`
- `/api/v1/jobs`
- `/api/v1/monitoring`
- `/api/v1/settings`

## Current MVP Capabilities

- Job trigger and run monitoring
- Failure list with filters/sort/pagination/export
- Single-item retry and run retry
- Failure detail drawer with node timeline and IO diff highlights
