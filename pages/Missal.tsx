
import React, { useState } from 'react';
import { Icons } from '../constants';
import { getMissalLocal } from '../services/missalLocal';
import ActionButtons from '../components/ActionButtons';

const Missal: React.FC = () => {
  const [view, setView] = useState<'bilingual' | 'vernacular'>('bilingual');
  const [isImmersive, setIsImmersive] = useState(false);
  const [fontSize, setFontSize] = useState(1.1);
  const data = getMissalLocal();

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      {/* MODO IMERSIVO OVERLAY */}
      {isImmersive && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-[#fdfcf8] dark:bg-[#0c0a09] p-6 md:p-20 animate-in fade-in duration-500">
           <div className="max-w-4xl mx-auto space-y-16 pb-40">
              <header className="text-center space-y-4 pt-10">
                 <span className="text-[10px] font-black uppercase text-gold tracking-[0.5em]">Lectio Divina Misale</span>
                 <h1 className="text-5xl md:text-8xl font-serif font-bold tracking-tight dark:text-gold">Mysterium Fidei</h1>
                 <div className="h-px w-20 bg-gold/30 mx-auto" />
              </header>
              <div className="space-y-20 font-serif leading-[1.8] text-stone-800 dark:text-stone-300" style={{ fontSize: `${fontSize * 1.2}rem` }}>
                 {data.map((section, idx) => (
                   <div key={idx} className="space-y-12">
                      <div className="text-center">
                        <h2 className="text-3xl md:text-4xl text-sacred border-b border-sacred/10 pb-4 inline-block">{section.title}</h2>
                        <p className="text-stone-400 text-sm italic mt-2">{section.subtitle}</p>
                      </div>
                      {section.parts.map((p, pIdx) => (
                        <div key={pIdx} className="space-y-8">
                           <div className="flex items-center gap-4 text-sacred">
                              <Icons.Cross className="w-4 h-4" />
                              <h3 className="text-xl font-bold uppercase tracking-widest">{p.name}</h3>
                           </div>
                           {p.rubric && <p className="text-sm italic opacity-60 bg-stone-100 dark:bg-stone-900/50 p-4 rounded-xl border-l-4 border-sacred/30">{p.rubric}</p>}
                           
                           <div className={`grid gap-12 ${view === 'bilingual' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                              {view === 'bilingual' && (
                                <div className="space-y-4">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-gold/60">Latine</span>
                                   <p className="italic opacity-90 whitespace-pre-wrap">{p.latin}</p>
                                </div>
                              )}
                              <div className="space-y-4">
                                 {view === 'bilingual' && <span className="text-[9px] font-black uppercase tracking-widest text-sacred/60">Português</span>}
                                 <p className="whitespace-pre-wrap font-bold">{p.vernacular}</p>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                 ))}
              </div>
           </div>
           <button onClick={() => setIsImmersive(false)} className="fixed bottom-10 right-10 p-5 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-full shadow-4xl hover:scale-110 active:scale-95 transition-all z-[1100] border border-white/10"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
        </div>
      )}

      <header className="text-center space-y-6 pt-6">
        <div className="flex justify-center mb-4">
           <div className="p-4 bg-stone-900 rounded-3xl shadow-sacred border-2 border-gold/30">
              <Icons.Book className="w-10 h-10 text-gold" />
           </div>
        </div>
        <div className="inline-block px-4 py-1 bg-sacred/10 text-sacred rounded-full text-[8px] font-black uppercase tracking-widest border border-sacred/20 mb-4">
          Ordo Missae • Edição Típica III
        </div>
        <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Missale Romanum</h2>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-6">
           <div className="bg-stone-100 dark:bg-stone-800/50 backdrop-blur-md p-1.5 rounded-[2rem] flex shadow-inner border border-stone-200/50 dark:border-white/5">
              <button onClick={() => setView('bilingual')} className={`px-8 py-2.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${view === 'bilingual' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-gold shadow-md scale-105' : 'text-stone-400 hover:text-stone-600'}`}>Bilíngue</button>
              <button onClick={() => setView('vernacular')} className={`px-8 py-2.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${view === 'vernacular' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-gold shadow-md scale-105' : 'text-stone-400 hover:text-stone-600'}`}>Português</button>
           </div>
           <button onClick={() => setIsImmersive(true)} className="px-8 py-3.5 bg-stone-900 text-gold rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-sacred hover:text-white transition-all active:scale-95 border border-gold/20">Modo Sanctum</button>
        </div>
      </header>

      <div className="space-y-24" style={{ fontSize: `${fontSize}rem` }}>
        {data.map((section, sIdx) => (
          <div key={sIdx} className="space-y-12">
            <header className="flex flex-col items-center gap-4">
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-sacred to-transparent" />
              <h3 className="text-3xl md:text-5xl font-serif font-bold text-sacred tracking-tight text-center uppercase">{section.title}</h3>
              <p className="text-stone-400 font-serif italic text-xl">{section.subtitle}</p>
            </header>
            
            <div className="space-y-16">
              {section.parts.map((part, pIdx) => (
                <div key={pIdx} className="space-y-8 animate-in slide-in-from-bottom-4" style={{ animationDelay: `${pIdx * 100}ms` }}>
                  <div className="flex flex-col md:flex-row justify-between items-center md:items-end border-b border-stone-100 dark:border-stone-800 pb-4 gap-4">
                    <div className="space-y-1 text-center md:text-left">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold/60">Partis {pIdx + 1}</span>
                       <h4 className="text-xl md:text-2xl font-serif font-bold text-stone-800 dark:text-stone-100">{part.name}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <ActionButtons itemId={`missal_${sIdx}_${pIdx}`} type="liturgy" title={part.name} content={part.vernacular} />
                    </div>
                  </div>

                  {part.rubric && (
                    <div className="bg-stone-50 dark:bg-stone-900/40 p-6 rounded-[2rem] border-l-[6px] border-sacred/40 shadow-inner">
                       <p className="text-sm text-sacred italic font-serif leading-relaxed">
                          <span className="font-black uppercase text-[10px] mr-2 not-italic opacity-60">Rubrica:</span>
                          {part.rubric}
                       </p>
                    </div>
                  )}
                  
                  <div className={`grid gap-10 lg:gap-16 ${view === 'bilingual' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                    {view === 'bilingual' && (
                      <div className="space-y-6 relative">
                        <div className="flex items-center gap-3 mb-2 opacity-40">
                           <span className="text-[9px] font-black uppercase tracking-widest text-gold">Latine</span>
                           <div className="h-px flex-1 bg-gold/20" />
                        </div>
                        <div className="p-8 md:p-12 bg-[#fcf8e8] dark:bg-stone-900/50 rounded-[3rem] border border-gold/10 italic font-serif text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed shadow-sm">
                          {part.latin}
                        </div>
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-gold/20 rounded-full" />
                      </div>
                    )}
                    
                    <div className="space-y-6">
                      {view === 'bilingual' && (
                        <div className="flex items-center gap-3 mb-2 opacity-40">
                           <span className="text-[9px] font-black uppercase tracking-widest text-sacred">Português</span>
                           <div className="h-px flex-1 bg-sacred/20" />
                        </div>
                      )}
                      <div className="p-8 md:p-12 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl font-serif text-stone-900 dark:text-stone-100 whitespace-pre-wrap leading-relaxed group hover:border-gold/30 transition-colors">
                        <p className={view === 'bilingual' ? 'font-bold' : ''}>
                          {part.vernacular}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FLOATING CONTROLS */}
      <div className="fixed bottom-24 right-6 md:right-10 z-[300] flex flex-col gap-3">
          <button 
            onClick={() => setFontSize(f => Math.min(f + 0.1, 1.6))} 
            className="p-5 bg-white/90 dark:bg-stone-800/90 backdrop-blur-xl rounded-full shadow-4xl border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-gold transition-all hover:scale-110 active:scale-90"
            title="Aumentar Fonte"
          >
            <span className="text-xl font-black">A+</span>
          </button>
          <button 
            onClick={() => setFontSize(f => Math.max(f - 0.1, 0.8))} 
            className="p-5 bg-white/90 dark:bg-stone-800/90 backdrop-blur-xl rounded-full shadow-4xl border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-gold transition-all hover:scale-110 active:scale-90"
            title="Diminuir Fonte"
          >
            <span className="text-lg font-black">A-</span>
          </button>
       </div>

       <footer className="text-center pt-20 pb-40 opacity-20">
          <Icons.Cross className="w-12 h-12 mx-auto mb-6" />
          <p className="text-[11px] font-black uppercase tracking-[1em]">Lex Orandi • Lex Credendi</p>
       </footer>
    </div>
  );
};

export default Missal;
