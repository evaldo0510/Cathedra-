
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { CommunityQuestion, User } from '../types';

interface CommunityProps {
  user: User | null;
  onNavigateLogin: () => void;
}

const MOCK_QUESTIONS: CommunityQuestion[] = [
  {
    id: '1',
    userId: 'u1',
    userName: 'Peregrino João',
    title: 'Diferença entre Dogma e Doutrina?',
    content: 'Sempre tive dúvida se todo dogma é doutrina ou se existe alguma distinção prática no dia a dia do fiel.',
    createdAt: new Date().toISOString(),
    votes: 12,
    category: 'Dogmática',
    replies: [
      { id: 'r1', userId: 'ai', userName: 'Cathedra AI', content: 'Todo dogma é uma doutrina, mas nem toda doutrina é um dogma. Dogmas são verdades reveladas por Deus e proclamadas pelo Magistério como infalíveis.', createdAt: new Date().toISOString(), isAI: true }
    ]
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'Estudiosa Maria',
    title: 'Como iniciar na Lectio Divina?',
    content: 'Quero começar a ler a Bíblia de forma orante mas me sinto perdida por onde começar.',
    createdAt: new Date().toISOString(),
    votes: 8,
    category: 'Espiritualidade',
    replies: []
  }
];

const Community: React.FC<CommunityProps> = ({ user, onNavigateLogin }) => {
  const [questions, setQuestions] = useState<CommunityQuestion[]>(MOCK_QUESTIONS);
  const [isAsking, setIsAsking] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleAsk = () => {
    if (!user) {
      onNavigateLogin();
      return;
    }
    setIsAsking(true);
  };

  const submitQuestion = () => {
    if (!newTitle || !newContent) return;
    const q: CommunityQuestion = {
      id: Date.now().toString(),
      userId: user!.id,
      userName: user!.name,
      title: newTitle,
      content: newContent,
      createdAt: new Date().toISOString(),
      votes: 0,
      category: 'Geral',
      replies: []
    };
    setQuestions([q, ...questions]);
    setIsAsking(false);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
      <header className="text-center space-y-8">
        <div className="flex justify-center">
          <div className="p-8 bg-[#fcf8e8] rounded-full border border-[#d4af37]/30 shadow-sacred">
            <Icons.Users className="w-16 h-16 text-[#8b0000]" />
          </div>
        </div>
        <h2 className="text-7xl font-serif font-bold text-stone-900 tracking-tight">Aula Magna</h2>
        <p className="text-stone-400 italic font-serif text-2xl">A busca da verdade em comunhão.</p>
        
        <button 
          onClick={handleAsk}
          className="mt-8 px-12 py-5 bg-[#1a1a1a] text-[#d4af37] rounded-full font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-[#8b0000] hover:text-white transition-all active:scale-95"
        >
          Propor Questão à Comunidade
        </button>
      </header>

      {isAsking && (
        <section className="bg-white p-12 rounded-[4rem] border border-[#d4af37]/30 shadow-3xl space-y-8 animate-in zoom-in-95 duration-500">
           <h3 className="text-3xl font-serif font-bold text-stone-900">Nova Disputatio</h3>
           <div className="space-y-6">
              <input 
                type="text" 
                placeholder="Título da sua dúvida..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-10 py-6 bg-stone-50 border border-stone-100 rounded-[2rem] outline-none font-serif italic text-2xl"
              />
              <textarea 
                placeholder="Explique sua dúvida em detalhes..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                className="w-full h-48 px-10 py-6 bg-stone-50 border border-stone-100 rounded-[2rem] outline-none font-serif italic text-2xl resize-none"
              />
              <div className="flex gap-4">
                 <button onClick={submitQuestion} className="flex-1 py-6 bg-[#d4af37] text-stone-900 rounded-[2rem] font-black uppercase tracking-widest">Publicar Questão</button>
                 <button onClick={() => setIsAsking(false)} className="px-10 py-6 bg-stone-50 text-stone-400 rounded-[2rem] font-black uppercase tracking-widest">Cancelar</button>
              </div>
           </div>
        </section>
      )}

      <div className="space-y-10">
        <div className="flex items-center justify-between border-b border-stone-100 pb-8">
           <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-300">Questiones Recentes</h3>
           <div className="flex gap-4">
              <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest">Feed Vivo</span>
           </div>
        </div>

        <div className="grid gap-10">
          {questions.map(q => (
            <article key={q.id} className="bg-white p-12 rounded-[4rem] border border-stone-100 shadow-xl group hover:border-[#d4af37]/40 transition-all">
               <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-stone-900 text-[#d4af37] rounded-full flex items-center justify-center font-bold text-xs">
                        {q.userName.charAt(0)}
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8b0000]">{q.userName}</p>
                        <p className="text-[9px] text-stone-300">{new Date(q.createdAt).toLocaleDateString()}</p>
                     </div>
                  </div>
                  <div className="px-4 py-1.5 bg-stone-50 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-400">
                     {q.category}
                  </div>
               </div>

               <h4 className="text-3xl font-serif font-bold text-stone-900 mb-4 group-hover:text-[#8b0000] transition-colors">{q.title}</h4>
               <p className="text-stone-500 font-serif italic text-xl leading-relaxed mb-10">"{q.content}"</p>

               <div className="space-y-6">
                  {q.replies.map(r => (
                    <div key={r.id} className={`p-8 rounded-[3rem] border-l-8 ${r.isAI ? 'bg-[#fcf8e8] border-[#d4af37]' : 'bg-stone-50 border-stone-200'}`}>
                       <div className="flex items-center gap-3 mb-4">
                          {r.isAI && <Icons.Feather className="w-4 h-4 text-[#d4af37]" />}
                          <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{r.userName}</span>
                       </div>
                       <p className="text-stone-800 font-serif italic text-lg">{r.content}</p>
                    </div>
                  ))}
               </div>

               <div className="mt-10 pt-8 border-t border-stone-50 flex items-center justify-between">
                  <button className="flex items-center gap-3 text-stone-300 hover:text-[#d4af37] transition-colors">
                     <Icons.History className="w-5 h-5" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Sicut ({q.votes})</span>
                  </button>
                  <button 
                    onClick={() => { if(!user) onNavigateLogin(); }}
                    className="text-[10px] font-black uppercase tracking-widest text-[#8b0000] hover:scale-105 transition-all"
                  >
                    Responder Questão →
                  </button>
               </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Community;
