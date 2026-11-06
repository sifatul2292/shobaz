import { Fragment } from 'react';
import Link from 'next/link';

/** Minimal Shopify-style progress: কার্ট › চেকআউট › সম্পন্ন */
export default function CheckoutSteps({ step }: { step: 1 | 2 | 3 }) {
  const steps = [{ n: 1, label: 'কার্ট', href: '/cart' }, { n: 2, label: 'চেকআউট', href: '/checkout' }, { n: 3, label: 'সম্পন্ন', href: '' }];
  return (
    <nav className="co-steps" aria-label="চেকআউট ধাপ">
      {steps.map((s, i) => (
        <Fragment key={s.n}>
          {s.n < step && s.href ? (
            <Link href={s.href} className="co-step is-done">{s.label}</Link>
          ) : (
            <span className={`co-step${s.n === step ? ' is-active' : ''}`} aria-current={s.n === step ? 'step' : undefined}>{s.label}</span>
          )}
          {i < steps.length - 1 && <span className="co-step-sep" aria-hidden="true">›</span>}
        </Fragment>
      ))}
    </nav>
  );
}
