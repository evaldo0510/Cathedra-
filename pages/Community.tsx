
import React, { useState } from 'react';
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
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32 px-4 md:px-0">
      {/* AULA MAGNA - FEATURED CONTENT COM ÍCONE DE ÁUDIO/LIVE */}
      <section className="relative overflow-hidden rounded-[4rem] bg-[#1a1a1a] p-10 md:p-20 shadow-3xl border border-gold/30 group">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-80" />
          <img 
            src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=80&w=1600" 
            alt="Sanctuary" 
            className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-[10s]"
          />
        </div>

        <div className="relative z-10 max-w-4xl space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/30 relative">
              <Icons.Audio className="w-7 h-7 text-gold animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-sacred rounded-full border-2 border-[#1a1a1a]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">Aula Magna • Ao Vivo</span>
              <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Sessão Multimídia Ativa</span>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-5xl md:text-8xl font-serif font-bold text-white tracking-tight leading-none">
              O Eterno Agora: <br/> <span className="text-gold">A Teologia da Missa</span>
            </h2>
            
            <div className="space-y-8 border-l-4 border-gold/40 pl-8 md:pl-12">
              <div className="space-y-4">
                <p className="text-2xl md:text-4xl font-serif italic text-white/90 leading-tight">
                  "Você vê um altar, um padre e um rito. Mas o que seus olhos não alcançam é que, naquele instante, o tempo se rompe."
                </p>
                <p className="text-lg md:text-2xl font-serif text-white/50 italic">
                  O mundo diz que a Missa é uma lembrança. A Igreja diz que é Presença.
                </p>
              </div>
              
              <p className="text-lg md:text-2xl font-serif text-white/70 leading-relaxed max-w-3xl">
                Nesta aula, afastamos o véu do hábito para revelar o sacrifício que sustenta o universo. Entenda não apenas os gestos, mas o Mistério que eles escondem.
              </p>
            </div>
          </div>

          <button className="px-12 py-6 bg-gold hover:bg-yellow-400 text-stone-900 rounded-full font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 transition-all active:scale-95 flex items-center gap-4">
            <Icons.Audio className="w-5 h-5" /> Adentrar o Mistério
          </button>
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* DISPUTATIONES - COMMUNITY QUESTIONS COM ÍCONES DE AÇÃO */}
        <main className="lg:col-span-8 space-y-10">
          <div className="flex items-center justify-between border-b dark:border-stone-800 pb-8">
            <div className="space-y-1">
              <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">Disputationes</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Diálogos entre a Razão e a Fé</p>
            </div>
            <button 
              onClick={handleAsk}
              className="px-8 py-4 bg-stone-900 dark:bg-stone-100 text-gold dark:text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-xl hover:scale-105 transition-all"
            >
              Propor Questão
            </button>
          </div>

          <div className="space-y-8">
            {isAsking && (
              <section className="bg-white dark:bg-stone-900 p-10 rounded-[3rem] border-2 border-gold/30 shadow-3xl space-y-8 animate-in zoom-in-95 duration-500">
                <h3 className="text-2xl font-serif font-bold">Nova Investigação</h3>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Sua pergunta (Ex: A natureza da Graça...)"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full px-8 py-5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl outline-none font-serif italic text-xl"
                  />
                  <textarea 
                    placeholder="Aprofunde seu questionamento..."
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    className="w-full h-40 px-8 py-5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl outline-none font-serif italic text-xl resize-none"
                  />
                  <div className="flex gap-4">
                    <button onClick={submitQuestion} className="flex-1 py-5 bg-gold text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px]">Publicar</button>
                    <button onClick={() => setIsAsking(false)} className="px-8 py-5 bg-stone-100 dark:bg-stone-800 text-stone-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancelar</button>
                  </div>
                </div>
              </section>
            )}

            {questions.map(q => (
              <article key={q.id} className="bg-white dark:bg-stone-900 p-10 rounded-[3.5rem] border border-stone-100 dark:border-stone-800 shadow-xl group hover:border-gold/40 transition-all">
                <header className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center font-bold text-stone-400">
                      {q.userName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gold">{q.userName}</p>
                      <p className="text-[8px] text-stone-300">{new Date(q.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-stone-300 hover:text-gold transition-colors"><Icons.Share className="w-4 h-4" /></button>
                    <button className="p-2 text-stone-300 hover:text-sacred transition-colors"><Icons.Pin className="w-4 h-4" /></button>
                  </div>
                </header>

                <h4 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-3 group-hover:text-gold transition-colors">{q.title}</h4>
                <p className="text-stone-500 dark:text-stone-400 font-serif italic text-lg leading-relaxed mb-8">"{q.content}"</p>

                <div className="space-y-4">
                  {q.replies.map(r => (
                    <div key={r.id} className={`p-6 rounded-[2rem] border-l-4 relative overflow-hidden ${r.isAI ? 'bg-[#fcf8e8] dark:bg-stone-800/40 border-gold' : 'bg-stone-50 dark:bg-stone-800 border-stone-200'}`}>
                      {r.isAI && <div className="absolute top-0 right-0 p-4 opacity-[0.05]"><Icons.Feather className="w-20 h-20 text-gold" /></div>}
                      <div className="flex items-center gap-2 mb-2">
                        {r.isAI && <Icons.Feather className="w-3 h-3 text-gold" />}
                        <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{r.userName}</span>
                      </div>
                      <p className="text-stone-800 dark:text-stone-200 font-serif italic text-base leading-relaxed relative z-10">{r.content}</p>
                      <div className="mt-4 flex items-center gap-4 text-[8px] font-black uppercase text-stone-300">
                         <button className="flex items-center gap-1 hover:text-gold transition-colors"><Icons.Star className="w-3 h-3" /> Útil</button>
                         <button className="flex items-center gap-1 hover:text-gold transition-colors"><Icons.Message className="w-3 h-3" /> Responder</button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </main>

        {/* SIDEBAR - TOP SCHOLARS COM ÍCONES DE PRESTÍGIO */}
        <aside className="lg:col-span-4 space-y-10">
          <section className="bg-white dark:bg-stone-900 p-10 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl">
            <h3 className="text-xl font-serif font-bold mb-8 flex items-center gap-3">
              <Icons.Star className="w-5 h-5 text-gold" />
              Estudiosos da Cátedra
            </h3>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-default group">
                  <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-gold font-bold relative">
                    {i}
                    {i === 1 && <Icons.Star className="absolute -top-1 -right-1 w-4 h-4 text-gold fill-current" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold group-hover:text-gold transition-colors">Scholar #{i}</p>
                    <p className="text-[9px] text-stone-400 font-black uppercase tracking-widest">{100 * (4-i)} Disputationes</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-sacred p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <Icons.Cross className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10 group-hover:rotate-12 transition-transform duration-[2s]" />
            <div className="relative z-10">
               <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gold mb-4">Sursum Corda</h4>
               <p className="text-2xl font-serif font-bold mb-6">"Onde houver caridade e amor, Deus aí está."</p>
               <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <Icons.Audio className="w-5 h-5 text-gold/60" />
                  <p className="text-xs font-serif italic text-white/60">Contorne o barulho do mundo. Mergulhe no silêncio.</p>
               </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Community;
