
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
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
import { getIntelligentStudy, getDailyBundle } from './services/gemini';
import { Icons, Logo } from './constants';
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
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('cathedra_dark') === 'true');
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      try {
        await getDailyBundle(lang);
        // Ativa notificações diárias
        await notificationService.scheduleDailyReminder(lang);
      } catch (e) {
        console.error("Erro na sincronização inicial:", e);
      }
      setTimeout(() => setLoading(false), 1500);
    };
    initializeApp();

    // Listener para atualização do PWA
    window.addEventListener('pwa-update-available', () => setUpdateAvailable(true));
    return () => window.removeEventListener('pwa-update-available', () => {});
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('cathedra_lang', lang);
  }, [lang]);

  useEffect(() => {
    const savedUser = localStorage.getItem('cathedra_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
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
    try {
      const result = await getIntelligentStudy(topic, lang);
      setStudyData(result);
      setRoute(AppRoute.STUDY_MODE);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (r: AppRoute) => {
    setRoute(r);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (route) {
      case AppRoute.DASHBOARD: return <Dashboard onSearch={handleSearch} onNavigate={navigateTo} user={user} />;
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
      default: return <Dashboard onSearch={handleSearch} onNavigate={navigateTo} user={user} />;
    }
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      <div className={`flex h-[100dvh] overflow-hidden bg-[#fdfcf8] dark:bg-[#0c0a09] transition-colors duration-500`}>
        
        {updateAvailable && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] bg-gold text-stone-900 px-6 py-3 rounded-full shadow-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-4 animate-bounce">
            Nova luz disponível
            <button onClick={() => window.location.reload()} className="bg-stone-900 text-gold px-3 py-1 rounded-full">Atualizar</button>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-[#fdfcf8] dark:bg-[#0c0a09] animate-in fade-in duration-500">
            <Logo className="w-32 h-32 md:w-64 md:h-64" />
            <div className="mt-8 text-center">
              <h2 className="font-serif font-bold text-3xl text-stone-900 dark:text-[#d4af37] tracking-widest animate-pulse">CATHEDRA</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mt-2">Sincronizando Luz...</p>
            </div>
          </div>
        )}

        <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all duration-500 ${isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none lg:pointer-events-auto'}`}>
          <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-500 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsSidebarOpen(false)} />
          <div className={`relative h-full w-80 max-w-[85vw] transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <Sidebar currentPath={route} onNavigate={navigateTo} onClose={() => setIsSidebarOpen(false)} user={user} onLogout={handleLogout} />
          </div>
        </div>
        
        <main className={`flex-1 overflow-y-auto custom-scrollbar relative flex flex-col pt-[var(--sat)]`}>
          <div className={`lg:hidden p-4 border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-[140]`}>
             <button onClick={() => setIsSidebarOpen(true)} className="p-2">
                <Icons.Menu className="w-6 h-6 text-stone-800 dark:text-stone-200" />
             </button>
             <div className="flex items-center gap-2">
               <Logo className="w-8 h-8" />
               <h1 className="font-serif font-bold text-lg tracking-tighter dark:text-[#d4af37]">Cathedra</h1>
             </div>
             <div className="w-10 h-10" />
          </div>

          <div className={`flex-1 flex flex-col`}>
            <div className={`mx-auto w-full max-w-[1500px] flex-1 p-4 md:p-12 lg:p-16 pb-24`}>
              {renderContent()}
            </div>
            <Footer onNavigate={navigateTo} />
          </div>
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] mobile-nav-blur border-t border-white/10 pb-[var(--sab)] px-2 h-[calc(4.5rem+var(--sab))]">
          <div className="flex items-center justify-around h-full max-w-md mx-auto">
            <button onClick={() => navigateTo(AppRoute.DASHBOARD)} className={`flex flex-col items-center gap-1 transition-all ${route === AppRoute.DASHBOARD ? 'text-gold' : 'text-stone-500'}`}>
              <Icons.Home className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Início</span>
            </button>
            <button onClick={() => navigateTo(AppRoute.BIBLE)} className={`flex flex-col items-center gap-1 transition-all ${route === AppRoute.BIBLE ? 'text-gold' : 'text-stone-500'}`}>
              <Icons.Book className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Bíblia</span>
            </button>
            <button onClick={() => navigateTo(AppRoute.STUDY_MODE)} className="flex flex-col items-center -mt-8">
              <div className="w-14 h-14 bg-gold rounded-full flex items-center justify-center shadow-lg shadow-gold/20 border-4 border-[#1a1a1a]">
                <Icons.Search className="w-7 h-7 text-stone-900" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter mt-1 text-gold">Buscar</span>
            </button>
            <button onClick={() => navigateTo(AppRoute.CATECHISM)} className={`flex flex-col items-center gap-1 transition-all ${route === AppRoute.CATECHISM ? 'text-gold' : 'text-stone-500'}`}>
              <Icons.Cross className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">CIC</span>
            </button>
            <button onClick={() => navigateTo(AppRoute.PROFILE)} className={`flex flex-col items-center gap-1 transition-all ${route === AppRoute.PROFILE || route === AppRoute.LOGIN ? 'text-gold' : 'text-stone-500'}`}>
              <Icons.Users className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Perfil</span>
            </button>
          </div>
        </nav>
      </div>
    </LangContext.Provider>
  );
};

export default App;
