import { gtmAddToCart, gtmAddToCartItems } from './gtm';
import { phAddToCart } from './posthog';

/**
 * add_to_cart for one product: GTM dataLayer (-> GA4 + Meta via sGTM) and PostHog.
 * Call it next to every useCartStore.addItem() for a paid item (never for free gifts).
 */
export const trackAddToCart = (product: any, quantity = 1) => {
  if (!product) return;
  gtmAddToCart(product, quantity);
  phAddToCart(product, quantity);
};

/**
 * Several products added with one click (bundle, "add all"): one GTM add_to_cart
 * event carrying every line, and one PostHog event per product.
 */
export const trackAddToCartGroup = (
  contentName: string,
  lines: { product: any; quantity: number }[],
) => {
  const valid = lines.filter((l) => l.product && l.quantity > 0);
  if (!valid.length) return;
  // price: undefined -> gtm.ts uses the selling price (salePrice - discount), same as gtmAddToCart.
  gtmAddToCartItems(contentName, valid.map((l) => ({ ...l.product, price: undefined, quantity: l.quantity })));
  valid.forEach((l) => phAddToCart(l.product, l.quantity));
};
