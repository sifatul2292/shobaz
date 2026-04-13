'use client';

import { imgUrl } from '@/lib/api';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: string;
}

export function SafeImage({ src, alt, className, fallback = '📚' }: SafeImageProps) {
  const url = imgUrl(src);
  
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <span className="text-4xl">{fallback}</span>
      </div>
    );
  }
  
  return <img src={url} alt={alt} className={className} />;
}