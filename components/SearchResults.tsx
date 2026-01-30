
import React from 'react';
import { Icons } from '../constants';

interface SearchResultItem {
  source_type: string;
  title: string;
  snippet: string;
  ref_id: string;
  relevance: number;
}

interface SearchResultsProps {
  results: SearchResultItem[];
  onSelect: (item: SearchResultItem) => void;
  query: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelect, query }) => {
  if (results.length === 0) return null;

  return (
    <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 px-4">
        <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800" />
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">
          Resultados no Vault ({results.length})
        </span>
        <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800" />
      </div>

      <div className="grid gap-4">
        {results.map((item, index) => {
          const isBible = item.source_type.toLowerCase() === 'bíblia';
          const isCatechism = item.source_type.toLowerCase() === 'catecismo';
          
          return (
            <button
              key={`${item.ref_id}-${index}`}
              onClick={() => onSelect(item)}
              className="w-full text-left group bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] p-8 hover:border-gold hover:shadow-2xl transition-all relative overflow-hidden"
            >
              {/* Indicador Lateral de Fonte */}
              <div className={`absolute left-0 top-8 bottom-8 w-1.5 rounded-r-full transition-all group-hover:w-3 ${isBible ? 'bg-emerald-500' : isCatechism ? 'bg-sacred' : 'bg-gold'}`} />
              
              <div className="space-y-4">
                <header className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isBible ? 'text-emerald-600' : isCatechism ? 'text-sacred' : 'text-gold'}`}>
                      {item.source_type}
                    </span>
                    <h4 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-none">
                      {item.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-stone-50 dark:bg-stone-800 rounded-full border border-stone-100 dark:border-stone-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                    <span className="text-[8px] font-black text-stone-400 uppercase">Relevância {Math.round(item.relevance * 100)}%</span>
                  </div>
                </header>

                <p className="text-lg font-serif italic text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3">
                  "{item.snippet}"
                </p>

                <footer className="pt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gold flex items-center gap-2">
                    <Icons.ArrowDown className="w-3 h-3 -rotate-90" /> Abrir no Scriptuarium
                  </span>
                  <Icons.Feather className="w-4 h-4 text-stone-200" />
                </footer>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;
