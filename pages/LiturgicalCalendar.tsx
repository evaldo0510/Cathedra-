
import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from '../constants';
import { getWeeklyCalendar } from '../services/gemini';
import { LiturgyInfo } from '../types';

const WEEK_CACHE_KEY = 'cathedra_weekly_liturgy_cache';

const LITURGY_COLORS: Record<string, { bg: string, text: string, darkBg: string, border: string }> = {
  green: { bg: '#e6f4ea', text: '#1b4d2e', darkBg: '#1b4d2e', border: '#1b4d2e33' },
  purple: { bg: '#f3e8ff', text: '#5e2a84', darkBg: '#5e2a84', border: '#5e2a8433' },
  white: { bg: '#fffdf0', text: '#856404', darkBg: '#d4af37', border: '#d4af3733' },
  red: { bg: '#fdeaea', text: '#a61c1c', darkBg: '#a61c1c', border: '#a61c1c33' },
  rose: { bg: '#fff0f3', text: '#c71585', darkBg: '#e07a9b', border: '#e07a9b33' },
  black: { bg: '#f1f1f1', text: '#333333', darkBg: '#1a1a1a', border: '#1a1a1a33' }
};

const LiturgicalCalendar: React.FC = () => {
  const [week, setWeek] = useState<LiturgyInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWeek = useCallback(async (force = false) => {
    const today = new Date().toLocaleDateString('pt-BR');
    const cached = localStorage.getItem(WEEK_CACHE_KEY);

    if (!force && cached) {
      const parsed = JSON.parse(cached);
      if (parsed.date === today && parsed.data && parsed.data.length > 0) {
        setWeek(parsed.data);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const data = await getWeeklyCalendar();
      if (data && data.length > 0) {
        setWeek(data);
        localStorage.setItem(WEEK_CACHE_KEY, JSON.stringify({ date: today, data }));
      }
    } catch (e) {
      console.error("Calendar fetch failed:", e);
      // Caso falhe, tentamos usar o cache antigo mesmo que seja de outro dia
      if (cached) {
        setWeek(JSON.parse(cached).data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWeek(); }, [fetchWeek]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 md:space-y-16 animate-in fade-in duration-1000 pb-32 px-4 md:px-0">
      <header className="text-center space-y-6">
        <div className="flex justify-center">
           <div className="p-6 bg-[#fcf8e8] dark:bg-stone-900 rounded-full border border-[#d4af37]/30 shadow-sacred relative">
              <div className="absolute inset-0 bg-[#d4af37]/10 blur-[30px] rounded-full animate-pulse" />
              <Icons.History className="w-12 h-12 md:w-16 md:h-16 text-[#8b0000] dark:text-[#d4af37] relative z-10" />
           </div>
        </div>
        <h2 className="text-4xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">Calendário Litúrgico</h2>
        <p className="text-stone-400 italic text-lg md:text-2xl">A marcha rítmica da salvação no tempo.</p>
      </header>

      <section className="bg-white dark:bg-stone-900 p-6 md:p-12 rounded-[2.5rem] md:rounded-[5rem] shadow-2xl border border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-between mb-8 md:mb-12">
           <h3 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] md:tracking-[0.8em] text-stone-300">Hebdomada (Semana)</h3>
           <button 
             onClick={() => fetchWeek(true)} 
             disabled={loading}
             className="p-3 md:p-4 bg-stone-50 dark:bg-stone-800 rounded-full text-[#d4af37] hover:bg-[#fcf8e8] transition-all disabled:opacity-50"
             title="Atualizar Calendário"
           >
             <Icons.History className={`w-5 h-5 md:w-6 md:h-6 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>

        {loading && week.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 md:gap-6">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-48 md:h-64 bg-stone-50 dark:bg-stone-800 rounded-[2rem] md:rounded-[3rem] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 md:gap-6">
            {week.map((day, idx) => {
              const styles = LITURGY_COLORS[day.color] || LITURGY_COLORS.white;
              const isSolemnity = day.rank.toLowerCase().includes('solenidade');
              
              return (
                <article 
                  key={idx} 
                  className={`relative p-5 md:p-8 rounded-[2rem] md:rounded-[3.5rem] border flex flex-col items-center text-center transition-all hover:scale-105 duration-500 group cursor-default shadow-sm hover:shadow-xl ${isSolemnity ? 'ring-4 ring-[#d4af37]/20 border-[#d4af37]' : ''}`}
                  style={{ backgroundColor: styles.bg, borderColor: styles.border }}
                >
                  <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-3 md:mb-4 opacity-50">
                    {day.date || ''}
                  </div>
                  
                  <div 
                    className="w-8 h-8 md:w-12 md:h-12 rounded-full mb-4 md:mb-6 shadow-inner group-hover:scale-110 transition-transform" 
                    style={{ backgroundColor: styles.darkBg }}
                  />
                  
                  <div className="flex-1 space-y-2 md:space-y-4">
                    <h4 className={`text-sm md:text-xl font-serif font-bold leading-tight ${isSolemnity ? 'text-stone-900' : 'text-stone-700'}`}>
                      {day.dayName}
                    </h4>
                    <p className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-[#8b0000]">
                      {day.rank}
                    </p>
                    <div className="h-px w-6 md:w-8 bg-stone-200 mx-auto" />
                    <p className="text-[8px] md:text-[10px] text-stone-400 font-serif italic">
                      {day.week}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-6 md:gap-8 pt-8 md:pt-12">
         {[
           { t: "Solenidades", d: "Principais mistérios da fé.", i: Icons.Cross, c: "#d4af37" },
           { t: "Festas", d: "Eventos de grande relevância sagrada.", i: Icons.Feather, c: "#8b0000" },
           { t: "Memórias", d: "Recordação de santos e testemunhas.", i: Icons.Users, c: "#1b4d2e" }
         ].map(item => (
           <div key={item.t} className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] md:rounded-[3.5rem] border border-stone-50 dark:border-stone-800 shadow-lg text-center space-y-4">
              <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-full inline-block mb-2">
                 <item.i className="w-6 h-6" style={{ color: item.c }} />
              </div>
              <h4 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">{item.t}</h4>
              <p className="text-stone-400 text-sm font-serif italic leading-relaxed">{item.d}</p>
           </div>
         ))}
      </section>
    </div>
  );
};

export default LiturgicalCalendar;
