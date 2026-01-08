
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { getMagisteriumDocs, getMagisteriumDeepDive } from '../services/gemini';
import { LangContext } from '../App';

interface MagisteriumDoc {
  title: string;
  source: string;
  year: string;
  summary: string;
}

interface DeepDiveData {
  historicalContext: string;
  corePoints: string[];
  modernApplication: string;
  relatedCatechism: string[];
}

const CATEGORIES = [
  { id: 'ecumenical', label: 'Concílios Ecumênicos', icon: Icons.Cross },
  { id: 'pontifical', label: 'Documentos Pontifícios', icon: Icons.Feather },
  { id: 'social', label: 'Doutrina Social', icon: Icons.Globe },
  { id: 'creeds', label: 'Símbolos da Fé (Credos)', icon: Icons.History }
];

const Magisterium: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [docs, setDocs] = useState<MagisteriumDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].label);
  
  const [selectedDoc, setSelectedDoc] = useState<MagisteriumDoc | null>(null);
  const [deepDive, setDeepDive] = useState<DeepDiveData | null>(null);
  const [loadingDeepDive, setLoadingDeepDive] = useState(false);

  const fetchCategory = async (category: string) => {
    setLoadingDocs(true);
    setDocs([]);
    setSelectedDoc(null);
    setDeepDive(null);
    setActiveCategory(category);
    try {
      const data = await getMagisteriumDocs(category, lang);
      setDocs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDeepDive = async (doc: MagisteriumDoc) => {
    setSelectedDoc(doc);
    setDeepDive(null);
    setLoadingDeepDive(true);
    // Scroll suave para a seção de detalhes
    setTimeout(() => {
      document.getElementById('deep-dive-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const data = await getMagisteriumDeepDive(doc.title, lang);
      setDeepDive(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDeepDive(false);
    }
  };

  useEffect(() => {
    fetchCategory(CATEGORIES[0].label);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-48">
      {/* HEADER MONUMENTAL */}
      <header className="text-center space-y-8">
        <div className="flex justify-center">
          <div className="p-10 bg-[#fdfcf8] dark:bg-stone-900 rounded-full border-2 border-gold/30 shadow-sacred relative group">
            <div className="absolute inset-0 bg-gold/10 blur-[40px] rounded-full animate-pulse" />
            <Icons.Globe className="w-20 h-20 text-sacred dark:text-gold relative z-10 group-hover:rotate-12 transition-transform duration-700" />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter">Magisterium</h2>
          <p className="text-stone-400 italic font-serif text-2xl md:text-3xl max-w-3xl mx-auto leading-relaxed">
            "O Depósito da Fé guardado e transmitido pela sucessão apostólica."
          </p>
        </div>
      </header>

      {/* SELETOR DE CATEGORIAS */}
      <nav className="flex flex-wrap justify-center gap-4 bg-white/50 dark:bg-stone-900/50 p-4 rounded-[3.5rem] border border-stone-100 dark:border-stone-800 backdrop-blur-md max-w-5xl mx-auto shadow-xl">
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id}
            onClick={() => fetchCategory(cat.label)}
            className={`flex items-center gap-3 px-10 py-5 rounded-full font-serif font-bold text-xl transition-all border-2 ${activeCategory === cat.label ? 'bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 border-stone-900 dark:border-gold shadow-2xl scale-105' : 'bg-white dark:bg-stone-800 text-stone-500 border-transparent hover:border-gold/30'}`}
          >
            <cat.icon className="w-5 h-5" />
            {cat.label}
          </button>
        ))}
      </nav>

      {/* GRID DE DOCUMENTOS CARREGADOS ABAIXO DO SELETOR */}
      <section className="space-y-12">
        {loadingDocs ? (
          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-64 bg-stone-50 dark:bg-stone-900/50 rounded-[3rem] animate-pulse border-2 border-dashed border-stone-200" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {docs.map((doc, i) => (
              <article 
                key={i} 
                className={`p-10 rounded-[3.5rem] border-2 transition-all duration-500 group relative overflow-hidden flex flex-col justify-between ${selectedDoc?.title === doc.title ? 'bg-gold/5 border-gold shadow-2xl' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-gold hover:shadow-xl'}`}
              >
                <div className="space-y-6 relative z-10">
                   <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold/60">{doc.source} • {doc.year}</span>
                      <Icons.Feather className="w-8 h-8 text-gold/20" />
                   </div>
                   <h3 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight group-hover:text-gold transition-colors">{doc.title}</h3>
                   <p className="text-lg font-serif italic text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-3">"{doc.summary}"</p>
                </div>
                <button 
                  onClick={() => handleDeepDive(doc)}
                  className="mt-10 px-8 py-4 bg-stone-50 dark:bg-stone-800 text-stone-400 group-hover:bg-gold group-hover:text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all self-start flex items-center gap-2"
                >
                  <Icons.Search className="w-4 h-4" /> Investigar Documento
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* SEÇÃO DE APROFUNDAMENTO DINÂMICO (DEEP DIVE) */}
      <div id="deep-dive-section" className="scroll-mt-32">
        {loadingDeepDive && (
          <div className="py-24 text-center space-y-8 bg-[#fcf8e8] dark:bg-stone-900/50 rounded-[4rem] border-2 border-dashed border-gold/20">
             <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
             <p className="text-2xl font-serif italic text-stone-400">Consultando os arquivos do Magistério para "{selectedDoc?.title}"...</p>
          </div>
        )}

        {deepDive && selectedDoc && (
          <div className="space-y-12 animate-in slide-in-from-bottom-12 duration-1000">
            <div className="flex items-center gap-4 px-12">
               <div className="h-px flex-1 bg-gold/20" />
               <h3 className="text-[12px] font-black uppercase tracking-[0.8em] text-gold">Analytica Profunda</h3>
               <div className="h-px flex-1 bg-gold/20" />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Contexto Histórico */}
              <div className="bg-white dark:bg-stone-900 p-12 rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-6">
                 <div className="flex items-center gap-4 text-sacred">
                    <Icons.History className="w-6 h-6" />
                    <h4 className="text-2xl font-serif font-bold">Contexto Histórico</h4>
                 </div>
                 <p className="text-xl font-serif italic text-stone-600 dark:text-stone-300 leading-relaxed">
                   {deepDive.historicalContext}
                 </p>
              </div>

              {/* Aplicação Moderna */}
              <div className="bg-white dark:bg-stone-900 p-12 rounded-[4rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-6">
                 <div className="flex items-center gap-4 text-gold">
                    <Icons.Globe className="w-6 h-6" />
                    <h4 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">Atualidade e Aplicação</h4>
                 </div>
                 <p className="text-xl font-serif italic text-stone-600 dark:text-stone-300 leading-relaxed">
                   {deepDive.modernApplication}
                 </p>
              </div>

              {/* Pontos Cardeais */}
              <div className="bg-[#fcf8e8] dark:bg-stone-800/40 p-12 rounded-[4rem] border border-gold/20 shadow-xl col-span-1 md:col-span-2 space-y-10">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-xl"><Icons.Layout className="w-6 h-6" /></div>
                    <h4 className="text-3xl font-serif font-bold">Pilares do Ensinamento</h4>
                 </div>
                 <div className="grid md:grid-cols-3 gap-8">
                    {deepDive.corePoints.map((point, idx) => (
                      <div key={idx} className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-gold/10 relative group">
                        <span className="absolute -top-4 -left-4 w-10 h-10 bg-gold text-stone-900 rounded-full flex items-center justify-center font-black shadow-lg">{idx + 1}</span>
                        <p className="text-lg font-serif italic text-stone-700 dark:text-stone-300 leading-tight">"{point}"</p>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Conexão com o Catecismo */}
              <div className="bg-stone-900 p-14 rounded-[5rem] text-white shadow-3xl col-span-1 md:col-span-2 relative overflow-hidden group">
                 <Icons.Cross className="absolute -bottom-20 -right-20 w-96 h-96 text-gold/5 group-hover:scale-110 transition-transform duration-[8s]" />
                 <div className="relative z-10 space-y-8 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                       <div className="p-4 bg-gold text-stone-900 rounded-2xl shadow-2xl"><Icons.Book className="w-6 h-6" /></div>
                       <h4 className="text-3xl md:text-5xl font-serif font-bold text-gold tracking-tighter">Nexo com o Catecismo (CIC)</h4>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                       {deepDive.relatedCatechism.map((ref, idx) => (
                         <div key={idx} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-serif italic text-xl text-white/80 hover:bg-gold/10 hover:border-gold transition-all">
                           {ref}
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center pt-32 border-t border-gold/10">
         <p className="text-[12px] font-black uppercase tracking-[1em] text-stone-300 dark:text-stone-800">Magisterium Ecclesiae</p>
         <p className="text-stone-400 font-serif italic text-2xl mt-6">"Quem vos ouve, a Mim ouve." — Lucas 10, 16</p>
      </footer>
    </div>
  );
};

export default Magisterium;
