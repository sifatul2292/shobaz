import api from '@/lib/api';

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
  user_data: userData,
  custom_data: customData,
});

export const capiPurchase = (order: any) => {
  const eventId = String(order.orderId || order._id || '');
  const nameParts = (order.name || '').trim().split(/\s+/);
  const userData = {
    ph: order.phoneNo || undefined,
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

export const capiInitiateCheckout = (cartItems: any[], total: number, phone?: string, name?: string) => {
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
    fn: nameParts[0] || undefined,
    ln: nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined,
  };
  return api.post('/gtag/track-theme-initial-checkout', buildEvent('InitiateCheckout', userData, customData)).catch(() => null);
};
