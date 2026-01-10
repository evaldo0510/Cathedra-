
import React, { useState } from 'react';
import { Icons } from '../constants';
import SacredImage from '../components/SacredImage';

const STATIONS = [
  { id: 1, title: 'Jesus é condenado à morte', reflection: 'O Inocente aceita a injustiça por amor a nós.' },
  { id: 2, title: 'Jesus carrega a cruz', reflection: 'Ele toma sobre Si o peso de nossas faltas.' },
  { id: 3, title: 'Jesus cai pela primeira vez', reflection: 'A fragilidade humana sob o peso do pecado.' },
  { id: 4, title: 'Jesus encontra Sua Mãe', reflection: 'O encontro doloroso de dois corações que amam.' },
  { id: 5, title: 'Simão Cirineu ajuda Jesus', reflection: 'Somos convidados a partilhar o peso da cruz alheia.' },
  { id: 6, title: 'Verônica limpa o rosto de Jesus', reflection: 'Um gesto de compaixão gravado na eternidade.' },
  { id: 7, title: 'Jesus cai pela segunda vez', reflection: 'A perseverança mesmo no esgotamento total.' },
  { id: 8, title: 'Jesus consola as mulheres', reflection: 'Não choreis por Mim, mas por vós e vossos filhos.' },
  { id: 9, title: 'Jesus cai pela terceira vez', reflection: 'O esforço final para completar a Redenção.' },
  { id: 10, title: 'Jesus é despojado das vestes', reflection: 'A entrega total, sem nada reter para Si.' },
  { id: 11, title: 'Jesus é pregado na cruz', reflection: 'As mãos que criaram o mundo são agora imobilizadas.' },
  { id: 12, title: 'Jesus morre na cruz', reflection: 'Tudo está consumado. O amor venceu a morte.' },
  { id: 13, title: 'Jesus é descido da cruz', reflection: 'O repouso no colo da Mãe das Dores.' },
  { id: 14, title: 'Jesus é sepultado', reflection: 'O grão de trigo cai na terra para dar muito fruto.' }
];

const ViaCrucis: React.FC = () => {
  const [active, setActive] = useState(0);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
      <header className="text-center space-y-4">
        <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Via Crucis</h2>
        <p className="text-stone-400 italic text-xl">Seguindo os passos do Redentor ao Calvário</p>
      </header>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Navegação Estilo Playlist Netflix */}
        <nav className="lg:col-span-4 space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-4">
          {STATIONS.map((s, idx) => (
            <button 
              key={s.id}
              onClick={() => setActive(idx)}
              className={`w-full text-left p-6 rounded-2xl transition-all border flex items-center gap-4 ${active === idx ? 'bg-stone-900 text-gold border-gold shadow-xl scale-105' : 'bg-white dark:bg-stone-900 border-transparent text-stone-400'}`}
            >
              <span className="text-2xl font-serif font-bold w-10">{s.id}</span>
              <span className="text-sm font-bold uppercase tracking-widest leading-tight">{s.title}</span>
            </button>
          ))}
        </nav>

        {/* Visualização Central */}
        <main className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-stone-900 rounded-[3rem] overflow-hidden shadow-3xl border border-stone-100 dark:border-stone-800">
            <div className="h-[400px] relative">
              <SacredImage 
                src={`https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=1200`} 
                alt={STATIONS[active].title} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10 text-white">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">Estação {STATIONS[active].id}</span>
                <h3 className="text-4xl font-serif font-bold">{STATIONS[active].title}</h3>
              </div>
            </div>
            
            <div className="p-12 space-y-8">
              <div className="bg-[#fcf8e8] dark:bg-stone-950 p-10 rounded-[2.5rem] border-l-8 border-sacred">
                <p className="text-2xl md:text-3xl font-serif italic text-stone-800 dark:text-stone-200 leading-relaxed">
                  "{STATIONS[active].reflection}"
                </p>
              </div>

              <div className="flex justify-between items-center pt-8 border-t dark:border-stone-800">
                <button 
                  disabled={active === 0}
                  onClick={() => setActive(active - 1)}
                  className="px-8 py-4 text-stone-400 font-black uppercase tracking-widest text-[10px] disabled:opacity-20"
                >
                  Anterior
                </button>
                <div className="flex gap-2">
                  <Icons.Cross className="w-6 h-6 text-sacred opacity-30" />
                </div>
                <button 
                  disabled={active === STATIONS.length - 1}
                  onClick={() => setActive(active + 1)}
                  className="px-10 py-4 bg-gold text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all"
                >
                  Próxima Estação
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ViaCrucis;
