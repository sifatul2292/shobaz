'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { 
  FaChevronLeft, FaChevronRight, FaShoppingCart, FaBoxOpen, FaTimes, 
  FaCheck, FaTruck, FaUndo, FaShieldAlt, FaMoneyBillWave, FaStar,
  FaMinus, FaPlus, FaPlay, FaBangladeshiTakaSign
} from 'react-icons/fa';

interface BundleItem {
  product: Product;
  discount: number;
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailClient({ params }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [bundleProducts, setBundleProducts] = useState<BundleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [slug, setSlug] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('description');

  const { addItem, items } = useCartStore();

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (slug) fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/product/get-by-slug/${slug}`);
      if (res.data?.data) {
        const productData = res.data.data;
        setProduct(productData);
        
        const relatedRes = await api.get('/product/get-all-data');
        if (relatedRes.data?.data) {
          let allProducts = relatedRes.data.data;
          if (allProducts.items) allProducts = allProducts.items;
          if (!Array.isArray(allProducts)) allProducts = [];
          
          const filtered = allProducts.filter((p: Product) => p._id !== productData._id);
          setRelatedProducts(filtered.slice(0, 10));
          
          const backendBoughtTogether = productData.boughtTogetherProducts || [];
          let bundleItems: BundleItem[] = [];
          const bundleDiscount = 10;
          
          if (backendBoughtTogether?.length > 0) {
            bundleItems = backendBoughtTogether.map((p: Product) => ({
              product: p,
              discount: bundleDiscount
            }));
          } else {
            bundleItems = filtered.slice(0, 3).map((p: Product) => ({
              product: p,
              discount: bundleDiscount
            }));
          }
          
          setBundleProducts(bundleItems);
          setSelectedBundle(bundleItems.map(b => b.product._id));
        }
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      toast.success('কার্টে যোগ হয়েছে');
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addItem(product, quantity);
      window.location.href = '/checkout';
    }
  };

  const handleToggleBundle = (productId: string) => {
    setSelectedBundle(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddBundleToCart = () => {
    if (product) {
      addItem(product, quantity);
      selectedBundle.forEach(id => {
        const item = bundleProducts.find(b => b.product._id === id);
        if (item) addItem(item.product, 1);
      });
      toast.success('বান্ডেল যোগ হয়েছে!');
    }
  };

  const getCurrentPrice = (p: Product) => {
    const salePrice = p.salePrice || 0;
    const discount = p.discountAmount || 0;
    return discount > 0 ? salePrice - discount : salePrice;
  };

  const getOriginalPrice = (p: Product) => p.salePrice || 0;

  const getDiscountPercent = (p: Product) => {
    const salePrice = p.salePrice || 0;
    const discount = p.discountAmount || 0;
    if (!discount || !salePrice) return 0;
    return Math.round((discount / salePrice) * 100);
  };

  const getAuthorName = (author: any) => {
    if (!author) return '';
    if (Array.isArray(author)) return author[0]?.name || '';
    if (typeof author === 'object') return author.name || '';
    return author as string;
  };

  const getPublisherName = (publisher: any) => {
    if (!publisher) return '';
    if (Array.isArray(publisher)) return publisher[0]?.name || '';
    if (typeof publisher === 'object') return publisher.name || '';
    return publisher as string;
  };

  const isInCart = items.some(item => item.product._id === product?._id);
  const previewUrl = product?.pdfFile || product?.previewPdfUrl;
  const youtubeId = product?.videoUrl?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];

  const currentPrice = product ? getCurrentPrice(product) : 0;
  const originalPrice = product ? getOriginalPrice(product) : 0;
  const discountPercent = product ? getDiscountPercent(product) : 0;
  const savings = originalPrice - currentPrice;
  const authorName = product ? getAuthorName(product.author) : '';
  const publisherName = product ? getPublisherName(product.publisher) : '';
  const inStock = product?.quantity === undefined || product?.quantity > 0;
  const rating = product?.ratingAvr || 0;

  const bundleTotal = currentPrice + selectedBundle.reduce((sum, id) => {
    const item = bundleProducts.find(b => b.product._id === id);
    return sum + (item ? getCurrentPrice(item.product) * 0.9 : 0);
  }, 0);

  const bundleSavings = selectedBundle.reduce((sum, id) => {
    const item = bundleProducts.find(b => b.product._id === id);
    return sum + (item ? getCurrentPrice(item.product) * 0.1 : 0);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Product not found</h2>
            <Link href="/products" className="text-teal-600 hover:underline">Browse Books</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-4 md:mb-6 overflow-x-auto whitespace-nowrap pb-2">
            <Link href="/" className="hover:text-teal-600 transition-colors">Home</Link>
            <span className="text-gray-300">›</span>
            <Link href="/products" className="hover:text-teal-600 transition-colors">Books</Link>
            {product.category?.[0] && (
              <>
                <span className="text-gray-300">›</span>
                <Link href={`/products?category=${product.category[0].slug}`} className="hover:text-teal-600 transition-colors">{product.category[0].name}</Link>
              </>
            )}
            <span className="text-gray-300">›</span>
            <span className="text-gray-700 truncate max-w-[150px] md:max-w-[200px]">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
            
            {/* LEFT: Image */}
            <div className="lg:col-span-5">
              <div className="sticky top-24">
                <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="aspect-[3/4] bg-gray-50 flex items-center justify-center p-4 md:p-8">
                    {product.images?.[activeImage] ? (
                      <img src={imgUrl(product.images[activeImage])!} alt={product.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-7xl md:text-9xl">📖</span>
                    )}
                  </div>
                  
                  {discountPercent > 0 && (
                    <span className="absolute top-3 md:top-4 left-3 md:left-4 bg-red-500 text-white text-xs md:text-sm font-bold px-3 md:px-4 py-1 md:py-1.5 rounded-full">
                      {discountPercent}% OFF
                    </span>
                  )}

                  {product.images?.length > 1 && (
                    <>
                      <button onClick={() => setActiveImage(i => (i - 1 + product.images!.length) % product.images!.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 shadow-lg rounded-full p-2 hover:bg-white">
                        <FaChevronLeft className="text-gray-700" />
                      </button>
                      <button onClick={() => setActiveImage(i => (i + 1) % product.images!.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 shadow-lg rounded-full p-2 hover:bg-white">
                        <FaChevronRight className="text-gray-700" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {product.images?.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {product.images.map((img, idx) => (
                      <button key={idx} onClick={() => setActiveImage(idx)} className={`w-14 h-16 md:w-16 md:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${idx === activeImage ? 'border-teal-500' : 'border-gray-200 hover:border-gray-300'}`}>
                        <img src={imgUrl(img)!} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Preview Button */}
                {previewUrl && (
                  <button onClick={() => setShowPreviewModal(true)} className="w-full mt-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-emerald-700 transition-all shadow-lg">
                    📄 Read Preview
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT: Product Info */}
            <div className="lg:col-span-7 space-y-5 md:space-y-7">
              <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg border border-gray-100 p-5 md:p-8">
                <h1 className="text-xl md:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
                
                {/* Meta */}
                <div className="flex flex-wrap gap-3 md:gap-4 mt-3 md:mt-4">
                  {authorName && <p className="text-gray-600"><span className="text-gray-400">Author:</span> <Link href={`/products?author=${encodeURIComponent(authorName)}`} className="text-teal-600 font-medium hover:underline">{authorName}</Link></p>}
                  {product.category?.[0] && <p className="text-gray-600"><span className="text-gray-400">Category:</span> <Link href={`/products?category=${product.category[0].slug}`} className="text-teal-600 font-medium hover:underline">{product.category[0].name}</Link></p>}
                  {publisherName && <p className="text-gray-600"><span className="text-gray-400">Publisher:</span> <span className="font-medium">{publisherName}</span></p>}
                </div>

                {/* Rating */}
                {rating > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} className={`text-sm ${star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-gray-500 text-sm">({rating.toFixed(1)})</span>
                  </div>
                )}

                {/* Price */}
                <div className="mt-5 md:mt-6 py-4 md:py-5 border-y border-gray-100">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl md:text-4xl font-bold text-red-600">৳{currentPrice}</span>
                    {discountPercent > 0 && (
                      <>
                        <span className="text-lg md:text-xl text-gray-400 line-through">৳{originalPrice}</span>
                        <span className="bg-green-100 text-green-700 text-xs md:text-sm font-semibold px-2 py-1 rounded-full">Save ৳{savings}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Stock */}
                <div className="mt-4">
                  {inStock ? (
                    <span className="inline-flex items-center gap-2 text-green-600 font-semibold">
                      <FaBoxOpen /> In Stock
                    </span>
                  ) : (
                    <span className="text-red-500 font-semibold">Out of Stock</span>
                  )}
                </div>

                {/* CTA */}
                <div className="mt-6 md:mt-8 space-y-3 md:space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-100 rounded-xl">
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 md:px-5 py-3 hover:bg-gray-200 rounded-l-xl font-bold text-lg">−</button>
                      <span className="px-5 md:px-6 py-3 font-bold text-lg min-w-[50px] text-center bg-white">{quantity}</span>
                      <button onClick={() => setQuantity(q => q + 1)} className="px-4 md:px-5 py-3 hover:bg-gray-200 rounded-r-xl font-bold text-lg">+</button>
                    </div>
                    <button onClick={handleAddToCart} disabled={!inStock} className={`flex-1 py-3.5 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all ${inStock ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      🛒 Add to Cart
                    </button>
                  </div>
                  <button onClick={handleBuyNow} disabled={!inStock} className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${inStock ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    Buy Now
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-100">
                  {[
                    { icon: FaTruck, title: 'Free Shipping', subtitle: 'On orders ৳500+' },
                    { icon: FaShieldAlt, title: '100% Original', subtitle: 'Guaranteed' },
                    { icon: FaUndo, title: 'Easy Return', subtitle: '7 Days' },
                    { icon: FaMoneyBillWave, title: 'Cash on Delivery', subtitle: 'Available' },
                  ].map((item, idx) => (
                    <div key={idx} className="text-center p-3 md:p-4 bg-gray-50 rounded-xl">
                      <item.icon className="text-xl md:text-2xl text-teal-600 mx-auto mb-1 md:mb-2" />
                      <p className="text-xs md:text-sm font-semibold text-gray-800">{item.title}</p>
                      <p className="text-[10px] md:text-xs text-gray-500">{item.subtitle}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bundle Section */}
              {bundleProducts.length > 0 && (
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border-2 border-teal-200 p-4 md:p-6">
                  <h2 className="text-lg md:text-xl font-bold text-teal-700 mb-4">Customers Also Bought</h2>
                  
                  <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-3 scrollbar-hide">
                    <Link href={`/products/${product.slug}`} className="flex-shrink-0 w-20 md:w-28 p-2 rounded-xl border-2 border-teal-300 bg-white">
                      <div className="w-full h-16 md:h-24 bg-gray-100 rounded-lg">
                        {product.images?.[0] && <img src={imgUrl(product.images[0])!} alt="" className="w-full h-full object-cover rounded-lg" />}
                      </div>
                    </Link>
                    
                    {bundleProducts.map((item) => (
                      <div key={item.product._id} className="flex items-center">
                        <span className="text-gray-400 font-bold">+</span>
                        <div className={`relative w-20 md:w-28 p-1.5 md:p-2 rounded-xl border-2 bg-white ${selectedBundle.includes(item.product._id) ? 'border-teal-500' : 'border-gray-200'}`}>
                          <input type="checkbox" checked={selectedBundle.includes(item.product._id)} onChange={() => handleToggleBundle(item.product._id)} className="absolute top-1 left-1 w-3 h-3 md:w-4 md:h-4 accent-teal-600" />
                          <Link href={`/products/${item.product.slug}`}>
                            <div className="w-full h-16 md:h-24 bg-gray-100 rounded-lg">
                              {item.product.images?.[0] && <img src={imgUrl(item.product.images[0])!} alt="" className="w-full h-full object-cover rounded-lg" />}
                            </div>
                          </Link>
                        </div>
                      </div>
                    ))}
                    
                    <span className="text-gray-400 font-bold">=</span>
                    
                    <div className="flex flex-col md:flex-row items-center gap-3 ml-2">
                      <div>
                        <p className="text-xs text-gray-500">Total: <span className="font-bold text-gray-900 text-lg">৳{bundleTotal.toFixed(0)}</span></p>
                        <p className="text-xs text-green-600 font-medium">Save ৳{bundleSavings.toFixed(0)}</p>
                      </div>
                      <button onClick={handleAddBundleToCart} className="bg-teal-600 hover:bg-teal-700 text-white px-4 md:px-5 py-2 rounded-lg font-semibold text-sm">
                        Add All
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100">
                  {['description', 'author', 'reviews'].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 md:py-4 font-semibold text-sm md:text-base transition-colors ${activeTab === tab ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50' : 'text-gray-500 hover:text-gray-700'}`}>
                      {tab === 'description' ? 'Description' : tab === 'author' ? 'Author' : 'Reviews'}
                    </button>
                  ))}
                </div>
                <div className="p-5 md:p-6">
                  {activeTab === 'description' && product.description && (
                    <div className="text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />
                  )}
                  {activeTab === 'author' && authorName && (
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 mb-2">{authorName}</h3>
                      <p className="text-gray-600">Other books by this author</p>
                    </div>
                  )}
                  {activeTab === 'reviews' && (
                    <p className="text-gray-500">No reviews yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Video & Related */}
          <div className="mt-10 md:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
            <div className="lg:col-span-8">
              {youtubeId && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 mb-6 md:mb-8">
                  <h3 className="text-lg md:text-xl font-bold text-teal-700 mb-4">Book Review</h3>
                  <div className="aspect-video rounded-xl overflow-hidden bg-black">
                    <iframe src={`https://www.youtube.com/embed/${youtubeId}`} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                  </div>
                </div>
              )}

              {relatedProducts.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold text-teal-700 mb-4">Related Books</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {relatedProducts.slice(0, 10).map((p) => (
                      <Link key={p._id} href={`/products/${p.slug}`} className="group">
                        <div className="bg-gray-50 rounded-xl overflow-hidden mb-2">
                          {p.images?.[0] && <img src={imgUrl(p.images[0])!} alt="" className="w-full h-24 md:h-32 object-cover group-hover:scale-105 transition-transform" />}
                        </div>
                        <p className="text-xs md:text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-teal-600">{p.name}</p>
                        <p className="text-sm font-bold text-teal-600 mt-1">৳{getCurrentPrice(p)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-teal-700 mb-4">Delivery Info</h3>
                <div className="space-y-3 text-sm md:text-base">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Inside Dhaka</span>
                    <span className="font-semibold">৳60 (1-2 Days)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Outside Dhaka</span>
                    <span className="font-semibold">৳100 (2-4 Days)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">Preview</h3>
              <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><FaTimes /></button>
            </div>
            <iframe src={previewUrl} className="flex-1 w-full" allow="autoplay" />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
