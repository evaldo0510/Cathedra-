
import React, { useState, useContext, useCallback, useEffect } from 'react';
import { Icons } from '../constants';
import { CIC_PARTS, CIC_STRUCTURE, catechismService } from '../services/catechismLocal';
import { CatechismParagraph } from '../types';
import ActionButtons from '../components/ActionButtons';
import ReflectionBox from '../components/ReflectionBox';

const Catechism: React.FC<{ onDeepDive: (topic: string) => void, initialPara?: number }> = ({ onDeepDive, initialPara }) => {
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedRange, setSelectedRange] = useState<{start: number, end: number, title: string} | null>(null);
  const [paragraphs, setParagraphs] = useState<CatechismParagraph[]>([]);
  const [loading, setLoading] = useState(false);
  const [jumpPara, setJumpPara] = useState('');
  const [fontSize, setFontSize] = useState(1.1);
  const [activePara, setActivePara] = useState<number | null>(null);
  const [isIndexOpen, setIsIndexOpen] = useState(false);

  const loadRange = useCallback(async (start: number, end: number, title: string) => {
    setLoading(true);
    setParagraphs([]); 
    setIsIndexOpen(false);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 80));
      const data = await catechismService.getParagraphs(start, end);
      setParagraphs(data);
      setSelectedRange({start, end, title});
      
      const mainContent = document.getElementById('main-content');
      if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { 
      console.error("Erro ao carregar catecismo:", e); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    if (initialPara) {
      loadRange(initialPara, Math.min(2865, initialPara + 5), `Parágrafo ${initialPara}`);
    }
  }, [initialPara, loadRange]);

  const togglePart = (id: string) => {
    setExpandedParts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpPara);
    if (isNaN(num) || num < 1 || num > 2865) return;
    loadRange(num, Math.min(2865, num + 5), `Pesquisa: §${num}`);
    setJumpPara('');
  };

  const CatechismIndex = () => (
    <div className="flex flex-col h-full bg-pro-soft border-r border-pro-border w-full lg:w-80 overflow-hidden">
      <header className="p-6 border-b border-pro-border space-y-4 bg-pro-main">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-pro-muted">Codex Fidei</h3>
        <form onSubmit={handleJump} className="relative">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pro-muted" />
          <input 
            type="number" 
            placeholder="Ir para parágrafo..."
            value={jumpPara}
            onChange={e => setJumpPara(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-pro-soft border border-pro-border rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-gold/20"
          />
        </form>
      </header>
      
      <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
        {CIC_PARTS.map(part => {
          const isPartExpanded = expandedParts.has(part.id);
          return (
            <div key={part.id} className="space-y-1">
              <button 
                onClick={() => togglePart(part.id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${isPartExpanded ? 'bg-pro-accent text-white shadow-md' : 'text-pro-muted hover:bg-pro-border/50 hover:text-pro-accent'}`}
              >
                <span className="font-serif font-bold text-xs leading-tight line-clamp-1">{part.title}</span>
                <Icons.ArrowDown className={`w-3 h-3 transition-transform ${isPartExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isPartExpanded && (
                <div className="ml-2 mt-2 space-y-1 border-l border-pro-border pl-3 animate-in fade-in duration-300">
                  {CIC_STRUCTURE[part.id]?.map(sec => {
                    const isSecExpanded = expandedSections.has(sec.id);
                    return (
                      <div key={sec.id} className="space-y-1">
                        <button 
                          onClick={() => toggleSection(sec.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${isSecExpanded ? 'text-sacred' : 'text-pro-muted hover:text-pro-accent'}`}
                        >
                          <span className="flex-1 pr-2 truncate">{sec.title}</span>
                        </button>
                        {isSecExpanded && (
                          <div className="grid gap-1 mt-1 pl-2">
                            {sec.chapters.map((chap: any) => (
                              <button 
                                key={chap.name}
                                onClick={() => loadRange(chap.start, chap.end, chap.name)}
                                className={`w-full text-left p-2.5 rounded-lg text-[10px] font-serif italic transition-all ${selectedRange?.title === chap.name ? 'bg-white text-pro-accent shadow-sm border border-pro-border' : 'text-pro-muted hover:text-pro-accent'}`}
                              >
                                {chap.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen -mt-8 -mx-4 md:-mx-12 bg-pro-main">
      <aside className="hidden lg:block sticky top-20 h-[calc(100vh-80px)] overflow-hidden">
        <CatechismIndex />
      </aside>

      <main className="flex-1 pb-48 pt-10 px-4 md:px-12 animate-in fade-in duration-700 relative">
        <div className="max-w-3xl mx-auto">
          {!selectedRange && !loading && (
            <div className="text-center space-y-10 py-32">
               <div className="flex justify-center">
                  <div className="p-8 bg-pro-accent rounded-3xl shadow-sacred border border-white/10 group hover:rotate-3 transition-transform">
                     <Icons.Cross className="w-16 h-16 text-gold" />
                  </div>
               </div>
               <div className="space-y-4">
                 <h2 className="text-4xl md:text-6xl font-serif font-bold text-pro-accent tracking-tight leading-none">Codex Fidei</h2>
                 <p className="text-pro-muted italic text-xl font-serif">O Depósito da Fé em sua estrutura orgânica.</p>
               </div>
               <button onClick={() => setIsIndexOpen(true)} className="px-10 py-5 bg-pro-accent text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-gold hover:text-pro-accent transition-all">Explorar Sumário</button>
            </div>
          )}

          {loading ? (
            <div className="py-40 text-center space-y-6">
              <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-serif italic text-pro-muted text-xl">Consultando a Tradição...</p>
            </div>
          ) : paragraphs.length > 0 && (
            <article className="space-y-12">
              <header className="text-center space-y-3 mb-20">
                 <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">Depositum Fidei</span>
                 <h2 className="text-3xl md:text-5xl font-serif font-bold text-pro-accent leading-none">{selectedRange?.title}</h2>
                 <div className="h-px w-16 bg-pro-border mx-auto" />
              </header>

              <div className="space-y-4" style={{ fontSize: `${fontSize}rem` }}>
                {paragraphs.map(p => (
                  <div 
                    key={p.number} 
                    onClick={() => setActivePara(p.number)}
                    className={`p-10 rounded-3xl border transition-all duration-300 bg-pro-main group relative ${activePara === p.number ? 'border-gold shadow-2xl ring-4 ring-gold/5' : 'border-pro-border hover:border-pro-muted'}`}
                  >
                    <header className="flex justify-between items-center mb-8 pb-4 border-b border-pro-soft">
                      <div className="flex items-center gap-6">
                         <div className="w-12 h-12 rounded-xl bg-pro-accent text-gold flex items-center justify-center font-black text-lg shadow-lg">§ {p.number}</div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-pro-muted">{p.context}</span>
                      </div>
                      <ActionButtons itemId={`pro_cic_${p.number}`} type="catechism" title={`CIC §${p.number}`} content={p.content} />
                    </header>
                    <p className="font-serif text-pro-accent leading-[1.8] text-justify indent-10 selection:bg-gold/30">
                      {p.content}
                    </p>
                    <div className="pt-8 flex justify-end gap-4">
                      <button 
                        onClick={() => onDeepDive(`Análise Doutrinária: Parágrafo ${p.number}`)}
                        className="text-[10px] font-black uppercase text-pro-muted hover:text-sacred transition-colors flex items-center gap-2"
                      >
                        <Icons.Search className="w-3 h-3" /> Investigação IA
                      </button>
                    </div>

                    {activePara === p.number && (
                      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <ReflectionBox 
                          itemId={`cic_${p.number}`} 
                          title={`Catecismo §${p.number}`} 
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>
      </main>
    </div>
  );
};

export default Catechism;
