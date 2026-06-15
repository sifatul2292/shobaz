import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';
import { isFreeNotebookEligible } from '@/lib/notebookOffer';

interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  isFreeGift?: boolean;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setFreeGift: (product: Product) => void;
  removeFreeGift: () => void;
  getFreeGift: () => CartItem | undefined;
  reconcileFreeGift: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const unitPrice = (product: Product): number => {
  const salePrice = product.salePrice || 0;
  const discount = product.discountAmount || 0;
  return discount > 0 ? salePrice - discount : salePrice;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        const items = get().items;
        // Only match paid items — never merge a purchase into the free-gift row.
        const existingItem = items.find(
          (item) => item.product._id === product._id && !item.isFreeGift,
        );
        if (existingItem) {
          set({
            items: items.map((item) =>
              item.product._id === product._id && !item.isFreeGift
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ items: [...items, { _id: product._id, product, quantity }] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.product._id !== productId) });
        get().reconcileFreeGift();
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({
            items: get().items.filter(
              (item) => !(item.product._id === productId && !item.isFreeGift),
            ),
          });
        } else {
          set({
            items: get().items.map((item) =>
              item.product._id === productId && !item.isFreeGift
                ? { ...item, quantity }
                : item
            ),
          });
        }
        get().reconcileFreeGift();
      },
      clearCart: () => set({ items: [] }),
      setFreeGift: (product) => {
        // Replace any existing gift; only one free notebook per order.
        const paid = get().items.filter((item) => !item.isFreeGift);
        set({
          items: [...paid, { _id: `gift-${product._id}`, product, quantity: 1, isFreeGift: true }],
        });
      },
      removeFreeGift: () => {
        set({ items: get().items.filter((item) => !item.isFreeGift) });
      },
      getFreeGift: () => get().items.find((item) => item.isFreeGift),
      reconcileFreeGift: () => {
        const items = get().items;
        const hasGift = items.some((item) => item.isFreeGift);
        if (hasGift && !isFreeNotebookEligible(items)) {
          set({ items: items.filter((item) => !item.isFreeGift) });
        }
      },
      getTotalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),
      getTotalPrice: () =>
        get().items.reduce((total, item) => {
          if (item.isFreeGift) return total; // gift is free — never adds to total
          return total + unitPrice(item.product) * item.quantity;
        }, 0),
    }),
    {
      name: 'shobaz-cart',
    }
  )
);
