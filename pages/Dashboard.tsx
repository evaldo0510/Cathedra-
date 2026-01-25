
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { universalSearch, fetchDailyVerse, getDailyBundle } from '../services/gemini';
import { AppRoute, User, UniversalSearchResult, StudyResult } from '../types';
import SacredImage from '../components/SacredImage';
import { LangContext } from '../App';
import ActionButtons from '../components/ActionButtons';

const Dashboard: React.FC<{ onSearch: (topic: string) => void; onNavigate: (route: AppRoute) => void; user: User | null }> = ({ onSearch, onNavigate, user }) => {
  const { lang } = useContext(LangContext);
  const [dailyVerse, setDailyVerse] = useState<any>(null);
  const [dailyBundle, setDailyBundle] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UniversalSearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [recentStudies, setRecentStudies] = useState<StudyResult[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [verse, bundle] = await Promise.all([
        fetchDailyVerse(lang),
        getDailyBundle(lang)
      ]);
      setDailyVerse(verse);
      setDailyBundle(bundle);
      
      const history = JSON.parse(localStorage.getItem('cathedra_history') || '[]');
      setRecentStudies(history.slice(0, 3));
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
    } catch (err) { console.error(err); } 
    finally { setLoadingSearch(false); }
  };

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-1000 -mt-10">
      {/* SEÇÃO HERO: O VERBO HOJE */}
      <section className="relative h-[70vh] md:h-[85vh] mx-[-1rem] md:mx-[-4rem] lg:mx-[-6rem] overflow-hidden group shadow-4xl">
        <div className="absolute inset-0 z-0">
          <SacredImage 
            src={dailyVerse?.imageUrl || "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=1600"} 
            alt="Palavra do Dia" 
            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[20s]" 
            priority={true} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/50 to-transparent" />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 md:p-24 space-y-8 max-w-6xl">
          <div className="space-y-4 animate-in slide-in-from-left-8 duration-1000">
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 bg-sacred text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg border border-white/10">
                Lumen Diei • Hoje
              </span>
              <span className="text-white/60 text-lg font-serif italic">{dailyVerse?.reference}</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-serif font-bold text-white tracking-tighter leading-tight drop-shadow-2xl">
               {dailyVerse?.verse || "Onde está o teu tesouro, aí estará teu coração."}
            </h1>
          </div>

          <div className="flex flex-wrap gap-4 animate-in slide-in-from-bottom-8 duration-1000">
            <button onClick={() => onNavigate(AppRoute.BIBLE)} className="px-12 py-5 bg-gold text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-yellow-400 transition-all active:scale-95 flex items-center gap-3">
              <Icons.Book className="w-5 h-5" /> Abrir Scriptuarium
            </button>
            <button onClick={() => onNavigate(AppRoute.DAILY_LITURGY)} className="px-12 py-5 bg-white/10 backdrop-blur-xl text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all flex items-center gap-3">
              <Icons.History className="w-5 h-5" /> Ver Liturgia
            </button>
          </div>
        </div>
      </section>

      {/* EXPLORADOR DO DEPÓSITO */}
      <section className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
        {[
          { label: 'Scriptuarium', sub: '73 Livros Sagrados', route: AppRoute.BIBLE, icon: Icons.Book, img: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=600' },
          { label: 'Codex Fidei', sub: '2.865 Parágrafos (CIC)', route: AppRoute.CATECHISM, icon: Icons.Cross, img: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=600' },
          { label: 'Opera Omnia', sub: 'Obras de S. Tomás', route: AppRoute.AQUINAS_OPERA, icon: Icons.Feather, img: 'https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=600' }
        ].map((item, i) => (
          <button 
            key={i} 
            onClick={() => onNavigate(item.route)}
            className="group relative h-64 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 bg-stone-900 transition-all hover:-translate-y-2"
          >
            <SacredImage src={item.img} alt={item.label} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8 text-left">
               <div className="flex items-center gap-3 mb-2">
                  <item.icon className="w-5 h-5 text-gold" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gold/60">Explorar Unidade</span>
               </div>
               <h3 className="text-3xl font-serif font-bold text-white group-hover:text-gold transition-colors">{item.label}</h3>
               <p className="text-white/40 text-xs font-serif italic">{item.sub}</p>
            </div>
          </button>
        ))}
      </section>

      {/* BUSCA UNIVERSAL ELEVADA */}
      <section className="max-w-5xl mx-auto px-4">
        <form onSubmit={handleUniversalSearch} className="relative group">
           <div className="flex items-center bg-[#1a1917] backdrop-blur-3xl rounded-[2.5rem] shadow-4xl border border-white/10 focus-within:border-gold transition-all overflow-hidden p-2">
              <div className="pl-8 text-gold/40 group-focus-within:text-gold transition-colors"><Icons.Search className="w-8 h-8" /></div>
              <input 
                type="text" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Busque no Depósito da Fé... (Ex: Graça, João 3, Imaculada)" 
                className="flex-1 px-8 py-8 bg-transparent outline-none font-serif text-2xl italic text-white" 
              />
              <button type="submit" className="hidden md:block px-12 py-6 bg-gold text-stone-900 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-lg">Investigar</button>
           </div>
        </form>
      </section>

      {/* RESULTADOS OU CONTEÚDO RECENTE */}
      <section className="max-w-6xl mx-auto px-4">
        {isSearching ? (
          <div className="grid gap-6 animate-in slide-in-from-bottom-8">
            {loadingSearch ? (
               <div className="py-20 text-center space-y-6">
                  <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-2xl font-serif italic text-stone-500">Escavando os Tesouros da Tradição...</p>
               </div>
            ) : searchResults.map(res => (
              <button key={res.id} onClick={() => onSearch(res.title)} className="w-full text-left bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-xl hover:border-gold transition-all group flex gap-8">
                 <div className="w-16 h-16 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center justify-center font-black text-xs text-gold border border-gold/20 flex-shrink-0 group-hover:scale-110 transition-transform">
                   {res.source.code}
                 </div>
                 <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-gold/60">{res.type} • {res.source.name}</span>
                    <h4 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-gold transition-colors">{res.title}</h4>
                    <p className="text-stone-400 italic line-clamp-2">"{res.snippet}"</p>
                 </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-16">
            {/* SENTENTIA SANCTORUM - CITAÇÃO EM DESTAQUE */}
            {dailyBundle?.saint?.quote && (
              <div className="bg-white dark:bg-stone-900 p-12 md:p-20 rounded-[4rem] shadow-3xl border border-stone-100 dark:border-stone-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-[2000ms]">
                  <Icons.Feather className="w-64 h-64 text-gold" />
                </div>
                <div className="relative z-10 text-center space-y-10">
                   <span className="text-[12px] font-black uppercase tracking-[0.8em] text-gold">Sententia Sanctorum</span>
                   <p className="text-4xl md:text-6xl font-serif italic text-stone-800 dark:text-stone-100 leading-tight tracking-tight">
                     "{dailyBundle.saint.quote}"
                   </p>
                   <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 bg-sacred/10 rounded-full flex items-center justify-center border border-sacred/20">
                         <Icons.Cross className="w-4 h-4 text-sacred" />
                      </div>
                      <h5 className="text-2xl font-serif font-bold text-stone-900 dark:text-gold">{dailyBundle.saint.name}</h5>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* CTA: COMUNIDADE E PREMIUM */}
      <section className="max-w-6xl mx-auto px-4">
         <div className="bg-stone-950 p-12 md:p-24 rounded-[5rem] text-white shadow-3xl relative overflow-hidden group">
            <Icons.Cross className="absolute -bottom-20 -right-20 w-96 h-96 text-gold/5 group-hover:rotate-12 transition-transform duration-[20s]" />
            <div className="relative z-10 space-y-8 max-w-4xl">
               <span className="px-6 py-2 bg-gold/10 border border-gold/20 rounded-full text-[10px] font-black uppercase tracking-[0.5em] text-gold">Plano Cathedra Scholar</span>
               <h2 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter leading-none">A Sabedoria <br/> <span className="text-gold">Ilimitada.</span></h2>
               <p className="text-2xl font-serif italic text-white/50 leading-relaxed">
                 Desbloqueie o Nexus AI para correlacionar Escritura, Patrística e Magistério em segundos. Sincronize seus estudos entre todos os dispositivos.
               </p>
               <button onClick={() => onNavigate(AppRoute.CHECKOUT)} className="px-16 py-8 bg-gold text-stone-900 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs shadow-4xl hover:bg-yellow-400 active:scale-95 transition-all">
                 Subscrever Agora • R$ 9,90/mês
               </button>
            </div>
         </div>
      </section>
    </div>
  );
};

export default Dashboard;
