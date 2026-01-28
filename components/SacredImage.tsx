
import React, { useState, useEffect, memo, useMemo } from 'react';
import { Icons } from '../constants';

interface SacredImageProps {
  src: string;
  alt: string;
  className: string;
  priority?: boolean;
  liturgicalColor?: string;
  dominantColor?: string;
}

const SacredImage: React.FC<SacredImageProps> = ({ 
  src, 
  alt, 
  className, 
  priority = false, 
  liturgicalColor,
  dominantColor 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  const SACRED_PALETTE: Record<string, { primary: string, accent: string, depth: string }> = {
    green: { primary: '#064e3b', accent: '#059669', depth: '#022c22' }, 
    red: { primary: '#450a0a', accent: '#dc2626', depth: '#2d0606' },   
    purple: { primary: '#2e1065', accent: '#7c3aed', depth: '#1e0a3d' }, 
    rose: { primary: '#500724', accent: '#db2777', depth: '#310415' },  
    black: { primary: '#1c1917', accent: '#44403c', depth: '#0c0a09' }, 
    white: { primary: '#e5e5e0', accent: '#d4af37', depth: '#a8a29e' }, 
    gold: { primary: '#451a03', accent: '#fbbf24', depth: '#290f02' }    
  };

  const colors = useMemo(() => {
    const colorKey = liturgicalColor?.toLowerCase() || 'gold';
    const palette = SACRED_PALETTE[colorKey] || SACRED_PALETTE.gold;
    return {
      base: dominantColor || palette.primary,
      accent: dominantColor ? `${dominantColor}cc` : palette.accent,
      depth: dominantColor ? `${dominantColor}66` : palette.depth
    };
  }, [liturgicalColor, dominantColor]);

  const mainSrc = useMemo(() => {
    if (!src) return "https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=80&w=600";
    // Forçamos parâmetros de qualidade e fallback caso o link original falhe
    if (src.includes('unsplash.com')) {
      const base = src.split('?')[0];
      return `${base}?auto=format&fit=crop&q=${priority ? '85' : '75'}&w=${priority ? '1400' : '800'}`;
    }
    return src;
  }, [src, priority]);

  useEffect(() => {
    // IMPORTANTE: Resetar estados ao mudar a imagem
    setIsLoaded(false);
    setError(false);
    
    if (!src) return;
    
    const img = new Image();
    img.src = mainSrc;
    img.onload = () => {
      setIsLoaded(true);
    };
    img.onerror = () => { 
      console.warn(`Failed to load sacred image: ${mainSrc}`);
      setError(true); 
      setIsLoaded(true); 
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [mainSrc]);

  return (
    <div className={`relative bg-[#0c0a09] overflow-hidden ${className} group/sacred`}>
      {/* Sacrum Nebula Placeholder */}
      <div 
        className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${isLoaded && !error ? 'opacity-0' : 'opacity-100'}`}
        style={{ backgroundColor: colors.base }}
      >
        <div 
          className="absolute inset-[-50%] opacity-60 animate-drift-slow"
          style={{ background: `radial-gradient(circle at 40% 40%, ${colors.accent} 0%, transparent 70%)` }}
        />
        <div 
          className="absolute inset-[-50%] opacity-40 animate-drift-reverse"
          style={{ background: `radial-gradient(circle at 60% 60%, ${colors.depth} 0%, transparent 70%)` }}
        />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none" />
        <div className="absolute inset-0 backdrop-blur-2xl" />
      </div>

      {/* Main Image */}
      <img 
        src={error ? "https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&w=800&q=80" : mainSrc} 
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={`relative z-[2] w-full h-full object-cover transition-all duration-[2000ms] ${
          isLoaded && !error
            ? 'opacity-100 scale-100 blur-0' 
            : 'opacity-0 scale-105 blur-md'
        }`}
      />

      {/* Loading Cross */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <Icons.Cross className="w-10 h-10 opacity-20 text-gold animate-spin-slow" />
        </div>
      )}
      
      {/* Depth Vignette */}
      <div className="absolute inset-0 z-[3] pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/60 opacity-50 group-hover/sacred:opacity-30 transition-opacity duration-1000" />
      
      <style>{`
        @keyframes drift-slow {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(3%, 3%) rotate(2deg) scale(1.1); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        }
        @keyframes drift-reverse {
          0% { transform: translate(0, 0) rotate(0deg) scale(1.1); }
          50% { transform: translate(-3%, -3%) rotate(-2deg) scale(1); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1.1); }
        }
        .animate-drift-slow { animation: drift-slow 15s ease-in-out infinite; }
        .animate-drift-reverse { animation: drift-reverse 18s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 12s linear infinite; }
      `}</style>
    </div>
  );
};

export default memo(SacredImage);
