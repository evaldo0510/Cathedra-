
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Icons } from '../constants';
import { fetchMonthlyCalendar } from '../services/gemini';
import { LiturgyInfo, AppRoute } from '../types';
import { LangContext } from '../App';

const LITURGY_COLORS: Record<string, { bg: string, text: string, dot: string, hex: string }> = {
  green: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', hex: '#059669' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500', hex: '#7c3aed' },
  white: { bg: 'bg-stone-50 dark:bg-stone-800/40', text: 'text-stone-700 dark:text-stone-300', dot: 'bg-gold', hex: '#d4af37' },
  red: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', hex: '#dc2626' },
  rose: { bg: 'bg-pink-50 dark:bg-pink-950/20', text: 'text-pink-700 dark:text-pink-400', dot: 'bg-pink-500', hex: '#db2777' },
  black: { bg: 'bg-stone-900', text: 'text-stone-100', dot: 'bg-stone-500', hex: '#1a1a1a' }
};

const LiturgicalCalendar: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<LiturgyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<LiturgyInfo | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

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
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const navigateSelectedDay = (offset: number) => {
    if (!selectedDay) return;
    const currentIdx = days.findIndex(d => d.date === selectedDay.date);
    const nextIdx = currentIdx + offset;
    if (nextIdx >= 0 && nextIdx < days.length) {
      setSelectedDay(days[nextIdx]);
    }
  };

  const handleColorUpdate = (color: string) => {
    if (!selectedDay) return;
    setDays(prev => prev.map(d => d.date === selectedDay.date ? { ...d, color: color as any } : d));
    setSelectedDay(prev => prev ? { ...prev, color: color as any } : null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32 animate-in fade-in duration-700 px-4">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-stone-900 p-8 rounded-[3rem] shadow-xl border border-stone-100 dark:border-stone-800">
        <div className="text-center md:text-left">
           <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Calendarium</h2>
           <p className="text-stone-400 font-serif italic text-xl capitalize">{currentDate.toLocaleDateString(lang, { month: 'long', year: 'numeric' })}</p>
        </div>
        
        <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800 p-1.5 rounded-2xl shadow-inner">
           <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-white dark:hover:bg-stone-700 rounded-xl transition-all"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
           <button onClick={() => setCurrentDate(new Date())} className="px-6 py-2 text-[10px] font-black uppercase text-stone-400 hover:text-gold">Hodie</button>
           <button onClick={() => changeMonth(1)} className="p-3 hover:bg-white dark:hover:bg-stone-700 rounded-xl transition-all"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {loading ? (
          Array.from({ length: 28 }).map((_, i) => <div key={i} className="aspect-square bg-stone-100 dark:bg-stone-900 rounded-[2.5rem] animate-pulse" />)
        ) : (
          days.map((day, idx) => {
            const styles = LITURGY_COLORS[day.color] || LITURGY_COLORS.white;
            const isToday = day.date === todayStr;
            return (
              <button 
                key={idx}
                onClick={() => setSelectedDay(day)}
                className={`group aspect-square p-4 rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center text-center space-y-1 relative overflow-hidden ${styles.bg} ${isToday ? 'ring-4 ring-gold z-10 scale-105' : 'hover:scale-105 hover:border-gold/40'}`}
              >
                <span className={`text-xl font-serif font-black absolute top-4 left-4 ${isToday ? 'text-gold' : 'text-stone-300 dark:text-stone-700'}`}>
                  {new Date(day.date + 'T12:00:00').getDate()}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} />
                <h4 className={`text-[9px] font-serif font-bold leading-tight line-clamp-2 px-1 ${styles.text}`}>{day.dayName}</h4>
              </button>
            );
          })
        )}
      </div>

      {selectedDay && (
        <div className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedDay(null)}>
           <article className="bg-white dark:bg-stone-950 w-full max-w-2xl rounded-[3.5rem] shadow-4xl overflow-hidden border border-white/10 animate-modal-zoom relative" onClick={e => e.stopPropagation()}>
              
              <div className="absolute inset-y-0 left-0 flex items-center px-2 md:-left-20">
                <button onClick={() => navigateSelectedDay(-1)} className="p-4 bg-white/10 hover:bg-gold text-white rounded-full transition-all"><Icons.ArrowDown className="w-6 h-6 rotate-90" /></button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 md:-right-20">
                <button onClick={() => navigateSelectedDay(1)} className="p-4 bg-white/10 hover:bg-gold text-white rounded-full transition-all"><Icons.ArrowDown className="w-6 h-6 -rotate-90" /></button>
              </div>

              <header className={`p-10 md:p-14 text-center space-y-4 ${LITURGY_COLORS[selectedDay.color]?.bg || 'bg-stone-50'}`}>
                 <span className={`text-[10px] font-black uppercase tracking-[0.5em] ${LITURGY_COLORS[selectedDay.color]?.text || 'text-stone-400'}`}>{selectedDay.rank}</span>
                 <h3 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">{selectedDay.dayName}</h3>
                 
                 <div className="flex justify-center gap-3 pt-6">
                    {Object.entries(LITURGY_COLORS).map(([color, config]) => (
                      <button 
                        key={color}
                        onClick={() => handleColorUpdate(color)}
                        className={`w-8 h-8 rounded-full border-4 transition-all hover:scale-125 ${selectedDay.color === color ? 'border-white shadow-lg scale-110' : 'border-transparent opacity-40'}`}
                        style={{ backgroundColor: config.hex }}
                        title={`Cor: ${color}`}
                      />
                    ))}
                 </div>
              </header>
              
              <div className="p-10 md:p-14 space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-stone-50 dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 space-y-1">
                       <span className="text-[8px] font-black uppercase text-stone-400">Ciclo</span>
                       <p className="font-serif text-xl font-bold">{selectedDay.cycle}</p>
                    </div>
                    <div className="p-6 bg-stone-50 dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 space-y-1">
                       <span className="text-[8px] font-black uppercase text-stone-400">Semana</span>
                       <p className="font-serif text-xl font-bold">{selectedDay.week}</p>
                    </div>
                 </div>

                 <button 
                   onClick={() => window.location.href = `${AppRoute.DAILY_LITURGY}?date=${selectedDay.date}`} 
                   className="w-full py-5 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:scale-[1.02] transition-all"
                 >
                   Ver Lecionário Completo
                 </button>
              </div>
              
              <button onClick={() => setSelectedDay(null)} className="absolute top-8 right-8 p-3 bg-white/20 hover:bg-sacred text-white rounded-full transition-all">
                <Icons.Cross className="w-5 h-5 rotate-45" />
              </button>
           </article>
        </div>
      )}
    </div>
  );
};

export default LiturgicalCalendar;
