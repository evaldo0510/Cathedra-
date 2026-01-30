
import React, { useState, useEffect, useMemo } from 'react';
import { Icons, Logo } from '../constants';
import { CIC_PARTS, CIC_STRUCTURE, catechismService } from '../services/catechismLocal';
import { CatechismParagraph } from '../types';

interface CatechismModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFullRead?: (para: number) => void;
}

type Step = 'parts' | 'sections' | 'reading';

const CatechismModal: React.FC<CatechismModalProps> = ({ isOpen, onClose, onFullRead }) => {
  const [step, setStep] = useState<Step>('parts');
  const [jumpPara, setJumpPara] = useState('');
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [paragraphs, setParagraphs] = useState<CatechismParagraph[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('parts');
        setJumpPara('');
        setSelectedPart(null);
        setParagraphs([]);
      }, 300);
    }
  }, [isOpen]);

  const handleJump = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseInt(jumpPara);
    if (isNaN(num) || num < 1 || num > 2865) return;
    
    setStep('reading');
    setLoading(true);
    try {
      const data = await catechismService.getParagraphs(num, Math.min(2865, num + 10));
      setParagraphs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePartSelect = (part: any) => {
    setSelectedPart(part);
    setStep('sections');
  };

  const handleRangeSelect = async (start: number, end: number) => {
    setStep('reading');
    setLoading(true);
    try {
      const data = await catechismService.getParagraphs(start, end);
      setParagraphs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10">
      <div 
        className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-5xl bg-[#fdfcf8] dark:bg-stone-900 rounded-[3rem] shadow-4xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <header className="p-6 md:p-8 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-white/50 dark:bg-stone-950/20">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-sacred rounded-xl shadow-lg">
              <Icons.Cross className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-none">Catecismo (CIC)</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mt-1">Codex Fidei • Suma Doutrinária</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <form onSubmit={handleJump} className="relative hidden sm:block">
                <input 
                  type="number" 
                  placeholder="Ir para §..."
                  value={jumpPara}
                  onChange={(e) => setJumpPara(e.target.value)}
                  className="w-32 pl-4 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-black outline-none focus:border-gold transition-all"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gold"><Icons.Search className="w-4 h-4" /></button>
             </form>
             <button 
                onClick={onClose}
                className="p-3 bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-sacred rounded-2xl transition-all active:scale-90"
              >
                <Icons.Cross className="w-5 h-5 rotate-45" />
              </button>
          </div>
        </header>

        {/* Breadcrumbs */}
        {step !== 'parts' && (
          <nav className="px-8 py-4 bg-stone-50/30 dark:bg-stone-800/30 border-b border-stone-100 dark:border-stone-800 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest overflow-x-auto no-scrollbar">
            <button onClick={() => setStep('parts')} className="text-stone-400 hover:text-gold transition-colors">Sumário</button>
            <Icons.ArrowDown className="w-3 h-3 -rotate-90 text-stone-300" />
            <button onClick={() => setStep('sections')} className={`transition-colors truncate max-w-[150px] ${step === 'sections' ? 'text-gold' : 'text-stone-400 hover:text-gold'}`}>
              {selectedPart?.title}
            </button>
            {step === 'reading' && (
              <>
                <Icons.ArrowDown className="w-3 h-3 -rotate-90 text-stone-300" />
                <span className="text-gold">Leitura</span>
              </>
            )}
          </nav>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
          
          {step === 'parts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
              {CIC_PARTS.map(part => (
                <button 
                  key={part.id}
                  onClick={() => handlePartSelect(part)}
                  className="p-10 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-[3rem] text-left hover:border-gold hover:shadow-xl transition-all group relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-2 h-full ${part.color}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Parte {part.id}</span>
                  <h4 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-gold transition-colors leading-tight">{part.title}</h4>
                  <p className="text-[9px] text-stone-400 font-bold uppercase mt-4 tracking-[0.2em]">Parágrafos {part.range[0]} - {part.range[1]}</p>
                </button>
              ))}
            </div>
          )}

          {step === 'sections' && selectedPart && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
               {CIC_STRUCTURE[selectedPart.id]?.map((sec: any) => (
                 <div key={sec.id} className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-sacred border-l-4 border-sacred/20 pl-4">{sec.title}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {sec.chapters.map((chap: any, idx: number) => (
                         <button 
                           key={idx}
                           onClick={() => handleRangeSelect(chap.start, chap.end)}
                           className="p-6 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-3xl text-left hover:border-gold hover:shadow-lg transition-all"
                         >
                            <h5 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-200">{chap.name}</h5>
                            <p className="text-[9px] text-stone-400 font-bold uppercase mt-1">§ {chap.start} - {chap.end}</p>
                         </button>
                       ))}
                    </div>
                 </div>
               ))}
            </div>
          )}

          {step === 'reading' && (
            <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-500 pb-10">
              {loading ? (
                <div className="py-24 text-center space-y-6">
                  <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xl font-serif italic text-stone-400">Consultando a Tradição viva...</p>
                </div>
              ) : (
                <div className="space-y-12">
                   {paragraphs.map(p => (
                     <article key={p.number} className="space-y-6 border-b border-stone-50 dark:border-stone-800 pb-10 last:border-0">
                        <header className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-stone-900 text-gold rounded-xl flex items-center justify-center font-black text-xs">§ {p.number}</div>
                           <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{p.context}</span>
                        </header>
                        <p className="font-serif text-xl md:text-2xl leading-relaxed text-justify text-stone-800 dark:text-stone-200 indent-10">
                          {p.content}
                        </p>
                        <div className="flex justify-end">
                           <button 
                             onClick={() => onFullRead?.(p.number)}
                             className="text-[9px] font-black uppercase tracking-widest text-gold hover:text-sacred transition-colors"
                           >
                             Ver Detalhes • Investigação IA
                           </button>
                        </div>
                     </article>
                   ))}
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="p-5 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Logo className="w-6 h-6 grayscale opacity-20" />
             <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Cathedra Digital Sanctuarium</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CatechismModal;
