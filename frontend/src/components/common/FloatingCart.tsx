'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { usePathname, useRouter } from 'next/navigation';
import { FaShoppingCart, FaArrowRight, FaTimes } from 'react-icons/fa';

export default function FloatingCart() {
  const getTotalItems = useCartStore(state => state.getTotalItems);
  const getTotalPrice = useCartStore(state => state.getTotalPrice);
  const pathname = usePathname();
  const router = useRouter();

  // Must be mounted on client before reading localStorage-backed store
  const [mounted, setMounted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [hintMessage, setHintMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);

  const prevCountRef = useRef(0);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nudgeTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const totalItems = mounted ? getTotalItems() : 0;
  const totalPrice = mounted ? getTotalPrice() : 0;

  // Animate + hint when item count increases
  useEffect(() => {
    if (!mounted) return;
    if (totalItems > prevCountRef.current) {
      setBounce(true);
      setPulse(true);
      setTimeout(() => setBounce(false), 700);
      setTimeout(() => setPulse(false), 1000);

      showHintFor(
        totalItems === 1
          ? 'বই কার্টে যোগ হয়েছে! এখনই অর্ডার করুন'
          : `${totalItems} টি বই কার্টে আছে — অর্ডার করতে ক্লিক করুন`,
        6000
      );

      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = setTimeout(() => {
        showHintFor(`৳${totalPrice.toLocaleString()} — এখনই চেকআউট করুন! 🎉`, 7000);
      }, 25000);
    }
    prevCountRef.current = totalItems;
  }, [totalItems, mounted]);

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
  }, [mounted]);

  // All hooks done — now safe to conditionally render
  const hiddenPaths = ['/cart', '/checkout', '/order-success'];
  const isHidden = !mounted || totalItems === 0 || hiddenPaths.some((p) => pathname.startsWith(p));

  if (isHidden) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

      {/* Hint bubble */}
      <div
        className={`
          transition-all duration-300 ease-out
          ${showHint && !dismissed
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-3 pointer-events-none'}
        `}
      >
        <div className="relative bg-gray-900 text-white text-sm rounded-2xl px-4 py-3 shadow-2xl max-w-[220px] text-right leading-snug">
          {/* Dismiss button */}
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); setShowHint(false); }}
            className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors"
          >
            <FaTimes className="text-[8px] text-white" />
          </button>

          <p className="font-medium">{hintMessage}</p>

          <div className="flex items-center justify-end gap-1 mt-1.5 text-emerald-400 font-bold text-base">
            <span>৳{totalPrice.toLocaleString()}</span>
          </div>

          <button
            onClick={() => router.push('/checkout')}
            className="mt-2 w-full bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            চেকআউট করুন <FaArrowRight className="text-[10px]" />
          </button>

          {/* Arrow pointing down to button */}
          <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      </div>

      {/* Floating cart button */}
      <button
        onClick={() => router.push('/checkout')}
        className={`
          relative w-16 h-16 bg-emerald-500 hover:bg-emerald-600
          rounded-full shadow-2xl flex items-center justify-center
          transition-all duration-200 hover:scale-110 active:scale-95
          ${bounce ? 'animate-bounce' : ''}
        `}
        aria-label="Go to checkout"
      >
        {pulse && (
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
        )}

        <FaShoppingCart className="text-white text-2xl" />

        <span
          className={`
            absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1
            bg-red-500 text-white text-xs font-bold
            rounded-full flex items-center justify-center
            shadow-md border-2 border-white
            transition-transform duration-200
            ${bounce ? 'scale-125' : 'scale-100'}
          `}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      </button>
    </div>
  );
}
