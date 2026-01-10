
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { getMoralDiscernment } from '../services/gemini';
import { LangContext } from '../App';

interface ExaminationItem {
  id: string;
  text: string;
  category: string;
}

const EXAM_DATA: ExaminationItem[] = [
  { id: 'm1_1', category: 'I Mandamento', text: 'Duvidei voluntariamente das verdades da Fé?' },
  { id: 'm1_2', category: 'I Mandamento', text: 'Pratiquei superstição, feitiçaria ou tarô?' },
  { id: 'm2_1', category: 'II Mandamento', text: 'Usei o Nome de Deus em vão ou sem respeito?' },
  { id: 'm3_1', category: 'III Mandamento', text: 'Faltei à Missa aos domingos ou festas de guarda por culpa própria?' },
  { id: 'm4_1', category: 'IV Mandamento', text: 'Faltei com respeito ou obediência aos meus pais ou superiores?' },
  { id: 'm5_1', category: 'V Mandamento', text: 'Alimentei ódio, desejo de vingança ou fui causa de escândalo?' },
  { id: 'm6_1', category: 'VI & IX Mandamentos', text: 'Consenti em pensamentos ou desejos impuros?' },
  { id: 'm6_2', category: 'VI & IX Mandamentos', text: 'Cometi atos impuros comigo mesmo ou com outros?' },
  { id: 'm7_1', category: 'VII & X Mandamentos', text: 'Roubei algo ou não restituí o que não me pertence?' },
  { id: 'm8_1', category: 'VIII Mandamento', text: 'Menti, fiz falsos testemunhos ou caluniei alguém?' }
];

const Poenitentia: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [activeStep, setActiveStep] = useState<'prep' | 'exam' | 'rite'>('prep');
  const [markedSins, setMarkedSins] = useState<Set<string>>(new Set());
  const [discernmentInput, setDiscernmentInput] = useState('');
  const [moralResult, setMoralResult] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [lastConfession, setLastConfession] = useState('1 mês');

  const toggleSin = (id: string) => {
    setMarkedSins(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDiscernment = async () => {
    if (!discernmentInput.trim()) return;
    setLoadingAI(true);
    try {
      const res = await getMoralDiscernment(discernmentInput, lang);
      setMoralResult(res);
    } catch (e) { console.error(e); }
    finally { setLoadingAI(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32 animate-in fade-in duration-1000">
      <header className="text-center space-y-4">
        <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-[#5e2a84] tracking-tight">Poenitentia</h2>
        <p className="text-stone-400 italic text-xl">"Cor contritum et humiliatum, Deus, non despicies."</p>
      </header>

      {/* Navegação por Etapas */}
      <nav className="flex justify-center gap-4">
         {[
           { id: 'prep', label: 'Preparação', icon: Icons.History },
           { id: 'exam', label: 'Exame', icon: Icons.Search },
           { id: 'rite', label: 'O Rito', icon: Icons.Cross }
         ].map(step => (
           <button 
             key={step.id} 
             onClick={() => setActiveStep(step.id as any)}
             className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeStep === step.id ? 'bg-[#5e2a84] text-white shadow-xl scale-105' : 'bg-white dark:bg-stone-900 text-stone-400'}`}
           >
             {step.label}
           </button>
         ))}
      </nav>

      {/* Conteúdo dinâmico */}
      <main className="min-h-[50vh]">
         {activeStep === 'prep' && (
           <section className="space-y-10 animate-in slide-in-from-bottom-6">
              <div className="bg-white dark:bg-stone-900 p-10 md:p-16 rounded-[3.5rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-8">
                 <h3 className="text-3xl font-serif font-bold text-[#5e2a84]">Antes de Começar</h3>
                 <p className="text-xl font-serif italic text-stone-600 dark:text-stone-300 leading-relaxed">
                   Invoque o Espírito Santo para que Ele ilumine sua memória e lhe conceda a graça do arrependimento sincero. A confissão não é um interrogatório, mas um encontro com a Misericórdia.
                 </p>
                 <div className="p-8 bg-[#fcf8e8] dark:bg-stone-800/50 rounded-3xl border-l-8 border-[#5e2a84]">
                    <p className="text-lg font-serif font-bold italic">"Meu Deus, eu me arrependo de todo o coração de todos os meus pecados..."</p>
                 </div>
              </div>

              <div className="bg-stone-900 p-10 md:p-16 rounded-[3.5rem] text-white space-y-8">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">Discernimento de Consciência (IA)</h4>
                 <div className="space-y-4">
                    <textarea 
                      value={discernmentInput}
                      onChange={e => setDiscernmentInput(e.target.value)}
                      placeholder="Descreva uma dúvida moral para análise doutrinária..."
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 outline-none font-serif italic text-xl focus:border-[#d4af37] transition-all"
                    />
                    <button 
                      onClick={handleDiscernment}
                      disabled={loadingAI}
                      className="px-10 py-4 bg-[#d4af37] text-stone-900 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                      {loadingAI ? "Consultando Suma..." : "Analisar Gravidade"}
                    </button>
                 </div>
                 {moralResult && (
                   <div className="p-8 bg-white/5 rounded-3xl border border-white/10 animate-in fade-in">
                      <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mb-4 inline-block ${moralResult.gravity === 'mortal' ? 'bg-red-600' : 'bg-gold text-stone-900'}`}>{moralResult.gravity === 'mortal' ? 'Matéria Grave' : 'Matéria Leve/Duvidosa'}</span>
                      <p className="text-xl font-serif italic text-white/80 leading-relaxed">{moralResult.explanation}</p>
                      <p className="text-[9px] uppercase text-white/30 mt-4">Referência: {moralResult.cicRef}</p>
                   </div>
                 )}
              </div>
           </section>
         )}

         {activeStep === 'exam' && (
           <section className="space-y-8 animate-in slide-in-from-right-6">
              <div className="flex items-center justify-between px-6">
                 <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">{markedSins.size} faltas identificadas</span>
                 <button onClick={() => setMarkedSins(new Set())} className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:underline">Limpar Tudo</button>
              </div>
              
              <div className="grid gap-4">
                 {EXAM_DATA.map(item => (
                   <button 
                    key={item.id} 
                    onClick={() => toggleSin(item.id)}
                    className={`p-8 rounded-[2.5rem] text-left transition-all border flex items-center justify-between group ${markedSins.has(item.id) ? 'bg-[#5e2a84]/10 border-[#5e2a84] shadow-inner' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'}`}
                   >
                      <div className="space-y-1">
                         <span className="text-[8px] font-black uppercase text-[#5e2a84]/60">{item.category}</span>
                         <h4 className="text-xl font-serif text-stone-800 dark:text-stone-200">{item.text}</h4>
                      </div>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${markedSins.has(item.id) ? 'bg-[#5e2a84] border-[#5e2a84] text-white' : 'border-stone-100 group-hover:border-[#5e2a84]'}`}>
                         {markedSins.has(item.id) && <Icons.Cross className="w-4 h-4" />}
                      </div>
                   </button>
                 ))}
              </div>
              
              <div className="text-center py-10 opacity-40">
                 <p className="text-xs font-serif italic">Seus dados de exame são privados e não saem deste dispositivo.</p>
              </div>
           </section>
         )}

         {activeStep === 'rite' && (
           <section className="space-y-10 animate-in slide-in-from-left-6">
              <div className="bg-white dark:bg-stone-900 p-10 md:p-20 rounded-[4rem] border border-[#5e2a84]/20 shadow-3xl space-y-12">
                 <header className="text-center border-b border-stone-100 dark:border-stone-800 pb-10">
                    <h3 className="text-3xl font-serif font-bold text-[#5e2a84]">Roteiro da Confissão</h3>
                    <div className="mt-6 flex justify-center gap-4">
                       <label className="flex flex-col items-center">
                          <span className="text-[8px] font-black uppercase text-stone-400 mb-1">Última Confissão</span>
                          <input type="text" value={lastConfession} onChange={e => setLastConfession(e.target.value)} className="bg-stone-50 dark:bg-stone-800 px-4 py-2 rounded-xl text-center text-sm outline-none border border-stone-100" />
                       </label>
                    </div>
                 </header>

                 <div className="space-y-12 max-w-2xl mx-auto">
                    <div className="space-y-4">
                       <h5 className="text-[10px] font-black uppercase tracking-widest text-[#5e2a84]">1. Saudação</h5>
                       <p className="text-2xl font-serif italic leading-relaxed">
                         "Abençoe-me padre, porque eu pequei. Minha última confissão foi há <span className="text-[#5e2a84] font-bold">{lastConfession}</span>."
                       </p>
                    </div>

                    <div className="space-y-4">
                       <h5 className="text-[10px] font-black uppercase tracking-widest text-[#5e2a84]">2. Acusação</h5>
                       <p className="text-2xl font-serif italic leading-relaxed">
                         "Confesso estes pecados para a glória de Deus e salvação da minha alma..."
                       </p>
                       <ul className="space-y-3 pt-4">
                          {Array.from(markedSins).map(id => {
                            const sin = EXAM_DATA.find(i => i.id === id);
                            return sin ? (
                              <li key={id} className="flex items-center gap-4 text-stone-400">
                                 <div className="w-1.5 h-1.5 rounded-full bg-[#5e2a84]" />
                                 <span className="font-serif text-lg">{sin.text}</span>
                              </li>
                            ) : null;
                          })}
                          <li className="text-stone-400 font-serif italic text-lg opacity-60 italic">...e todos os pecados de que não me lembro agora.</li>
                       </ul>
                    </div>

                    <div className="space-y-4">
                       <h5 className="text-[10px] font-black uppercase tracking-widest text-[#5e2a84]">3. Ato de Contrição</h5>
                       <div className="p-8 bg-stone-50 dark:bg-stone-800 rounded-3xl border border-stone-100">
                          <p className="text-xl font-serif italic leading-relaxed">
                             "Senhor meu Jesus Cristo, Deus e homem verdadeiro, Criador e Redentor meu, por serdes Vós quem sois, sumamente bom e digno de ser amado sobre todas as coisas..."
                          </p>
                       </div>
                    </div>
                 </div>
              </div>
           </section>
         )}
      </main>

      <footer className="text-center pt-20 opacity-30">
         <Icons.Cross className="w-10 h-10 mx-auto" />
         <p className="text-[10px] font-black uppercase tracking-[0.5em] mt-6">Ego te absolvo a peccatis tuis</p>
      </footer>
    </div>
  );
};

export default Poenitentia;
