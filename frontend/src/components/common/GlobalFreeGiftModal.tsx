'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import {
  isFreeNotebookEligible,
  getPaidNotebookQty,
  getPaidSubtotal,
} from '@/lib/notebookOffer';
import FreeNotebookPicker from '@/components/common/FreeNotebookPicker';

// Site-wide free-notebook gift popup. Auto-opens the moment the cart qualifies
// (2+ notebooks OR paid subtotal >= 500tk) on ANY page, lets the shopper pick /
// swap their free notebook, then go to checkout when ready. Picking does NOT
// auto-route — the shopper stays in control.
export default function GlobalFreeGiftModal() {
  const router = useRouter();
  const pathname = usePathname();
  const items = useCartStore((s) => s.items);
  const setFreeGift = useCartStore((s) => s.setFreeGift);

  const [open, setOpen] = useState(false);
  const dismissedRef = useRef(false);

  const giftItem = items.find((i) => i.isFreeGift);
  const eligible = isFreeNotebookEligible(items);
  const paidNotebookQty = getPaidNotebookQty(items);
  const paidSubtotal = getPaidSubtotal(items);
  const hasPaidItems = items.some((i) => !i.isFreeGift);

  // The cart and checkout pages handle the gift inline — don't interrupt there.
  const suppressed = pathname === '/cart' || pathname === '/checkout';

  const close = () => {
    dismissedRef.current = true;
    setOpen(false);
  };

  const handlePick = (product: Product) => {
    setFreeGift(product); // stays open + highlights — no auto-checkout
  };

  useEffect(() => {
    if (!eligible || !hasPaidItems) {
      dismissedRef.current = false; // reset so it can pop again next time they qualify
      setOpen(false);
      return;
    }
    if (suppressed) return;
    if (!giftItem && !dismissedRef.current) {
      setOpen(true);
    }
  }, [eligible, hasPaidItems, giftItem, suppressed]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open || !eligible || !hasPaidItems || suppressed) return null;

  const byNotebookQty = paidNotebookQty >= 2;
  const title = byNotebookQty
    ? '২ টি নোটবুক কিনলে ১ টি ফ্রি'
    : '🎉 অভিনন্দন! একটি প্রিমিয়াম নোটবুক গিফট ফ্রি';
  const copy = byNotebookQty
    ? 'আপনার কার্টে ২টি নোটবুক আছে। এখন যেকোনো একটি নোটবুক ফ্রি বেছে নিন — পছন্দ না হলে অন্যটিতে ক্লিক করে পরিবর্তন করতে পারবেন।'
    : 'আপনার অর্ডার ৫০০ টাকার বেশি হয়েছে। Shobaz থেকে উপহার হিসেবে যেকোনো একটি প্রিমিয়াম নোটবুক সম্পূর্ণ বিনামূল্যে বেছে নিন।';

  return (
    <div className="gfm-modal" role="dialog" aria-modal="true" aria-label="Free notebook gift" onClick={close}>
      <div className="gfm-card" onClick={(e) => e.stopPropagation()}>
        <div className="gfm-top">
          <div>
            <div className="gfm-badge">🎁 ফ্রি গিফট আনলকড</div>
            <h3>{title}</h3>
            <p>{copy}</p>
          </div>
          <button type="button" className="gfm-close" onClick={close} aria-label="বন্ধ করুন">×</button>
        </div>

        <FreeNotebookPicker selectedId={giftItem?.product._id} onPick={handlePick} />

        <div className="gfm-actions">
          {giftItem ? (
            <div className="gfm-picked">✓ {giftItem.product.name} ফ্রি গিফট হিসেবে যুক্ত হয়েছে</div>
          ) : (
            <div className="gfm-foot">উপরের ৩টি থেকে আপনার পছন্দের ১টি নোটবুক বেছে নিন</div>
          )}
          <div className="gfm-btn-row">
            <button type="button" className="gfm-btn gfm-btn-ghost" onClick={close}>Continue Shopping</button>
            <button
              type="button"
              className="gfm-btn gfm-btn-primary"
              disabled={!giftItem}
              onClick={() => { if (!giftItem) return; setOpen(false); router.push('/checkout'); }}
            >
              Go to Checkout
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </div>
        </div>

        <div className="gfm-meta">কার্টে নোটবুক: {paidNotebookQty} টি · অর্ডার ভ্যালু: ৳{paidSubtotal}</div>
      </div>

      <style jsx>{`
        .gfm-modal { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 18px; background: rgba(7,26,7,0.72); backdrop-filter: blur(8px); animation: gfmBackdrop .2s ease; }
        @keyframes gfmBackdrop { from { opacity: 0; } to { opacity: 1; } }
        .gfm-card { width: min(760px, 100%); max-height: 92vh; overflow: auto; background: #F6FBF6; color: #071A07; border-radius: 24px; border: 1px solid #C8E6C9; box-shadow: 0 34px 90px rgba(7,26,7,0.38); padding: 24px; font-family: "Hind Siliguri", sans-serif; animation: gfmPop .42s cubic-bezier(.2,.75,.18,1); }
        @keyframes gfmPop { 0% { opacity: 0; transform: translateY(22px) scale(.94); } 60% { transform: translateY(-3px) scale(1.01); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .gfm-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 18px; }
        .gfm-badge { display: inline-flex; align-items: center; gap: 8px; padding: 7px 11px; border-radius: 999px; background: #D4AF37; color: #071A07; font-weight: 900; font-size: 13px; margin-bottom: 10px; }
        .gfm-card h3 { margin: 0 0 8px; font-size: 30px; line-height: 1.14; }
        .gfm-card p { margin: 0; color: #2E4A2E; font-size: 15px; line-height: 1.65; max-width: 580px; }
        .gfm-close { flex-shrink: 0; width: 40px; height: 40px; border-radius: 999px; border: 1px solid #C8E6C9; background: #fff; color: #071A07; font-size: 24px; line-height: 1; cursor: pointer; display: grid; place-items: center; }
        .gfm-close:hover { background: #E8F5E9; }
        .gfm-actions { margin-top: 18px; }
        .gfm-picked { text-align: center; color: #1B6B1B; font-weight: 800; font-size: 14px; margin-bottom: 12px; }
        .gfm-btn-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .gfm-btn { flex: 1 1 200px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px 20px; border-radius: 14px; font-weight: 800; font-size: 15px; cursor: pointer; border: 1px solid transparent; font-family: inherit; transition: transform .12s ease, background .15s ease; }
        .gfm-btn:hover { transform: translateY(-1px); }
        .gfm-btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }
        .gfm-btn-primary { background: #1B6B1B; color: #fff; box-shadow: 0 12px 24px -14px rgba(27,107,27,0.7); }
        .gfm-btn-primary:hover { background: #2E7D32; }
        .gfm-btn-ghost { background: transparent; color: #2E4A2E; border-color: #A5C8A5; }
        .gfm-btn-ghost:hover { background: #E8F5E9; }
        .gfm-foot { margin-top: 16px; text-align: center; color: #4A6B4A; font-size: 14px; font-weight: 600; }
        .gfm-meta { margin-top: 14px; text-align: center; color: #6b8a6b; font-size: 12.5px; }
        @media (max-width: 640px) {
          .gfm-card { padding: 18px; border-radius: 18px; }
          .gfm-card h3 { font-size: 23px; }
        }
      `}</style>
    </div>
  );
}
