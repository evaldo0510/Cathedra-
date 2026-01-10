
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Icons, COLORS } from '../constants';
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
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(next);
  };

  const getRankStyle = (rank: string) => {
    if (rank.includes('Solenidade')) return 'ring-2 ring-gold shadow-lg shadow-gold/20';
    if (rank.includes('Festa')) return 'border-sacred/40';
    return 'border-stone-100 dark:border-stone-800';
  };

  const handleColorChange = (color: string) => {
    if (!selectedDay) return;
    setDays(prev => prev.map(d => d.date === selectedDay.date ? { ...d, color: color as any } : d));
    setSelectedDay(prev => prev ? { ...prev, color: color as any } : null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700 px-4">
      <header className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white dark:bg-stone-900 p-10 rounded-[3rem] shadow-xl border border-stone-100 dark:border-stone-800">
        <div className="text-center md:text-left space-y-2">
           <h2 className="text-4xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Calendarium Romanum</h2>
           <div className="flex items-center gap-4 justify-center md:justify-start">
             <div className="px-4 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-full border border-stone-100 dark:border-stone-700">
                <p className="text-stone-500 font-serif italic text-lg capitalize">
                  {currentDate.toLocaleDateString(lang, { month: 'long', year: 'numeric' })}
                </p>
             </div>
           </div>
        </div>
        
        <div className="flex items-center gap-4 bg-stone-50 dark:bg-stone-800 p-2 rounded-2xl border border-stone-100 dark:border-stone-800">
           <button onClick={() => changeMonth(-1)} className="p-4 hover:bg-white dark:hover:bg-stone-700 rounded-xl transition-all group">
             <Icons.ArrowDown className="w-5 h-5 rotate-90 group-hover:text-gold" />
           </button>
           <button 
            onClick={() => setCurrentDate(new Date())} 
            className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-gold transition-colors"
           >
             Hodie (Hoje)
           </button>
           <button onClick={() => changeMonth(1)} className="p-4 hover:bg-white dark:hover:bg-stone-700 rounded-xl transition-all group">
             <Icons.ArrowDown className="w-5 h-5 -rotate-90 group-hover:text-gold" />
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
            const isToday = day.date === todayStr;
            return (
              <button 
                key={idx}
                onClick={() => setSelectedDay(day)}
                className={`group aspect-square p-4 rounded-[2rem] border transition-all flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden ${styles.bg} ${getRankStyle(day.rank)} ${isToday ? 'ring-4 ring-gold ring-offset-4 dark:ring-offset-stone-950 scale-105 z-10 shadow-2xl' : 'hover:scale-105'} active:scale-95`}
              >
                {isToday && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className="flex h-2 w-2 rounded-full bg-gold animate-ping opacity-75"></span>
                  </div>
                )}
                <span className={`text-xs font-black absolute top-4 left-4 ${isToday ? 'text-gold' : 'text-stone-400 dark:text-stone-500'}`}>
                  {new Date(day.date + 'T00:00:00').getDate()}
                </span>
                <div className={`w-2 h-2 rounded-full ${styles.dot} mb-2 shadow-sm`} />
                <h4 className={`text-[10px] font-serif font-bold leading-tight line-clamp-2 ${styles.text}`}>
                  {day.dayName}
                </h4>
                {day.isHolyDayOfObligation && <Icons.Cross className="w-3 h-3 text-gold absolute bottom-4 right-4" />}
                
                {day.saints && day.saints.length > 0 && (
                  <div className="absolute bottom-2 left-4 right-4 flex justify-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="w-1 h-1 bg-stone-400 rounded-full" />
                  </div>
                )}
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
              <header className={`p-12 text-center space-y-4 ${LITURGY_COLORS[selectedDay.color].bg} transition-colors duration-500`}>
                 <span className={`text-[10px] font-black uppercase tracking-[0.5em] ${LITURGY_COLORS[selectedDay.color].text}`}>{selectedDay.rank}</span>
                 <h3 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">{selectedDay.dayName}</h3>
                 <p className="text-stone-500 font-serif italic text-lg">{selectedDay.season} • {selectedDay.cycle}</p>
                 
                 {/* Color Selector */}
                 <div className="flex justify-center gap-3 pt-6">
                    {Object.entries(LITURGY_COLORS).map(([color, config]) => (
                      <button 
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 ${selectedDay.color === color ? 'border-stone-900 dark:border-white scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                        style={{ backgroundColor: config.hex }}
                        title={`Mudar para ${color}`}
                      />
                    ))}
                 </div>
              </header>
              
              <div className="p-12 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
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

                 {selectedDay.saints && selectedDay.saints.length > 0 && (
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-2">
                        <Icons.Users className="w-4 h-4" /> Sanctorum do Dia
                      </h4>
                      <div className="grid gap-3">
                        {selectedDay.saints.map((saint, sIdx) => (
                          <button 
                            key={sIdx}
                            onClick={() => window.location.href = AppRoute.SAINTS}
                            className="w-full text-left p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl hover:border-gold transition-colors flex items-center justify-between group"
                          >
                             <span className="font-serif text-lg italic text-stone-800 dark:text-stone-200">"{saint}"</span>
                             <Icons.ExternalLink className="w-3.5 h-3.5 text-stone-300 group-hover:text-gold" />
                          </button>
                        ))}
                      </div>
                   </div>
                 )}

                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gold">Ações Sagradas</h4>
                    <div className="flex flex-col gap-3">
                       <button onClick={() => window.location.href = AppRoute.DAILY_LITURGY} className="w-full py-4 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-all">Ver Liturgia Completa</button>
                       <button onClick={() => window.location.href = AppRoute.MISSAL} className="w-full py-4 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl font-black uppercase text-[10px] tracking-widest text-stone-500">Ordo Missae</button>
                    </div>
                 </div>
              </div>
              
              <button onClick={() => setSelectedDay(null)} className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all group">
                <Icons.Cross className="w-5 h-5 rotate-45 group-hover:scale-110" />
              </button>
           </article>
        </div>
      )}
    </div>
  );
};

export default LiturgicalCalendar;
