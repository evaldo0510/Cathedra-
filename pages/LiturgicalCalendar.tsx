
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Icons, COLORS } from '../constants';
import { fetchMonthlyCalendar } from '../services/gemini';
import { LiturgyInfo, AppRoute } from '../types';
import { LangContext } from '../App';

const LITURGY_COLORS: Record<string, { bg: string, text: string, dot: string, hex: string, glow: string }> = {
  green: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', hex: '#059669', glow: 'shadow-emerald-500/20' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500', hex: '#7c3aed', glow: 'shadow-purple-500/20' },
  white: { bg: 'bg-stone-50 dark:bg-stone-800/40', text: 'text-stone-700 dark:text-stone-300', dot: 'bg-gold', hex: '#d4af37', glow: 'shadow-gold/20' },
  red: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', hex: '#dc2626', glow: 'shadow-red-500/20' },
  rose: { bg: 'bg-pink-50 dark:bg-pink-950/20', text: 'text-pink-700 dark:text-pink-400', dot: 'bg-pink-500', hex: '#db2777', glow: 'shadow-pink-500/20' },
  black: { bg: 'bg-stone-900', text: 'text-stone-100', dot: 'bg-stone-500', hex: '#1a1a1a', glow: 'shadow-black/20' }
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
      console.error("Erro ao carregar calendário litúrgico:", e);
    } finally {
      setLoading(false);
    }
  }, [currentDate, lang]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  const changeMonth = (offset: number) => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(next);
  };

  const navigateSelectedDay = (offset: number) => {
    if (!selectedDay) return;
    const currentIdx = days.findIndex(d => d.date === selectedDay.date);
    const nextIdx = currentIdx + offset;
    if (nextIdx >= 0 && nextIdx < days.length) {
      setSelectedDay(days[nextIdx]);
    }
  };

  const getRankStyle = (rank: string) => {
    if (rank.includes('Solenidade')) return 'ring-2 ring-gold shadow-lg shadow-gold/20 scale-105 z-10';
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
      <header className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white dark:bg-stone-900 p-10 rounded-[3rem] shadow-2xl border border-stone-100 dark:border-stone-800">
        <div className="text-center md:text-left space-y-3">
           <div className="flex items-center justify-center md:justify-start gap-4">
              <Icons.History className="w-8 h-8 text-gold" />
              <h2 className="text-4xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight leading-none">Calendarium Romanum</h2>
           </div>
           <div className="flex items-center gap-4 justify-center md:justify-start">
             <div className="px-6 py-2 bg-stone-50 dark:bg-stone-800 rounded-full border border-stone-100 dark:border-stone-700">
                <p className="text-stone-600 dark:text-stone-300 font-serif italic text-xl capitalize font-bold">
                  {currentDate.toLocaleDateString(lang, { month: 'long', year: 'numeric' })}
                </p>
             </div>
           </div>
        </div>
        
        <div className="flex items-center gap-4 bg-stone-50 dark:bg-stone-800 p-2 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-inner">
           <button onClick={() => changeMonth(-1)} className="p-4 hover:bg-white dark:hover:bg-stone-700 rounded-xl transition-all group active:scale-90" title="Mês Anterior">
             <Icons.ArrowDown className="w-5 h-5 rotate-90 group-hover:text-gold" />
           </button>
           <button 
            onClick={() => setCurrentDate(new Date())} 
            className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-gold transition-colors"
           >
             Hodie
           </button>
           <button onClick={() => changeMonth(1)} className="p-4 hover:bg-white dark:hover:bg-stone-700 rounded-xl transition-all group active:scale-90" title="Próximo Mês">
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
            const dayNum = new Date(day.date + 'T12:00:00').getDate();
            
            return (
              <button 
                key={idx}
                onClick={() => setSelectedDay(day)}
                className={`group aspect-square p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden ${styles.bg} ${getRankStyle(day.rank)} ${isToday ? 'ring-4 ring-gold ring-offset-4 dark:ring-offset-stone-950 scale-110 z-20 shadow-2xl' : 'hover:scale-105 hover:border-gold/50'} active:scale-95`}
              >
                {isToday && (
                  <div className="absolute top-4 right-4 flex gap-1">
                    <span className="flex h-2 w-2 rounded-full bg-gold animate-ping opacity-75"></span>
                  </div>
                )}
                <span className={`text-2xl font-serif font-black absolute top-6 left-6 ${isToday ? 'text-gold' : 'text-stone-300 dark:text-stone-600'}`}>
                  {dayNum}
                </span>
                <div className={`w-3 h-3 rounded-full ${styles.dot} mb-1 shadow-md animate-in zoom-in duration-500`} />
                <h4 className={`text-[11px] font-serif font-bold leading-tight line-clamp-2 px-2 ${styles.text}`}>
                  {day.dayName}
                </h4>
                {day.isHolyDayOfObligation && <Icons.Cross className="w-4 h-4 text-sacred absolute bottom-6 right-6 opacity-40" />}
              </button>
            );
          })
        )}
      </div>

      {selectedDay && (
        <div className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedDay(null)}>
           <article className="bg-white dark:bg-stone-950 w-full max-w-2xl rounded-[4rem] shadow-4xl overflow-hidden border border-white/10 animate-modal-zoom relative" onClick={e => e.stopPropagation()}>
              
              <div className="absolute inset-y-0 left-0 flex items-center px-4 md:-left-20">
                <button 
                  onClick={() => navigateSelectedDay(-1)}
                  className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md"
                >
                  <Icons.ArrowDown className="w-6 h-6 rotate-90" />
                </button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 md:-right-20">
                <button 
                  onClick={() => navigateSelectedDay(1)}
                  className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md"
                >
                  <Icons.ArrowDown className="w-6 h-6 -rotate-90" />
                </button>
              </div>

              <header className={`p-16 text-center space-y-6 ${LITURGY_COLORS[selectedDay.color].bg} transition-all duration-700 relative overflow-hidden`}>
                 <div className="absolute top-0 right-0 p-12 opacity-[0.05]"><Icons.Cross className="w-48 h-48" /></div>
                 <span className={`text-[12px] font-black uppercase tracking-[0.6em] ${LITURGY_COLORS[selectedDay.color].text} animate-pulse`}>{selectedDay.rank}</span>
                 <h3 className="text-5xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-tight">{selectedDay.dayName}</h3>
                 <div className="flex justify-center gap-3 text-stone-500 font-serif italic text-2xl">
                    <span>{selectedDay.season}</span>
                    <span className="opacity-20">•</span>
                    <span>Ciclo {selectedDay.cycle}</span>
                 </div>

                 <div className="flex justify-center gap-4 pt-10 border-t border-black/5 mt-4">
                    {Object.entries(LITURGY_COLORS).map(([color, config]) => (
                      <button 
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className={`w-10 h-10 rounded-full border-4 transition-all hover:scale-125 ${selectedDay.color === color ? 'border-white dark:border-stone-100 scale-110 shadow-2xl' : 'border-transparent opacity-40 hover:opacity-100'}`}
                        style={{ backgroundColor: config.hex }}
                        title={`Definir cor: ${color}`}
                      />
                    ))}
                 </div>
              </header>
              
              <div className="p-16 space-y-12 max-h-[50vh] overflow-y-auto custom-scrollbar parchment dark:bg-transparent">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="p-8 bg-white/40 dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Semana</span>
                       <p className="font-serif text-2xl font-bold">{selectedDay.week}</p>
                    </div>
                    <div className="p-8 bg-white/40 dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Salmos</span>
                       <p className="font-serif text-2xl font-bold">{selectedDay.psalterWeek || 'Proprium'}</p>
                    </div>
                 </div>

                 {selectedDay.saints && selectedDay.saints.length > 0 && (
                   <div className="space-y-6">
                      <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-gold flex items-center gap-4">
                        <Icons.Users className="w-6 h-6" /> Sanctorum Hodie
                      </h4>
                      <div className="grid gap-4">
                        {selectedDay.saints.map((saint, sIdx) => (
                          <div 
                            key={sIdx}
                            className="w-full text-left p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2rem] flex items-center justify-between group shadow-sm"
                          >
                             <span className="font-serif text-xl italic text-stone-800 dark:text-stone-200">"{saint}"</span>
                          </div>
                        ))}
                      </div>
                   </div>
                 )}

                 <div className="flex flex-col gap-4 pt-4">
                    <button 
                      onClick={() => window.location.href = `${AppRoute.DAILY_LITURGY}?date=${selectedDay.date}`} 
                      className="w-full py-6 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-3xl font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Acessar Lecionário
                    </button>
                 </div>
              </div>
              
              <button onClick={() => setSelectedDay(null)} className="absolute top-10 right-10 p-4 bg-white/20 hover:bg-sacred text-white rounded-full transition-all group z-20">
                <Icons.Cross className="w-6 h-6 rotate-45 group-hover:scale-110" />
              </button>
           </article>
        </div>
      )}
    </div>
  );
};

export default LiturgicalCalendar;
