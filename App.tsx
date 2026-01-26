
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
import { getIntelligentStudy } from './services/gemini';
import { Icons, MobileLogo } from './constants';
import { UI_TRANSLATIONS } from './services/translations';
import { notificationService } from './services/notifications';
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

const App: React.FC = () => {
  const [lang, setLangState] = useState<Language>(() => (localStorage.getItem('cathedra_lang') as Language) || 'pt');
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [studyData, setStudyData] = useState<StudyResult | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOmnisearchOpen, setIsOmnisearchOpen] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cathedra_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isDark, setIsDark] = useState(() => localStorage.getItem('cathedra_dark') === 'true');

  const connectivity = useOfflineMode();

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
    notificationService.initNotifications(lang);
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [lang, isDark]);

  const navigateTo = useCallback((r: AppRoute) => {
    setRoute(r);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
      case AppRoute.DASHBOARD: return <Dashboard onSearch={handleSearch} onNavigate={navigateTo} user={user} />;
      case AppRoute.BIBLE: return <Bible />;
      case AppRoute.DAILY_LITURGY: return <DailyLiturgy />;
      case AppRoute.PROFILE: return user ? <Profile user={user} onLogout={() => { setUser(null); localStorage.removeItem('cathedra_user'); }} onSelectStudy={(s) => { setStudyData(s); setRoute(AppRoute.STUDY_MODE); }} onNavigateCheckout={() => setRoute(AppRoute.CHECKOUT)} /> : <Login onLogin={setUser} />;
      case AppRoute.CATECHISM: return <Catechism onDeepDive={handleSearch} />;
      case AppRoute.AQUINAS_OPERA: return <AquinasOpera />;
      case AppRoute.SAINTS: return <Saints />;
      case AppRoute.CHECKOUT: return <Checkout onBack={() => setRoute(AppRoute.DASHBOARD)} />;
      default: return <Dashboard onSearch={handleSearch} onNavigate={navigateTo} user={user} />;
    }
  }, [route, user, lang, handleSearch, navigateTo]);

  if (loading) return null;

  return (
    <LangContext.Provider value={{ lang, setLang: setLangState, t }}>
      <div className="flex h-[100dvh] overflow-hidden bg-[#fdfcf8] dark:bg-[#0c0a09]">
        <OfflineIndicator state={connectivity} />
        <CommandCenter isOpen={isOmnisearchOpen} onClose={() => setIsOmnisearchOpen(false)} onNavigate={navigateTo} onSearchSelection={handleSearch} />

        <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none lg:pointer-events-auto opacity-0 lg:opacity-100'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
          <div className={`relative h-full w-80 shadow-3xl transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <Sidebar currentPath={route} onNavigate={navigateTo} onClose={() => setIsSidebarOpen(false)} user={user} onLogout={() => { setUser(null); localStorage.removeItem('cathedra_user'); }} onOpenSearch={() => setIsOmnisearchOpen(true)} />
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto flex flex-col relative pb-20 lg:pb-0">
          <div className="p-4 border-b border-stone-100 dark:border-white/5 bg-white/80 dark:bg-stone-900/90 backdrop-blur-xl flex items-center justify-between sticky top-0 z-[140]">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-stone-900 dark:text-gold"><Icons.Menu className="w-6 h-6" /></button>
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo(AppRoute.DASHBOARD)}>
                <MobileLogo className="w-8 h-8" />
                <span className="text-xs font-black uppercase tracking-widest text-gold">Cathedra</span>
             </div>
             <button onClick={() => setIsDark(!isDark)} className="p-2 text-stone-400">{isDark ? <Icons.Star className="w-5 h-5 text-gold" /> : <Icons.History className="w-5 h-5" />}</button>
          </div>

          <div className="flex-1 px-4 md:px-12 py-8 w-full max-w-7xl mx-auto">
            {content}
          </div>

          <Footer onNavigate={navigateTo} />
        </main>

        {/* BOTTOM NAVIGATION MOBILE */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-t border-stone-200 dark:border-white/5 px-6 py-3 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
          {[
            { id: AppRoute.DASHBOARD, icon: Icons.Home, label: 'Início' },
            { id: AppRoute.BIBLE, icon: Icons.Book, label: 'Bíblia' },
            { id: AppRoute.DAILY_LITURGY, icon: Icons.History, label: 'Liturgia' },
            { id: AppRoute.PROFILE, icon: Icons.Users, label: 'Perfil' }
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
