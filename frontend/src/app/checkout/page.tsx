'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import api, { imgUrl } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    area: '',
    paymentMethod: 'cod',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('অনুগ্রহ করে লগইন করুন');
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">কার্ট খালি</h2>
            <a href="/products" className="text-green-600 hover:underline">বই কিনুন</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error('অনুগ্রহ করে সব তথ্য পূরণ করুন');
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        items: items.map(item => ({ product: item.product._id, quantity: item.quantity })),
        shippingAddress: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          area: formData.area,
        },
        paymentMethod: formData.paymentMethod,
      };
      const res = await api.post('/sales/order/create', orderData);
      if (res.data?.success) {
        clearCart();
        router.push('/order-success');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'অর্ডার তৈরিতে সমস্যা হয়েছে');
    }
    setLoading(false);
  };

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 500 ? 0 : 60;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">চেকআউট</h1>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">সার্ভিং ঠিকানা</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">নাম *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ফোন নম্বর *</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ঠিকানা *</label>
                  <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows={2} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">শহর</label>
                  <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full border rounded-lg px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">এলাকা</label>
                  <input type="text" value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })} className="w-full border rounded-lg px-4 py-2" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">পেমেন্ট পদ্ধতি</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" value="cod" checked={formData.paymentMethod === 'cod'} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })} className="text-green-600" />
                  <span>ক্যাশ অন ডেলিভারি</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-24">
            <h3 className="font-bold text-gray-800 mb-4">অর্ডার সারাংশ</h3>
            <div className="space-y-3 max-h-60 overflow-auto mb-4">
              {items.map(item => (
                <div key={item._id} className="flex gap-3">
                  <img src={imgUrl(item.product.images?.[0]) || ''} alt={item.product.name} className="w-12 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">৳{(item.product.salePrice || item.product.price) * item.quantity}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t pt-3">
              <div className="flex justify-between"><span>উপ-মোট</span><span>৳{subtotal}</span></div>
              <div className="flex justify-between"><span>শিপিং</span><span>৳{shipping}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>মোট</span><span>৳{total}</span></div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-medium mt-4 hover:bg-green-700 disabled:opacity-50">
              {loading ? 'অপেক্ষা করুন...' : 'অর্ডার নিশ্চিত করুন'}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}