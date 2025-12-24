
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
import { AppRoute, StudyResult } from './types';
import { getIntelligentStudy } from './services/gemini';
import { Icons } from './constants';

const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [studyData, setStudyData] = useState<StudyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(!!process.env.API_KEY);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkApiKeyStatus = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      const hasSelected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasSelected || !!process.env.API_KEY);
    }
  };

  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setQuotaExceeded(false);
    }
  };

  const handleSearch = async (topic: string) => {
    setLoading(true);
    setQuotaExceeded(false);
    try {
      const result = await getIntelligentStudy(topic);
      setStudyData(result);
      setRoute(AppRoute.STUDY_MODE);
      const history = JSON.parse(localStorage.getItem('cathedra_history') || '[]');
      const newHistory = [result, ...history.filter((h: any) => h.topic !== result.topic)].slice(0, 10);
      localStorage.setItem('cathedra_history', JSON.stringify(newHistory));
    } catch (e: any) {
      console.error("Erro na busca:", e);
      const errorMsg = e?.message || e?.toString() || "";
      if (
        errorMsg.includes("API_KEY_RESET_REQUIRED") || 
        errorMsg.includes('Requested entity was not found') ||
        errorMsg.includes('RESOURCE_EXHAUSTED') ||
        errorMsg.includes('429')
      ) {
        setQuotaExceeded(true);
      } else if (errorMsg.includes("OFFLINE") || !isOnline) {
        alert("Sem conexão. Este conteúdo será carregado do cache se disponível.");
      } else {
        alert("Ocorreu um erro inesperado ao processar o estudo. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (route) {
      case AppRoute.DASHBOARD:
        return <Dashboard onSearch={handleSearch} onNavigate={setRoute} />;
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
      default:
        return <Dashboard onSearch={handleSearch} onNavigate={setRoute} />;
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
          <button 
            onClick={() => setLoading(false)}
            className="absolute top-10 right-10 p-5 bg-white rounded-full shadow-2xl hover:bg-stone-100 transition-all text-stone-400"
            title="Cancelar Carregamento"
          >
            <Icons.Cross className="w-8 h-8 rotate-45" />
          </button>
          <div className="relative mb-12">
            <div className="w-48 h-48 border-[8px] border-[#d4af37]/10 border-t-[#d4af37] rounded-full animate-spin shadow-3xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icons.Cross className="w-12 h-12 text-[#8b0000] animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-6 px-8">
            <h2 className="font-serif italic text-5xl text-stone-800 tracking-tighter">Sintetizando a Tradição...</h2>
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.8em] animate-pulse">Acessando o Depósito da Fé</p>
          </div>
        </div>
      )}

      {quotaExceeded && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md animate-in fade-in zoom-in duration-300">
           <div className="bg-[#fdfcf8] max-w-xl w-full rounded-[4rem] p-16 shadow-3xl text-center border-t-[12px] border-[#8b0000] space-y-10">
              <div className="flex justify-center">
                <div className="p-8 bg-[#8b0000]/10 rounded-full">
                  <Icons.Cross className="w-12 h-12 text-[#8b0000]" />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-serif font-bold text-stone-900">Limite de Consultas</h3>
                <p className="text-stone-500 font-serif italic text-xl leading-relaxed">
                  A API gratuita atingiu o limite temporário de consultas. Para continuar seus estudos sem interrupções, você pode configurar sua própria chave.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleOpenKeySelector}
                  className="w-full py-6 bg-[#1a1a1a] text-[#d4af37] rounded-full text-xs font-black uppercase tracking-[0.4em] hover:bg-[#8b0000] hover:text-white transition-all shadow-xl"
                >
                  Configurar Minha Chave
                </button>
                <button 
                  onClick={() => setQuotaExceeded(false)}
                  className="w-full py-6 bg-stone-100 text-stone-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all"
                >
                  Continuar com API Gratuita (Aguardar)
                </button>
              </div>
           </div>
        </div>
      )}

      <div 
        className={`fixed inset-0 z-[150] lg:relative lg:block transition-all duration-500 ${isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none lg:pointer-events-auto'}`}
      >
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-500 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`} 
          onClick={() => setIsSidebarOpen(false)} 
        />
        <div className={`relative h-full w-80 max-w-[85vw] transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <Sidebar 
            currentPath={route} 
            onNavigate={(r) => { 
              setRoute(r); 
              if (r !== AppRoute.STUDY_MODE) setStudyData(null);
            }} 
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      </div>
      
      <main className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
        <div className="lg:hidden p-5 border-b border-stone-200 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-[140] shadow-sm">
           <button 
             onClick={() => setIsSidebarOpen(true)} 
             className="p-3 bg-[#fcf8e8] border border-[#d4af37]/30 rounded-xl active:scale-95 transition-transform"
             aria-label="Abrir Menu"
           >
              <Icons.Menu className="w-6 h-6 text-stone-800" />
           </button>
           <div className="flex flex-col items-center">
             <h1 className="font-serif font-bold text-xl tracking-tighter text-stone-900 leading-none">Cathedra</h1>
             <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#d4af37] mt-1">Digital</p>
           </div>
           <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-[#d4af37] shadow-lg border border-[#d4af37]/20">
              <Icons.Cross className="w-6 h-6" />
           </div>
        </div>

        <div className="p-6 md:p-12 lg:p-16 flex-1">
          {!hasApiKey && (
            <div className="mb-8 md:mb-12 bg-[#1a1a1a] border-l-[10px] border-[#d4af37] text-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] flex flex-col md:flex-row items-center justify-between shadow-3xl animate-in slide-in-from-top duration-700">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-6 md:mb-0 text-center md:text-left">
                <div className="p-4 bg-[#d4af37] rounded-full">
                  <Icons.Cross className="w-6 h-6 md:w-8 md:h-8 text-stone-900" />
                </div>
                <div className="space-y-2">
                  <p className="text-base md:text-lg font-black uppercase tracking-[0.4em] text-[#d4af37]">Modo de Acesso</p>
                  <p className="text-xs md:text-sm text-white/70 italic font-serif leading-relaxed max-w-md">
                    Você está usando a API gratuita. Para recursos avançados ou maior cota de uso, configure sua própria chave.
                  </p>
                </div>
              </div>
              <button onClick={handleOpenKeySelector} className="w-full md:w-auto bg-white text-[#1a1a1a] px-10 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.5em] hover:bg-[#d4af37] transition-all active:scale-95">Configurar Chave Própria</button>
            </div>
          )}

          <div className="max-w-[1500px] mx-auto h-full no-print">
            {renderContent()}
          </div>
        </div>
      </main>

      <style>{`
        .animate-spin-slow { animation: spin 5s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 20px; border: 3px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4af37; }
        @media (max-width: 1023px) { .custom-scrollbar::-webkit-scrollbar { width: 0px; } }
      `}</style>
    </div>
  );
};

export default App;
