'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuthStore } from '@/store/useAuthStore';
import api, { imgUrl } from '@/lib/api';
import { Order } from '@/types';
import Link from 'next/link';
import { FaShippingFast } from 'react-icons/fa';

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, router]);

  const fetchOrders = async () => {
    try {
      const res = await api.post('/user/order/get-all', {});
      if (res.data?.data) setOrders(res.data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const sendToCourier = async (orderId: string) => {
    if (!confirm('এই অর্ডার কুরিয়ারে পাঠানো হবে, নিশ্চিত করুন?')) return;
    setSendingId(orderId);
    try {
      const res = await api.post(`/sales/order/send-to-courier/${orderId}`);
      if (res.data?.success) {
        alert('অর্ডার সফলভাবে কুরিয়ারে পাঠানো হয়েছে!');
        fetchOrders();
      } else {
        alert(res.data?.message || 'কুরিয়ারে পাঠাতে ব্যর্থ');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'কুরিয়ারে পাঠাতে ব্যর্থ');
    }
    setSendingId(null);
  };

  const getPhoneNumber = (order: Order): string => {
    if (typeof order.shippingAddress === 'string') return order.shippingAddress;
    return order.shippingAddress?.phone || order.shippingAddress?.address || '';
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">আমার অর্ডার</h1>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">কোনো অর্ডার নেই</p>
            <Link href="/products" className="text-green-600 hover:underline">কেনাকুষ্টা শুরু করুন</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">অর্ডার #{order.orderId}</p>
                    <p className="text-xs text-gray-500">{order.createdAt}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {order.items?.map((item, idx) => (
                    <img key={idx} src={imgUrl(item.product?.images?.[0]) || ''} alt="" className="w-16 h-20 object-cover rounded" />
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <span className="font-bold text-green-600">৳{order.totalAmount}</span>
                  <div className="flex items-center gap-3">
                    {getPhoneNumber(order) && (
                      <span className="text-sm text-gray-600">{getPhoneNumber(order)}</span>
                    )}
                    <button
                      onClick={() => sendToCourier(order._id)}
                      disabled={sendingId === order._id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                    >
                      <FaShippingFast className="text-xs" />
                      {sendingId === order._id ? 'পাঠাচ্ছি...' : 'কুরিয়ারে পাঠান'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}