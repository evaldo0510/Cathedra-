
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

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('cathedra_lang') as Language) || 'pt');
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [studyData, setStudyData] = useState<StudyResult | null>(null);
  const [dogmaSearch, setDogmaSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cathedra_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isDark, setIsDark] = useState(() => localStorage.getItem('cathedra_dark') === 'true');

  const { isOnline, isSyncing, wasOffline } = useOfflineMode();

  // TTS States
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTTSSearching, setIsTTSSearching] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
    notificationService.initNotifications(lang);
    return () => stopSpeech();
  }, [lang]);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('cathedra_dark', String(isDark));
  }, [isDark]);

  const stopSpeech = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsTTSSearching(false);
  }, []);

  const handleSearch = useCallback(async (topic: string) => {
    setRoute(AppRoute.STUDY_MODE);
    stopSpeech();
    try {
      const result = await getIntelligentStudy(topic, lang);
      setStudyData(result);
      const history = JSON.parse(localStorage.getItem('cathedra_history') || '[]');
      const filtered = history.filter((h: any) => h.topic !== result.topic);
      localStorage.setItem('cathedra_history', JSON.stringify([result, ...filtered].slice(0, 10)));
    } catch (e) { console.error(e); } 
  }, [lang, stopSpeech]);

  const navigateTo = useCallback((r: AppRoute) => {
    setRoute(r);
    setIsSidebarOpen(false);
    stopSpeech();
    const mainArea = document.querySelector('main');
    if (mainArea) mainArea.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stopSpeech]);

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
      case AppRoute.CERTAMEN: return <Certamen />;
      case AppRoute.POENITENTIA: return <Poenitentia />;
      case AppRoute.ORDO_MISSAE: return <OrdoMissae />;
      case AppRoute.ROSARY: return <Rosary />;
      case AppRoute.VIA_CRUCIS: return <ViaCrucis />;
      case AppRoute.LITANIES: return <Litanies />;
      case AppRoute.PRAYERS: return <Prayers />;
      default: return <Dashboard onSearch={handleSearch} onNavigate={navigateTo} user={user} />;
    }
  }, [route, handleSearch, navigateTo, user, studyData, dogmaSearch]);

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
        
        {/* Offline & Sync Indicators */}
        <div className="fixed top-0 left-0 right-0 z-[1000] pointer-events-none">
          {!isOnline && (
            <div className="bg-sacred text-white py-2 px-6 flex items-center justify-center gap-3 animate-in slide-in-from-top-full duration-500 shadow-2xl pointer-events-auto">
               <Icons.Globe className="w-4 h-4 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Modo Offline: Navegando no Scriptuarium Local</span>
            </div>
          )}
          {isSyncing && isOnline && (
            <div className="bg-gold text-stone-900 py-2 px-6 flex items-center justify-center gap-3 animate-in slide-in-from-top-full duration-500 shadow-2xl pointer-events-auto">
               <div className="w-3 h-3 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Depósito da Fé...</span>
            </div>
          )}
          {isOnline && wasOffline && !isSyncing && (
            <div className="bg-emerald-600 text-white py-2 px-6 flex items-center justify-center gap-3 animate-out fade-out slide-out-to-top duration-1000 pointer-events-auto">
               <Icons.Star className="w-4 h-4 fill-current" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Conexão Restabelecida</span>
            </div>
          )}
        </div>

        <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all duration-500 ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none lg:pointer-events-auto opacity-0 lg:opacity-100'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
          <div className={`relative h-full w-80 shadow-3xl transition-transform duration-500 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <Sidebar currentPath={route} onNavigate={navigateTo} onClose={() => setIsSidebarOpen(false)} user={user} onLogout={() => { setUser(null); localStorage.removeItem('cathedra_user'); }} />
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
          <div className="lg:hidden p-4 border-b border-stone-100 dark:border-white/5 bg-white/80 dark:bg-stone-900/90 backdrop-blur-xl flex items-center justify-between sticky top-0 z-[140]">
             <button onClick={() => setIsSidebarOpen(true)} className="p-3 text-stone-900 dark:text-gold active:scale-90 transition-transform">
               <Icons.Menu className="w-6 h-6" />
             </button>
             <div className="flex flex-col items-center" onClick={() => navigateTo(AppRoute.DASHBOARD)}>
                <MobileLogo className="w-9 h-9" />
                <span className="text-[8px] font-black uppercase tracking-widest text-gold">Cathedra</span>
             </div>
             <button onClick={() => setIsDark(!isDark)} className="p-3 text-stone-400 dark:text-white/20 active:scale-90 transition-transform">
               {isDark ? <Icons.Star className="w-5 h-5 text-gold" /> : <Icons.History className="w-5 h-5" />}
             </button>
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
