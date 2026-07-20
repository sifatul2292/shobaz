# CURRENT_WORK.md

Living status file. Update after meaningful progress. Snapshot date: 2026-07-20.

## Branch
`feature/notebook-free-gift-offer` (stock management is pushed through `fa2eff2`; incomplete-order persistence fix is currently uncommitted).

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
Incomplete-order Fraud Checker/Admin Note persistence is fixed and verified locally but remains uncommitted. The branch also holds the earlier free-gift + tagging + courier + consultancy work and is not yet merged to `origin/main`.

## Homepage hero refinement (2026-07-20)
- Removed the Exclusive Bundles sales-card section from the homepage only; the bundle product routes and header links remain available.
- Rebuilt the hero as a responsive editorial split featuring Edভেঞ্চার, Road to Corporate, and Productive Muslim with direct product links, live catalog price/image overrides, and reliable production-image fallbacks.
- Added Noto Serif Bengali for the hero display type while retaining the existing Bengali body typeface and site header/footer.
- Added scoped hero tokens and CSS with explicit keyboard, active, reduced-motion, and 320/375/414/768 px responsive behavior.
- Refined the desktop proportions after visual review: the hero headline now caps at 50px, the product rail caps at 544px, and the desktop hero height is reduced to keep the composition balanced.
- Checks: frontend production build passed; browser checks confirmed all three covers load, Noto Serif Bengali is applied, the removed bundle section is absent, CTA labels stay on one line, and no horizontal overflow occurs from 320 through 1920 px. `npx tsc --noEmit` remains blocked by the pre-existing unsupported `eslint` property in `next.config.ts`; `npm run lint` remains blocked because Next.js 16 no longer supports the configured `next lint` command.

## Homepage product-card refinement (2026-07-20)
- Replaced the bulky inline homepage book cards with a reusable modern-minimal card: quieter discount tab, edge-to-edge cover stage, compact price rail, 44px cart control, and accessible wishlist behavior.
- Added explicit default, hover, focus, active, disabled, loading, error, and success treatments plus a standalone state preview component; preserved the existing product data, links, wishlist request, and cart store while replacing the redundant cart-success toast with inline confirmation.
- Checks: frontend production build passed; browser checks confirmed all eight local product covers load, the add-to-cart success state appears, controls remain 44×44px, and no horizontal overflow occurs at 320/375/414/768px. `npx tsc --noEmit` remains blocked only by the pre-existing unsupported `eslint` property in `next.config.ts`; `npm run lint` remains blocked because Next.js 16 no longer supports the configured `next lint` command.

## Product image upload URL fix (2026-07-20)
- Fixed production uploads generating malformed `httpss://api.shobaz.com/...` URLs after Express proxy trust made `req.protocol` return `https`; upload URLs now respect forwarded protocol/host headers without appending a second `s`.
- Applied the corrected base URL builder to single/multiple image uploads, WebP conversion responses, file uploads, and matching delete paths.
- Added compatibility normalization for existing malformed gallery and product image URLs, including admin product reads, storefront product lists/details, and subsequent product updates. The four affected Productive Muslim files were verified live as intact HTTP 200 JPEG/WebP files when addressed with the corrected scheme.
- Added regression tests in `backend/src/pages/upload/file-upload.utils.spec.ts` and `backend/src/shared/utils/media-url.utils.spec.ts`.
- Checks: `cd backend && npm test -- --runInBand` passed (2 suites, 7 tests); `npm run build` passed; `git diff --check` passed. `npm run lint` still fails before linting because the configured glob is fully ignored (existing repository configuration issue).
- Production still needs the updated backend deployed/restarted before new uploads and the compatibility repair take effect.

## Incomplete-order persistence fix (2026-07-18)
- Fixed Fraud Checker and Admin Note saves using the normal-order update endpoint while viewing incomplete orders. The page now routes those writes to `/api/order/update-incomplete-order-by-id/:id`, so they update the `incompleteorders` collection that reloads populate from.
- Added shared response validation so the page no longer shows a false success when an update returns a non-2xx response, invalid JSON, or `success !== true`.
- The backend incomplete update now returns the saved document and reports a missing record instead of returning success unconditionally.
- End-to-end local smoke test created a disposable incomplete record, saved both fields via HTTP, reloaded it via HTTP, confirmed both persisted, and deleted the test record.

## Stock management (2026-07-18)
- Added the Stock Management view to both served `custom-orders.html` copies with product search, low-stock filtering, summary counts, responsive product cards, stock +/- controls, debounced autosave, low-stock thresholds, restock entry, movement history, pagination, and demand metrics.
- Added admin-only product stock APIs for listing, manual adjustment, restock purchases, and movement history. Product cards are ranked by `totalSold` and show sold today, sold in the last 30 days, and a blended next-30-days forecast.
- Added independent nullable `stock` tracking to products (`null` means not tracked), plus stock movement and purchase collections. Restocking a previously untracked product initializes its stock safely.
- New orders decrement tracked stock and write an order movement. Cancel/refund/return restores stock once using `stockDecremented` / `stockRestocked` idempotency flags.
- Authenticated local API smoke test returned all 69 products, populated all three sales-metric fields, and successfully loaded low/out summary and movement-history routes. The local database has no orders newer than 2026-04-19, so current-day/30-day metrics correctly return zero locally.

## Profit dashboard data fix (2026-07-18)
- Replaced the blocked `prompt()` authentication fallback with an in-page admin login and automatic expired-session recovery; API failures now show an actionable error instead of silently looking like an empty sales range.
- Fixed the profit aggregation dropping orders with empty `orderedItems` arrays by preserving those orders for revenue, delivery, and order counts while calculating product cost when item details exist.
- Made all analytics ranges use explicit Asia/Dhaka day boundaries, and added product quantity/price fallbacks for older order records.
- Fixed preset date buttons to pass their clicked element explicitly instead of relying on the non-standard global `event`; local date inputs no longer use UTC conversion.
- Authenticated endpoint smoke test for April 2026 returned 54 orders across 13 days, ৳49,400 revenue, 20 top-product rows, and 7 product-detail days. The old aggregation returned only 12 orders across the full local database because it discarded empty item arrays.

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
- `cd backend && npm run build` after the incomplete-order persistence fix — passed.
- Both custom-orders inline JavaScript copies parsed with `new Function`; `git diff --check` — passed.
- Disposable-record save/reload smoke test for `adminNote` and `fraudChecker` — both persisted; test data removed afterward.
- `cd backend && npm run lint` — still fails before linting because the configured glob is fully ignored; `npm test -- --runInBand` — no test files found.
- `cd backend && npm run build` after the stock implementation — passed.
- Authenticated stock API smoke test (`stock-list`, low/out summaries, movement history) — HTTP 200; 69 products and sales-metric fields returned.
- Direct Mongo shape check — 69 products, 35 already stock-tracked; order product IDs are stored as ObjectIds and resolve to products. Latest local order is 2026-04-19.
- Both custom-orders inline JavaScript copies parsed with `new Function`; `git diff --check` — passed.
- Compiled backend startup on port 4000 — passed; Nest registered the new stock routes and connected to Mongo.
- `cd backend && npm run lint` — still fails before linting because the configured glob is fully ignored (existing repository configuration issue).
- `cd backend && npm run build` after the data fixes — passed.
- Authenticated local API smoke test for `profit-analytics`, `top-products`, and `products-sold` — all returned HTTP 200 with populated data.
- Direct Mongo aggregation comparison — confirmed `preserveNullAndEmptyArrays` restores 1,769 non-cancelled local orders versus 12 in the old pipeline.
- Local dashboard browser check — in-page login rendered correctly with no new console errors; the previous unsupported `prompt()` crash is removed.
- Dashboard inline JavaScript parse check and `git diff --check` after the fixes — passed.
- `cd backend && npm run lint` after the fixes — still fails before linting because the configured glob is fully ignored.
- `cd backend && npm test -- --runInBand` after the fixes — still reports no test files.
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
