
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Icons } from '../constants';
import { universalSearch } from '../services/gemini';
import { searchSacredVaultFromCloud } from '../services/supabase';
import { UniversalSearchResult, AppRoute } from '../types';
import { LangContext } from '../App';
import SearchResults from './SearchResults';

interface CommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
  onSearchSelection: (topic: string) => void;
}

const CommandCenter: React.FC<CommandCenterProps> = ({ isOpen, onClose, onNavigate, onSearchSelection }) => {
  const { lang } = useContext(LangContext);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UniversalSearchResult[]>([]);
  const [cloudResults, setCloudResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : (window as any).dispatchEvent(new CustomEvent('open-omnisearch'));
      }
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 3) {
      setResults([]);
      setCloudResults([]);
      return;
    }
    setLoading(true);
    try {
      const [aiRes, sqlRes] = await Promise.allSettled([
        universalSearch(val, lang),
        searchSacredVaultFromCloud(val)
      ]);

      if (aiRes.status === 'fulfilled') setResults(aiRes.value);
      if (sqlRes.status === 'fulfilled' && sqlRes.value) setCloudResults(sqlRes.value);
      
    } catch (e) {
      console.error("Search failure:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (topic: string) => {
    onSearchSelection(topic);
    onClose();
    setQuery('');
    setResults([]);
    setCloudResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center p-4 pt-[10vh] md:pt-[15vh]">
      <div className="absolute inset-0 bg-[#0c0a09]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl bg-[#fdfcf8] dark:bg-stone-900 rounded-[3rem] shadow-4xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
        <div className="p-8 border-b border-stone-100 dark:border-stone-800 flex items-center gap-6 bg-white/50 dark:bg-stone-950/50 backdrop-blur-md">
          <Icons.Search className="w-8 h-8 text-gold" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Pesquisar Verdades Eternas..."
            className="flex-1 bg-transparent border-none outline-none text-2xl font-serif italic text-stone-900 dark:text-white placeholder-stone-400"
          />
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-inner">
             <span className="text-[10px] font-black text-stone-400">ESC</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {loading ? (
            <div className="py-24 text-center space-y-6">
               <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto shadow-sacred" />
               <p className="text-xl font-serif italic text-stone-400">Consultando o Depósito da Fé...</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* RESULTADOS SQL (FONTES AUTORITATIVAS) */}
              {cloudResults.length > 0 && (
                <SearchResults 
                  results={cloudResults} 
                  query={query} 
                  onSelect={(item) => handleSelect(item.title)} 
                />
              )}

              {/* RESULTADOS IA (SÍNTESE) */}
              {results.length > 0 && (
                <div className="space-y-6">
                   <div className="flex items-center gap-4 px-4">
                      <div className="h-px flex-1 bg-gold/10" />
                      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gold">Symphonia IA • Síntese</span>
                      <div className="h-px flex-1 bg-gold/10" />
                   </div>
                   <div className="grid gap-3">
                      {results.map((res) => (
                        <button
                          key={res.id}
                          onClick={() => handleSelect(res.title)}
                          className="w-full text-left p-6 rounded-[2rem] bg-stone-900 text-white hover:bg-gold hover:text-stone-900 transition-all flex gap-5 group border border-white/5"
                        >
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-stone-900/10">
                            <Icons.Feather className="w-5 h-5 text-gold group-hover:text-stone-900" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">{res.type}</span>
                            <h4 className="text-xl font-serif font-bold truncate">{res.title}</h4>
                            <p className="text-xs opacity-60 italic line-clamp-1 group-hover:opacity-100">{res.snippet}</p>
                          </div>
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {query.length >= 3 && results.length === 0 && cloudResults.length === 0 && (
                <div className="py-24 text-center opacity-40">
                   <Icons.Cross className="w-16 h-16 mx-auto mb-6 text-stone-300" />
                   <p className="text-2xl font-serif italic text-stone-500">Nenhum registro encontrado para "{query}"</p>
                </div>
              )}

              {query.length < 3 && (
                <div className="py-12 px-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-400 mb-8 border-b border-stone-100 dark:border-stone-800 pb-4">Navegação Rápida</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { name: 'Bíblia', route: AppRoute.BIBLE, icon: Icons.Book, desc: 'Scriptuarium' },
                      { name: 'Catecismo', route: AppRoute.CATECHISM, icon: Icons.Cross, desc: 'Codex Fidei' },
                      { name: 'Liturgia', route: AppRoute.DAILY_LITURGY, icon: Icons.History, desc: 'Lumen Diei' },
                      { name: 'Estudo IA', route: AppRoute.STUDY_MODE, icon: Icons.Search, desc: 'Colloquium' }
                    ].map((item) => (
                      <button
                        key={item.name}
                        onClick={() => { onNavigate(item.route); onClose(); }}
                        className="flex items-center gap-5 p-6 rounded-[2rem] bg-white dark:bg-stone-800/50 hover:border-gold border border-stone-100 dark:border-stone-700 transition-all shadow-sm hover:shadow-xl"
                      >
                        <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl">
                          <item.icon className="w-5 h-5 text-gold" />
                        </div>
                        <div className="text-left">
                          <span className="block text-sm font-black uppercase tracking-widest text-stone-900 dark:text-white">{item.name}</span>
                          <span className="text-[10px] font-serif italic text-stone-400">{item.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
           <div className="flex items-center gap-6">
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-stone-300 rounded-full" /> Selecionar</span>
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-stone-300 rounded-full" /> Fechar (ESC)</span>
           </div>
           <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Conexão Segura
           </span>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
