<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Shobaz bookstore (Next.js 16, App Router). Here is a summary of all changes made:

**New files created:**
- `instrumentation-client.ts` — Client-side PostHog initialization using Next.js 15.3+ instrumentation API. Initializes posthog-js with reverse proxy, error tracking, and debug mode.
- `src/lib/posthog-server.ts` — Singleton server-side PostHog client (posthog-node) for use in API routes or Server Actions.
- `frontend/.env.local` — PostHog environment variables (`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`).

**Modified files:**
- `next.config.ts` — Added PostHog reverse proxy rewrites (`/ingest/*`) and `skipTrailingSlashRedirect: true`.
- `src/app/login/page.tsx` — Added `posthog.identify()` and `posthog.capture('user_logged_in')` on successful login.
- `src/app/register/page.tsx` — Added `posthog.capture('user_registered')` on successful registration.
- `src/app/cart/page.tsx` — Added `product_removed_from_cart` on item removal and `cart_cleared` on full cart clear.
- `src/app/checkout/page.tsx` — Added `checkout_initiated` on page load, `order_placed` on success, `order_placement_failed` + `captureException` on error.
- `src/app/products/[slug]/ProductDetailClient.tsx` — Added `product_viewed` after product loads, `product_added_to_cart` in both add-to-cart and buy-now handlers.
- `src/components/common/ProductCard.tsx` — Added `product_added_to_cart` on the quick-add button.
- `src/components/layout/Header.tsx` — Added `product_searched` with query and result count on search submit.
- `src/app/wishlist/page.tsx` — Added `wishlist_item_added_to_cart` and `product_removed_from_wishlist`.

## Events

| Event | Description | File |
|-------|-------------|------|
| `user_logged_in` | User successfully logs in | `src/app/login/page.tsx` |
| `user_registered` | New user registers an account | `src/app/register/page.tsx` |
| `product_viewed` | User views a product detail page (top of funnel) | `src/app/products/[slug]/ProductDetailClient.tsx` |
| `product_added_to_cart` | User adds a product to cart from detail page | `src/app/products/[slug]/ProductDetailClient.tsx` |
| `product_added_to_cart` | User adds a product via quick-add on a card | `src/components/common/ProductCard.tsx` |
| `product_removed_from_cart` | User removes an individual item from cart | `src/app/cart/page.tsx` |
| `cart_cleared` | User clears all items from cart | `src/app/cart/page.tsx` |
| `checkout_initiated` | User reaches the checkout page with items | `src/app/checkout/page.tsx` |
| `order_placed` | User successfully places an order | `src/app/checkout/page.tsx` |
| `order_placement_failed` | Order submission fails | `src/app/checkout/page.tsx` |
| `product_searched` | User submits a search query | `src/components/layout/Header.tsx` |
| `wishlist_item_added_to_cart` | User moves a wishlist item to cart | `src/app/wishlist/page.tsx` |
| `product_removed_from_wishlist` | User removes a product from wishlist | `src/app/wishlist/page.tsx` |

## Next steps

We've built a dashboard and five insights to monitor user behavior based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1574753)
- [Purchase conversion funnel](/insights/oA3E2sSN) — 4-step funnel: Product Viewed → Added to Cart → Checkout Initiated → Order Placed
- [Orders placed over time](/insights/Rza1IkKM) — Daily order count, core revenue metric
- [User registrations & logins](/insights/TsWTZ0hk) — New sign-ups vs returning logins
- [Cart churn signals](/insights/hK9lNcm0) — Items removed and full cart clears
- [Search activity](/insights/F2LBQgrH) — Book search engagement over time

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
