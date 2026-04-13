'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const { addItem } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    author: searchParams.get('author') || '',
    publisher: searchParams.get('publisher') || '',
    q: searchParams.get('q') || '',
    sortBy: searchParams.get('sort') || '',
  });

  useEffect(() => {
    fetchProducts();
  }, [page, filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/product/get-all-data');
      if (res.data?.data) {
        let productsData = res.data.data;
        if (res.data.data.items) {
          productsData = res.data.data.items;
        }
        if (Array.isArray(productsData)) {
          setProducts(productsData);
        }
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const getCurrentPrice = (p: Product) => {
    const salePrice = p.salePrice || 0;
    const discount = p.discountAmount || 0;
    return discount > 0 ? salePrice - discount : salePrice;
  };

  const getDiscountPercent = (p: Product) => {
    const salePrice = p.salePrice || 0;
    const discount = p.discountAmount || 0;
    if (!discount || !salePrice) return 0;
    return Math.round((discount / salePrice) * 100);
  };

  const handleAddToCart = (product: any) => {
    addItem(product, 1);
    toast.success('🛒 কার্টে যোগ হয়েছে');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">📚 সকল বই</h1>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">কোনো বই পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
{products.map((product) => {
              const salePrice = product.salePrice || 0;
              const discount = product.discountAmount || 0;
              const currentPrice = getCurrentPrice(product);
              const discountPercent = getDiscountPercent(product);
              const img = product.images?.[0];
              const productName = product.name || 'Untitled';
              const productSlug = product.slug || product._id;
              const authorData = product.author;
              let authorName = '';
              if (Array.isArray(authorData)) {
                authorName = authorData[0]?.name || '';
              } else if (typeof authorData === 'object' && authorData) {
                authorName = (authorData as any)?.name || '';
              } else if (typeof authorData === 'string') {
                authorName = authorData;
              }
              
              return (
                <Link key={product._id} href={`/products/${productSlug}`} className="group">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                    {/* Image Section */}
                    <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden flex items-center justify-center">
                      {img ? (
                        <img src={imgUrl(img)!} alt={productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <span className="text-7xl filter drop-shadow-lg">📖</span>
                        </div>
                      )}
                      {discountPercent > 0 && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>
                    
                    {/* Text Section */}
                    <div className="p-4 pb-4 md:group-hover:pb-16 transition-all duration-300">
                      <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1 leading-tight">{productName}</h3>
                      {authorName && <p className="text-xs text-gray-500 mb-2 truncate">{authorName}</p>}
                      {salePrice > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-teal-600">৳{currentPrice}</span>
                          {discount > 0 && <span className="text-sm text-gray-400 line-through">৳{salePrice}</span>}
                        </div>
                      )}
                      {salePrice === 0 && <p className="text-sm font-bold text-teal-600">Free</p>}
                      
                      {/* Add to Cart Button - always visible on mobile, shows on hover desktop */}
                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="absolute bottom-3 left-4 right-4 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-full font-semibold text-sm transition-all duration-300 md:opacity-0 md:group-hover:opacity-100 shadow-md hover:shadow-lg"
                      >
                        কার্টে যোগ করুন
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}