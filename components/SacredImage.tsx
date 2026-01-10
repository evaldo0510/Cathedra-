
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
  
  // Cores litúrgicas profissionais e profundas para o Santuário
  const SACRED_PALETTE: Record<string, { primary: string, glow: string, depth: string }> = {
    green: { primary: '#064e3b', glow: '#10b981', depth: '#022c22' }, 
    red: { primary: '#450a0a', glow: '#ef4444', depth: '#2d0606' },   
    purple: { primary: '#2e1065', glow: '#8b5cf6', depth: '#1e0a3d' }, 
    rose: { primary: '#500724', glow: '#f472b6', depth: '#310415' },  
    black: { primary: '#1c1917', glow: '#44403c', depth: '#0c0a09' }, 
    white: { primary: '#f5f5f4', glow: '#d4af37', depth: '#e7e5e4' }, 
    gold: { primary: '#451a03', glow: '#fbbf24', depth: '#290f02' }    
  };

  const placeholderStyle = useMemo(() => {
    const colorKey = liturgicalColor?.toLowerCase() || 'gold';
    const palette = SACRED_PALETTE[colorKey] || SACRED_PALETTE.gold;
    
    // Se tivermos cor dominante, usamos ela como base, senão usamos a paleta litúrgica
    const baseColor = dominantColor || palette.primary;
    const accentColor = dominantColor ? `${dominantColor}cc` : palette.glow;
    const darkColor = dominantColor ? `${dominantColor}ee` : palette.depth;

    return {
      background: `
        radial-gradient(circle at 0% 0%, ${accentColor}15 0%, transparent 50%),
        radial-gradient(circle at 100% 0%, ${baseColor}20 0%, transparent 50%),
        radial-gradient(circle at 100% 100%, ${accentColor}10 0%, transparent 50%),
        radial-gradient(circle at 0% 100%, ${baseColor}25 0%, transparent 50%),
        linear-gradient(135deg, ${darkColor} 0%, ${baseColor} 100%)
      `,
    } as React.CSSProperties;
  }, [liturgicalColor, dominantColor]);

  // Otimização de URL Unsplash para performance e qualidade
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
      {/* Camada 1: Mesh Gradient de Atmosfera */}
      <div 
        className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${isLoaded ? 'opacity-0' : 'opacity-100 animate-pulse'}`}
        style={{ ...placeholderStyle, animationDuration: '6s' }}
      />

      {/* Camada 2: Brilho Místico de Carregamento (Shimmer) */}
      {!isLoaded && (
        <div className="absolute inset-0 z-1 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" 
             style={{ width: '200%', animationDuration: '3s' }} />
      )}

      {/* Camada 3: Imagem Principal com Transição Fluida */}
      <img 
        src={error ? "https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&w=400" : mainSrc} 
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={`relative z-2 w-full h-full object-cover transition-all duration-[2500ms] cubic-bezier(0.16, 1, 0.3, 1) ${
          isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-xl'
        }`}
      />

      {/* Camada 4: Ícone de Carregamento Centralizado */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <Icons.Cross className="w-10 h-10 opacity-[0.08] text-gold animate-bounce" style={{ animationDuration: '3s' }} />
        </div>
      )}
      
      {/* Camada 5: Vinheta de Profundidade Cinematográfica */}
      <div className="absolute inset-0 z-3 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/60 opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
    </div>
  );
};

export default memo(SacredImage);
