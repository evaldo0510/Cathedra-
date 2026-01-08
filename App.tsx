
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

export const useTranslation = () => useContext(LangContext);

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('cathedra_lang') as Language) || 'pt');
  
  // Loading ultra-rápido para shell da aplicação
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Liberação imediata assim que o JS básico rodar
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [studyData, setStudyData] = useState<StudyResult | null>(null);
  const [dogmaSearch, setDogmaSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('cathedra_dark') === 'true');

  useEffect(() => {
    localStorage.setItem('cathedra_lang', lang);
  }, [lang]);

  useEffect(() => {
    const savedUser = localStorage.getItem('cathedra_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('cathedra_dark', String(isDark));
  }, [isDark]);

  const handleSearch = useCallback(async (topic: string) => {
    if (!topic) {
      setStudyData(null);
      setRoute(AppRoute.STUDY_MODE);
      return;
    }
    // Não bloqueia a navegação, apenas entra em modo loading interno
    setRoute(AppRoute.STUDY_MODE);
    try {
      const result = await getIntelligentStudy(topic, lang);
      setStudyData(result);
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
      case AppRoute.PROFILE: return user ? <Profile user={user} onLogout={() => setUser(null)} onSelectStudy={(s) => { setStudyData(s); setRoute(AppRoute.STUDY_MODE); }} onNavigateCheckout={() => setRoute(AppRoute.CHECKOUT)} /> : <Login onLogin={setUser} />;
      case AppRoute.LOGIN: return <Login onLogin={(u) => { setUser(u); setRoute(AppRoute.DASHBOARD); }} />;
      default: return <Dashboard onSearch={handleSearch} onNavigate={navigateTo} user={user} />;
    }
  }, [route, handleSearch, navigateTo, user, studyData, dogmaSearch]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[1000] transition-opacity duration-300">
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
            <Sidebar currentPath={route} onNavigate={navigateTo} onClose={() => setIsSidebarOpen(false)} user={user} onLogout={() => setUser(null)} />
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="lg:hidden p-4 border-b dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-[140]">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 transition-transform active:scale-90"><Icons.Menu className="w-6 h-6" /></button>
             <div className="flex items-center gap-2">
               <Logo className="w-8 h-8" />
               <span className="font-serif font-bold text-lg dark:text-gold tracking-tighter">Cathedra</span>
             </div>
             <button onClick={() => setIsDark(!isDark)} className="p-2 transition-transform active:scale-90">{isDark ? <Icons.Globe className="w-5 h-5 text-gold" /> : <Icons.History className="w-5 h-5" />}</button>
          </div>

          <div className="flex-1 p-4 md:p-12 lg:p-16 pb-24 max-w-[1400px] mx-auto w-full">
            {content}
          </div>
          <Footer onNavigate={navigateTo} />
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] mobile-nav-blur border-t border-white/10 px-2 h-20">
          <div className="flex items-center justify-around h-full">
            <button onClick={() => navigateTo(AppRoute.DASHBOARD)} className={`flex flex-col items-center gap-1 ${route === AppRoute.DASHBOARD ? 'text-gold' : 'text-stone-500'}`}>
              <Icons.Home className="w-6 h-6" />
              <span className="text-[8px] font-black uppercase tracking-widest">Início</span>
            </button>
            <button onClick={() => navigateTo(AppRoute.BIBLE)} className={`flex flex-col items-center gap-1 ${route === AppRoute.BIBLE ? 'text-gold' : 'text-stone-500'}`}>
              <Icons.Book className="w-6 h-6" />
              <span className="text-[8px] font-black uppercase tracking-widest">Bíblia</span>
            </button>
            <button onClick={() => navigateTo(AppRoute.STUDY_MODE)} className="w-14 h-14 bg-gold rounded-full flex items-center justify-center -mt-8 shadow-2xl border-4 border-stone-900 transition-transform active:scale-90">
              <Icons.Search className="w-7 h-7 text-stone-900" />
            </button>
            <button onClick={() => navigateTo(AppRoute.CATECHISM)} className={`flex flex-col items-center gap-1 ${route === AppRoute.CATECHISM ? 'text-gold' : 'text-stone-500'}`}>
              <Icons.Cross className="w-6 h-6" />
              <span className="text-[8px] font-black uppercase tracking-widest">CIC</span>
            </button>
            <button onClick={() => navigateTo(AppRoute.PROFILE)} className={`flex flex-col items-center gap-1 ${route === AppRoute.PROFILE ? 'text-gold' : 'text-stone-500'}`}>
              <Icons.Users className="w-6 h-6" />
              <span className="text-[8px] font-black uppercase tracking-widest">Perfil</span>
            </button>
          </div>
        </nav>
      </div>
    </LangContext.Provider>
  );
};

export default App;
