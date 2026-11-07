'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  file: string;
}

const GAP = 16;          // space between pages
const PAD_X = 12;        // side padding inside the scroll area (phones)
const DESKTOP_MIN = 640; // from this width up, fit a whole page in view

/**
 * Responsive PDF "look inside" viewer.
 *
 * - Sizes pages to the scroll container it lives in (not the window), and
 *   re-sizes on resize/rotation via ResizeObserver.
 * - Phones: page fills the width. Wider screens: a whole page fits in view.
 * - Pages render lazily near the viewport, at most 2x pixel density, so a
 *   20-page preview does not paint 20 large canvases up front.
 * - Floating "‹ 3 / 20 ›" pill shows progress and jumps between pages.
 */
export default function PdfViewer({ file }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [numPages, setNumPages] = useState(0);
  const [aspect, setAspect] = useState(1.414); // height / width (A-series default until known)
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [visible, setVisible] = useState<Set<number>>(() => new Set([1, 2]));
  const [current, setCurrent] = useState(1);
  const [failed, setFailed] = useState(false);

  // The scroll container is the parent element (the reader body).
  const scroller = () => rootRef.current?.parentElement ?? null;

  // Track the available size of the scroll container.
  useLayoutEffect(() => {
    const el = scroller();
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pageWidth = (() => {
    if (!box.w) return 0;
    const fitWidth = box.w - PAD_X * 2;
    if (box.w < DESKTOP_MIN) return Math.max(200, Math.floor(fitWidth));
    // Whole page in view: limited by height (minus room for the pager pill).
    const fitHeight = (box.h - GAP * 2 - 56) / aspect;
    return Math.max(260, Math.floor(Math.min(fitWidth, fitHeight, 820)));
  })();
  const pageHeight = Math.round(pageWidth * aspect);

  // Lazy render + current page tracking.
  useEffect(() => {
    const root = scroller();
    if (!root || !numPages) return;
    const near = new IntersectionObserver(
      (entries) => {
        setVisible((prev) => {
          let next = prev;
          entries.forEach((e) => {
            const n = Number((e.target as HTMLElement).dataset.page);
            if (e.isIntersecting && !prev.has(n)) {
              if (next === prev) next = new Set(prev);
              next.add(n);
            }
          });
          return next;
        });
      },
      { root, rootMargin: '900px 0px' },
    );
    const centre = new IntersectionObserver(
      (entries) => {
        const best = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best) setCurrent(Number((best.target as HTMLElement).dataset.page));
      },
      { root, threshold: [0.35, 0.6, 0.85] },
    );
    pageRefs.current.forEach((el) => { if (el) { near.observe(el); centre.observe(el); } });
    return () => { near.disconnect(); centre.disconnect(); };
  }, [numPages, pageWidth]);

  const goTo = useCallback((n: number) => {
    const target = pageRefs.current[n - 1];
    const root = scroller();
    if (!target || !root) return;
    root.scrollTo({ top: target.offsetTop - GAP, behavior: 'smooth' });
  }, []);

  const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;

  return (
    <div ref={rootRef} className="pdfv">
      {failed ? (
        <p className="pdfv-msg">প্রিভিউ লোড করা যায়নি। পরে আবার চেষ্টা করুন।</p>
      ) : (
        <Document
          file={file}
          onLoadSuccess={async (pdf) => {
            setNumPages(pdf.numPages);
            try {
              const first = await pdf.getPage(1);
              const vp = first.getViewport({ scale: 1 });
              if (vp.width > 0) setAspect(vp.height / vp.width);
            } catch { /* keep default aspect */ }
          }}
          onLoadError={() => setFailed(true)}
          loading={<div className="pdfv-msg"><span className="pdfv-spinner" aria-hidden="true" /> প্রিভিউ লোড হচ্ছে…</div>}
          error={<p className="pdfv-msg">প্রিভিউ লোড করা যায়নি।</p>}
        >
          {pageWidth > 0 && (
            <div className="pdfv-pages" style={{ gap: GAP, padding: `${GAP}px ${PAD_X}px ${GAP + 64}px` }}>
              {Array.from({ length: numPages }, (_, i) => {
                const n = i + 1;
                return (
                  <div
                    key={n}
                    ref={(el) => { pageRefs.current[i] = el; }}
                    data-page={n}
                    className="pdfv-page"
                    style={{ width: pageWidth, height: pageHeight }}
                  >
                    {visible.has(n) ? (
                      <Page
                        pageNumber={n}
                        width={pageWidth}
                        devicePixelRatio={dpr}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        loading={<span className="pdfv-page-loading" />}
                      />
                    ) : (
                      <span className="pdfv-page-loading" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Document>
      )}

      {numPages > 1 && (
        <div className="pdfv-pager" role="navigation" aria-label="পৃষ্ঠা">
          <button type="button" onClick={() => goTo(Math.max(1, current - 1))} disabled={current <= 1} aria-label="আগের পৃষ্ঠা">‹</button>
          <span aria-live="polite">{current} / {numPages}</span>
          <button type="button" onClick={() => goTo(Math.min(numPages, current + 1))} disabled={current >= numPages} aria-label="পরের পৃষ্ঠা">›</button>
        </div>
      )}
    </div>
  );
}
