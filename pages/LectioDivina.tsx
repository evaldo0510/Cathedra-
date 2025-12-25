
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
          <div className="max-w-3xl mx-auto text-center space-y-12 py-20 animate-in fade-in duration-1000">
            <div className="flex justify-center">
               <div className="p-10 bg-[#fcf8e8] rounded-full border border-[#d4af37]/30 shadow-sacred animate-pulse">
                  <Icons.Cross className="w-16 h-16 text-[#8b0000]" />
               </div>
            </div>
            <h2 className="text-6xl font-serif font-bold text-stone-900 tracking-tight">Lectio Divina</h2>
            <p className="text-stone-500 italic font-serif text-2xl leading-relaxed">
              "A leitura busca a doçura da vida bem-aventurada, a meditação encontra-a, a oração pede-a, a contemplação saboreia-a."
            </p>
            <div className="pt-8">
              <button 
                onClick={startLectio}
                disabled={loading}
                className="px-16 py-8 bg-[#1a1a1a] text-[#d4af37] rounded-full font-black uppercase tracking-[0.4em] text-xs shadow-2xl hover:bg-[#8b0000] hover:text-white transition-all active:scale-95"
              >
                {loading ? 'Invocando o Espírito...' : 'Iniciar Oração de Hoje'}
              </button>
            </div>
          </div>
        );

      case LectioStep.LECTIO:
        return (
          <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-10 duration-1000">
            <header className="text-center">
               <span className="text-[10px] font-black uppercase tracking-[0.8em] text-[#d4af37]">Degrau I: Lectio</span>
               <h3 className="text-4xl font-serif font-bold text-stone-900 mt-4">Escuta da Palavra</h3>
            </header>
            <div className="bg-white p-16 md:p-24 rounded-[5rem] shadow-3xl border border-stone-100 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                  <Icons.Book className="w-64 h-64 text-[#d4af37]" />
               </div>
               <p className="text-4xl md:text-5xl font-serif italic text-stone-800 leading-snug tracking-tight relative z-10 text-center">
                  "{text?.text}"
               </p>
               <div className="mt-12 text-center">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#8b0000] px-6 py-2 bg-[#fcf8e8] rounded-full">
                    {text?.reference}
                  </span>
               </div>
            </div>
            <div className="flex justify-center">
               <button onClick={() => setStep(LectioStep.MEDITATIO)} className="px-12 py-5 bg-[#1a1a1a] text-[#d4af37] rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-stone-800 transition-all">
                  Prosseguir para Meditação →
               </button>
            </div>
          </div>
        );

      case LectioStep.MEDITATIO:
        return (
          <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-right duration-700">
            <header className="text-center">
               <span className="text-[10px] font-black uppercase tracking-[0.8em] text-[#d4af37]">Degrau II: Meditatio</span>
               <h3 className="text-4xl font-serif font-bold text-stone-900 mt-4">A Palavra em Mim</h3>
            </header>
            <div className="grid gap-8">
               {meditationPoints.map((point, i) => (
                 <div key={i} className="bg-white p-12 rounded-[3.5rem] border border-stone-100 shadow-xl flex items-start gap-8 group hover:border-[#d4af37]/40 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-[#fcf8e8] flex items-center justify-center text-[#d4af37] font-black flex-shrink-0">
                       {i + 1}
                    </div>
                    <p className="text-2xl font-serif italic text-stone-700 leading-relaxed group-hover:text-stone-900 transition-colors">
                      {point}
                    </p>
                 </div>
               ))}
            </div>
            <div className="flex justify-center gap-6">
               <button onClick={() => setStep(LectioStep.LECTIO)} className="px-10 py-5 bg-stone-100 text-stone-400 rounded-full font-black uppercase tracking-widest text-[10px]">Voltar</button>
               <button onClick={() => setStep(LectioStep.ORATIO)} className="px-12 py-5 bg-[#1a1a1a] text-[#d4af37] rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl">Prosseguir para Oração →</button>
            </div>
          </div>
        );

      case LectioStep.ORATIO:
        return (
          <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-right duration-700">
            <header className="text-center">
               <span className="text-[10px] font-black uppercase tracking-[0.8em] text-[#d4af37]">Degrau III: Oratio</span>
               <h3 className="text-4xl font-serif font-bold text-stone-900 mt-4">Diálogo com o Senhor</h3>
            </header>
            <div className="bg-white p-16 rounded-[4rem] shadow-3xl border border-stone-100 space-y-8">
               <p className="text-xl font-serif italic text-stone-400 text-center">Responda a Deus o que a Palavra suscitou em seu coração.</p>
               <textarea 
                  value={prayer}
                  onChange={e => setPrayer(e.target.value)}
                  placeholder="Minha oração hoje é..."
                  className="w-full h-64 bg-stone-50 border border-stone-100 rounded-[2.5rem] p-10 outline-none focus:ring-16 focus:ring-[#d4af37]/5 font-serif italic text-2xl resize-none"
               />
            </div>
            <div className="flex justify-center gap-6">
               <button onClick={() => setStep(LectioStep.MEDITATIO)} className="px-10 py-5 bg-stone-100 text-stone-400 rounded-full font-black uppercase tracking-widest text-[10px]">Voltar</button>
               <button onClick={() => setStep(LectioStep.CONTEMPLATIO)} className="px-12 py-5 bg-[#8b0000] text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl">Entrar em Contemplação →</button>
            </div>
          </div>
        );

      case LectioStep.CONTEMPLATIO:
        return (
          <div className="max-w-4xl mx-auto space-y-12 text-center animate-in zoom-in-95 duration-1000 py-20">
            <div className="flex justify-center mb-12">
               <div className="w-32 h-32 bg-stone-900 rounded-full flex items-center justify-center text-[#d4af37] shadow-sacred animate-ping opacity-20" />
               <div className="absolute w-32 h-32 bg-stone-900 rounded-full flex items-center justify-center text-[#d4af37] shadow-sacred">
                  <Icons.Cross className="w-12 h-12" />
               </div>
            </div>
            <header>
               <span className="text-[10px] font-black uppercase tracking-[0.8em] text-[#d4af37]">Degrau IV: Contemplatio</span>
               <h3 className="text-5xl font-serif font-bold text-stone-900 mt-6">Silêncio de Amor</h3>
            </header>
            <p className="text-3xl font-serif italic text-stone-500 leading-relaxed max-w-2xl mx-auto">
               Permaneça em silêncio por alguns minutos, apenas na presença d'Aquele que o ama. Sinta a doçura da verdade saboreada.
            </p>
            <div className="pt-16">
               <button 
                  onClick={() => {
                     // Aqui salvaríamos a oração no progresso do usuário via Supabase
                     setStep(LectioStep.PREPARATION);
                     setPrayer('');
                  }}
                  className="px-16 py-6 bg-stone-50 text-stone-400 border border-stone-100 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-[#1a1a1a] hover:text-[#d4af37] transition-all"
               >
                  Encerrar e Guardar no Coração
               </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center pb-32">
       {renderStep()}
    </div>
  );
};

export default LectioDivina;
