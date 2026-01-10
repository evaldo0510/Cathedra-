
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { fetchThomisticArticle } from '../services/gemini';
import { ThomisticArticle, AquinasWork } from '../types';
import { LangContext } from '../App';
import ActionButtons from '../components/ActionButtons';

const WORKS: AquinasWork[] = [
  { id: 'st', title: 'Summa Theologiae', category: 'summa', description: 'Síntese monumental da doutrina cristã.', parts: ['I', 'I-II', 'II-II', 'III', 'Suppl'] },
  { id: 'scg', title: 'Summa contra Gentiles', category: 'summa', description: 'Tratado apologético sobre a verdade da fé católica.', parts: ['I', 'II', 'III', 'IV'] },
  { id: 'qd', title: 'Questiones Disputatae', category: 'disputed', description: 'Questões sobre a Verdade, Potência, Mal e outros.', parts: ['De Veritate', 'De Potentia', 'De Malo'] }
];

const AquinasOpera: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [selectedWork, setSelectedWork] = useState<AquinasWork | null>(WORKS[0]);
  const [refInput, setRefInput] = useState('I q. 2 a. 3'); 
  const [article, setArticle] = useState<ThomisticArticle | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeObjection, setActiveObjection] = useState<number | null>(null);
  
  // Estados para o Modo de Leitura (Lectorium)
  const [fontSize, setFontSize] = useState(1.5); // em rem
  const [lineHeight, setLineHeight] = useState(1.6); // multiplicador

  const loadArticle = async () => {
    if (!selectedWork || !refInput) return;
    setLoading(true);
    setActiveObjection(null);
    try {
      const data = await fetchThomisticArticle(selectedWork.title, refInput, lang);
      setArticle(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const scrollToReply = (id: number) => {
    setActiveObjection(id);
    const element = document.getElementById(`reply-${id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Estilo dinâmico para os textos
  const textStyle = {
    fontSize: `${fontSize}rem`,
    lineHeight: lineHeight,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-48 animate-in fade-in duration-700">
      <header className="text-center space-y-4">
        <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Opera Omnia</h2>
        <p className="text-stone-400 italic text-2xl">S. Thomae Aquinatis Doctoris Angelici</p>
      </header>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8b0000] ml-4 dark:text-sacred">Biblioteca Escolástica</h3>
           <div className="space-y-2">
              {WORKS.map(work => (
                <button 
                  key={work.id}
                  onClick={() => setSelectedWork(work)}
                  className={`w-full text-left p-6 rounded-[2rem] border transition-all ${selectedWork?.id === work.id ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-xl' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-gold'}`}
                >
                   <h4 className="font-serif font-bold text-lg">{work.title}</h4>
                   <p className="text-[9px] opacity-40 uppercase mt-1 leading-tight">{work.description}</p>
                </button>
              ))}
           </div>
        </aside>

        <main className="lg:col-span-3 space-y-8">
           <section className="bg-white dark:bg-stone-900 p-8 rounded-[3.5rem] shadow-xl border border-stone-100 dark:border-stone-800 flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-1 space-y-2">
                 <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-4">Referência do Jacob-Gray (P q. A)</label>
                 <input 
                   type="text" 
                   value={refInput}
                   onChange={e => setRefInput(e.target.value)}
                   className="w-full px-8 py-5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl outline-none font-serif italic text-2xl focus:border-gold transition-all dark:text-white shadow-inner"
                 />
              </div>
              <button 
                onClick={loadArticle}
                disabled={loading}
                className="px-12 py-5 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                {loading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Disputar"}
              </button>
           </section>

           {article ? (
             <div className="relative">
                {/* LECTORIUM - CONTROLES DE LEITURA */}
                <div className="sticky top-4 z-[100] mb-8 flex justify-center">
                   <div className="bg-stone-900/90 backdrop-blur-xl border border-gold/30 rounded-full px-8 py-4 flex items-center gap-10 shadow-2xl">
                      <div className="flex items-center gap-4 border-r border-gold/20 pr-10">
                        <button onClick={() => setFontSize(Math.max(1, fontSize - 0.1))} className="text-gold hover:text-white transition-colors"><Icons.ArrowDown className="w-4 h-4 rotate-90" /></button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 w-16 text-center">Fonte {Math.round(fontSize * 10)}</span>
                        <button onClick={() => setFontSize(Math.min(3.5, fontSize + 0.1))} className="text-gold hover:text-white transition-colors"><Icons.ArrowDown className="w-4 h-4 -rotate-90" /></button>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setLineHeight(Math.max(1.2, lineHeight - 0.1))} className="text-gold hover:text-white transition-colors"><Icons.ArrowDown className="w-4 h-4" /></button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 w-24 text-center">Espaçamento</span>
                        <button onClick={() => setLineHeight(Math.min(2.5, lineHeight + 0.1))} className="text-gold hover:text-white transition-colors"><Icons.ArrowDown className="w-4 h-4 rotate-180" /></button>
                      </div>
                      <button onClick={() => { setFontSize(1.5); setLineHeight(1.6); }} className="p-2 bg-gold/10 rounded-full text-gold hover:bg-gold hover:text-stone-900 transition-all" title="Resetar">
                        <Icons.History className="w-4 h-4" />
                      </button>
                   </div>
                </div>

                <article className="parchment dark:bg-stone-900 p-10 md:p-24 rounded-[5rem] shadow-3xl border border-gold/10 space-y-20 animate-in slide-in-from-bottom-8 relative">
                    <header className="text-center space-y-6 border-b border-gold/10 pb-12">
                       <span className="text-[11px] font-black uppercase tracking-[1em] text-[#8b0000]">Quaestio Disputata</span>
                       <h3 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
                         Questio: {article.questionTitle} <br/> 
                         <span className="text-gold text-2xl md:text-4xl mt-4 block italic">Articulus: {article.articleTitle}</span>
                       </h3>
                       <ActionButtons itemId={`aquinas_${article.reference}`} type="aquinas" title={article.articleTitle} content={article.respondeo} className="justify-center mt-6" />
                    </header>

                    {/* Videtur Quod - Objeções Interativas */}
                    <section className="space-y-8">
                       <div className="flex items-center gap-4">
                          <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#8b0000]">I. Videtur Quod</h4>
                          <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800" />
                       </div>
                       <div className="grid gap-6">
                          {article.objections.map((obj) => (
                            <button 
                              key={obj.id}
                              onClick={() => scrollToReply(obj.id)}
                              className={`p-8 rounded-[2.5rem] border text-left transition-all group flex gap-6 items-start ${activeObjection === obj.id ? 'bg-sacred text-white border-sacred shadow-xl scale-[1.02]' : 'bg-white dark:bg-stone-950 border-stone-100 dark:border-stone-800 hover:border-gold'}`}
                            >
                               <span className={`text-sm font-black w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activeObjection === obj.id ? 'bg-white text-sacred' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 group-hover:bg-gold group-hover:text-stone-900'}`}>{obj.id}</span>
                               <p className="font-serif italic" style={textStyle}>{obj.text}</p>
                            </button>
                          ))}
                       </div>
                    </section>

                    {/* Sed Contra */}
                    <section className="bg-[#fcf8e8] dark:bg-stone-950 p-10 md:p-16 rounded-[4rem] border-l-[20px] border-gold shadow-xl space-y-6">
                       <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-gold">II. Sed Contra</h4>
                       <p className="font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight first-letter:text-7xl first-letter:text-sacred first-letter:mr-2 italic" style={textStyle}>
                         "{article.sedContra}"
                       </p>
                    </section>

                    {/* Respondeo - O Corpo do Artigo */}
                    <section className="space-y-8">
                       <div className="flex items-center gap-4">
                          <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#8b0000]">III. Respondeo</h4>
                          <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800" />
                       </div>
                       <div className="prose dark:prose-invert max-w-none">
                          <p className="font-serif text-stone-900 dark:text-stone-100 tracking-tight first-letter:text-9xl first-letter:font-bold first-letter:mr-6 first-letter:float-left first-letter:text-sacred" style={textStyle}>
                            {article.respondeo}
                          </p>
                       </div>
                    </section>

                    {/* Ad Rationes - Respostas Mapeadas */}
                    <section className="space-y-8 pb-20">
                       <div className="flex items-center gap-4">
                          <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-gold">IV. Ad Rationes</h4>
                          <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800" />
                       </div>
                       <div className="grid gap-10">
                          {article.replies.map((rep) => (
                            <div 
                              key={rep.id} 
                              id={`reply-${rep.id}`}
                              className={`p-10 rounded-[3rem] border transition-all duration-1000 ${activeObjection === rep.id ? 'bg-gold/10 border-gold ring-8 ring-gold/5' : 'bg-stone-50 dark:bg-stone-950 border-stone-100 dark:border-stone-800'}`}
                            >
                               <div className="flex items-center gap-4 mb-6">
                                  <span className="px-5 py-1.5 bg-stone-900 text-gold rounded-full text-[10px] font-black uppercase tracking-widest">Ad {rep.id}</span>
                                  <div className="h-px flex-1 bg-gold/10" />
                               </div>
                               <p className="font-serif text-stone-700 dark:text-stone-200 italic" style={textStyle}>
                                 {rep.text}
                               </p>
                            </div>
                          ))}
                       </div>
                    </section>

                    <footer className="text-center opacity-30 pt-20">
                       <Icons.Cross className="w-12 h-12 mx-auto" />
                       <p className="text-[11px] uppercase tracking-[0.8em] mt-6">Doctor Communis • Angelicus</p>
                    </footer>
                </article>
             </div>
           ) : (
             <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-10 opacity-30 grayscale hover:grayscale-0 transition-all duration-1000">
                <div className="p-10 bg-white dark:bg-stone-900 rounded-full shadow-2xl border border-gold/20">
                  <Icons.Feather className="w-24 h-24 text-stone-300" />
                </div>
                <div className="space-y-4">
                   <p className="text-4xl font-serif italic text-stone-400">Ars Thomistica</p>
                   <p className="text-xl font-serif italic text-stone-400 max-w-md mx-auto">Consulte a Suma por Referência para extrair a luz da inteligência escolástica.</p>
                </div>
             </div>
           )}
        </main>
      </div>
    </div>
  );
};

export default AquinasOpera;
