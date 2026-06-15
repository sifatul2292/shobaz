'use client';

import { useState, useEffect, Fragment } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import api, { imgUrl } from '@/lib/api';
import { gtmViewCart } from '@/lib/gtm';
import { phViewCart } from '@/lib/posthog';
import toast from 'react-hot-toast';
import FreeNotebookPicker from '@/components/common/FreeNotebookPicker';
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

// ── Step Progress ─────────────────────────────────────────────────────
function StepProgress() {
  const STEPS = [{ n: 1, label: 'কার্ট' }, { n: 2, label: 'চেকআউট' }, { n: 3, label: 'সম্পন্ন' }];
  const step = 1;
  return (
    <div style={{ background: 'white', borderBottom: '1px solid #f1f5f9', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {STEPS.map((s, i) => {
            const active = step === s.n;
            const completed = s.n < step;
            return (
              <Fragment key={s.n}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ position: 'relative' }}>
                    {active && (
                      <div style={{
                        position: 'absolute', inset: -7, borderRadius: 999,
                        border: `2px solid ${PRIMARY}`,
                        animation: 'stepPulse 2s ease-in-out infinite',
                      }}/>
                    )}
                    <div style={{
                      width: 48, height: 48, borderRadius: 999,
                      background: (completed || active) ? PRIMARY : 'white',
                      border: (completed || active) ? 'none' : '2px solid #e2e8f0',
                      color: (completed || active) ? 'white' : '#9ca3af',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 17,
                      boxShadow: (completed || active)
                        ? `0 4px 14px ${PRIMARY}44, 0 1px 4px rgba(0,0,0,0.1)`
                        : '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'all .3s ease',
                    }}>
                      {completed ? <IcCheck color="white" size={20}/> : s.n}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: (completed || active) ? '#0f172a' : '#9ca3af', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 3, background: '#f1f5f9', margin: '0 16px', marginBottom: 26, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: step > s.n ? '100%' : '0%', background: `linear-gradient(90deg, ${PRIMARY}, #22c55e)`, transition: 'width .5s ease', borderRadius: 999 }}/>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Qty stepper styles ────────────────────────────────────────────────
const qtyEdge: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 10, background: '#f1f5f9',
  border: 'none', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};
const qtyCenter: React.CSSProperties = {
  width: 48, height: 40, borderRadius: 10, border: '1.5px solid #e2e8f0',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 16, fontWeight: 700, color: '#0f172a', background: 'white',
};

// ── Cart Row ──────────────────────────────────────────────────────────
function CartRow({ item, onQty, onRemove, last }: {
  item: any; onQty: (q: number) => void; onRemove: () => void; last: boolean;
}) {
  const [hov, setHov] = useState(false);
  const product = item.product;
  const price = getCurrentPrice(product);
  const original = product.salePrice || 0;
  const discount = product.discountAmount || 0;
  const authorName = getAuthorName(product.author);
  const name = product.name || 'Untitled';
  const img = product.images?.[0];
  const sub = price * item.quantity;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 18,
        padding: '20px 24px', alignItems: 'flex-start',
        borderBottom: last ? 'none' : '1px solid #f5f5f5',
        background: hov ? '#fafafa' : 'white',
        transition: 'background .15s ease',
      }}
    >
      {/* Thumb */}
      <Link href={`/products/${product.slug}`} style={{
        width: 80, height: 104, borderRadius: 8, overflow: 'hidden', display: 'block',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)', textDecoration: 'none', flexShrink: 0, background: '#f8fafc',
      }}>
        {img ? (
          <img src={imgUrl(img)!} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcCart size={28} color="#cbd5e1"/>
          </div>
        )}
      </Link>

      {/* Info */}
      <div style={{ minWidth: 0 }}>
        <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{name}</div>
        </Link>
        {authorName && <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>• {authorName}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: PRIMARY, fontFamily: "'Inter', sans-serif" }}>৳{price}</span>
          {discount > 0 && (
            <>
              <span style={{ fontSize: 14, color: '#9ca3af', textDecoration: 'line-through' }}>৳{original}</span>
              <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                ৳{discount * item.quantity} সাশ্রয়
              </span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
          <Link href="/wishlist" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: PRIMARY, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            <IcHeart size={15} color={PRIMARY}/> পছন্দ তালিকায় রাখুন
          </Link>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14, minWidth: 152 }}>
        <button
          onClick={onRemove}
          title="মুছুন"
          className="cart-trash-btn"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <IcTrash size={18} color="#9ca3af"/>
        </button>
        <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => onQty(item.quantity - 1)} disabled={item.quantity <= 1}
            style={{ ...qtyEdge, opacity: item.quantity <= 1 ? 0.4 : 1, cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer' }}>
            <IcMinus color={PRIMARY}/>
          </button>
          <div style={qtyCenter}>{item.quantity}</div>
          <button onClick={() => onQty(item.quantity + 1)} style={qtyEdge}>
            <IcPlus color={PRIMARY}/>
          </button>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>= ৳{sub}</div>
      </div>
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
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 18, padding: '20px 24px', alignItems: 'flex-start', borderTop: '1px solid #f5f5f5', background: '#F6FBF6' }}>
      <Link href={`/products/${product.slug}`} style={{ width: 80, height: 104, borderRadius: 8, overflow: 'hidden', display: 'block', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', flexShrink: 0, background: '#f8fafc', position: 'relative' }}>
        {img ? (
          <img src={imgUrl(img)!} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcCart size={28} color="#cbd5e1" /></div>
        )}
      </Link>
      <div style={{ minWidth: 0 }}>
        <span style={{ display: 'inline-block', background: PRIMARY, color: 'white', borderRadius: 999, padding: '3px 12px', fontSize: 11, fontWeight: 800, marginBottom: 6, letterSpacing: '0.04em' }}>🎁 ফ্রি উপহার</span>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: PRIMARY, fontFamily: "'Inter', sans-serif" }}>৳0</span>
          {original > 0 && <span style={{ fontSize: 14, color: '#9ca3af', textDecoration: 'line-through' }}>৳{original}</span>}
          <span style={{ background: '#ecfdf5', color: PRIMARY, border: '1px solid #a7f3d0', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>সম্পূর্ণ বিনামূল্যে</span>
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>অর্ডার শর্ত পূরণ হলে উপহারটি প্রযোজ্য</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14, minWidth: 100 }}>
        <button onClick={onRemove} title="উপহার বদলান / সরান" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
          <IcTrash size={18} color="#9ca3af" />
        </button>
        <div style={{ fontSize: 15, fontWeight: 700, color: PRIMARY }}>= ৳0</div>
      </div>
    </div>
  );
}

// ── Summary Row ───────────────────────────────────────────────────────
function SummaryRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#374151', fontSize: 14 }}>{label}</span>
      <span style={{ color: valueColor || '#0f172a', fontWeight: 700, fontSize: 14 }}>{value}</span>
    </div>
  );
}

// ── Trust Mini ────────────────────────────────────────────────────────
function TrustMini({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ flex: 1, background: '#f8fafc', borderRadius: 12, padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
      {icon}
      <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: PARCHMENT }}>
      <Header />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <IcCart size={56} color="#cbd5e1"/>
          </div>
          <h2 style={{ fontFamily: "'Hind Siliguri', sans-serif", fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>আপনার কার্ট খালি</h2>
          <p style={{ fontFamily: "'Hind Siliguri', sans-serif", color: '#9ca3af', marginBottom: 28, lineHeight: 1.6 }}>পছন্দের বই কার্টে যোগ করুন</p>
          <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY, color: 'white', borderRadius: 12, padding: '12px 24px', fontWeight: 700, textDecoration: 'none', fontFamily: "'Hind Siliguri', sans-serif", fontSize: 15 }}>
            কেনাকাটা শুরু করুন <IcArrowR size={16}/>
          </Link>
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

  if (!mounted) return <div style={{ minHeight: '100vh', background: PARCHMENT }}/>;
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: PARCHMENT, fontFamily: "'Hind Siliguri', 'Inter', system-ui, sans-serif", color: '#0f172a' }}>
      <Header />

      <StepProgress />

      <main style={{ flex: 1 }}>
        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '8px 24px 56px' }}>
          <div className="cart-layout">

            {/* ── LEFT — cart items ── */}
            <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
              {/* header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IcCart color={PRIMARY} size={22}/>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>আপনার কার্ট</h2>
                </div>
                <span style={{ background: '#f1f5f9', color: '#374151', borderRadius: 999, padding: '4px 14px', fontSize: 13, fontWeight: 600 }}>
                  {itemCount}টি পণ্য
                </span>
              </div>

              {/* rows */}
              {paidItems.map((item, i) => (
                <CartRow
                  key={item._id || item.product._id}
                  item={item}
                  last={!giftItem && i === paidItems.length - 1}
                  onQty={(q) => updateQuantity(item.product._id, Math.max(1, q))}
                  onRemove={() => { removeItem(item.product._id); toast.success('পণ্য সরানো হয়েছে'); }}
                />
              ))}

              {/* ── Free notebook offer ── */}
              {giftItem ? (
                <GiftRow item={giftItem} onRemove={() => { removeFreeGift(); toast.success('ফ্রি উপহার সরানো হয়েছে'); }} />
              ) : eligible ? (
                <div style={{ padding: '18px 24px', borderTop: '1px solid #f5f5f5', background: '#FBF8EC' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#071A07', marginBottom: 4 }}>🎁 আপনি একটি নোটবুক ফ্রি পাচ্ছেন!</div>
                  <div style={{ fontSize: 13, color: '#4A6B4A', marginBottom: 12 }}>নিচের যেকোনো একটি প্রিমিয়াম নোটবুক বেছে নিন — সম্পূর্ণ বিনামূল্যে।</div>
                  <FreeNotebookPicker onPick={handlePickGift} compact />
                </div>
              ) : (
                <div style={{ padding: '16px 24px', borderTop: '1px solid #f5f5f5', background: '#FBF8EC', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🎁</span>
                  <div style={{ fontSize: 13.5, color: '#2E4A2E', fontWeight: 600, lineHeight: 1.5 }}>
                    আর <b style={{ color: '#C62828' }}>৳{remaining}</b> যোগ করুন (অথবা ২টি নোটবুক) — সঙ্গে একটি প্রিমিয়াম নোটবুক <b>ফ্রি</b>!
                  </div>
                </div>
              )}

              {/* footer */}
              <div style={{ background: '#fafafa', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <button
                  onClick={() => { if (confirm('সব পণ্য মুছে ফেলবেন?')) clearCart(); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', transition: 'color .15s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; }}
                >
                  <IcTrash color="#9ca3af" size={16}/> সমস্ত কার্ট মুছে ফেলুন
                </button>
                <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: PRIMARY, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  <IcArrowL size={14} color={PRIMARY}/> কেনাকাটা চালিয়ে যান
                </Link>
              </div>
            </div>

            {/* ── RIGHT — summary ── */}
            <div style={{ position: 'sticky', top: 16 }}>
              <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                {/* gradient header */}
                <div style={{ background: `linear-gradient(135deg, ${PRIMARY}, #14532d)`, padding: '20px 24px', color: 'white' }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>অর্ডার সারাংশ</h3>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>{itemCount}টি পণ্য</div>
                </div>

                {/* price rows */}
                <div style={{ padding: '8px 24px 0' }}>
                  <SummaryRow label="উপ-মোট" value={`৳${subtotal}`}/>
                  {giftItem && <SummaryRow label="🎁 ফ্রি নোটবুক" value="৳0" valueColor={PRIMARY}/>}
                  <SummaryRow label="ঢাকার ভেতরে" value={shippingCharge ? `৳${shippingCharge.deliveryInDhaka}` : '৳৬০'}/>
                  <SummaryRow label="ঢাকার বাইরে" value={shippingCharge ? `৳${shippingCharge.deliveryOutsideDhaka}` : '৳৮০'}/>
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>
                    * চেকআউটে সঠিক চার্জ নির্বাচন করুন
                  </p>
                </div>

                {/* subtotal banner */}
                <div style={{ background: '#f8fafc', padding: '16px 24px', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>সাব-টোটাল</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: PRIMARY, fontFamily: "'Inter', sans-serif" }}>৳{subtotal}</span>
                </div>

                {/* CTA */}
                <div style={{ padding: '16px 24px' }}>
                  <a
                    href="/checkout"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', height: 56, background: 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', borderRadius: 14, fontSize: 17, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(234,88,12,0.35)', transition: 'transform .15s ease, box-shadow .2s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(234,88,12,0.45)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(234,88,12,0.35)'; }}
                  >
                    <IcArrowR size={18}/> চেকআউটে যান
                  </a>
                </div>

                {/* trust badges */}
                <div style={{ padding: '0 24px 20px', display: 'flex', gap: 12 }}>
                  <TrustMini icon={<IcTruck color={PRIMARY} size={18}/>} label="দ্রুত ডেলিভারি"/>
                  <TrustMini icon={<IcShield color={PRIMARY} size={18}/>} label="১০০% নিরাপদ পেমেন্ট"/>
                </div>

                {/* add more */}
                <Link href="/products" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px', color: PRIMARY, fontSize: 14, fontWeight: 600, textDecoration: 'none', borderTop: '1px solid #f1f5f9' }}>
                  <IcPlus color={PRIMARY} size={16}/> আরও বই যোগ করুন
                </Link>

                {/* secure badge */}
                <div style={{ padding: '0 24px 20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#9ca3af', fontSize: 12 }}>
                  <IcLock/> নিরাপদ পেমেন্ট গ্যারান্টি
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
