'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import api, { imgUrl } from '@/lib/api';
import { gtmBeginCheckout } from '@/lib/gtm';
import { capiInitiateCheckout } from '@/lib/capi';
import toast from 'react-hot-toast';
import Link from 'next/link';

// ── Design tokens ─────────────────────────────────────────────────────
const PRIMARY = '#16a34a';
const PARCHMENT = '#f5f0e8';

// ── Types ─────────────────────────────────────────────────────────────
interface WeightRule { fromGram: number; toGram: number; cost: number; }
interface ShippingCharge {
  deliveryInDhaka: number;
  deliveryOutsideDhaka: number;
  insideDhakaRules?: WeightRule[];
  outsideDhakaRules?: WeightRule[];
}

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
const IcCheck = ({ size = 16, color = 'white' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcCircleCheck = ({ size = 22, color = PRIMARY, filled = false }: { size?: number; color?: string; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={filled ? 'white' : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" fill={filled ? color : 'none'}/>
    <polyline points="8 12 11 15 16 9" stroke={filled ? 'white' : color}/>
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
const IcPin = ({ size = 22, color = PRIMARY }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2c-4 0-7 3-7 7 0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>
);
const IcWallet = ({ size = 22, color = PRIMARY }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 8H6a2 2 0 0 1 0-4h12v4z"/>
    <path d="M4 8v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8"/>
    <circle cx="17" cy="14" r="1.4" fill={color}/>
  </svg>
);
const IcTruck = ({ size = 24, color = PRIMARY }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="6" width="14" height="11" rx="1.5"/>
    <path d="M15 9h4l3 4v4h-7"/>
    <circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>
  </svg>
);
const IcCash = ({ size = 24, color = PRIMARY }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <circle cx="12" cy="12" r="3"/>
    <path d="M6 12h.01M18 12h.01"/>
  </svg>
);
const IcShield = ({ size = 14, color = PRIMARY }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const IcLock = ({ size = 14, color = '#9ca3af' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>
  </svg>
);
const IcCart = ({ size = 48, color = '#cbd5e1' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/>
    <path d="M3 4h2l2.6 12.2a1.8 1.8 0 0 0 1.8 1.5h7.5a1.8 1.8 0 0 0 1.8-1.4L21 9H6"/>
  </svg>
);

// ── Step Progress ─────────────────────────────────────────────────────
function StepProgress({ step }: { step: number }) {
  const STEPS = [{ n: 1, label: 'কার্ট' }, { n: 2, label: 'চেকআউট' }, { n: 3, label: 'সম্পন্ন' }];
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

// ── Accent Card ───────────────────────────────────────────────────────
function AccentCard({ icon, title, subtitle, children }: {
  icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: 4, background: PRIMARY, flexShrink: 0 }}/>
        <div style={{ flex: 1, padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon}
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{title}</h3>
          </div>
          {subtitle && <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

// ── Form field ────────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  width: '100%', height: 48, border: '1.5px solid #e2e8f0', borderRadius: 12,
  padding: '0 16px', fontSize: 15, color: '#0f172a', background: '#fafafa',
  fontFamily: 'inherit', outline: 'none', transition: 'border-color .15s, box-shadow .15s, background .15s',
  boxSizing: 'border-box',
};
const inputError: React.CSSProperties = { ...inputBase, borderColor: '#ef4444', background: '#fef2f2' };
function focusIn(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = PRIMARY;
  e.target.style.boxShadow = `0 0 0 3px ${PRIMARY}1f`;
  e.target.style.background = 'white';
}
function focusOut(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = e.target.value ? '#e2e8f0' : '#e2e8f0';
  e.target.style.boxShadow = 'none';
  e.target.style.background = '#fafafa';
}

function FormField({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
      </label>
      {children}
      {hint && !error && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{hint}</div>}
      {error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{error}</div>}
    </div>
  );
}

// ── Delivery location selector ─────────────────────────────────────────
function DeliveryLocSelector({ value, onChange, inside, outside }: {
  value: 'inside' | 'outside'; onChange: (v: 'inside' | 'outside') => void; inside: number; outside: number;
}) {
  const opts = [
    { id: 'inside' as const, title: 'ঢাকা সিটির ভিতরে', price: inside, icon: <IcPin size={24} color={PRIMARY}/> },
    { id: 'outside' as const, title: 'ঢাকা সিটির বাইরে', price: outside, icon: <IcTruck size={24} color={PRIMARY}/> },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {opts.map(o => {
        const selected = value === o.id;
        return (
          <button
            key={o.id} type="button" onClick={() => onChange(o.id)}
            style={{
              position: 'relative', cursor: 'pointer', fontFamily: 'inherit',
              border: selected ? `2px solid ${PRIMARY}` : '1.5px solid #e2e8f0',
              background: selected ? '#f0fdf4' : 'white',
              borderRadius: 14, padding: '16px 14px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              transition: 'all .15s ease',
            }}
          >
            {selected && (
              <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 999, background: PRIMARY, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IcCheck color="white" size={14}/>
              </div>
            )}
            {o.icon}
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>{o.title}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: selected ? PRIMARY : '#374151', fontFamily: "'Inter', sans-serif" }}>৳{o.price}</div>
          </button>
        );
      })}
    </div>
  );
}

// ── Payment COD ───────────────────────────────────────────────────────
function PaymentCOD() {
  return (
    <>
      <div style={{ border: `2px solid ${PRIMARY}`, background: '#f0fdf4', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IcCash size={24} color={PRIMARY}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>ক্যাশ অন ডেলিভারি</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>পণ্য হাতে পেয়ে টাকা দিন</div>
        </div>
        <IcCircleCheck filled color={PRIMARY} size={24}/>
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: PRIMARY, fontSize: 12, fontWeight: 600 }}>
        <IcShield color={PRIMARY} size={14}/> আপনার অর্ডার সম্পূর্ণ নিরাপদ
      </div>
    </>
  );
}

// ── Summary row ───────────────────────────────────────────────────────
function SummaryRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#374151', fontSize: 14 }}>{label}</span>
      <span style={{ color: valueColor || '#0f172a', fontWeight: 700, fontSize: 14 }}>{value}</span>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────
function EmptyCheckout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: PARCHMENT }}>
      <Header />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <IcCart size={56} color="#cbd5e1"/>
          </div>
          <h2 style={{ fontFamily: "'Hind Siliguri', sans-serif", fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>আপনার কার্ট খালি</h2>
          <p style={{ fontFamily: "'Hind Siliguri', sans-serif", color: '#9ca3af', marginBottom: 28, lineHeight: 1.6 }}>আপনি কোনো পণ্য যোগ করেননি</p>
          <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY, color: 'white', borderRadius: 12, padding: '12px 24px', fontWeight: 700, textDecoration: 'none', fontFamily: "'Hind Siliguri', sans-serif", fontSize: 15 }}>
            বই কিনুন <IcArrowR size={16}/>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shippingCharge, setShippingCharge] = useState<ShippingCharge | null>(null);
  const [productWeightMap, setProductWeightMap] = useState<Record<string, number>>({});
  const [deliveryLocation, setDeliveryLocation] = useState<'inside' | 'outside'>('inside');
  const [formData, setFormData] = useState({ name: user?.name || '', phone: '', address: '' });
  const [errors, setErrors] = useState({ name: '', phone: '', address: '' });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setMounted(true);
    api.get('/shipping-charge/get').then(res => {
      if (res.data?.data) setShippingCharge(res.data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const ids = items.map(i => i.product._id).filter(Boolean);
    api.post('/product/get-products-by-ids', { ids }).then(res => {
      if (res.data?.data) {
        const map: Record<string, number> = {};
        res.data.data.forEach((p: any) => { map[p._id] = Number(p.weight) || 0; });
        setProductWeightMap(map);
      }
    }).catch(() => {});
  }, [items.length]);

  useEffect(() => {
    document.title = 'চেকআউট - Shobaz';
    if (items.length > 0) {
      const cartProducts = items.map(i => ({ ...i.product, quantity: i.quantity }));
      const total = getTotalPrice();
      gtmBeginCheckout(cartProducts, total);
      capiInitiateCheckout(cartProducts, total, formData.phone, formData.name);
    }
  }, []);

  if (!mounted) return <div style={{ minHeight: '100vh', background: PARCHMENT }}/>;
  if (items.length === 0) return <EmptyCheckout />;

  const insideFee = shippingCharge?.deliveryInDhaka ?? 60;
  const outsideFee = shippingCharge?.deliveryOutsideDhaka ?? 80;

  // Weight-based delivery charge lookup
  // Use fresh weights from DB (productWeightMap) — cart may have stale/missing weight
  // Rules store grams (fromGram/toGram are gram values despite the kg labels in admin UI)
  const totalGrams = items.reduce((sum, i) => {
    const weight = productWeightMap[i.product._id] ?? Number(i.product.weight || 0);
    return sum + weight * i.quantity;
  }, 0);
  const weightRules = deliveryLocation === 'inside'
    ? (shippingCharge?.insideDhakaRules ?? [])
    : (shippingCharge?.outsideDhakaRules ?? []);
  const matchedRule = weightRules.find(r => totalGrams >= r.fromGram && totalGrams <= r.toGram);
  const baseFee = deliveryLocation === 'inside' ? insideFee : outsideFee;
  const deliveryFee = matchedRule ? matchedRule.cost : baseFee;
  const deliveryLabel = deliveryLocation === 'inside' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে';
  const subtotal = getTotalPrice();
  const grandTotal = subtotal + deliveryFee;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const validateForm = () => {
    const newErrors = { name: '', phone: '', address: '' };
    let valid = true;
    if (!formData.name.trim()) { newErrors.name = 'নাম প্রয়োজন'; valid = false; }
    if (!formData.phone.trim()) { newErrors.phone = 'ফোন নম্বর প্রয়োজন'; valid = false; }
    else if (!/^01\d{9}$/.test(formData.phone)) { newErrors.phone = 'সঠিক বাংলাদেশি নম্বর দিন (01XXXXXXXXX)'; valid = false; }
    if (!formData.address.trim()) { newErrors.address = 'ঠিকানা প্রয়োজন'; valid = false; }
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const shipping = deliveryFee;
      const total = subtotal + shipping;
      const orderedItems = items.map(item => {
        const salePrice = item.product.salePrice || item.product.price || 0;
        const discountAmt = item.product.discountAmount || 0;
        const afterDiscountPrice = discountAmt > 0 ? salePrice - discountAmt : salePrice;
        return {
          _id: item.product._id, name: item.product.name, nameEn: item.product.name,
          slug: item.product.slug, image: item.product.images?.[0] || null,
          category: item.product.category, author: item.product.author,
          publisher: item.product.publisher, subCategory: null, brand: null,
          discountType: item.product.discountType ?? 0, discountAmount: discountAmt,
          regularPrice: salePrice, unitPrice: afterDiscountPrice, salePrice: afterDiscountPrice,
          quantity: item.quantity, selectedQty: item.quantity, orderType: 'regular',
        };
      });
      const orderData = {
        name: formData.name, phoneNo: formData.phone, shippingAddress: formData.address,
        paymentType: 'cod', deliveryLocation, deliveryCharge: shipping,
        subTotal: subtotal, grandTotal: total, orderedItems,
        carts: items.map(item => item.product._id),
        cartData: items.map(item => ({ product: item.product._id, selectedQty: item.quantity, quantity: item.quantity, cartType: 0 })),
      };
      const res = await api.post('/order/add-order-by-anonymous', orderData);
      if (res.data?.success || res.status === 200 || res.status === 201) {
        const newOrderId = res.data?.data?._id || res.data?._id || res.data?.order?._id;
        clearCart();
        router.push(`/order-success?orderId=${newOrderId}`);
        toast.success('অর্ডার সফলভাবে গৃহীত হয়েছে!');
      } else {
        toast.error(res.data?.message || 'অর্ডার তৈরিতে সমস্যা হয়েছে');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'অর্ডার তৈরিতে সমস্যা হয়েছে');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: PARCHMENT, fontFamily: "'Hind Siliguri', 'Inter', system-ui, sans-serif", color: '#0f172a' }}>
      <Header />

      <StepProgress step={2}/>

      <main style={{ flex: 1 }}>
        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '8px 24px 56px' }}>
          <div className="checkout-layout">

            {/* ── LEFT — form ── */}
            <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <AccentCard icon={<IcPin size={22} color={PRIMARY}/>} title="ডেলিভারি ঠিকানা" subtitle="আপনার অর্ডার কোথায় পাঠাতে হবে">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <FormField label="আপনার নাম" required error={errors.name}>
                    <input
                      value={formData.name}
                      onChange={e => { setFormData(d => ({ ...d, name: e.target.value })); if (errors.name) setErrors(v => ({ ...v, name: '' })); }}
                      onFocus={focusIn} onBlur={focusOut}
                      placeholder="আপনার সম্পূর্ণ নাম"
                      style={errors.name ? inputError : inputBase}
                    />
                  </FormField>

                  <FormField label="মোবাইল নম্বর" required hint="১১ সংখ্যার বাংলাদেশি নম্বর (01 দিয়ে শুরু)" error={errors.phone}>
                    <input
                      type="tel" inputMode="numeric"
                      value={formData.phone}
                      onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 11); setFormData(d => ({ ...d, phone: v })); if (errors.phone) setErrors(vv => ({ ...vv, phone: '' })); }}
                      onFocus={focusIn} onBlur={focusOut}
                      placeholder="01XXXXXXXXX"
                      style={errors.phone ? inputError : inputBase}
                    />
                  </FormField>

                  <FormField label="সম্পূর্ণ ঠিকানা" required error={errors.address}>
                    <textarea
                      value={formData.address}
                      onChange={e => { setFormData(d => ({ ...d, address: e.target.value })); if (errors.address) setErrors(v => ({ ...v, address: '' })); }}
                      onFocus={focusIn as any} onBlur={focusOut as any}
                      placeholder="বাড়ি নং, রোড নং, এলাকার নাম, জেলা"
                      style={{ ...((errors.address ? inputError : inputBase) as object), height: 100, padding: '14px 16px', resize: 'none', lineHeight: 1.6 } as React.CSSProperties}
                    />
                  </FormField>

                  <FormField label="ডেলিভারি লোকেশন" required>
                    <DeliveryLocSelector
                      value={deliveryLocation}
                      onChange={setDeliveryLocation}
                      inside={insideFee}
                      outside={outsideFee}
                    />
                  </FormField>
                </div>
              </AccentCard>

              <AccentCard icon={<IcWallet size={22} color={PRIMARY}/>} title="পেমেন্ট পদ্ধতি" subtitle="নিরাপদ পেমেন্ট">
                <PaymentCOD/>
              </AccentCard>
            </form>

            {/* ── RIGHT — order summary sticky ── */}
            <div style={{ position: 'sticky', top: 16 }}>
              <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                {/* gradient header */}
                <div style={{ background: `linear-gradient(135deg, ${PRIMARY}, #14532d)`, padding: '20px 24px', color: 'white' }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>অর্ডার সারাংশ</h3>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>{itemCount}টি পণ্য</div>
                </div>

                {/* item list */}
                <div style={{ padding: '4px 24px 0' }}>
                  {items.map((item, i) => {
                    const price = getCurrentPrice(item.product);
                    const img = item.product.images?.[0];
                    return (
                      <div key={item._id || item.product._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < items.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                        <div style={{ width: 52, height: 68, flexShrink: 0, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', background: '#f8fafc' }}>
                          {img ? <img src={imgUrl(img)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{ width: '100%', height: '100%' }}/>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.product.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>পরিমাণ: {item.quantity}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>৳{price * item.quantity}</div>
                      </div>
                    );
                  })}
                </div>

                {/* price rows */}
                <div style={{ padding: '16px 24px 0' }}>
                  <SummaryRow label="উপ-মোট" value={`৳${subtotal}`}/>
                  <SummaryRow label={`ডেলিভারি চার্জ (${deliveryLabel})`} value={`৳${deliveryFee}`} valueColor={PRIMARY}/>
                </div>

                {/* grand total */}
                <div style={{ margin: '12px 24px 16px', borderTop: '2px solid #f1f5f9', paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>মোট</span>
                  <span style={{ fontSize: 26, fontWeight: 900, color: PRIMARY, fontFamily: "'Inter', sans-serif" }}>৳{grandTotal}</span>
                </div>

                {/* edit cart */}
                <div style={{ padding: '0 24px 10px' }}>
                  <a href="/cart" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                    <IcArrowL color="#374151" size={16}/> কার্ট সম্পাদনা করুন
                  </a>
                </div>

                {/* CTA */}
                <div style={{ padding: '6px 24px 16px' }}>
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      width: '100%', height: 56,
                      background: loading ? '#86efac' : `linear-gradient(135deg, ${PRIMARY}, #14532d)`,
                      color: 'white', borderRadius: 14, fontSize: 17, fontWeight: 700,
                      border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 4px 16px rgba(21,128,61,0.30)',
                      transition: 'transform .15s ease, box-shadow .2s ease',
                    }}
                    onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 24px rgba(21,128,61,0.4)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(21,128,61,0.30)'; }}
                  >
                    {loading ? (
                      <>
                        <svg style={{ animation: 'spin 1s linear infinite' }} width="20" height="20" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" strokeOpacity="0.3"/>
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
                        </svg>
                        প্রসেসিং...
                      </>
                    ) : (
                      <><IcCheck color="white" size={18}/> অর্ডার নিশ্চিত করুন</>
                    )}
                  </button>
                </div>

                {/* secure */}
                <div style={{ padding: '0 24px 22px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#9ca3af', fontSize: 12 }}>
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
