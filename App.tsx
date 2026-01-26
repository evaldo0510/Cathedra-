
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
import Favorites from './pages/Favorites';
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
  const [studyData, setStudyData] = useState<StudyResult | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOmnisearchOpen, setIsOmnisearchOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cathedra_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isDark, setIsDark] = useState(() => localStorage.getItem('cathedra_dark') === 'true');

  const connectivity = useOfflineMode();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200);
    notificationService.initNotifications(lang);
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      console.log('Evento beforeinstallprompt capturado');
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [lang, isDark]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        alert("Para baixar no iPhone:\n1. Toque no botão de 'Compartilhar' (ícone quadrado com seta)\n2. Role para baixo e selecione 'Adicionar à Tela de Início'.");
      } else {
        alert("A opção de instalação ainda não está disponível. Tente atualizar a página ou verifique se já possui o app instalado no menu do navegador.");
      }
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuário respondeu à instalação: ${outcome}`);
    if (outcome === 'accepted') setDeferredPrompt(null);
  }, [deferredPrompt]);

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
      case AppRoute.LITURGICAL_CALENDAR: return <LiturgicalCalendar />;
      case AppRoute.STUDY_MODE: return <StudyMode data={studyData} onSearch={handleSearch} />;
      case AppRoute.PROFILE: return user ? <Profile user={user} onLogout={() => { setUser(null); localStorage.removeItem('cathedra_user'); }} onSelectStudy={(s) => { setStudyData(s); setRoute(AppRoute.STUDY_MODE); }} onNavigateCheckout={() => setRoute(AppRoute.CHECKOUT)} /> : <Login onLogin={setUser} />;
      case AppRoute.CATECHISM: return <Catechism onDeepDive={handleSearch} />;
      case AppRoute.MAGISTERIUM: return <Magisterium />;
      case AppRoute.DOGMAS: return <Dogmas />;
      case AppRoute.SAINTS: return <Saints />;
      case AppRoute.AQUINAS_OPERA: return <AquinasOpera />;
      case AppRoute.PRAYERS: return <Prayers />;
      case AppRoute.COMMUNITY: return <Community user={user} onNavigateLogin={() => setRoute(AppRoute.LOGIN)} />;
      case AppRoute.LECTIO_DIVINA: return <LectioDivina onNavigateDashboard={() => setRoute(AppRoute.DASHBOARD)} />;
      case AppRoute.CERTAMEN: return <Certamen />;
      case AppRoute.POENITENTIA: return <Poenitentia />;
      case AppRoute.ORDO_MISSAE: return <OrdoMissae />;
      case AppRoute.ROSARY: return <Rosary />;
      case AppRoute.VIA_CRUCIS: return <ViaCrucis />;
      case AppRoute.LITANIES: return <Litanies />;
      case AppRoute.FAVORITES: return <Favorites />;
      case AppRoute.DIAGNOSTICS: return <Diagnostics />;
      case AppRoute.CHECKOUT: return <Checkout onBack={() => setRoute(AppRoute.DASHBOARD)} />;
      case AppRoute.LOGIN: return <Login onLogin={(u) => { setUser(u); setRoute(AppRoute.DASHBOARD); }} />;
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
        
        <main className="flex-1 overflow-y-auto flex flex-col relative pb-20 lg:pb-0">
          <div className="p-3 md:p-4 border-b border-stone-100 dark:border-white/5 bg-white/90 dark:bg-stone-900/95 backdrop-blur-2xl flex items-center justify-between sticky top-0 z-[140] shadow-sm">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-stone-900 dark:text-gold hover:bg-stone-50 dark:hover:bg-white/5 rounded-xl transition-colors"><Icons.Menu className="w-6 h-6" /></button>
             
             <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo(AppRoute.DASHBOARD)}>
                <Logo className="w-10 h-10 md:w-11 md:h-11 transition-transform duration-700 group-hover:scale-110 group-active:scale-95" />
                <div className="flex flex-col">
                  <span className="text-sm md:text-base font-serif font-black uppercase tracking-[0.25em] text-stone-900 dark:text-gold leading-none">Cathedra</span>
                  <span className="text-[7px] font-black uppercase tracking-[0.4em] text-stone-400 dark:text-stone-500 leading-none mt-1">Digital Sanctuarium</span>
                </div>
             </div>

             <button 
              onClick={() => {
                const next = !isDark;
                setIsDark(next);
                localStorage.setItem('cathedra_dark', String(next));
              }} 
              className="p-3 bg-stone-50 dark:bg-stone-800/50 text-stone-400 hover:text-gold rounded-2xl border border-stone-100 dark:border-stone-700 transition-all active:scale-90"
             >
              {isDark ? <Icons.Star className="w-5 h-5 text-gold fill-current" /> : <Icons.History className="w-5 h-5" />}
             </button>
          </div>

          <div className="flex-1 px-4 md:px-12 py-8 w-full max-w-7xl mx-auto">
            {content}
          </div>

          <Footer onNavigate={navigateTo} />
        </main>

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
