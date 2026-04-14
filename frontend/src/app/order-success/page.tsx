'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { FaCheckCircle, FaShoppingCart, FaBox, FaPhone, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import { HiOutlineBookOpen } from 'react-icons/hi';

interface Order {
  _id: string;
  orderId: string;
  name: string;
  phoneNo: string;
  shippingAddress: string;
  orderedItems: any[];
  subTotal: number;
  grandTotal: number;
  deliveryCharge: number;
  discount: number;
  paymentType: string;
  paymentStatus: string;
  createdAt: string;
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        try {
          console.log('Fetching order:', orderId);
          const res = await api.get(`/order/${orderId}`);
          console.log('Order response:', res.data);
          if (res.data?.data) {
            setOrder(res.data.data);
          } else if (res.data) {
            setOrder(res.data);
          }
        } catch (err) {
          console.error('Failed to fetch order:', err);
        }
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  const getPrice = (item: any) => item.salePrice || item.unitPrice || item.regularPrice || 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 w-full py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
              <FaCheckCircle className="text-5xl text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">অর্ডার সফল!</h1>
            <p className="text-gray-600">আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে। আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।</p>
          </div>

          {!loading && order && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Order Info Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">অর্ডার আইডি</p>
                    <p className="text-white font-bold text-lg">{order.orderId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-100 text-sm">অর্ডার তারিখ</p>
                    <p className="text-white font-medium">{new Date(order.createdAt).toLocaleDateString('bn-BD')}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaBox className="text-green-500" /> ডেলিভারি তথ্য
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <FaMapMarkerAlt className="text-green-500 mt-1" />
                    <div>
                      <p className="text-gray-500 text-sm">নাম</p>
                      <p className="font-medium text-gray-800">{order.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <FaPhone className="text-green-500 mt-1" />
                    <div>
                      <p className="text-gray-500 text-sm">ফোন নম্বর</p>
                      <p className="font-medium text-gray-800">{order.phoneNo}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl md:col-span-2">
                    <FaMapMarkerAlt className="text-green-500 mt-1" />
                    <div>
                      <p className="text-gray-500 text-sm">ঠিকানা</p>
                      <p className="font-medium text-gray-800">{order.shippingAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ordered Items */}
              <div className="p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaShoppingCart className="text-green-500" /> অর্ডার করা পণ্যসমূহ
                </h3>
                <div className="space-y-3">
                  {order && order.orderedItems && Array.isArray(order.orderedItems) && order.orderedItems.length > 0 ? (
                    order.orderedItems.map((item: any, index: any) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                        <div className="w-16 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                          {item.image ? (
                            <img src={imgUrl(item.image)!} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                        <HiOutlineBookOpen className="w-10 h-10 text-gray-300" />
                      </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 line-clamp-2">{item.name || 'Product'}</p>
                          <p className="text-sm text-gray-500">পরিমাণ: {item.quantity || 1} × ৳{getPrice(item)}</p>
                        </div>
                        <p className="font-bold text-green-500">৳{(getPrice(item) * (item.quantity || 1)).toFixed(0)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">কোনো পণ্য পাওয়া যায়নি</p>
                  )}
                </div>

                {/* Total */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">উপ-মোট</span>
                    <span className="text-gray-800">৳{order.subTotal?.toFixed(0) || 0}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-600">ডেলিভারি চার্জ</span>
                    <span className="text-gray-800">৳{order.deliveryCharge?.toFixed(0) || 0}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-600">ডিসকাউন্ট</span>
                      <span className="text-green-600">-৳{order.discount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                    <span className="text-lg font-bold text-gray-800">মোট</span>
                    <span className="text-2xl font-bold text-green-500">৳{order.grandTotal?.toFixed(0) || 0}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">পেমেন্ট পদ্ধতি</span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {order.paymentType === 'cod' ? 'ক্যাশ অন ডেলিভারি' : order.paymentType}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
            <Link href="/products" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-center transition-all hover:scale-[1.02] shadow-lg">
              আরও কেনাকুষ্টা করুন
            </Link>
            <Link href="/" className="border-2 border-gray-200 hover:border-green-500 text-gray-700 hover:text-green-500 px-8 py-4 rounded-xl font-bold text-center transition-all">
              হোম পেজে ফিরে যান
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
