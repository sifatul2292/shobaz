import posthog from 'posthog-js';

export const phViewItem = (product: any) => {
  const price = product.salePrice || product.regularPrice || 0;
  posthog.capture('product_viewed', {
    product_id: product._id,
    product_name: product.name,
    product_slug: product.slug,
    price,
    currency: 'BDT',
    category: product.category?.name || product.category || '',
    author: Array.isArray(product.author) ? product.author[0]?.name : product.author?.name || product.author || '',
    publisher: product.publisher?.name || product.publisher || '',
  });
};

export const phAddToCart = (product: any, quantity: number) => {
  const price = product.salePrice || product.regularPrice || 0;
  posthog.capture('add_to_cart', {
    product_id: product._id,
    product_name: product.name,
    product_slug: product.slug,
    price,
    quantity,
    value: price * quantity,
    currency: 'BDT',
    category: product.category?.name || product.category || '',
  });
};

export const phViewCart = (cartItems: any[], total: number) => {
  posthog.capture('cart_viewed', {
    value: total,
    currency: 'BDT',
    item_count: cartItems.length,
    items: cartItems.map(item => ({
      product_id: item._id,
      product_name: item.name,
      price: item.salePrice || item.regularPrice || 0,
      quantity: item.quantity || 1,
    })),
  });
};

export const phBeginCheckout = (cartItems: any[], total: number) => {
  posthog.capture('checkout_started', {
    value: total,
    currency: 'BDT',
    item_count: cartItems.length,
    items: cartItems.map(item => ({
      product_id: item._id,
      product_name: item.name,
      price: item.salePrice || item.regularPrice || 0,
      quantity: item.quantity || 1,
    })),
  });
};

export const phPurchase = (order: any) => {
  posthog.capture('purchase_completed', {
    order_id: order.orderId,
    value: order.grandTotal,
    currency: 'BDT',
    shipping: order.deliveryCharge || 0,
    discount: order.discount || 0,
    payment_type: order.paymentType || '',
    item_count: (order.orderedItems || []).length,
    items: (order.orderedItems || []).map((item: any) => ({
      product_id: item._id,
      product_name: item.name,
      price: item.salePrice || item.unitPrice || item.regularPrice || 0,
      quantity: item.quantity || 1,
    })),
  });
};

export const phSearch = (searchTerm: string, resultCount: number) => {
  posthog.capture('search', {
    search_term: searchTerm,
    result_count: resultCount,
  });
};

export const phSignIn = (userId?: string) => {
  posthog.capture('signed_in', { method: 'email' });
  if (userId) posthog.identify(userId);
};

export const phSignUp = () => {
  posthog.capture('signed_up', { method: 'email' });
};
