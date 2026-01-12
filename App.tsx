
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
    // Para o áudio da Web Audio API (Gemini)
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    // Para o áudio do browser (SpeechSynthesis Fallback)
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsTTSSearching(false);
  }, []);

  const handleToggleSpeech = async () => {
    if (isSpeaking || isTTSSearching) {
      stopSpeech();
      return;
    }

    // 1. Extração de texto do conteúdo atual de forma limpa
    const mainContent = document.querySelector('main article, main section, .page-enter');
    if (!mainContent) return;

    const elements = mainContent.querySelectorAll('h1, h2, h3, p, li');
    let textToRead = "";
    elements.forEach(el => {
      if (!el.closest('button') && !el.closest('nav') && !el.closest('footer')) {
        const text = el.textContent?.trim();
        if (text) textToRead += text + ". ";
      }
    });

    // Sanitização básica: remove quebras de linha excessivas e espaços duplos
    textToRead = textToRead.replace(/\s+/g, ' ').trim();

    if (!textToRead) return;

    setIsTTSSearching(true);

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // IMPORTANTE: Resume o contexto de áudio (obrigatório em muitos browsers após interação)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Tenta o TTS Profissional do Gemini (limite seguro de 2000 caracteres para evitar timeout)
      const base64Data = await generateSpeech(textToRead.slice(0, 2000)); 
      
      if (base64Data) {
        const audioBuffer = await decodeAudioData(
          decodeBase64(base64Data),
          audioContextRef.current,
          24000,
          1
        );

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        
        source.onended = () => {
          setIsSpeaking(false);
          audioSourceRef.current = null;
        };

        audioSourceRef.current = source;
        setIsTTSSearching(false);
        setIsSpeaking(true);
        source.start(0);
      } else {
        // Se base64Data for nulo, lança erro para cair no fallback
        throw new Error("Gemini TTS failed");
      }
    } catch (err) {
      console.warn("Gemini TTS falhou. Acionando Fallback Lectorium nativo...", err);
      
      // Fallback: Web Speech API (Browser Nativo)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(textToRead.slice(0, 3000));
        utterance.lang = lang === 'pt' ? 'pt-BR' : lang === 'la' ? 'it-IT' : lang; // Latim soa melhor com motor italiano
        utterance.rate = 0.9; // Um pouco mais lento para ser solene
        
        utterance.onstart = () => {
          setIsTTSSearching(false);
          setIsSpeaking(true);
        };
        utterance.onend = () => {
          setIsSpeaking(false);
        };
        utterance.onerror = () => {
          setIsTTSSearching(false);
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        setIsTTSSearching(false);
        setIsSpeaking(false);
      }
    }
  };

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
        {/* Sidebar adaptativo */}
        <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all duration-500 ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none lg:pointer-events-auto opacity-0 lg:opacity-100'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
          <div className={`relative h-full w-80 shadow-3xl transition-transform duration-500 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <Sidebar currentPath={route} onNavigate={navigateTo} onClose={() => setIsSidebarOpen(false)} user={user} onLogout={() => { setUser(null); localStorage.removeItem('cathedra_user'); }} />
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
          {/* Header Mobile Otimizado */}
          <div className="lg:hidden p-4 border-b border-stone-100 dark:border-white/5 bg-white/80 dark:bg-stone-900/90 backdrop-blur-xl flex items-center justify-between sticky top-0 z-[140]">
             <button onClick={() => setIsSidebarOpen(true)} className="p-3 text-stone-900 dark:text-gold active:scale-90 transition-transform">
               <Icons.Menu className="w-6 h-6" />
             </button>
             <div className="flex flex-col items-center" onClick={() => navigateTo(AppRoute.DASHBOARD)}>
                <MobileLogo className="w-9 h-9" />
                <span className="text-[8px] font-black uppercase tracking-widest text-gold mt-1">Cathedra</span>
             </div>
             <button onClick={() => setIsDark(!isDark)} className="p-3 text-stone-400 dark:text-white/20 active:scale-90 transition-transform">
               {isDark ? <Icons.Globe className="w-5 h-5 text-gold" /> : <Icons.History className="w-5 h-5" />}
             </button>
          </div>

          {/* Lectorium (Floating TTS Controls) */}
          <div className="fixed bottom-24 right-8 z-[200] md:bottom-12 md:right-12 group">
             <div className={`absolute -top-12 right-0 bg-stone-900 text-gold text-[8px] font-black uppercase px-4 py-2 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity tracking-widest border border-gold/20 shadow-2xl`}>
                {isTTSSearching ? 'Preparando Voz Magisterial...' : isSpeaking ? 'Silenciar Áudio' : 'Ouvir Conteúdo'}
             </div>
             <button 
               onClick={handleToggleSpeech}
               className={`w-16 h-16 rounded-full shadow-3xl flex items-center justify-center transition-all active:scale-90 border-2 ${
                 isTTSSearching ? 'bg-gold border-gold' : 
                 isSpeaking ? 'bg-sacred border-sacred animate-pulse' : 
                 'bg-white dark:bg-stone-800 border-stone-100 dark:border-white/10 hover:border-gold'
               }`}
             >
                {isTTSSearching ? (
                  <div className="w-6 h-6 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                ) : isSpeaking ? (
                  <Icons.Stop className="w-6 h-6 text-white" />
                ) : (
                  <Icons.Audio className={`w-6 h-6 ${isSpeaking ? 'text-white' : 'text-gold'}`} />
                )}
             </button>
             
             {isSpeaking && (
               <div className="absolute top-1/2 -left-12 -translate-y-1/2 flex items-center gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-1 bg-white/40 rounded-full animate-bounce`} style={{ height: `${i * 6}px`, animationDelay: `${i * 0.2}s` }} />
                  ))}
               </div>
             )}
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
