
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { fetchThomisticArticle } from '../services/gemini';
import { ThomisticArticle, AquinasWork } from '../types';
import { LangContext } from '../App';
import ActionButtons from '../components/ActionButtons';

const WORKS: AquinasWork[] = [
  { 
    id: 'st', 
    title: 'Summa Theologiae', 
    category: 'summa', 
    description: 'A síntese definitiva da doutrina cristã e da teologia sistemática.', 
    parts: ['I', 'I-II', 'II-II', 'III', 'Suppl'] 
  },
  { 
    id: 'qd', 
    title: 'Quaestiones Disputatae', 
    category: 'disputed', 
    description: 'Investigações profundas sobre os fundamentos da Verdade, da Potência e da Natureza do Mal.', 
    parts: ['De Veritate', 'De Potentia', 'De Malo'] 
  },
  { 
    id: 'scg', 
    title: 'Summa contra Gentiles', 
    category: 'summa', 
    description: 'Tratado apologético racional sobre a verdade da fé católica contra os erros filosóficos.', 
    parts: ['Lib. I', 'Lib. II', 'Lib. III', 'Lib. IV'] 
  }
];

const AquinasOpera: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [selectedWork, setSelectedWork] = useState<AquinasWork | null>(WORKS[0]);
  const [selectedPart, setSelectedPart] = useState<string>(WORKS[0].parts[0]);
  const [refInput, setRefInput] = useState('q. 2 a. 3'); 
  const [article, setArticle] = useState<ThomisticArticle | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeObjection, setActiveObjection] = useState<number | null>(null);
  
  const [fontSize, setFontSize] = useState(1.4); 
  const [lineHeight, setLineHeight] = useState(1.7);

  const loadArticle = async () => {
    if (!selectedWork || !refInput) return;
    setLoading(true);
    setActiveObjection(null);
    try {
      // Combina a parte selecionada (ex: De Veritate) com a questão/artigo (ex: q. 1 a. 1)
      const fullRef = `${selectedPart} ${refInput}`;
      const data = await fetchThomisticArticle(selectedWork.title, fullRef, lang);
      setArticle(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkSelect = (work: AquinasWork) => {
    setSelectedWork(work);
    setSelectedPart(work.parts[0]);
    if (work.id === 'st') setRefInput('q. 2 a. 3');
    else if (work.id === 'qd') setRefInput('q. 1 a. 1');
    else setRefInput('cap. 1');
  };

  const scrollToReply = (id: number) => {
    setActiveObjection(id);
    const element = document.getElementById(`reply-${id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const textStyle = {
    fontSize: `${fontSize}rem`,
    lineHeight: lineHeight,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-48 animate-in fade-in duration-700">
      <header className="text-center space-y-6 pt-10">
        <div className="flex justify-center">
           <div className="p-8 bg-stone-900 rounded-[3rem] shadow-sacred border-4 border-gold/40 rotate-3 transition-transform hover:rotate-0">
              <Icons.Feather className="w-12 h-12 text-gold" />
           </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-6xl md:text-9xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Opera Omnia</h2>
          <p className="text-stone-400 italic text-2xl">S. Thomae Aquinatis • Doctoris Angelici</p>
        </div>
      </header>

      <div className="grid lg:grid-cols-4 gap-12">
        {/* SIDEBAR: SELEÇÃO DE OBRAS */}
        <aside className="space-y-8">
           <div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-sacred ml-4 mb-6">Bibliotheca Sacra</h3>
             <div className="space-y-3">
                {WORKS.map(work => (
                  <button 
                    key={work.id}
                    onClick={() => handleWorkSelect(work)}
                    className={`w-full text-left p-8 rounded-[2.5rem] border-2 transition-all group relative overflow-hidden ${selectedWork?.id === work.id ? 'bg-[#1a1a1a] text-white border-gold shadow-2xl scale-[1.02]' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-gold/50'}`}
                  >
                     <div className="relative z-10 space-y-2">
                        <h4 className="font-serif font-bold text-xl group-hover:text-gold transition-colors">{work.title}</h4>
                        <p className={`text-[10px] italic font-serif leading-relaxed ${selectedWork?.id === work.id ? 'text-stone-400' : 'text-stone-500'}`}>{work.description}</p>
                     </div>
                     {selectedWork?.id === work.id && <div className="absolute top-0 right-0 p-4 opacity-10"><Icons.Cross className="w-12 h-12" /></div>}
                  </button>
                ))}
             </div>
           </div>

           <div className="bg-sacred p-10 rounded-[3.5rem] text-white shadow-xl relative overflow-hidden group">
              <Icons.Cross className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 group-hover:rotate-12 transition-transform duration-[3s]" />
              <div className="relative z-10">
                 <h4 className="text-[9px] font-black uppercase tracking-widest text-gold mb-4">Sursum Corda</h4>
                 <p className="font-serif italic text-lg leading-snug">"Tudo o que escrevi me parece palha comparado ao que vi."</p>
              </div>
           </div>
        </aside>

        {/* MAIN: BUSCA E LEITURA */}
        <main className="lg:col-span-3 space-y-10">
           <section className="bg-white dark:bg-stone-900 p-10 md:p-14 rounded-[4rem] shadow-2xl border border-stone-100 dark:border-stone-800 space-y-10">
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gold text-center">Configuratio Disputationis</h3>
                
                {/* SELETOR DE PARTES DINÂMICO */}
                <div className="flex flex-wrap justify-center gap-3">
                   {selectedWork?.parts.map(part => (
                     <button 
                       key={part}
                       onClick={() => setSelectedPart(part)}
                       className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selectedPart === part ? 'bg-gold text-stone-900 border-gold shadow-lg scale-105' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 border-transparent hover:border-gold/30'}`}
                     >
                       {part}
                     </button>
                   ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 space-y-3">
                   <label className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 ml-6">Quaestio & Articulus</label>
                   <div className="relative group">
                      <div className="absolute left-8 top-1/2 -translate-y-1/2 flex items-center gap-3">
                         <span className="text-gold font-serif font-bold text-xl">{selectedPart}</span>
                         <div className="w-px h-6 bg-stone-200" />
                      </div>
                      <input 
                        type="text" 
                        value={refInput}
                        onChange={e => setRefInput(e.target.value)}
                        placeholder="Ex: q. 1 a. 1" 
                        className="w-full pl-36 pr-10 py-8 bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-[2.5rem] outline-none font-serif italic text-2xl focus:border-gold transition-all dark:text-white shadow-inner"
                        onKeyPress={e => e.key === 'Enter' && loadArticle()}
                      />
                   </div>
                </div>
                <button 
                  onClick={loadArticle}
                  disabled={loading}
                  className="px-14 py-8 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-[2.5rem] font-black uppercase tracking-widest text-[12px] shadow-2xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  {loading ? <div className="w-6 h-6 border-4 border-current border-t-transparent rounded-full animate-spin" /> : <><Icons.Search className="w-5 h-5" /> <span>Consultar Suma</span></>}
                </button>
              </div>
           </section>

           {article ? (
             <div className="relative animate-in slide-in-from-bottom-8 duration-1000">
                {/* LECTORIUM: CONTROLES DE IMERSÃO */}
                <div className="sticky top-4 z-[100] mb-12 flex justify-center">
                   <div className="bg-stone-900/90 backdrop-blur-2xl border-2 border-gold/30 rounded-full px-10 py-5 flex items-center gap-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center gap-6 border-r border-gold/20 pr-10">
                        <button onClick={() => setFontSize(Math.max(1, fontSize - 0.1))} className="text-gold hover:text-white transition-all"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50 w-20 text-center">Fons: {Math.round(fontSize * 10)}</span>
                        <button onClick={() => setFontSize(Math.min(3, fontSize + 0.1))} className="text-gold hover:text-white transition-all"><Icons.ArrowDown className="w-5 h-5 -rotate-90" /></button>
                      </div>
                      <div className="flex items-center gap-6">
                        <button onClick={() => setLineHeight(Math.max(1.2, lineHeight - 0.1))} className="text-gold hover:text-white transition-all"><Icons.ArrowDown className="w-5 h-5" /></button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50 w-28 text-center">Spatium: {lineHeight.toFixed(1)}</span>
                        <button onClick={() => setLineHeight(Math.min(2.5, lineHeight + 0.1))} className="text-gold hover:text-white transition-all"><Icons.ArrowDown className="w-5 h-5 rotate-180" /></button>
                      </div>
                      <button onClick={() => { setFontSize(1.4); setLineHeight(1.7); }} className="p-3 bg-gold/10 rounded-xl text-gold hover:bg-gold hover:text-stone-900 transition-all">
                        <Icons.History className="w-5 h-5" />
                      </button>
                   </div>
                </div>

                <article className="parchment dark:bg-[#151310] p-12 md:p-32 rounded-[5rem] shadow-4xl border border-gold/10 space-y-24 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-4 bg-sacred" />
                    <header className="text-center space-y-8 border-b border-gold/10 pb-16">
                       <span className="text-[14px] font-black uppercase tracking-[1em] text-sacred">Quaestio Disputata</span>
                       <h3 className="text-4xl md:text-7xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-none">
                         {article.questionTitle}
                         <span className="text-gold text-2xl md:text-4xl mt-10 block italic font-normal">Articulus: {article.articleTitle}</span>
                       </h3>
                       <div className="flex justify-center gap-4 pt-6">
                          <ActionButtons itemId={`aquinas_${article.reference}`} type="aquinas" title={article.articleTitle} content={article.respondeo} />
                       </div>
                    </header>

                    {/* I. VIDETUR QUOD */}
                    <section className="space-y-12">
                       <div className="flex items-center gap-6">
                          <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-sacred">I. Videtur Quod</h4>
                          <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800" />
                       </div>
                       <div className="grid gap-8">
                          {article.objections.map((obj) => (
                            <button 
                              key={obj.id}
                              onClick={() => scrollToReply(obj.id)}
                              className={`p-10 rounded-[3rem] border-2 text-left transition-all group flex gap-8 items-start ${activeObjection === obj.id ? 'bg-sacred text-white border-sacred shadow-2xl scale-[1.02]' : 'bg-white dark:bg-stone-900 border-stone-50 dark:border-stone-800 hover:border-gold'}`}
                            >
                               <span className={`text-sm font-black w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner ${activeObjection === obj.id ? 'bg-white text-sacred' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 group-hover:bg-gold group-hover:text-stone-900'}`}>{obj.id}</span>
                               <p className="font-serif italic text-justify leading-relaxed" style={textStyle}>{obj.text}</p>
                            </button>
                          ))}
                       </div>
                    </section>

                    {/* II. SED CONTRA */}
                    <section className="bg-[#fcf8e8] dark:bg-stone-950 p-12 md:p-24 rounded-[4rem] border-l-[32px] border-gold shadow-3xl space-y-8 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform"><Icons.Book className="w-48 h-48" /></div>
                       <h4 className="text-[12px] font-black uppercase tracking-[0.8em] text-gold relative z-10">II. Sed Contra</h4>
                       <p className="font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight first-letter:text-9xl first-letter:text-sacred first-letter:float-left first-letter:mr-6 first-letter:mt-4 italic relative z-10" style={textStyle}>
                         "{article.sedContra}"
                       </p>
                    </section>

                    {/* III. RESPONDEO */}
                    <section className="space-y-12">
                       <div className="flex items-center gap-6">
                          <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-sacred">III. Respondeo</h4>
                          <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800" />
                       </div>
                       <div className="prose dark:prose-invert max-w-none">
                          <p className="font-serif text-stone-900 dark:text-stone-100 tracking-tight first-letter:text-[10em] first-letter:font-bold first-letter:mr-10 first-letter:float-left first-letter:text-sacred first-letter:leading-none text-justify" style={textStyle}>
                            {article.respondeo}
                          </p>
                       </div>
                    </section>

                    {/* IV. AD RATIONES */}
                    <section className="space-y-12 pb-32">
                       <div className="flex items-center gap-6">
                          <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-gold">IV. Ad Rationes</h4>
                          <div className="h-px flex-1 bg-gold/10" />
                       </div>
                       <div className="grid gap-12">
                          {article.replies.map((rep) => (
                            <div 
                              key={rep.id} 
                              id={`reply-${rep.id}`}
                              className={`p-12 md:p-16 rounded-[4rem] border-2 transition-all duration-1000 relative overflow-hidden ${activeObjection === rep.id ? 'bg-gold/5 border-gold ring-[24px] ring-gold/5 shadow-2xl' : 'bg-stone-50 dark:bg-stone-900 border-stone-100 dark:border-stone-800 shadow-inner'}`}
                            >
                               <div className="flex items-center gap-6 mb-10">
                                  <span className="px-8 py-2.5 bg-stone-900 text-gold rounded-full text-[12px] font-black uppercase tracking-widest shadow-lg">Ad {rep.id}</span>
                                  <div className="h-px flex-1 bg-gold/20" />
                               </div>
                               <p className="font-serif text-stone-700 dark:text-stone-300 italic text-justify leading-relaxed" style={textStyle}>
                                 {rep.text}
                               </p>
                            </div>
                          ))}
                       </div>
                    </section>

                    <footer className="text-center opacity-30 pt-24 border-t border-gold/10">
                       <Icons.Cross className="w-16 h-16 mx-auto text-stone-400" />
                       <p className="text-[14px] font-black uppercase tracking-[1em] mt-10">Doctor Communis • Angelicus</p>
                    </footer>
                </article>
             </div>
           ) : (
             <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-2000">
                <div className="p-16 bg-white dark:bg-stone-900 rounded-full shadow-[0_40px_80px_rgba(0,0,0,0.1)] border border-gold/20 relative group">
                  <div className="absolute inset-0 bg-gold/5 blur-3xl rounded-full scale-150 animate-pulse" />
                  <Icons.Feather className="w-32 h-32 text-stone-300 relative z-10 group-hover:rotate-12 transition-transform" />
                </div>
                <div className="space-y-6">
                   <p className="text-5xl font-serif italic text-stone-400 tracking-tighter">Ars Thomistica</p>
                   <p className="text-2xl font-serif italic text-stone-400 max-w-lg mx-auto leading-relaxed">Selecione uma obra e insira a referência jacob-gray para extrair o nexo da inteligência escolástica.</p>
                </div>
             </div>
           )}
        </main>
      </div>
    </div>
  );
};

export default AquinasOpera;
