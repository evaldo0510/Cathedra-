
import React from 'react';
import { Icons } from '../constants';
import { LearningTrack } from '../types';
import SacredImage from './SacredImage';

interface TrailCardProps {
  track: LearningTrack;
  onClick: (track: LearningTrack) => void;
}

const TrailCard: React.FC<TrailCardProps> = ({ track, onClick }) => {
  return (
    <article 
      onClick={() => onClick(track)}
      className="group relative h-[450px] rounded-[3.5rem] overflow-hidden shadow-2xl cursor-pointer transition-all duration-700 hover:-translate-y-2 hover:shadow-sacred/20 border border-stone-100 dark:border-white/5"
    >
      {/* Imagem de Fundo com Efeito de Profundidade */}
      <div className="absolute inset-0 z-0">
        <SacredImage 
          src={track.image || ""} 
          alt={track.title} 
          className="w-full h-full group-hover:scale-110 transition-transform duration-[10s]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/40 to-transparent opacity-90" />
      </div>

      {/* Conteúdo do Card */}
      <div className="relative z-10 h-full p-10 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[8px] font-black uppercase tracking-[0.2em] text-gold shadow-xl">
            Nível {track.level}
          </span>
          <div className="p-3 bg-stone-900/50 backdrop-blur-sm rounded-2xl border border-gold/20 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-75 group-hover:scale-100">
            <Icons.Feather className="w-5 h-5 text-gold" />
          </div>
        </div>

        <div className="space-y-4">
          <header>
            <div className="flex items-center gap-3 mb-2 opacity-60">
               <div className="h-px w-6 bg-gold" />
               <span className="text-[9px] font-black uppercase tracking-widest text-white">Curadoria Symphonia</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight leading-none group-hover:text-gold transition-colors">
              {track.title}
            </h3>
          </header>
          
          <p className="text-stone-300 font-serif italic text-lg leading-relaxed line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity">
            {track.description}
          </p>

          <footer className="pt-4 flex items-center justify-between">
            <button className="flex items-center gap-4 px-8 py-4 bg-gold text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all hover:bg-white active:scale-95">
              <span>Iniciar Trilha</span>
              <Icons.ArrowDown className="w-4 h-4 -rotate-90" />
            </button>
            
            <div className="flex -space-x-2 opacity-40 group-hover:opacity-100 transition-opacity">
               {[...Array(3)].map((_, i) => (
                 <div key={i} className="w-6 h-6 rounded-full border-2 border-stone-900 bg-stone-800 flex items-center justify-center text-[8px] font-bold text-stone-400">
                   {String.fromCharCode(65 + i)}
                 </div>
               ))}
            </div>
          </footer>
        </div>
      </div>

      {/* Brilho de Hover */}
      <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </article>
  );
};

export default TrailCard;
