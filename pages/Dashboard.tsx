
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Icons, Logo } from '../constants';
import { universalSearch, fetchDailyVerse, getDailyBundle } from '../services/gemini';
import { AppRoute, User, UniversalSearchResult, StudyResult } from '../types';
import SacredImage from '../components/SacredImage';
import { LangContext } from '../App';
import ActionButtons from '../components/ActionButtons';

const Dashboard: React.FC<{ onSearch: (topic: string) => void; onNavigate: (route: AppRoute) => void; user: User | null }> = ({ onSearch, onNavigate, user }) => {
  const { lang } = useContext(LangContext);
  const [dailyVerse, setDailyVerse] = useState<any>(null);
  const [dailyBundle, setDailyBundle] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UniversalSearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingBundle, setLoadingBundle] = useState(true);
  const [recentStudies, setRecentStudies] = useState<StudyResult[]>([]);

  const stats = [
    { label: 'Livros Inspirados', value: '73', sub: 'Cânon Católico', icon: Icons.Book, color: 'text-emerald-600' },
    { label: 'Parágrafos da Fé', value: '2.865', sub: 'Catecismo (CIC)', icon: Icons.Cross, color: 'text-sacred' },
    { label: 'Doutores & Santos', value: '12.000+', sub: 'Hagiografias', icon: Icons.Users, color: 'text-gold' },
    { label: 'Artigos Escolásticos', value: '3.500+', sub: 'S. Tomás de Aquino', icon: Icons.Feather, color: 'text-stone-400' },
  ];

  const scriptuariumRail = [
    { id: 'bible', label: 'Bíblia Sagrada', sub: 'Scriptuarium', route: AppRoute.BIBLE, img: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800' },
    { id: 'liturgy', label: 'Liturgia Diária', sub: 'Lecionário', route: AppRoute.DAILY_LITURGY, img: 'https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800' },
    { id: 'calendar', label: 'Calendário Litúrgico', sub: 'Cronos Sagrado', route: AppRoute.LITURGICAL_CALENDAR, img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800' },
  ];

  const doctrineRail = [
    { id: 'catechism', label: 'Catecismo', sub: 'Codex Fidei', route: AppRoute.CATECHISM, img: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=800' },
    { id: 'magisterium', label: 'Magistério', sub: 'Enchiridion', route: AppRoute.MAGISTERIUM, img: 'https://images.unsplash.com/photo-1532012197367-60134763a20a?q=80&w=800' },
    { id: 'dogmas', label: 'Dogmas de Fé', sub: 'Verdades Eternas', route: AppRoute.DOGMAS, img: 'https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=800' },
  ];

  useEffect(() => {
    const fetch = async () => {
      const [verse, bundle] = await Promise.all([
        fetchDailyVerse(lang),
        getDailyBundle(lang)
      ]);
      
      setDailyVerse(verse);
      setDailyBundle(bundle);
      setLoadingBundle(false);
      
      const history = JSON.parse(localStorage.getItem('cathedra_history') || '[]');
      setRecentStudies(history.slice(0, 5));
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

  const renderRail = (title: string, items: any[], type: 'standard' | 'history' = 'standard') => (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4 md:px-0">
        <h3 className="text-xl md:text-3xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gold rounded-full shadow-[0_0_10px_#d4af37]" />
          {title}
        </h3>
      </div>
      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8 snap-x px-4 md:px-0">
        {items.map((item, idx) => (
          <button 
            key={type === 'history' ? idx : item.id} 
            onClick={() => type === 'history' ? onSearch(item.topic) : onNavigate(item.route)} 
            className={`flex-shrink-0 group snap-start transition-all duration-500 hover:scale-105 ${type === 'history' ? 'w-64 md:w-80' : 'w-72 md:w-96'}`}
          >
            <div className={`rounded-3xl overflow-hidden shadow-2xl relative bg-stone-100 dark:bg-stone-900 border border-white/5 ring-1 ring-white/10 group-hover:ring-gold/30 ${type === 'history' ? 'aspect-square' : 'aspect-video'}`}>
              <SacredImage 
                src={item.img || `https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800&sig=${idx}`} 
                alt={item.label || item.topic} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-6 left-6 right-6 text-left">
                <p className="text-[9px] text-gold font-black uppercase tracking-[0.3em] mb-1">{type === 'history' ? 'Retomar Investigação' : item.sub}</p>
                <h4 className={`text-white font-serif font-bold group-hover:text-gold transition-colors leading-tight ${type === 'history' ? 'text-lg' : 'text-2xl'}`}>
                  {type === 'history' ? item.topic : item.label}
                </h4>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-20 pb-32 animate-in fade-in duration-1000 -mt-16">
      {!isSearching && (
        <section className="relative h-[80vh] md:h-[95vh] mx-[-1rem] md:mx-[-4rem] lg:mx-[-6rem] overflow-hidden group">
          <div className="absolute inset-0 z-0">
            <SacredImage src={dailyVerse?.imageUrl || "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=1600"} alt="Destaque" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[30s] ease-out" priority={true} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a09]/80 via-transparent to-transparent" />
          </div>

          <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 md:p-24 space-y-8 max-w-7xl">
            <div className="space-y-6 animate-in slide-in-from-left-8 duration-1000">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-sacred text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-xl border border-white/10">
                  <Icons.Star className="w-3 h-3 fill-current" /> Hodie • Hoje
                </div>
                <span className="text-white/60 text-lg font-serif italic">{dailyVerse?.reference}</span>
              </div>
              <h1 className="text-6xl md:text-9xl font-serif font-bold text-white tracking-tighter leading-[0.8] drop-shadow-3xl">
                {dailyVerse?.verse ? (
                  <>
                    <span className="text-gold">"{dailyVerse.verse.split(' ').slice(0, 2).join(' ')}</span>
                    <span className="opacity-90"> {dailyVerse.verse.split(' ').slice(2).join(' ')}"</span>
                  </>
                ) : 'A Palavra Eterna'}
              </h1>
            </div>

            <div className="flex flex-wrap gap-4 pt-4 animate-in slide-in-from-bottom-8 duration-[1200ms]">
              <button onClick={() => onNavigate(AppRoute.DAILY_LITURGY)} className="px-14 py-6 bg-white text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl flex items-center gap-3 hover:bg-gold transition-all active:scale-95">
                <Icons.History className="w-6 h-6" /> Iniciar Lectio
              </button>
              <button onClick={() => onNavigate(AppRoute.BIBLE)} className="px-14 py-6 bg-white/10 backdrop-blur-2xl text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-white/20 transition-all flex items-center gap-3 active:scale-95">
                <Icons.Book className="w-6 h-6" /> Abrir Scriptuarium
              </button>
            </div>

            {/* Sumário do Depósito (Stats Rápidas) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-white/10 animate-in fade-in duration-1000 delay-500">
               {stats.map((s, i) => (
                 <div key={i} className="flex flex-col">
                    <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em] mb-1">{s.sub}</span>
                    <div className="flex items-center gap-3">
                       <s.icon className={`w-5 h-5 ${s.color}`} />
                       <span className="text-white font-serif font-bold text-2xl">{s.value}</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </section>
      )}

      {/* Busca Universal Elevada */}
      <section className={`max-w-5xl mx-auto px-4 transition-all duration-1000 ${isSearching ? 'pt-8' : '-mt-32 relative z-20'}`}>
        <form onSubmit={handleUniversalSearch} className="relative group">
           <div className="relative flex items-center bg-[#1a1917]/98 backdrop-blur-3xl rounded-[2.5rem] shadow-4xl border border-white/10 focus-within:border-gold/50 transition-all overflow-hidden p-2">
              <div className="pl-8 text-gold/60 group-focus-within:text-gold transition-colors"><Icons.Search className="w-8 h-8" /></div>
              <input 
                type="text" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Busque no Depósito da Fé... (Ex: Graça, João 3, Imaculada)" 
                className="flex-1 px-8 py-8 bg-transparent outline-none font-serif text-3xl italic text-white placeholder:text-stone-600" 
              />
              <button type="submit" className="hidden md:block px-12 py-6 bg-gold text-stone-900 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-lg hover:bg-yellow-400 transition-all active:scale-95">Investigar</button>
           </div>
        </form>
      </section>

      {isSearching ? (
        <section className="max-w-5xl mx-auto px-4 space-y-12 animate-in slide-in-from-bottom-8 duration-700">
           {loadingSearch ? (
              <div className="py-40 text-center space-y-8">
                 <div className="w-20 h-20 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                 <p className="text-3xl font-serif italic text-stone-400">Escavando os Tesouros da Tradição...</p>
              </div>
           ) : (
              <div className="grid gap-8 pb-40">
                 {searchResults.map((res) => (
                   <button key={res.id} onClick={() => onSearch(res.title)} className="w-full text-left bg-[#1a1917] p-10 rounded-[3rem] border border-white/5 shadow-2xl hover:border-gold transition-all group flex gap-10 items-start">
                      <div className={`flex-shrink-0 w-20 h-20 rounded-3xl flex items-center justify-center font-black text-xs bg-stone-900 text-gold border border-gold/20 shadow-inner group-hover:scale-110 transition-transform`}>{res.source.code}</div>
                      <div className="flex-1 space-y-4">
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gold/60">{res.type}</span>
                            <div className="w-1 h-1 bg-stone-700 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{res.source.name}</span>
                         </div>
                         <h4 className="text-3xl font-serif font-bold text-white group-hover:text-gold transition-colors leading-tight">{res.title}</h4>
                         <p className="text-xl font-serif italic text-stone-400 line-clamp-3 leading-relaxed">"{res.snippet}"</p>
                      </div>
                   </button>
                 ))}
              </div>
           )}
        </section>
      ) : (
        <div className="space-y-24 px-4 md:px-0">
          
          {/* SEÇÃO: SENTENTIA SANCTORUM */}
          <section className="max-w-4xl mx-auto animate-in slide-in-from-bottom-10 duration-1000">
            {loadingBundle ? (
              <div className="bg-white dark:bg-stone-900 h-64 rounded-[3.5rem] animate-pulse shadow-xl border border-stone-100 dark:border-stone-800" />
            ) : dailyBundle?.saint?.quote && (
              <div className="bg-white dark:bg-[#1a1917] p-12 md:p-20 rounded-[4rem] shadow-3xl border border-stone-100 dark:border-stone-800 relative overflow-hidden group">
                <div className="absolute inset-0 parchment opacity-20 pointer-events-none" />
                <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:rotate-12 transition-transform duration-[2000ms]">
                  <Icons.Feather className="w-64 h-64 text-gold" />
                </div>
                
                <div className="relative z-10 flex flex-col items-center text-center space-y-12">
                  <div className="flex items-center gap-8">
                    <div className="h-px w-10 md:w-24 bg-gold/40" />
                    <span className="text-[12px] md:text-[14px] font-black uppercase tracking-[0.8em] text-gold">Sententia Sanctorum</span>
                    <div className="h-px w-10 md:w-24 bg-gold/40" />
                  </div>

                  <div className="space-y-10 max-w-2xl">
                    <div className="relative px-8">
                       <Icons.Cross className="absolute -top-6 -left-4 w-12 h-12 text-gold/10 rotate-12" />
                       <p className="text-4xl md:text-7xl font-serif italic text-stone-800 dark:text-stone-100 leading-tight tracking-tight first-letter:text-9xl first-letter:font-bold first-letter:text-gold first-letter:mr-3 first-letter:float-left">
                         "{dailyBundle.saint.quote}"
                       </p>
                    </div>
                    
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-sacred/5 border-2 border-sacred/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        <Icons.Cross className="w-6 h-6 text-sacred" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 dark:text-gold">{dailyBundle.saint.name}</h5>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Doctor Ecclesiae • Hodie</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 flex flex-wrap justify-center gap-6 border-t border-stone-50 dark:border-stone-800 w-full max-w-xl mx-auto">
                    <ActionButtons 
                      itemId={`quote_${new Date().toISOString().split('T')[0]}`} 
                      type="prayer" 
                      title={`Sententia: ${dailyBundle.saint.name}`} 
                      content={dailyBundle.saint.quote} 
                      className="scale-150"
                    />
                    <button 
                      onClick={() => onNavigate(AppRoute.SAINTS)}
                      className="px-12 py-4 bg-stone-50 dark:bg-stone-800 text-[10px] font-black uppercase tracking-widest text-stone-500 hover:text-gold hover:border-gold transition-all rounded-full border border-stone-200 dark:border-stone-700 shadow-md active:scale-95"
                    >
                      Vida do Santo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {recentStudies.length > 0 && renderRail("Continuar Investigação", recentStudies, 'history')}
          {renderRail("Santuário Hodie", scriptuariumRail)}
          {renderRail("Sacra Doctrina", doctrineRail)}

          {/* Banner de CTA Elevado */}
          <section className="bg-stone-950 p-12 md:p-24 rounded-[5rem] text-white shadow-3xl relative overflow-hidden group">
            <Icons.Cross className="absolute -bottom-24 -right-24 w-[500px] h-[500px] text-gold/5 group-hover:rotate-12 transition-transform duration-[25s]" />
            <div className="relative z-10 max-w-5xl space-y-12">
              <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-gold/10 border border-gold/20 rounded-full">
                <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">Plano Cathedra Scholar</span>
              </div>
              <h3 className="text-6xl md:text-9xl font-serif font-bold tracking-tighter leading-[0.8] mb-4">A Sabedoria <br/> <span className="text-gold">Ilimitada.</span></h3>
              <p className="text-2xl md:text-4xl text-white/50 font-serif italic leading-relaxed max-w-4xl">
                Desbloqueie o Nexus AI para correlacionar Escritura, Patrística e Magistério em segundos. Sincronize seu florilégio entre todos os dispositivos.
              </p>
              <button onClick={() => onNavigate(AppRoute.CHECKOUT)} className="px-20 py-8 bg-gold text-stone-900 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs shadow-4xl hover:bg-yellow-400 hover:scale-105 transition-all active:scale-95">
                Subscrever Agora • R$ 9,90/mês
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
