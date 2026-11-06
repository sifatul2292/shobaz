'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { usePathname, useRouter } from 'next/navigation';
import { FaShoppingCart, FaArrowRight, FaTimes, FaCheck } from 'react-icons/fa';
import { imgUrl } from '@/lib/api';
import { Product } from '@/types';

interface AddedNotice {
  product: Product;
  quantity: number;
  isFreeGift: boolean;
  key: number;
}

const NOTICE_MS = 5000;
const HIDDEN_PATHS = ['/cart', '/checkout', '/order-success'];

export default function FloatingCart() {
  const items = useCartStore(state => state.items);
  const pathname = usePathname();
  const router = useRouter();

  // Must be mounted on client before reading localStorage-backed store
  const [mounted, setMounted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [hintMessage, setHintMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [notice, setNotice] = useState<AddedNotice | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticePaused, setNoticePaused] = useState(false);

  const prevCountRef = useRef<number | null>(null);
  const prevQtyRef = useRef<Map<string, number>>(new Map());
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nudgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showHintFor = useCallback((msg: string, duration = 5000) => {
    setHintMessage(msg);
    setDismissed(false);
    setShowHint(true);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setShowHint(false), duration);
  }, []);

  const closeNotice = useCallback(() => {
    setNoticeOpen(false);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
  }, []);

  // Auto-dismiss the add-to-cart notice; pauses while hovered/focused.
  useEffect(() => {
    if (!noticeOpen || noticePaused) return;
    noticeTimerRef.current = setTimeout(() => setNoticeOpen(false), NOTICE_MS);
    return () => { if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current); };
  }, [noticeOpen, noticePaused, notice?.key]);

  // Escape closes the notice.
  useEffect(() => {
    if (!noticeOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeNotice(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [noticeOpen, closeNotice]);

  // Compute directly from items — re-renders instantly when items change
  const totalItems = mounted ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;
  const totalPrice = mounted ? items.reduce((sum, i) => {
    if (i.isFreeGift) return sum;
    const price = (i.product.salePrice || 0) - (i.product.discountAmount || 0);
    return sum + price * i.quantity;
  }, 0) : 0;

  // Animate + notify only when the count grows *after* mount. The first pass
  // just records what the persisted cart already holds, so reloading a page
  // never shows a false "added to cart" message.
  useEffect(() => {
    if (!mounted) return;
    const nextQty = new Map(items.map((i) => [i._id, i.quantity] as const));

    if (prevCountRef.current === null) {
      prevCountRef.current = totalItems;
      prevQtyRef.current = nextQty;
      return;
    }

    if (totalItems > prevCountRef.current) {
      setBounce(true);
      setPulse(true);
      setTimeout(() => setBounce(false), 700);
      setTimeout(() => setPulse(false), 1000);

      const added = items.find((i) => (prevQtyRef.current.get(i._id) || 0) < i.quantity);
      const onHiddenPath = HIDDEN_PATHS.some((p) => pathname.startsWith(p));
      if (added && !onHiddenPath) {
        setNotice({
          product: added.product,
          quantity: added.quantity - (prevQtyRef.current.get(added._id) || 0),
          isFreeGift: Boolean(added.isFreeGift),
          key: Date.now(),
        });
        setNoticePaused(false);
        setNoticeOpen(true);
        setShowHint(false);
      }

      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = setTimeout(() => {
        showHintFor(`৳${totalPrice.toLocaleString()} — এখনই চেকআউট করুন! 🎉`, 7000);
      }, 25000);
    }
    prevCountRef.current = totalItems;
    prevQtyRef.current = nextQty;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, mounted]);

  // Nudge after 8s on page load if cart already has items
  useEffect(() => {
    if (!mounted || totalItems === 0) return;
    nudgeTimerRef.current = setTimeout(() => {
      showHintFor(`${totalItems} টি বই অপেক্ষা করছে — অর্ডার করুন!`, 6000);
    }, 8000);
    return () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // All hooks done — now safe to conditionally render
  const isHidden = !mounted || totalItems === 0 || HIDDEN_PATHS.some((p) => pathname.startsWith(p));

  if (isHidden) return null;

  const noticeProduct = notice?.product;
  const noticeImg = noticeProduct ? imgUrl(noticeProduct.images?.[0]) : null;
  const noticePrice = noticeProduct
    ? Math.max(0, (noticeProduct.salePrice || 0) - (noticeProduct.discountAmount || 0))
    : 0;

  return (
    <>
      {/* ── Added-to-cart notification ── */}
      {notice && noticeProduct && (
        <div
          className={`cart-notice${noticeOpen ? ' is-open' : ''}`}
          role="status"
          aria-live="polite"
          aria-hidden={!noticeOpen}
          onMouseEnter={() => setNoticePaused(true)}
          onMouseLeave={() => setNoticePaused(false)}
          onFocus={() => setNoticePaused(true)}
          onBlur={() => setNoticePaused(false)}
        >
          <div className="cart-notice-head">
            <span className="cart-notice-check"><FaCheck /></span>
            <span>{notice.isFreeGift ? 'ফ্রি উপহার কার্টে যোগ হয়েছে 🎁' : 'কার্টে যোগ হয়েছে'}</span>
            <button type="button" className="cart-notice-close" onClick={closeNotice} aria-label="বন্ধ করুন" tabIndex={noticeOpen ? 0 : -1}>
              <FaTimes />
            </button>
          </div>
          <div className="cart-notice-body">
            <div className="cart-notice-thumb">
              {noticeImg ? <img src={noticeImg} alt="" /> : <FaShoppingCart />}
            </div>
            <div className="cart-notice-info">
              <p className="cart-notice-name">{noticeProduct.name}</p>
              <p className="cart-notice-meta">
                {notice.quantity} × {notice.isFreeGift ? 'ফ্রি' : `৳${noticePrice.toLocaleString()}`}
              </p>
            </div>
          </div>
          <div className="cart-notice-actions">
            <button type="button" className="cart-notice-btn ghost" tabIndex={noticeOpen ? 0 : -1} onClick={() => { closeNotice(); router.push('/cart'); }}>
              কার্ট দেখুন ({totalItems})
            </button>
            <button type="button" className="cart-notice-btn solid" tabIndex={noticeOpen ? 0 : -1} onClick={() => { closeNotice(); router.push('/checkout'); }}>
              চেকআউট করুন <FaArrowRight className="text-[11px]" />
            </button>
          </div>
          <span key={notice.key} className={`cart-notice-timer${noticePaused ? ' is-paused' : ''}`} aria-hidden="true" />
        </div>
      )}

      <div className="floating-cart fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2">

        {/* Hint bubble */}
        <div
          className={`
            transition-all duration-300 ease-out
            ${showHint && !dismissed && !noticeOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-3 pointer-events-none'}
          `}
        >
          <div className="relative bg-[#111] text-white text-sm rounded-2xl px-4 py-3 shadow-2xl max-w-[220px] text-right leading-snug">
            {/* Dismiss button */}
            <button
              onClick={(e) => { e.stopPropagation(); setDismissed(true); setShowHint(false); }}
              className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors"
              aria-label="বন্ধ করুন"
            >
              <FaTimes className="text-[8px] text-white" />
            </button>

            <p className="font-medium">{hintMessage}</p>

            <div className="flex items-center justify-end gap-1 mt-1.5 text-emerald-400 font-bold text-base">
              <span>৳{totalPrice.toLocaleString()}</span>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              className="mt-2 w-full bg-white hover:bg-[#ecfdf3] text-[#111] text-xs font-bold py-1.5 px-3 rounded-full flex items-center justify-center gap-1.5 transition-colors"
            >
              চেকআউট করুন <FaArrowRight className="text-[10px]" />
            </button>

            {/* Arrow pointing down to button */}
            <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#111]" />
          </div>
        </div>

        {/* Floating cart button */}
        <button
          onClick={() => router.push('/checkout')}
          className={`
            relative w-12 h-12 sm:w-14 sm:h-14 bg-[#111] hover:bg-[#15803d]
            rounded-full shadow-[0_14px_30px_-12px_rgba(17,17,17,0.55)] flex items-center justify-center
            transition-all duration-200 hover:scale-110 active:scale-95
            ${bounce ? 'animate-bounce' : ''}
          `}
          aria-label="Go to checkout"
        >
          {pulse && (
            <span className="absolute inset-0 rounded-full bg-[#111] animate-ping opacity-30" />
          )}

          <FaShoppingCart className="text-white text-lg sm:text-xl" />

          <span
            className={`
              absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1
              bg-white text-[#111] text-xs font-bold
              rounded-full flex items-center justify-center
              shadow-md border border-[#111]
              transition-transform duration-200
              ${bounce ? 'scale-125' : 'scale-100'}
            `}
          >
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        </button>
      </div>
    </>
  );
}
