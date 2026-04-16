'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import api, { imgUrl } from '@/lib/api';
import { gtmBeginCheckout } from '@/lib/gtm';
import toast from 'react-hot-toast';
import { FaShoppingCart, FaTruck, FaCheckCircle, FaMapMarkerAlt } from 'react-icons/fa';

interface ShippingCharge {
  deliveryInDhaka: number;
  deliveryOutsideDhaka: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [shippingCharge, setShippingCharge] = useState<ShippingCharge | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<'inside' | 'outside'>('inside');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    // Fetch shipping charge
    const fetchShippingCharge = async () => {
      try {
        const res = await api.get('/shipping-charge/get');
        if (res.data?.data) {
          setShippingCharge(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch shipping charge:', err);
      }
    };
    fetchShippingCharge();
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (items.length > 0) {
      gtmBeginCheckout(items.map(i => ({ ...i.product, quantity: i.quantity })), getTotalPrice());
    }
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShoppingCart className="text-4xl text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">আপনার কার্ট খালি</h2>
            <p className="text-gray-500 mb-4">আপনি কোনো পণ্য যোগ করেননি</p>
            <a href="/products" className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium">বই কিনুন</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const validateForm = () => {
    const newErrors = { name: '', phone: '', address: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'নাম প্রয়োজন';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'ফোন নম্বর প্রয়োজন';
      isValid = false;
    } else if (!/^01\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'সঠিক বাংলাদেশি নম্বর দিন (০১XXXXXXXXX)';
      isValid = false;
    }

    if (!formData.address.trim()) {
      newErrors.address = 'ঠিকানা প্রয়োজন';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const subtotal = getTotalPrice();
      const shipping = deliveryLocation === 'inside' 
        ? (shippingCharge?.deliveryInDhaka || 60) 
        : (shippingCharge?.deliveryOutsideDhaka || 120);
      const grandTotal = subtotal + shipping;
      
      // Build orderedItems with full product data to bypass database fetch
      const orderedItems = items.map(item => {
        const salePrice = item.product.salePrice || item.product.price || 0;
        const regularPrice = item.product.price || item.product.salePrice || salePrice;
        return {
          _id: item.product._id,
          name: item.product.name,
          nameEn: item.product.name,
          slug: item.product.slug,
          image: item.product.images?.[0] || null,
          category: item.product.category,
          author: item.product.author,
          publisher: item.product.publisher,
          subCategory: null,
          brand: null,
          discountType: 0,
          discountAmount: regularPrice - salePrice,
          regularPrice: regularPrice,
          unitPrice: salePrice,
          salePrice: salePrice,
          quantity: item.quantity,
          selectedQty: item.quantity,
          orderType: 'regular',
        };
      });
      
      const orderData = {
        name: formData.name,
        phoneNo: formData.phone,
        shippingAddress: formData.address,
        paymentType: 'cod',
        deliveryLocation: deliveryLocation,
        deliveryCharge: shipping,
        subTotal: subtotal,
        grandTotal: grandTotal,
        orderedItems: orderedItems,
        // Include cart data for fallback
        carts: items.map(item => item.product._id),
        cartData: items.map(item => ({
          product: item.product._id,
          selectedQty: item.quantity,
          quantity: item.quantity,
          cartType: 0,
        })),
      };
      
      console.log('Submitting order:', JSON.stringify(orderData, null, 2));
      
      const res = await api.post('/order/add-order-by-anonymous', orderData);
      console.log('Order response:', res.data);
      console.log('Order response status:', res.status);
      
      if (res.data?.success || res.status === 200 || res.status === 201) {
        const newOrderId = res.data?.data?._id || res.data?._id || res.data?.order?._id;
        clearCart();
        router.push(`/order-success?orderId=${newOrderId}`);
        toast.success('অর্ডার সফলভাবে গৃহীত হয়েছে!');
      } else {
        toast.error(res.data?.message || 'অর্ডার তৈরিতে সমস্যা হয়েছে');
      }
    } catch (err: any) {
      console.error('Order error:', err);
      console.error('Order error response:', err.response?.data);
      toast.error(err.response?.data?.message || err.response?.data?.error || 'অর্ডার তৈরিতে সমস্যা হয়েছে');
    }
    setLoading(false);
  };

  const subtotal = getTotalPrice();
  const shipping = deliveryLocation === 'inside' 
    ? (shippingCharge?.deliveryInDhaka || 60) 
    : (shippingCharge?.deliveryOutsideDhaka || 120);
  const total = subtotal + shipping;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData({ ...formData, phone: value });
    if (errors.phone) setErrors({ ...errors, phone: '' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 w-full">
        {/* Progress Header */}
        <div className="bg-white border-b py-4">
          <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-green-500">
              <FaShoppingCart />
              <span className="font-medium">কার্ট</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center gap-2 text-green-500 font-medium">
              <FaTruck />
              <span>চেকআউট</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center gap-2 text-gray-400">
              <FaCheckCircle />
              <span>সম্পন্ন</span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Delivery Address Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">ডেলিভারি ঠিকানা</h2>
                    <p className="text-green-100 text-sm mt-1">আপনার অর্ডার কোথায় পাঠাতে হবে</p>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">আপনার নাম *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }); }}
                        placeholder="আপনার সম্পূর্ণ নাম"
                        className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">মোবাইল নম্বর *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="০১XXXXXXXXX"
                        className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                      <p className="text-gray-400 text-xs mt-1">১১ সংখ্যার বাংলাদেশি নম্বর (০১ দিয়ে শুরু)</p>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">সম্পূর্ণ ঠিকানা *</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => { setFormData({ ...formData, address: e.target.value }); if (errors.address) setErrors({ ...errors, address: '' }); }}
                        placeholder="বাড়ি নং, রোড নং, এলাকার নাম, জেলা"
                        rows={3}
                        className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                      />
                      {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                    </div>

                    {/* Delivery Location Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ডেলিভারি লোকেশন *</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setDeliveryLocation('inside')}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            deliveryLocation === 'inside' 
                              ? 'border-green-500 bg-green-50 shadow-md' 
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <FaMapMarkerAlt className={`text-xl ${deliveryLocation === 'inside' ? 'text-green-500' : 'text-gray-400'}`} />
                          <span className={`font-medium ${deliveryLocation === 'inside' ? 'text-green-600' : 'text-gray-600'}`}>
                            ঢাকা সিটির ভিতরে
                          </span>
                          <span className={`text-sm font-bold ${deliveryLocation === 'inside' ? 'text-green-500' : 'text-gray-500'}`}>
                            ৳{shippingCharge?.deliveryInDhaka || 60}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryLocation('outside')}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            deliveryLocation === 'outside' 
                              ? 'border-green-500 bg-green-50 shadow-md' 
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <FaTruck className={`text-xl ${deliveryLocation === 'outside' ? 'text-green-500' : 'text-gray-400'}`} />
                          <span className={`font-medium ${deliveryLocation === 'outside' ? 'text-green-600' : 'text-gray-600'}`}>
                            ঢাকা সিটির বাহিরে
                          </span>
                          <span className={`text-sm font-bold ${deliveryLocation === 'outside' ? 'text-green-500' : 'text-gray-500'}`}>
                            ৳{shippingCharge?.deliveryOutsideDhaka || 120}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method - Cash on Delivery */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">পেমেন্ট পদ্ধতি</h2>
                    <p className="text-orange-100 text-sm mt-1">নিরাপদ পেমেন্ট</p>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-50 rounded-xl border-2 border-green-200">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">💵</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">ক্যাশ অন ডেলিভারি</h3>
                        <p className="text-gray-500 text-sm">পণ্য হাতে পেয়ে টাকা দিন</p>
                      </div>
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <FaCheckCircle className="text-white text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-4">
                  <h3 className="font-bold text-white">অর্ডার সারাংশ</h3>
                  <p className="text-green-100 text-sm">{items.length}টি পণ্য</p>
                </div>
                
                <div className="p-5">
                  <div className="space-y-3 max-h-64 overflow-auto mb-4">
                    {items.map(item => (
                      <div key={item._id} className="flex gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className="w-14 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {item.product.images?.[0] && <img src={imgUrl(item.product.images[0])!} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.product.name}</p>
                          <p className="text-xs text-gray-500">পরিমাণ: {item.quantity}</p>
                          <p className="text-sm font-bold text-green-500 mt-1">৳{((item.product.salePrice || item.product.price) * item.quantity).toFixed(0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 text-sm border-t pt-4">
                    <div className="flex justify-between text-gray-600">
                      <span>উপ-মোট</span>
                      <span>৳{subtotal.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>ডেলিভারি চার্জ ({deliveryLocation === 'inside' ? 'ঢাকার ভিতরে' : 'ঢাকার বাহিরে'})</span>
                      <span className="font-medium text-green-500">৳{shipping}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl pt-2 border-t">
                      <span>মোট</span>
                      <span className="text-green-500">৳{total.toFixed(0)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 px-5 rounded-xl font-bold text-lg mt-5 transition-all hover:scale-[1.02] hover:shadow-lg disabled:hover:scale-100"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        প্রসেসিং...
                      </span>
                    ) : (
                      'অর্ডার নিশ্চিত করুন'
                    )}
                  </button>

                  <p className="text-center text-gray-400 text-xs mt-3">
                    🔒 নিরাপদ পেমেন্ট গ্যারান্টি
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
