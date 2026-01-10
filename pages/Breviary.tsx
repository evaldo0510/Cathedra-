
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { fetchBreviaryHour } from '../services/gemini';
import { LangContext } from '../App';

const HOURS = [
  { id: 'lauds', name: 'Laudes', desc: 'Oração da Manhã' },
  { id: 'terce', name: 'Tércia', desc: '9:00h' },
  { id: 'sext', name: 'Sexta', desc: '12:00h' },
  { id: 'none', name: 'Noa', desc: '15:00h' },
  { id: 'vespers', name: 'Vésperas', desc: 'Oração da Tarde' },
  { id: 'compline', name: 'Completas', desc: 'Oração da Noite' }
];

const Breviary: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [selectedHour, setSelectedHour] = useState(HOURS[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadHour = async (hour: typeof HOURS[0]) => {
    setLoading(true);
    setData(null);
    setSelectedHour(hour);
    try {
      const result = await fetchBreviaryHour(hour.name, lang);
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHour(HOURS[0]);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32 animate-in fade-in duration-1000">
      <header className="text-center space-y-4">
        <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Breviarium Romanum</h2>
        <p className="text-stone-400 italic text-xl md:text-2xl">A Oração Ininterrupta da Igreja</p>
      </header>

      <nav className="flex flex-wrap justify-center gap-2">
        {HOURS.map(h => (
          <button 
            key={h.id}
            onClick={() => loadHour(h)}
            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedHour.id === h.id ? 'bg-[#8b0000] text-white shadow-xl scale-105' : 'bg-white dark:bg-stone-900 text-stone-400 hover:border-gold border border-stone-100'}`}
          >
            {h.name}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-stone-400 font-serif italic">Preparando o Ofício Divino...</p>
        </div>
      ) : data && (
        <article className="parchment dark:bg-stone-900 p-10 md:p-20 rounded-[3rem] shadow-3xl border border-[#d4af37]/20 space-y-12">
          <header className="text-center border-b border-gold/10 pb-10 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#8b0000]">{selectedHour.desc}</span>
            <h3 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100">{data.hourName}</h3>
          </header>

          <div className="space-y-10">
            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gold">Invidatorium</h4>
              <p className="text-2xl font-serif italic text-stone-800 dark:text-stone-200 leading-relaxed">{data.invitatory}</p>
            </section>

            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gold">Hymnus</h4>
              <p className="text-2xl font-serif italic text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">{data.hymn}</p>
            </section>

            <section className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gold">Psalmodia</h4>
              {data.psalms?.map((p: any, i: number) => (
                <div key={i} className="space-y-4 pl-6 border-l-2 border-gold/20">
                  <span className="text-sm font-serif font-bold text-[#8b0000]">{p.ref}</span>
                  <p className="text-xl md:text-2xl font-serif text-stone-700 dark:text-stone-300 leading-snug">{p.text}</p>
                </div>
              ))}
            </section>

            <section className="bg-stone-50 dark:bg-stone-800/50 p-8 rounded-3xl space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gold">Oratio Finalis</h4>
              <p className="text-2xl font-serif italic text-stone-900 dark:text-stone-100">{data.prayer}</p>
            </section>
          </div>

          <footer className="text-center pt-10 opacity-30">
            <Icons.Cross className="w-8 h-8 mx-auto" />
            <p className="text-[10px] uppercase tracking-widest mt-4">Benedicamus Domino • Deo Gratias</p>
          </footer>
        </article>
      )}
    </div>
  );
};

export default Breviary;
