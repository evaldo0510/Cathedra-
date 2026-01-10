
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { fetchQuizQuestions } from '../services/gemini';
import { QuizQuestion, Language, AppRoute } from '../types';
import { LangContext } from '../App';

const CATEGORIES = [
  { id: 'bible', name: 'Sagradas Escrituras', icon: Icons.Book, color: 'bg-emerald-600' },
  { id: 'doctrine', name: 'Doutrina e CIC', icon: Icons.Cross, color: 'bg-sacred' },
  { id: 'saints', name: 'Vida dos Santos', icon: Icons.Users, color: 'bg-gold' },
  { id: 'history', name: 'História da Igreja', icon: Icons.History, color: 'bg-stone-800' }
];

const DIFFICULTIES = [
  { id: 'easy', name: 'Tirocinium', desc: 'Iniciante' },
  { id: 'medium', name: 'Studium', desc: 'Intermediário' },
  { id: 'hard', name: 'Magisterium', desc: 'Avançado' }
];

const Certamen: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [gameState, setGameState] = useState<'lobby' | 'loading' | 'playing' | 'results'>('lobby');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [difficulty, setDifficulty] = useState('easy');

  const startQuiz = async () => {
    setGameState('loading');
    const catName = CATEGORIES.find(c => c.id === category)?.name || 'Geral';
    const qs = await fetchQuizQuestions(catName, difficulty, lang);
    setQuestions(qs);
    setCurrentIndex(0);
    setScore(0);
    setGameState('playing');
  };

  const handleOptionClick = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    setShowExplanation(true);
    if (idx === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setGameState('results');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32 animate-in fade-in duration-1000">
      <header className="text-center space-y-4">
        <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Certamen Sacrum</h2>
        <p className="text-stone-400 italic text-xl">"Aquele que estuda a Verdade, vence o mundo."</p>
      </header>

      {gameState === 'lobby' && (
        <div className="bg-white dark:bg-stone-900 p-8 md:p-16 rounded-[4rem] shadow-3xl border border-stone-100 dark:border-stone-800 space-y-12 animate-in zoom-in-95">
          <div className="space-y-8">
            <h3 className="text-2xl font-serif font-bold text-center">Escolha sua Área de Disputa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-8 rounded-[2.5rem] border-2 transition-all flex items-center gap-6 group ${category === cat.id ? 'bg-stone-900 text-gold border-gold scale-105' : 'bg-stone-50 dark:bg-stone-800 border-transparent text-stone-500'}`}
                >
                  <div className={`p-4 rounded-2xl ${cat.color} text-white shadow-lg`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xl font-serif font-bold">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
             <h3 className="text-2xl font-serif font-bold text-center">Nível de Rigor Escolástico</h3>
             <div className="flex flex-wrap justify-center gap-4">
                {DIFFICULTIES.map(diff => (
                  <button 
                    key={diff.id}
                    onClick={() => setDifficulty(diff.id)}
                    className={`px-8 py-4 rounded-2xl border-2 transition-all ${difficulty === diff.id ? 'bg-sacred text-white border-sacred shadow-xl' : 'bg-white dark:bg-stone-800 border-stone-100 text-stone-400'}`}
                  >
                    <p className="font-serif font-bold text-lg">{diff.name}</p>
                    <p className="text-[8px] font-black uppercase opacity-50">{diff.desc}</p>
                  </button>
                ))}
             </div>
          </div>

          <button 
            onClick={startQuiz}
            className="w-full py-8 bg-gold text-stone-900 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-sm shadow-2xl hover:bg-stone-900 hover:text-gold transition-all active:scale-95"
          >
            Iniciar Certame
          </button>
        </div>
      )}

      {gameState === 'loading' && (
        <div className="py-40 text-center space-y-8 animate-pulse">
           <div className="w-24 h-24 border-8 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
           <p className="text-3xl font-serif italic text-stone-400">Consultando os Doutores da Igreja...</p>
        </div>
      )}

      {gameState === 'playing' && questions[currentIndex] && (
        <div className="space-y-10 animate-in slide-in-from-right-8">
           <div className="flex items-center justify-between px-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold">Questão {currentIndex + 1} de {questions.length}</span>
              <div className="h-2 w-48 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                 <div className="h-full bg-gold transition-all duration-1000" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
              </div>
           </div>

           <div className="bg-white dark:bg-stone-900 p-10 md:p-16 rounded-[4rem] shadow-3xl border border-stone-100 dark:border-stone-800 space-y-12">
              <h3 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
                {questions[currentIndex].question}
              </h3>

              <div className="grid gap-4">
                 {questions[currentIndex].options.map((opt, i) => {
                   let style = "bg-stone-50 dark:bg-stone-800 border-transparent text-stone-700 dark:text-stone-300";
                   if (selectedOption !== null) {
                      if (i === questions[currentIndex].correctAnswer) style = "bg-emerald-500 text-white border-emerald-500 shadow-xl";
                      else if (i === selectedOption) style = "bg-red-500 text-white border-red-500 shadow-xl";
                      else style = "opacity-30 grayscale";
                   }

                   return (
                     <button 
                      key={i}
                      onClick={() => handleOptionClick(i)}
                      disabled={selectedOption !== null}
                      className={`p-8 rounded-[2rem] border-2 text-left transition-all font-serif text-2xl flex items-center gap-6 ${style}`}
                     >
                        <span className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center font-black text-sm">{String.fromCharCode(65 + i)}</span>
                        {opt}
                     </button>
                   );
                 })}
              </div>

              {showExplanation && (
                <div className="p-8 bg-[#fcf8e8] dark:bg-stone-950 rounded-[3rem] border border-gold/20 space-y-4 animate-in slide-in-from-top-4">
                   <div className="flex items-center gap-4 text-gold">
                      <Icons.Feather className="w-6 h-6" />
                      <h4 className="font-serif font-bold text-xl">Luz da Tradição</h4>
                   </div>
                   <p className="text-xl font-serif italic text-stone-800 dark:text-stone-200 leading-relaxed">
                     {questions[currentIndex].explanation}
                   </p>
                   <button 
                    onClick={nextQuestion}
                    className="w-full mt-6 py-4 bg-stone-900 text-gold rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                   >
                     {currentIndex === questions.length - 1 ? "Ver Resultados" : "Próxima Questão"}
                   </button>
                </div>
              )}
           </div>
        </div>
      )}

      {gameState === 'results' && (
        <div className="bg-stone-900 p-12 md:p-24 rounded-[6rem] text-white shadow-3xl text-center space-y-12 animate-in zoom-in-95">
           <div className="relative inline-block">
              <div className="w-48 h-48 rounded-full border-8 border-gold/20 flex items-center justify-center">
                 <p className="text-7xl font-serif font-bold text-gold">{score}/{questions.length}</p>
              </div>
              <Icons.Cross className="absolute -top-4 -right-4 w-12 h-12 text-gold animate-bounce" />
           </div>
           
           <div className="space-y-4">
              <h3 className="text-5xl font-serif font-bold tracking-tight">Finis Certamen</h3>
              <p className="text-2xl font-serif italic text-white/60">
                 {score === questions.length ? "Incrível! Você demonstra um conhecimento digno de um Doutor da Igreja." : 
                  score >= questions.length / 2 ? "Muito bem, peregrino. Continue sua jornada de estudos para alcançar a perfeição." : 
                  "O caminho da sabedoria começa na humildade. Releia o Catecismo e tente novamente."}
              </p>
           </div>

           <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button 
                onClick={() => setGameState('lobby')}
                className="px-12 py-5 bg-gold text-stone-900 rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all"
              >
                Novo Certame
              </button>
              <button 
                onClick={() => window.location.href = AppRoute.STUDY_MODE}
                className="px-12 py-5 bg-white/5 border border-white/10 text-white rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
              >
                Aprofundar Estudos
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Certamen;
