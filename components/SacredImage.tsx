
import React, { useState, useEffect, memo, useMemo } from 'react';
import { Icons } from '../constants';

interface SacredImageProps {
  src: string;
  alt: string;
  className: string;
  priority?: boolean;
}

/**
 * SacredImage: Optimized for performance and aesthetics.
 * Features: Lazy loading, themed placeholders, CLS protection, and blur-up transitions.
 */
const SacredImage: React.FC<SacredImageProps> = ({ src, alt, className, priority = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Dynamic Unsplash optimization
  const optimizedSrc = useMemo(() => {
    if (!src) return "https://images.unsplash.com/photo-1548610762-656391d1ad4d?w=800&q=80";
    if (src.includes('unsplash.com')) {
      const url = new URL(src);
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      // Priority images get higher quality and size
      url.searchParams.set('q', priority ? '85' : '60');
      url.searchParams.set('w', priority ? '1400' : '700');
      return url.toString();
    }
    return src;
  }, [src, priority]);

  useEffect(() => {
    if (!src) return;
    setLoading(true);
    const img = new Image();
    img.src = optimizedSrc;
    img.onload = () => setLoading(false);
    img.onerror = () => {
      setError(true);
      setLoading(false);
    };
  }, [optimizedSrc, src]);

  const fallbackImage = "https://images.unsplash.com/photo-1548610762-656391d1ad4d?w=800&q=80";

  return (
    <div className={`relative bg-stone-100 dark:bg-stone-900 overflow-hidden ${className}`}>
      {/* Sacred Placeholder: Cross icon with subtle liturgical pulse */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-50 dark:bg-stone-900 z-10 transition-opacity duration-500">
           <Icons.Cross className="w-8 h-8 text-gold/15 animate-pulse" />
        </div>
      )}
      
      <img 
        src={error ? fallbackImage : optimizedSrc} 
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`w-full h-full object-cover transition-all duration-1000 ease-in-out ${loading ? 'opacity-0 scale-110 blur-2xl' : 'opacity-100 scale-100 blur-0'}`}
      />
    </div>
  );
};

export default memo(SacredImage);
