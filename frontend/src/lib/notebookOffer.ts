import api from '@/lib/api';
import { Product } from '@/types';

// ── Campaign config ───────────────────────────────────────────────────
// The three currently-published notebook designs eligible as the free gift.
export const FREE_NOTEBOOK_SLUGS = ['for-every-heart-81', 'hexa-loading-46', 'blueandwhite'];
export const FREE_NOTEBOOK_THRESHOLD = 500; // taka — paid subtotal that unlocks a free notebook
export const FREE_NOTEBOOK_MIN_QTY = 2; // notebooks bought that unlock a free notebook
export const NOTEBOOK_TAG = 'notebook';

// Minimal cart-item shape so this module never has to import the cart store
// (the store imports from here — keep the dependency one-directional).
export interface OfferCartItem {
  product: Product;
  quantity: number;
  isFreeGift?: boolean;
}

// ── Notebook detection ────────────────────────────────────────────────
export function hasNotebookTag(product: Product): boolean {
  const tags = (product as any)?.tags;
  if (!Array.isArray(tags)) return false;
  return tags.some((tag: any) => {
    const slug = typeof tag?.slug === 'string' ? tag.slug.toLowerCase() : '';
    const name = typeof tag?.name === 'string' ? tag.name.toLowerCase() : '';
    return slug === NOTEBOOK_TAG || name === NOTEBOOK_TAG;
  });
}

// ── Pricing helper (mirrors useCartStore getTotalPrice math) ──────────
function unitPrice(product: Product): number {
  const salePrice = product.salePrice || 0;
  const discount = product.discountAmount || 0;
  return discount > 0 ? salePrice - discount : salePrice;
}

// ── Eligibility ───────────────────────────────────────────────────────
// Paid items only — the free gift itself never counts toward either trigger.
const paidItems = (items: OfferCartItem[]) => items.filter((i) => !i.isFreeGift);

export function getPaidSubtotal(items: OfferCartItem[]): number {
  return paidItems(items).reduce((sum, i) => sum + unitPrice(i.product) * i.quantity, 0);
}

export function getPaidNotebookQty(items: OfferCartItem[]): number {
  return paidItems(items).reduce(
    (qty, i) => (hasNotebookTag(i.product) ? qty + i.quantity : qty),
    0,
  );
}

// Max 1 free notebook per order; offers do NOT stack. Either trigger qualifies.
export function isFreeNotebookEligible(items: OfferCartItem[]): boolean {
  return (
    getPaidNotebookQty(items) >= FREE_NOTEBOOK_MIN_QTY ||
    getPaidSubtotal(items) >= FREE_NOTEBOOK_THRESHOLD
  );
}

// Taka still needed to hit the spend threshold (0 once eligible by spend).
export function remainingForThreshold(items: OfferCartItem[]): number {
  return Math.max(0, FREE_NOTEBOOK_THRESHOLD - getPaidSubtotal(items));
}

// ── Fetch the 3 published notebooks ───────────────────────────────────
function normalizeProducts(payload: any): Product[] {
  const data = payload?.data?.data;
  const list = Array.isArray(data) ? data : data?.items;
  return Array.isArray(list) ? list : [];
}

const pickBySlug = (list: Product[]): Product[] =>
  FREE_NOTEBOOK_SLUGS
    .map((slug) => list.find((p) => p.slug?.toLowerCase() === slug.toLowerCase()))
    .filter((p): p is Product => Boolean(p));

export async function fetchFreeNotebooks(): Promise<Product[]> {
  // 1) Tag-filtered query (fast path).
  try {
    const res = await api.get('/product/get-all-data', {
      params: { 'tags.name': NOTEBOOK_TAG, page: 1, limit: 50, status: 'publish' },
    });
    const tagged = normalizeProducts(res).filter(hasNotebookTag);
    const bySlug = pickBySlug(tagged);
    if (bySlug.length > 0) return bySlug.slice(0, 3);
    if (tagged.length >= 3) return tagged.slice(0, 3);
  } catch {
    /* fall through to broad query */
  }

  // 2) Fallback: fetch all published products, then filter — same approach the
  // landing page uses, so the picker works even if the tag param is ignored.
  try {
    const res = await api.get('/product/get-all-data', {
      params: { page: 1, limit: 200, status: 'publish' },
    });
    const all = normalizeProducts(res);
    const bySlug = pickBySlug(all);
    if (bySlug.length > 0) return bySlug.slice(0, 3);
    return all.filter(hasNotebookTag).slice(0, 3);
  } catch {
    return [];
  }
}
