# Release Runbook

This document standardizes how to create and publish MVP release tags.

## Prerequisites

- Work on `main` branch with a clean working tree.
- Dependencies installed for backend and frontend.
- MVP services can start locally (`.\run-mvp.ps1`).
- `CHANGELOG.md` exists and has an up-to-date `[Unreleased]` section.

## Standard Flow

1. Update `CHANGELOG.md`:

- Move validated items from `[Unreleased]` into the target version section (`[vX.Y.Z] - YYYY-MM-DD`).
- Keep `[Unreleased]` section for next iteration.

2. Prepare release notes draft from template:

- Start from `docs/release-notes-template.md`.
- Fill highlights, user impact, risk/rollback, and validation summary.

3. Run release verification:

```powershell
.\release-check.ps1
```

4. Dry-run tag preparation and generate release notes draft:

```powershell
.\release-tag.ps1 -Version v0.2.0 -RunReleaseCheck -DryRun
```

5. Create local annotated tag:

```powershell
.\release-tag.ps1 -Version v0.2.0 -RunReleaseCheck
```

6. Push tag to GitHub (triggers `Release Check` workflow on tag):

```powershell
.\release-tag.ps1 -Version v0.2.0 -PushTag
```

## Outputs

- Release-check artifacts: `.release-check/<timestamp>/`
- Release notes draft: `.release-check/releases/<tag>.md`
- Changelog source of truth: `CHANGELOG.md`
- Release notes template: `docs/release-notes-template.md`

## Safety Notes

- `release-tag.ps1` blocks tagging when worktree is dirty by default.
- `release-tag.ps1` blocks non-`main` branch by default.
- Use `-AllowDirty` or `-AllowNonMain` only when you intentionally need exceptions.
- Do not publish release notes before changelog section and validation results are finalized.
