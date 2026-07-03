declare global {
  interface Window {
    dataLayer: any[];
  }
}

const CURRENCY = 'BDT';

const getPrice = (item: any) => {
  const salePrice = item.salePrice || item.unitPrice || item.regularPrice || item.price || 0;
  const discount = item.discountAmount || 0;
  return discount > 0 ? salePrice - discount : salePrice;
};

const getNameParts = (name?: string) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0],
    last_name: parts.length > 1 ? parts[parts.length - 1] : undefined,
  };
};

const getUserData = (source: any = {}) => {
  const nameParts = getNameParts(source.name);
  return {
    first_name: source.firstName || source.first_name || nameParts.first_name,
    last_name: source.lastName || source.last_name || nameParts.last_name,
    phone_number: source.phoneNo || source.phone || source.phone_number,
    email_address: source.email || source.email_address,
    customer_id: source.customerId || source.customer_id || source.orderId,
  };
};

const wasPurchaseTracked = (transactionId?: string) => {
  if (typeof window === 'undefined' || !transactionId) return false;
  const key = `gtm_purchase_tracked_${transactionId}`;
  if (window.sessionStorage.getItem(key)) return true;
  window.sessionStorage.setItem(key, '1');
  return false;
};

// One id shared by the browser pixel (eventID) and the GA4-to-sGTM twin (event_id)
// so Meta dedupes browser + server into a single event.
const genEventId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

// Explicit page context on EVERY event — without it sGTM defaults page_location
// to the homepage, which corrupts reporting for AJAX-fired events like add_to_cart.
const pageContext = () =>
  typeof window === 'undefined'
    ? {}
    : { page_location: window.location.href, page_title: document.title };

// Normalized line item shape used to build GA4 items (Tagioo's web/server
// containers derive Meta content_ids/contents from this same ecommerce.items).
type LineItem = { item_id: string; item_name: string; price: number; quantity: number };

const toItems = (source: any[]): LineItem[] =>
  (source || []).map((item) => ({
    item_id: item._id || item.item_id || item.id || item.slug,
    item_name: item.name || item.item_name || item.title,
    price: item.price != null ? item.price : getPrice(item),
    quantity: item.quantity || 1,
  }));

export const pushEvent = (event: object) => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null }); // clear previous ecommerce data
  window.dataLayer.push({ ...pageContext(), ...event });
};

// page_view -> Tagioo web container forwards to GA4 + fires Meta PageView (DOM_READY tag).
export const gtmPageView = (pathname?: string) => {
  const eventId = genEventId();
  pushEvent({
    event: 'page_view',
    event_id: eventId,
    ...(pathname ? { page_path: pathname } : {}),
  });
};

// view_item -> Tagioo GA4 + Meta ViewContent tags (single product, e.g. product detail page)
export const gtmViewItem = (product: any) => {
  const eventId = genEventId();
  const items = toItems([{ ...product, price: getPrice(product), quantity: 1 }]);
  const value = items[0]?.price ?? 0;
  pushEvent({
    event: 'view_item',
    event_id: eventId,
    ecommerce: { currency: CURRENCY, value, items },
  });
};

// view_item -> Tagioo GA4 + Meta ViewContent tags (group of items, e.g. bundle landing pages)
export const gtmViewContent = (contentName: string, source: any[], value?: number) => {
  const eventId = genEventId();
  const items = toItems(source);
  const total = value ?? items.reduce((s, i) => s + i.price * i.quantity, 0);
  pushEvent({
    event: 'view_item',
    event_id: eventId,
    ecommerce: { currency: CURRENCY, value: total, items },
  });
};

// add_to_cart -> Tagioo GA4 + Meta AddToCart tags (single product)
export const gtmAddToCart = (product: any, quantity: number) => {
  const eventId = genEventId();
  const price = getPrice(product);
  const items = toItems([{ ...product, price, quantity }]);
  const value = price * quantity;
  pushEvent({
    event: 'add_to_cart',
    event_id: eventId,
    ecommerce: { currency: CURRENCY, value, items },
  });
};

// add_to_cart -> Tagioo GA4 + Meta AddToCart tags (group of items, e.g. "add whole bundle" buttons)
export const gtmAddToCartItems = (contentName: string, source: any[], value?: number) => {
  const eventId = genEventId();
  const items = toItems(source);
  const total = value ?? items.reduce((s, i) => s + i.price * i.quantity, 0);
  pushEvent({
    event: 'add_to_cart',
    event_id: eventId,
    ecommerce: { currency: CURRENCY, value: total, items },
  });
};

// begin_checkout -> Tagioo GA4 + Meta InitiateCheckout tags
export const gtmBeginCheckout = (cartItems: any[], total: number, userData: any = {}) => {
  const eventId = genEventId();
  const items = toItems(cartItems).map((it, index) => ({ ...it, index }));
  pushEvent({
    event: 'begin_checkout',
    event_id: eventId,
    user_data: getUserData(userData),
    ecommerce: { currency: CURRENCY, value: total, items },
  });
  return eventId;
};

// add_payment_info -> Tagioo GA4 + Meta AddPaymentInfo tags
export const gtmAddPaymentInfo = (cartItems: any[], total: number, paymentType?: string) => {
  const eventId = genEventId();
  const items = toItems(cartItems).map((it, index) => ({ ...it, index }));
  pushEvent({
    event: 'add_payment_info',
    event_id: eventId,
    ecommerce: {
      currency: CURRENCY,
      value: total,
      ...(paymentType ? { payment_type: paymentType } : {}),
      items,
    },
  });
};

export const gtmViewCart = (cartItems: any[], total: number) => {
  const eventId = genEventId();
  const items = toItems(cartItems).map((it, index) => ({ ...it, index }));
  pushEvent({
    event: 'view_cart_stape',
    event_id: eventId,
    ecommerce: { currency: CURRENCY, value: total, items },
  });
};

export const gtmSearch = (searchTerm: string, results: any[]) => {
  const eventId = genEventId();
  pushEvent({
    event: 'search_submitted_stape',
    event_id: eventId,
    ecommerce: {
      currency: CURRENCY,
      search_term: searchTerm,
      items: toItems(results.slice(0, 10)).map((it, index) => ({ ...it, index })),
    },
  });
};

// purchase -> Tagioo GA4 + Meta Purchase tags (browser pixel + server CAPI both
// owned by the Tagioo web/server containers now). event_id = transaction id
// (NOT a UUID) so it dedupes with the sgtm order-recovery webhook, which also
// keys on the order id.
export const gtmPurchase = (order: any) => {
  const transactionId = String(order.orderId || order._id || '');
  if (!transactionId || wasPurchaseTracked(transactionId)) return;

  const items = toItems(order.orderedItems || []).map((it, index) => ({ ...it, index }));
  const value = order.grandTotal;
  pushEvent({
    event: 'purchase',
    event_id: transactionId, // dedup key for GA4 + Meta CAPI (must equal transaction_id)
    user_data: getUserData(order),
    ecommerce: {
      transaction_id: transactionId,
      value,
      currency: CURRENCY,
      shipping: order.deliveryCharge || 0,
      items,
    },
  });
};
