
import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../constants';
import { getSaintsList, searchSaint } from '../services/gemini';
import { Saint } from '../types';
import SacredImage from '../components/SacredImage';

const LOCAL_SAINTS: Saint[] = [
  {
    name: "Virgem Maria",
    feastDay: "8 de Setembro",
    patronage: "Mãe de Deus e da Igreja",
    biography: "A cheia de graça, cujo 'Fiat' mudou a história da humanidade. É o modelo perfeito de santidade e entrega a Deus.",
    image: "https://images.unsplash.com/photo-1548610762-656391d1ad4d?w=800&q=80",
    quote: "Fazei tudo o que Ele vos disser."
  },
  {
    name: "São José",
    feastDay: "19 de Março",
    patronage: "Patrono Universal da Igreja",
    biography: "O justo guardião do Redentor e esposo da Virgem Maria. Exemplo de silêncio orante e trabalho santificado.",
    image: "https://images.unsplash.com/photo-1594905103927-de6aacc5c9d8?w=800&q=80",
    quote: "A obediência é o caminho do justo."
  },
  {
    name: "São Paulo Apóstolo",
    feastDay: "29 de Junho",
    patronage: "Apóstolo das Nações",
    biography: "De perseguidor a maior missionário do cristianismo, suas epístolas formam a base da teologia cristã ocidental.",
    image: "https://images.unsplash.com/photo-1543158021-00212008304f?w=800&q=80",
    quote: "Já não sou eu quem vive, é Cristo que vive em mim."
  }
];

const CATEGORIES = ['Todos', 'Apóstolos', 'Mártires', 'Doutores', 'Virgens', 'Papas', 'Místicos'];

// Componente Saints: Gerencia a visualização e busca de hagiografias
const Saints: React.FC = () => {
  const [saints, setSaints] = useState<Saint[]>(LOCAL_SAINTS);
  const [loading, setLoading] = useState(true);
  const [searchingAI, setSearchingAI] = useState(false);
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const [filter, setFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getSaintsList();
        if (data && data.length > 0) {
          // Merge local com remoto evitando duplicatas
          setSaints(prev => {
            const remoteNames = new Set(data.filter(s => s && s.name).map(s => s.name?.toLowerCase() || ""));
            const filteredLocal = prev.filter(s => s && s.name && !remoteNames.has(s.name.toLowerCase()));
            return [...data.filter(s => s && s.name), ...filteredLocal];
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filteredSaints = useMemo(() => {
    const searchFilter = filter?.toLowerCase() || "";
    const categoryFilter = activeCategory?.toLowerCase() || "todos";
    
    return (saints || []).filter(s => {
      if (!s) return false;
      const name = s.name?.toLowerCase() || "";
      const patronage = s.patronage?.toLowerCase() || "";
      const matchesText = name.includes(searchFilter) || patronage.includes(searchFilter);
      const matchesCat = categoryFilter === 'todos' || patronage.includes(categoryFilter);
      return matchesText && matchesCat;
    });
  }, [saints, filter, activeCategory]);

  const handleDeepSearch = async () => {
    if (!filter.trim()) return;
    setSearchingAI(true);
    try {
        const result = await searchSaint(filter);
        if (result && result.name) {
            setSaints(prev => {
                if (prev.some(s => s && s.name?.toLowerCase() === result.name?.toLowerCase())) return prev;
                return [result, ...prev];
            });
            setSelectedSaint(result);
        }
    } catch (err) {
        console.error(err);
    } finally {
        setSearchingAI(false);
    }
  };

  return (
    <div className="space-y-12 page-enter pb-32">
      <header className="text-center space-y-8 max-w-4xl mx-auto">
        <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Sanctorum</h2>
        <p className="text-sacred dark:text-stone-400 font-serif italic text-2xl md:text-3xl">
          "A Nuvem de Testemunhas que intercede por nós."
        </p>
        
        <div className="relative group max-w-2xl mx-auto">
          <div className="absolute inset-0 bg-gold/10 blur-2xl rounded-full scale-110 opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex gap-3">
             <div className="relative flex-1">
                <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gold/50" />
                <input 
                    type="text" 
                    placeholder="Buscar nome ou patrocínio..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleDeepSearch()}
                    className="w-full pl-16 pr-12 py-6 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-[2rem] shadow-xl focus:border-gold outline-none font-serif italic text-xl transition-all dark:text-white"
                />
             </div>
             <button 
                onClick={handleDeepSearch}
                disabled={searchingAI || !filter}
                className="px-8 py-6 bg-[#1a1a1a] dark:bg-gold text-gold dark:text-stone-900 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-sacred hover:text-white transition-all active:scale-95 disabled:opacity-30"
             >
                {searchingAI ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Investigar IA"}
             </button>
          </div>
        </div>
      </header>

      <nav className="flex overflow-x-auto gap-3 no-scrollbar pb-6 justify-start md:justify-center px-4">
        {CATEGORIES.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap shadow-sm ${activeCategory === cat ? 'bg-sacred text-white border-sacred shadow-xl scale-105' : 'bg-white dark:bg-stone-900 text-stone-400 border-stone-100 dark:border-stone-800 hover:border-gold'}`}
          >
            {cat}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
        {filteredSaints.map((s, i) => (
          <article 
            key={i} 
            onClick={() => setSelectedSaint(s)}
            className="bg-white dark:bg-stone-900 rounded-[3rem] shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden cursor-pointer hover:-translate-y-2 transition-all duration-500 group flex flex-col animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="h-72 w-full relative overflow-hidden">
              <SacredImage src={s.image || ''} alt={s.name || "Santo"} className="w-full h-full group-hover:scale-110 transition-transform duration-1000" priority={false} />
            </div>
            <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold">{s.feastDay || 'Memória'}</span>
                <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">{s.name}</h3>
              </div>
              <div className="pt-4 border-t border-stone-50 dark:border-stone-800">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 group-hover:text-sacred transition-colors">{s.patronage || 'Fiel Testemunha'}</p>
              </div>
            </div>
          </article>
        ))}
        {loading && filteredSaints.length < 8 && [...Array(4)].map((_, i) => (
          <div key={i} className="h-96 bg-stone-50 dark:bg-stone-800/50 rounded-[3rem] animate-pulse border border-dashed border-stone-200" />
        ))}
      </div>

      {selectedSaint && (
        <div 
          className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop animate-fast-in" 
          onClick={() => setSelectedSaint(null)}
        >
          <div 
            className="bg-white dark:bg-stone-900 w-full max-w-4xl max-h-[90vh] rounded-[3.5rem] shadow-3xl overflow-hidden flex flex-col border border-stone-100 dark:border-stone-800 animate-modal-zoom"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-96 w-full relative">
              <SacredImage src={selectedSaint.image || ''} alt={selectedSaint.name} className="w-full h-full" priority={true} />
              <button 
                onClick={() => setSelectedSaint(null)}
                className="absolute top-8 right-8 p-4 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full transition-all active:scale-90"
              >
                <Icons.Cross className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <div className="p-12 md:p-16 flex-1 overflow-y-auto custom-scrollbar space-y-10">
              <header className="space-y-4">
                <span className="text-[12px] font-black uppercase tracking-[0.5em] text-gold">{selectedSaint.feastDay}</span>
                <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter">{selectedSaint.name}</h2>
                <p className="text-sacred dark:text-gold text-xl font-serif italic">{selectedSaint.patronage}</p>
              </header>

              <div className="space-y-8">
                <div className="bg-[#fcf8e8] dark:bg-stone-800/50 p-10 rounded-[3rem] border-l-8 border-gold shadow-sm">
                   <p className="text-2xl md:text-3xl font-serif italic text-stone-800 dark:text-stone-100 leading-relaxed">
                     "{selectedSaint.quote || 'Siga o caminho da santidade.'}"
                   </p>
                </div>
                
                <div className="prose dark:prose-invert max-w-none">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-6">Biografia & Missão</h4>
                  <p className="text-xl font-serif text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                    {selectedSaint.biography}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Saints;
