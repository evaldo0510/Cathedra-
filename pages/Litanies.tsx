
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { fetchLitanies } from '../services/gemini';
import { LangContext } from '../App';

const LITANY_TYPES = [
  'Ladainha de Nossa Senhora (Loreto)',
  'Ladainha do Sagrado Coração de Jesus',
  'Ladainha de Todos os Santos',
  'Ladainha de São José',
  'Ladainha do Preciosíssimo Sangue'
];

const Litanies: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [selectedType, setSelectedType] = useState(LITANY_TYPES[0]);
  const [data, setData] = useState<{ title: string, items: { call: string, response: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadLitany = async (type: string) => {
    setLoading(true);
    setData(null);
    setSelectedType(type);
    try {
      const result = await fetchLitanies(type, lang);
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLitany(LITANY_TYPES[0]); }, [lang]);

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
      <header className="text-center space-y-4">
        <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Litaniæ</h2>
        <p className="text-stone-400 italic text-xl">Súplicas Rítmicas da Tradição</p>
      </header>

      <nav className="flex overflow-x-auto gap-3 no-scrollbar pb-6 justify-start md:justify-center px-4">
        {LITANY_TYPES.map(type => (
          <button 
            key={type}
            onClick={() => loadLitany(type)}
            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${selectedType === type ? 'bg-gold text-stone-900 border-gold shadow-lg' : 'bg-white dark:bg-stone-900 text-stone-400 border-stone-100 dark:border-stone-800'}`}
          >
            {type.replace('Ladainha de ', '')}
          </button>
        ))}
      </nav>

      {loading ? (
         <div className="py-32 text-center space-y-6">
            <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-2xl font-serif italic text-stone-400">Organizando o Coro dos Anjos...</p>
         </div>
      ) : data && (
        <div className="bg-white dark:bg-stone-900 p-8 md:p-20 rounded-[4rem] shadow-3xl border border-stone-100 dark:border-stone-800 space-y-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
             <Icons.Cross className="w-64 h-64" />
          </div>
          
          <header className="text-center border-b border-stone-50 dark:border-stone-800 pb-10">
             <h3 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">{data.title}</h3>
          </header>

          <div className="space-y-6 max-w-2xl mx-auto">
             {data.items.map((item, idx) => (
               <div key={idx} className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 md:gap-10 p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-2xl transition-all group">
                  <span className="text-xl md:text-2xl font-serif text-stone-700 dark:text-stone-300 group-hover:text-gold transition-colors italic">
                    <span className="text-sacred mr-2 font-bold not-italic">V/.</span> {item.call}
                  </span>
                  <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800 hidden md:block" />
                  <span className="text-xl md:text-2xl font-serif font-bold text-stone-900 dark:text-white">
                    <span className="text-gold mr-2 not-italic">R/.</span> {item.response}
                  </span>
               </div>
             ))}
          </div>
        </div>
      )}

      <footer className="text-center opacity-30 pt-20">
         <Icons.Cross className="w-10 h-10 mx-auto" />
         <p className="text-[10px] uppercase tracking-widest mt-4">Kyrie Eleison • Christe Eleison</p>
      </footer>
    </div>
  );
};

export default Litanies;
