
import React, { useState, useEffect, memo } from 'react';
import { Icons } from '../constants';
import { SavedItem } from '../types';

interface ActionButtonsProps {
  itemId: string;
  type: SavedItem['type'];
  title: string;
  content?: string;
  metadata?: any;
  className?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ itemId, type, title, content, metadata, className = "" }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const bookmarks: SavedItem[] = JSON.parse(localStorage.getItem('cathedra_saved_items') || '[]');
    setIsBookmarked(bookmarks.some(b => b.id === itemId));
  }, [itemId]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const bookmarks: SavedItem[] = JSON.parse(localStorage.getItem('cathedra_saved_items') || '[]');
    const isAlready = bookmarks.some(b => b.id === itemId);
    
    let next;
    if (isAlready) {
      next = bookmarks.filter(b => b.id !== itemId);
      setIsBookmarked(false);
    } else {
      const newItem: SavedItem = {
        id: itemId,
        type,
        title,
        content: content || "",
        metadata,
        timestamp: new Date().toISOString()
      };
      next = [...bookmarks, newItem];
      setIsBookmarked(true);
      
      // Feedback Profissional: Toast Animado
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);

      // Trigger Background Sync se suportado
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(reg => {
          (reg as any).sync.register('sync-favorites').catch(() => {});
        });
      }
    }
    
    localStorage.setItem('cathedra_saved_items', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('cathedra-saved-updated'));
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${title}\n\n${content}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`flex items-center gap-1.5 relative ${className}`}>
      {showToast && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-stone-900 dark:bg-gold text-gold dark:text-stone-900 text-[8px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full shadow-4xl animate-in slide-in-from-bottom-2 fade-in duration-300 whitespace-nowrap z-[100] border border-gold/20">
          Tesouro Guardado ✨
        </div>
      )}

      <button 
        onClick={toggleBookmark}
        className={`p-3 rounded-2xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center ${isBookmarked ? 'text-sacred bg-sacred/10 ring-1 ring-sacred/20' : 'text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
        aria-label="Guardar no Florilégio"
      >
        <Icons.Star className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
      </button>

      <button 
        onClick={copyToClipboard}
        className={`p-3 rounded-2xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center ${isCopied ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
        aria-label="Copiar Citação"
      >
        {isCopied ? (
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-current rounded-full animate-ping" />
            <Icons.ExternalLink className="w-4 h-4" />
          </div>
        ) : (
          <Icons.ExternalLink className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default memo(ActionButtons);
