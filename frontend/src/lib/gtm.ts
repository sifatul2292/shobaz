declare global {
  interface Window {
    dataLayer: any[];
  }
}

export const pushEvent = (event: object) => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null }); // clear previous ecommerce data
  window.dataLayer.push(event);
};

export const gtmViewItem = (product: any) => {
  const price = product.salePrice || product.regularPrice || 0;
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
  const price = product.salePrice || product.regularPrice || 0;
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

export const gtmBeginCheckout = (cartItems: any[], total: number) => {
  pushEvent({
    event: 'begin_checkout_stape',
    ecommerce: {
      currency: 'BDT',
      value: total,
      items: cartItems.map((item, idx) => ({
        item_id: item._id,
        item_name: item.name,
        price: item.salePrice || item.regularPrice || 0,
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
        price: item.salePrice || item.regularPrice || 0,
        quantity: item.quantity || 1,
        index: idx,
      })),
    },
  });
};

export const gtmSearch = (searchTerm: string, results: any[]) => {
  pushEvent({
    event: 'search_stape',
    search_term: searchTerm,
    ecommerce: {
      currency: 'BDT',
      items: results.slice(0, 10).map((item, idx) => ({
        item_id: item._id,
        item_name: item.name,
        price: item.salePrice || item.regularPrice || 0,
        index: idx,
      })),
    },
  });
};

export const gtmPurchase = (order: any) => {
  pushEvent({
    event: 'purchase_stape',
    ecommerce: {
      transaction_id: order.orderId,
      value: order.grandTotal,
      currency: 'BDT',
      shipping: order.deliveryCharge || 0,
      items: (order.orderedItems || []).map((item: any, idx: number) => ({
        item_id: item._id,
        item_name: item.name,
        price: item.salePrice || item.unitPrice || item.regularPrice || 0,
        quantity: item.quantity || 1,
        index: idx,
      })),
    },
  });
};
