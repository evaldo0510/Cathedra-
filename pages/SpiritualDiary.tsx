
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { DiaryEntry } from '../types';
import { LangContext } from '../App';
import { GoogleGenAI } from "@google/genai";

const CATEGORIES = [
  { id: 'lectio', label: 'Lectio Divina', icon: Icons.Book, color: 'text-emerald-600' },
  { id: 'prayer', label: 'Oração/Colóquio', icon: Icons.Heart, color: 'text-sacred' },
  { id: 'grace', label: 'Graça Alcançada', icon: Icons.Star, color: 'text-gold' },
  { id: 'resolution', label: 'Resolução', icon: Icons.Feather, color: 'text-stone-700' }
];

const SpiritualDiary: React.FC = () => {
  const { lang } = useContext(LangContext);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<DiaryEntry['category']>('lectio');

  useEffect(() => {
    const saved = localStorage.getItem('cathedra_diary');
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  const saveEntry = () => {
    if (!content.trim()) return;

    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      title: title || 'Reflexão de hoje',
      content,
      category,
      tags: []
    };

    const next = [newEntry, ...entries];
    setEntries(next);
    localStorage.setItem('cathedra_diary', JSON.stringify(next));
    
    // Reset
    setTitle('');
    setContent('');
    setIsAdding(false);
  };

  const deleteEntry = (id: string) => {
    if (!window.confirm('Deseja apagar este registro memorial?')) return;
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    localStorage.setItem('cathedra_diary', JSON.stringify(next));
  };

  const getAiInsight = async () => {
    if (entries.length === 0) return;
    setIsAnalyzing(true);
    setAiInsight(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const recentNotes = entries.slice(0, 3).map(e => `${e.category}: ${e.content}`).join('\n');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Como um diretor espiritual sábio e fiel ao Magistério Católico, analise estas reflexões recentes de um fiel e ofereça uma palavra de encorajamento ou uma virtude para focar. Seja breve, poético e profundo. Idioma: ${lang}.\nReflexões:\n${recentNotes}`,
      });

      setAiInsight(response.text);
    } catch (e) {
      console.error(e);
      setAiInsight("Que a paz de Cristo ilumine seu caminho. Continue sua jornada de oração.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-48 animate-in fade-in duration-1000 px-2 md:px-0">
      <header className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-6 bg-white dark:bg-stone-900 rounded-full border-2 border-gold/30 shadow-sacred relative group">
             <Icons.Feather className="w-16 h-16 text-sacred dark:text-gold group-hover:rotate-12 transition-transform duration-700" />
          </div>
        </div>
        <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Diarium</h2>
        <p className="text-stone-400 italic text-xl md:text-2xl font-serif">"O que é escrito no coração, permanece para a eternidade."</p>
      </header>

      {/* AÇÕES PRINCIPAIS */}
      <div className="flex flex-col md:flex-row justify-center gap-4">
        <button 
          onClick={() => setIsAdding(true)}
          className="px-10 py-5 bg-stone-900 text-gold rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Icons.Feather className="w-5 h-5" />
          Novo Registro Memorial
        </button>
        <button 
          onClick={getAiInsight}
          disabled={isAnalyzing || entries.length === 0}
          className="px-10 py-5 bg-sacred text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
        >
          {isAnalyzing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icons.Star className="w-5 h-5 text-gold" />}
          Luz da Alma (IA)
        </button>
      </div>

      {/* AI INSIGHT BOX */}
      {aiInsight && (
        <div className="bg-[#fcf8e8] dark:bg-stone-900 p-10 rounded-[3rem] border border-gold/30 shadow-inner animate-in slide-in-from-top-4 duration-700 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><Icons.Cross className="w-32 h-32" /></div>
           <header className="flex items-center gap-4 mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold">Conselho do Diretor Espiritual</span>
              <div className="h-px flex-1 bg-gold/20" />
           </header>
           <p className="text-2xl font-serif italic text-stone-700 dark:text-stone-200 leading-relaxed">
             "{aiInsight}"
           </p>
           <button onClick={() => setAiInsight(null)} className="mt-8 text-[9px] font-black uppercase text-stone-400 hover:text-sacred transition-colors">Fechar Conselho</button>
        </div>
      )}

      {/* LISTA DE ENTRADAS */}
      <div className="grid gap-6">
        {entries.length > 0 ? (
          entries.map(entry => {
            const cat = CATEGORIES.find(c => c.id === entry.category);
            return (
              <article key={entry.id} className="bg-white dark:bg-stone-900 p-8 md:p-10 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-lg group relative overflow-hidden hover:border-gold/40 transition-all">
                 <div className="absolute top-6 right-6 flex gap-2">
                    <button onClick={() => deleteEntry(entry.id)} className="p-3 text-stone-200 hover:text-sacred transition-all"><Icons.Cross className="w-4 h-4 rotate-45" /></button>
                 </div>

                 <div className="space-y-6">
                    <header className="flex items-center gap-4">
                       <div className={`p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 ${cat?.color}`}>
                          {cat && <cat.icon className="w-5 h-5" />}
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">{new Date(entry.date).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          <h3 className="text-xl md:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">{entry.title}</h3>
                       </div>
                    </header>
                    <p className="text-lg md:text-xl font-serif italic text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                       "{entry.content}"
                    </p>
                 </div>
              </article>
            );
          })
        ) : (
          <div className="py-32 text-center space-y-6 bg-stone-50 dark:bg-stone-900/40 rounded-[4rem] border-2 border-dashed border-stone-200 dark:border-stone-800">
             <Icons.Feather className="w-20 h-20 mx-auto text-stone-200 dark:text-stone-800 opacity-50" />
             <p className="text-2xl font-serif italic text-stone-400">Seu diário ainda não possui registros. Comece hoje sua jornada memorial.</p>
          </div>
        )}
      </div>

      {/* MODAL DE ADIÇÃO (PARCHMENT STYLE) */}
      {isAdding && (
        <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md" onClick={() => setIsAdding(false)} />
           
           <div className="relative w-full max-w-4xl h-[90dvh] md:h-[80vh] bg-[#fdfcf8] dark:bg-[#0c0a09] md:rounded-[4rem] shadow-4xl border-t border-white/10 overflow-hidden flex flex-col animate-modal-zoom">
              <header className="p-8 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-stone-900 rounded-2xl shadow-xl"><Icons.Feather className="w-6 h-6 text-gold" /></div>
                    <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-gold">Scribe Memoriam</h3>
                 </div>
                 <button onClick={() => setIsAdding(false)} className="p-4 bg-stone-100 dark:bg-stone-800 hover:bg-sacred hover:text-white rounded-full transition-all"><Icons.Cross className="w-6 h-6 rotate-45" /></button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 custom-scrollbar">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Qual o foco desta reflexão?</p>
                    <div className="flex flex-wrap gap-2">
                       {CATEGORIES.map(cat => (
                         <button 
                           key={cat.id}
                           onClick={() => setCategory(cat.id as any)}
                           className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border-2 flex items-center gap-3 ${category === cat.id ? 'bg-stone-900 text-gold border-stone-900' : 'bg-white dark:bg-stone-800 text-stone-400 border-transparent hover:border-gold/20'}`}
                         >
                           <cat.icon className="w-4 h-4" />
                           {cat.label}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-6">
                    <input 
                      type="text" 
                      placeholder="Título ou Referência (Ex: João 3, 16)"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full bg-transparent border-none outline-none font-serif font-bold text-3xl md:text-5xl text-stone-900 dark:text-white placeholder-stone-200"
                    />
                    <div className="h-px w-full bg-stone-100 dark:bg-stone-800" />
                    <textarea 
                      placeholder="Escreva aqui o que Deus sussurrou ao seu coração..."
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      className="w-full h-64 bg-transparent border-none outline-none font-serif italic text-2xl md:text-3xl text-stone-700 dark:text-stone-300 placeholder-stone-200 resize-none"
                    />
                 </div>
              </div>

              <footer className="p-8 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                 <button 
                  onClick={saveEntry}
                  disabled={!content.trim()}
                  className="px-12 py-5 bg-gold text-stone-900 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                 >
                   Selar Registro (Guardar)
                 </button>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
};

export default SpiritualDiary;
