'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  HiOutlineAcademicCap,
  HiOutlineGlobeAlt,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineUserGroup,
  HiOutlineLightBulb,
  HiOutlineDocumentText,
  HiOutlineChatBubbleLeftRight,
} from 'react-icons/hi2';

const LEARN = [
  'Search for suitable universities and funding opportunities',
  'Identify scholarships and fellowships that match your profile',
  'Understand admission and funding requirements',
  'Contact prospective supervisors professionally',
  'Build a strong academic and research profile',
  'Prepare compelling application documents',
  'Develop long-term strategies for academic success',
];

const AREAS = [
  'Personalized academic & career counseling',
  'Fully funded postgraduate scholarships',
  'Fully funded research fellowships',
  "Master's and PhD positions",
  'Postdoctoral fellowships',
  'Graduate Teaching & Research assistantships',
  'University selection & application strategy',
  'Supervisor identification & communication',
  'Research proposal guidance',
  'Publication of scholarly articles',
  'English proficiency (IELTS, TOEFL, PTE, Duolingo)',
  'SOP, Personal Statement & Motivation Letter',
  'Academic CV preparation',
  'Recommendation letter guidance',
  'Interview preparation',
  'Visa & pre-departure advice',
];

const OFFER = [
  { icon: HiOutlineAcademicCap, text: 'Expert guidance grounded in real academic & research experience' },
  { icon: HiOutlineChatBubbleLeftRight, text: 'One-to-one personalized consultation' },
  { icon: HiOutlineSparkles, text: 'Transparent and ethical counseling' },
  { icon: HiOutlineDocumentText, text: 'Customized to your profile and career goals' },
  { icon: HiOutlineLightBulb, text: 'Comprehensive support from consultation to enrollment' },
];

const DIFFERENT = [
  'I do not promise admissions or scholarships',
  'I do not believe in shortcuts',
  'I do not believe in creating dependency',
];

const BENEFIT = [
  'An undergraduate seeking international scholarships',
  "A graduate planning a fully funded Master's or PhD",
  'A researcher looking for fellowship opportunities',
  'Anyone preparing for a self-funded or partially funded degree',
];

export default function ConsultancyClient() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 text-white">
          <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,#5eead4_0,transparent_40%),radial-gradient(circle_at_80%_0,#34d399_0,transparent_35%)]" />
          <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 text-xs font-medium tracking-wide uppercase ring-1 ring-white/20">
              <HiOutlineGlobeAlt className="w-4 h-4" /> Study Abroad Mentoring
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight text-balance">
              Higher Education Opens Doors to a World of Opportunities
            </h1>
            <p className="mt-6 max-w-2xl text-lg md:text-xl text-emerald-100/90 leading-relaxed">
              Higher education is more than a degree — it is an investment in your future. I help talented,
              motivated students win fully funded scholarships, fellowships, and research positions at leading
              universities worldwide.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-emerald-900 shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-50 hover:shadow-xl"
              >
                Book a Free Consultation
                <HiOutlineArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#areas"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/10"
              >
                Explore Areas of Guidance
              </a>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
              {[
                ['Fully', 'Funded Focus'],
                ['1:1', 'Mentoring'],
                ['0', 'Dependency'],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="text-3xl md:text-4xl font-bold">{n}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-emerald-200/80">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Intro / mission ─────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 py-16 md:py-20">
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
            Thousands of universities offer excellent Master&apos;s, PhD, and postdoctoral programs — many fully
            funded through scholarships, fellowships, and assistantships. Yet many capable students miss these
            opportunities, not for lack of talent, but for lack of proper guidance.
          </p>
          <p className="mt-5 text-lg md:text-xl text-gray-700 leading-relaxed">
            As a university professor and researcher, my goal is to bridge that gap. Financial limitations should
            never stop talented individuals from achieving their academic dreams.
          </p>
        </section>

        {/* ── Philosophy ──────────────────────────────────── */}
        <section className="bg-emerald-50/60 border-y border-emerald-100">
          <div className="max-w-4xl mx-auto px-4 py-16 md:py-20">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-700">My Philosophy</span>
            <h2 className="mt-3 text-2xl md:text-4xl font-bold text-gray-900 tracking-tight text-balance">
              Guidance should empower students — not make them dependent.
            </h2>
            <p className="mt-6 text-gray-700 leading-relaxed">
              Unlike traditional vendors that complete applications on your behalf for a big charge, I believe every
              student should understand the process, develop the skills, and take ownership of their journey. Why
              spend big money on someone to do what you can do yourself? My role is to mentor, guide, and give
              constructive feedback. Your role is to learn, grow, and build the confidence to prepare competitive
              applications independently — and save a lot of money in the process.
            </p>
          </div>
        </section>

        {/* ── What you'll learn ───────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">By working together, you will learn how to</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {LEARN.map((t, i) => (
              <div
                key={t}
                className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {i + 1}
                </span>
                <p className="text-gray-700 leading-snug">{t}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Areas of guidance ───────────────────────────── */}
        <section id="areas" className="bg-gray-50 border-y border-gray-100 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">Areas of Guidance</h2>
            <p className="mt-3 text-gray-600">Personalized mentoring across every step of your application.</p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {AREAS.map((a) => (
                <div
                  key={a}
                  className="flex items-center gap-3 rounded-xl bg-white px-4 py-3.5 ring-1 ring-gray-100 transition hover:ring-emerald-200"
                >
                  <HiOutlineCheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span className="text-sm text-gray-700">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What I offer ────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">What I Offer</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {OFFER.map(({ icon: Icon, text }) => (
              <div key={text} className="rounded-2xl border border-gray-100 p-6 shadow-sm transition hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Icon className="w-6 h-6" />
                </div>
                <p className="mt-4 text-gray-700 leading-snug">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── What makes it different ──────────────────────── */}
        <section className="bg-emerald-950 text-white">
          <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">What Makes My Approach Different?</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {DIFFERENT.map((d) => (
                <div key={d} className="flex items-start gap-3 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                  <HiOutlineXCircle className="w-6 h-6 shrink-0 text-rose-300" />
                  <p className="text-emerald-50">{d}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 max-w-3xl text-lg text-emerald-100/90 leading-relaxed">
              Instead, I develop capable applicants who understand the process, make informed decisions, and present
              themselves authentically. Success earned through your own preparation is more valuable than success
              achieved through reliance.
            </p>
          </div>
        </section>

        {/* ── Who benefits ────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Who Can Benefit</span>
          <h2 className="mt-3 text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">Whether you are…</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {BENEFIT.map((b) => (
              <div key={b} className="flex items-start gap-4 rounded-2xl bg-emerald-50/60 p-6 ring-1 ring-emerald-100">
                <HiOutlineUserGroup className="w-6 h-6 shrink-0 text-emerald-600" />
                <p className="text-gray-700">{b}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-gray-600">
            …I am here to help you understand the process, avoid common mistakes, and become a stronger applicant.
          </p>
        </section>

        {/* ── Commitment + CTA ────────────────────────────── */}
        <section className="px-4 pb-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 px-6 py-16 md:px-16 md:py-20 text-white shadow-2xl">
            <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_80%_20%,#5eead4_0,transparent_40%)]" />
            <div className="relative max-w-3xl">
              <HiOutlineAcademicCap className="w-10 h-10 text-emerald-200" />
              <h2 className="mt-5 text-3xl md:text-5xl font-bold leading-tight tracking-tight text-balance">
                Ready to take ownership of your academic journey?
              </h2>
              <p className="mt-5 text-lg text-emerald-100/90 leading-relaxed">
                I see every student as a future scholar, researcher, and leader. Leave this mentorship with lasting
                skills, confidence, and independence. If you are ready to learn the process and progress in academia,
                I would be honored to guide you.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-emerald-900 shadow-lg transition hover:bg-emerald-50"
                >
                  Book a Free Consultation
                  <HiOutlineArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/10"
                >
                  Ask a Question
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
