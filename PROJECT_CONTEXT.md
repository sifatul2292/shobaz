# PROJECT_CONTEXT.md

Shared source of truth for Claude Code and Codex working on this repo. Repo-specific; do not import assumptions from other projects.

## What this is
Shobaz — e-commerce platform selling books, notebooks, and course/bundle products online (Bangladesh market; currency = taka, BDT). Public storefront + customer accounts + admin dashboard.

Target users: book buyers, and the bookstore owner/staff (admin). Live domains: `shobaz.com` (and legacy `alambook.com`), API at `api.shobaz.com`, admin at `admin.shobaz.com`.

## Monorepo layout (no root package.json — each app installs separately)
- `frontend/` — Next.js 16 App Router storefront (the main active dev surface).
- `backend/` — NestJS 8 API + MongoDB.
- `admin/` — **prebuilt Angular SPA, `dist/` only** (no source in this repo). Served as static files by the backend and/or `serve`. Edit only compiled `dist/angular-ui/*` static HTML/JS if needed; there is no Angular source to rebuild here.
- `tools/product-importer/` — standalone Node CLI to bulk-import products (has its own node_modules, xlsx/axios based).
- `deploy/`, `deploy-shobaz.sh`, `ecosystem.config.js` — VPS deploy + PM2 config.

## Tech stack
### Frontend (`frontend/`)
- Next.js `16.2.3`, React `19`, App Router.
- Tailwind CSS v4 (`@tailwindcss/postcss`).
- State: Zustand (`src/store/useCartStore.ts`, `useAuthStore.ts`).
- Data: `@tanstack/react-query`, Axios (`src/lib/api.ts`).
- Auth token: `js-cookie`.
- Analytics: `posthog-js` + `posthog-node`; plus GTM/Meta CAPI/GA4 server-side tagging via Tagioo (`src/lib/gtm.ts`).
- Other: `react-hot-toast`, `react-icons`, `swiper`, `react-pdf`.
- Package manager: **npm** (lockfile: `frontend/package-lock.json`).

### Backend (`backend/`)
- NestJS `^8`, TypeScript `4.3`.
- MongoDB via `@nestjs/mongoose` + `mongoose ^6`.
- Auth: JWT (`@nestjs/jwt`, Passport `passport-jwt`) — separate user and admin secrets.
- Payments: `sslcommerz` (SSLCommerz gateway).
- PDF (invoices): `pdfkit` / `pdfmake`. Images: `sharp`. SMS + email (nodemailer + Gmail API via `googleapis`). Scheduled jobs: `node-schedule`. Sitemap generation.
- Package manager: **npm**.

### DevOps
- PM2 (`ecosystem.config.js`), Nginx, Cloudflare in front, Let's Encrypt/Certbot.
- Prod ports: backend `4000`, frontend `3003` (per ecosystem.config.js). Note README mentions 3001/3000 — the PM2 config is authoritative for prod.

## Install
```bash
cd backend && npm install
cd ../frontend && npm install
cd ../tools/product-importer && npm install   # only if using the importer
```

## Run locally
```bash
# Backend (watch)
cd backend && npm run start:dev          # nest start --watch

# Frontend (dev)
cd frontend && npm run dev               # next dev (default :3000)
```
`.claude/launch.json` preview configs: Frontend `npm run dev -p 3006`, Backend `node dist/main` :4000, Admin `serve admin/dist/angular-ui -p 3007 --single`.

Backend CORS whitelists localhost ports 3000–3009, 4000, 4200 — pick any of those for the frontend dev port or CORS blocks it.

## Checks (build / lint / test / format)
### Frontend
- Build: `npm run build`  (⚠️ `next.config.ts` sets `eslint.ignoreDuringBuilds: true` **and** `typescript.ignoreBuildErrors: true` — build does NOT gate on lint/types).
- Lint: `npm run lint` (`next lint`).
- Type check: `npx tsc --noEmit` (no dedicated script).
- No unit tests configured on frontend.
### Backend
- Build: `npm run build` (`nest build`, prebuild `rimraf dist`).
- Lint: `npm run lint` (eslint --fix).
- Format: `npm run format` (prettier).
- Tests: `npm test` (Jest, `*.spec.ts`), `npm run test:e2e`, `npm run test:cov`. Coverage config in package.json jest block.

## Deployment
VPS + PM2. `deploy-shobaz.sh` provisions server (set `DOMAIN`/`EMAIL` in the script). Manual: `npm run build` each app, then PM2 via `ecosystem.config.js` (`pm2 start ecosystem.config.js`). Nginx reverse-proxies. Backend serves the Angular admin SPA statically (see `backend/src/main.ts` — static middleware registered before the Nest router/global prefix; SPA fallback via `spa.filter.ts`).

## Backend architecture / data flow
- `src/main.ts` — bootstrap: CORS whitelist, `trust proxy` (Cloudflare/nginx forwarded IPs), gzip compression, URI versioning, 50mb JSON limit, static `/upload/static`, Angular admin SPA served before Nest router.
- `src/pages/*` — feature modules (REST). Notable: `sales/order`, `payment`, `cart`, `product`, `catalog`, `offers`, `pre-order`, `manuscript`, `blog`, `gallery`, `dashboard`, `admin`, `user`, `profile`, `otp`, `notification`, `gtm` (server tagging).
- `src/schema/` — Mongoose schemas. `src/dto/`, `src/guards/`, `src/decorator/`, `src/pipes/`, `src/enum/`, `src/interfaces/`.
- `src/shared/` — cross-cutting: `courier/` (Steadfast + MetroWings providers), `sslcommerz/`, `email/`, `bulk-sms/`, `fb-catalog/`, `analytics/`, `job-scheduler/`, `db-tools/`, `utils/`.
- `src/config/` — `configuration.ts` (git-ignored real config has an `.example.ts` template).

## Frontend architecture / data flow
- App Router pages in `src/app/*`: storefront (`[slug]`, `products`, `authors`, `publishers`, `blog`), commerce (`cart`, `checkout`, `order-success`, `wishlist`), account (`login`, `register`, `profile`), and campaign/bundle pages (`notebook-bundle`, `communication-bundle`, `finance-bundle`, `offers`). `admin` route exists on frontend too.
- `src/components/` — `common`, `home`, `layout`, `ui`.
- `src/lib/` — `api.ts` (axios instance), `cache.ts`, `posthog.ts`, `posthog-server.ts`, `gtm.ts` (server-side tagging bridge), `notebookOffer.ts` (free-gift campaign logic).
- `src/store/` — Zustand cart + auth.
- Cart persists client-side (Zustand); checkout hits backend, payment via SSLCommerz redirect, success → `order-success`.

## Analytics / server-side tagging (fragile, recently churned — read carefully)
- PostHog: client init in `frontend/instrumentation-client.ts`, server singleton `src/lib/posthog-server.ts`, reverse-proxied through Next rewrites `/ingest/*` (see `next.config.ts`). Events documented in `frontend/posthog-setup-report.md`.
- GTM / Meta CAPI / GA4: routed through **Tagioo** GTM containers (recent commits `7d7d13d`, `b570319`, `d7ecf0d`). Key rules baked into recent fixes:
  - All Meta CAPI / GA4 events go through Tagioo GTM containers, not ad-hoc calls.
  - `gtm.js` served from `googletagmanager.com` (NOT `track.shobaz.com`).
  - GTM loader served first-party via Tagioo's `/tagioo-loader` path.
  - Each pixel event fires a GA4-to-sGTM twin sharing one `event_id`; `external_id`, `_fbp`, `_fbc` attached to events; server-side PageView hard-disabled (was double-firing).
  - Backend `src/pages/gtm/*` + `src/shared/analytics/*` + `SGTM_PANEL_ORDER_WEBHOOK_*` env → server order webhook to sGTM panel.
- Treat any change touching `gtm.ts`, CAPI, or the GTM backend module as high-risk; these were fixed in a tight iteration loop.

## Courier integration
`backend/src/shared/courier/` — two providers: Steadfast and **MetroWings** (added `16e6b02`). MetroWings has known fragilities already hardened: response unwrapping depth, empty/malformed location lookups, `recipient_address` 10-char minimum padding, `quantity` in `item_desc`. Send-to-courier no longer shows a confirm popup.

## Environment variables (placeholders only — real values in git-ignored .env)
### Backend `.env` (template: `backend/.env.example`)
```
PORT=3001
PRODUCTION_BUILD=true
DB_PORT=27017
DB_NAME=shobaz
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
AUTH_SOURCE=admin
JWT_PRIVATE_KEY_USER=your_user_jwt_secret
JWT_PRIVATE_KEY_ADMIN=your_admin_jwt_secret
STORE_ID=your_store_id          # SSLCommerz
STORE_PASSWORD=your_store_password
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN  (+ _1 variants)
SMS_API_TOKEN / SMS_SID / SMS_USERNAME / SMS_SECRET / SMS_PASSWORD / SMS_ID
DRIVE_FOLDER_ID=your_google_drive_folder_id
GMAIL / ACCOUNT_GMAIL=your-email@gmail.com
SGTM_PANEL_ORDER_WEBHOOK_URL=https://sgtm.shobaz.com/api/orders/webhook
SGTM_PANEL_ORDER_WEBHOOK_SECRET=your_order_webhook_secret
SGTM_PANEL_TENANT_ID=your_tenant_id
```
Also `backend/src/config/configuration.ts` (template `configuration.example.ts`) — git-ignored.

### Frontend `.env.local` (template: `frontend/.env.example`)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=your_posthog_token
NEXT_PUBLIC_POSTHOG_HOST=your_posthog_host
```

## Key product flows / business rules
- **Free notebook gift campaign** (current branch, `src/lib/notebookOffer.ts`):
  - Eligible free notebook slugs: `for-every-heart-81`, `hexa-loading-46`, `blueandwhite`.
  - Unlocks on EITHER trigger: paid subtotal ≥ **500 taka**, OR ≥ **2** paid notebooks (tag `notebook`).
  - Max **1** free notebook per order; offers do NOT stack; the free gift never counts toward either trigger.
- Notebook free-shipping rule was **removed** (`f4e1ccd`) — do not reintroduce.
- Checkout has an optional email field, sent to Meta CAPI and shown on order success / admin popup.
- Bundle landing pages: `notebook-bundle`, `communication-bundle`, `finance-bundle`.
- Product URL: `/product/:slug` 301-redirects to `/:slug` (see next.config redirects).

## UI/design conventions
- Tailwind v4 utility-first; components under `src/components/{common,home,layout,ui}`.
- Toasts via `react-hot-toast`. Icons via `react-icons` (tree-shaken through `optimizePackageImports`).
- Client campaign components suffixed `*Client.tsx` (server page.tsx + client child pattern).

## Major decisions
- Admin ships as a prebuilt Angular bundle inside this repo (no source) — served statically by backend; `.gitignore` explicitly un-ignores `admin/dist/**`.
- Frontend build intentionally ignores TS + ESLint errors (ship-fast tradeoff) — CI does not catch type errors at build; run `tsc --noEmit` / `npm run lint` manually.
- Server-side tagging consolidated onto Tagioo GTM containers after duplicate/mis-hosted event problems.

## Known constraints / risks / gotchas / fragile areas
- **`frontend/next.config.ts` hides type + lint errors at build** — a broken build can still succeed. Always type-check manually before shipping.
- GTM / CAPI / analytics stack is fragile and recently thrashed — small changes cause double-fires or wrong hosts. See analytics section.
- MetroWings courier responses are inconsistent — keep the defensive unwrapping/padding.
- No frontend tests; backend tests exist but coverage is unknown — don't assume a green suite.
- `admin/` has no rebuild path in-repo; editing means patching compiled files.
- Two brand domains (shobaz.com + alambook.com) share the backend; CORS + image `remotePatterns` list both.
