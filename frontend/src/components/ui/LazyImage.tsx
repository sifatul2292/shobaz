'use client';

import { useState } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Drop-in replacement for <img> with:
 * - Native lazy loading (loading="lazy")
 * - Fade-in once the image has decoded (prevents abrupt pop-in)
 * - Falls back gracefully if src is missing
 */
export default function LazyImage({ src, alt, className = '' }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);

  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}
