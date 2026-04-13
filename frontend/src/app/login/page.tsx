'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/user/auth/login', formData);
      if (res.data?.success && res.data?.data) {
        setAuth(res.data.data.user, res.data.data.token);
        toast.success('সফলভাবে লগইন হয়েছে');
        router.push('/');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'লগইন ব্যর্থ');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">লগইন</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল</label>
            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড</label>
            <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
            {loading ? 'অপেক্ষা করুন...' : 'লগইন'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          অ্যাকাউন্ট নেই? <Link href="/register" className="text-green-600 hover:underline">রেজিস্টার করুন</Link>
        </p>
      </div>
    </div>
  );
}