
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
import { AppRoute, StudyResult, User, Language } from './types';
import { getIntelligentStudy } from './services/gemini';
import { Icons, Logo } from './constants';
import { UI_TRANSLATIONS } from './services/translations';

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
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('cathedra_lang') as Language) || 'pt');
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [studyData, setStudyData] = useState<StudyResult | null>(null);
  const [dogmaSearch, setDogmaSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cathedra_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isDark, setIsDark] = useState(() => localStorage.getItem('cathedra_dark') === 'true');

  useEffect(() => { setTimeout(() => setLoading(false), 300); }, []);

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
      
      // Persistência automática no histórico para o Dashboard
      const history = JSON.parse(localStorage.getItem('cathedra_history') || '[]');
      const filtered = history.filter((h: any) => h.topic !== result.topic);
      localStorage.setItem('cathedra_history', JSON.stringify([result, ...filtered].slice(0, 10)));
      
    } catch (e) { console.error(e); } 
  }, [lang]);

  const navigateTo = useCallback((r: AppRoute) => {
    setRoute(r);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const t = useCallback((key: string) => UI_TRANSLATIONS[lang][key] || key, [lang]);

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
      default: return <Dashboard onSearch={handleSearch} onNavigate={navigateTo} user={user} />;
    }
  }, [route, handleSearch, navigateTo, user, studyData, dogmaSearch]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[1000]">
        <Logo className="w-20 h-20 mb-4 animate-pulse" />
        <h1 className="text-2xl font-serif text-yellow-600 tracking-[0.2em]">CATHEDRA</h1>
      </div>
    );
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      <div className="flex h-[100dvh] overflow-hidden bg-[#fdfcf8] dark:bg-[#0c0a09]">
        <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none lg:pointer-events-auto opacity-0 lg:opacity-100'}`}>
          <div className="absolute inset-0 bg-black/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
          <div className={`relative h-full w-80 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <Sidebar currentPath={route} onNavigate={navigateTo} onClose={() => setIsSidebarOpen(false)} user={user} onLogout={() => { setUser(null); localStorage.removeItem('cathedra_user'); }} />
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="lg:hidden p-4 border-b dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-[140]">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-stone-900 dark:text-gold"><Icons.Menu className="w-6 h-6" /></button>
             <Logo className="w-8 h-8" />
             <button onClick={() => setIsDark(!isDark)} className="p-2">{isDark ? <Icons.Globe className="w-5 h-5 text-gold" /> : <Icons.History className="w-5 h-5 text-stone-400" />}</button>
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
