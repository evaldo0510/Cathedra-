
import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import StudyMode from './pages/StudyMode';
import Bible from './pages/Bible';
import Catechism from './pages/Catechism';
import Saints from './pages/Saints';
import Magisterium from './pages/Magisterium';
import Dogmas from './pages/Dogmas';
import DailyLiturgy from './pages/DailyLiturgy';
import Prayers from './pages/Prayers';
import AquinasOpera from './pages/AquinasOpera';
import LiturgicalCalendar from './pages/LiturgicalCalendar';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Community from './pages/Community';
import LectioDivina from './pages/LectioDivina';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import Poenitentia from './pages/Poenitentia';
import OrdoMissae from './pages/OrdoMissae';
import Rosary from './pages/Rosary';
import ViaCrucis from './pages/ViaCrucis';
import Litanies from './pages/Litanies';
import Certamen from './pages/Certamen';
import Diagnostics from './pages/Diagnostics';
import Favorites from './pages/Favorites';
import Breviary from './pages/Breviary';
import Missal from './pages/Missal';
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
    } catch (e) {
      console.error("Erro ao carregar usuário:", e);
      return null;
    }
  });

  const [isDark, setIsDark] = useState(() => localStorage.getItem('cathedra_dark') === 'true');
  const connectivity = useOfflineMode();

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const top = e.currentTarget.scrollTop;
    setShowScrollTop(top > 400);
  }, []);

  useEffect(() => {
    notificationService.initNotifications(lang);
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    const handleAIRequest = (e: any) => {
      if (!user) {
        setRoute(AppRoute.LOGIN);
        return;
      }
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
    }, 400);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('cathedra-open-ai-study', handleAIRequest);
    };
  }, [lang, isDark, user]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  }, [deferredPrompt]);

  const navigateTo = useCallback((r: AppRoute) => {
    const protectedRoutes = [AppRoute.STUDY_MODE, AppRoute.COMMUNITY];
    if (protectedRoutes.includes(r) && !user) {
      setRoute(AppRoute.LOGIN);
    } else {
      if (route !== r) {
        setRouteHistory(prev => [...prev, route]);
        setRoute(r);
      }
    }
    setIsSidebarOpen(false);
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user, route]);

  const goBack = useCallback(() => {
    if (routeHistory.length > 0) {
      const prev = routeHistory[routeHistory.length - 1];
      setRouteHistory(prevHistory => prevHistory.slice(0, -1));
      setRoute(prev);
      document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setRoute(AppRoute.DASHBOARD);
    }
  }, [routeHistory]);

  const handleSearch = useCallback(async (topic: string) => {
    if (!user) {
      setRoute(AppRoute.LOGIN);
      return;
    }
    setRoute(AppRoute.STUDY_MODE);
    try {
      const result = await getIntelligentStudy(topic, lang);
      setStudyData(result);
      const history = JSON.parse(localStorage.getItem('cathedra_history') || '[]');
      localStorage.setItem('cathedra_history', JSON.stringify([result, ...history.slice(0, 19)]));
    } catch (e) { 
      console.error("Erro na busca IA:", e); 
    } 
  }, [lang, user]);

  const t = useCallback((key: string) => {
    return UI_TRANSLATIONS[lang]?.[key] || UI_TRANSLATIONS['en'][key] || key;
  }, [lang]);

  const content = useMemo(() => {
    switch (route) {
      case AppRoute.DASHBOARD: return <Dashboard onSearch={handleSearch} onNavigate={navigateTo} user={user} />;
      case AppRoute.BIBLE: return <Bible />;
      case AppRoute.DAILY_LITURGY: return <DailyLiturgy />;
      case AppRoute.STUDY_MODE: return <StudyMode data={studyData} onSearch={handleSearch} />;
      case AppRoute.PROFILE: return user ? <Profile user={user} onLogout={() => { setUser(null); localStorage.removeItem('cathedra_user'); }} onSelectStudy={(s) => { setStudyData(s); setRoute(AppRoute.STUDY_MODE); }} onNavigateCheckout={() => setRoute(AppRoute.CHECKOUT)} /> : <Login onLogin={(u) => { setUser(u); setRoute(AppRoute.PROFILE); }} />;
      case AppRoute.CATECHISM: return <Catechism onDeepDive={handleSearch} />;
      case AppRoute.MAGISTERIUM: return <Magisterium />;
      case AppRoute.SAINTS: return <Saints />;
      case AppRoute.COMMUNITY: return <Community user={user} onNavigateLogin={() => setRoute(AppRoute.LOGIN)} />;
      case AppRoute.AQUINAS_OPERA: return <AquinasOpera />;
      case AppRoute.LITURGICAL_CALENDAR: return <LiturgicalCalendar />;
      case AppRoute.PRAYERS: return <Prayers />;
      case AppRoute.LECTIO_DIVINA: return <LectioDivina onNavigateDashboard={() => setRoute(AppRoute.DASHBOARD)} />;
      case AppRoute.CERTAMEN: return <Certamen />;
      case AppRoute.POENITENTIA: return <Poenitentia />;
      case AppRoute.ORDO_MISSAE: return <OrdoMissae />;
      case AppRoute.ROSARY: return <Rosary />;
      case AppRoute.VIA_CRUCIS: return <ViaCrucis />;
      case AppRoute.LITANIES: return <Litanies />;
      case AppRoute.BREVIARY: return <Breviary />;
      case AppRoute.MISSAL: return <Missal />;
      case AppRoute.FAVORITES: return <Favorites />;
      case AppRoute.LOGIN: return <Login onLogin={(u) => { setUser(u); setRoute(AppRoute.DASHBOARD); }} />;
      case AppRoute.CHECKOUT: return <Checkout onBack={() => setRoute(AppRoute.DASHBOARD)} />;
      case AppRoute.DIAGNOSTICS: return user?.role === 'admin' ? <Diagnostics /> : <Dashboard onSearch={handleSearch} onNavigate={navigateTo} user={user} />;
      default: return <Dashboard onSearch={handleSearch} onNavigate={navigateTo} user={user} />;
    }
  }, [route, user, lang, handleSearch, navigateTo, studyData]);

  if (loading) return null;

  return (
    <LangContext.Provider value={{ lang, setLang: setLangState, t, installPrompt: deferredPrompt, handleInstall }}>
      <div className="flex h-[100dvh] overflow-hidden bg-[#fdfcf8] dark:bg-[#0c0a09]">
        <OfflineIndicator state={connectivity} />
        <CommandCenter isOpen={isOmnisearchOpen} onClose={() => setIsOmnisearchOpen(false)} onNavigate={navigateTo} onSearchSelection={handleSearch} />

        <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none lg:pointer-events-auto opacity-0 lg:opacity-100'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
          <div className={`relative h-full w-80 shadow-3xl transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <Sidebar currentPath={route} onNavigate={navigateTo} onClose={() => setIsSidebarOpen(false)} user={user} onLogout={() => { setUser(null); localStorage.removeItem('cathedra_user'); }} onOpenSearch={() => setIsOmnisearchOpen(true)} />
          </div>
        </div>
        
        <main id="main-content" onScroll={handleScroll} className="flex-1 overflow-y-auto flex flex-col relative custom-scrollbar scroll-smooth">
          <div className="p-3 md:p-4 border-b border-stone-100 dark:border-white/5 bg-white/90 dark:bg-stone-900/95 backdrop-blur-2xl flex items-center justify-between sticky top-0 z-[140] shadow-sm">
             <div className="flex items-center gap-2">
               {route !== AppRoute.DASHBOARD ? (
                 <button 
                  onClick={goBack}
                  className="p-3 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-gold rounded-2xl hover:bg-gold hover:text-stone-900 transition-all active:scale-90"
                  aria-label="Voltar"
                 >
                   <Icons.ArrowDown className="w-5 h-5 rotate-90" />
                 </button>
               ) : (
                 <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 text-stone-900 dark:text-gold hover:bg-stone-50 dark:hover:bg-white/5 rounded-2xl transition-colors">
                   <Icons.Menu className="w-6 h-6" />
                 </button>
               )}
               
               <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo(AppRoute.DASHBOARD)}>
                  <Logo className="w-9 h-9 md:w-11 md:h-11 transition-transform duration-700 group-hover:scale-110" />
                  <div className="flex flex-col">
                    <span className="text-sm md:text-base font-serif font-black uppercase tracking-[0.25em] text-stone-900 dark:text-gold leading-none">Cathedra</span>
                    <span className="text-[7px] font-black uppercase tracking-[0.4em] text-stone-400 dark:text-stone-500 leading-none mt-1">Digital Sanctuarium</span>
                  </div>
               </div>
             </div>

             <div className="flex items-center gap-2">
               <button onClick={() => setIsOmnisearchOpen(true)} className="p-3 text-stone-400 hover:text-gold transition-colors hidden sm:block">
                 <Icons.Search className="w-5 h-5" />
               </button>
               {user?.role === 'admin' && (
                 <button onClick={() => setRoute(AppRoute.DIAGNOSTICS)} className="p-3 text-stone-400 hover:text-gold transition-colors"><Icons.Layout className="w-5 h-5" /></button>
               )}
               <button 
                onClick={() => {
                  const next = !isDark;
                  setIsDark(next);
                  localStorage.setItem('cathedra_dark', String(next));
                }} 
                className="p-3 bg-stone-50 dark:bg-stone-800/50 text-stone-400 hover:text-gold rounded-2xl border border-stone-100 dark:border-stone-700 transition-all"
               >
                {isDark ? <Icons.Star className="w-5 h-5 text-gold fill-current" /> : <Icons.History className="w-5 h-5" />}
               </button>
             </div>
          </div>

          <div className="flex-1 px-4 md:px-12 py-8 w-full max-w-7xl mx-auto page-enter">
            {content}
          </div>

          <Footer onNavigate={navigateTo} />
          
          {/* BOTÃO SURSUM CORDA (SOBE) */}
          <button 
            onClick={() => document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`fixed bottom-24 right-4 md:right-12 z-[250] p-5 bg-gold text-stone-900 rounded-full shadow-4xl border-2 border-white transition-all duration-500 active:scale-90 ${showScrollTop ? 'translate-y-0 opacity-100 rotate-0' : 'translate-y-20 opacity-0 rotate-180'}`}
          >
             <Icons.ArrowDown className="w-6 h-6 rotate-180" />
          </button>
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-t border-stone-200 dark:border-white/5 px-6 py-3 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.1)] pb-[calc(12px+var(--sab))]">
          {[
            { id: AppRoute.DASHBOARD, icon: Icons.Home, label: 'Início' },
            { id: AppRoute.BIBLE, icon: Icons.Book, label: 'Bíblia' },
            { id: AppRoute.STUDY_MODE, icon: Icons.Search, label: 'IA' },
            { id: AppRoute.PROFILE, icon: Icons.Users, label: 'Membro' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`flex flex-col items-center gap-1 transition-all ${route === item.id ? 'text-sacred dark:text-gold scale-110' : 'text-stone-400'}`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </LangContext.Provider>
  );
};

export default App;
