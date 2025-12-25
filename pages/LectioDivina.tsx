
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { getLectioPoints, getDailyGospel } from '../services/gemini';
import { Verse, Gospel } from '../types';

enum LectioStep {
  PREPARATION = 0,
  LECTIO = 1,
  MEDITATIO = 2,
  ORATIO = 3,
  CONTEMPLATIO = 4
}

const LectioDivina: React.FC = () => {
  const [step, setStep] = useState<LectioStep>(LectioStep.PREPARATION);
  const [text, setText] = useState<Gospel | null>(null);
  const [loading, setLoading] = useState(false);
  const [meditationPoints, setMeditationPoints] = useState<string[]>([]);
  const [prayer, setPrayer] = useState('');

  const startLectio = async () => {
    setLoading(true);
    try {
      const gospel = await getDailyGospel();
      setText(gospel);
      const points = await getLectioPoints(gospel.text);
      setMeditationPoints(points);
      setStep(LectioStep.LECTIO);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case LectioStep.PREPARATION:
        return (
          <div className="max-w-xl mx-auto text-center space-y-10 py-10 px-4 animate-in fade-in duration-700">
            <div className="flex justify-center">
               <div className="p-8 bg-[#fcf8e8] dark:bg-stone-900 rounded-full border border-[#d4af37]/30 shadow-lg animate-pulse">
                  <Icons.Cross className="w-12 h-12 text-[#8b0000] dark:text-[#d4af37]" />
               </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">Lectio Divina</h2>
            <p className="text-stone-500 dark:text-stone-400 italic font-serif text-lg leading-relaxed">
              "A leitura busca a doçura da vida bem-aventurada, a meditação encontra-a."
            </p>
            <button 
              onClick={startLectio}
              disabled={loading}
              className="w-full py-6 bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl"
            >
              {loading ? 'Invocando o Espírito...' : 'Iniciar Oração'}
            </button>
          </div>
        );

      case LectioStep.LECTIO:
        return (
          <div className="max-w-2xl mx-auto space-y-8 px-4 animate-in slide-in-from-bottom-6">
            <header className="text-center">
               <span className="text-[9px] font-black uppercase tracking-widest text-[#d4af37]">Degrau I: Lectio</span>
            </header>
            <div className="bg-white dark:bg-stone-900 p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-stone-100 dark:border-stone-800">
               <p className="text-2xl md:text-4xl font-serif italic text-stone-800 dark:text-stone-100 leading-snug text-center">
                  "{text?.text}"
               </p>
               <div className="mt-8 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8b0000] px-4 py-2 bg-[#fcf8e8] dark:bg-stone-800 rounded-full">
                    {text?.reference}
                  </span>
               </div>
            </div>
            <button onClick={() => setStep(LectioStep.MEDITATIO)} className="w-full py-5 bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg">
               Meditação →
            </button>
          </div>
        );

      case LectioStep.MEDITATIO:
        return (
          <div className="max-w-2xl mx-auto space-y-6 px-4 animate-in slide-in-from-right duration-500">
            <header className="text-center"><span className="text-[9px] font-black uppercase tracking-widest text-[#d4af37]">Degrau II: Meditatio</span></header>
            <div className="space-y-4">
               {meditationPoints.map((point, i) => (
                 <div key={i} className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-md flex items-start gap-5">
                    <div className="w-8 h-8 rounded-lg bg-[#fcf8e8] dark:bg-stone-800 flex items-center justify-center text-[#d4af37] font-black flex-shrink-0 text-xs">{i + 1}</div>
                    <p className="text-lg font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">{point}</p>
                 </div>
               ))}
            </div>
            <div className="flex flex-col gap-3">
               <button onClick={() => setStep(LectioStep.ORATIO)} className="w-full py-5 bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px]">Oração →</button>
               <button onClick={() => setStep(LectioStep.LECTIO)} className="text-[9px] font-black uppercase tracking-widest text-stone-300">Voltar</button>
            </div>
          </div>
        );

      case LectioStep.ORATIO:
        return (
          <div className="max-w-2xl mx-auto space-y-6 px-4 animate-in slide-in-from-right">
            <header className="text-center"><span className="text-[9px] font-black uppercase tracking-widest text-[#d4af37]">Degrau III: Oratio</span></header>
            <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 space-y-6">
               <textarea 
                  value={prayer}
                  onChange={e => setPrayer(e.target.value)}
                  placeholder="Minha oração hoje é..."
                  className="w-full h-48 bg-stone-50 dark:bg-stone-800 dark:text-white border border-stone-100 dark:border-stone-700 rounded-2xl p-6 outline-none font-serif italic text-lg"
               />
            </div>
            <button onClick={() => setStep(LectioStep.CONTEMPLATIO)} className="w-full py-5 bg-[#8b0000] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg">Entrar em Contemplação →</button>
          </div>
        );

      case LectioStep.CONTEMPLATIO:
        return (
          <div className="max-w-2xl mx-auto space-y-10 text-center animate-in zoom-in-95 duration-1000 py-10 px-4">
            <div className="flex justify-center mb-8">
               <div className="w-20 h-20 bg-stone-900 rounded-full flex items-center justify-center text-[#d4af37] shadow-lg animate-pulse"><Icons.Cross className="w-10 h-10" /></div>
            </div>
            <header><span className="text-[9px] font-black uppercase tracking-widest text-[#d4af37]">Degrau IV: Contemplatio</span><h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-4">Silêncio de Amor</h3></header>
            <p className="text-xl font-serif italic text-stone-500 dark:text-stone-400 leading-relaxed max-w-sm mx-auto">Permaneça em silêncio por alguns minutos na presença do Senhor.</p>
            <button onClick={() => setStep(LectioStep.PREPARATION)} className="w-full py-5 bg-stone-50 dark:bg-stone-800 text-stone-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">Encerrar Oração</button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center pb-24">{renderStep()}</div>
  );
};

export default LectioDivina;
