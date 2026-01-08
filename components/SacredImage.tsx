
import React, { useState, useEffect, memo, useMemo } from 'react';
import { Icons } from '../constants';

interface SacredImageProps {
  src: string;
  alt: string;
  className: string;
  priority?: boolean;
  liturgicalColor?: string;
}

const SacredImage: React.FC<SacredImageProps> = ({ src, alt, className, priority = false, liturgicalColor }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const placeholderStyle = useMemo(() => {
    const colors: Record<string, string> = {
      green: '#1b4d2e', red: '#a61c1c', purple: '#5e2a84',
      rose: '#c71585', black: '#1a1a1a', white: '#d4af37', gold: '#d4af37'
    };
    const base = colors[liturgicalColor?.toLowerCase() || 'gold'] || '#d4af37';
    return {
      background: `linear-gradient(135deg, ${base}20 0%, ${base}10 100%)`,
    } as React.CSSProperties;
  }, [liturgicalColor]);

  // CARREGAMENTO PROGRESSIVO: Pede miniatura primeiro se não for prioridade
  const optimizedSrc = useMemo(() => {
    if (!src) return "https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=70&w=400";
    if (src.includes('unsplash.com')) {
      const base = src.split('?')[0];
      return `${base}?auto=format&fit=crop&q=${priority ? '80' : '60'}&w=${priority ? '1000' : '400'}`;
    }
    return src;
  }, [src, priority]);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.src = optimizedSrc;
    img.onload = () => setLoading(false);
    img.onerror = () => { setError(true); setLoading(false); };
  }, [optimizedSrc, src]);

  return (
    <div className={`relative bg-stone-100 dark:bg-stone-900 overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center" style={placeholderStyle}>
          <div className="absolute inset-0 animate-shimmer opacity-10 bg-gradient-to-r from-transparent via-white to-transparent" />
          <Icons.Cross className="w-6 h-6 opacity-10 animate-pulse text-stone-500" />
        </div>
      )}
      <img 
        src={error ? "https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&w=400" : optimizedSrc} 
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
};

export default memo(SacredImage);
