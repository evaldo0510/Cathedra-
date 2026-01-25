
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Icons } from '../constants';
import { universalSearch } from '../services/gemini';
import { UniversalSearchResult, AppRoute } from '../types';
import { LangContext } from '../App';

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
      return;
    }
    setLoading(true);
    try {
      const res = await universalSearch(val, lang);
      setResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center p-4 pt-[10vh] md:pt-[15vh]">
      <div className="absolute inset-0 bg-[#0c0a09]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-4xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center gap-4">
          <Icons.Search className="w-6 h-6 text-gold" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar em todo o santuário... (Ex: Graça, CIC 121, João 3)"
            className="flex-1 bg-transparent border-none outline-none text-xl font-serif italic text-stone-900 dark:text-white placeholder-stone-400"
          />
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
             <span className="text-[10px] font-black text-stone-400">ESC</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
          {loading ? (
            <div className="p-12 text-center space-y-4">
               <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
               <p className="text-sm font-serif italic text-stone-400">Consultando os arquivos sagrados...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((res) => (
                <button
                  key={res.id}
                  onClick={() => { onSearchSelection(res.title); onClose(); }}
                  className="w-full text-left p-4 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-all flex gap-4 group"
                >
                  <div className="w-10 h-10 bg-stone-100 dark:bg-stone-700 rounded-xl flex items-center justify-center flex-shrink-0 text-[10px] font-black text-gold border border-gold/10 group-hover:scale-110 transition-transform">
                    {res.source.code}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{res.type}</span>
                      <span className="text-[9px] font-black text-gold/40 group-hover:text-gold transition-colors">Abrir</span>
                    </div>
                    <h4 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100 truncate">{res.title}</h4>
                    <p className="text-xs text-stone-400 italic line-clamp-1">{res.snippet}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 3 ? (
            <div className="p-12 text-center opacity-40">
               <Icons.Cross className="w-12 h-12 mx-auto mb-4 text-stone-300" />
               <p className="text-lg font-serif italic text-stone-500">Nenhum registro encontrado para "{query}"</p>
            </div>
          ) : (
            <div className="p-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4 px-2">Sugestões de Navegação</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Bíblia', route: AppRoute.BIBLE, icon: Icons.Book },
                  { name: 'Catecismo', route: AppRoute.CATECHISM, icon: Icons.Cross },
                  { name: 'Liturgia', route: AppRoute.DAILY_LITURGY, icon: Icons.History },
                  { name: 'Estudo IA', route: AppRoute.STUDY_MODE, icon: Icons.Search }
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => { onNavigate(item.route); onClose(); }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 hover:bg-gold/10 hover:text-gold transition-all border border-transparent hover:border-gold/20"
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-widest">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
           <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><Icons.ArrowDown className="w-3 h-3" /> Navegar</span>
              <span className="flex items-center gap-1.5"><Icons.Globe className="w-3 h-3" /> Selecionar</span>
           </div>
           <span>Omnisearch v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
