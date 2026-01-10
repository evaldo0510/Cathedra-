
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
  const [blurLoaded, setBlurLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Mapeamento de cores litúrgicas para tons profundos e atmosféricos
  const SACRED_PALETTE: Record<string, { primary: string, secondary: string }> = {
    green: { primary: '#064e3b', secondary: '#065f46' }, // Verde profundo
    red: { primary: '#7f1d1d', secondary: '#991b1b' },   // Vermelho sangue/mártir
    purple: { primary: '#4c1d95', secondary: '#5b21b6' }, // Roxo episcopal
    rose: { primary: '#be185d', secondary: '#db2777' },  // Rosa litúrgico
    black: { primary: '#1c1917', secondary: '#292524' }, // Luto/Sexta-feira Santa
    white: { primary: '#f5f5f4', secondary: '#e7e5e4' }, // Pureza (com leve tom creme)
    gold: { primary: '#78350f', secondary: '#92400e' }    // Ouro antigo/realeza
  };

  const placeholderStyle = useMemo(() => {
    // 1. Se cor dominante for fornecida (via API ou prop)
    if (dominantColor) {
      return {
        background: `radial-gradient(circle at 30% 30%, ${dominantColor}60 0%, ${dominantColor}20 100%)`,
      } as React.CSSProperties;
    }

    // 2. Fallback para cores litúrgicas baseadas na tradição
    const colorKey = liturgicalColor?.toLowerCase() || 'gold';
    const palette = SACRED_PALETTE[colorKey] || SACRED_PALETTE.gold;
    
    return {
      background: `linear-gradient(135deg, ${palette.primary}40 0%, ${palette.secondary}15 100%)`,
    } as React.CSSProperties;
  }, [liturgicalColor, dominantColor]);

  // Miniatura ultra-low-res para efeito "Lumen Placeholder"
  const blurSrc = useMemo(() => {
    if (!src || !src.includes('unsplash.com')) return null;
    const base = src.split('?')[0];
    return `${base}?auto=format&fit=crop&q=10&w=32&blur=10`;
  }, [src]);

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
    <div className={`relative bg-stone-100 dark:bg-stone-900/50 overflow-hidden ${className}`}>
      {/* 1. Camada de Atmosfera Teológica (Gradiente de Cor) */}
      <div 
        className="absolute inset-0 z-0 transition-all duration-1000 ease-in-out"
        style={placeholderStyle}
      />

      {/* 2. Camada Blur-up (O 'Vulto' da imagem enquanto carrega) */}
      {blurSrc && !error && (
        <div 
          className={`absolute inset-0 z-1 transition-opacity duration-1000 ease-in-out ${blurLoaded && !isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ transform: 'scale(1.1)' }}
        >
          <img
            src={blurSrc}
            alt=""
            onLoad={() => setBlurLoaded(true)}
            className="w-full h-full object-cover filter blur-2xl grayscale-[0.3]"
          />
        </div>
      )}

      {/* 3. Brilho Místico (Shimmer) - Mais sutil, apenas nas bordas e centros */}
      {!isLoaded && (
        <div className="absolute inset-0 z-2 bg-gradient-to-r from-transparent via-gold/5 to-transparent animate-shimmer" 
             style={{ width: '200%' }} />
      )}

      {/* 4. Camada de Imagem Principal com Efeito de Revelação (Fade + Scale) */}
      <img 
        src={error ? "https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&w=400" : mainSrc} 
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={`relative z-3 w-full h-full object-cover transition-all duration-[1200ms] cubic-bezier(0.23, 1, 0.32, 1) ${
          isLoaded ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-110 -rotate-1'
        }`}
      />

      {/* 5. Ícone Sacro Minimalista (Enquanto carrega tudo) */}
      {!isLoaded && !blurLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <Icons.Cross className="w-10 h-10 opacity-10 text-stone-400 dark:text-stone-600 animate-pulse" />
        </div>
      )}
      
      {/* Detalhe Decorativo de Borda Interna (Vignette) */}
      <div className="absolute inset-0 z-4 pointer-events-none bg-gradient-to-b from-black/10 via-transparent to-black/20" />
    </div>
  );
};

export default memo(SacredImage);
