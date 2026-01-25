
import React from 'react';
import { Icons } from '../constants';
import { ConnectivityState } from '../hooks/useOfflineMode';

const OfflineIndicator: React.FC<{ state: ConnectivityState }> = ({ state }) => {
  const { isOnline, isSyncing, wasOffline } = state;

  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] pointer-events-none flex flex-col items-center">
      {/* MODO OFFLINE ATIVO */}
      {!isOnline && (
        <div className="bg-sacred text-white py-3 px-8 flex items-center justify-center gap-4 animate-in slide-in-from-top-full duration-500 shadow-4xl pointer-events-auto rounded-b-[2rem] border-x border-b border-white/10">
           <Icons.Globe className="w-5 h-5 animate-pulse" />
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Modus Offline Ativado</span>
              <span className="text-[8px] opacity-60 uppercase font-bold tracking-widest mt-1">Santuário Local • Navegando no Codex</span>
           </div>
        </div>
      )}

      {/* SINCRONIZANDO DADOS */}
      {isSyncing && isOnline && (
        <div className="bg-[#1a1a1a] text-gold py-3 px-8 flex items-center justify-center gap-4 animate-in slide-in-from-top-full duration-500 shadow-4xl pointer-events-auto rounded-b-[2rem] border-x border-b border-gold/20">
           <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none text-white">Sincronizando Depósito</span>
              <span className="text-[8px] text-gold/60 uppercase font-bold tracking-widest mt-1">Background Sync • Atualizando Memória</span>
           </div>
        </div>
      )}

      {/* RECONEXÃO SUCEDIDA */}
      {isOnline && wasOffline && !isSyncing && (
        <div className="bg-emerald-600 text-white py-3 px-8 flex items-center justify-center gap-4 animate-out fade-out slide-out-to-top duration-1000 pointer-events-auto rounded-b-[2rem] border-x border-b border-white/10 shadow-2xl">
           <Icons.Star className="w-5 h-5 fill-current animate-bounce" />
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Conexão Restabelecida</span>
              <span className="text-[8px] opacity-60 uppercase font-bold tracking-widest mt-1">Santuário Online • Gloria in Excelsis</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
