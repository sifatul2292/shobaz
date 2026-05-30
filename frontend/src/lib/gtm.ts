declare global {
  interface Window {
    dataLayer: any[];
  }
}

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

export const pushEvent = (event: object) => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null }); // clear previous ecommerce data
  window.dataLayer.push(event);
};

export const gtmViewItem = (product: any) => {
  const price = getPrice(product);
  pushEvent({
    event: 'view_item_stape',
    ecommerce: {
      currency: 'BDT',
      value: price,
      items: [{
        item_id: product._id,
        item_name: product.name,
        price,
        quantity: 1,
      }],
    },
  });
};

export const gtmAddToCart = (product: any, quantity: number) => {
  const price = getPrice(product);
  pushEvent({
    event: 'add_to_cart_stape',
    ecommerce: {
      currency: 'BDT',
      value: price * quantity,
      items: [{
        item_id: product._id,
        item_name: product.name,
        price,
        quantity,
      }],
    },
  });
};

export const gtmBeginCheckout = (cartItems: any[], total: number, userData: any = {}) => {
  pushEvent({
    event: 'begin_checkout_stape',
    user_data: getUserData(userData),
    ecommerce: {
      currency: 'BDT',
      value: total,
      items: cartItems.map((item, idx) => ({
        item_id: item._id,
        item_name: item.name,
        price: getPrice(item),
        quantity: item.quantity || 1,
        index: idx,
      })),
    },
  });
};

export const gtmViewCart = (cartItems: any[], total: number) => {
  pushEvent({
    event: 'view_cart_stape',
    ecommerce: {
      currency: 'BDT',
      value: total,
      items: cartItems.map((item, idx) => ({
        item_id: item._id,
        item_name: item.name,
        price: getPrice(item),
        quantity: item.quantity || 1,
        index: idx,
      })),
    },
  });
};

export const gtmSearch = (searchTerm: string, results: any[]) => {
  pushEvent({
    event: 'search_submitted_stape',
    ecommerce: {
      currency: 'BDT',
      search_term: searchTerm,
      items: results.slice(0, 10).map((item, idx) => ({
        item_id: item._id,
        item_name: item.name,
        price: getPrice(item),
        index: idx,
      })),
    },
  });
};

export const gtmPurchase = (order: any) => {
  const transactionId = order.orderId || order._id;
  if (wasPurchaseTracked(transactionId)) return;

  pushEvent({
    event: 'purchase_stape',
    user_data: getUserData(order),
    ecommerce: {
      transaction_id: transactionId,
      value: order.grandTotal,
      currency: 'BDT',
      shipping: order.deliveryCharge || 0,
      items: (order.orderedItems || []).map((item: any, idx: number) => ({
        item_id: item._id,
        item_name: item.name,
        price: getPrice(item),
        quantity: item.quantity || 1,
        index: idx,
      })),
    },
  });
};
