import ProductDetailPage from './ProductDetailClient';

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return <ProductDetailPage params={props.params} />;
}