'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api, { imgUrl } from '@/lib/api';
import { Product } from '@/types';
import styles from './HomeProductCard.module.css';

type AsyncState = 'idle' | 'loading' | 'error' | 'success';
export type ProductCardPreviewState = 'default' | 'hover' | 'focus' | 'active' | 'disabled' | 'loading' | 'error' | 'success';

interface HomeProductCardProps {
  product: Product;
  onAdd: (product: Product) => void | Promise<void>;
  previewState?: ProductCardPreviewState;
}

function getAuthorName(author: Product['author']): string {
  if (!author) return '';
  if (Array.isArray(author)) return (author[0] as { name?: string })?.name || '';
  if (typeof author === 'object') return author.name || '';
  return author;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}

function ErrorIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>;
}

function HeartIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
}

export default function HomeProductCard({ product, onAdd, previewState = 'default' }: HomeProductCardProps) {
  const [cartState, setCartState] = useState<AsyncState>('idle');
  const [wishlistState, setWishlistState] = useState<AsyncState>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const salePrice = product.salePrice || product.price || 0;
  const discount = product.discountAmount || 0;
  const currentPrice = Math.max(0, salePrice - discount);
  const discountPercent = salePrice > 0 ? Math.round((discount / salePrice) * 100) : 0;
  const cover = imgUrl(product.images?.[0]);
  const authorName = getAuthorName(product.author);
  const href = `/products/${product.slug || product._id}`;
  const isOutOfStock = product.stock === 0;
  const forcedAsyncState: AsyncState | null = ['loading', 'error', 'success'].includes(previewState)
    ? previewState as AsyncState
    : null;
  const visibleCartState = forcedAsyncState || cartState;
  const isDisabled = isOutOfStock || previewState === 'disabled' || visibleCartState === 'loading';

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const scheduleReset = (delay: number) => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCartState('idle'), delay);
  };

  const handleAdd = async () => {
    if (isDisabled) return;
    setCartState('loading');
    try {
      await Promise.resolve(onAdd(product));
      setCartState('success');
      scheduleReset(1600);
    } catch {
      setCartState('error');
      toast.error('কার্টে যোগ করা যায়নি—আবার চেষ্টা করুন');
      scheduleReset(2600);
    }
  };

  const handleWishlist = async () => {
    if (wishlistState === 'loading') return;
    setWishlistState('loading');
    try {
      const response = await api.post('/wishList/add-to-wish-list', { product: product._id, selectedQty: 1 });
      if (!response.data?.success) throw new Error(response.data?.message || 'লগইন করুন');
      setWishlistState('success');
      toast.success('ইচ্ছা তালিকায় যোগ হয়েছে');
    } catch (error) {
      setWishlistState('error');
      toast.error(error instanceof Error ? error.message : 'লগইন করুন');
      setTimeout(() => setWishlistState('idle'), 2200);
    }
  };

  const cartLabel = isOutOfStock
    ? 'স্টক শেষ'
    : visibleCartState === 'loading'
      ? 'যোগ হচ্ছে…'
      : visibleCartState === 'success'
        ? 'যোগ হয়েছে'
        : visibleCartState === 'error'
          ? 'আবার চেষ্টা'
          : 'কার্টে যোগ করুন';

  const cartIcon = visibleCartState === 'loading'
    ? <span className={styles.spinner} aria-hidden="true" />
    : visibleCartState === 'success'
      ? <CheckIcon />
      : visibleCartState === 'error'
        ? <ErrorIcon />
        : null;

  return (
    <article className={styles.card} data-preview-state={previewState}>
      <Link href={href} className={styles.mediaLink} aria-label={`${product.name} দেখুন`}>
        <div className={styles.media}>
          {cover ? (
            <img className={styles.cover} src={cover} alt={`${product.name} বইয়ের প্রচ্ছদ`} width="320" height="448" loading="lazy" />
          ) : (
            <span className={styles.placeholder}>{product.name}</span>
          )}
          {discountPercent > 0 && <span className={styles.discount}>ছাড় {discountPercent}%</span>}
        </div>
      </Link>

      <button
        type="button"
        className={styles.wishlist}
        data-state={wishlistState}
        aria-label={wishlistState === 'success' ? 'ইচ্ছা তালিকায় যোগ হয়েছে' : 'ইচ্ছা তালিকায় যোগ করুন'}
        aria-pressed={wishlistState === 'success'}
        aria-busy={wishlistState === 'loading'}
        onClick={handleWishlist}
        disabled={wishlistState === 'loading'}
      >
        {wishlistState === 'loading' ? <span className={styles.spinner} aria-hidden="true" /> : <HeartIcon />}
      </button>

      <div className={styles.content}>
        <Link href={href} className={styles.titleLink}>
          <h3 className={styles.title}>{product.name}</h3>
        </Link>
        <p className={styles.author}>{authorName || 'শবাজ প্রকাশনা'}</p>

        <div className={styles.purchaseRow}>
          <div className={styles.pricing} aria-label={`বর্তমান মূল্য ${currentPrice} টাকা`}>
            <span className={styles.price}>৳{currentPrice.toLocaleString('en-IN')}</span>
            {discount > 0 && <span className={styles.oldPrice}>৳{salePrice.toLocaleString('en-IN')}</span>}
          </div>
          <button
            type="button"
            className={styles.cartButton}
            data-state={visibleCartState}
            aria-label={cartLabel}
            aria-busy={visibleCartState === 'loading'}
            aria-invalid={visibleCartState === 'error' || undefined}
            disabled={isDisabled}
            onClick={handleAdd}
          >
            {cartIcon}
            <span className={styles.cartLabel}>{cartLabel}</span>
          </button>
          <span className={styles.status} role="status" aria-live="polite">{cartLabel}</span>
        </div>
      </div>
    </article>
  );
}
