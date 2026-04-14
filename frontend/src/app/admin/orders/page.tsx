'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api from '@/lib/api';
import { FaShippingFast } from 'react-icons/fa';

interface Order {
  _id: string;
  orderId: string;
  phone?: string;
  phoneNo?: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  shippingAddress?: any;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.post('/sales/order/get-all', {});
      if (res.data?.data) setOrders(res.data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const sendToCourier = async (orderId: string) => {
    if (!confirm('Send this order to courier?')) return;
    setSendingId(orderId);
    try {
      const res = await api.post(`/sales/order/send-to-courier/${orderId}`);
      if (res.data?.success) {
        alert('Order sent to courier!');
        fetchOrders();
      } else {
        alert(res.data?.message || 'Failed');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
    setSendingId(null);
  };

  const getPhone = (order: Order): string => {
    return order.phone || order.phoneNo || order.shippingAddress?.phone || '';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">All Orders - Admin</h1>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg shadow">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Phone No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{order.orderId}</td>
                    <td className="px-4 py-3 text-sm">{getPhone(order)}</td>
                    <td className="px-4 py-3 text-sm font-medium">৳{order.totalAmount}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                        order.status === 'Courier' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{order.createdAt}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => sendToCourier(order._id)}
                        disabled={sendingId === order._id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                      >
                        <FaShippingFast className="text-xs" />
                        {sendingId === order._id ? 'Sending...' : 'Send to Courier'}
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}