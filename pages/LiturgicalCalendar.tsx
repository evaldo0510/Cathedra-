
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { getWeeklyCalendar } from '../services/gemini';
import { LiturgyInfo } from '../types';

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

  const fetchWeek = async () => {
    setLoading(true);
    try {
      const data = await getWeeklyCalendar();
      setWeek(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWeek(); }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
      <header className="text-center space-y-6">
        <div className="flex justify-center">
           <div className="p-6 bg-[#fcf8e8] rounded-full border border-[#d4af37]/30 shadow-sacred">
              <Icons.History className="w-16 h-16 text-[#8b0000]" />
           </div>
        </div>
        <h2 className="text-7xl font-serif font-bold text-stone-900 tracking-tight">Calendário Litúrgico</h2>
        <p className="text-stone-400 italic text-2xl">A marcha rítmica da salvação no tempo.</p>
      </header>

      <section className="bg-white p-12 rounded-[5rem] shadow-2xl border border-stone-100">
        <div className="flex items-center justify-between mb-12">
           <h3 className="text-[12px] font-black uppercase tracking-[0.8em] text-stone-300">Hebdomada (Semana)</h3>
           <button onClick={fetchWeek} className="p-4 bg-stone-50 rounded-full text-[#d4af37] hover:bg-[#fcf8e8] transition-all">
             <Icons.History className="w-6 h-6" />
           </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-64 bg-stone-50 rounded-[3rem] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
            {week.map((day, idx) => {
              const styles = LITURGY_COLORS[day.color] || LITURGY_COLORS.white;
              const isSolemnity = day.rank.toLowerCase().includes('solenidade');
              const isFeast = day.rank.toLowerCase().includes('festa');
              
              return (
                <article 
                  key={idx} 
                  className={`relative p-8 rounded-[3.5rem] border flex flex-col items-center text-center transition-all hover:scale-105 duration-500 group cursor-default shadow-sm hover:shadow-xl ${isSolemnity ? 'ring-4 ring-[#d4af37]/20 border-[#d4af37]' : ''}`}
                  style={{ backgroundColor: styles.bg, borderColor: styles.border }}
                >
                  <div className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-50">
                    {day.date || 'Hoje'}
                  </div>
                  
                  <div 
                    className="w-12 h-12 rounded-full mb-6 shadow-inner animate-pulse group-hover:scale-110 transition-transform" 
                    style={{ backgroundColor: styles.darkBg }}
                  />
                  
                  <div className="flex-1 space-y-4">
                    <h4 className={`text-xl font-serif font-bold leading-tight ${isSolemnity ? 'text-stone-900' : 'text-stone-700'}`}>
                      {day.dayName}
                    </h4>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#8b0000]">
                      {day.rank}
                    </p>
                    <div className="h-px w-8 bg-stone-200 mx-auto" />
                    <p className="text-[10px] text-stone-400 font-serif italic">
                      {day.week}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col gap-1">
                     <span className="text-[8px] font-bold text-stone-300 uppercase tracking-tighter">
                        {day.season}
                     </span>
                     <span className="text-[8px] font-black text-[#d4af37] uppercase">
                        {day.cycle}
                     </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-8 pt-12">
         {[
           { t: "Solenidades", d: "As celebrações de maior importância, comemorando os principais mistérios da fé.", i: Icons.Cross, c: "#d4af37" },
           { t: "Festas", d: "Celebrações de santos ou eventos de grande relevância na história sagrada.", i: Icons.Feather, c: "#8b0000" },
           { t: "Memórias", d: "Recordação de santos que marcaram a vida da Igreja em menor escala.", i: Icons.Users, c: "#1b4d2e" }
         ].map(item => (
           <div key={item.t} className="bg-white p-10 rounded-[3.5rem] border border-stone-50 shadow-lg text-center space-y-4">
              <div className="p-4 bg-stone-50 rounded-full inline-block mb-4">
                 <item.i className="w-8 h-8" style={{ color: item.c }} />
              </div>
              <h4 className="text-2xl font-serif font-bold text-stone-900">{item.t}</h4>
              <p className="text-stone-400 text-sm font-serif italic leading-relaxed">{item.d}</p>
           </div>
         ))}
      </section>
    </div>
  );
};

export default LiturgicalCalendar;
