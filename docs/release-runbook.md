# Release Runbook

This document standardizes how to create and publish MVP release tags.

## Prerequisites

- Work on `main` branch with a clean working tree.
- Dependencies installed for backend and frontend.
- MVP services can start locally (`.\run-mvp.ps1`).

## Standard Flow

1. Run release verification:

```powershell
.\release-check.ps1
```

2. Dry-run tag preparation and generate release notes draft:

```powershell
.\release-tag.ps1 -Version v0.2.0 -RunReleaseCheck -DryRun
```

3. Create local annotated tag:

```powershell
.\release-tag.ps1 -Version v0.2.0 -RunReleaseCheck
```

4. Push tag to GitHub (triggers `Release Check` workflow on tag):

```powershell
.\release-tag.ps1 -Version v0.2.0 -PushTag
```

## Outputs

- Release-check artifacts: `.release-check/<timestamp>/`
- Release notes draft: `.release-check/releases/<tag>.md`

## Safety Notes

- `release-tag.ps1` blocks tagging when worktree is dirty by default.
- `release-tag.ps1` blocks non-`main` branch by default.
- Use `-AllowDirty` or `-AllowNonMain` only when you intentionally need exceptions.
