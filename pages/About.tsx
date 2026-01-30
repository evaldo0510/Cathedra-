import React from 'react';
import { Icons, Logo } from '../constants';

const About: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-32 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-48 pt-10 px-4">
      
      {/* HEADER MONUMENTAL */}
      <header className="text-center space-y-12">
        <div className="flex justify-center">
          <div className="p-8 bg-stone-950 rounded-[3rem] shadow-4xl border border-gold/30 rotate-3 hover:rotate-0 transition-transform duration-700 group">
            <Logo className="w-24 h-24 group-hover:scale-110 transition-transform" />
          </div>
        </div>
        <div className="space-y-6">
          <span className="text-[12px] font-black uppercase tracking-[0.8em] text-gold block">Manifesto</span>
          <h1 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">
            Não estudamos para <br />
            <span className="text-sacred italic font-normal">acumular dados.</span>
          </h1>
          <p className="text-2xl md:text-4xl font-serif italic text-stone-400 max-w-3xl mx-auto leading-tight">
            "Estudamos para formar consciências."
          </p>
        </div>
      </header>

      {/* BLOCO DE FILOSOFIA - PARCHMENT STYLE */}
      <section className="bg-white dark:bg-stone-900 p-12 md:p-24 rounded-[4rem] shadow-xl border border-stone-100 dark:border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
           <Icons.Cross className="w-96 h-96 text-gold" />
        </div>
        
        <div className="max-w-3xl space-y-12 relative z-10">
          <div className="space-y-6">
            <p className="text-2xl md:text-3xl font-serif text-stone-800 dark:text-stone-200 leading-relaxed">
              A Cathedra nasce do <span className="text-gold font-bold">silêncio</span> que busca sentido e da <span className="text-sacred font-bold">fé</span> que deseja compreensão.
            </p>
            <div className="h-px w-24 bg-gold/30" />
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-sacred">A Doutrina</h4>
              <p className="text-xl font-serif italic text-stone-500">Não é arma, é luz.</p>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">A Tradição</h4>
              <p className="text-xl font-serif italic text-stone-500">Não é prisão, é raiz viva.</p>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-900 dark:text-white">O Estudo</h4>
              <p className="text-xl font-serif italic text-stone-500">Não é vaidade, é ato de amor à Verdade.</p>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">A Fé Pensada</h4>
              <p className="text-xl font-serif italic text-stone-500">Amadurece e sustenta a vida.</p>
            </div>
          </div>
        </div>
      </section>

      {/* UNIÃO DE FONTES - DARK SECTION */}
      <section className="bg-stone-950 p-16 md:p-32 rounded-[5rem] text-white shadow-4xl space-y-16 relative overflow-hidden group">
        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
        
        <div className="text-center space-y-4 relative z-10">
           <span className="text-[11px] font-black uppercase tracking-[0.5em] text-gold/60">O Ecossistema</span>
           <h3 className="text-4xl md:text-6xl font-serif font-bold text-white">Reunidos para Ordenar</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {[
            { title: "Sagrada Escritura", desc: "A Palavra Viva", icon: <Icons.Book className="w-6 h-6" /> },
            { title: "Catecismo (CIC)", desc: "O Mapa Seguro", icon: <Icons.Cross className="w-6 h-6" /> },
            { title: "Magistério", desc: "A Voz da Sucessão", icon: <Icons.Globe className="w-6 h-6" /> },
            { title: "História & Filosofia", desc: "As Raízes da Razão", icon: <Icons.History className="w-6 h-6" /> },
            { title: "Teologia Escolástica", desc: "O Rigor do Pensar", icon: <Icons.Feather className="w-6 h-6" /> },
            { title: "Caminho Interior", desc: "A Vida do Discípulo", icon: <Icons.Star className="w-6 h-6" /> },
          ].map((item, i) => (
            <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-gold/10 hover:border-gold/30 transition-all group/item">
               <div className="p-3 bg-white/5 rounded-xl w-fit mb-6 text-gold group-hover/item:scale-110 transition-transform">
                 {item.icon}
               </div>
               <h4 className="text-xl font-serif font-bold mb-2">{item.title}</h4>
               <p className="text-sm text-stone-500 italic uppercase tracking-widest">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center pt-10 opacity-40">
           <p className="text-xl font-serif italic">"Não para confundir. Mas para ordenar. Não para impor. Mas para formar."</p>
        </div>
      </section>

      {/* ESTUDO COMO ATO ESPIRITUAL */}
      <section className="max-w-4xl mx-auto space-y-16">
        <div className="text-center space-y-6">
           <div className="inline-block p-4 bg-[#fcf8e8] dark:bg-stone-900 rounded-3xl mb-4">
              <Icons.Feather className="w-10 h-10 text-gold" />
           </div>
           <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tight">Estudar é um ato espiritual</h2>
           <p className="text-xl md:text-2xl text-stone-500 italic font-serif leading-relaxed">
             "Cada leitura é um encontro. Cada trilha é uma caminhada. Cada módulo é uma escada — não para o orgulho, mas para a responsabilidade de viver o que se crê."
           </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
           {[
             { label: "O Iniciante", status: "é acolhido" },
             { label: "O Curioso", status: "é orientado" },
             { label: "O Aprofundado", status: "é desafiado" },
             { label: "O Formador", status: "encontra base sólida" }
           ].map((profile, i) => (
             <div key={i} className="flex items-center gap-6 p-8 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-3xl group hover:border-gold transition-all">
                <div className="w-1.5 h-12 bg-gold/20 group-hover:bg-gold rounded-full transition-colors" />
                <div>
                   <h5 className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">{profile.label}</h5>
                   <p className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">{profile.status}</p>
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* COMPROMISSO E TAGLINE FINAL */}
      <section className="text-center space-y-24">
        <div className="space-y-12">
          <div className="flex items-center gap-4 justify-center opacity-30">
            <div className="h-px w-20 bg-stone-400" />
            <Icons.Cross className="w-6 h-6" />
            <div className="h-px w-20 bg-stone-400" />
          </div>
          
          <h3 className="text-3xl font-serif font-bold tracking-widest uppercase">Nosso Compromisso</h3>
          
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
            {['Fidelidade à Igreja', 'Clareza doutrinal', 'Profundidade acessível', 'Linguagem humana', 'Estudo com espírito de oração'].map(c => (
              <span key={c} className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 hover:text-sacred transition-colors cursor-default">{c}</span>
            ))}
          </div>
        </div>

        <div className="pt-24 space-y-8">
           <p className="text-xl text-stone-400 font-serif italic">"Porque a Verdade não grita — ela sustenta."</p>
           <div className="space-y-4">
              <Logo className="w-16 h-16 mx-auto opacity-20" />
              <h2 className="text-4xl md:text-7xl font-serif font-bold tracking-tighter leading-none text-stone-900 dark:text-stone-100">
                Onde a fé se senta <span className="text-gold">para aprender</span> <br />
                e o coração se levanta <span className="text-sacred">para viver.</span>
              </h2>
           </div>
        </div>
      </section>

      <footer className="text-center pt-20 pb-10 opacity-20">
         <p className="text-[10px] font-black uppercase tracking-[1em]">Cathedra Digital • Sanctuarium</p>
      </footer>
    </div>
  );
};

export default About;