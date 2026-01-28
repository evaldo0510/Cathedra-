
import React, { useState } from 'react';
import { Icons } from '../constants';
import { getMissalLocal } from '../services/missalLocal';
import VoicePlayer from '../components/VoicePlayer';
import ActionButtons from '../components/ActionButtons';

const Missal: React.FC = () => {
  const [view, setView] = useState<'bilingual' | 'vernacular'>('bilingual');
  const [isImmersive, setIsImmersive] = useState(false);
  const [fontSize, setFontSize] = useState(1.15);
  const data = getMissalLocal();

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      {/* MODO IMERSIVO OVERLAY */}
      {isImmersive && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-[#fdfcf8] dark:bg-[#0c0a09] p-6 md:p-20 animate-in fade-in duration-500">
           <div className="max-w-3xl mx-auto space-y-16 pb-40">
              <header className="text-center space-y-4">
                 <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight dark:text-gold">Ordo Missae</h1>
                 <div className="h-px w-20 bg-gold/30 mx-auto" />
              </header>
              <div className="space-y-20 font-serif leading-[1.8] text-stone-800 dark:text-stone-300" style={{ fontSize: `${fontSize * 1.2}rem` }}>
                 {data.map((section, idx) => (
                   <div key={idx} className="space-y-10">
                      <h2 className="text-3xl text-sacred border-b border-sacred/10 pb-4">{section.title}</h2>
                      {section.parts.map((p, pIdx) => (
                        <div key={pIdx} className="space-y-6">
                           <p className="text-sm italic opacity-60">{p.rubric}</p>
                           <p className="whitespace-pre-wrap">{view === 'bilingual' ? `${p.latin}\n\n${p.vernacular}` : p.vernacular}</p>
                        </div>
                      ))}
                   </div>
                 ))}
              </div>
           </div>
           <button onClick={() => setIsImmersive(false)} className="fixed bottom-10 right-10 p-5 bg-gold text-stone-900 rounded-full shadow-4xl hover:scale-110 transition-all"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
        </div>
      )}

      <header className="text-center space-y-6 pt-6">
        <div className="inline-block px-4 py-1 bg-sacred/10 text-sacred rounded-full text-[8px] font-black uppercase tracking-widest border border-sacred/20">
          Lex Orandi: 3ª Edição Típica (Local)
        </div>
        <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Missale Romanum</h2>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-6">
           <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl flex shadow-inner">
              <button onClick={() => setView('bilingual')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${view === 'bilingual' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-gold shadow-sm' : 'text-stone-400'}`}>Bilíngue</button>
              <button onClick={() => setView('vernacular')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${view === 'vernacular' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-gold shadow-sm' : 'text-stone-400'}`}>Português</button>
           </div>
           <button onClick={() => setIsImmersive(true)} className="px-6 py-3 bg-stone-900 text-gold rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Modo Imersivo</button>
        </div>
      </header>

      <div className="space-y-16" style={{ fontSize: `${fontSize}rem` }}>
        {data.map((section, sIdx) => (
          <div key={sIdx} className="space-y-10">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-serif font-bold text-sacred whitespace-nowrap">{section.title}</h3>
              <div className="h-px w-full bg-sacred/10" />
            </div>
            
            {section.parts.map((part, pIdx) => (
              <div key={pIdx} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-200">{part.name}</h4>
                  <div className="flex items-center gap-2">
                    <VoicePlayer text={part.vernacular} />
                    <ActionButtons itemId={`missal_${sIdx}_${pIdx}`} type="liturgy" title={part.name} content={part.vernacular} />
                  </div>
                </div>
                {part.rubric && <p className="text-xs text-sacred italic border-l-2 border-sacred/20 pl-4 py-1">{part.rubric}</p>}
                
                <div className={`grid gap-6 ${view === 'bilingual' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                  {view === 'bilingual' && (
                    <div className="p-8 bg-[#fcf8e8] dark:bg-stone-900/50 rounded-3xl border border-gold/10 italic font-serif text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                      {part.latin}
                    </div>
                  )}
                  <div className="p-8 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm font-serif text-stone-900 dark:text-stone-100 whitespace-pre-wrap">
                    {part.vernacular}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="fixed bottom-24 right-4 md:right-8 z-[300] flex flex-col gap-2">
          <button onClick={() => setFontSize(f => Math.min(f + 0.1, 1.8))} className="p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-full shadow-4xl border border-stone-100 text-stone-500 hover:text-gold transition-all"><span className="text-xl font-black">A+</span></button>
          <button onClick={() => setFontSize(f => Math.max(f - 0.1, 0.8))} className="p-4 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-full shadow-4xl border border-stone-100 text-stone-500 hover:text-gold transition-all"><span className="text-lg font-black">A-</span></button>
       </div>
    </div>
  );
};

export default Missal;
