
import React, { useState, useEffect, memo, useMemo } from 'react';
import { Icons } from '../constants';

interface SacredImageProps {
  src: string;
  alt: string;
  className: string;
  priority?: boolean;
  liturgicalColor?: string; // 'green', 'red', 'purple', 'white', 'rose', 'black'
  dominantColor?: string; // Hex color if available for adaptive placeholder
}

/**
 * SacredImage: Otimizado para performance e estética de "Santuário Digital".
 * O placeholder agora se adapta dinamicamente à cor predominante da imagem esperada,
 * criando uma transição de carregamento quase imperceptível.
 */
const SacredImage: React.FC<SacredImageProps> = ({ src, alt, className, priority = false, liturgicalColor, dominantColor }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Mapeamento de cores para gradientes adaptativos e sutis
  const placeholderStyle = useMemo(() => {
    // Cores base neutras para o tema parchment/dark
    let colorA = '#f5f0e1'; 
    let colorB = '#fdfcf8';
    let glowColor = 'rgba(212, 175, 55, 0.05)';

    if (dominantColor) {
      // Se houver cor dominante, cria um gradiente tonal sutil (low opacity)
      colorA = `${dominantColor}15`; // 8% opacity
      colorB = `${dominantColor}08`; // 3% opacity
      glowColor = `${dominantColor}20`; // 12% opacity para o brilho central
    } else if (liturgicalColor) {
      // Cores litúrgicas pré-definidas se não houver dominantColor
      const colors: Record<string, string> = {
        green: '#1b4d2e',
        red: '#a61c1c',
        purple: '#5e2a84',
        rose: '#c71585',
        black: '#1a1a1a',
        white: '#d4af37',
        gold: '#d4af37'
      };
      const base = colors[liturgicalColor.toLowerCase()] || '#d4af37';
      colorA = `${base}15`;
      colorB = `${base}05`;
      glowColor = `${base}10`;
    }

    return {
      background: `linear-gradient(135deg, ${colorA} 0%, ${colorB} 100%)`,
      '--glow-color': glowColor
    } as React.CSSProperties;
  }, [liturgicalColor, dominantColor]);

  // Otimização inteligente via Unsplash
  const optimizedSrc = useMemo(() => {
    if (!src) return "https://images.unsplash.com/photo-1548610762-656391d1ad4d?w=800&q=80";
    if (src.includes('unsplash.com')) {
      const url = new URL(src);
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('q', priority ? '85' : '65'); // Qualidade maior se for prioridade
      url.searchParams.set('w', priority ? '1400' : '800');
      return url.toString();
    }
    return src;
  }, [src, priority]);

  useEffect(() => {
    if (!src) return;
    setLoading(true);
    const img = new Image();
    img.src = optimizedSrc;
    img.onload = () => {
      // Pequeno delay intencional para evitar flashes brutos em conexões ultra-rápidas
      setTimeout(() => setLoading(false), 50);
    };
    img.onerror = () => {
      setError(true);
      setLoading(false);
    };
  }, [optimizedSrc, src]);

  const fallbackImage = "https://images.unsplash.com/photo-1548610762-656391d1ad4d?w=800&q=80";

  return (
    <div className={`relative bg-stone-50 dark:bg-stone-900 overflow-hidden ${className}`}>
      {/* Camada de Placeholder Adaptativo */}
      <div 
        className={`absolute inset-0 z-10 flex items-center justify-center transition-all duration-[1200ms] cubic-bezier(0.4, 0, 0.2, 1) ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={placeholderStyle}
      >
        {/* Shimmer de luz ambiente */}
        <div className="absolute inset-0 animate-shimmer opacity-[0.15] bg-gradient-to-r from-transparent via-white dark:via-stone-400 to-transparent" />
        
        {/* Brilho Central (Efeito Stained Glass/Lux) */}
        <div 
          className="absolute w-1/2 h-1/2 rounded-full blur-[80px] opacity-40 animate-pulse"
          style={{ backgroundColor: 'var(--glow-color)' }}
        />
        
        <div className="relative z-20 flex flex-col items-center gap-4">
          <div className="relative">
            <Icons.Cross className="w-10 h-10 text-stone-900/10 dark:text-white/10" />
            <div className="absolute inset-0 blur-xl bg-gold/10 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Camada da Imagem Real */}
      <img 
        src={error ? fallbackImage : optimizedSrc} 
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`w-full h-full object-cover transition-all duration-[1500ms] cubic-bezier(0.23, 1, 0.32, 1) ${loading ? 'opacity-0 scale-[1.03] blur-xl grayscale-[0.3]' : 'opacity-100 scale-100 blur-0 grayscale-0'}`}
      />
      
      {/* Vinheta Sutil de Finalização */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_0_100px_rgba(0,0,0,0.2)]" />
    </div>
  );
};

export default memo(SacredImage);
