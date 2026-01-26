
import React, { useState, useEffect, useContext, useMemo, memo } from 'react';
import { Icons } from '../constants';
import { 
  CIC_PARTS, 
  CIC_STRUCTURE, 
  getParagraphsForChapter, 
  getParagraphLocal,
  searchCatechismLocal 
} from '../services/catechismLocal';
import { CatechismParagraph } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';

const ParagraphItem = memo(({ p, fontSize, onInvestigate }: { 
  p: CatechismParagraph, 
  fontSize: number, 
  onInvestigate: (p: CatechismParagraph) => void 
}) => (
  <article 
    className="parchment dark:bg-stone-900/40 p-8 md:p-12 rounded-[3rem] shadow-xl border-l-[16px] border-gold transition-all duration-500 group relative overflow-hidden mb-10"
    style={{ fontSize: `${fontSize}rem` }}
  >
     <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="px-6 py-2 bg-stone-900 text-gold rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-lg">
            § {p.number}
          </div>
          <span className="text-[10px] text-stone-400 font-serif italic">{p.context}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onInvestigate(p)}
            className="flex items-center gap-2 px-6 py-2.5 bg-sacred text-white hover:bg-stone-900 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 group/ai"
          >
             <Icons.Search className="w-3.5 h-3.5 group-hover/ai:rotate-12 transition-transform" /> 
             Investigação Teológica
          </button>
          <ActionButtons itemId={`cic_${p.number}`} type="catechism" title={`CIC §${p.number}`} content={p.content} />
        </div>
     </header>

     <p className="font-serif text-stone-800 dark:text-stone-100 leading-relaxed tracking-tight text-justify first-letter:text-5xl first-letter:font-serif first-letter:text-sacred first-letter:mr-2 first-letter:float-left">
        {p.content}
     </p>

     <footer className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800/50 flex justify-between items-center opacity-30 group-hover:opacity-100 transition-opacity">
        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-400">Catechismus Catholicae Ecclesiae</span>
        <Icons.Book className="w-4 h-4 text-gold" />
     </footer>
  </article>
));

const Catechism: React.FC<{ onDeepDive: (topic: string) => void }> = ({ onDeepDive }) => {
  const [viewMode, setViewMode] = useState<'index' | 'reading'>('index');
  const [selectedPart, setSelectedPart] = useState(CIC_PARTS[0]);
  const [paragraphs, setParagraphs] = useState<CatechismParagraph[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fontSize, setFontSize] = useState(1.1);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;
    setLoading(true);
    const results = searchCatechismLocal(searchTerm);
    if (results.length > 0) {
      setParagraphs(results);
      setViewMode('reading');
    } else {
      alert("Nenhum parágrafo encontrado na base offline.");
    }
    setLoading(false);
  };

  const loadChapter = (part: any, section: any, chapter: string) => {
    setLoading(true);
    setSelectedPart(part);
    const data = getParagraphsForChapter(part.id, section.title, chapter);
    setParagraphs(data);
    setViewMode('reading');
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const IndexView = () => (
    <div className="space-y-16 animate-in fade-in duration-1000 pb-40">
       <header className="text-center space-y-8 pt-10 px-4">
          <div className="flex justify-center">
            <div className="p-8 bg-stone-900 rounded-[3rem] shadow-sacred border-4 border-gold/30">
               <Icons.Cross className="w-16 h-16 text-gold" />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">Codex Fidei</h2>
            <p className="text-stone-400 italic text-2xl md:text-3xl max-w-3xl mx-auto leading-relaxed">"O depósito sagrado da fé confiado à Igreja."</p>
          </div>
          
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-10 group relative px-2">
             <Icons.Search className="absolute left-10 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-gold transition-colors z-10" />
             <input 
              type="text" 
              placeholder="Número do § ou tema..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-20 pr-32 py-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] outline-none focus:ring-16 focus:ring-gold/5 focus:border-gold transition-all text-2xl font-serif italic shadow-2xl dark:text-white"
            />
            <button type="submit" className="absolute right-8 top-1/2 -translate-y-1/2 px-10 py-3 bg-gold text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Abrir</button>
          </form>
       </header>

       <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto px-4">
          {CIC_PARTS.map(part => (
            <div key={part.id} className="bg-white dark:bg-stone-900 rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-xl overflow-hidden group">
               <div className={`p-10 ${part.color} text-white space-y-2`}>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Parte {part.id}</span>
                  <h3 className="text-3xl font-serif font-bold">{part.title}</h3>
               </div>
               <div className="p-8 space-y-6">
                  {CIC_STRUCTURE[part.id]?.map((sec: any) => (
                    <div key={sec.id} className="space-y-4">
                       <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-400 border-b border-stone-50 dark:border-stone-800 pb-2">{sec.title}</h4>
                       <div className="flex flex-wrap gap-2">
                          {sec.chapters.map((chap: string) => (
                            <button 
                              key={chap}
                              onClick={() => loadChapter(part, sec, chap)}
                              className="px-6 py-2 bg-stone-50 dark:bg-stone-800 hover:bg-gold hover:text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              Cap. {chap}
                            </button>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          ))}
       </div>
    </div>
  );

  const ReadingView = () => (
    <div className="space-y-10 animate-in fade-in duration-700 pb-48">
      <nav className="sticky top-4 z-[200] bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-full border border-stone-200 dark:border-white/10 shadow-2xl p-3 flex items-center justify-between mx-4">
         <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('index')} className="p-3 bg-stone-900 text-gold rounded-full hover:bg-gold hover:text-stone-900 transition-all shadow-lg">
               <Icons.ArrowDown className="w-5 h-5 rotate-90" />
            </button>
            <div className="hidden md:flex items-center bg-stone-50 dark:bg-stone-800 rounded-full px-5 py-2">
               <span className="text-[10px] font-black uppercase text-gold">Catechismus Romanus</span>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-stone-400">A</span>
               <input type="range" min="0.8" max="2" step="0.1" value={fontSize} onChange={e => setFontSize(parseFloat(e.target.value))} className="w-32 h-1 accent-gold" />
               <span className="text-sm font-black text-stone-400">A</span>
            </div>
         </div>
      </nav>

      <header className="bg-stone-900 p-12 md:p-24 rounded-[4rem] md:rounded-[5rem] shadow-4xl border-t-[16px] border-gold text-center relative overflow-hidden mx-4">
         <div className="absolute top-0 right-0 p-16 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-[10s]">
            <Icons.Cross className="w-80 h-80 text-gold" />
         </div>
         <div className="relative z-10 space-y-6">
            <span className="text-[10px] md:text-[14px] font-black uppercase tracking-[1em] text-gold/60">Depositum Fidei</span>
            <h2 className="text-4xl md:text-7xl font-serif font-bold text-white tracking-tighter leading-none">{selectedPart.title}</h2>
            <div className="h-px w-32 bg-gold/20 mx-auto mt-10" />
         </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-8 px-4 md:px-0 min-h-[60vh]">
        {paragraphs.map(p => (
          <ParagraphItem 
            key={p.number} 
            p={p} 
            fontSize={fontSize} 
            onInvestigate={(item) => onDeepDive(`Realize um cruzamento teológico profundo para o parágrafo ${item.number} do Catecismo da Igreja Católica que diz: "${item.content}". Busque referências na Bíblia, Magistério e Santos.`)} 
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto page-enter overflow-x-hidden">
      {viewMode === 'index' ? <IndexView /> : <ReadingView />}
    </div>
  );
};

export default Catechism;
