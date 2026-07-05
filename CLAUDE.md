# CLAUDE.md

Claude Code and Codex share one source of truth in this repo.

**Read [AGENTS.md](AGENTS.md) — it is the canonical instruction set.** Also read [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) and [CURRENT_WORK.md](CURRENT_WORK.md) before editing.

Quick reminders (full detail in AGENTS.md):
- `git status` + inspect diffs before changing anything; preserve existing uncommitted work.
- npm per app (`frontend/`, `backend/`); no root package.json.
- Frontend build ignores TS/lint errors — run `cd frontend && npx tsc --noEmit` manually.
- Fragile: analytics/GTM/CAPI (`src/lib/gtm.ts`, backend `pages/gtm`, `shared/analytics`), MetroWings courier guards, prebuilt `admin/dist`.
- Keep changes focused; update `CURRENT_WORK.md` after progress; commit/push only when asked.
