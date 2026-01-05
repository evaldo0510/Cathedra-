
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { getLectioPoints, getDailyGospel } from '../services/gemini';
import { Gospel } from '../types';

enum LectioStep {
  PREPARATION = 0,
  LECTIO = 1,
  MEDITATIO = 2,
  ORATIO = 3,
  CONTEMPLATIO = 4,
  FINISH = 5
}

interface LectioProps {
  onNavigateDashboard?: () => void;
}

const STEPS_INFO = [
  { label: 'Preparação', desc: 'Invocação do Espírito' },
  { label: 'Lectio', desc: 'Leitura Atenta' },
  { label: 'Meditatio', desc: 'O que Deus diz?' },
  { label: 'Oratio', desc: 'O que digo a Deus?' },
  { label: 'Contemplatio', desc: 'Repouso em Deus' }
];

const LectioDivina: React.FC<LectioProps> = ({ onNavigateDashboard }) => {
  const [step, setStep] = useState<LectioStep>(LectioStep.PREPARATION);
  const [gospel, setGospel] = useState<Gospel | null>(null);
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<string[]>([]);
  const [prayerContent, setPrayerContent] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Carrega o Evangelho do Dia via IA ou Cache
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getDailyGospel();
        setGospel(data);
        const meditationPoints = await getLectioPoints(data.text);
        setPoints(meditationPoints);
      } catch (err) {
        console.error("Erro na Lectio:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const nextStep = () => {
    if (step < LectioStep.FINISH) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > LectioStep.PREPARATION) setStep(step - 1);
  };

  const renderProgress = () => (
    <div className="fixed top-0 left-0 right-0 z-[100] px-6 py-8 flex justify-center gap-2">
      {STEPS_INFO.map((s, i) => (
        <div 
          key={i} 
          className={`h-1.5 flex-1 max-w-[120px] rounded-full transition-all duration-700 ${i <= step ? 'bg-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-stone-200 dark:bg-stone-800'}`}
        />
      ))}
    </div>
  );

  const renderHeader = () => (
    <div className="text-center space-y-2 mb-12">
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gold animate-in fade-in duration-1000">
        Degrau {step} de 4
      </p>
      <h2 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
        {STEPS_INFO[step]?.label}
      </h2>
      <p className="text-stone-400 italic font-serif text-lg">{STEPS_INFO[step]?.desc}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-gold/10 border-t-gold rounded-full animate-spin" />
          <Icons.Cross className="absolute inset-0 m-auto w-8 h-8 text-sacred animate-pulse" />
        </div>
        <p className="text-stone-400 font-serif italic text-xl">Invocando o Espírito Santo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-20 px-4 relative max-w-4xl mx-auto">
      {step !== LectioStep.PREPARATION && step !== LectioStep.FINISH && renderProgress()}

      {/* Botão de Sair/Voltar */}
      {step !== LectioStep.FINISH && (
        <button 
          onClick={() => step === LectioStep.PREPARATION ? onNavigateDashboard?.() : setShowExitConfirm(true)}
          className="fixed top-8 left-8 p-4 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-800 hover:text-sacred transition-all z-[110]"
        >
          <Icons.Cross className="w-5 h-5 rotate-45" />
        </button>
      )}

      {/* Overlay de Confirmação de Saída */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white dark:bg-stone-950 p-10 rounded-[3rem] shadow-3xl border border-stone-200 dark:border-stone-800 max-w-sm w-full text-center space-y-6">
            <h3 className="text-2xl font-serif font-bold">Interromper Oração?</h3>
            <p className="text-stone-500 font-serif italic">O silêncio com o Senhor é precioso. Deseja mesmo sair agora?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => onNavigateDashboard?.()} className="py-4 bg-sacred text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Sim, encerrar</button>
              <button onClick={() => setShowExitConfirm(false)} className="py-4 bg-stone-100 dark:bg-stone-800 rounded-2xl font-black uppercase tracking-widest text-[10px]">Continuar Orando</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full transition-all duration-700">
        {step === LectioStep.PREPARATION && (
          <div className="text-center space-y-12 animate-in fade-in zoom-in-95 duration-1000">
            <div className="flex justify-center">
              <div className="p-10 bg-white dark:bg-stone-900 rounded-full shadow-2xl border border-gold/20 relative group">
                <div className="absolute inset-0 bg-gold/5 blur-3xl rounded-full scale-150 group-hover:scale-110 transition-transform" />
                <Icons.Cross className="w-16 h-16 text-sacred relative z-10" />
              </div>
            </div>
            <div className="space-y-6">
              <h1 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter">Lectio Divina</h1>
              <p className="text-stone-400 italic font-serif text-2xl max-w-xl mx-auto leading-relaxed">
                "A leitura busca a doçura da vida bem-aventurada, a meditação encontra-a, a oração pede-a, a contemplação saboreia-a."
              </p>
              <cite className="block text-[10px] font-black uppercase tracking-[0.4em] text-gold">— Guigo, o Cartuxo</cite>
            </div>
            <button 
              onClick={nextStep}
              className="px-16 py-6 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              Iniciar Sanctum
            </button>
          </div>
        )}

        {step === LectioStep.LECTIO && (
          <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700">
            {renderHeader()}
            <div className="bg-white dark:bg-stone-900 p-10 md:p-16 rounded-[4rem] shadow-3xl border border-stone-100 dark:border-stone-800 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-gold/30" />
              <p className="text-3xl md:text-5xl font-serif italic text-stone-800 dark:text-stone-100 leading-snug text-center tracking-tight">
                "{gospel?.text}"
              </p>
              <div className="mt-12 flex justify-center items-center gap-4">
                <div className="h-px w-12 bg-stone-200" />
                <span className="text-[12px] font-black uppercase tracking-[0.2em] text-sacred">{gospel?.reference}</span>
                <div className="h-px w-12 bg-stone-200" />
              </div>
            </div>
            <div className="flex justify-center pt-8">
              <button onClick={nextStep} className="px-12 py-5 bg-[#1a1a1a] dark:bg-[#d4af37] text-[#d4af37] dark:text-stone-900 rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all">
                Mergulhar na Meditação
              </button>
            </div>
          </div>
        )}

        {step === LectioStep.MEDITATIO && (
          <div className="space-y-10 animate-in slide-in-from-right duration-700">
            {renderHeader()}
            <div className="grid gap-6">
              {points.map((point, i) => (
                <div 
                  key={i} 
                  className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-xl flex items-start gap-8 group hover:border-gold transition-all animate-in fade-in" 
                  style={{ animationDelay: `${i * 200}ms` }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold font-black text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {i + 1}
                  </div>
                  <p className="text-xl md:text-2xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">
                    {point}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 pt-10">
              <button onClick={prevStep} className="px-8 py-4 text-stone-400 font-black uppercase tracking-widest text-[10px]">Voltar à Leitura</button>
              <button onClick={nextStep} className="px-12 py-5 bg-gold text-stone-900 rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all">
                Responder em Oração
              </button>
            </div>
          </div>
        )}

        {step === LectioStep.ORATIO && (
          <div className="space-y-10 animate-in fade-in duration-700">
            {renderHeader()}
            <div className="bg-white dark:bg-stone-900 p-10 md:p-14 rounded-[3.5rem] shadow-3xl border border-gold/20">
              <textarea 
                value={prayerContent}
                onChange={(e) => setPrayerContent(e.target.value)}
                placeholder="Fale com o Senhor... O que este texto desperta no seu coração?"
                className="w-full h-64 bg-transparent outline-none font-serif italic text-2xl md:text-3xl text-stone-800 dark:text-stone-100 resize-none custom-scrollbar"
              />
              <div className="mt-8 pt-8 border-t border-stone-50 flex items-center justify-between opacity-40">
                <span className="text-[10px] font-black uppercase tracking-widest">Diálogo com o Criador</span>
                <Icons.Feather className="w-6 h-6" />
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <button onClick={nextStep} className="px-16 py-6 bg-sacred text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all">
                Entrar em Contemplação
              </button>
            </div>
          </div>
        )}

        {step === LectioStep.CONTEMPLATIO && (
          <div className="text-center space-y-12 animate-in fade-in duration-[2s]">
            <header className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.8em] text-stone-300">Summum Silentium</span>
              <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter">Contemplação</h2>
            </header>
            
            <div className="flex justify-center py-10">
              <div className="relative">
                <div className="w-40 h-40 rounded-full bg-gold/5 animate-ping absolute inset-0" />
                <div className="w-40 h-40 rounded-full border-4 border-gold/20 flex items-center justify-center relative bg-white dark:bg-stone-950 shadow-inner">
                  <div className="w-4 h-4 bg-gold rounded-full animate-pulse" />
                </div>
              </div>
            </div>
            
            <p className="text-2xl md:text-4xl font-serif italic text-stone-400 max-w-xl mx-auto leading-relaxed">
              "Nada digas, nada peças. Apenas repouse no olhar de quem te ama."
            </p>
            
            <button 
              onClick={nextStep}
              className="px-12 py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-black uppercase tracking-widest text-[10px] opacity-20 hover:opacity-100 transition-opacity"
            >
              Concluir Oração
            </button>
          </div>
        )}

        {step === LectioStep.FINISH && (
          <div className="text-center space-y-10 animate-in zoom-in-95 duration-1000">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gold rounded-full flex items-center justify-center text-stone-900 shadow-2xl">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl font-serif font-bold">Deo Gratias</h2>
              <p className="text-stone-400 font-serif italic text-xl">Sua oração foi registrada no memorial do coração.</p>
            </div>
            <div className="bg-[#fcf8e8] dark:bg-stone-800 p-8 rounded-[3rem] border border-gold/20 max-w-md mx-auto">
               <p className="text-stone-700 dark:text-stone-300 text-lg font-serif italic leading-relaxed">
                 "Guarda a Palavra no teu coração e ela te guardará no caminho."
               </p>
            </div>
            <button 
              onClick={onNavigateDashboard}
              className="px-12 py-5 bg-stone-900 dark:bg-[#d4af37] text-white dark:text-stone-900 rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95"
            >
              Retornar ao Mundo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LectioDivina;
