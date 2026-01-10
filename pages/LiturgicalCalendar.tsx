
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Icons } from '../constants';
import { fetchMonthlyCalendar } from '../services/gemini';
import { LiturgyInfo, AppRoute } from '../types';
import { LangContext } from '../App';

const LITURGY_COLORS: Record<string, { bg: string, text: string, dot: string }> = {
  green: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
  white: { bg: 'bg-stone-50 dark:bg-stone-800/40', text: 'text-stone-700 dark:text-stone-300', dot: 'bg-gold' },
  red: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  rose: { bg: 'bg-pink-50 dark:bg-pink-950/20', text: 'text-pink-700 dark:text-pink-400', dot: 'bg-pink-500' },
  black: { bg: 'bg-stone-900', text: 'text-stone-100', dot: 'bg-stone-500' }
};

const LiturgicalCalendar: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<LiturgyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<LiturgyInfo | null>(null);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const data = await fetchMonthlyCalendar(month, year, lang);
      setDays(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentDate, lang]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  const changeMonth = (offset: number) => {
    const next = new Date(currentDate);
    next.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(next);
  };

  const getRankStyle = (rank: string) => {
    if (rank.includes('Solenidade')) return 'ring-2 ring-gold shadow-lg shadow-gold/20';
    if (rank.includes('Festa')) return 'border-sacred/40';
    return 'border-stone-100 dark:border-stone-800';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700 px-4">
      <header className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white dark:bg-stone-900 p-10 rounded-[3rem] shadow-xl border border-stone-100 dark:border-stone-800">
        <div className="text-center md:text-left space-y-2">
           <h2 className="text-4xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Calendarium Romanum</h2>
           <p className="text-stone-400 italic text-xl uppercase tracking-widest text-[10px]">
             {currentDate.toLocaleDateString(lang, { month: 'long', year: 'numeric' })}
           </p>
        </div>
        
        <div className="flex items-center gap-4 bg-stone-50 dark:bg-stone-800 p-2 rounded-2xl">
           <button onClick={() => changeMonth(-1)} className="p-4 hover:bg-white dark:hover:bg-stone-700 rounded-xl transition-all">
             <Icons.ArrowDown className="w-5 h-5 rotate-90" />
           </button>
           <button onClick={() => setCurrentDate(new Date())} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-gold">Hoje</button>
           <button onClick={() => changeMonth(1)} className="p-4 hover:bg-white dark:hover:bg-stone-700 rounded-xl transition-all">
             <Icons.ArrowDown className="w-5 h-5 -rotate-90" />
           </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {loading ? (
          Array.from({ length: 31 }).map((_, i) => (
            <div key={i} className="aspect-square bg-stone-100 dark:bg-stone-900 rounded-[2rem] animate-pulse" />
          ))
        ) : (
          days.map((day, idx) => {
            const styles = LITURGY_COLORS[day.color] || LITURGY_COLORS.white;
            return (
              <button 
                key={idx}
                onClick={() => setSelectedDay(day)}
                className={`group aspect-square p-4 rounded-[2rem] border transition-all flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden ${styles.bg} ${getRankStyle(day.rank)} hover:scale-105 active:scale-95`}
              >
                <span className="text-xs font-black text-stone-400 dark:text-stone-500 absolute top-4 left-4">{new Date(day.date).getDate()}</span>
                <div className={`w-2 h-2 rounded-full ${styles.dot} mb-2 shadow-sm`} />
                <h4 className={`text-[10px] font-serif font-bold leading-tight line-clamp-2 ${styles.text}`}>{day.dayName}</h4>
                {day.isHolyDayOfObligation && <Icons.Cross className="w-3 h-3 text-gold absolute top-4 right-4" />}
              </button>
            );
          })
        )}
      </div>

      <section className="bg-stone-50 dark:bg-stone-900/50 p-8 rounded-[3rem] border border-dashed border-stone-200 dark:border-stone-800">
         <div className="flex flex-wrap justify-center gap-8">
            {Object.entries(LITURGY_COLORS).map(([color, styles]) => (
              <div key={color} className="flex items-center gap-3">
                 <div className={`w-4 h-4 rounded-full ${styles.dot}`} />
                 <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{color}</span>
              </div>
            ))}
         </div>
      </section>

      {selectedDay && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedDay(null)}>
           <article className="bg-white dark:bg-stone-950 w-full max-w-2xl rounded-[4rem] shadow-3xl overflow-hidden border border-white/10 animate-modal-zoom" onClick={e => e.stopPropagation()}>
              <header className={`p-12 text-center space-y-4 ${LITURGY_COLORS[selectedDay.color].bg}`}>
                 <span className={`text-[10px] font-black uppercase tracking-[0.5em] ${LITURGY_COLORS[selectedDay.color].text}`}>{selectedDay.rank}</span>
                 <h3 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">{selectedDay.dayName}</h3>
                 <p className="text-stone-500 font-serif italic text-lg">{selectedDay.season} • {selectedDay.cycle}</p>
              </header>
              
              <div className="p-12 space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-stone-50 dark:bg-stone-900 rounded-3xl space-y-1">
                       <span className="text-[8px] font-black uppercase text-stone-400">Semana</span>
                       <p className="font-serif text-lg">{selectedDay.week}</p>
                    </div>
                    <div className="p-6 bg-stone-50 dark:bg-stone-900 rounded-3xl space-y-1">
                       <span className="text-[8px] font-black uppercase text-stone-400">Salterio</span>
                       <p className="font-serif text-lg">{selectedDay.psalterWeek || 'Proprio'}</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gold">Ações Sagradas</h4>
                    <div className="flex flex-col gap-3">
                       <button onClick={() => window.location.href = AppRoute.DAILY_LITURGY} className="w-full py-4 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-all">Ver Liturgia Completa</button>
                       <button onClick={() => window.location.href = AppRoute.MISSAL} className="w-full py-4 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl font-black uppercase text-[10px] tracking-widest text-stone-500">Ordo Missae</button>
                    </div>
                 </div>
              </div>
              
              <button onClick={() => setSelectedDay(null)} className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full"><Icons.Cross className="w-5 h-5 rotate-45" /></button>
           </article>
        </div>
      )}
    </div>
  );
};

export default LiturgicalCalendar;
