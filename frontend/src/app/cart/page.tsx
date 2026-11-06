'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import api, { imgUrl } from '@/lib/api';
import { gtmViewCart } from '@/lib/gtm';
import { phViewCart } from '@/lib/posthog';
import toast from 'react-hot-toast';
import FreeNotebookPicker from '@/components/common/FreeNotebookPicker';
import CheckoutSteps from '@/components/common/CheckoutSteps';
import { isFreeNotebookEligible, remainingForThreshold } from '@/lib/notebookOffer';
import { Product } from '@/types';

// ── Design tokens ─────────────────────────────────────────────────────
const PRIMARY = '#16a34a';
const PARCHMENT = '#f5f0e8';

// ── Helpers ───────────────────────────────────────────────────────────
const getAuthorName = (author: any): string => {
  if (!author) return '';
  if (Array.isArray(author)) return author[0]?.name || '';
  if (typeof author === 'object') return author.name || '';
  return author as string;
};

const getCurrentPrice = (product: any): number => {
  const salePrice = product.salePrice || 0;
  const discount = product.discountAmount || 0;
  return discount > 0 ? salePrice - discount : salePrice;
};

// ── SVG Icons ─────────────────────────────────────────────────────────
const IcCart = ({ size = 20, color = PRIMARY }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/>
    <path d="M3 4h2l2.6 12.2a1.8 1.8 0 0 0 1.8 1.5h7.5a1.8 1.8 0 0 0 1.8-1.4L21 9H6"/>
  </svg>
);
const IcTrash = ({ size = 18, color = '#9ca3af' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);
const IcHeart = ({ size = 16, color = PRIMARY }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.6a5.5 5.5 0 0 0-7.78 0L12 5.66l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.22l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IcPlus = ({ size = 16, color = PRIMARY }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcMinus = ({ size = 16, color = PRIMARY }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcArrowR = ({ size = 18, color = 'white' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>
  </svg>
);
const IcArrowL = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="11 6 5 12 11 18"/>
  </svg>
);
const IcTruck = ({ size = 20, color = PRIMARY }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="6" width="14" height="11" rx="1.5"/>
    <path d="M15 9h4l3 4v4h-7"/>
    <circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>
  </svg>
);
const IcShield = ({ size = 18, color = PRIMARY }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const IcCheck = ({ size = 16, color = 'white' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcLock = ({ size = 14, color = '#9ca3af' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>
  </svg>
);

// ── Cart Row ──────────────────────────────────────────────────────────
function CartRow({ item, onQty, onRemove }: {
  item: any; onQty: (q: number) => void; onRemove: () => void;
}) {
  const product = item.product;
  const price = getCurrentPrice(product);
  const original = product.salePrice || 0;
  const discount = product.discountAmount || 0;
  const authorName = getAuthorName(product.author);
  const name = product.name || 'Untitled';
  const img = product.images?.[0];
  const sub = price * item.quantity;

  return (
    <div className="ct-row">
      <Link href={`/products/${product.slug}`} className="ct-thumb">
        {img ? <img src={imgUrl(img)!} alt={name} /> : <IcCart size={26} color="#c4c4c4" />}
      </Link>

      <div className="ct-info">
        <Link href={`/products/${product.slug}`} className="ct-name">{name}</Link>
        {authorName && <div className="ct-author">{authorName}</div>}
        <div className="ct-price">
          <b>৳{price}</b>
          {discount > 0 && <s>৳{original}</s>}
          {discount > 0 && <span className="ct-save">৳{discount * item.quantity} সাশ্রয়</span>}
        </div>

        <div className="ct-controls">
          <div className="ct-qty" role="group" aria-label="পরিমাণ">
            <button type="button" onClick={() => onQty(item.quantity - 1)} disabled={item.quantity <= 1} aria-label="কমান">
              <IcMinus size={14} color="currentColor" />
            </button>
            <span aria-live="polite">{item.quantity}</span>
            <button type="button" onClick={() => onQty(item.quantity + 1)} aria-label="বাড়ান">
              <IcPlus size={14} color="currentColor" />
            </button>
          </div>
          <button type="button" onClick={onRemove} className="ct-link-btn">সরান</button>
          <Link href="/wishlist" className="ct-link-btn ct-hide-sm">পছন্দ তালিকায় রাখুন</Link>
        </div>
      </div>

      <div className="ct-line-total">৳{sub}</div>
    </div>
  );
}

// ── Gift Row (free notebook) ──────────────────────────────────────────
function GiftRow({ item, onRemove }: { item: any; onRemove: () => void }) {
  const product = item.product;
  const name = product.name || 'Notebook';
  const img = product.images?.[0];
  const original = getCurrentPrice(product);
  return (
    <div className="ct-row ct-row--gift">
      <Link href={`/products/${product.slug}`} className="ct-thumb">
        {img ? <img src={imgUrl(img)!} alt={name} /> : <IcCart size={26} color="#c4c4c4" />}
      </Link>
      <div className="ct-info">
        <span className="ct-gift-tag">🎁 ফ্রি উপহার</span>
        <div className="ct-name">{name}</div>
        <div className="ct-price">
          <b className="ct-free">৳0</b>
          {original > 0 && <s>৳{original}</s>}
        </div>
        <div className="ct-controls">
          <span className="ct-muted">অর্ডার শর্ত পূরণ হলে উপহারটি প্রযোজ্য</span>
          <button type="button" onClick={onRemove} className="ct-link-btn">সরান</button>
        </div>
      </div>
      <div className="ct-line-total ct-free">৳0</div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <div className="co-page min-h-screen flex flex-col">
      <Header />
      <main className="co-empty">
        <div>
          <span className="co-empty-icon"><IcCart size={34} color="#111" /></span>
          <h1>আপনার কার্ট খালি</h1>
          <p>পছন্দের বই কার্টে যোগ করুন</p>
          <Link href="/products" className="co-btn co-btn--solid">কেনাকাটা শুরু করুন <IcArrowR size={16} /></Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ── Shipping charge interface ──────────────────────────────────────────
interface ShippingCharge {
  deliveryInDhaka: number;
  deliveryOutsideDhaka: number;
}

// ── Page ──────────────────────────────────────────────────────────────
export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart, setFreeGift, removeFreeGift } = useCartStore();
  const [shippingCharge, setShippingCharge] = useState<ShippingCharge | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.title = 'কার্ট - Shobaz';
    if (items.length > 0) {
      gtmViewCart(items.map(i => ({ ...i.product, quantity: i.quantity })), getTotalPrice());
      phViewCart(items.map(i => ({ ...i.product, quantity: i.quantity })), getTotalPrice());
    }
    api.get('/shipping-charge/get').then(res => {
      if (res.data?.data) setShippingCharge(res.data.data);
    }).catch(() => {});
  }, []);

  if (!mounted) return <div className="co-page" style={{ minHeight: '100vh' }} />;
  if (items.length === 0) return <EmptyCart />;

  const subtotal = getTotalPrice();
  const paidItems = items.filter((i) => !i.isFreeGift);
  const giftItem = items.find((i) => i.isFreeGift);
  const itemCount = paidItems.reduce((s, i) => s + i.quantity, 0);
  const eligible = isFreeNotebookEligible(items);
  const remaining = remainingForThreshold(items);
  const handlePickGift = (product: Product) => {
    setFreeGift(product);
    toast.success(`${product.name} ফ্রি উপহার হিসেবে যোগ হয়েছে! 🎁`);
  };

  return (
    <div className="co-page min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="co-wrap">
          <CheckoutSteps step={1} />

          <div className="ct-head">
            <h1>আপনার কার্ট <span>{itemCount}টি পণ্য</span></h1>
            <Link href="/products" className="ct-continue">
              <IcArrowL size={14} color="currentColor" /> কেনাকাটা চালিয়ে যান
            </Link>
          </div>

          <div className="ct-layout">
            {/* ── Items ── */}
            <section aria-label="কার্টের পণ্য">
              <div className="ct-list">
                {paidItems.map((item) => (
                  <CartRow
                    key={item._id || item.product._id}
                    item={item}
                    onQty={(q) => updateQuantity(item.product._id, Math.max(1, q))}
                    onRemove={() => { removeItem(item.product._id); toast.success('পণ্য সরানো হয়েছে'); }}
                  />
                ))}
                {giftItem && (
                  <GiftRow item={giftItem} onRemove={() => { removeFreeGift(); toast.success('ফ্রি উপহার সরানো হয়েছে'); }} />
                )}
              </div>

              {/* ── Free notebook offer ── */}
              {giftItem ? (
                <div className="ct-offer">
                  <div className="ct-offer-title">অন্য নোটবুক বেছে নিতে চাইলে নিচে ট্যাপ করুন:</div>
                  <FreeNotebookPicker selectedId={giftItem.product._id} onPick={handlePickGift} compact />
                </div>
              ) : eligible ? (
                <div className="ct-offer">
                  <div className="ct-offer-title">🎁 আপনি একটি নোটবুক ফ্রি পাচ্ছেন!</div>
                  <p className="ct-offer-sub">নিচের যেকোনো একটি প্রিমিয়াম নোটবুক বেছে নিন — সম্পূর্ণ বিনামূল্যে।</p>
                  <FreeNotebookPicker onPick={handlePickGift} compact />
                </div>
              ) : (
                <div className="ct-offer ct-offer--hint">
                  <span aria-hidden="true">🎁</span>
                  <p>আর <b>৳{remaining}</b> যোগ করুন (অথবা ২টি নোটবুক) — সঙ্গে একটি প্রিমিয়াম নোটবুক <b>ফ্রি</b>!</p>
                </div>
              )}

              <button
                type="button"
                className="ct-clear"
                onClick={() => { if (confirm('সব পণ্য মুছে ফেলবেন?')) clearCart(); }}
              >
                <IcTrash color="currentColor" size={14} /> সমস্ত কার্ট মুছে ফেলুন
              </button>
            </section>

            {/* ── Summary ── */}
            <aside className="ct-summary" aria-label="অর্ডার সারাংশ">
              <h2>অর্ডার সারাংশ</h2>
              <div className="co-rows">
                <div className="co-row"><span>উপ-মোট ({itemCount}টি পণ্য)</span><b>৳{subtotal}</b></div>
                {giftItem && <div className="co-row"><span>🎁 ফ্রি নোটবুক</span><b className="ct-free">৳0</b></div>}
                <div className="co-row co-row--muted">
                  <span>ডেলিভারি</span>
                  <span>ঢাকা ৳{shippingCharge ? shippingCharge.deliveryInDhaka : 60} · বাইরে ৳{shippingCharge ? shippingCharge.deliveryOutsideDhaka : 80}</span>
                </div>
              </div>
              <div className="co-total">
                <span>সাব-টোটাল</span>
                <b>৳{subtotal}</b>
              </div>
              <p className="ct-note">ডেলিভারি চার্জ চেকআউটে লোকেশন অনুযায়ী যোগ হবে।</p>
              <a href="/checkout" className="co-btn co-btn--solid co-btn--block">
                চেকআউটে যান <IcArrowR size={16} />
              </a>
              <ul className="co-trust">
                <li><IcTruck color="currentColor" size={16} /> দ্রুত ডেলিভারি</li>
                <li><IcShield color="currentColor" size={16} /> নিরাপদ পেমেন্ট</li>
                <li><IcLock color="currentColor" size={14} /> ক্যাশ অন ডেলিভারি</li>
              </ul>
            </aside>
          </div>
        </div>
      </main>

      {/* Phone: checkout always one tap away */}
      <div className="ct-mobile-bar">
        <div>
          <span>সাব-টোটাল</span>
          <b>৳{subtotal}</b>
        </div>
        <a href="/checkout" className="co-btn co-btn--solid">চেকআউট <IcArrowR size={16} /></a>
      </div>

      <Footer />
    </div>
  );
}
