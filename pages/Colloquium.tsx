
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
    
    // Adiciona msg do usuário e um slot vazio para a IA
    setMessages(prev => [...prev, { role: 'user', text: userMsg }, { role: 'ai', text: '' }]);
    setLoading(true);

    try {
      let fullText = '';
      const stream = getTheologicalDialogueStream(userMsg);
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIdx = newMessages.length - 1;
          if (newMessages[lastIdx].role === 'ai') {
             newMessages[lastIdx] = { role: 'ai', text: fullText };
          }
          return newMessages;
        });
      }
    } catch (err) {
      console.error("Erro no streaming teológico:", err);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIdx = newMessages.length - 1;
        newMessages[lastIdx] = { role: 'ai', text: "Ocorreu um erro ao consultar as fontes sagradas. Tente novamente." };
        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col bg-stone-50 dark:bg-stone-950 overflow-hidden -mt-10 -mx-4 md:-mx-12 rounded-[4rem] border border-stone-200 dark:border-stone-800 shadow-3xl animate-in slide-in-from-bottom-10 duration-1000">
      <header className="bg-[#1a1a1a] p-6 md:p-10 flex items-center justify-between border-b border-[#d4af37]/20">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-[#d4af37] rounded-3xl flex items-center justify-center shadow-xl rotate-3">
             <Icons.Feather className="w-6 h-6 md:w-8 md:h-8 text-stone-900" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#d4af37]">Colloquium</h2>
            <p className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.4em] text-white/40">Diálogo com a Tradição</p>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 custom-scrollbar parchment dark:bg-stone-900">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale">
            <Icons.Cross className="w-24 h-24 mb-8 text-stone-300" />
            <p className="text-2xl font-serif italic text-stone-400 dark:text-stone-500 max-w-md">Inicie uma disputa teológica ou peça esclarecimentos sobre a fé.</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[90%] md:max-w-[85%] p-6 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden ${m.role === 'user' ? 'bg-[#1a1a1a] text-[#d4af37] rounded-br-none' : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-bl-none border border-stone-100 dark:border-stone-700'}`}>
              {m.role === 'ai' && <div className="absolute top-0 left-0 w-2 h-full bg-[#d4af37]" />}
              <p className={`font-serif text-lg md:text-2xl leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'italic' : ''}`}>
                {m.text || (loading && i === messages.length - 1 ? '...' : '')}
              </p>
              <div className={`mt-4 text-[7px] md:text-[8px] font-black uppercase tracking-widest ${m.role === 'user' ? 'text-[#d4af37]/40' : 'text-stone-300 dark:text-stone-600'}`}>
                {m.role === 'user' ? 'Discípulo' : 'Doctor Angelicus'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 md:p-10 bg-white dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800">
        <div className="max-w-5xl mx-auto flex gap-4 md:gap-6">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Dúvida teológica ou moral..."
            className="flex-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 dark:text-white px-6 md:px-10 py-4 md:py-6 rounded-[2rem] focus:ring-8 focus:ring-[#d4af37]/5 outline-none font-serif italic text-lg md:text-2xl"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-[#1a1a1a] text-[#d4af37] p-4 md:p-8 rounded-full hover:bg-[#8b0000] hover:text-white transition-all shadow-xl disabled:opacity-30 active:scale-95"
          >
            <Icons.Feather className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Colloquium;
