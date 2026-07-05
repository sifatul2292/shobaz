# AGENTS.md

Instructions for any coding assistant (Claude Code, Codex, etc.) working in this repo. Shared source of truth.

## Before editing
1. Read `PROJECT_CONTEXT.md` and `CURRENT_WORK.md` first.
2. Run `git status` and inspect relevant diffs (`git diff`, `git diff --stat origin/main...HEAD`) before making changes.
3. Preserve existing user work — do not overwrite or revert unrelated changes in the working tree. This repo has an in-progress feature branch and uncommitted work.

## While editing
- Follow existing code style, architecture, and naming conventions (NestJS module pattern in `backend/src/pages/*`; Next App Router `page.tsx` + `*Client.tsx` split in `frontend/src/app/*`).
- Keep changes focused and minimal — one concern per change. No drive-by refactors.
- npm is the package manager for both `frontend/` and `backend/` (no root package.json; install per app).
- Do not commit generated artifacts (`tsconfig.tsbuildinfo`, `dist/`, invoice PDFs, `*.bak`).

## High-risk areas — touch only with explicit intent
- Analytics / server-side tagging: `frontend/src/lib/gtm.ts`, CAPI code, backend `pages/gtm/*` and `shared/analytics/*`, Tagioo/sGTM webhook config. Verify no duplicate Meta/GA4 events after any change.
- `admin/dist/**` — compiled Angular, no source in repo.
- MetroWings courier guards in `backend/src/shared/courier/`.

## After edits — run relevant checks
- Frontend type check: `cd frontend && npx tsc --noEmit` (build hides TS/lint errors — this catches them).
- Frontend lint: `cd frontend && npm run lint`.
- Frontend build: `npm run build`.
- Backend: `cd backend && npm run lint && npm test && npm run build`.
- Run only what's relevant to the change; report actual results (including failures).

## After meaningful progress
- Update `CURRENT_WORK.md`: what you completed, files changed and why, commands run + results, new TODOs, anything the next agent must avoid.

## Git
- Do not commit or push unless the user asks.
- If on the default branch, create a feature branch first.
- End commit messages with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
