
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
  
  // Paleta litúrgica estendida com variações de profundidade
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
      accent: palette.accent,
      depth: palette.depth
    };
  }, [liturgicalColor, dominantColor]);

  const mainSrc = useMemo(() => {
    if (!src) return "https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=70&w=400";
    if (src.includes('unsplash.com')) {
      const base = src.split('?')[0];
      return `${base}?auto=format&fit=crop&q=${priority ? '85' : '75'}&w=${priority ? '1400' : '800'}`;
    }
    return src;
  }, [src, priority]);

  useEffect(() => {
    if (!src) return;
    setIsLoaded(false);
    setError(false);
    
    const img = new Image();
    img.src = mainSrc;
    img.onload = () => {
      setTimeout(() => setIsLoaded(true), 50);
    };
    img.onerror = () => { 
      setError(true); 
      setIsLoaded(true); 
    };
  }, [mainSrc, src]);

  return (
    <div className={`relative bg-[#0c0a09] overflow-hidden ${className} group/sacred`}>
      {/* Sacrum Nebula Placeholder */}
      <div 
        className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
        style={{ backgroundColor: colors.base }}
      >
        {/* Camadas de drift para simular nebulosa e luz de velas */}
        <div 
          className="absolute inset-[-50%] opacity-40 animate-drift-slow"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${colors.accent} 0%, transparent 60%)`
          }}
        />
        <div 
          className="absolute inset-[-50%] opacity-30 animate-drift-reverse"
          style={{
            background: `radial-gradient(circle at 70% 70%, ${colors.depth} 0%, transparent 60%)`
          }}
        />
        <div className="absolute inset-0 bg-black/10 backdrop-blur-xl" />
      </div>

      {/* Shimmer Sutil de Textura */}
      {!isLoaded && (
        <div className="absolute inset-0 z-[1] overflow-hidden opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" 
               style={{ width: '200%' }} />
        </div>
      )}

      {/* Imagem Principal com Revelação de Filtro */}
      <img 
        src={error ? "https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&w=400" : mainSrc} 
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={`relative z-[2] w-full h-full object-cover transition-all duration-[2500ms] cubic-bezier(0.23, 1, 0.32, 1) ${
          isLoaded 
            ? 'opacity-100 scale-100 blur-0 brightness-100 saturate-100' 
            : 'opacity-0 scale-110 blur-2xl brightness-125 saturate-50'
        }`}
      />

      {/* Ícone de Carregamento Solene */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <Icons.Cross className="w-8 h-8 opacity-20 text-gold animate-spin-slow" />
        </div>
      )}
      
      {/* Vinheta de Profundidade Artística */}
      <div className="absolute inset-0 z-[3] pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/70 opacity-60 group-hover/sacred:opacity-40 transition-opacity duration-1000" />
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite linear;
        }
        @keyframes drift-slow {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(5%, 5%) rotate(5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes drift-reverse {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-5%, -5%) rotate(-5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .animate-drift-slow {
          animation: drift-slow 12s ease-in-out infinite;
        }
        .animate-drift-reverse {
          animation: drift-reverse 15s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default memo(SacredImage);
