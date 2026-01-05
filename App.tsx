
import React, { useState, useEffect, createContext, useContext } from 'react';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import StudyMode from './pages/StudyMode';
import Bible from './pages/Bible';
import Catechism from './pages/Catechism';
import Saints from './pages/Saints';
import Magisterium from './pages/Magisterium';
import Dogmas from './pages/Dogmas';
import SocialDoctrine from './pages/SocialDoctrine';
import Colloquium from './pages/Colloquium';
import About from './pages/About';
import Aquinas from './pages/Aquinas';
import LiturgicalCalendar from './pages/LiturgicalCalendar';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Community from './pages/Community';
import LectioDivina from './pages/LectioDivina';
import Checkout from './pages/Checkout';
import { AppRoute, StudyResult, User, Language } from './types';
import { getIntelligentStudy } from './services/gemini';
import { trackAccess } from './services/adminService';
import { fetchUserData } from './services/supabase';
import { Icons } from './constants';
import { notificationService } from './services/notifications';
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

export const useTranslation = () => useContext(LangContext);

const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('cathedra_lang') as Language) || 'pt');
  const [studyData, setStudyData] = useState<StudyResult | null>(null);
  const [dogmaSearch, setDogmaSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('cathedra_dark') === 'true');
  const [isCompact, setIsCompact] = useState(() => localStorage.getItem('cathedra_compact') === 'true');
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    localStorage.setItem('cathedra_lang', lang);
  }, [lang]);

  useEffect(() => {
    const savedUser = localStorage.getItem('cathedra_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
    }
    notificationService.scheduleDailyReminder();
  }, []);

  const t = (key: string) => UI_TRANSLATIONS[lang][key] || key;

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('cathedra_dark', String(isDark));
  }, [isDark]);

  const handleLogout = () => {
    localStorage.removeItem('cathedra_user');
    setUser(null);
    setRoute(AppRoute.DASHBOARD);
  };

  const handleSearch = async (topic: string) => {
    if (!topic) {
      setStudyData(null);
      setRoute(AppRoute.STUDY_MODE);
      return;
    }
    setLoading(true);
    setSearchError(null);
    try {
      const result = await getIntelligentStudy(topic, lang);
      setStudyData(result);
      setRoute(AppRoute.STUDY_MODE);
    } catch (e: any) {
      setSearchError(t('search_error'));
      setTimeout(() => setSearchError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (route) {
      case AppRoute.DASHBOARD: return <Dashboard onSearch={handleSearch} onNavigate={setRoute} user={user} />;
      case AppRoute.STUDY_MODE: return <StudyMode data={studyData} onSearch={handleSearch} />;
      case AppRoute.BIBLE: return <Bible onDeepDive={handleSearch} />;
      case AppRoute.CATECHISM: return <Catechism onDeepDive={handleSearch} onNavigateDogmas={(q) => { setDogmaSearch(q); setRoute(AppRoute.DOGMAS); }} />;
      case AppRoute.SAINTS: return <Saints />;
      case AppRoute.MAGISTERIUM: return <Magisterium onDeepDive={handleSearch} />;
      case AppRoute.DOGMAS: return <Dogmas initialQuery={dogmaSearch} />;
      case AppRoute.SOCIAL_DOCTRINE: return <SocialDoctrine />;
      case AppRoute.COLLOQUIUM: return <Colloquium />;
      case AppRoute.ABOUT: return <About />;
      case AppRoute.AQUINAS: return <Aquinas />;
      case AppRoute.LITURGICAL_CALENDAR: return <LiturgicalCalendar />;
      case AppRoute.ADMIN: return <Admin />;
      case AppRoute.COMMUNITY: return <Community user={user} onNavigateLogin={() => setRoute(AppRoute.LOGIN)} />;
      case AppRoute.LECTIO_DIVINA: return <LectioDivina onNavigateDashboard={() => setRoute(AppRoute.DASHBOARD)} />;
      case AppRoute.CHECKOUT: return <Checkout onBack={() => setRoute(AppRoute.DASHBOARD)} />;
      case AppRoute.PROFILE: return user ? <Profile user={user} onLogout={handleLogout} onSelectStudy={(s) => { setStudyData(s); setRoute(AppRoute.STUDY_MODE); }} onNavigateCheckout={() => setRoute(AppRoute.CHECKOUT)} /> : <Login onLogin={setUser} />;
      case AppRoute.LOGIN: return <Login onLogin={(u) => { setUser(u); setRoute(AppRoute.DASHBOARD); }} />;
      default: return <Dashboard onSearch={handleSearch} onNavigate={setRoute} user={user} />;
    }
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      <div className={`flex h-[100dvh] overflow-hidden bg-[#fdfcf8] dark:bg-[#0c0a09] selection:bg-[#d4af37]/30 transition-colors duration-500`}>
        
        {loading && (
          <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-[#fdfcf8]/90 dark:bg-[#0c0a09]/90 backdrop-blur-md">
            <div className="relative mb-12">
              <div className="w-48 h-48 border-[8px] border-[#d4af37]/10 border-t-[#d4af37] rounded-full animate-spin shadow-3xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icons.Cross className="w-12 h-12 text-[#8b0000] animate-pulse" />
              </div>
            </div>
            <h2 className="font-serif italic text-3xl md:text-5xl text-stone-800 dark:text-stone-200 tracking-tighter text-center px-6">
              {t('loading')}
            </h2>
          </div>
        )}

        <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all duration-500 ${isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none lg:pointer-events-auto'}`}>
          <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-500 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsSidebarOpen(false)} />
          <div className={`relative h-full w-80 max-w-[85vw] transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <Sidebar currentPath={route} onNavigate={setRoute} onClose={() => setIsSidebarOpen(false)} user={user} onLogout={handleLogout} />
          </div>
        </div>
        
        <main className={`flex-1 overflow-y-auto custom-scrollbar relative flex flex-col transition-all duration-500`}>
          <div className={`lg:hidden p-5 border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-[140] shadow-sm`}>
             <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-[#fcf8e8] dark:bg-stone-800 border border-[#d4af37]/30 rounded-xl">
                <Icons.Menu className="w-6 h-6 text-stone-800 dark:text-stone-200" />
             </button>
             <h1 className="font-serif font-bold text-xl tracking-tighter text-stone-900 dark:text-[#d4af37]">Cathedra</h1>
             <button onClick={() => user ? setRoute(AppRoute.PROFILE) : setRoute(AppRoute.LOGIN)} className="w-10 h-10 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-[#d4af37]">
                {user ? user.name.charAt(0) : <Icons.Users className="w-5 h-5" />}
             </button>
          </div>

          <div className={`flex-1 flex flex-col transition-all duration-500`}>
            <div className={`mx-auto w-full max-w-[1500px] flex-1 no-print p-6 md:p-12 lg:p-16`}>
              {renderContent()}
            </div>
            <Footer onNavigate={setRoute} />
          </div>
        </main>
      </div>
    </LangContext.Provider>
  );
};

export default App;
