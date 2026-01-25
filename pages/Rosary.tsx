
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import SacredImage from '../components/SacredImage';

const MYSTERIES = {
  joyful: {
    name: 'Gozosos',
    days: 'Segundas e Sábados',
    items: [
      { title: 'A Anunciação', med: 'O Anjo Gabriel traz a Maria a notícia mais esperada da história: Deus se fará homem no seu ventre.', img: 'https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800' },
      { title: 'A Visitação', med: 'Maria corre às montanhas para servir Isabel. Onde há Maria, há caridade.', img: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=800' },
      { title: 'O Nascimento', med: 'Na pobreza de Belém, nasce o Rei do Universo. O silêncio da noite é quebrado pelo choro de Deus.', img: 'https://images.unsplash.com/photo-1512403754473-27835f7b9984?q=80&w=800' },
      { title: 'A Apresentação', med: 'Jesus é levado ao Templo. Maria entrega o seu Filho ao Pai.', img: 'https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=800' },
      { title: 'Jesus entre os Doutores', med: 'O lamento de Maria ao perder Jesus, e a alegria de encontrá-lo cuidando das coisas do Pai.', img: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800' }
    ]
  },
  luminous: {
    name: 'Luminosos',
    days: 'Quintas-feiras',
    items: [
      { title: 'Batismo no Jordão', med: 'A voz do Pai proclama: "Este é meu Filho muito amado".', img: 'https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800' },
      { title: 'Bodas de Caná', med: 'O primeiro milagre de Jesus a pedido de Sua Mãe: "Fazei tudo o que Ele vos disser".', img: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=800' },
      { title: 'Anúncio do Reino', med: 'Jesus proclama a vinda do Reino e convida à conversão.', img: 'https://images.unsplash.com/photo-1512403754473-27835f7b9984?q=80&w=800' },
      { title: 'Transfiguração', med: 'No Tabor, Jesus revela Sua glória para fortalecer a fé dos apóstolos antes da Paixão.', img: 'https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=800' },
      { title: 'Instituição da Eucaristia', med: 'Jesus se dá como alimento sob as espécies do pão e do vinho.', img: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800' }
    ]
  },
  sorrowful: {
    name: 'Dolorosos',
    days: 'Terças e Sextas',
    items: [
      { title: 'Agonia no Horto', med: 'O suor de sangue de Jesus revela o peso dos nossos pecados sobre Ele.', img: 'https://images.unsplash.com/photo-1515606378517-3451a42adc42?q=80&w=800' },
      { title: 'Flagelação', med: 'O corpo do Inocente é rasgado por amor a nós. O preço da nossa liberdade.', img: 'https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800' },
      { title: 'Coroação de Espinhos', med: 'O Rei da Glória é humilhado com uma coroa de dor.', img: 'https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=800' },
      { title: 'Caminho do Calvário', med: 'Jesus carrega o lenho da Cruz. A cada passo, uma prova de amor.', img: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=800' },
      { title: 'Crucificação', med: 'Tudo está consumado. Do lado aberto de Cristo, nasce a salvação.', img: 'https://images.unsplash.com/photo-1512403754473-27835f7b9984?q=80&w=800' }
    ]
  },
  glorious: {
    name: 'Gloriosos',
    days: 'Quartas e Domingos',
    items: [
      { title: 'Ressurreição', med: 'A morte foi vencida. Jesus vive para sempre e nos abre as portas do céu.', img: 'https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800' },
      { title: 'Ascensão', med: 'Jesus sobe ao céu e se senta à direita do Pai, mas permanece conosco.', img: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=800' },
      { title: 'Pentecostes', med: 'O Espírito Santo desce sobre Maria e os apóstolos em línguas de fogo.', img: 'https://images.unsplash.com/photo-1512403754473-27835f7b9984?q=80&w=800' },
      { title: 'Assunção de Maria', med: 'A Virgem Imaculada é elevada em corpo e alma à glória celeste.', img: 'https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=800' },
      { title: 'Coroação de Maria', med: 'Maria é coroada Rainha do Céu e da Terra, nossa Mãe e Medianeira.', img: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800' }
    ]
  }
};

const Rosary: React.FC = () => {
  const [currentType, setCurrentType] = useState<keyof typeof MYSTERIES>('joyful');
  const [step, setStep] = useState(0);
  const [bead, setBead] = useState(0);

  useEffect(() => {
    const day = new Date().getDay();
    if (day === 1 || day === 6) setCurrentType('joyful');
    else if (day === 2 || day === 5) setCurrentType('sorrowful');
    else if (day === 3 || day === 0) setCurrentType('glorious');
    else if (day === 4) setCurrentType('luminous');
  }, []);

  const mystery = MYSTERIES[currentType] || MYSTERIES.joyful;
  const currentItem = mystery.items[step];

  const nextStep = () => {
    if (bead < 10) {
      setBead(bead + 1);
    } else {
      if (step < 4) {
        setStep(step + 1);
        setBead(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-40 animate-in fade-in duration-700 px-2 md:px-0">
      <header className="text-center space-y-4">
        <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Rosarium</h2>
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 px-4">
          {Object.entries(MYSTERIES).map(([k, v]) => (
            <button 
              key={k} 
              onClick={() => { setCurrentType(k as any); setStep(0); setBead(0); }}
              className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${currentType === k ? 'bg-stone-900 text-gold shadow-xl' : 'bg-white dark:bg-stone-800 text-stone-400 border border-stone-100 dark:border-stone-700'}`}
            >
              {v.name}
            </button>
          ))}
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-10">
        <main className="lg:col-span-8 space-y-8">
           <div className="bg-white dark:bg-stone-900 rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-4xl border border-stone-100 dark:border-stone-800 group">
              <div className="h-[350px] md:h-[500px] relative overflow-hidden">
                <SacredImage src={currentItem.img} alt={currentItem.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[15s]" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10 text-white space-y-2">
                   <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">{step + 1}º Mistério {mystery.name}</span>
                   <h3 className="text-4xl md:text-6xl font-serif font-bold tracking-tighter">{currentItem.title}</h3>
                </div>
              </div>
              
              <div className="p-10 md:p-16 space-y-10">
                 <div className="bg-stone-50 dark:bg-stone-800/50 p-8 md:p-12 rounded-[2.5rem] border-l-8 border-gold">
                    <p className="text-2xl md:text-3xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">
                      "{currentItem.med}"
                    </p>
                 </div>

                 <div className="space-y-6">
                    <div className="flex justify-between items-center px-4">
                       <span className="text-[10px] font-black uppercase text-stone-400">Ave Marias</span>
                       <span className="text-xl font-serif font-bold text-gold">{bead}/10</span>
                    </div>
                    <div className="flex justify-between gap-1.5 md:gap-4 px-2">
                       {Array.from({ length: 10 }).map((_, i) => (
                         <div 
                          key={i} 
                          className={`flex-1 h-3 rounded-full transition-all duration-500 ${i < bead ? 'bg-gold shadow-[0_0_12px_rgba(212,175,55,0.6)]' : 'bg-stone-100 dark:bg-stone-800'}`} 
                         />
                       ))}
                    </div>
                 </div>

                 <button 
                  onClick={nextStep}
                  className="w-full py-8 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                 >
                    {bead < 10 ? <><Icons.Star className="w-5 h-5" /> Rezar Dezena</> : (step < 4 ? "Próximo Mistério" : "Finalizar Rosário")}
                 </button>
              </div>
           </div>
        </main>

        <aside className="lg:col-span-4 space-y-6">
           <div className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl">
              <h4 className="text-sm font-serif font-bold mb-6 flex items-center gap-3">
                <Icons.History className="w-4 h-4 text-gold" /> Meditação do Dia
              </h4>
              <div className="space-y-4">
                 {mystery.items.map((m, idx) => (
                   <button 
                    key={idx}
                    onClick={() => { setStep(idx); setBead(0); }}
                    className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 ${step === idx ? 'bg-stone-900 text-white' : 'hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-400'}`}
                   >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === idx ? 'bg-gold text-stone-900' : 'bg-stone-100 dark:bg-stone-700'}`}>{idx + 1}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{m.title}</span>
                   </button>
                 ))}
              </div>
           </div>

           <div className="bg-sacred p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
              <Icons.Cross className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 group-hover:rotate-12 transition-transform" />
              <h5 className="text-[9px] font-black uppercase tracking-widest text-gold mb-3">Sursum Corda</h5>
              <p className="font-serif italic text-lg leading-snug">"O Rosário é a escada para chegarmos ao céu."</p>
           </div>
        </aside>
      </div>
    </div>
  );
};

export default Rosary;
