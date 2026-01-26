
import React, { useState, useEffect, createContext, useContext, useCallback, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import StudyMode from './pages/StudyMode';
import Bible from './pages/Bible';
import Catechism from './pages/Catechism';
import Saints from './pages/Saints';
import Magisterium from './pages/Magisterium';
import Dogmas from './pages/Dogmas';
import Breviary from './pages/Breviary';
import Missal from './pages/Missal';
import DailyLiturgy from './pages/DailyLiturgy';
import Favorites from './pages/Favorites';
import Prayers from './pages/Prayers';
import AquinasOpera from './pages/AquinasOpera';
import LiturgicalCalendar from './pages/LiturgicalCalendar';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Community from './pages/Community';
import LectioDivina from './pages/LectioDivina';
import Checkout from './pages/Checkout';
import Poenitentia from './pages/Poenitentia';
import OrdoMissae from './pages/OrdoMissae';
import Rosary from './pages/Rosary';
import ViaCrucis from './pages/ViaCrucis';
import Litanies from './pages/Litanies';
import Certamen from './pages/Certamen';
import Diagnostics from './pages/Diagnostics';
import OfflineIndicator from './components/OfflineIndicator';
import CommandCenter from './components/CommandCenter';
import { AppRoute, StudyResult, User, Language } from './types';
import { getIntelligentStudy, generateSpeech } from './services/gemini';
import { Icons, MobileLogo } from './constants';
import { UI_TRANSLATIONS } from './services/translations';
import { notificationService } from './services/notifications';
import { decodeBase64, decodeAudioData } from './utils/audio';
import { useOfflineMode } from './hooks/useOfflineMode';

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

export const LangContext = createContext<LanguageContextType>({
  lang: 'pt',
  setLang: () => {},
  t: (k) => k
});

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'la', name: 'Latine', flag: '🇻🇦' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
];

const App: React.FC = () => {
  const [lang, setLangState] = useState<Language>(() => (localStorage.getItem('cathedra_lang') as Language) || 'pt');
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [studyData, setStudyData] = useState<StudyResult | null>(null);
  const [dogmaSearch, setDogmaSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOmnisearchOpen, setIsOmnisearchOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cathedra_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isDark, setIsDark] = useState(() => localStorage.getItem('cathedra_dark') === 'true');

  const connectivity = useOfflineMode();

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('cathedra_lang', l);
    setIsLangMenuOpen(false);
  };

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
    notificationService.initNotifications(lang);
    
    const openOmni = () => setIsOmnisearchOpen(true);
    window.addEventListener('open-omnisearch', openOmni);
    return () => {
      window.removeEventListener('open-omnisearch', openOmni);
    };
  }, [lang]);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('cathedra_dark', String(isDark));
  }, [isDark]);

  const handleSearch = useCallback(async (topic: string) => {
    setRoute(AppRoute.STUDY_MODE);
    try {
      const result = await getIntelligentStudy(topic, lang);
      setStudyData(result);
      const history = JSON.parse(localStorage.getItem('cathedra_history') || '[]');
      const filtered = history.filter((h: any) => h.topic !== result.topic);
      localStorage.setItem('cathedra_history', JSON.stringify([result, ...filtered].slice(0, 10)));
    } catch (e) { console.error(e); } 
  }, [lang]);

  const navigateTo = useCallback((r: AppRoute) => {
    setRoute(r);
    setIsSidebarOpen(false);
    const mainArea = document.querySelector('main');
    if (mainArea) mainArea.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const t = useCallback((key: string) => {
    return UI_TRANSLATIONS[lang]?.[key] || UI_TRANSLATIONS['en'][key] || key;
  }, [lang]);

  const content = useMemo(() => {
    switch (route) {
      case AppRoute.DASHBOARD: return <Dashboard onSearch={handleSearch} onNavigate={navigateTo} user={user} />;
      case AppRoute.STUDY_MODE: return <StudyMode data={studyData} onSearch={handleSearch} />;
      case AppRoute.BIBLE: return <Bible />;
      case AppRoute.DAILY_LITURGY: return <DailyLiturgy />;
      case AppRoute.AQUINAS_OPERA: return <AquinasOpera />;
      case AppRoute.CATECHISM: return <Catechism onDeepDive={handleSearch} onNavigateDogmas={(q) => { setDogmaSearch(q); setRoute(AppRoute.DOGMAS); }} />;
      case AppRoute.SAINTS: return <Saints />;
      case AppRoute.MAGISTERIUM: return <Magisterium />;
      case AppRoute.DOGMAS: return <Dogmas initialQuery={dogmaSearch} />;
      case AppRoute.LITURGICAL_CALENDAR: return <LiturgicalCalendar />;
      case AppRoute.CHECKOUT: return <Checkout onBack={() => setRoute(AppRoute.DASHBOARD)} />;
      case AppRoute.PROFILE: return user ? <Profile user={user} onLogout={() => { setUser(null); localStorage.removeItem('cathedra_user'); }} onSelectStudy={(s) => { setStudyData(s); setRoute(AppRoute.STUDY_MODE); }} onNavigateCheckout={() => setRoute(AppRoute.CHECKOUT)} /> : <Login onLogin={setUser} />;
      case AppRoute.CERTAMEN: return <Certamen />;
      case AppRoute.POENITENTIA: return <Poenitentia />;
      case AppRoute.ORDO_MISSAE: return <OrdoMissae />;
      case AppRoute.ROSARY: return <Rosary />;
      case AppRoute.VIA_CRUCIS: return <ViaCrucis />;
      case AppRoute.LITANIES: return <Litanies />;
      case AppRoute.PRAYERS: return <Prayers />;
      case AppRoute.LECTIO_DIVINA: return <LectioDivina onNavigateDashboard={() => navigateTo(AppRoute.DASHBOARD)} />;
      case AppRoute.COMMUNITY: return <Community user={user} onNavigateLogin={() => navigateTo(AppRoute.LOGIN)} />;
      case AppRoute.DIAGNOSTICS: return <Diagnostics />;
      default: return <Dashboard onSearch={handleSearch} onNavigate={navigateTo} user={user} />;
    }
  }, [route, handleSearch, navigateTo, user, studyData, dogmaSearch, lang]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0c0a09] flex flex-col items-center justify-center z-[1000] space-y-8">
        <div className="relative">
          <div className="w-32 h-32 border-2 border-gold/10 border-t-gold rounded-full animate-spin" />
          <MobileLogo className="w-16 h-16 absolute inset-0 m-auto animate-pulse" />
        </div>
        <div className="text-center">
           <h1 className="text-3xl font-serif text-gold tracking-[0.3em] font-bold">CATHEDRA</h1>
           <p className="text-[10px] uppercase tracking-[0.5em] text-white/30 mt-2">Custodire et Tradere</p>
        </div>
      </div>
    );
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      <div className="flex h-[100dvh] overflow-hidden bg-[#fdfcf8] dark:bg-[#0c0a09]">
        
        <OfflineIndicator state={connectivity} />
        
        <CommandCenter 
          isOpen={isOmnisearchOpen} 
          onClose={() => setIsOmnisearchOpen(false)} 
          onNavigate={navigateTo} 
          onSearchSelection={handleSearch} 
        />

        <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all duration-500 ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none lg:pointer-events-auto opacity-0 lg:opacity-100'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
          <div className={`relative h-full w-80 shadow-3xl transition-transform duration-500 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <Sidebar currentPath={route} onNavigate={navigateTo} onClose={() => setIsSidebarOpen(false)} user={user} onLogout={() => { setUser(null); localStorage.removeItem('cathedra_user'); }} onOpenSearch={() => setIsOmnisearchOpen(true)} />
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
          <div className="p-4 border-b border-stone-100 dark:border-white/5 bg-white/80 dark:bg-stone-900/90 backdrop-blur-xl flex items-center justify-between sticky top-0 z-[140]">
             <div className="flex items-center gap-1">
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 text-stone-900 dark:text-gold active:scale-90 transition-transform">
                  <Icons.Menu className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo(AppRoute.DASHBOARD)}>
                    <MobileLogo className="w-9 h-9" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gold leading-none">Cathedra</span>
                      <span className="text-[7px] uppercase text-stone-400 font-bold hidden sm:block">Sanctuarium Digitale</span>
                    </div>
                </div>
             </div>

             <div className="hidden lg:flex flex-1 max-w-xl mx-8">
                <button 
                  onClick={() => setIsOmnisearchOpen(true)}
                  className="w-full flex items-center gap-3 px-6 py-3 bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-white/10 rounded-full hover:border-gold/50 transition-all group text-left"
                >
                  <Icons.Search className="w-4 h-4 text-stone-400 group-hover:text-gold" />
                  <span className="text-xs font-serif italic text-stone-400 flex-1">{t('search_placeholder')}</span>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded border border-white/10 text-[8px] font-black text-stone-400">
                    <span className="opacity-50">CMD</span>
                    <span>K</span>
                  </div>
                </button>
             </div>

             <div className="flex items-center gap-1 md:gap-3">
                <div className="relative">
                  <button 
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    className="p-3 text-stone-400 dark:text-gold active:scale-90 transition-all flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-2xl"
                    title={t('language')}
                  >
                    <Icons.Globe className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">{lang}</span>
                  </button>
                  
                  {isLangMenuOpen && (
                    <div className="absolute top-full right-0 mt-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2rem] shadow-4xl p-4 w-56 animate-in slide-in-from-top-4 duration-200">
                      <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300 mb-3 px-3">{t('language')}</h4>
                      <div className="space-y-1">
                        {LANGUAGES.map(l => (
                          <button 
                            key={l.code}
                            onClick={() => setLang(l.code)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-colors ${lang === l.code ? 'bg-gold text-stone-900' : 'hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300'}`}
                          >
                            <span>{l.flag} {l.name}</span>
                            {lang === l.code && <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={() => setIsDark(!isDark)} className="p-3 text-stone-400 dark:text-white/20 active:scale-90 transition-transform" title="Alternar Modo Escuro">
                  {isDark ? <Icons.Star className="w-5 h-5 text-gold" /> : <Icons.History className="w-5 h-5" />}
                </button>
                {user && (
                  <button onClick={() => navigateTo(AppRoute.PROFILE)} className="p-1 hidden sm:block">
                    <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-black text-xs">
                      {user.name.charAt(0)}
                    </div>
                  </button>
                )}
             </div>
          </div>

          <div className="flex-1 p-4 md:p-12 lg:p-16 pb-24 max-w-[1400px] mx-auto w-full">
            {content}
          </div>

          <Footer onNavigate={navigateTo} />
        </main>
      </div>
    </LangContext.Provider>
  );
};

export default App;
