# CURRENT_WORK.md

Living status file. Update after meaningful progress. Snapshot date: 2026-07-05.

## Branch
`feature/notebook-free-gift-offer` (ahead of `origin/main`; up to date with its own origin).

## Recently completed (merged history on this branch)
- Free-notebook gift campaign (see `src/lib/notebookOffer.ts`, `FreeNotebookPicker.tsx`, `GlobalFreeGiftModal.tsx`).
- Removed notebook free-shipping rule (`f4e1ccd`).
- Checkout optional email field → Meta CAPI + order-success + admin popup (`46a687d` etc.).
- Meta CAPI hardening: `external_id`, `_fbp`/`_fbc` on all events; GA4-to-sGTM twin sharing `event_id`; server-side PageView hard-disabled.
- Server-side tagging moved onto Tagioo GTM containers; gtm.js from googletagmanager.com; first-party loader via `/tagioo-loader` (`7d7d13d`, `b570319`, `d7ecf0d`).
- Courier: added MetroWings provider alongside Steadfast; multiple robustness fixes (unwrap depth, empty-response guards, address padding, quantity in item_desc); removed send-to-courier confirm popup.

## In progress (uncommitted working tree vs origin/main — the free-gift feature)
Changed files of note (see `git diff --stat origin/main...HEAD`):
- `frontend/src/lib/notebookOffer.ts` — campaign eligibility logic (NEW).
- `frontend/src/components/common/FreeNotebookPicker.tsx` (NEW) — UI to pick the free notebook.
- `frontend/src/components/common/GlobalFreeGiftModal.tsx` (NEW) — global modal prompting the free gift.
- `frontend/src/store/useCartStore.ts` — cart integration of free-gift item (`isFreeGift` flag).
- `frontend/src/app/cart/page.tsx`, `checkout/page.tsx`, `order-success/page.tsx` — free-gift surfacing + email field.
- `frontend/src/app/notebook-bundle/NotebookBundleClient.tsx` — large rework (~591 lines) + `page.tsx`; new offer-gallery webp images under `public/images/notebook-bundle/offer-gallery/`.
- `frontend/src/lib/gtm.ts` — heavy churn (Tagioo routing); `frontend/src/lib/capi.ts` largely removed (−89).
- `frontend/src/components/common/GTMRouteTracker.tsx`, `layout.tsx`, `Header.tsx`, `HomeClient.tsx`, `ProductDetailClient.tsx` — tagging wiring.
- Backend: `pages/gtm/*`, `shared/analytics/*`, `shared/courier/*`, `pages/payment/payment.service.ts`, `pages/sales/order/order.service.ts`, `shared/utils/utils.service.ts`, `main.ts`, `app.module.ts`, config templates.

### Untracked (not committed) local artifacts — review before committing
- `.claude/skills/` (agent skills), `frontend/package-lock.json` (should likely be committed), `frontend/posthog-setup-report.md` (wizard report, keep as doc).
- `tools/` (product-importer CLI — check if intended to be tracked).
- `backend/upload/invoice/invoice-0072.pdf`, `-0073.pdf` (generated invoices — likely should be git-ignored, not committed).
- `admin/dist/.../logo.png.bak`, `favicon.png.bak` (stray backups — safe to delete, do NOT commit).
- Modified: `.claude/launch.json`, `frontend/tsconfig.tsbuildinfo` (build artifact — should be git-ignored).

## Known bugs / incomplete / TODOs
- Analytics/CAPI stack was iterated rapidly — verify no duplicate Meta/GA4 events after any tagging change (browser network + PostHog).
- `frontend/tsconfig.tsbuildinfo` and generated invoice PDFs are showing in git status — .gitignore likely needs entries.
- Frontend build ignores TS/lint errors — real type errors may be hiding.

## Commands run this session + results
- `git status`, `git branch`, `git log`, `git diff --stat origin/main...HEAD` — inspected only. No build/test/lint run yet this session.

## Next recommended tasks for Codex (safest first)
1. **Verify free-gift eligibility logic** in `notebookOffer.ts` against edge cases (exactly 500 taka, exactly 2 notebooks, free gift excluded from triggers, single free gift cap). Add/keep pure-function unit coverage — this module is dependency-free and easy to test.
2. Type-check frontend: `cd frontend && npx tsc --noEmit` — surface errors the build hides; fix within the free-gift files only.
3. Clean git hygiene: add `frontend/tsconfig.tsbuildinfo`, `backend/upload/invoice/*.pdf`, `*.bak` to `.gitignore`; decide tracking for `tools/` and `frontend/package-lock.json`. Do not commit the `.pdf`/`.bak` artifacts.
4. Confirm `frontend/package-lock.json` should be committed (npm is the FE package manager) and commit it if so.

## Do NOT touch / be careful
- `src/lib/gtm.ts`, `capi` remnants, backend `pages/gtm/*` + `shared/analytics/*`, and the Tagioo/sGTM webhook config — analytics is fragile; changes double-fire events. Only touch with explicit intent + browser verification.
- `admin/dist/**` — compiled Angular, no source to rebuild; edit only if unavoidable.
- MetroWings courier defensive code (unwrapping/padding) — do not "simplify" away the guards.
- Do not reintroduce the notebook free-shipping rule (deliberately removed).
- Do not commit generated invoices, `.bak` files, or `tsconfig.tsbuildinfo`.
