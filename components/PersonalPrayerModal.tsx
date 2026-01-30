
import React, { useState, useEffect, useRef } from 'react';
import { Icons, Logo } from '../constants';
import { SavedItem } from '../types';

interface PersonalPrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PersonalPrayerModal: React.FC<PersonalPrayerModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleInputRef.current?.focus(), 300);
    } else {
      setTitle('');
      setContent('');
      setShowSuccess(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsSaving(true);
    
    // Simulação de tempo de reflexão
    await new Promise(resolve => setTimeout(resolve, 800));

    const newItem: SavedItem = {
      id: `personal_prayer_${Date.now()}`,
      type: 'prayer',
      title: title.trim(),
      content: content.trim(),
      timestamp: new Date().toISOString(),
      metadata: { isPersonal: true }
    };

    const saved = JSON.parse(localStorage.getItem('cathedra_saved_items') || '[]');
    localStorage.setItem('cathedra_saved_items', JSON.stringify([...saved, newItem]));
    
    // Dispara evento para atualizar a UI de favoritos se necessário
    window.dispatchEvent(new CustomEvent('cathedra-saved-updated'));

    setIsSaving(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#fdfcf8] dark:bg-stone-900 rounded-[3rem] shadow-4xl border border-gold/20 overflow-hidden animate-modal-zoom flex flex-col max-h-[85vh]">
        
        <header className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-sacred rounded-xl shadow-lg">
              <Icons.Heart className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-none">Resonare Cordis</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mt-1">Oração Pessoal • Diálogo com Deus</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl hover:text-sacred transition-all">
            <Icons.Cross className="w-5 h-5 rotate-45" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
          {showSuccess ? (
            <div className="py-20 text-center space-y-6 animate-in zoom-in-95">
               <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <Icons.Star className="w-10 h-10 text-white fill-current animate-pulse" />
               </div>
               <h3 className="text-3xl font-serif font-bold">Gesto Guardado</h3>
               <p className="text-stone-400 italic">Sua oração foi preservada no memorial do seu coração.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 ml-4">Intenção ou Título</label>
                <input 
                  ref={titleInputRef}
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Pela minha família, Agradecimento..."
                  className="w-full px-8 py-5 bg-stone-50 dark:bg-stone-800 border-2 border-transparent focus:border-gold/30 rounded-2xl outline-none font-serif italic text-2xl transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 ml-4">Oração</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Fale com o Senhor do fundo do seu coração..."
                  rows={8}
                  className="w-full px-8 py-6 bg-stone-50 dark:bg-stone-800 border-2 border-transparent focus:border-gold/30 rounded-[2rem] outline-none font-serif text-xl leading-relaxed transition-all resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {!showSuccess && (
          <footer className="p-6 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 flex justify-end">
             <button 
               onClick={handleSave}
               disabled={isSaving || !title.trim() || !content.trim()}
               className="px-12 py-5 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-30"
             >
               {isSaving ? (
                 <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
               ) : (
                 <>
                   <Icons.Feather className="w-4 h-4" />
                   <span>Guardar Oração</span>
                 </>
               )}
             </button>
          </footer>
        )}
      </div>
    </div>
  );
};

export default PersonalPrayerModal;
