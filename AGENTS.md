# Global Coding Preferences

## Frontend Default Rule
For any frontend/UI task (web, mobile, dashboard, landing page, component design), always apply the `ui-ux-pro-max` skill first.

## Frontend Quality Bar
- Follow the UI/UX Pro Max design system and reasoning workflow.
- Prefer intentional visual direction over boilerplate layouts.
- Ensure responsive behavior on desktop and mobile.
- Keep accessibility and readability as baseline requirements.

## Project Setup Behavior
If a project does not yet contain the local UIPro assets, run `npm exec --package uipro-cli -- uipro init --ai codex` in that project before implementing major UI work.

## Fixed Progress Protocol (For Long-Running Tasks)
- Start update: before work begins, report target, current step, and immediate next action.
- In-progress updates: after each key action, report what was done and what is next.
- Cadence: provide a short status update at least every 30-60 seconds during long chains.
- Blocker update: if blocked, report blocker reason, what has been tried, and the fallback options.
- Finish update: summarize changed files, validation results, and remaining TODOs.

## Progress Message Template
- `[Progress X%] Current action: <what I am doing>. Done: <what finished>. Next: <next step>.`

## Escalation Trigger
- If an action has non-obvious risk (data loss, irreversible operation, major architecture tradeoff), pause and align before execution.
