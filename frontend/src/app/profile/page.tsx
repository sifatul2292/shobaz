'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuthStore } from '@/store/useAuthStore';
import api, { imgUrl } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

const PRIMARY = '#16a34a';
const PARCHMENT = '#f5f0e8';

interface UserProfile {
  _id: string;
  name: string;
  username: string;
  email?: string;
  phoneNo?: string;
  image?: string;
  profileImg?: string;
}

interface Address {
  _id: string;
  phoneNo?: string;
  address?: string;
  city?: string;
  addressType?: string;
}

interface OrderItem {
  product?: { name: string; images?: string[] };
  quantity?: number;
  salePrice?: number;
}

interface Order {
  _id: string;
  orderId?: string;
  status?: string;
  totalAmount?: number;
  items?: OrderItem[];
  createdAt?: string;
  shippingAddress?: any;
}

interface WishProduct {
  _id: string;
  name: string;
  slug?: string;
  images?: string[];
  salePrice?: number;
  discountAmount?: number;
}

type Tab = 'overview' | 'orders' | 'addresses' | 'wishlist' | 'settings' | 'points';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'ড্যাশবোর্ড', icon: '◫' },
  { id: 'orders', label: 'আমার অর্ডার', icon: '📦' },
  { id: 'addresses', label: 'আমার ঠিকানা', icon: '📍' },
  { id: 'wishlist', label: 'ইচ্ছা তালিকা', icon: '♡' },
  { id: 'settings', label: 'প্রোফাইল', icon: '⚙' },
  { id: 'points', label: 'পয়েন্ট & উপহার', icon: '🎁' },
];

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  Pending:    { bg: '#fef9c3', color: '#854d0e', label: 'অপেক্ষমাণ' },
  Processing: { bg: '#dbeafe', color: '#1e40af', label: 'প্রক্রিয়াধীন' },
  Shipped:    { bg: '#e0f2fe', color: '#0369a1', label: 'শিপিং' },
  Delivered:  { bg: '#dcfce7', color: '#166534', label: 'ডেলিভারি হয়েছে' },
  Cancelled:  { bg: '#fee2e2', color: '#991b1b', label: 'বাতিল' },
};

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, logout } = useAuthStore();

  const [tab, setTab] = useState<Tab>('overview');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<WishProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [editForm, setEditForm] = useState({ name: '', phoneNo: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwForm, setPwForm] = useState({ password: '', newPassword: '' });

  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState({ phoneNo: '', address: '', city: '', addressType: 'home' });
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    const t = searchParams.get('tab') as Tab;
    if (t && TABS.find(x => x.id === t)) setTab(t);
    fetchAll();
  }, [token]);

  const fetchAll = async () => {
    setLoading(true);
    const [pRes, oRes, aRes, wRes] = await Promise.allSettled([
      api.get('/user/logged-in-user-data'),
      api.post('/user/order/get-all', {}),
      api.get('/user/get-user-address'),
      api.post('/user/wishlist/get-all', {}),
    ]);
    if (pRes.status === 'fulfilled') {
      const p = pRes.value.data?.data;
      setProfile(p);
      setEditForm({ name: p?.name || '', phoneNo: p?.phoneNo || '' });
    }
    if (oRes.status === 'fulfilled') setOrders(oRes.value.data?.data || []);
    if (aRes.status === 'fulfilled') setAddresses(aRes.value.data?.data || []);
    if (wRes.status === 'fulfilled') setWishlist(wRes.value.data?.data || []);
    setLoading(false);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/user/update-logged-in-user', editForm);
      if (res.data?.success) {
        toast.success('প্রোফাইল আপডেট হয়েছে');
        setProfile(p => p ? { ...p, ...editForm } : p);
      } else {
        toast.error(res.data?.message || 'আপডেট ব্যর্থ');
      }
    } catch { toast.error('আপডেট ব্যর্থ হয়েছে'); }
    setSavingProfile(false);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 5) { toast.error('নতুন পাসওয়ার্ড কমপক্ষে ৫ অক্ষর'); return; }
    setChangingPw(true);
    try {
      const res = await api.put('/user/change-logged-in-user-password', pwForm);
      if (res.data?.success) {
        toast.success('পাসওয়ার্ড পরিবর্তন হয়েছে');
        setPwForm({ password: '', newPassword: '' });
      } else {
        toast.error(res.data?.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ');
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'ব্যর্থ হয়েছে'); }
    setChangingPw(false);
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddr(true);
    try {
      const res = await api.post('/user/add-address', addrForm);
      if (res.data?.success || res.data?.data) {
        toast.success('ঠিকানা যোগ হয়েছে');
        setShowAddrForm(false);
        setAddrForm({ phoneNo: '', address: '', city: '', addressType: 'home' });
        const fresh = await api.get('/user/get-user-address');
        setAddresses(fresh.data?.data || []);
      } else {
        toast.error('ঠিকানা যোগ ব্যর্থ');
      }
    } catch { toast.error('ঠিকানা যোগ ব্যর্থ হয়েছে'); }
    setSavingAddr(false);
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('এই ঠিকানা মুছবেন?')) return;
    try {
      await api.delete(`/user/delete-address/${id}`);
      setAddresses(a => a.filter(x => x._id !== id));
      toast.success('ঠিকানা মুছে গেছে');
    } catch { toast.error('মুছতে ব্যর্থ'); }
  };

  const removeWishlist = async (id: string) => {
    try {
      await api.delete(`/user/wishlist/remove/${id}`);
      setWishlist(w => w.filter(x => x._id !== id));
      toast.success('সরানো হয়েছে');
    } catch { toast.error('সরাতে ব্যর্থ'); }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('লগআউট হয়েছে');
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  if (!token) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: PARCHMENT }}>
      <Header />

      <main style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '32px 16px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* Sidebar */}
        <aside style={{ width: 240, flexShrink: 0, background: 'white', borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden', position: 'sticky', top: 90 }}>
          {/* Avatar */}
          <div style={{ padding: '28px 20px 20px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${PRIMARY}, #22c55e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, fontWeight: 800, color: 'white' }}>
              {initials}
            </div>
            {loading ? (
              <div style={{ height: 16, background: '#f1f5f9', borderRadius: 8, width: '70%', margin: '0 auto 6px' }} />
            ) : (
              <>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{profile?.name || '—'}</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>{profile?.username || ''}</p>
              </>
            )}
          </div>

          {/* Nav */}
          <nav style={{ padding: '12px 8px' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: tab === t.id ? '#f0fdf4' : 'transparent',
                  color: tab === t.id ? PRIMARY : '#475569',
                  fontWeight: tab === t.id ? 700 : 500, fontSize: 14,
                  fontFamily: 'inherit', transition: 'all .15s', marginBottom: 2,
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                {t.label}
                {t.id === 'orders' && orders.length > 0 && (
                  <span style={{ marginLeft: 'auto', background: PRIMARY, color: 'white', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '1px 7px' }}>{orders.length}</span>
                )}
              </button>
            ))}
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'transparent', color: '#dc2626', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', marginTop: 8 }}
            >
              <span>↩</span> লগআউট
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Overview */}
          {tab === 'overview' && (
            <div>
              <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                স্বাগতম{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}!
              </h2>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 28 }}>
                {[
                  { label: 'মোট অর্ডার', value: orders.length, color: '#3b82f6', bg: '#eff6ff', icon: '📦' },
                  { label: 'ইচ্ছা তালিকা', value: wishlist.length, color: '#ec4899', bg: '#fdf2f8', icon: '♡' },
                  { label: 'ঠিকানা', value: addresses.length, color: PRIMARY, bg: '#f0fdf4', icon: '📍' },
                  { label: 'পয়েন্ট', value: '০', color: '#f59e0b', bg: '#fffbeb', icon: '⭐' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'white', borderRadius: 16, padding: '20px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${stat.bg}` }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{loading ? '—' : stat.value}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent orders */}
              <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>সাম্প্রতিক অর্ডার</h3>
                  <button onClick={() => setTab('orders')} style={{ background: 'none', border: 'none', color: PRIMARY, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>সব দেখুন →</button>
                </div>
                {loading ? <div style={{ height: 60, background: '#f8fafc', borderRadius: 10 }} /> :
                  orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
                      <p style={{ margin: 0 }}>কোনো অর্ডার নেই</p>
                      <Link href="/products" style={{ color: PRIMARY, fontSize: 13, fontWeight: 600 }}>কেনাকাটা শুরু করুন</Link>
                    </div>
                  ) : (
                    orders.slice(0, 3).map(order => {
                      const s = STATUS_COLORS[order.status || ''] || STATUS_COLORS.Pending;
                      return (
                        <div key={order._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>#{order.orderId || order._id.slice(-8)}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>{order.items?.length || 0}টি বই</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                            <p style={{ margin: '4px 0 0', fontWeight: 700, color: PRIMARY, fontSize: 14 }}>৳{order.totalAmount}</p>
                          </div>
                        </div>
                      );
                    })
                  )
                }
              </div>
            </div>
          )}

          {/* Orders */}
          {tab === 'orders' && (
            <div>
              <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>আমার অর্ডার</h2>
              {loading ? <Spinner /> :
                orders.length === 0 ? (
                  <EmptyState icon="📦" text="কোনো অর্ডার নেই" link="/products" linkText="কেনাকাটা শুরু করুন" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {orders.map(order => {
                      const s = STATUS_COLORS[order.status || ''] || STATUS_COLORS.Pending;
                      return (
                        <div key={order._id} style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '20px 24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>অর্ডার #{order.orderId || order._id.slice(-8)}</p>
                              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('bn-BD') : ''}</p>
                            </div>
                            <span style={{ background: s.bg, color: s.color, padding: '4px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>{s.label}</span>
                          </div>
                          {/* Book covers */}
                          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
                            {order.items?.map((item, i) => (
                              <div key={i} style={{ flexShrink: 0, width: 52, height: 68, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9' }}>
                                {item.product?.images?.[0] ? (
                                  <img src={imgUrl(item.product.images[0]) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${PRIMARY}44, #22c55e44)` }} />
                                )}
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                            <span style={{ fontSize: 13, color: '#64748b' }}>{order.items?.length || 0}টি বই</span>
                            <span style={{ fontWeight: 800, color: PRIMARY, fontSize: 18 }}>৳{order.totalAmount}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>
          )}

          {/* Addresses */}
          {tab === 'addresses' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>আমার ঠিকানা</h2>
                <button
                  onClick={() => setShowAddrForm(v => !v)}
                  style={{ padding: '10px 20px', background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  + নতুন ঠিকানা
                </button>
              </div>

              {showAddrForm && (
                <form onSubmit={addAddress} style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 24, marginBottom: 20 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>নতুন ঠিকানা যোগ করুন</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      { key: 'phoneNo', label: 'মোবাইল', placeholder: '01XXXXXXXXX' },
                      { key: 'city', label: 'শহর/জেলা', placeholder: 'ঢাকা' },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{f.label}</label>
                        <input
                          value={(addrForm as any)[f.key]}
                          onChange={e => setAddrForm(a => ({ ...a, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          style={fieldStyle}
                        />
                      </div>
                    ))}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>সম্পূর্ণ ঠিকানা</label>
                      <input
                        value={addrForm.address}
                        onChange={e => setAddrForm(a => ({ ...a, address: e.target.value }))}
                        placeholder="বাড়ি নং, রাস্তা, এলাকা..."
                        style={fieldStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>ধরন</label>
                      <select value={addrForm.addressType} onChange={e => setAddrForm(a => ({ ...a, addressType: e.target.value }))} style={fieldStyle}>
                        <option value="home">বাড়ি</option>
                        <option value="office">অফিস</option>
                        <option value="other">অন্যান্য</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button type="submit" disabled={savingAddr} style={{ padding: '10px 24px', background: PRIMARY, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {savingAddr ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}
                    </button>
                    <button type="button" onClick={() => setShowAddrForm(false)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>বাতিল</button>
                  </div>
                </form>
              )}

              {loading ? <Spinner /> :
                addresses.length === 0 && !showAddrForm ? (
                  <EmptyState icon="📍" text="কোনো ঠিকানা নেই" />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {addresses.map(addr => (
                      <div key={addr._id} style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', padding: 20, position: 'relative' }}>
                        <span style={{ display: 'inline-block', background: '#f0fdf4', color: PRIMARY, borderRadius: 8, fontSize: 11, fontWeight: 700, padding: '2px 10px', marginBottom: 12 }}>
                          {addr.addressType === 'home' ? 'বাড়ি' : addr.addressType === 'office' ? 'অফিস' : 'অন্যান্য'}
                        </span>
                        {addr.phoneNo && <p style={{ margin: '0 0 4px', fontWeight: 600 }}>📞 {addr.phoneNo}</p>}
                        {addr.address && <p style={{ margin: '0 0 4px', color: '#475569', fontSize: 14 }}>{addr.address}</p>}
                        {addr.city && <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>{addr.city}</p>}
                        <button
                          onClick={() => deleteAddress(addr._id)}
                          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 18 }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}

          {/* Wishlist */}
          {tab === 'wishlist' && (
            <div>
              <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>ইচ্ছা তালিকা</h2>
              {loading ? <Spinner /> :
                wishlist.length === 0 ? (
                  <EmptyState icon="♡" text="ইচ্ছা তালিকা খালি" link="/products" linkText="বই দেখুন" />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                    {wishlist.map(p => {
                      const price = (p.salePrice || 0) - (p.discountAmount || 0);
                      return (
                        <div key={p._id} style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                          <Link href={`/products/${p.slug}`} style={{ display: 'block' }}>
                            <div style={{ aspectRatio: '3/4', background: '#f1f5f9', overflow: 'hidden' }}>
                              {p.images?.[0] ? (
                                <img src={imgUrl(p.images[0]) || ''} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${PRIMARY}55, #22c55e55)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📚</div>
                              )}
                            </div>
                          </Link>
                          <div style={{ padding: '10px 12px' }}>
                            <Link href={`/products/${p.slug}`} style={{ textDecoration: 'none' }}>
                              <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 13, color: '#0f172a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</p>
                            </Link>
                            <p style={{ margin: '0 0 10px', fontWeight: 700, color: PRIMARY, fontSize: 14 }}>৳{price || p.salePrice}</p>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Link href={`/products/${p.slug}`} style={{ flex: 1, background: PRIMARY, color: 'white', textAlign: 'center', padding: '6px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>বিস্তারিত</Link>
                              <button onClick={() => removeWishlist(p._id)} style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>✕</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>
          )}

          {/* Settings */}
          {tab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>প্রোফাইল সেটিংস</h2>

              {/* Profile info */}
              <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 28 }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>ব্যক্তিগত তথ্য</h3>
                <form onSubmit={saveProfile}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div>
                      <label style={labelStyle}>পুরো নাম</label>
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="আপনার নাম" style={fieldStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>মোবাইল নম্বর</label>
                      <input value={editForm.phoneNo} onChange={e => setEditForm(f => ({ ...f, phoneNo: e.target.value }))} placeholder="01XXXXXXXXX" style={fieldStyle} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>ইউজারনেম (ইমেইল)</label>
                      <input value={profile?.username || ''} disabled style={{ ...fieldStyle, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }} />
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>ইউজারনেম পরিবর্তন করা যাবে না</p>
                    </div>
                  </div>
                  <button type="submit" disabled={savingProfile} style={{ padding: '11px 28px', background: savingProfile ? '#86efac' : PRIMARY, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                    {savingProfile ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
                  </button>
                </form>
              </div>

              {/* Password */}
              <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 28 }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>পাসওয়ার্ড পরিবর্তন</h3>
                <form onSubmit={changePassword}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400, marginBottom: 20 }}>
                    <div>
                      <label style={labelStyle}>বর্তমান পাসওয়ার্ড</label>
                      <input type="password" value={pwForm.password} onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••" style={fieldStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>নতুন পাসওয়ার্ড</label>
                      <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="কমপক্ষে ৫ অক্ষর" style={fieldStyle} />
                    </div>
                  </div>
                  <button type="submit" disabled={changingPw} style={{ padding: '11px 28px', background: changingPw ? '#86efac' : PRIMARY, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                    {changingPw ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Points & Gifts */}
          {tab === 'points' && (
            <div>
              <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>পয়েন্ট & উপহার</h2>

              {/* Points card */}
              <div style={{ background: `linear-gradient(135deg, #f59e0b, #fbbf24)`, borderRadius: 24, padding: '32px 28px', marginBottom: 24, color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', right: 30, bottom: -30, width: 80, height: 80, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
                <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, opacity: 0.85 }}>মোট পয়েন্ট</p>
                <p style={{ margin: '0 0 4px', fontSize: 48, fontWeight: 900 }}>০</p>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>শীঘ্রই আসছে — প্রতিটি কেনায় পয়েন্ট অর্জন করুন</p>
              </div>

              {/* Coming soon grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {[
                  { icon: '⭐', title: 'লয়্যালটি পয়েন্ট', desc: 'প্রতি ক্রয়ে পয়েন্ট অর্জন করুন' },
                  { icon: '🎁', title: 'বিশেষ উপহার', desc: 'পয়েন্ট দিয়ে পুরস্কার পান' },
                  { icon: '🎂', title: 'জন্মদিনের অফার', desc: 'জন্মদিনে বিশেষ ছাড় পান' },
                  { icon: '👥', title: 'রেফারেল বোনাস', desc: 'বন্ধুকে আমন্ত্রণ জানিয়ে পয়েন্ট পান' },
                ].map(card => (
                  <div key={card.title} style={{ background: 'white', borderRadius: 16, padding: '20px 18px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>{card.icon}</div>
                    <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{card.title}</p>
                    <p style={{ margin: '0 0 12px', fontSize: 12, color: '#94a3b8' }}>{card.desc}</p>
                    <span style={{ background: '#f1f5f9', color: '#94a3b8', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '3px 12px' }}>শীঘ্রই আসছে</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 40, height: 40, border: `3px solid #dcfce7`, borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function EmptyState({ icon, text, link, linkText }: { icon: string; text: string; link?: string; linkText?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: 15 }}>{text}</p>
      {link && linkText && <Link href={link} style={{ color: PRIMARY, fontWeight: 700, fontSize: 14 }}>{linkText}</Link>}
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: '100%', height: 44, border: '1.5px solid #e2e8f0', borderRadius: 10,
  padding: '0 14px', fontSize: 14, color: '#0f172a', background: '#fafafa',
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6,
};

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #dcfce7', borderTopColor: PRIMARY, borderRadius: '50%' }} />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
