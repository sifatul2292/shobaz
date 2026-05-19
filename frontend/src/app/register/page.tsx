'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { phSignUp } from '@/lib/posthog';
import toast from 'react-hot-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const PRIMARY = '#16a34a';
const PARCHMENT = '#f5f0e8';

const inputStyle: React.CSSProperties = {
  width: '100%', height: 48, border: '1.5px solid #e2e8f0', borderRadius: 12,
  padding: '0 16px', fontSize: 15, color: '#0f172a', background: '#fafafa',
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const focusIn = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = `0 0 0 3px ${PRIMARY}1f`; e.target.style.background = 'white'; };
const focusOut = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; };

type Step = 'form' | 'otp' | 'done';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [otpCode, setOtpCode] = useState('');

  const validateForm = () => {
    if (!formData.name.trim()) { toast.error('নাম দিন'); return false; }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) { toast.error('সঠিক ইমেইল দিন'); return false; }
    if (!/^01\d{9}$/.test(formData.phone.trim())) { toast.error('সঠিক বাংলাদেশি মোবাইল নম্বর দিন (01XXXXXXXXX)'); return false; }
    if (formData.password.length < 5) { toast.error('পাসওয়ার্ড কমপক্ষে ৫ অক্ষরের হতে হবে'); return false; }
    return true;
  };

  const sendOtp = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await api.post('/otp/generate-otp-with-email', { email: formData.email });
      if (res.data?.success) {
        toast.success('OTP কোড পাঠানো হয়েছে! ইমেইল চেক করুন');
        setStep('otp');
        startCooldown();
      } else {
        toast.error(res.data?.message || 'OTP পাঠাতে ব্যর্থ');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'OTP পাঠাতে ব্যর্থ হয়েছে');
    }
    setLoading(false);
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown(c => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const verifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) { toast.error('৬ সংখ্যার OTP কোড দিন'); return; }
    setLoading(true);
    try {
      // Validate OTP
      const verifyRes = await api.post('/otp/validate-otp-with-email', { email: formData.email, code: otpCode });
      if (!verifyRes.data?.success) {
        toast.error(verifyRes.data?.message || 'OTP সঠিক নয়');
        setLoading(false);
        return;
      }

      // Create account
      const signupRes = await api.post('/user/signup', {
        name: formData.name,
        username: formData.email,
        email: formData.email,
        phoneNo: formData.phone,
        password: formData.password,
        registrationType: 'email',
      });

      if (signupRes.data?.success) {
        phSignUp();
        toast.success('অ্যাকাউন্ট তৈরি হয়েছে! এখন লগইন করুন');
        setStep('done');
        setTimeout(() => router.push('/login'), 1500);
      } else {
        toast.error(signupRes.data?.message || 'অ্যাকাউন্ট তৈরি ব্যর্থ');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'ব্যর্থ হয়েছে');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: PARCHMENT, fontFamily: "'Hind Siliguri', 'Inter', system-ui, sans-serif" }}>
      <Header />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
            <div style={{ height: 5, background: `linear-gradient(90deg, ${PRIMARY}, #22c55e)` }} />

            <div style={{ padding: '40px 40px 36px' }}>

              {/* Step indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
                {(['form', 'otp'] as Step[]).map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      background: step === s || (step === 'done') || (s === 'form' && step === 'otp') ? PRIMARY : '#e2e8f0',
                      color: step === s || (step === 'done') || (s === 'form' && step === 'otp') ? 'white' : '#94a3b8',
                    }}>
                      {s === 'form' && step === 'otp' ? '✓' : i + 1}
                    </div>
                    {i === 0 && (
                      <div style={{ width: 40, height: 2, background: step === 'otp' || step === 'done' ? PRIMARY : '#e2e8f0', borderRadius: 2 }} />
                    )}
                  </div>
                ))}
              </div>

              {/* STEP 1: Form */}
              {(step === 'form') && (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 999, background: '#f0fdf4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                      </svg>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>নতুন অ্যাকাউন্ট</h1>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#9ca3af' }}>তথ্য দিন, তারপর ইমেইলে কোড যাবে</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>সম্পূর্ণ নাম <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="আপনার পুরো নাম" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                    </div>
                    <div>
                      <label style={labelStyle}>ইমেইল <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="example@email.com" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                    </div>
                    <div>
                      <label style={labelStyle}>মোবাইল নম্বর <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="01XXXXXXXXX" inputMode="numeric" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                    </div>
                    <div>
                      <label style={labelStyle}>পাসওয়ার্ড <span style={{ color: '#ef4444' }}>*</span></label>
                      <div style={{ position: 'relative' }}>
                        <input type={showPw ? 'text' : 'password'} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="কমপক্ষে ৫ অক্ষর" style={{ ...inputStyle, paddingRight: 48 }} onFocus={focusIn} onBlur={focusOut} />
                        <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af', display: 'flex' }}>
                          {showPw
                            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          }
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={loading}
                      style={{ width: '100%', height: 52, background: loading ? '#86efac' : `linear-gradient(135deg, ${PRIMARY}, #14532d)`, color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(21,128,61,0.30)', marginTop: 4 }}
                    >
                      {loading ? 'পাঠানো হচ্ছে...' : 'ইমেইলে কোড পাঠান →'}
                    </button>
                  </div>
                </>
              )}

              {/* STEP 2: OTP */}
              {step === 'otp' && (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 999, background: '#f0fdf4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>ইমেইল যাচাই করুন</h1>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#9ca3af' }}>
                      <strong style={{ color: '#374151' }}>{formData.email}</strong>-এ ৬ সংখ্যার কোড পাঠানো হয়েছে
                    </p>
                  </div>

                  <form onSubmit={verifyAndCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>OTP কোড <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        inputMode="numeric"
                        maxLength={6}
                        style={{ ...inputStyle, fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: 700 }}
                        onFocus={focusIn}
                        onBlur={focusOut}
                        autoFocus
                      />
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>কোডের মেয়াদ ৫ মিনিট</p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      style={{ width: '100%', height: 52, background: (loading || otpCode.length !== 6) ? '#86efac' : `linear-gradient(135deg, ${PRIMARY}, #14532d)`, color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: (loading || otpCode.length !== 6) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(21,128,61,0.30)' }}
                    >
                      {loading ? 'যাচাই হচ্ছে...' : 'যাচাই করুন ও অ্যাকাউন্ট তৈরি করুন'}
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button type="button" onClick={() => setStep('form')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                        ← তথ্য পরিবর্তন করুন
                      </button>
                      <button
                        type="button"
                        onClick={resendCooldown === 0 ? sendOtp : undefined}
                        disabled={resendCooldown > 0 || loading}
                        style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? '#9ca3af' : PRIMARY, fontSize: 13, fontWeight: 600, cursor: resendCooldown > 0 ? 'default' : 'pointer', fontFamily: 'inherit' }}
                      >
                        {resendCooldown > 0 ? `পুনরায় পাঠান (${resendCooldown}s)` : 'পুনরায় পাঠান'}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* STEP 3: Done */}
              {step === 'done' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 32 }}>✓</div>
                  <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>অ্যাকাউন্ট তৈরি হয়েছে!</h2>
                  <p style={{ color: '#94a3b8', margin: 0 }}>লগইন পেজে যাওয়া হচ্ছে...</p>
                </div>
              )}

              {step !== 'done' && (
                <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280', marginTop: 24, marginBottom: 0 }}>
                  ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                  <Link href="/login" style={{ color: PRIMARY, fontWeight: 700, textDecoration: 'none' }}>লগইন করুন</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
