'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShopInfo } from '@/types';
import api, { imgUrl } from '@/lib/api';
import { FaFacebookF, FaYoutube, FaInstagram } from 'react-icons/fa';

interface Page {
  _id: string;
  name: string;
  slug: string;
  menuLabel?: string;
  footerOrder?: number;
}

// Footer remounts with every page; keep its data for the session.
let shopMemo: ShopInfo | null = null;
let pagesMemo: Page[] | null = null;

const QUICK_LINKS = [
  { href: '/products', label: 'সকল বই' },
  { href: '/authors', label: 'লেখক' },
  { href: '/publishers', label: 'প্রকাশনা' },
  { href: '/offers', label: 'অফার' },
  { href: '/blog', label: 'ব্লগ' },
];

const FALLBACK_PAGES = [
  { href: '/contact', label: 'যোগাযোগ' },
  { href: '/about', label: 'আমাদের সম্পর্কে' },
  { href: '/terms', label: 'শর্তাবলী' },
  { href: '/privacy-policy', label: 'গোপনীয়তা নীতি' },
];

export default function Footer() {
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(shopMemo);
  const [footerPages, setFooterPages] = useState<Page[]>(pagesMemo ?? []);

  useEffect(() => {
    if (shopMemo && pagesMemo) return;
    const fetchData = async () => {
      try {
        const [shopRes, pagesRes] = await Promise.all([
          api.get('/shop-information/get'),
          api.get('/additional-page/get-all?showInFooter=true&includeInactive=false'),
        ]);
        if (shopRes.data?.data) { shopMemo = shopRes.data.data; setShopInfo(shopRes.data.data); }
        if (pagesRes.data?.data) { pagesMemo = pagesRes.data.data; setFooterPages(pagesRes.data.data); }
      } catch (err: any) {
        console.log('Footer fetch error:', err.message);
      }
    };
    fetchData();
  }, []);

  const getPhone = () => shopInfo?.phones?.find(p => p.type === 0)?.value || shopInfo?.phones?.[0]?.value;
  const getEmail = () => shopInfo?.emails?.find(e => e.type === 0)?.value || shopInfo?.emails?.[0]?.value;
  const getAddress = () => shopInfo?.addresses?.find(a => a.type === 0)?.value || shopInfo?.addresses?.[0]?.value;
  const getFacebook = () => shopInfo?.socialLinks?.find(s => s.value?.includes('facebook'))?.value;
  const getYoutube = () => shopInfo?.socialLinks?.find(s => s.value?.includes('youtube'))?.value;
  const getInstagram = () => shopInfo?.socialLinks?.find(s => s.value?.includes('instagram'))?.value;

  const currentYear = new Date().getFullYear();
  const siteName = shopInfo?.siteName || 'Shobaz';
  const logo = shopInfo?.navLogo || shopInfo?.siteLogo;
  const serviceLinks = footerPages.length > 0
    ? footerPages.map(page => ({ href: `/page/${page.slug}`, label: page.menuLabel || page.name, key: page._id }))
    : FALLBACK_PAGES.map(l => ({ ...l, key: l.href }));
  const socials = [
    { href: getFacebook(), label: 'Facebook', Icon: FaFacebookF },
    { href: getYoutube(), label: 'YouTube', Icon: FaYoutube },
    { href: getInstagram(), label: 'Instagram', Icon: FaInstagram },
  ].filter(s => s.href);

  return (
    <footer className="sf">
      <div className="sf-inner">
        <div className="sf-grid">
          {/* Brand */}
          <div className="sf-brand">
            <Link href="/" className="sf-logo" aria-label={`${siteName} হোম`}>
              {logo ? <img src={imgUrl(logo)!} alt={siteName} /> : <span>{siteName}</span>}
            </Link>
            <p className="sf-tagline">
              {shopInfo?.shortDescription || 'বাংলাদেশের অন্যতম বিশ্বস্ত অনলাইন বইয়ের দোকান'}
            </p>
            {socials.length > 0 && (
              <div className="sf-social">
                {socials.map(({ href, label, Icon }) => (
                  <a key={label} href={href!} target="_blank" rel="noopener noreferrer" aria-label={label}>
                    <Icon />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="sf-heading">দ্রুত লিংক</h3>
            <ul className="sf-list">
              {QUICK_LINKS.map(l => (
                <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Customer Service — from backend, with a fallback */}
          <div>
            <h3 className="sf-heading">গ্রাহক সেবা</h3>
            <ul className="sf-list">
              {serviceLinks.map(l => (
                <li key={l.key}><Link href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="sf-contact">
            <h3 className="sf-heading">যোগাযোগ</h3>
            <ul className="sf-list">
              {getPhone() && <li><a href={`tel:${getPhone()}`}>{getPhone()}</a></li>}
              {getEmail() && <li><a href={`mailto:${getEmail()}`}>{getEmail()}</a></li>}
              {getAddress() && <li className="sf-muted">{getAddress()}</li>}
              <li><Link href="/contact">মেসেজ পাঠান →</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="sf-bottom">
          <p>© {currentYear} {siteName}. সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="sf-pay" aria-label="পেমেন্ট মাধ্যম">
            <span>bKash</span><span>Nagad</span><span>কার্ড</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
