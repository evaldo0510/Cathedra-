
import React, { useState } from 'react';
import { Icons } from '../constants';

const MISSAL_PARTS = [
  {
    title: 'Ritus Initiales',
    subtitle: 'Ritos Iniciais',
    parts: [
      {
        name: 'Salutatio / Saudação',
        rubric: 'O sacerdote, voltado para o povo, estendendo as mãos, diz:',
        latin: 'S: In nómine Patris, et Fílii, et Spíritus Sancti.\nP: Amen.\nS: Grátia Dómini nostri Iesu Christi, et cáritas Dei, et communicátio Sancti Spíritus sit cum ómnibus vobis.\nP: Et cum spíritu tuo.',
        vernacular: 'S: Em nome do Pai, e do Filho, e do Espírito Santo.\nP: Amém.\nS: A graça de nosso Senhor Jesus Cristo, o amor do Pai e a comunhão do Espírito Santo estejam convosco.\nP: Bendito seja Deus que nos reuniu no amor de Cristo.'
      },
      {
        name: 'Actus Pænitentiális / Ato Penitencial',
        rubric: 'Seguindo-se o ato penitencial, o sacerdote convida os fiéis ao arrependimento:',
        latin: 'Confíteor Deo omnipoténti et vobis, fratres, quia peccávi nimis cogitatióne, verbo, ópere et omissióne: mea culpa, mea culpa, mea máxima culpa. Ídeo precor beátam Maríam semper Vírginem, omnes Angelos et Sanctos, et vos, fratres, oráre pro me ad Dóminum Deum nostrum.',
        vernacular: 'Confesso a Deus todo-poderoso e a vós, irmãos e irmãs, que pequei muitas vezes por pensamentos e palavras, atos e omissões, por minha culpa, minha tão grande culpa. E peço à Virgem Maria, aos Anjos e Santos e a vós, irmãos e irmãs, que rogueis por mim a Deus, nosso Senhor.'
      }
    ]
  },
  {
    title: 'Liturgia Eucharistica',
    subtitle: 'Liturgia Eucarística',
    parts: [
      {
        name: 'Præfatio / Prefácio',
        rubric: 'O sacerdote inicia a Oração Eucarística, elevando as mãos:',
        latin: 'S: Sursum corda.\nP: Habémus ad Dóminum.\nS: Grátias agámus Dómino Deo nostro.\nP: Dignum et iustum est.',
        vernacular: 'S: Corações ao alto.\nP: O nosso coração está em Deus.\nS: Demos graças ao Senhor nosso Deus.\nP: É nosso dever e nossa salvação.'
      },
      {
        name: 'Sanctus',
        rubric: 'Ao fim do prefácio, todos aclamam:',
        latin: 'Sanctus, Sanctus, Sanctus Dóminus Deus Sábaoth. Pleni sunt cæli et terra glória tua. Hosánna in excélsis. Benedíctus qui venit in nómine Dómini. Hosánna in excélsis.',
        vernacular: 'Santo, Santo, Santo, Senhor Deus do universo. O céu e a terra proclamam a vossa glória. Hosana nas alturas. Bendito o que vem em nome do Senhor. Hosana nas alturas.'
      }
    ]
  },
  {
    title: 'Ritus Conclusionis',
    subtitle: 'Ritos Finais',
    parts: [
      {
        name: 'Benedictio / Bênção',
        rubric: 'O sacerdote abençoa o povo:',
        latin: 'S: Benedícat vos omnípotens Deus, Pater, et Fílius, et Spíritus Sancti.\nP: Amen.\nS: Ite, missa est.\nP: Deo grátias.',
        vernacular: 'S: Abençoe-vos Deus Todo-Poderoso, Pai e Filho e Espírito Santo.\nP: Amém.\nS: Ide em paz e o Senhor vos acompanhe.\nP: Graças a Deus.'
      }
    ]
  }
];

const Missal: React.FC = () => {
  const [view, setView] = useState<'bilingual' | 'latin' | 'vernacular'>('bilingual');
  const [fontSize, setFontSize] = useState(1.2);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-40 animate-in fade-in duration-700 px-4">
      {/* HEADER DE ALTAR */}
      <header className="text-center space-y-6 pt-10">
        <div className="flex justify-center">
           <div className="p-8 bg-sacred rounded-[2.5rem] shadow-sacred border-4 border-gold/40 rotate-3 group-hover:rotate-0 transition-transform">
              <Icons.Cross className="w-12 h-12 text-white" />
           </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Missale Romanum</h2>
          <p className="text-stone-400 italic text-2xl">Ordo Missæ • Ordinário da Missa</p>
        </div>

        {/* Controles de Visualização */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-10">
           <div className="flex bg-white dark:bg-stone-900 p-1.5 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-800">
              <button onClick={() => setView('bilingual')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'bilingual' ? 'bg-gold text-stone-900 shadow-md' : 'text-stone-400'}`}>Bilingue</button>
              <button onClick={() => setView('latin')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'latin' ? 'bg-gold text-stone-900 shadow-md' : 'text-stone-400'}`}>Latine</button>
              <button onClick={() => setView('vernacular')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'vernacular' ? 'bg-gold text-stone-900 shadow-md' : 'text-stone-400'}`}>Português</button>
           </div>
           
           <div className="flex items-center gap-4 px-6 py-2 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
              <span className="text-[8px] font-black uppercase text-stone-400">Tamanho</span>
              <input type="range" min="0.8" max="2.5" step="0.1" value={fontSize} onChange={e => setFontSize(parseFloat(e.target.value))} className="w-24 h-1 accent-sacred" />
           </div>
        </div>
      </header>

      {/* CORPO DO MISSAL */}
      <div className="space-y-20 max-w-5xl mx-auto" style={{ fontSize: `${fontSize}rem` }}>
        {MISSAL_PARTS.map((section, idx) => (
          <section key={idx} className="space-y-12 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 150}ms` }}>
            <div className="flex items-center gap-6">
               <div className="text-left">
                  <h3 className="text-[0.6em] font-black uppercase tracking-[0.6em] text-sacred leading-none">{section.title}</h3>
                  <span className="text-[0.5em] font-serif italic text-stone-400">{section.subtitle}</span>
               </div>
               <div className="h-px flex-1 bg-gradient-to-r from-sacred/20 to-transparent" />
            </div>
            
            <div className="space-y-16">
               {section.parts.map((part, pIdx) => (
                 <div key={pIdx} className="space-y-8">
                    <header className="space-y-3">
                       <h4 className="text-[0.6em] font-serif font-bold text-stone-900 dark:text-stone-100">{part.name}</h4>
                       <p className="text-[0.5em] text-sacred italic leading-snug border-l-4 border-sacred/10 pl-6 py-1">{part.rubric}</p>
                    </header>

                    <div className={`grid gap-8 md:gap-12 ${view === 'bilingual' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                       {(view === 'bilingual' || view === 'latin') && (
                         <div className="p-10 md:p-14 bg-[#fcf8e8] dark:bg-stone-900/50 rounded-[3rem] border border-gold/20 shadow-inner group hover:border-gold transition-colors">
                            <span className="text-[0.4em] font-black uppercase tracking-[0.5em] text-gold mb-4 block">Latine</span>
                            <p className="font-serif italic text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap first-letter:text-6xl first-letter:text-gold first-letter:float-left first-letter:mr-2">
                              {part.latin}
                            </p>
                         </div>
                       )}
                       {(view === 'bilingual' || view === 'vernacular') && (
                         <div className="p-10 md:p-14 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl group hover:border-sacred transition-colors">
                            <span className="text-[0.4em] font-black uppercase tracking-[0.5em] text-sacred mb-4 block">Português</span>
                            <p className="font-serif text-stone-900 dark:text-stone-100 leading-relaxed whitespace-pre-wrap first-letter:text-6xl first-letter:text-sacred first-letter:float-left first-letter:mr-2">
                              {part.vernacular}
                            </p>
                         </div>
                       )}
                    </div>
                 </div>
               ))}
            </div>
          </section>
        ))}
      </div>

      {/* BOTÕES FLUTUANTES DE CONFIGURAÇÃO (ESTILO BÍBLIA) */}
      <div className="fixed bottom-32 right-8 z-[300] flex flex-col gap-4">
         <button 
            onClick={() => setFontSize(f => Math.min(f + 0.1, 2.5))}
            className="p-4 bg-white dark:bg-stone-800 rounded-full shadow-2xl border border-stone-100 dark:border-stone-700 text-stone-500 hover:text-gold transition-all"
         >
            <span className="text-xl font-bold">A+</span>
         </button>
         <button 
            onClick={() => setFontSize(f => Math.max(f - 0.1, 0.8))}
            className="p-4 bg-white dark:bg-stone-800 rounded-full shadow-2xl border border-stone-100 dark:border-stone-700 text-stone-500 hover:text-gold transition-all"
         >
            <span className="text-lg font-bold">A-</span>
         </button>
      </div>
      
      <footer className="text-center opacity-30 pt-32 pb-20">
         <div className="flex flex-col items-center gap-4">
            <Icons.Cross className="w-12 h-12" />
            <p className="text-[10px] font-black uppercase tracking-[1em]">Ite, Missa Est</p>
            <p className="text-[8px] font-serif italic max-w-xs mt-4">"Que a comunhão deste sacrifício nos purifique e nos una para sempre."</p>
         </div>
      </footer>
    </div>
  );
};

export default Missal;
