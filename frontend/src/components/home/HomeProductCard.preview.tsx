import { Product } from '@/types';
import HomeProductCard, { ProductCardPreviewState } from './HomeProductCard';
import styles from './HomeProductCard.module.css';

const previewProduct = {
  _id: 'preview-product',
  name: 'রোড to কর্পোরেট',
  slug: 'road-to-corporate-39',
  price: 450,
  salePrice: 450,
  discountAmount: 152,
  author: 'এস. এম. আবু মুসা',
  images: ['https://api.shobaz.com/api/upload/images/road-to-corporate-cover-compressed-d4be.webp'],
} satisfies Product;

const states: ProductCardPreviewState[] = ['default', 'hover', 'focus', 'active', 'disabled', 'loading', 'error', 'success'];

export default function HomeProductCardPreview() {
  return (
    <div className={styles.preview}>
      {states.map((state) => (
        <div className={styles.previewItem} key={state}>
          <span className={styles.previewLabel}>{state}</span>
          <HomeProductCard product={previewProduct} onAdd={() => undefined} previewState={state} />
        </div>
      ))}
    </div>
  );
}
