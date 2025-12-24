
import React, { useState } from 'react';
import { Icons } from '../constants';

const SOCIAL_THEMES = [
  {
    id: 'dignity',
    title: 'Dignidade Humana',
    icon: Icons.Users,
    description: 'A pessoa humana é o fundamento de toda a ordem social.',
    questions: [
      { q: "Por que o ser humano tem uma dignidade infinita?", a: "Porque foi criado à imagem de Deus e redimido por Cristo.", ref: "DOCAT 47" },
      { q: "Os direitos humanos são negociáveis?", a: "Não, são inerentes à natureza humana e universais.", ref: "DOCAT 51" }
    ]
  },
  {
    id: 'work',
    title: 'Trabalho e Economia',
    icon: Icons.Feather,
    description: 'O trabalho é para o homem, não o homem para o trabalho.',
    questions: [
      { q: "Qual o objetivo da economia?", a: "O serviço à pessoa humana e ao bem comum.", ref: "Compêndio 326" },
      { q: "O que é um salário justo?", a: "Aquele que permite ao trabalhador e sua família viverem dignamente.", ref: "Rerum Novarum" }
    ]
  },
  {
    id: 'common_good',
    title: 'Bem Comum e Solidariedade',
    icon: Icons.Globe,
    description: 'Todos somos responsáveis por todos.',
    questions: [
      { q: "O que define o Bem Comum?", a: "O conjunto de condições sociais que permitem aos grupos e aos indivíduos a sua perfeição.", ref: "Gaudium et Spes 26" }
    ]
  }
];

const SocialDoctrine: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState(SOCIAL_THEMES[0]);
  const [activeQuestion, setActiveQuestion] = useState<number | null>(0);

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700 pb-32">
      <header className="text-center space-y-6">
        <div className="flex justify-center">
           <div className="p-6 bg-[#fcf8e8] rounded-full border border-[#d4af37]/30 shadow-sacred">
              <Icons.Globe className="w-16 h-16 text-[#8b0000]" />
           </div>
        </div>
        <h2 className="text-7xl font-serif font-bold text-stone-900 tracking-tight">Compêndio Social</h2>
        <p className="text-stone-400 italic text-2xl">"Para que a justiça corra como água." — Amós 5, 24</p>
      </header>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Categorias Estilo DOCAT */}
        <nav className="lg:col-span-4 space-y-6">
           {SOCIAL_THEMES.map(theme => (
             <button 
               key={theme.id}
               onClick={() => { setSelectedTheme(theme); setActiveQuestion(0); }}
               className={`w-full p-10 rounded-[3.5rem] text-left transition-all duration-500 border relative overflow-hidden group ${selectedTheme.id === theme.id ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-2xl scale-[1.05]' : 'bg-white text-stone-600 border-stone-100 hover:border-[#d4af37]'}`}
             >
                <div className={`p-4 rounded-2xl mb-6 inline-block ${selectedTheme.id === theme.id ? 'bg-[#d4af37]' : 'bg-stone-50'}`}>
                   <theme.icon className={`w-8 h-8 ${selectedTheme.id === theme.id ? 'text-stone-900' : 'text-[#d4af37]'}`} />
                </div>
                <h4 className="text-3xl font-serif font-bold mb-3">{theme.title}</h4>
                <p className={`text-sm italic font-serif ${selectedTheme.id === theme.id ? 'text-stone-400' : 'text-stone-400'}`}>{theme.description}</p>
             </button>
           ))}
        </nav>

        {/* Diálogo Interativo de QA */}
        <main className="lg:col-span-8 space-y-10">
           <div className="bg-white p-12 md:p-20 rounded-[4.5rem] shadow-2xl border border-stone-100 relative">
              <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none">
                 <selectedTheme.icon className="w-48 h-48" />
              </div>
              
              <div className="space-y-12">
                 {selectedTheme.questions.map((q, idx) => (
                   <div key={idx} className="space-y-6 animate-in slide-in-from-right duration-500" style={{ animationDelay: `${idx * 200}ms` }}>
                      <button 
                        onClick={() => setActiveQuestion(idx)}
                        className={`w-full text-left p-8 rounded-[2.5rem] flex items-start gap-6 transition-all border ${activeQuestion === idx ? 'bg-[#fcf8e8] border-[#d4af37] shadow-inner' : 'bg-stone-50 border-stone-100 hover:bg-stone-100'}`}
                      >
                         <span className="w-12 h-12 rounded-full bg-[#8b0000] text-white flex items-center justify-center font-black flex-shrink-0 text-xl shadow-lg">?</span>
                         <h5 className="text-3xl font-serif font-bold text-stone-900 mt-1 leading-tight">{q.q}</h5>
                      </button>

                      {activeQuestion === idx && (
                        <div className="pl-20 pr-10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                           <p className="text-3xl font-serif italic text-stone-700 leading-relaxed">
                             "{q.a}"
                           </p>
                           <div className="flex items-center gap-4">
                              <span className="px-4 py-1.5 bg-stone-100 text-stone-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-stone-200">{q.ref}</span>
                              <div className="h-px flex-1 bg-stone-50" />
                           </div>
                        </div>
                      )}
                   </div>
                 ))}
              </div>

              {/* Seção de Ação Prática (Inspirada no DOCAT) */}
              <div className="mt-20 p-12 bg-[#8b0000] text-white rounded-[3.5rem] shadow-3xl relative overflow-hidden group">
                 <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
                 <Icons.Feather className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10 group-hover:rotate-12 transition-transform duration-1000" />
                 <div className="relative z-10 space-y-6">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#d4af37]">Compromisso Católico</h4>
                    <h3 className="text-4xl font-serif font-bold">O que posso fazer hoje?</h3>
                    <p className="text-xl text-white/80 font-serif italic leading-relaxed">
                       "Não amemos apenas com palavras, mas com obras e em verdade." — 1 João 3, 18. Reflita sobre como você pode promover a dignidade de quem trabalha ao seu redor.
                    </p>
                    <button className="px-10 py-5 bg-[#d4af37] text-stone-900 rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl">
                       Registrar Ação Social
                    </button>
                 </div>
              </div>
           </div>
        </main>
      </div>
    </div>
  );
};

export default SocialDoctrine;
