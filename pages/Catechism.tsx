
import React, { useState, useEffect, useContext, useRef, memo } from 'react';
import { Icons } from '../constants';
import { getIntelligentStudy } from '../services/gemini';
import { getLocalHierarchy, getLocalParagraph, getLocalParagraphsBySection } from '../services/catechismLocal';
import { CatechismParagraph, CatechismHierarchy, AppRoute } from '../types';
import ActionButtons from '../components/ActionButtons';
import { LangContext } from '../App';

const ROOT_PARTS = [
  { id: 'part_1', title: 'A Profissão da Fé', subtitle: 'O Credo', color: 'bg-sacred', icon: Icons.Cross },
  { id: 'part_2', title: 'A Celebração do Mistério', subtitle: 'Os Sacramentos', color: 'bg-gold', icon: Icons.History },
  { id: 'part_3', title: 'A Vida em Cristo', subtitle: 'Os Mandamentos', color: 'bg-emerald-600', icon: Icons.Users },
  { id: 'part_4', title: 'A Oração Cristã', subtitle: 'O Pai-Nosso', color: 'bg-blue-600', icon: Icons.Feather }
];

const ParagraphItem = memo(({ p, fontSize, isActive, onSelect, onDeepDive }: { 
  p: CatechismParagraph, 
  fontSize: number, 
  isActive: boolean, 
  onSelect: (n: number) => void, 
  onDeepDive: (t: string) => void 
}) => (
  <article 
    id={`p-${p.number}`}
    data-paragraph={p.number}
    onClick={() => onSelect(p.number)}
    className={`parchment dark:bg-stone-900 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border-l-[12px] transition-all duration-500 group cursor-pointer ${isActive ? 'border-gold ring-4 ring-gold/10 scale-[1.01]' : 'border-stone-200 dark:border-stone-800 hover:border-gold'}`}
    style={{ fontSize: `${fontSize}rem` }}
  >
     <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isActive ? 'bg-gold text-stone-900 shadow-lg' : 'bg-stone-900 text-gold'}`}>Parágrafo {p.number}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); onDeepDive(`Cruzamento teológico para o parágrafo ${p.number} do Catecismo: ${p.content}`); }}
            className="flex items-center gap-2 px-6 py-2 bg-sacred text-white hover:bg-gold hover:text-stone-900 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-md group-hover:scale-105"
          >
             <Icons.Search className="w-3.5 h-3.5" /> Investigação Scholar (IA)
          </button>
        </div>
        <ActionButtons itemId={`cic_${p.number}`} type="catechism" title={`CIC ${p.number}`} content={p.content} />
     </header>
     <p className="font-serif text-stone-800 dark:text-stone-100 leading-relaxed tracking-tight text-justify italic">
        "{p.content}"
     </p>
     <footer className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
        <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Catechismus Catholicae Ecclesiae</span>
        <div className="flex gap-2">
           <Icons.Book className="w-4 h-4 text-gold" />
           <Icons.Cross className="w-4 h-4 text-sacred" />
        </div>
     </footer>
  </article>
));

const Catechism: React.FC<{ onDeepDive: (topic: string) => void }> = ({ onDeepDive }) => {
  const [viewMode, setViewMode] = useState<'index' | 'browse' | 'reading'>('index');
  const [currentPath, setCurrentPath] = useState<CatechismHierarchy[]>([]);
  const [hierarchy, setHierarchy] = useState<CatechismHierarchy[]>([]);
  const [paragraphs, setParagraphs] = useState<CatechismParagraph[]>([]);
  const [activeParagraph, setActiveParagraph] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
  const [fontSize, setFontSize] = useState(1.2);

  const loadHierarchy = (parentId: string, title: string) => {
    setLoading(true);
    setViewMode('browse');
    const data = getLocalHierarchy(parentId);
    setHierarchy(data);
    setCurrentPath(prev => [...prev, { id: parentId, title, level: 'section' }]);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadParagraphs = (item: CatechismHierarchy) => {
    setLoading(true);
    setViewMode('reading');
    const data = getLocalParagraphsBySection(item.id);
    setParagraphs(data);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJump = () => {
    if (!jumpInput || isNaN(Number(jumpInput))) return;
    const num = parseInt(jumpInput);
    setLoading(true);
    const local = getLocalParagraph(num);
    if (local) {
      setParagraphs(local);
      setActiveParagraph(num);
      setViewMode('reading');
    } else {
      alert("Parágrafo fora da base local. Em versões futuras, todo o texto estará offline.");
    }
    setLoading(false);
  };

  const reset = () => {
    setViewMode('index');
    setCurrentPath([]);
    setParagraphs([]);
    setHierarchy([]);
  };

  const IndexView = () => (
    <div className="space-y-16 animate-in fade-in duration-700 pb-32">
       <header className="text-center space-y-8 pt-10">
          <div className="flex justify-center">
            <div className="p-8 bg-stone-900 rounded-[3rem] shadow-sacred border-4 border-gold/30">
               <Icons.Cross className="w-16 h-16 text-gold" />
            </div>
          </div>
          <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">Catecismo (Codex Fidei)</h2>
          <p className="text-stone-400 italic text-2xl md:text-3xl max-w-3xl mx-auto">"O depósito seguro da Fé transmitida pelos Apóstolos."</p>
          
          <div className="max-w-xl mx-auto pt-10 group relative px-4">
             <Icons.Search className="absolute left-10 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-gold transition-colors z-10" />
             <input 
              type="number" 
              placeholder="Ir para o parágrafo (Ex: 1324)" 
              value={jumpInput}
              onChange={e => setJumpInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleJump()}
              className="w-full pl-20 pr-32 py-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] outline-none focus:border-gold transition-all text-2xl font-serif italic shadow-2xl dark:text-white"
            />
            <button 
              onClick={handleJump}
              className="absolute right-8 top-1/2 -translate-y-1/2 px-8 py-3 bg-gold text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
            >
              Abrir
            </button>
          </div>
       </header>

       <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto px-4">
          {ROOT_PARTS.map(part => (
            <button 
              key={part.id} 
              onClick={() => loadHierarchy(part.id, part.title)}
              className="group relative h-72 rounded-[3.5rem] overflow-hidden bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-xl hover:-translate-y-2 transition-all p-10 text-left"
            >
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <part.icon className="w-48 h-48" />
               </div>
               <div className="relative z-10 space-y-6">
                  <span className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${part.color}`}>Parte {part.id.split('_')[1]}</span>
                  <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight group-hover:text-gold transition-colors">{part.title}</h3>
                  <p className="text-lg font-serif italic text-stone-400">{part.subtitle}</p>
               </div>
            </button>
          ))}
       </div>
    </div>
  );

  const BrowseView = () => (
    <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700 px-4 pb-32 pt-10">
       <nav className="flex items-center gap-4 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl p-4 rounded-full border border-stone-200 dark:border-white/10 sticky top-2 z-[150] shadow-2xl">
          <button onClick={() => currentPath.length > 1 ? reset() : setViewMode('index')} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-full hover:text-gold transition-all">
            <Icons.ArrowDown className="w-5 h-5 rotate-90" />
          </button>
          <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
             <button onClick={reset} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-gold whitespace-nowrap">Catecismo</button>
             {currentPath.map((p, i) => (
               <React.Fragment key={p.id}>
                 <div className="w-1 h-1 rounded-full bg-stone-300" />
                 <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${i === currentPath.length-1 ? 'text-gold' : 'text-stone-400'}`}>{p.title}</span>
               </React.Fragment>
             ))}
          </div>
       </nav>

       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {hierarchy.map(item => (
            <button 
              key={item.id} 
              onClick={() => item.level === 'article' ? loadParagraphs(item) : loadHierarchy(item.id, item.title)}
              className="p-10 rounded-[3rem] bg-white dark:bg-stone-900 border-4 border-stone-100 dark:border-stone-800 hover:border-gold transition-all text-left flex flex-col justify-between group relative overflow-hidden h-64 shadow-lg"
            >
               <div className="space-y-3 relative z-10">
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gold/60">{item.level}</span>
                  <h4 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight group-hover:text-sacred transition-colors">{item.title}</h4>
               </div>
               <div className="mt-8 flex justify-end">
                  <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl group-hover:bg-gold transition-all shadow-md">
                    <Icons.ArrowDown className="w-5 h-5 -rotate-90 text-stone-300 group-hover:text-stone-900" />
                  </div>
               </div>
            </button>
          ))}
       </div>
    </div>
  );

  const ReadingView = () => (
    <div className="space-y-12 animate-in fade-in duration-700 pb-48">
      <nav className="sticky top-4 z-[200] bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-full border border-stone-200 dark:border-white/10 shadow-2xl p-3 flex items-center justify-between mx-4">
         <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('browse')} className="p-3 bg-stone-900 text-gold rounded-full hover:bg-gold hover:text-stone-900 transition-all shadow-lg">
               <Icons.ArrowDown className="w-5 h-5 rotate-90" />
            </button>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-stone-50 dark:bg-stone-800 rounded-full border border-stone-100 dark:border-stone-700">
               <span className="text-[9px] font-black uppercase text-gold">Navegando no Codex</span>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-stone-400">A</span>
               <input 
                 type="range" min="1" max="2.5" step="0.1" value={fontSize} 
                 onChange={e => setFontSize(parseFloat(e.target.value))}
                 className="w-24 md:w-32 h-1 accent-sacred"
               />
               <span className="text-sm font-black text-stone-400">A</span>
            </div>
         </div>
      </nav>

      <header className="bg-white dark:bg-stone-900 p-12 md:p-24 rounded-[4rem] md:rounded-[5rem] shadow-xl border-t-[16px] md:border-t-[20px] border-sacred text-center relative overflow-hidden mx-4">
         <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none"><Icons.Cross className="w-80 h-80" /></div>
         <div className="relative z-10 space-y-6">
            <span className="text-[10px] md:text-[14px] font-black uppercase tracking-[1em] text-gold">Catechismus Ecclesiæ</span>
            <h2 className="text-4xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">{currentPath[currentPath.length-1]?.title || "Parágrafos Selecionados"}</h2>
            <div className="h-px w-32 bg-gold/20 mx-auto mt-10" />
         </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-10 px-4 md:px-0">
        {paragraphs.map(p => (
          <ParagraphItem 
            key={p.number} 
            p={p} 
            fontSize={fontSize} 
            isActive={activeParagraph === p.number} 
            onSelect={(n) => setActiveParagraph(n)} 
            onDeepDive={onDeepDive} 
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto page-enter overflow-x-hidden">
      {viewMode === 'index' && <IndexView />}
      {viewMode === 'browse' && <BrowseView />}
      {viewMode === 'reading' && <ReadingView />}
    </div>
  );
};

export default Catechism;
