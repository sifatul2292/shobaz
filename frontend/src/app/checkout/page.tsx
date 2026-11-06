'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import api, { imgUrl } from '@/lib/api';
import { gtmBeginCheckout, gtmAddPaymentInfo } from '@/lib/gtm';
import { phBeginCheckout } from '@/lib/posthog';
import toast from 'react-hot-toast';
import Link from 'next/link';
import CheckoutSteps from '@/components/common/CheckoutSteps';

// ── Design tokens ─────────────────────────────────────────────────────
const PRIMARY = '#16a34a';
const PARCHMENT = '#f5f0e8';

// ── Types ─────────────────────────────────────────────────────────────
interface WeightRule { fromGram: number; toGram: number; cost: number; }
interface ShippingCharge {
  deliveryInDhaka: number;
  deliveryOutsideDhaka: number;
  deliveryOutsideBD?: number;
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

// ── Form field ────────────────────────────────────────────────────────
function FormField({ label, required, hint, error, htmlFor, children }: {
  label: string; required?: boolean; hint?: string; error?: string; htmlFor?: string; children: React.ReactNode;
}) {
  return (
    <div className="co-field">
      <label htmlFor={htmlFor}>
        {label}{required && <span className="co-req" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && <div className="co-hint">{hint}</div>}
      {error && <div className="co-error" role="alert">{error}</div>}
    </div>
  );
}

// ── Delivery location selector ─────────────────────────────────────────
function DeliveryLocSelector({ value, onChange, inside, outside }: {
  value: 'inside' | 'outside'; onChange: (v: 'inside' | 'outside') => void; inside: number; outside: number;
}) {
  const opts = [
    { id: 'inside' as const, title: 'ঢাকা সিটির ভিতরে', sub: '১–২ কার্যদিবস', price: inside, icon: <IcPin size={20} color="currentColor"/> },
    { id: 'outside' as const, title: 'ঢাকা সিটির বাইরে', sub: '২–৪ কার্যদিবস', price: outside, icon: <IcTruck size={20} color="currentColor"/> },
  ];
  return (
    <div className="co-options" role="radiogroup" aria-label="ডেলিভারি লোকেশন">
      {opts.map(o => {
        const selected = value === o.id;
        return (
          <button
            key={o.id} type="button" role="radio" aria-checked={selected}
            onClick={() => onChange(o.id)}
            className={`co-option${selected ? ' is-selected' : ''}`}
          >
            <span className="co-radio" aria-hidden="true" />
            <span className="co-option-icon">{o.icon}</span>
            <span className="co-option-text">
              <b>{o.title}</b>
              <small>{o.sub}</small>
            </span>
            <span className="co-option-price">৳{o.price}</span>
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
      <div className="co-option is-selected co-option--static">
        <span className="co-radio" aria-hidden="true" />
        <span className="co-option-icon"><IcCash size={20} color="currentColor"/></span>
        <span className="co-option-text">
          <b>ক্যাশ অন ডেলিভারি</b>
          <small>পণ্য হাতে পেয়ে টাকা দিন</small>
        </span>
      </div>
      <p className="co-secure"><IcShield color="currentColor" size={14}/> আপনার অর্ডার সম্পূর্ণ নিরাপদ</p>
    </>
  );
}

// ── Summary row ───────────────────────────────────────────────────────
function SummaryRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="co-row">
      <span>{label}</span>
      <b className={valueClass}>{value}</b>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────
function EmptyCheckout() {
  return (
    <div className="co-page min-h-screen flex flex-col">
      <Header />
      <main className="co-empty">
        <div>
          <span className="co-empty-icon"><IcCart size={34} color="#111"/></span>
          <h1>আপনার কার্ট খালি</h1>
          <p>আপনি কোনো পণ্য যোগ করেননি</p>
          <Link href="/products" className="co-btn co-btn--solid">বই কিনুন <IcArrowR size={16}/></Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart, reconcileFreeGift } = useCartStore();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shippingCharge, setShippingCharge] = useState<ShippingCharge | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<'inside' | 'outside'>('inside');
  const [formData, setFormData] = useState({ name: user?.name || '', phone: '', address: '', email: user?.email || '' });
  const [errors, setErrors] = useState({ name: '', phone: '', address: '', email: '' });
  const [freshWeights, setFreshWeights] = useState<Record<string, number>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const incompleteOrderSaved = useRef(false);
  const beginCheckoutTracked = useRef(false);

  useEffect(() => {
    setMounted(true);
    document.title = 'চেকআউট - Shobaz';
    reconcileFreeGift();
    api.get('/shipping-charge/get').then(res => {
      if (res.data?.data) setShippingCharge(res.data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const ids = items.map(i => i.product._id);
    api.post('/product/get-products-by-ids', { ids }, { params: { select: 'weight' } })
      .then(res => {
        const products: any[] = res.data?.data || [];
        console.log('[WEIGHT] raw products from API:', products.map((p: any) => ({ id: p._id, weight: p.weight })));
        const map: Record<string, number> = {};
        products.forEach((p: any) => { map[p._id] = Number(p.weight) || 0; });
        console.log('[WEIGHT] freshWeights map:', map);
        setFreshWeights(map);
      }).catch((err) => { console.error('[WEIGHT] fetch failed:', err); });
  }, [items]);

  useEffect(() => {
    if (!mounted || beginCheckoutTracked.current || items.length === 0) return;

    beginCheckoutTracked.current = true;
    const cartProducts = items.map(i => ({ ...i.product, quantity: i.quantity }));
    const total = getTotalPrice();
    // event_id shared with Tagioo's GA4-forwarded browser pixel + server CAPI tags.
    gtmBeginCheckout(cartProducts, total, { name: formData.name, phone: formData.phone });
    phBeginCheckout(cartProducts, total);
  }, [mounted, items, getTotalPrice, formData.name, formData.phone]);

  if (!mounted) return <div className="co-page" style={{ minHeight: '100vh' }}/>;
  if (items.length === 0) return <EmptyCheckout />;

  const insideFee = shippingCharge?.deliveryInDhaka ?? 60;
  const outsideFee = shippingCharge?.deliveryOutsideDhaka ?? 80;
  const totalWeightGrams = items.reduce((sum, item) => {
    const w = freshWeights[item.product._id] ?? (Number(item.product.weight) || 0);
    return sum + w * item.quantity;
  }, 0);
  const calcWeightFee = (rules: { fromGram: number; toGram: number; cost: number }[] | undefined, fallback: number): number => {
    if (!rules || rules.length === 0) return fallback;
    const match = rules.find(r => totalWeightGrams >= r.fromGram && totalWeightGrams <= r.toGram);
    if (match) return match.cost;
    // weight exceeds all rules — use last rule's cost
    return rules[rules.length - 1].cost;
  };
  // Notebook free-shipping removed: delivery charge must never be zero
  const notebookFreeShipping = false;

  const baseDeliveryFee = deliveryLocation === 'inside'
    ? calcWeightFee(shippingCharge?.insideDhakaRules, insideFee)
    : calcWeightFee(shippingCharge?.outsideDhakaRules, outsideFee);
  const deliveryFee = notebookFreeShipping ? 0 : baseDeliveryFee;
  console.log('[WEIGHT] totalWeightGrams:', totalWeightGrams, '| deliveryFee:', deliveryFee, '| location:', deliveryLocation);
  const deliveryLabel = deliveryLocation === 'inside' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে';
  const subtotal = getTotalPrice();
  const grandTotal = subtotal + deliveryFee;
  const giftItem = items.find(i => i.isFreeGift);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const validateForm = () => {
    const newErrors = { name: '', phone: '', address: '', email: '' };
    let valid = true;
    if (!formData.name.trim()) { newErrors.name = 'নাম প্রয়োজন'; valid = false; }
    if (!formData.phone.trim()) { newErrors.phone = 'ফোন নম্বর প্রয়োজন'; valid = false; }
    else if (!/^01\d{9}$/.test(formData.phone)) { newErrors.phone = 'সঠিক বাংলাদেশি নম্বর দিন (01XXXXXXXXX)'; valid = false; }
    if (!formData.address.trim()) { newErrors.address = 'ঠিকানা প্রয়োজন'; valid = false; }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { newErrors.email = 'সঠিক ইমেইল দিন'; valid = false; }
    setErrors(newErrors);
    return valid;
  };

  const handleAddressBlur = () => {
    if (incompleteOrderSaved.current) return;
    const { name, phone, address } = formData;
    if (!name.trim() || !/^01\d{9}$/.test(phone) || !address.trim()) return;
    incompleteOrderSaved.current = true;
    const shipping = deliveryFee;
    const total = getTotalPrice() + shipping;
    const orderedItems = items.map(item => {
      const salePrice = item.product.salePrice || item.product.price || 0;
      const discountAmt = item.product.discountAmount || 0;
      const afterDiscountPrice = discountAmt > 0 ? salePrice - discountAmt : salePrice;
      return { _id: item.product._id, name: item.product.name, unitPrice: afterDiscountPrice, quantity: item.quantity };
    });
    api.post('/order/add-incomplete-order', {
      name: name.trim(), phoneNo: phone, shippingAddress: address.trim(),
      email: formData.email.trim() || undefined,
      paymentType: 'cod', deliveryCharge: shipping,
      subTotal: getTotalPrice(), grandTotal: total, orderedItems,
    }).catch(() => {});
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const shipping = deliveryFee;
      const total = subtotal + shipping;
      // AddPaymentInfo twin: GA4 add_payment_info -> sGTM + Meta pixel, one shared event_id.
      // COD-only checkout: payment intent is committed at order submission.
      gtmAddPaymentInfo(items.map(i => ({ ...i.product, quantity: i.quantity })), total, 'cod');
      const orderedItems = items.map(item => {
        if (item.isFreeGift) {
          // Free notebook — zero priced so it never adds to subtotal/grandTotal.
          return {
            _id: item.product._id, name: item.product.name, nameEn: item.product.name,
            slug: item.product.slug, image: item.product.images?.[0] || null,
            category: item.product.category, author: item.product.author,
            publisher: item.product.publisher, subCategory: null, brand: null,
            discountType: 0, discountAmount: 0,
            regularPrice: 0, unitPrice: 0, salePrice: 0,
            quantity: 1, selectedQty: 1, orderType: 'free', isFreeGift: true,
          };
        }
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
        email: formData.email.trim() || undefined,
        paymentType: 'cod', deliveryLocation, deliveryCharge: shipping,
        subTotal: subtotal, grandTotal: total, orderedItems,
        carts: items.map(item => item.product._id),
        cartData: items.map(item => ({ product: item.product._id, selectedQty: item.quantity, quantity: item.quantity, cartType: 0 })),
      };
      const res = await api.post('/order/add-order-by-anonymous', orderData);
      if (res.data?.success || res.status === 200 || res.status === 201) {
        const createdOrder = res.data?.data || res.data?.order || res.data;
        const newOrderId = createdOrder?._id || res.data?._id || res.data?.order?._id;
        // purchase event fires once on /order-success (thank-you page), keyed by
        // canonical orderId — do NOT push it here (premature, duplicate, wrong txn id)
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

  const orderSummary = (
    <>
      <ul className="co-items">
        {items.map((item) => {
          const price = getCurrentPrice(item.product);
          const img = item.product.images?.[0];
          const isGift = item.isFreeGift;
          return (
            <li key={item._id || item.product._id} className="co-item">
              <span className="co-item-thumb">
                {img ? <img src={imgUrl(img)!} alt=""/> : null}
                <span className="co-item-qty">{item.quantity}</span>
              </span>
              <span className="co-item-text">
                <b>{item.product.name}</b>
                {isGift
                  ? <small className="co-gift">🎁 ফ্রি উপহার</small>
                  : <small>{getAuthorName(item.product.author) || `পরিমাণ: ${item.quantity}`}</small>}
              </span>
              {isGift ? (
                <span className="co-item-price"><b className="co-free">৳0</b><s>৳{price}</s></span>
              ) : (
                <span className="co-item-price"><b>৳{price * item.quantity}</b></span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="co-rows">
        <SummaryRow label="উপ-মোট" value={`৳${subtotal}`}/>
        {giftItem && <SummaryRow label="🎁 ফ্রি নোটবুক" value="৳0" valueClass="co-free"/>}
        <SummaryRow
          label={notebookFreeShipping ? `ডেলিভারি চার্জ (${deliveryLabel}) 🎉 ৩টি নোটবুক অফার` : `ডেলিভারি চার্জ (${deliveryLabel})`}
          value={notebookFreeShipping ? 'ফ্রি!' : `৳${deliveryFee}`}
        />
      </div>

      <div className="co-total">
        <span>মোট</span>
        <b><small>BDT</small> ৳{grandTotal}</b>
      </div>
    </>
  );

  return (
    <div className="co-page min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="co-wrap">
          <CheckoutSteps step={2} />

          {/* Phone: collapsible order summary (Shopify pattern) */}
          <details className="co-mobile-summary">
            <summary>
              <span>অর্ডার সারাংশ দেখুন <small>({itemCount}টি পণ্য)</small></span>
              <b>৳{grandTotal}</b>
            </summary>
            <div className="co-mobile-summary-body">{orderSummary}</div>
          </details>

          <div className="co-layout">
            {/* ── LEFT — form ── */}
            <form ref={formRef} onSubmit={handleSubmit} className="co-form" noValidate>
              <section className="co-section">
                <h2>যোগাযোগ</h2>
                <div className="co-grid">
                  <FormField label="আপনার নাম" required error={errors.name} htmlFor="co-name">
                    <input
                      id="co-name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={e => { setFormData(d => ({ ...d, name: e.target.value })); if (errors.name) setErrors(v => ({ ...v, name: '' })); }}
                      placeholder="আপনার সম্পূর্ণ নাম"
                      className={`co-input${errors.name ? ' is-error' : ''}`}
                      aria-invalid={Boolean(errors.name) || undefined}
                    />
                  </FormField>

                  <FormField label="মোবাইল নম্বর" required hint="১১ সংখ্যার বাংলাদেশি নম্বর (01 দিয়ে শুরু)" error={errors.phone} htmlFor="co-phone">
                    <input
                      id="co-phone"
                      type="tel" inputMode="numeric" autoComplete="tel-national"
                      value={formData.phone}
                      onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 11); setFormData(d => ({ ...d, phone: v })); if (errors.phone) setErrors(vv => ({ ...vv, phone: '' })); }}
                      placeholder="01XXXXXXXXX"
                      className={`co-input${errors.phone ? ' is-error' : ''}`}
                      aria-invalid={Boolean(errors.phone) || undefined}
                    />
                  </FormField>

                  <FormField label="ইমেইল (ঐচ্ছিক)" error={errors.email} htmlFor="co-email">
                    <input
                      id="co-email"
                      type="email" autoComplete="email"
                      value={formData.email}
                      onChange={e => { setFormData(d => ({ ...d, email: e.target.value })); if (errors.email) setErrors(v => ({ ...v, email: '' })); }}
                      placeholder="example@email.com"
                      className={`co-input${errors.email ? ' is-error' : ''}`}
                      aria-invalid={Boolean(errors.email) || undefined}
                    />
                  </FormField>
                </div>
              </section>

              <section className="co-section">
                <h2>ডেলিভারি</h2>
                <div className="co-grid">
                  <FormField label="সম্পূর্ণ ঠিকানা" required error={errors.address} htmlFor="co-address">
                    <textarea
                      id="co-address"
                      autoComplete="street-address"
                      value={formData.address}
                      onChange={e => { setFormData(d => ({ ...d, address: e.target.value })); if (errors.address) setErrors(v => ({ ...v, address: '' })); }}
                      onBlur={handleAddressBlur}
                      placeholder="বাড়ি নং, রোড নং, এলাকার নাম, জেলা"
                      rows={3}
                      className={`co-input co-textarea${errors.address ? ' is-error' : ''}`}
                      aria-invalid={Boolean(errors.address) || undefined}
                    />
                  </FormField>

                  <FormField label="ডেলিভারি লোকেশন" required>
                    <DeliveryLocSelector
                      value={deliveryLocation}
                      onChange={setDeliveryLocation}
                      // Show the same weight-based fee that is actually charged (base rate showed ৳60 while ৳80 was billed).
                      inside={notebookFreeShipping ? 0 : calcWeightFee(shippingCharge?.insideDhakaRules, insideFee)}
                      outside={notebookFreeShipping ? 0 : calcWeightFee(shippingCharge?.outsideDhakaRules, outsideFee)}
                    />
                  </FormField>
                </div>
              </section>

              <section className="co-section">
                <h2>পেমেন্ট</h2>
                <PaymentCOD/>
              </section>

              <div className="co-submit">
                <button type="submit" disabled={loading} className="co-btn co-btn--solid co-btn--block co-btn--lg">
                  {loading ? (
                    <>
                      <span className="co-spinner" aria-hidden="true" />
                      প্রসেসিং...
                    </>
                  ) : (
                    <>অর্ডার নিশ্চিত করুন · ৳{grandTotal}</>
                  )}
                </button>
                <a href="/cart" className="co-back">
                  <IcArrowL color="currentColor" size={14}/> কার্ট সম্পাদনা করুন
                </a>
                <p className="co-fine"><IcLock color="currentColor" size={12}/> নিরাপদ পেমেন্ট গ্যারান্টি</p>
              </div>
            </form>

            {/* ── RIGHT — order summary ── */}
            <aside className="co-aside" aria-label="অর্ডার সারাংশ">
              <div className="co-aside-inner">
                <h2>অর্ডার সারাংশ <small>{itemCount}টি পণ্য</small></h2>
                {orderSummary}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
