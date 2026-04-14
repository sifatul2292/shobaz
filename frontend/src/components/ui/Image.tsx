'use client';

import { imgUrl } from '@/lib/api';
import { HiOutlineBookOpen } from 'react-icons/hi';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function SafeImage({ src, alt, className }: SafeImageProps) {
  const url = imgUrl(src);
  
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <HiOutlineBookOpen className="w-10 h-10 text-gray-300" />
      </div>
    );
  }
  
  return <img src={url} alt={alt} className={className} />;
}
