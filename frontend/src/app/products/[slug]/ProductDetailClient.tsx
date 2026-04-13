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
  FaMinus, FaPlus, FaPlay, FaChevronDown, FaChevronUp
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
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<string[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
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
          
          // Bundle products from backend
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
      toast.success('বান্ডেল কার্টে যোগ হয়েছে!');
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
            <h2 className="text-xl font-bold text-gray-800 mb-2">পণ্য পাওয়া যায়নি</h2>
            <Link href="/products" className="text-teal-600 hover:underline">সকল বই দেখুন</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = product.images || [];
  const currentPrice = getCurrentPrice(product);
  const originalPrice = getOriginalPrice(product);
  const discountPercent = getDiscountPercent(product);
  const savings = originalPrice - currentPrice;
  const authorName = getAuthorName(product.author);
  const publisherName = getPublisherName(product.publisher);
  const inStock = product.quantity === undefined || product.quantity > 0;
  const rating = product.ratingAvr || 0;
  const bundleDiscount = 10;

  const nextImage = () => product?.images && setActiveImage((prev) => (prev + 1) % product.images!.length);
  const prevImage = () => product?.images && setActiveImage((prev) => (prev - 1 + product.images!.length) % product.images!.length);

  const bundleTotal = currentPrice + selectedBundle.reduce((sum, id) => {
    const item = bundleProducts.find(b => b.product._id === id);
    return sum + (item ? getCurrentPrice(item.product) * 0.9 : 0);
  }, 0);

  const bundleSavings = selectedBundle.reduce((sum, id) => {
    const item = bundleProducts.find(b => b.product._id === id);
    return sum + (item ? getCurrentPrice(item.product) * 0.1 : 0);
  }, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-teal-600">হোম</Link>
            <span>›</span>
            <Link href="/products" className="hover:text-teal-600">বই</Link>
            {product.category?.[0] && (
              <>
                <span>›</span>
                <Link href={`/products?category=${product.category[0].slug}`} className="hover:text-teal-600">{product.category[0].name}</Link>
              </>
            )}
            <span>›</span>
            <span className="text-gray-700 truncate max-w-[200px]">{product.name}</span>
          </nav>

          {/* Main 3-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT: Product Image + Preview */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-24">
                {/* Main Image */}
                <div className="relative bg-gray-50 rounded-lg mb-3">
                  <div className="aspect-[3/4] flex items-center justify-center">
                    {images[activeImage] ? (
                      <img src={imgUrl(images[activeImage])!} alt={product.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-7xl">📖</span>
                    )}
                  </div>
                  
                  {images.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white shadow rounded-full p-2">
                        <FaChevronLeft className="text-gray-600" />
                      </button>
                      <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white shadow rounded-full p-2">
                        <FaChevronRight className="text-gray-600" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 justify-center mb-3">
                    {images.map((img, idx) => (
                      <button key={idx} onClick={() => setActiveImage(idx)} className={`w-12 h-14 rounded border-2 ${idx === activeImage ? 'border-teal-500' : 'border-gray-200'}`}>
                        <img src={imgUrl(img)!} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Preview Button */}
                {previewUrl && (
                  <button 
                    onClick={() => setShowPreviewModal(true)}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-md font-medium flex items-center justify-center gap-2"
                  >
                    <span>একটু পড়ে দেখুন</span>
                    <span className="transform rotate-90">➜</span>
                  </button>
                )}
              </div>
            </div>

            {/* CENTER: Product Info */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                {/* Title */}
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-2">{product.name}</h1>
                
                {/* Author, Category, Publisher */}
                <div className="space-y-2 mb-4">
                  {authorName && <p className="text-gray-600">লেখক: <Link href={`/products?author=${encodeURIComponent(authorName)}`} className="text-teal-600 hover:underline font-medium">{authorName}</Link></p>}
                  {product.category?.[0] && <p className="text-gray-600">ক্যাটাগরি: <Link href={`/products?category=${product.category[0].slug}`} className="text-teal-600 hover:underline font-medium">{product.category[0].name}</Link></p>}
                  {publisherName && <p className="text-gray-600">প্রকাশনা: <span className="font-medium">{publisherName}</span></p>}
                  {product.weight && <p className="text-gray-500 text-sm">ওজন: {product.weight}g</p>}
                </div>

                {/* Price Block */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold text-red-600">৳{currentPrice}</span>
                    {discountPercent > 0 && (
                      <>
                        <span className="text-gray-400 line-through">৳{originalPrice}</span>
                        <span className="text-green-600 text-sm font-medium">-{discountPercent}%</span>
                      </>
                    )}
                  </div>
                  {savings > 0 && (
                    <p className="text-green-600 text-sm">You Save ৳{savings} ({discountPercent}% Off)</p>
                  )}
                </div>

                {/* Stock */}
                <div className="flex items-center gap-2 mb-4">
                  {inStock ? (
                    <span className="text-green-600 font-medium flex items-center gap-1"><FaBoxOpen /> In Stock</span>
                  ) : (
                    <span className="text-red-500 font-medium">Stock Out</span>
                  )}
                </div>

                {/* Short Description */}
                {product.shortDescription && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className={`text-gray-600 text-sm ${!showFullDescription ? 'line-clamp-3' : ''}`}>{product.shortDescription}</p>
                    {product.shortDescription?.length > 150 && (
                      <button onClick={() => setShowFullDescription(!showFullDescription)} className="text-teal-600 text-sm font-medium mt-1">
                        {showFullDescription ? 'আরও কম দেখুন' : 'আরও দেখুন'}
                      </button>
                    )}
                  </div>
                )}

                {/* CTA Area */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-3 hover:bg-gray-100 text-lg font-bold transition-transform hover:scale-110">−</button>
                    <span className="px-5 py-3 font-bold text-lg min-w-[60px] text-center bg-white">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="px-4 py-3 hover:bg-gray-100 text-lg font-bold transition-transform hover:scale-110">+</button>
                  </div>
                  <button 
                    onClick={handleAddToCart}
                    disabled={!inStock}
                    className={`flex-1 py-3.5 rounded-lg font-bold text-base transition-all hover:scale-[1.02] shadow-sm ${inStock ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    🛒 কার্টে যোগ করুন
                  </button>
                </div>

                <button 
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  className={`w-full py-4 rounded-lg font-bold text-lg text-white transition-all hover:scale-[1.01] shadow-md ${inStock ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800' : 'bg-gray-200 text-gray-400'}`}
                >
                  এখনই অর্ডার করুন
                </button>

                {/* Trust Block */}
                <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-gray-200">
                  <div className="text-center py-2">
                    <FaTruck className="text-xl text-teal-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-medium">Free Delivery</p>
                  </div>
                  <div className="text-center py-2">
                    <FaShieldAlt className="text-xl text-teal-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-medium">100% Authentic</p>
                  </div>
                  <div className="text-center py-2">
                    <FaUndo className="text-xl text-teal-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-medium">7 Days Return</p>
                  </div>
                  <div className="text-center py-2">
                    <FaMoneyBillWave className="text-xl text-teal-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-medium">Cash on Delivery</p>
                  </div>
                </div>
              </div>

              {/* Bought Together */}
              {bundleProducts.length > 0 && (
                <div className="bg-gray-50 rounded-xl border-2 border-teal-200 p-5 shadow-sm">
                  <h2 className="text-lg font-bold text-teal-700 mb-4">পাঠকেরা একসাথে কিনে থাকেন</h2>
                  
                  <div className="flex items-center gap-3 mb-5 overflow-x-auto pb-2 scrollbar-hide">
                    <span className="text-2xl text-gray-400">+</span>
                    {bundleProducts.map((item) => (
                      <div 
                        key={item.product._id}
                        onClick={() => handleToggleBundle(item.product._id)}
                        className={`flex-shrink-0 w-28 p-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${selectedBundle.includes(item.product._id) ? 'border-teal-500 bg-white shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                      >
                        <div className="w-20 h-28 bg-gray-100 rounded-lg mb-2 mx-auto shadow-sm">
                          {item.product.images?.[0] && <img src={imgUrl(item.product.images[0])!} alt="" className="w-full h-full object-cover rounded-lg" />}
                        </div>
                        <p className="text-xs text-gray-700 font-medium line-clamp-2 text-center">{item.product.name}</p>
                      </div>
                    ))}
                    <span className="text-2xl text-gray-400">=</span>
                  </div>

                  {selectedBundle.length > 0 && (
                    <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-teal-100">
                      <div>
                        <p className="text-sm text-gray-600">Total: <span className="font-bold text-gray-900">৳{bundleTotal.toFixed(0)}</span></p>
                        <p className="text-xs text-green-600">You Save ৳{bundleSavings.toFixed(0)}</p>
                      </div>
                      <button onClick={handleAddBundleToCart} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded font-medium">
                        Add All to Cart
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Description Tabs */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200">
                  {['description', 'author', 'reviews'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-3 text-sm font-medium ${activeTab === tab ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'}`}
                    >
                      {tab === 'description' ? 'বিবরণ' : tab === 'author' ? 'লেখক' : 'রিভিউ'}
                    </button>
                  ))}
                </div>
                <div className="p-4">
                  {activeTab === 'description' && product.description && (
                    <div className="text-gray-600 prose prose-sm" dangerouslySetInnerHTML={{ __html: product.description }} />
                  )}
                  {activeTab === 'author' && authorName && (
                    <div>
                      <h3 className="font-bold text-lg mb-2">{authorName}</h3>
                      <p className="text-gray-600">লেখকের অন্যান্য বই</p>
                    </div>
                  )}
                  {activeTab === 'reviews' && (
                    <p className="text-gray-500">No reviews yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Video + Delivery + Related */}
            <div className="lg:col-span-3 space-y-5">
              {/* Video Review */}
              {youtubeId && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-bold text-lg text-teal-700 mb-4">বুক রিভিউ</h3>
                  <div className="aspect-video rounded-lg overflow-hidden shadow-md">
                    <iframe src={`https://www.youtube.com/embed/${youtubeId}`} className="w-full h-full" allowFullScreen />
                  </div>
                </div>
              )}

              {/* Delivery Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-lg text-teal-700 mb-4">Delivery</h3>
                <div className="space-y-3 text-base text-gray-700">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span> Dhaka City</span>
                    <span className="font-bold">৳50 (1-2 Days)</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Outside Dhaka</span>
                    <span className="font-bold">৳100 (2-4 Days)</span>
                  </div>
                </div>
              </div>

              {/* Related Books */}
              {relatedProducts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-bold text-lg text-teal-700 mb-4">Related Books</h3>
                  <div className="space-y-4">
                    {relatedProducts.slice(0, 5).map((p) => {
                      const pPrice = getCurrentPrice(p);
                      return (
                        <Link key={p._id} href={`/products/${p.slug}`} className="flex gap-3 group">
                          <div className="w-14 h-20 bg-gray-100 rounded-lg flex-shrink-0 shadow-sm">
                            {p.images?.[0] && <img src={imgUrl(p.images[0])!} alt="" className="w-full h-full object-cover rounded-lg" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-teal-600 transition-colors">{p.name}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <FaStar className="text-yellow-400 text-xs" />
                              <span className="text-xs text-gray-500">{p.ratingAvr?.toFixed(1) || 0}</span>
                            </div>
                            <p className="text-sm font-bold text-teal-600">৳{pPrice}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recently Viewed & Best Sellers */}
          {relatedProducts.length > 0 && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="mt-10">
                <h2 className="text-xl font-bold text-teal-700 mb-5">সর্বশেষ দেখা বই</h2>
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
                  {relatedProducts.slice(0, 8).map((p) => (
                    <Link key={p._id} href={`/products/${p.slug}`} className="flex-shrink-0 w-36 group">
                      <div className="w-28 h-40 bg-gray-100 rounded-lg mb-3 shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-300">
                        {p.images?.[0] && <img src={imgUrl(p.images[0])!} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 group-hover:text-teal-600">{p.name}</p>
                      <p className="text-sm font-bold text-teal-600">৳{getCurrentPrice(p)}</p>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="mt-10">
                <h2 className="text-xl font-bold text-teal-700 mb-5">সর্বাধিক বিক্রিত বই</h2>
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
                  {relatedProducts.slice(0, 8).map((p) => (
                    <Link key={p._id} href={`/products/${p.slug}`} className="flex-shrink-0 w-36 group">
                      <div className="w-28 h-40 bg-gray-100 rounded-lg mb-3 shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-300">
                        {p.images?.[0] && <img src={imgUrl(p.images[0])!} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 group-hover:text-teal-600">{p.name}</p>
                      <p className="text-sm font-bold text-teal-600">৳{getCurrentPrice(p)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* PDF Preview Modal */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-bold">Preview</h3>
              <button onClick={() => setShowPreviewModal(false)} className="p-1 hover:bg-gray-100 rounded"><FaTimes /></button>
            </div>
            <iframe src={previewUrl.includes('drive.google.com') ? previewUrl.replace('/view', '/preview') : previewUrl} className="flex-1 w-full" allow="autoplay" />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
