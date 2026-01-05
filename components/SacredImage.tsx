
import React, { useState, useEffect, memo, useMemo } from 'react';
import { Icons } from '../constants';

interface SacredImageProps {
  src: string;
  alt: string;
  className: string;
  priority?: boolean;
  liturgicalColor?: string; // 'green', 'red', 'purple', 'white', 'rose', 'black'
}

/**
 * SacredImage: Otimizado para performance e estética sacra.
 * Placeholder agora utiliza gradientes dinâmicos baseados no tempo litúrgico.
 */
const SacredImage: React.FC<SacredImageProps> = ({ src, alt, className, priority = false, liturgicalColor }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Mapeamento de cores litúrgicas para gradientes suaves
  const placeholderGradient = useMemo(() => {
    switch (liturgicalColor?.toLowerCase()) {
      case 'green':
        return 'linear-gradient(135deg, #e6f4ea 0%, #c8e6c9 100%)';
      case 'red':
        return 'linear-gradient(135deg, #fdeaea 0%, #ffcdd2 100%)';
      case 'purple':
        return 'linear-gradient(135deg, #f3e8ff 0%, #e1bee7 100%)';
      case 'rose':
        return 'linear-gradient(135deg, #fff0f3 0%, #f8bbd0 100%)';
      case 'black':
        return 'linear-gradient(135deg, #f1f1f1 0%, #cfd8dc 100%)';
      case 'white':
      case 'gold':
      default:
        return 'linear-gradient(135deg, #fffdf0 0%, #fff9c4 100%)';
    }
  }, [liturgicalColor]);

  // Otimização Unsplash
  const optimizedSrc = useMemo(() => {
    if (!src) return "https://images.unsplash.com/photo-1548610762-656391d1ad4d?w=800&q=80";
    if (src.includes('unsplash.com')) {
      const url = new URL(src);
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
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
      {/* Placeholder com Gradiente Litúrgico e Shimmer */}
      {loading && (
        <div 
          className="absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-500 overflow-hidden"
          style={{ background: placeholderGradient }}
        >
          {/* Efeito Shimmer */}
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <div className="relative z-20 flex flex-col items-center gap-3">
            <Icons.Cross className="w-8 h-8 text-stone-900/10 dark:text-white/10 animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-900/20 dark:text-white/20">Aguardando Luz...</span>
          </div>
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
