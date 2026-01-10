
import React, { useState, useEffect } from 'react';
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
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
    
    localStorage.setItem('cathedra_saved_items', JSON.stringify(next));
    setIsBookmarked(!isAlready);
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
    <div className={`flex items-center gap-2 relative ${className}`}>
      {showToast && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-stone-900 text-gold text-[9px] font-black uppercase px-4 py-2 rounded-full shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-300 whitespace-nowrap z-50">
          Adicionado aos Favoritos ✨
        </div>
      )}

      <button 
        onClick={toggleBookmark}
        className={`p-2.5 rounded-xl transition-all hover:scale-125 active:scale-95 ${isBookmarked ? 'text-[#8b0000] bg-[#8b0000]/10 ring-2 ring-[#8b0000]/20' : 'text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
        title="Salvar na Biblioteca"
      >
        <Icons.Star className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
      </button>

      <button 
        onClick={copyToClipboard}
        className={`p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 ${isCopied ? 'text-green-600 bg-green-50' : 'text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
      >
        {isCopied ? <Icons.Star className="w-4 h-4" /> : <Icons.Globe className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default ActionButtons;
