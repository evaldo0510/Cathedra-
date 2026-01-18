
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
  
  // Paleta litúrgica estendida com variações de profundidade para o placeholder
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
    
    // Se uma cor dominante for fornecida, usamos ela como base.
    // Caso contrário, usamos a paleta litúrgica.
    return {
      base: dominantColor || palette.primary,
      accent: dominantColor ? `${dominantColor}cc` : palette.accent,
      depth: dominantColor ? `${dominantColor}66` : palette.depth
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
      // Pequeno delay para garantir que o navegador está pronto para renderizar sem jank
      setTimeout(() => setIsLoaded(true), 50);
    };
    img.onerror = () => { 
      setError(true); 
      setIsLoaded(true); 
    };
  }, [mainSrc, src]);

  return (
    <div className={`relative bg-[#0c0a09] overflow-hidden ${className} group/sacred`}>
      {/* Sacrum Nebula Placeholder - Gradiente dinâmico e animado */}
      <div 
        className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
        style={{ backgroundColor: colors.base }}
      >
        {/* Camadas de drift sutil para simular movimento de névoa ou luz de velas */}
        <div 
          className="absolute inset-[-50%] opacity-60 animate-drift-slow"
          style={{
            background: `radial-gradient(circle at 40% 40%, ${colors.accent} 0%, transparent 70%)`
          }}
        />
        <div 
          className="absolute inset-[-50%] opacity-40 animate-drift-reverse"
          style={{
            background: `radial-gradient(circle at 60% 60%, ${colors.depth} 0%, transparent 70%)`
          }}
        />
        
        {/* Overlay de granulação sutil para textura de papel/pergaminho */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none" />
        
        {/* Filtro de desfoque para suavizar os gradientes do placeholder */}
        <div className="absolute inset-0 backdrop-blur-2xl" />
      </div>

      {/* Shimmer Sutil de Carregamento */}
      {!isLoaded && (
        <div className="absolute inset-0 z-[1] overflow-hidden opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full animate-shimmer-fast" 
               style={{ width: '200%' }} />
        </div>
      )}

      {/* Imagem Principal - Transição Profissional */}
      <img 
        src={error ? "https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&w=400" : mainSrc} 
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={`relative z-[2] w-full h-full object-cover transition-all duration-[2000ms] cubic-bezier(0.23, 1, 0.32, 1) ${
          isLoaded 
            ? 'opacity-100 scale-100 blur-0 brightness-100 saturate-100' 
            : 'opacity-0 scale-105 blur-md brightness-110 saturate-50'
        }`}
      />

      {/* Indicador de Carregamento Sacro */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <Icons.Cross className="w-10 h-10 opacity-20 text-gold animate-spin-slow" />
        </div>
      )}
      
      {/* Vinheta Artística de Profundidade */}
      <div className="absolute inset-0 z-[3] pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/60 opacity-50 group-hover/sacred:opacity-30 transition-opacity duration-1000" />
      
      <style>{`
        @keyframes shimmer-fast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer-fast {
          animation: shimmer-fast 2s infinite linear;
        }
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
        .animate-drift-slow {
          animation: drift-slow 15s ease-in-out infinite;
        }
        .animate-drift-reverse {
          animation: drift-reverse 18s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default memo(SacredImage);
