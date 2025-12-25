
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
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
import { AppRoute, StudyResult, User } from './types';
import { getIntelligentStudy } from './services/gemini';
import { trackAccess } from './services/adminService';
import { fetchUserData, syncUserData } from './services/supabase';
import { Icons } from './constants';

const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [studyData, setStudyData] = useState<StudyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('cathedra_dark') === 'true');
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // PWA & Notifications State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('cathedra_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      syncWithSupabase(u.id);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleQuotaError = () => setQuotaExceeded(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('cathedra-api-quota-exceeded', handleQuotaError);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('cathedra-api-quota-exceeded', handleQuotaError);
    };
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      setQuotaExceeded(false);
      window.location.reload();
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const syncWithSupabase = async (userId: string) => {
    if (!navigator.onLine) return;
    const remoteData = await fetchUserData(userId);
    if (remoteData) {
      if (remoteData.highlights) localStorage.setItem('cathedra_highlights', JSON.stringify(remoteData.highlights));
      if (remoteData.history) localStorage.setItem('cathedra_history', JSON.stringify(remoteData.history));
    }
  };

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

  useEffect(() => {
    const isPremiumRoute = [AppRoute.STUDY_MODE, AppRoute.COLLOQUIUM, AppRoute.AQUINAS].includes(route);
    trackAccess(!!user, isPremiumRoute);
  }, [route, user]);

  const handleLogout = () => {
    localStorage.removeItem('cathedra_user');
    setUser(null);
    setRoute(AppRoute.DASHBOARD);
  };

  const handleSearch = async (topic: string) => {
    setLoading(true);
    setSearchError(null);
    try {
      const result = await getIntelligentStudy(topic);
      setStudyData(result);
      setRoute(AppRoute.STUDY_MODE);
    } catch (e: any) {
      console.error("Erro na busca:", e);
      setSearchError("O santuário digital está sobrecarregado. Tente uma busca mais curta ou verifique sua cota.");
      setTimeout(() => setSearchError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (route === AppRoute.ADMIN && user?.role !== 'admin') {
      setRoute(AppRoute.DASHBOARD);
      return <Dashboard onSearch={handleSearch} onNavigate={setRoute} user={user} />;
    }

    switch (route) {
      case AppRoute.DASHBOARD: return <Dashboard onSearch={handleSearch} onNavigate={setRoute} user={user} />;
      case AppRoute.STUDY_MODE: return <StudyMode data={studyData} onSearch={handleSearch} />;
      case AppRoute.BIBLE: return <Bible onDeepDive={handleSearch} />;
      case AppRoute.CATECHISM: return <Catechism onDeepDive={handleSearch} />;
      case AppRoute.SAINTS: return <Saints />;
      case AppRoute.MAGISTERIUM: return <Magisterium onDeepDive={handleSearch} />;
      case AppRoute.DOGMAS: return <Dogmas />;
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
    <div className="flex h-screen overflow-hidden bg-[#fdfcf8] dark:bg-[#0c0a09] selection:bg-[#d4af37]/30 selection:text-stone-900 transition-colors duration-500">
      
      {/* Toast de Erro de Busca */}
      {searchError && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[600] bg-[#8b0000] text-white px-8 py-4 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-10">
          <p className="text-[11px] font-black uppercase tracking-widest">{searchError}</p>
        </div>
      )}

      {/* Quota Exceeded Banner */}
      {quotaExceeded && (
        <div className="fixed top-0 left-0 right-0 z-[400] bg-[#8b0000] text-white px-6 py-4 flex items-center justify-between shadow-2xl border-b border-[#d4af37]/40 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <Icons.History className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">Cota de Pesquisa Atingida</p>
              <p className="text-[9px] opacity-80 font-serif italic mt-0.5">
                Para alta performance sem limites, use sua própria chave. 
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline ml-1 font-bold">Verificar Billing</a>
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setQuotaExceeded(false)} className="text-[9px] font-black uppercase tracking-widest opacity-60 hover:opacity-100">Ignorar</button>
            <button 
              onClick={handleOpenKeyDialog}
              className="px-6 py-2.5 bg-[#d4af37] text-stone-900 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95"
            >
              Fornecer Minha Chave
            </button>
          </div>
        </div>
      )}

      {showInstallBanner && !quotaExceeded && (
        <div className="fixed top-0 left-0 right-0 z-[300] bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 px-6 py-4 flex items-center justify-between animate-in slide-in-from-top duration-700 shadow-2xl border-b border-[#d4af37]/20">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/10 dark:bg-black/10 rounded-lg">
              <Icons.Layout className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">Instalar Cathedra Pro</p>
              <p className="text-[9px] opacity-60 font-serif italic mt-0.5">Acesse o santuário offline da sua tela inicial.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowInstallBanner(false)} className="text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Agora não</button>
            <button 
              onClick={handleInstallClick}
              className="px-6 py-2.5 bg-[#d4af37] dark:bg-stone-900 text-stone-900 dark:text-[#d4af37] rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
            >
              Baixar Agora
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-[#fdfcf8]/90 dark:bg-[#0c0a09]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative mb-12">
            <div className="w-48 h-48 border-[8px] border-[#d4af37]/10 border-t-[#d4af37] rounded-full animate-spin shadow-3xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icons.Cross className="w-12 h-12 text-[#8b0000] animate-pulse" />
            </div>
          </div>
          <h2 className="font-serif italic text-5xl text-stone-800 dark:text-stone-200 tracking-tighter">Sintetizando a Tradição...</h2>
        </div>
      )}

      <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all duration-500 ${isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none lg:pointer-events-auto'}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-500 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsSidebarOpen(false)} />
        <div className={`relative h-full w-80 max-w-[85vw] transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <Sidebar currentPath={route} onNavigate={setRoute} onClose={() => setIsSidebarOpen(false)} user={user} onLogout={handleLogout} />
        </div>
      </div>
      
      <main className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
        <div className="lg:hidden p-5 border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-[140] shadow-sm">
           <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-[#fcf8e8] dark:bg-stone-800 border border-[#d4af37]/30 rounded-xl active:scale-95">
              <Icons.Menu className="w-6 h-6 text-stone-800 dark:text-stone-200" />
           </button>
           <h1 className="font-serif font-bold text-xl tracking-tighter text-stone-900 dark:text-[#d4af37] leading-none">Cathedra</h1>
           <div className="flex gap-2">
             <button onClick={() => setIsDark(!isDark)} className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center justify-center text-[#d4af37]">
                {isDark ? <Icons.History className="w-5 h-5" /> : <Icons.Globe className="w-5 h-5" />}
             </button>
             <button onClick={() => user ? setRoute(AppRoute.PROFILE) : setRoute(AppRoute.LOGIN)} className="w-10 h-10 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-[#d4af37] shadow-lg">
                {user ? user.name.charAt(0) : <Icons.Users className="w-5 h-5" />}
             </button>
           </div>
        </div>

        <div className="p-6 md:p-12 lg:p-16 flex-1">
          <div className="max-w-[1500px] mx-auto h-full no-print">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
