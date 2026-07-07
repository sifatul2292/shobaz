# CURRENT_WORK.md

Living status file. Update after meaningful progress. Snapshot date: 2026-07-07.

## Branch
`feature/notebook-free-gift-offer` (ahead of `origin/main`; working tree clean — all work committed).

## Recently completed (merged history on this branch)
- Higher-education consultancy landing page (`bad5b85`).
- Agent docs added; `.gitignore` hardened; product-importer secrets hardened (`98634e0`).
- Free-notebook gift campaign (`src/lib/notebookOffer.ts`, `FreeNotebookPicker.tsx`, `GlobalFreeGiftModal.tsx`, `useCartStore.ts` `isFreeGift` flag; cart/checkout/order-success surfacing; `notebook-bundle` rework + offer-gallery webp images).
- Removed notebook free-shipping rule (`f4e1ccd`).
- Checkout optional email field → Meta CAPI + order-success + admin popup.
- Meta CAPI hardening: `external_id`, `_fbp`/`_fbc` on all events; GA4-to-sGTM twin sharing `event_id`; server-side PageView hard-disabled.
- Server-side tagging moved onto Tagioo GTM containers; gtm.js from googletagmanager.com; first-party loader via `/tagioo-loader` (`7d7d13d`, `b570319`, `d7ecf0d`).
- Courier: added MetroWings provider alongside Steadfast; robustness fixes (unwrap depth, empty-response guards, address padding, quantity in item_desc); removed send-to-courier confirm popup.
- `tools/product-importer/` CLI committed and tracked; `frontend/package-lock.json` tracked.

## In progress
None. Tree clean. Branch holds full free-gift + tagging + courier + consultancy work; not yet merged to `origin/main`.

## Known bugs / incomplete / TODOs
- Analytics/CAPI stack iterated rapidly — verify no duplicate Meta/GA4 events after any tagging change (browser network + PostHog).
- Frontend build ignores TS/lint errors — real type errors may be hiding; run `npx tsc --noEmit` manually.
- No unit coverage on `notebookOffer.ts` eligibility logic yet.

## Commands run this session + results
- `git status`, `git branch`, `git log`, `git diff --stat origin/main...HEAD`, `git ls-files` — inspected only. Tree clean, all committed. No build/test/lint run this session.

## Next recommended tasks for Codex (safest first)
1. **Verify free-gift eligibility logic** in `notebookOffer.ts` against edge cases (exactly 500 taka, exactly 2 notebooks, free gift excluded from triggers, single free gift cap). Add pure-function unit coverage — module is dependency-free and easy to test.
2. Type-check frontend: `cd frontend && npx tsc --noEmit` — surface errors the build hides; fix within the free-gift files only.
3. When branch stable, prep merge to `origin/main` (review the 83-file diff `origin/main...HEAD`).

## Do NOT touch / be careful
- `src/lib/gtm.ts`, `capi` remnants, backend `pages/gtm/*` + `shared/analytics/*`, and the Tagioo/sGTM webhook config — analytics is fragile; changes double-fire events. Only touch with explicit intent + browser verification.
- `admin/dist/**` — compiled Angular, no source to rebuild; edit only if unavoidable.
- MetroWings courier defensive code (unwrapping/padding) — do not "simplify" away the guards.
- Do not reintroduce the notebook free-shipping rule (deliberately removed).
- Do not commit generated invoices, `.bak` files, or `tsconfig.tsbuildinfo`.
