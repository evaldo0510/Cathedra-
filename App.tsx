
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
import { AppRoute, StudyResult, User } from './types';
import { getIntelligentStudy } from './services/gemini';
import { trackAccess } from './services/adminService';
import { Icons } from './constants';

const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [studyData, setStudyData] = useState<StudyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('cathedra_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      const highlights = JSON.parse(localStorage.getItem('cathedra_highlights') || '[]');
      const history = JSON.parse(localStorage.getItem('cathedra_history') || '[]');
      u.stats = {
        versesSaved: highlights.length,
        studiesPerformed: history.length,
        daysActive: 7 
      };
      setUser(u);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    if (!user) {
      setRoute(AppRoute.LOGIN);
      return;
    }

    setLoading(true);
    try {
      const result = await getIntelligentStudy(topic);
      setStudyData(result);
      setRoute(AppRoute.STUDY_MODE);
      const history = JSON.parse(localStorage.getItem('cathedra_history') || '[]');
      const newHistory = [result, ...history.filter((h: any) => h.topic !== result.topic)].slice(0, 10);
      localStorage.setItem('cathedra_history', JSON.stringify(newHistory));
    } catch (e: any) {
      console.error("Erro na busca:", e);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    const premiumRoutes = [AppRoute.STUDY_MODE, AppRoute.COLLOQUIUM, AppRoute.AQUINAS];
    if (premiumRoutes.includes(route) && !user) {
      return <Login onLogin={(u) => { setUser(u); setRoute(route); }} />;
    }

    if (route === AppRoute.ADMIN && user?.role !== 'admin') {
      setRoute(AppRoute.DASHBOARD);
      return <Dashboard onSearch={handleSearch} onNavigate={setRoute} user={user} />;
    }

    switch (route) {
      case AppRoute.DASHBOARD:
        return <Dashboard onSearch={handleSearch} onNavigate={setRoute} user={user} />;
      case AppRoute.STUDY_MODE:
        return <StudyMode data={studyData} onSearch={handleSearch} />;
      case AppRoute.BIBLE:
        return <Bible onDeepDive={handleSearch} />;
      case AppRoute.CATECHISM:
        return <Catechism onDeepDive={handleSearch} />;
      case AppRoute.SAINTS:
        return <Saints />;
      case AppRoute.MAGISTERIUM:
        return <Magisterium />;
      case AppRoute.DOGMAS:
        return <Dogmas />;
      case AppRoute.SOCIAL_DOCTRINE:
        return <SocialDoctrine />;
      case AppRoute.COLLOQUIUM:
        return <Colloquium />;
      case AppRoute.ABOUT:
        return <About />;
      case AppRoute.AQUINAS:
        return <Aquinas />;
      case AppRoute.LITURGICAL_CALENDAR:
        return <LiturgicalCalendar />;
      case AppRoute.ADMIN:
        return <Admin />;
      case AppRoute.COMMUNITY:
        return <Community user={user} onNavigateLogin={() => setRoute(AppRoute.LOGIN)} />;
      case AppRoute.PROFILE:
        return user ? (
          <Profile 
            user={user} 
            onLogout={handleLogout} 
            onSelectStudy={(s) => { setStudyData(s); setRoute(AppRoute.STUDY_MODE); }} 
          />
        ) : <Login onLogin={setUser} />;
      case AppRoute.LOGIN:
        return <Login onLogin={(u) => { setUser(u); setRoute(AppRoute.DASHBOARD); }} />;
      default:
        return <Dashboard onSearch={handleSearch} onNavigate={setRoute} user={user} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fdfcf8] selection:bg-[#d4af37]/30 selection:text-stone-900">
      {!isOnline && (
        <div className="fixed top-6 right-6 z-[200] bg-stone-900/90 text-[#d4af37] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-[#d4af37]/20 backdrop-blur-md animate-in slide-in-from-right duration-500">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_#f59e0b]" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest">Estado Offline</span>
            <span className="text-[8px] text-white/50 uppercase tracking-tighter">Acessando Depósito em Cache</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#fdfcf8]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative mb-12">
            <div className="w-48 h-48 border-[8px] border-[#d4af37]/10 border-t-[#d4af37] rounded-full animate-spin shadow-3xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icons.Cross className="w-12 h-12 text-[#8b0000] animate-pulse" />
            </div>
          </div>
          <h2 className="font-serif italic text-5xl text-stone-800 tracking-tighter">Sintetizando a Tradição...</h2>
        </div>
      )}

      <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all duration-500 ${isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none lg:pointer-events-auto'}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-500 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsSidebarOpen(false)} />
        <div className={`relative h-full w-80 max-w-[85vw] transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <Sidebar currentPath={route} onNavigate={setRoute} onClose={() => setIsSidebarOpen(false)} user={user} onLogout={handleLogout} />
        </div>
      </div>
      
      <main className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
        <div className="lg:hidden p-5 border-b border-stone-200 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-[140] shadow-sm">
           <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-[#fcf8e8] border border-[#d4af37]/30 rounded-xl active:scale-95">
              <Icons.Menu className="w-6 h-6 text-stone-800" />
           </button>
           <h1 className="font-serif font-bold text-xl tracking-tighter text-stone-900 leading-none">Cathedra</h1>
           <button onClick={() => user ? setRoute(AppRoute.PROFILE) : setRoute(AppRoute.LOGIN)} className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-[#d4af37] shadow-lg">
              {user ? user.name.charAt(0) : <Icons.Users className="w-5 h-5" />}
           </button>
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
