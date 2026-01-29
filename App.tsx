
import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import StudyMode from './pages/StudyMode';
import Bible from './pages/Bible';
import Catechism from './pages/Catechism';
import Saints from './pages/Saints';
import Magisterium from './pages/Magisterium';
import DailyLiturgy from './pages/DailyLiturgy';
import AquinasOpera from './pages/AquinasOpera';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import Poenitentia from './pages/Poenitentia';
import OrdoMissae from './pages/OrdoMissae';
import Rosary from './pages/Rosary';
import Litanies from './pages/Litanies';
import Certamen from './pages/Certamen';
import Diagnostics from './pages/Diagnostics';
import Favorites from './pages/Favorites';
import Breviary from './pages/Breviary';
import Missal from './pages/Missal';
import ViaCrucis from './pages/ViaCrucis';
import LectioDivina from './pages/LectioDivina';
import Dogmas from './pages/Dogmas';
import Prayers from './pages/Prayers';
import About from './pages/About';
import OfflineIndicator from './components/OfflineIndicator';
import CommandCenter from './components/CommandCenter';
import { AppRoute, StudyResult, User, Language } from './types';
import { getIntelligentStudy } from './services/gemini';
import { Icons, Logo } from './constants';
import { UI_TRANSLATIONS } from './services/translations';
import { notificationService } from './services/notifications';
import { useOfflineMode } from './hooks/useOfflineMode';

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
  installPrompt: any;
  handleInstall: () => void;
}

export const LangContext = createContext<LanguageContextType>({
  lang: 'pt',
  setLang: () => {},
  t: (k) => k,
  installPrompt: null,
  handleInstall: () => {}
});

const App: React.FC = () => {
  const [lang, setLangState] = useState<Language>(() => (localStorage.getItem('cathedra_lang') as Language) || 'pt');
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [routeHistory, setRouteHistory] = useState<AppRoute[]>([]);
  const [studyData, setStudyData] = useState<StudyResult | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOmnisearchOpen, setIsOmnisearchOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cathedra_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [isDark, setIsDark] = useState(() => localStorage.getItem('cathedra_dark') === 'true');
  const connectivity = useOfflineMode();

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 400);
  }, []);

  useEffect(() => {
    notificationService.initNotifications(lang);
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    const handleAIRequest = (e: any) => {
      if (!user) { setRoute(AppRoute.LOGIN); return; }
      handleSearch(e.detail.topic);
    };

    window.addEventListener('cathedra-open-ai-study', handleAIRequest);
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    const timer = setTimeout(() => {
      setLoading(false);
      window.dispatchEvent(new CustomEvent('cathedra-ready'));
    }, 800);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('cathedra-open-ai-study', handleAIRequest);
    };
  }, [lang, isDark, user]);

  const navigateTo = useCallback((r: AppRoute) => {
    if (route !== r) {
      setRouteHistory(prev => [...prev, route]);
      setRoute(r);
    }
    setIsSidebarOpen(false);
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route]);

  const goBack = useCallback(() => {
    if (routeHistory.length > 0) {
      const prev = routeHistory[routeHistory.length - 1];
      setRouteHistory(prevHistory => prevHistory.slice(0, -1));
      setRoute(prev);
    } else {
      setRoute(AppRoute.DASHBOARD);
    }
  }, [routeHistory]);

  const handleSearch = useCallback(async (topic: string) => {
    setRoute(AppRoute.STUDY_MODE);
    try {
      const result = await getIntelligentStudy(topic, lang);
      setStudyData(result);
    } catch (e) { console.error(e); } 
  }, [lang]);

  const t = useCallback((key: string) => {
    return UI_TRANSLATIONS[lang]?.[key] || UI_TRANSLATIONS['en'][key] || key;
  }, [lang]);

  const content = useMemo(() => {
    switch (route) {
      case AppRoute.DASHBOARD: return <Dashboard onSearch={handleSearch} user={user} onNavigate={navigateTo} />;
      case AppRoute.STUDY_MODE: return <StudyMode data={studyData} onSearch={handleSearch} />;
      case AppRoute.BIBLE: return <Bible />;
      case AppRoute.CATECHISM: return <Catechism onDeepDive={handleSearch} />;
      case AppRoute.SAINTS: return <Saints />;
      case AppRoute.MAGISTERIUM: return <Magisterium />;
      case AppRoute.DAILY_LITURGY: return <DailyLiturgy />;
      case AppRoute.AQUINAS_OPERA: return <AquinasOpera />;
      case AppRoute.ORDO_MISSAE: return <OrdoMissae />;
      case AppRoute.ROSARY: return <Rosary />;
      case AppRoute.POENITENTIA: return <Poenitentia />;
      case AppRoute.LITANIES: return <Litanies />;
      case AppRoute.CERTAMEN: return <Certamen />;
      case AppRoute.FAVORITES: return <Favorites />;
      case AppRoute.DIAGNOSTICS: return <Diagnostics />;
      case AppRoute.BREVIARY: return <Breviary />;
      case AppRoute.MISSAL: return <Missal />;
      case AppRoute.VIA_CRUCIS: return <ViaCrucis />;
      case AppRoute.LECTIO_DIVINA: return <LectioDivina onNavigateDashboard={() => setRoute(AppRoute.DASHBOARD)} />;
      case AppRoute.DOGMAS: return <Dogmas />;
      case AppRoute.PRAYERS: return <Prayers />;
      case AppRoute.ABOUT: return <About />;
      case AppRoute.PROFILE: return user ? <Profile user={user} onLogout={() => setUser(null)} onSelectStudy={(s) => { setStudyData(s); setRoute(AppRoute.STUDY_MODE); }} onNavigateCheckout={() => setRoute(AppRoute.CHECKOUT)} /> : <Login onLogin={setUser} />;
      case AppRoute.CHECKOUT: return <Checkout onBack={() => setRoute(AppRoute.DASHBOARD)} />;
      default: return <Dashboard onSearch={handleSearch} user={user} onNavigate={navigateTo} />;
    }
  }, [route, user, lang, handleSearch, studyData, navigateTo]);

  if (loading) return null;

  return (
    <LangContext.Provider value={{ lang, setLang: setLangState, t, installPrompt: deferredPrompt, handleInstall: () => deferredPrompt?.prompt() }}>
      <div className="flex h-[100dvh] overflow-hidden bg-[#fdfcf8] dark:bg-[#0c0a09]">
        <OfflineIndicator state={connectivity} />
        <CommandCenter isOpen={isOmnisearchOpen} onClose={() => setIsOmnisearchOpen(false)} onNavigate={navigateTo} onSearchSelection={handleSearch} />

        <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none lg:pointer-events-auto opacity-0 lg:opacity-100'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
          <div className={`relative h-full w-80 transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <Sidebar currentPath={route} onNavigate={navigateTo} onClose={() => setIsSidebarOpen(false)} user={user} onLogout={() => setUser(null)} onOpenSearch={() => setIsOmnisearchOpen(true)} />
          </div>
        </div>
        
        <main id="main-content" onScroll={handleScroll} className="flex-1 overflow-y-auto flex flex-col relative custom-scrollbar scroll-smooth">
          <header className="p-3 md:p-4 border-b border-stone-100 dark:border-white/5 bg-white/90 dark:bg-stone-900/95 backdrop-blur-2xl flex items-center justify-between sticky top-0 z-[140] shadow-sm">
             <div className="flex items-center gap-2">
               {route !== AppRoute.DASHBOARD ? (
                 <button onClick={goBack} className="p-3 bg-stone-900 text-gold rounded-2xl flex items-center gap-2 pr-5 shadow-xl animate-in slide-in-from-left-4">
                   <Icons.ArrowDown className="w-5 h-5 rotate-90" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
                 </button>
               ) : (
                 <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 text-stone-900 dark:text-gold">
                   <Icons.Menu className="w-6 h-6" />
                 </button>
               )}
               {route === AppRoute.DASHBOARD && (
                 <div className="flex items-center gap-3 ml-2">
                    <Logo className="w-9 h-9" />
                    <span className="text-sm font-serif font-black uppercase tracking-[0.2em] text-stone-900 dark:text-gold leading-none">Cathedra</span>
                 </div>
               )}
             </div>
             <div className="flex items-center gap-2">
               <button onClick={() => setIsOmnisearchOpen(true)} className="p-3 text-stone-400 hover:text-gold"><Icons.Search className="w-5 h-5" /></button>
               <button onClick={() => setIsDark(!isDark)} className="p-3 bg-stone-50 dark:bg-stone-800/50 text-stone-400 hover:text-gold rounded-2xl border border-stone-100 dark:border-stone-700">
                {isDark ? <Icons.Star className="w-5 h-5 text-gold fill-current" /> : <Icons.History className="w-5 h-5" />}
               </button>
             </div>
          </header>

          <div className="flex-1 px-4 md:px-12 py-8 w-full max-w-7xl mx-auto page-enter">
            {content}
          </div>

          <Footer onNavigate={navigateTo} />
          
          <button 
            onClick={() => document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`fixed bottom-8 right-4 md:right-12 z-[250] p-5 bg-gold text-stone-900 rounded-full shadow-4xl transition-all duration-500 ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
          >
             <Icons.ArrowDown className="w-6 h-6 rotate-180" />
          </button>
        </main>
      </div>
    </LangContext.Provider>
  );
};

export default App;
