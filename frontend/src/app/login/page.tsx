'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const PRIMARY = '#16a34a';
const PARCHMENT = '#f5f0e8';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      toast.error('ইমেইল এবং পাসওয়ার্ড দিন');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/user/auth/login', formData);
      if (res.data?.success && res.data?.data) {
        const user = res.data.data.user;
        setAuth(user, res.data.data.token);
        toast.success('সফলভাবে লগইন হয়েছে!');
        router.push('/');
      } else {
        toast.error(res.data?.message || 'লগইন ব্যর্থ');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'লগইন ব্যর্থ হয়েছে');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: PARCHMENT, fontFamily: "'Hind Siliguri', 'Inter', system-ui, sans-serif" }}>
      <Header />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Card */}
          <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>

            {/* Top accent bar */}
            <div style={{ height: 5, background: `linear-gradient(90deg, ${PRIMARY}, #22c55e)` }}/>

            <div style={{ padding: '40px 40px 36px' }}>
              {/* Logo / title */}
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ width: 56, height: 56, borderRadius: 999, background: '#f0fdf4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>লগইন</h1>
                <p style={{ margin: '6px 0 0', fontSize: 14, color: '#9ca3af' }}>আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    ইমেইল <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@email.com"
                    required
                    style={{
                      width: '100%', height: 48, border: '1.5px solid #e2e8f0', borderRadius: 12,
                      padding: '0 16px', fontSize: 15, color: '#0f172a', background: '#fafafa',
                      fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s',
                    }}
                    onFocus={e => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = `0 0 0 3px ${PRIMARY}1f`; e.target.style.background = 'white'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    পাসওয়ার্ড <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      style={{
                        width: '100%', height: 48, border: '1.5px solid #e2e8f0', borderRadius: 12,
                        padding: '0 48px 0 16px', fontSize: 15, color: '#0f172a', background: '#fafafa',
                        fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s',
                      }}
                      onFocus={e => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = `0 0 0 3px ${PRIMARY}1f`; e.target.style.background = 'white'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af', display: 'flex' }}>
                      {showPw ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', height: 52, background: loading ? '#86efac' : `linear-gradient(135deg, ${PRIMARY}, #14532d)`,
                    color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 4px 16px rgba(21,128,61,0.30)', transition: 'opacity .2s, transform .15s',
                    marginTop: 4,
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {loading ? 'অপেক্ষা করুন...' : 'লগইন করুন'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280', marginTop: 24, marginBottom: 0 }}>
                অ্যাকাউন্ট নেই?{' '}
                <Link href="/register" style={{ color: PRIMARY, fontWeight: 700, textDecoration: 'none' }}>
                  রেজিস্টার করুন
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
