
import React, { useState } from 'react';
import { Icons } from '../constants';
import VoicePlayer from '../components/VoicePlayer';

interface MassSection {
  title: string;
  subtitle: string;
  parts: {
    name: string;
    rubric?: string;
    latin: string;
    vernacular: string;
  }[];
}

const MASS_DATA: MassSection[] = [
  {
    title: 'Ritus Initiales',
    subtitle: 'Ritos Iniciais',
    parts: [
      {
        name: 'Incipit / Saudação (3ª Edição Típica)',
        rubric: 'O sacerdote diz:',
        latin: 'S: In nómine Patris, et Fílii, et Spíritus Sancti.\nP: Amen.\nS: Dóminus vobíscum.',
        vernacular: 'S: Em nome do Pai, e do Filho, e do Espírito Santo.\nP: Amém.\nS: O Senhor esteja convosco.\nP: Ele está no meio de nós.'
      },
      {
        name: 'Actus Pænitentiális / Ato Penitencial',
        rubric: 'O sacerdote convida os fiéis:',
        latin: 'Confíteor Deo omnipoténti et vobis, fratres...',
        vernacular: 'Confesso a Deus todo-poderoso e a vós, irmãos e irmãs, que pequei muitas vezes por pensamentos e palavras, atos e omissões, por minha culpa, minha tão grande culpa...'
      }
    ]
  },
  {
    title: 'Liturgia Eucharistica',
    subtitle: 'Liturgia Eucarística',
    parts: [
      {
        name: 'Præfatio / Prefácio (Nova Tradução)',
        rubric: 'O diálogo inicial:',
        latin: 'S: Sursum corda.\nP: Habémus ad Dóminum.',
        vernacular: 'S: Corações ao alto.\nP: O nosso coração está em Deus.'
      }
    ]
  }
];

const OrdoMissae: React.FC = () => {
  const [view, setView] = useState<'bilingual' | 'vernacular'>('bilingual');
  const [fontSize, setFontSize] = useState(1.15);

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      <header className="text-center space-y-4">
        <div className="inline-block px-4 py-1 bg-sacred/10 text-sacred rounded-full text-[8px] font-black uppercase tracking-widest border border-sacred/20 mb-4">
          Lex Orandi: 3ª Edição Típica (Oficial)
        </div>
        <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Missale Romanum</h2>
        <div className="flex justify-center gap-4 pt-6">
           <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-xl flex shadow-inner">
              <button onClick={() => setView('bilingual')} className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${view === 'bilingual' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-gold shadow-sm' : 'text-stone-400'}`}>Bilíngue</button>
              <button onClick={() => setView('vernacular')} className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${view === 'vernacular' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-gold shadow-sm' : 'text-stone-400'}`}>Português</button>
           </div>
        </div>
      </header>

      <div className="space-y-16" style={{ fontSize: `${fontSize}rem` }}>
        {MASS_DATA.map((section, sIdx) => (
          <div key={sIdx} className="space-y-10">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-serif font-bold text-sacred whitespace-nowrap">{section.title}</h3>
              <div className="h-px w-full bg-sacred/10" />
            </div>
            
            {section.parts.map((part, pIdx) => (
              <div key={pIdx} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-200">{part.name}</h4>
                  <VoicePlayer text={part.vernacular} />
                </div>
                {part.rubric && <p className="text-xs text-sacred italic border-l-2 border-sacred/20 pl-4 py-1">{part.rubric}</p>}
                
                <div className={`grid gap-6 ${view === 'bilingual' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                  {view === 'bilingual' && (
                    <div className="p-8 bg-[#fcf8e8] dark:bg-stone-900/50 rounded-2xl border border-gold/10 italic font-serif text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                      {part.latin}
                    </div>
                  )}
                  <div className="p-8 bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm font-serif text-stone-900 dark:text-stone-100 whitespace-pre-wrap">
                    {part.vernacular}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdoMissae;
