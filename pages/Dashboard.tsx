
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Icons, Logo } from '../constants';
import { getDailyBundle, universalSearch, fetchDailyVerse } from '../services/gemini';
import { AppRoute, User, UniversalSearchResult } from '../types';
import SacredImage from '../components/SacredImage';
import { LangContext } from '../App';

// Configuração dos Módulos "Originais" no Estilo Netflix
const FEATURED_MODULES = [
  { id: 'bible', label: 'Scriptura', route: AppRoute.BIBLE, img: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800', badge: 'Codex' },
  { id: 'liturgy', label: 'Lecionário', route: AppRoute.DAILY_LITURGY, img: 'https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800', badge: 'Hodie' },
  { id: 'aquinas', label: 'Angelicus', route: AppRoute.AQUINAS_OPERA, img: 'https://images.unsplash.com/photo-1532012197367-60134763a20a?q=80&w=800', badge: 'IA Pro' },
  { id: 'catechism', label: 'Codex Fidei', route: AppRoute.CATECHISM, img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800', badge: 'Doutrina' },
  { id: 'lectio', label: 'Lectio', route: AppRoute.LECTIO_DIVINA, img: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800', badge: 'Oratio' },
  { id: 'rosary', label: 'Rosárium', route: AppRoute.ROSARY, img: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=800', badge: 'Maria' },
  { id: 'confession', label: 'Poenitentia', route: AppRoute.POENITENTIA, img: 'https://images.unsplash.com/photo-1541093223450-087cc51b1c40?q=80&w=800', badge: 'Misericórdia' },
  { id: 'saints', label: 'Sanctorum', route: AppRoute.SAINTS, img: 'https://images.unsplash.com/photo-1594905103927-de6aacc5c9d8?q=80&w=800', badge: 'Vitas' },
  { id: 'magisterium', label: 'Magistério', route: AppRoute.MAGISTERIUM, img: 'https://images.unsplash.com/photo-1517134234033-d9263155700b?q=80&w=800', badge: 'Petrus' },
  { id: 'dogmas', label: 'Verdades', route: AppRoute.DOGMAS, img: 'https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=800', badge: 'Dogma' },
];

const Dashboard: React.FC<{ onSearch: (topic: string) => void; onNavigate: (route: AppRoute) => void; user: User | null }> = ({ onSearch, onNavigate, user }) => {
  const { lang, t } = useContext(LangContext);
  const [bundleData, setBundleData] = useState<any>(null);
  const [dailyVerse, setDailyVerse] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UniversalSearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const data = await getDailyBundle(lang);
      const verse = await fetchDailyVerse(lang);
      setBundleData(data);
      setDailyVerse(verse);
    };
    fetch();
  }, [lang]);

  const handleUniversalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoadingSearch(true);
    setIsSearching(true);
    try {
      const results = await universalSearch(searchQuery, lang);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const amount = dir === 'left' ? -400 : 400;
    carouselRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const getSourceStyle = (type: string) => {
    const styles: Record<string, string> = {
      verse: 'bg-sacred text-white',
      catechism: 'bg-gold text-stone-900',
      aquinas: 'bg-stone-900 text-gold',
      dogma: 'bg-emerald-600 text-white',
      magisterium: 'bg-blue-600 text-white',
      saint: 'bg-stone-100 text-stone-600'
    };
    return styles[type] || 'bg-stone-200';
  };

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-1000">
      
      {/* 1. HERO SPOTLIGHT */}
      {!isSearching && (
        <section className="relative h-[700px] md:h-[850px] -mt-16 mx-[-1rem] md:mx-[-4rem] lg:mx-[-6rem] overflow-hidden group">
          <div className="absolute inset-0 z-0">
            <SacredImage 
              src={dailyVerse?.imageUrl || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2000"} 
              alt="Destaque do Dia" 
              className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[20s] ease-out" 
              priority={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a09]/90 via-transparent to-transparent" />
          </div>

          <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 md:p-24 space-y-8 max-w-5xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold text-stone-900 rounded-lg shadow-xl">
                <Icons.Book className="w-5 h-5" />
              </div>
              <span className="text-white text-sm font-black uppercase tracking-[0.4em] drop-shadow-lg">Destaque do Reino</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-8xl lg:text-9xl font-serif font-bold text-white tracking-tighter leading-[0.85] drop-shadow-2xl">
                {dailyVerse?.verse.split(' ').slice(0, 3).join(' ')} <br/>
                <span className="text-gold">{dailyVerse?.verse.split(' ').slice(3, 6).join(' ')}</span>
              </h1>
              <p className="text-xl md:text-3xl text-white/80 font-serif italic leading-relaxed max-w-3xl drop-shadow-lg line-clamp-3">
                "{dailyVerse?.verse}"
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-6">
              <button 
                onClick={() => onNavigate(AppRoute.BIBLE)}
                className="px-14 py-6 bg-white text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[12px] shadow-2xl flex items-center gap-4 hover:bg-gold hover:scale-105 transition-all active:scale-95"
              >
                <div className="w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center font-bold text-[10px]">▶</div>
                Explorar Escritura
              </button>
              <button 
                onClick={() => onSearch(dailyVerse?.reference)}
                className="px-14 py-6 bg-white/10 backdrop-blur-2xl text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest text-[12px] flex items-center gap-4 hover:bg-white/20 hover:scale-105 transition-all active:scale-95"
              >
                <Icons.Feather className="w-5 h-5 text-gold" />
                Mais Informações
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. NAVEGAÇÃO ESTILO NETFLIX (CINERARIUM) */}
      {!isSearching && (
        <section className="relative -mt-24 md:-mt-48 z-20 space-y-4 px-4 md:px-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
              <div className="w-1.5 h-6 bg-gold rounded-full" />
              Cinerarium Mysterium
            </h3>
            <div className="flex gap-2">
              <button onClick={() => scrollCarousel('left')} className="p-2 bg-black/40 hover:bg-gold hover:text-stone-900 text-white rounded-full transition-all border border-white/10 backdrop-blur-md">
                <Icons.ArrowDown className="w-5 h-5 rotate-90" />
              </button>
              <button onClick={() => scrollCarousel('right')} className="p-2 bg-black/40 hover:bg-gold hover:text-stone-900 text-white rounded-full transition-all border border-white/10 backdrop-blur-md">
                <Icons.ArrowDown className="w-5 h-5 -rotate-90" />
              </button>
            </div>
          </div>

          <div 
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-8"
          >
            {FEATURED_MODULES.map((m) => (
              <button 
                key={m.id}
                onClick={() => onNavigate(m.route)}
                className="flex-shrink-0 w-44 md:w-64 aspect-[2/3] group relative rounded-2xl overflow-hidden shadow-2xl snap-start transition-all duration-500 hover:scale-110 hover:z-30 hover:ring-4 hover:ring-gold/50"
              >
                <SacredImage src={m.img} alt={m.label} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-4 left-4">
                  <span className="bg-gold text-stone-900 text-[8px] font-black uppercase px-2 py-1 rounded shadow-lg">{m.badge}</span>
                </div>
                <div className="absolute bottom-6 left-6 right-6 text-left">
                  <h4 className="text-white font-serif font-bold text-xl md:text-2xl leading-none tracking-tighter mb-2 group-hover:text-gold transition-colors">{m.label}</h4>
                  <div className="h-0.5 w-0 group-hover:w-full bg-gold transition-all duration-500" />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 3. SEARCH BAR */}
      <section className={`max-w-4xl mx-auto px-4 transition-all duration-1000 ${isSearching ? 'pt-8' : 'pt-12 relative z-10'}`}>
        <form onSubmit={handleUniversalSearch} className="relative group">
           <div className="absolute inset-0 bg-gold/20 blur-[100px] rounded-full scale-110 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
           <div className="relative flex items-center bg-white/95 dark:bg-stone-900/95 backdrop-blur-3xl rounded-[3rem] shadow-3xl border-2 border-stone-100 dark:border-stone-800 focus-within:border-gold transition-all overflow-hidden">
              <div className="pl-10 text-gold"><Icons.Search className="w-8 h-8" /></div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Busque o Depósito da Fé..."
                className="flex-1 px-8 py-9 bg-transparent outline-none font-serif text-3xl italic dark:text-white"
              />
              <div className="pr-6">
                 <button type="submit" className="px-12 py-5 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 transition-all">Omnis Search</button>
              </div>
           </div>
        </form>
      </section>

      {!isSearching && (
        <div className="space-y-20 px-4 md:px-0">
          {/* CATEGORY RAILS */}
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-stone-900 dark:text-white px-4 md:px-0 flex items-center gap-4">
              Devocionários & Piedade
              <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800" />
            </h3>
            <div className="flex gap-6 overflow-x-auto no-scrollbar px-4 md:px-0 pb-8 snap-x">
              {[
                { label: 'Rosárium', sub: 'Mistérios Meditados', route: AppRoute.ROSARY, icon: Icons.Star, img: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?w=800' },
                { label: 'Litaniæ', sub: 'Ladainhas Tradicionais', route: AppRoute.LITANIES, icon: Icons.Audio, img: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800' },
                { label: 'Via Crucis', sub: 'Caminho do Calvário', route: AppRoute.VIA_CRUCIS, icon: Icons.Cross, img: 'https://images.unsplash.com/photo-1543158021-00212008304f?w=800' },
                { label: 'Ordo Missæ', sub: 'Ordinário Bilíngue', route: AppRoute.ORDO_MISSAE, icon: Icons.Layout, img: 'https://images.unsplash.com/photo-1548610762-656391d1ad4d?w=800' }
              ].map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => onNavigate(item.route)}
                  className="flex-shrink-0 w-64 md:w-80 group snap-start text-left"
                >
                  <div className="aspect-video rounded-3xl overflow-hidden shadow-lg border border-stone-100 dark:border-stone-800 relative mb-4 bg-stone-100 dark:bg-stone-900">
                    <SacredImage src={item.img} alt={item.label} className="w-full h-full group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                       <p className="text-white text-xs font-serif italic mb-2 line-clamp-2">"Aprofunde sua fé neste módulo sagrado."</p>
                    </div>
                    <div className="absolute bottom-4 left-4 p-3 bg-white/10 backdrop-blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <item.icon className="w-5 h-5 text-gold" />
                    </div>
                  </div>
                  <h4 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-200 group-hover:text-gold transition-colors">{item.label}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{item.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* RANDOM GRACE FEATURE */}
          <section className="bg-stone-900 p-12 md:p-32 rounded-[6rem] text-white shadow-3xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20" />
             <div className="absolute -bottom-20 -right-20 w-full h-full bg-gold/5 blur-[150px] animate-pulse" />
             
             <div className="relative z-10 text-center space-y-12">
                <div className="inline-block p-6 bg-gold text-stone-900 rounded-[2rem] shadow-2xl rotate-6 group-hover:rotate-0 transition-transform duration-1000">
                   <Icons.Feather className="w-16 h-16" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-5xl md:text-8xl font-serif font-bold tracking-tighter">Graça do Momento</h3>
                  <p className="text-xl md:text-3xl font-serif italic text-white/60 max-w-2xl mx-auto leading-relaxed">
                     "Invoque o Espírito e receba o alimento que sua alma necessita agora."
                  </p>
                </div>
                <button 
                  onClick={() => onNavigate(AppRoute.STUDY_MODE)}
                  className="px-20 py-8 bg-gold text-stone-900 rounded-full font-black uppercase tracking-[0.6em] text-sm shadow-2xl hover:bg-white hover:scale-105 transition-all active:scale-95"
                >
                  Surpreenda-me
                </button>
             </div>
          </section>
        </div>
      )}

      {isSearching && (
        <section className="max-w-5xl mx-auto px-4 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
           {loadingSearch ? (
              <div className="py-32 text-center space-y-8">
                 <div className="w-20 h-20 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                 <p className="text-3xl font-serif italic text-stone-400">Varrendo a Biblioteca da Tradição...</p>
              </div>
           ) : (
              <div className="grid gap-8 pb-40">
                 {searchResults.map((res, i) => (
                   <button 
                    key={res.id} 
                    onClick={() => onSearch(res.title)}
                    className="w-full text-left bg-white dark:bg-stone-900 p-12 rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-2xl hover:border-gold transition-all group flex gap-10 items-start"
                   >
                      <div className={`flex-shrink-0 w-20 h-20 rounded-3xl flex items-center justify-center font-black text-sm ${getSourceStyle(res.type)} shadow-xl group-hover:scale-110 transition-transform`}>
                         {res.source.code}
                      </div>
                      <div className="flex-1 space-y-4">
                         <h4 className="text-3xl font-serif font-bold group-hover:text-gold transition-colors">{res.title}</h4>
                         <p className="text-2xl font-serif italic text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">"{res.snippet}"</p>
                      </div>
                   </button>
                 ))}
              </div>
           )}
        </section>
      )}
    </div>
  );
};

export default Dashboard;
