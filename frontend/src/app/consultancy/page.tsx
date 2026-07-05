import { Metadata } from 'next';
import { Suspense } from 'react';
import ConsultancyClient from './ConsultancyClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com';

export const metadata: Metadata = {
  title: 'Higher Education Consultancy — Study Abroad Mentoring | Shobaz',
  description:
    'One-to-one mentoring for fully funded scholarships, fellowships, Master’s, PhD and postdoc positions abroad. Learn the process, own your application, and compete on the global stage.',
  keywords:
    'higher education consultancy, study abroad, fully funded scholarship, PhD position, fellowship, SOP, IELTS, research proposal, shobaz',
  alternates: { canonical: `${SITE_URL}/consultancy` },
  openGraph: {
    title: 'Higher Education Consultancy — Study Abroad Mentoring | Shobaz',
    description:
      'Mentoring for fully funded scholarships, fellowships, Master’s, PhD and postdoc positions abroad.',
    url: `${SITE_URL}/consultancy`,
    siteName: 'Shobaz',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Higher Education Consultancy | Shobaz',
    description:
      'Mentoring for fully funded scholarships, fellowships, Master’s, PhD and postdoc positions abroad.',
  },
};

export default function ConsultancyPage() {
  return (
    <Suspense>
      <ConsultancyClient />
    </Suspense>
  );
}
