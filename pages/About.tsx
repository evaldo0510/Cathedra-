
import React from 'react';
import { Icons } from '../constants';

const About: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-24 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-32">
      <header className="text-center space-y-8">
        <div className="flex justify-center">
          <div className="p-6 bg-[#fcf8e8] rounded-full border border-[#d4af37]/30 shadow-sacred">
            <Icons.Cross className="w-16 h-16 text-[#8b0000]" />
          </div>
        </div>
        <h2 className="text-7xl font-serif font-bold text-stone-900 tracking-tight">Sobre o Projeto</h2>
        <p className="text-stone-400 italic text-2xl max-w-2xl mx-auto leading-relaxed">
          "A verdade não se impõe senão pela força da própria verdade, que penetra o espírito suave e ao mesmo tempo fortemente."
        </p>
        <cite className="block text-[11px] font-black uppercase tracking-[0.5em] text-[#d4af37]">Dignitatis Humanae • Concílio Vaticano II</cite>
      </header>

      <section className="grid md:grid-cols-3 gap-12">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-stone-100 space-y-6 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
            <Icons.Globe className="w-32 h-32" />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#8b0000]">Nossa Missão</h3>
          <h4 className="text-3xl font-serif font-bold text-stone-900">Iluminar e Conectar</h4>
          <p className="text-stone-500 font-serif italic text-lg leading-relaxed">
            Nossa missão é democratizar o acesso ao Magistério e à Tradição da Igreja por meio da tecnologia, permitindo que cada fiel mergulhe no nexo entre Escritura e Vida.
          </p>
        </div>

        <div className="bg-[#1a1a1a] p-12 rounded-[3.5rem] shadow-xl border border-white/5 space-y-6 text-white relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 opacity-[0.1] group-hover:scale-110 transition-transform duration-700 text-[#d4af37]">
            <Icons.Feather className="w-32 h-32" />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#d4af37]">Nossa Visão</h3>
          <h4 className="text-3xl font-serif font-bold">Farol Digital</h4>
          <p className="text-white/60 font-serif italic text-lg leading-relaxed">
            Ser a principal plataforma digital de consulta teológica relacional, tornando-se uma ferramenta indispensável para seminaristas, catequistas e estudiosos da fé.
          </p>
        </div>

        <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-stone-100 space-y-6 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
            <Icons.Users className="w-32 h-32" />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#8b0000]">Nossos Valores</h3>
          <h4 className="text-3xl font-serif font-bold">Fidelidade e Rigor</h4>
          <ul className="text-stone-500 font-serif italic text-lg leading-relaxed space-y-2">
            <li>• Sentire cum Ecclesia</li>
            <li>• Excelência Acadêmica</li>
            <li>• Reverência Litúrgica</li>
            <li>• Inovação Ética</li>
          </ul>
        </div>
      </section>

      <section className="sacred-background parchment p-16 md:p-24 rounded-[5rem] border border-[#d4af37]/20 shadow-2xl space-y-12">
        <div className="max-w-3xl mx-auto space-y-8 text-center">
          <h3 className="text-5xl font-serif font-bold text-stone-900">O Objetivo</h3>
          <p className="text-2xl font-serif text-stone-700 leading-relaxed italic">
            O Cathedra Digital nasce do desejo de oferecer uma resposta moderna ao chamado da Nova Evangelização. Em um mundo de informações fragmentadas, buscamos oferecer <strong>integridade</strong>. 
          </p>
          <p className="text-xl font-serif text-stone-600 leading-relaxed">
            Ao conectar o texto bíblico às definições dogmáticas e ao magistério papal através de IA, facilitamos a <i>Lectio Divina</i> e o estudo apologético, garantindo que a tecnologia sirva à Palavra, e não o contrário.
          </p>
        </div>
        
        <div className="flex justify-center pt-8">
           <div className="h-px w-32 bg-[#d4af37]/30" />
        </div>
        
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.8em] text-stone-300">Desenvolvido para a Glória de Deus</p>
          <p className="text-stone-400 font-serif italic mt-2">Versão 1.5.0 • Digital Sanctuarium</p>
        </div>
      </section>
    </div>
  );
};

export default About;
