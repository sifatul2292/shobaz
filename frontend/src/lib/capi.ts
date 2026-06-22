import api from '@/lib/api';

// Read a cookie value by name (browser only).
const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : undefined;
};

// Meta browser identifiers. _fbp is set by the pixel on ~every session.
// _fbc is set when the visitor arrives from an ad click; if the cookie is
// missing but the URL has fbclid, synthesize _fbc per Meta's spec.
// These MUST be sent raw (never hashed) so Meta can match them to the pixel.
const getFbIds = (): { fbp?: string; fbc?: string } => {
  if (typeof window === 'undefined') return {};
  const fbp = getCookie('_fbp');
  let fbc = getCookie('_fbc');
  if (!fbc) {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid');
    if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
  }
  return { fbp: fbp || undefined, fbc: fbc || undefined };
};

const buildEvent = (
  eventName: string,
  userData: Record<string, any>,
  customData: Record<string, any>,
  eventId?: string,
) => ({
  event_name: eventName,
  event_time: Math.floor(Date.now() / 1000),
  event_source_url: typeof window !== 'undefined' ? window.location.href : '',
  action_source: 'website',
  // event_id lets Meta dedup this server event against the browser pixel fire
  ...(eventId ? { event_id: eventId } : {}),
  // fbp/fbc auto-attached to every event for browser↔server matching
  user_data: { ...getFbIds(), ...userData },
  custom_data: customData,
});

export const capiPurchase = (order: any) => {
  const eventId = String(order.orderId || order._id || '');
  const nameParts = (order.name || '').trim().split(/\s+/);
  const userData = {
    ph: order.phoneNo || undefined,
    em: order.email || undefined,
    fn: nameParts[0] || undefined,
    ln: nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined,
    external_id: order.orderId || undefined,
  };
  const customData = {
    currency: 'BDT',
    value: order.grandTotal,
    content_ids: (order.orderedItems || []).map((i: any) => i._id),
    content_type: 'product',
    contents: (order.orderedItems || []).map((i: any) => ({
      id: i._id,
      quantity: i.quantity || 1,
      item_price: i.salePrice || i.unitPrice || i.regularPrice || 0,
    })),
    num_items: (order.orderedItems || []).length,
    order_id: order.orderId,
  };
  return api.post('/gtag/track-theme-purchase', buildEvent('Purchase', userData, customData, eventId)).catch(() => null);
};

export const capiViewContent = (product: any) => {
  const price = product.salePrice || product.regularPrice || 0;
  const customData = {
    currency: 'BDT',
    value: price,
    content_ids: [product._id],
    content_type: 'product',
    content_name: product.name,
  };
  return api.post('/gtag/track-theme-view-content', buildEvent('ViewContent', {}, customData)).catch(() => null);
};

export const capiAddToCart = (product: any, quantity: number) => {
  const price = product.salePrice || product.regularPrice || 0;
  const customData = {
    currency: 'BDT',
    value: price * quantity,
    content_ids: [product._id],
    content_type: 'product',
    contents: [{ id: product._id, quantity, item_price: price }],
    num_items: quantity,
  };
  return api.post('/gtag/track-theme-add-to-cart', buildEvent('AddToCart', {}, customData)).catch(() => null);
};

export const capiInitiateCheckout = (cartItems: any[], total: number, phone?: string, name?: string, email?: string) => {
  const customData = {
    currency: 'BDT',
    value: total,
    content_ids: cartItems.map((i: any) => i._id || i.product?._id),
    content_type: 'product',
    contents: cartItems.map((i: any) => ({
      id: i._id || i.product?._id,
      quantity: i.quantity || 1,
      item_price: i.salePrice || i.regularPrice || 0,
    })),
    num_items: cartItems.length,
  };
  const nameParts = (name || '').trim().split(/\s+/);
  const userData = {
    ph: phone || undefined,
    em: email || undefined,
    fn: nameParts[0] || undefined,
    ln: nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined,
  };
  return api.post('/gtag/track-theme-initial-checkout', buildEvent('InitiateCheckout', userData, customData)).catch(() => null);
};
