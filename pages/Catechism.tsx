
import React, { useState, useContext, useMemo, useCallback } from 'react';
import { Icons } from '../constants';
import { CIC_PARTS, CIC_STRUCTURE } from '../services/catechismLocal';
import { fetchCatechismRange } from '../services/gemini';
import { CatechismParagraph } from '../types';
import ActionButtons from '../components/ActionButtons';
import { offlineStorage } from '../services/offlineStorage';

const Catechism: React.FC<{ onDeepDive: (topic: string) => void }> = ({ onDeepDive }) => {
  const [jumpPara, setJumpPara] = useState('');
  const [selectedRange, setSelectedRange] = useState<{start: number, end: number} | null>(null);
  const [paragraphs, setParagraphs] = useState<CatechismParagraph[]>([]);
  const [loading, setLoading] = useState(false);
  const [fontSize, setFontSize] = useState(1.15);

  const loadRange = useCallback(async (start: number, end: number) => {
    setLoading(true);
    setParagraphs([]);
    try {
      // Tentar Offline primeiro
      let data: CatechismParagraph[] = [];
      for(let i = start; i <= end; i++) {
        const p = await offlineStorage.getContent(`cic-${i}`);
        if(p) data.push(p);
      }

      if (data.length < (end - start + 1)) {
        const fetched = await fetchCatechismRange(start, end);
        for(const p of fetched) {
          await offlineStorage.saveContent(`cic-${p.number}`, 'catechism', `CIC §${p.number}`, p);
        }
        data = fetched;
      }
      setParagraphs(data);
      setSelectedRange({start, end});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpPara);
    if (isNaN(num) || num < 1 || num > 2865) return;
    loadRange(num, Math.min(2865, num + 5));
    setJumpPara('');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-48 animate-in fade-in duration-700 px-2">
      <header className="text-center space-y-8 pt-10">
        <div className="flex justify-center">
           <Icons.Cross className="w-16 h-16 text-gold p-4 bg-stone-900 rounded-full shadow-sacred border border-gold/30" />
        </div>
        <h2 className="text-5xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter">Codex Fidei</h2>
        <p className="text-stone-400 italic text-2xl font-serif">O Catecismo da Igreja Católica (CIC)</p>

        <form onSubmit={handleJump} className="max-w-md mx-auto relative pt-6 px-4">
           <div className="absolute left-10 top-1/2 -translate-y-1/2 text-gold font-bold">§</div>
           <input 
             type="number" 
             value={jumpPara}
             onChange={e => setJumpPara(e.target.value)}
             placeholder="Ir para parágrafo..." 
             className="w-full pl-12 pr-6 py-5 bg-white dark:bg-stone-800 border-2 border-gold/20 rounded-[2rem] outline-none shadow-lg font-bold dark:text-white"
           />
        </form>
      </header>

      {!selectedRange && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 max-w-6xl mx-auto">
           {CIC_PARTS.map(part => (
             <div key={part.id} className="bg-white dark:bg-stone-950 rounded-[3.5rem] border border-stone-100 dark:border-stone-800 shadow-2xl overflow-hidden group">
                <div className={`p-10 ${part.color} text-white space-y-2`}>
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70">Parte {part.id}</span>
                   <h3 className="text-3xl font-serif font-bold tracking-tight">{part.title}</h3>
                </div>
                <div className="p-8 space-y-4">
                   {CIC_STRUCTURE[part.id]?.map((sec: any) => (
                     <div key={sec.id}>
                        <h4 className="text-[10px] font-black uppercase text-stone-400 mb-2 px-4">{sec.title}</h4>
                        {sec.chapters.map((chap: any) => (
                          <button key={chap.name} onClick={() => loadRange(chap.start, Math.min(chap.end, chap.start + 5))} className="w-full text-left px-6 py-4 rounded-2xl hover:bg-gold/10 transition-all flex justify-between items-center group/btn">
                             <span className="text-sm font-serif font-bold dark:text-stone-300 group-hover/btn:text-gold">{chap.name}</span>
                             <span className="text-[10px] font-black text-stone-300">§ {chap.start}</span>
                          </button>
                        ))}
                     </div>
                   ))}
                </div>
             </div>
           ))}
        </div>
      )}

      {selectedRange && (
        <section className="max-w-4xl mx-auto px-6 space-y-12">
           <button onClick={() => setSelectedRange(null)} className="text-[10px] font-black uppercase text-stone-400 hover:text-gold flex items-center gap-2">
             <Icons.ArrowDown className="w-4 h-4 rotate-90" /> Voltar ao Índice
           </button>

           {loading ? (
             <div className="py-24 text-center space-y-6">
                <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="font-serif italic text-stone-400 text-xl">Extraindo parágrafos do Magistério...</p>
             </div>
           ) : (
             <div className="space-y-8" style={{ fontSize: `${fontSize}rem` }}>
                {paragraphs.map(p => (
                  <article key={p.number} className="p-10 rounded-[3rem] border-2 border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl transition-all hover:border-gold">
                     <header className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-stone-900 text-gold flex items-center justify-center font-black text-lg">§ {p.number}</div>
                           <span className="text-[10px] font-black uppercase text-stone-400">{p.context}</span>
                        </div>
                        <button onClick={() => onDeepDive(`Exegese teológica do parágrafo ${p.number} do CIC`)} className="px-4 py-2 bg-sacred text-white rounded-full text-[8px] font-black uppercase tracking-widest">Análise IA</button>
                     </header>
                     <p className="font-serif text-stone-800 dark:text-stone-200 text-justify leading-relaxed">{p.content}</p>
                  </article>
                ))}
                <button onClick={() => loadRange(selectedRange.end + 1, Math.min(2865, selectedRange.end + 5))} className="w-full py-6 bg-stone-100 dark:bg-stone-800 rounded-3xl font-black uppercase text-[10px] tracking-widest text-stone-400 hover:text-gold transition-all">Ver próximos parágrafos</button>
             </div>
           )}
        </section>
      )}
    </div>
  );
};

export default Catechism;
