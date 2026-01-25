
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { offlineStorage } from '../services/offlineStorage';
import { CATHOLIC_BIBLE_BOOKS, getCatholicCanon } from '../services/bibleLocal';
import { useOfflineMode } from '../hooks/useOfflineMode';

const Diagnostics: React.FC = () => {
  const connectivity = useOfflineMode();
  const [swStatus, setSwStatus] = useState<string>('Detectando...');
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [verseCount, setVerseCount] = useState<number>(0);
  const [preservedBooks, setPreservedBooks] = useState<Set<string>>(new Set());
  const [cacheEntries, setCacheEntries] = useState<string[]>([]);
  const [isClearing, setIsClearing] = useState(false);

  const CANON = getCatholicCanon();

  const refreshData = async () => {
    // 1. SW Check
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      setSwRegistration(reg || null);
      if (reg) {
        setSwStatus(reg.active ? 'Ativo' : reg.installing ? 'Instalando' : 'Registrado');
      } else {
        setSwStatus('Não Encontrado');
      }
    }

    // 2. Storage Check
    try {
      await offlineStorage.init();
      const books = await offlineStorage.getDownloadedBooks();
      setPreservedBooks(books);
      
      // Contagem manual de versículos para diagnóstico (IndexedDB)
      const db = (offlineStorage as any).db as IDBDatabase;
      if (db) {
        const transaction = db.transaction(['bible_verses'], 'readonly');
        const store = transaction.objectStore('bible_verses');
        const countReq = store.count();
        countReq.onsuccess = () => setVerseCount(countReq.result);
      }
    } catch (e) {
      console.error("Erro no diagnóstico de storage:", e);
    }

    // 3. Cache API Check
    if ('caches' in window) {
      const keys = await caches.keys();
      setCacheEntries(keys);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const clearStorage = async () => {
    if (!confirm("Isso removerá todos os versículos e parágrafos salvos localmente. Continuar?")) return;
    setIsClearing(true);
    try {
      const db = (offlineStorage as any).db as IDBDatabase;
      if (db) {
        const transaction = db.transaction(['bible_verses'], 'readwrite');
        transaction.objectStore('bible_verses').clear();
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      await refreshData();
      alert("Memória purgada com sucesso.");
    } catch (e) {
      alert("Erro ao limpar memória.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
      <header className="text-center space-y-4">
        <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Codex Diagnosticum</h2>
        <p className="text-stone-400 italic text-xl">Auditoria Técnica de Integridade Offline</p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* CARD: SERVICE WORKER */}
        <section className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-6">
           <div className="flex items-center gap-4 text-gold">
              <Icons.Globe className="w-6 h-6" />
              <h3 className="font-serif font-bold text-2xl">PWA & Workers</h3>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-stone-400">Status do Worker</span>
                 <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${swStatus === 'Ativo' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{swStatus}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-stone-400">Escopo</span>
                 <span className="text-[10px] font-mono opacity-60">{swRegistration?.scope || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-stone-400">Caches Ativos</span>
                 <span className="text-[10px] font-black text-gold">{cacheEntries.length} Grupos</span>
              </div>
           </div>
        </section>

        {/* CARD: STORAGE INTEGRITY */}
        <section className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-6">
           <div className="flex items-center gap-4 text-sacred">
              <Icons.History className="w-6 h-6" />
              <h3 className="font-serif font-bold text-2xl">Memória de Pedra</h3>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-stone-400">Versículos Locais</span>
                 <span className="text-2xl font-serif font-bold text-stone-900 dark:text-white">{verseCount}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-stone-400">Livros Preservados</span>
                 <span className="text-lg font-serif font-bold text-emerald-500">{preservedBooks.size} / 73</span>
              </div>
              <button 
                onClick={clearStorage}
                disabled={isClearing}
                className="w-full py-3 bg-sacred/5 text-sacred border border-sacred/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-sacred hover:text-white transition-all disabled:opacity-30"
              >
                Purgar Memória Local
              </button>
           </div>
        </section>

        {/* CARD: CONNECTIVITY */}
        <section className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-6">
           <div className="flex items-center gap-4 text-emerald-500">
              <div className={`w-3 h-3 rounded-full ${connectivity.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <h3 className="font-serif font-bold text-2xl">Conectividade</h3>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-stone-400">Modo de Operação</span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-stone-600 dark:text-stone-300">{connectivity.isOnline ? 'Santuário Online' : 'Santuário Offline'}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-stone-400">Qualidade da Rede</span>
                 <span className="text-[10px] font-black uppercase text-gold">{(navigator as any).connection?.effectiveType || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-stone-400">Sincronização</span>
                 <span className="text-[10px] font-black uppercase text-stone-300">{connectivity.isSyncing ? 'Ativa...' : 'Ociosa'}</span>
              </div>
           </div>
        </section>
      </div>

      {/* DETALHE DO CÂNON BÍBLICO */}
      <section className="bg-white dark:bg-stone-900 p-10 md:p-16 rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-2xl space-y-12">
         <header className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-stone-50 dark:border-stone-800 pb-10">
            <div>
               <h3 className="text-3xl font-serif font-bold">Auditoria do Cânon Católico</h3>
               <p className="text-stone-400 italic font-serif">Conformidade com o Concílio de Trento (1546)</p>
            </div>
            <div className="flex gap-4">
               <div className="px-6 py-3 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Icons.Pin className="w-3 h-3" /> {preservedBooks.size} Disponíveis Offline
               </div>
            </div>
         </header>

         <div className="space-y-16">
            {Object.entries(CANON).map(([testament, categories]) => (
              <div key={testament} className="space-y-10">
                 <h4 className="text-2xl font-serif font-bold text-gold/40 border-l-4 border-gold/20 pl-6">{testament}</h4>
                 <div className="grid gap-12">
                    {Object.entries(categories as any).map(([category, books]) => (
                      <div key={category} className="space-y-6">
                         <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 flex items-center gap-3">
                           <div className="w-1.5 h-1.5 bg-sacred rounded-full" /> {category}
                         </h5>
                         <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                            {(books as string[]).map(b => {
                              const isPreserved = preservedBooks.has(b);
                              return (
                                <div 
                                  key={b} 
                                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${isPreserved ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-stone-50 dark:bg-stone-800/50 border-stone-100 dark:border-stone-800'}`}
                                >
                                   <span className={`text-[11px] font-serif font-bold ${isPreserved ? 'text-emerald-500' : 'text-stone-400'}`}>{b}</span>
                                   <div className="flex justify-end mt-3">
                                      {isPreserved ? (
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                                      ) : (
                                        <div className="w-1.5 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full" />
                                      )}
                                   </div>
                                </div>
                              );
                            })}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            ))}
         </div>
      </section>

      <footer className="text-center pt-20 border-t border-stone-100 dark:border-stone-800 opacity-30">
         <Icons.Cross className="w-10 h-10 mx-auto" />
         <p className="text-[10px] font-black uppercase tracking-[0.8em] mt-6">Systema Integritas • Cathedra Digital</p>
      </footer>
    </div>
  );
};

export default Diagnostics;
