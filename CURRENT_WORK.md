# CURRENT_WORK.md

Living status file. Update after meaningful progress. Snapshot date: 2026-07-18.

## Branch
`feature/notebook-free-gift-offer` (ahead of `origin/main`; profit-dashboard port is uncommitted).

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
Profit dashboard port is implemented and verified locally but remains uncommitted. The branch also holds the earlier free-gift + tagging + courier + consultancy work and is not yet merged to `origin/main`.

## Completed this session (2026-07-18)
- Ported the Amolbooks profit dashboard to Shobaz, preserving its day-wise profit analytics, date ranges, revenue calendar, expandable daily products, top-products ranking, manual Meta ad spend, Meta OAuth/spend sync, and WhatsApp/phone sale entry.
- Added admin-only dashboard and Meta Ads API routes plus `ManualSale`, `MetaAdSpend`, and `MetaToken` persistence.
- Added the Shobaz-branded static dashboard at `backend/upload/static/profit-dashboard.html` and linked it from both custom-orders copies.
- Added `META_APP_ID`, `META_APP_SECRET`, and the Shobaz callback URL to `backend/.env.example`; production still needs real Meta app credentials and the exact callback URL allowlisted in the Meta app.
- Kept analytics endpoints restricted to `super_admin` and `admin`; direct unauthenticated smoke requests return 401.

## Known bugs / incomplete / TODOs
- Analytics/CAPI stack iterated rapidly — verify no duplicate Meta/GA4 events after any tagging change (browser network + PostHog).
- Frontend build ignores TS/lint errors — real type errors may be hiding; run `npx tsc --noEmit` manually.
- No unit coverage on `notebookOffer.ts` eligibility logic yet.

## Commands run this session + results
- `cd backend && npm run build` — passed.
- `cd backend && npm run lint` — failed before linting because the configured glob is fully ignored (existing repository configuration issue).
- `cd backend && npm test -- --runInBand` — failed because the repository contains no `*.spec.ts` tests.
- Started compiled backend on port 4009 — passed; Nest registered the dashboard and Meta Ads routes and connected successfully.
- `GET /upload/static/profit-dashboard.html` smoke test — 200 with Shobaz branding.
- Unauthenticated dashboard and Meta status endpoint smoke tests — both 401 as expected.
- Dashboard inline JavaScript parse check and `git diff --check` — passed.
- `git status`, `git branch`, `git log`, `git diff --stat origin/main...HEAD`, `git ls-files` — inspected only. Tree clean, all committed. No build/test/lint run this session.

## Next recommended tasks for Codex (safest first)
1. Configure the production Meta app credentials and allowlist `https://api.shobaz.com/api/meta-ads/callback`, then connect from the profit dashboard and run the first spend sync.
2. Verify profit totals against a known production day, especially products without a `costPrice` (they contribute zero product cost, matching Amolbooks).
3. **Verify free-gift eligibility logic** in `notebookOffer.ts` against edge cases (exactly 500 taka, exactly 2 notebooks, free gift excluded from triggers, single free gift cap).

## Do NOT touch / be careful
- `src/lib/gtm.ts`, `capi` remnants, backend `pages/gtm/*` + `shared/analytics/*`, and the Tagioo/sGTM webhook config — analytics is fragile; changes double-fire events. Only touch with explicit intent + browser verification.
- `admin/dist/**` — compiled Angular, no source to rebuild; edit only if unavoidable.
- MetroWings courier defensive code (unwrapping/padding) — do not "simplify" away the guards.
- Do not reintroduce the notebook free-shipping rule (deliberately removed).
- Do not commit generated invoices, `.bak` files, or `tsconfig.tsbuildinfo`.
