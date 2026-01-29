
import React from 'react';
import { Icons, Logo } from '../constants';

const About: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-24 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-48 pt-10">
      <header className="text-center space-y-8">
        <div className="flex justify-center">
          <div className="p-8 bg-stone-900 rounded-[3rem] shadow-sacred border border-gold/30 rotate-3 hover:rotate-0 transition-transform duration-700">
            <Logo className="w-20 h-20" />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-6xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tight">Cátedra Digital</h2>
          <p className="text-stone-400 italic text-2xl md:text-3xl max-w-2xl mx-auto leading-relaxed">
            "Formar a mente. <span className="text-sacred dark:text-gold">Aquecer o coração.</span>"
          </p>
        </div>
        <cite className="block text-[11px] font-black uppercase tracking-[0.5em] text-stone-400">Inteligência Teológica • Lex Orandi, Lex Credendi</cite>
      </header>

      <section className="bg-white dark:bg-stone-900 p-12 md:p-20 rounded-[4rem] shadow-xl border border-stone-100 dark:border-stone-800 space-y-12">
        <div className="space-y-6 max-w-3xl">
           <h3 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">O que é a Cátedra?</h3>
           <p className="text-2xl font-serif text-stone-600 dark:text-stone-400 leading-relaxed italic">
             A Cátedra Digital não é apenas um site ou aplicativo; é um **Santuário de Inteligência Teológica**.
           </p>
           <p className="text-xl text-stone-500 dark:text-stone-400 leading-relaxed">
             Vivemos em uma era de ruído e fragmentação. A informação católica está espalhada, muitas vezes sem contexto ou ordem. A Cátedra nasce para **sistematizar o depósito da fé**, oferecendo ao fiel uma ferramenta profissional onde Escritura, Tradição e Magistério se conectam de forma orgânica e profunda.
           </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 pt-10 border-t border-stone-50 dark:border-stone-800">
          <div className="space-y-6">
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-sacred">Nossa Missão</span>
            <h4 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">Iluminar a Razão</h4>
            <p className="text-stone-500 dark:text-stone-400 text-lg leading-relaxed">
              Fornecer ao católico moderno um ambiente de estudo imersivo, livre de distrações e tecnicamente superior, onde a tecnologia serve à Palavra, e não o contrário.
            </p>
          </div>
          <div className="space-y-6">
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-gold">Nosso Valor</span>
            <h4 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">Fidelidade e Ordem</h4>
            <p className="text-stone-500 dark:text-stone-400 text-lg leading-relaxed">
              Integridade doutrinária absoluta. Todo conteúdo é fundamentado em fontes oficiais (Nova Vulgata, Catecismo da Igreja Católica, Suma Teológica), garantindo um caminho seguro de formação.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-stone-900 p-16 md:p-24 rounded-[5rem] text-white shadow-4xl space-y-12 relative overflow-hidden group">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
        <Icons.Feather className="absolute -bottom-10 -right-10 w-64 h-64 text-gold/10 group-hover:rotate-12 transition-transform duration-1000" />
        
        <div className="max-w-3xl space-y-8 relative z-10">
          <h3 className="text-4xl md:text-5xl font-serif font-bold text-gold tracking-tight">Para quem é este Santuário?</h3>
          <ul className="space-y-8">
            <li className="flex gap-6">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0"><Icons.Book className="w-6 h-6 text-gold" /></div>
               <div>
                  <h5 className="text-xl font-serif font-bold">O Peregrino Iniciante</h5>
                  <p className="text-white/60 mt-1">Para quem deseja ler a Bíblia e o Catecismo pela primeira vez com um guia claro e organizado.</p>
               </div>
            </li>
            <li className="flex gap-6">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0"><Icons.Feather className="w-6 h-6 text-gold" /></div>
               <div>
                  <h5 className="text-xl font-serif font-bold">O Estudioso Scholar</h5>
                  <p className="text-white/60 mt-1">Para catequistas, teólogos e fiéis que buscam profundidade, correlações via IA e acesso a obras escolásticas.</p>
               </div>
            </li>
            <li className="flex gap-6">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0"><Icons.History className="w-6 h-6 text-gold" /></div>
               <div>
                  <h5 className="text-xl font-serif font-bold">O Orante Diário</h5>
                  <p className="text-white/60 mt-1">Para quem vive o ritmo da Igreja através da Liturgia Diária, do Rosário e do Ofício das Horas.</p>
               </div>
            </li>
          </ul>
        </div>
      </section>

      <footer className="text-center pt-10 pb-20 opacity-30">
         <p className="text-[10px] font-black uppercase tracking-[0.8em] text-stone-400">Ex Umbris Et Imaginibus In Veritatem</p>
         <p className="text-stone-400 font-serif italic mt-4">Desenvolvido para a Glória de Deus e serviço da Sua Santa Igreja.</p>
         <Icons.Cross className="w-8 h-8 mx-auto mt-8" />
      </footer>
    </div>
  );
};

export default About;
