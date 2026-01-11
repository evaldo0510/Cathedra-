
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
  
  // Paleta litúrgica profunda para o Santuário
  const SACRED_PALETTE: Record<string, { primary: string, accent: string, depth: string }> = {
    green: { primary: '#064e3b', accent: '#059669', depth: '#022c22' }, 
    red: { primary: '#450a0a', accent: '#dc2626', depth: '#2d0606' },   
    purple: { primary: '#2e1065', accent: '#7c3aed', depth: '#1e0a3d' }, 
    rose: { primary: '#500724', accent: '#db2777', depth: '#310415' },  
    black: { primary: '#1c1917', accent: '#44403c', depth: '#0c0a09' }, 
    white: { primary: '#f5f5f4', accent: '#d4af37', depth: '#e7e5e4' }, 
    gold: { primary: '#451a03', accent: '#fbbf24', depth: '#290f02' }    
  };

  const placeholderStyle = useMemo(() => {
    const colorKey = liturgicalColor?.toLowerCase() || 'gold';
    const palette = SACRED_PALETTE[colorKey] || SACRED_PALETTE.gold;
    
    // Base da cor para o gradiente
    const base = dominantColor || palette.primary;
    const highlight = palette.accent;
    const shadow = palette.depth;

    // Criamos um "Mesh Gradient" artificial usando múltiplos gradientes radiais
    return {
      background: `
        radial-gradient(at 0% 0%, ${base}33 0px, transparent 50%),
        radial-gradient(at 100% 0%, ${highlight}22 0px, transparent 50%),
        radial-gradient(at 100% 100%, ${base}44 0px, transparent 50%),
        radial-gradient(at 0% 100%, ${highlight}11 0px, transparent 50%),
        ${shadow}
      `,
    } as React.CSSProperties;
  }, [liturgicalColor, dominantColor]);

  const mainSrc = useMemo(() => {
    if (!src) return "https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=70&w=400";
    if (src.includes('unsplash.com')) {
      const base = src.split('?')[0];
      return `${base}?auto=format&fit=crop&q=${priority ? '85' : '75'}&w=${priority ? '1200' : '800'}`;
    }
    return src;
  }, [src, priority]);

  useEffect(() => {
    if (!src) return;
    setIsLoaded(false);
    setError(false);
    const img = new Image();
    img.src = mainSrc;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => { setError(true); setIsLoaded(true); };
  }, [mainSrc, src]);

  return (
    <div className={`relative bg-[#0c0a09] overflow-hidden ${className}`}>
      {/* Mesh Gradient Atmosférico de Placeholder */}
      <div 
        className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${isLoaded ? 'opacity-0' : 'opacity-100 animate-pulse'}`}
        style={{ ...placeholderStyle, animationDuration: '8s' }}
      />

      {/* Brilho Místico de Carregamento */}
      {!isLoaded && (
        <div className="absolute inset-0 z-1 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent animate-shimmer" 
             style={{ width: '200%', animationDuration: '4s' }} />
      )}

      {/* Imagem Principal */}
      <img 
        src={error ? "https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&w=400" : mainSrc} 
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={`relative z-2 w-full h-full object-cover transition-all duration-[2500ms] cubic-bezier(0.16, 1, 0.3, 1) ${
          isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-2xl'
        }`}
      />

      {/* Ícone de Carregamento Centralizado */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <Icons.Cross className="w-12 h-12 opacity-[0.1] text-gold animate-bounce" style={{ animationDuration: '4s' }} />
        </div>
      )}
      
      {/* Vinheta Cinematográfica */}
      <div className="absolute inset-0 z-3 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/60 opacity-50 group-hover:opacity-70 transition-opacity duration-1000" />
    </div>
  );
};

export default memo(SacredImage);
