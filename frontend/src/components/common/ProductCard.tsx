'use client';

import { memo } from 'react';
import Link from 'next/link';
import LazyImage from '@/components/ui/LazyImage';
import { Product } from '@/types';
import { imgUrl } from '@/lib/api';

function cvIndex(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return (Math.abs(h) % 12) + 1;
}

function getCurrentPrice(p: Product) {
  const salePrice = p.salePrice || 0;
  const discount = p.discountAmount || 0;
  return discount > 0 ? salePrice - discount : salePrice;
}

function getDiscountPercent(p: Product) {
  const salePrice = p.salePrice || 0;
  const discount = p.discountAmount || 0;
  if (!discount || !salePrice) return 0;
  return Math.round((discount / salePrice) * 100);
}

function getAuthorName(authorData: Product['author']): string {
  if (!authorData) return '';
  if (Array.isArray(authorData)) return (authorData[0] as any)?.name || '';
  if (typeof authorData === 'object') return (authorData as any).name || '';
  return authorData as string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (p: Product) => void;
}

const ProductCard = memo(function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const currentPrice = getCurrentPrice(product);
  const discountPercent = getDiscountPercent(product);
  const img = product.images?.[0];
  const slug = product.slug || product._id;
  const authorName = getAuthorName(product.author);
  const cv = cvIndex(product._id);

  return (
    <div className="book">
      <Link href={`/products/${slug}`} className="block">
        <div className="cover">
          {img ? (
            <LazyImage
              src={imgUrl(img)!}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`cv cv-${cv} w-full h-full`}>
              <span className="t">{product.name}</span>
              {authorName && <span className="a">{authorName}</span>}
              <span className="frame" />
              <span className="num">{cv}</span>
            </div>
          )}
          {discountPercent > 0 && (
            <span className="label-tag sale">-{discountPercent}%</span>
          )}
        </div>
      </Link>

      <div className="meta">
        <Link href={`/products/${slug}`}>
          <h3 className="title">{product.name}</h3>
        </Link>
        {authorName && <p className="author">{authorName}</p>}
        <div className="price-row">
          <span style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>
            ৳{currentPrice}
          </span>
          {(product.discountAmount || 0) > 0 && (
            <span className="price-old">৳{product.salePrice}</span>
          )}
        </div>
      </div>

      {onAddToCart && (
        <button
          className="btn btn-accent btn-sm"
          style={{ borderRadius: 8, width: '100%', justifyContent: 'center', marginTop: 2, fontSize: 12 }}
          onClick={(e) => {
            e.preventDefault();
            onAddToCart(product);
          }}
        >
          + Add to Cart
        </button>
      )}
    </div>
  );
});

export default ProductCard;
