
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { getTheologicalDialogueStream } from '../services/gemini';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

const Colloquium: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    // Adiciona uma mensagem vazia da AI para ir preenchendo
    setMessages(prev => [...prev, { role: 'ai', text: '' }]);

    try {
      let fullText = '';
      const stream = getTheologicalDialogueStream(userMsg);
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'ai', text: fullText };
          return newMessages;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: 'ai', text: "Ocorreu um erro ao consultar as fontes. Tente novamente." };
        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col bg-stone-50 dark:bg-stone-950 overflow-hidden -mt-10 -mx-12 rounded-[4rem] border border-stone-200 dark:border-stone-800 shadow-3xl animate-in slide-in-from-bottom-10 duration-1000">
      <header className="bg-[#1a1a1a] p-10 flex items-center justify-between border-b border-[#d4af37]/20">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-[#d4af37] rounded-3xl flex items-center justify-center shadow-xl rotate-3">
             <Icons.Feather className="w-8 h-8 text-stone-900" />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#d4af37]">Colloquium</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">Diálogo com a Tradição</p>
          </div>
        </div>
        <div className="hidden md:block text-right">
           <p className="text-white/60 font-serif italic text-sm">"Fides Quaerens Intellectum"</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar parchment dark:bg-stone-900">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale group">
            <Icons.Cross className="w-32 h-32 mb-8 text-stone-300 group-hover:scale-110 transition-transform" />
            <p className="text-3xl font-serif italic text-stone-400 dark:text-stone-500 max-w-md">Inicie uma disputa teológica ou peça esclarecimentos sobre a fé.</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className={`max-w-[85%] p-10 rounded-[3rem] shadow-xl relative overflow-hidden ${m.role === 'user' ? 'bg-[#1a1a1a] text-[#d4af37] rounded-br-none' : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-bl-none border border-stone-100 dark:border-stone-700'}`}>
              {m.role === 'ai' && <div className="absolute top-0 left-0 w-2 h-full bg-[#d4af37]" />}
              <p className={`font-serif text-xl md:text-2xl leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'italic' : ''}`}>
                {m.text || (loading && m.role === 'ai' ? '...' : '')}
              </p>
              <div className={`mt-4 text-[8px] font-black uppercase tracking-widest ${m.role === 'user' ? 'text-[#d4af37]/40' : 'text-stone-300 dark:text-stone-600'}`}>
                {m.role === 'user' ? 'Discípulo' : 'Doctor Angelicus'}
              </div>
            </div>
          </div>
        ))}
        
        {loading && messages[messages.length-1]?.text === '' && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white dark:bg-stone-800 p-10 rounded-[3rem] border border-stone-100 dark:border-stone-700 flex items-center gap-4">
               <div className="flex gap-1">
                 <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce" />
                 <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce [animation-delay:0.2s]" />
                 <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce [animation-delay:0.4s]" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">Consultando o Depósito da Fé...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-10 bg-white dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <div className="max-w-5xl mx-auto flex gap-6">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte sobre Graça, Natureza, Moral..."
            className="flex-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 dark:text-white px-10 py-6 rounded-[2.5rem] focus:ring-16 focus:ring-[#d4af37]/5 outline-none font-serif italic text-2xl"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-[#1a1a1a] text-[#d4af37] p-8 rounded-full hover:bg-[#8b0000] hover:text-white transition-all shadow-xl disabled:opacity-30 active:scale-95"
          >
            <Icons.Feather className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Colloquium;
