
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';

interface ActionButtonsProps {
  itemId: string;
  textToCopy?: string;
  fullData?: any; // New prop to store the full object (verse, paragraph, etc.)
  className?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ itemId, textToCopy, fullData, className = "" }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem('cathedra_bookmarks') || '[]');
    const highlights = JSON.parse(localStorage.getItem('cathedra_highlights') || '[]');
    setIsBookmarked(bookmarks.includes(itemId));
    setIsHighlighted(highlights.includes(itemId));
  }, [itemId]);

  const updateSavedData = (id: string, data: any, remove: boolean) => {
    const savedData = JSON.parse(localStorage.getItem('cathedra_saved_content') || '{}');
    if (remove) {
      delete savedData[id];
    } else if (data) {
      savedData[id] = data;
    }
    localStorage.setItem('cathedra_saved_content', JSON.stringify(savedData));
    // Trigger global event for components listening to storage changes
    window.dispatchEvent(new CustomEvent('cathedra-content-sync'));
  };

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('cathedra_bookmarks') || '[]');
    let newBookmarks;
    const removing = bookmarks.includes(itemId);
    
    if (removing) {
      newBookmarks = bookmarks.filter((id: string) => id !== itemId);
    } else {
      newBookmarks = [...bookmarks, itemId];
    }
    
    localStorage.setItem('cathedra_bookmarks', JSON.stringify(newBookmarks));
    setIsBookmarked(!removing);
    updateSavedData(itemId, fullData, removing && !isHighlighted);
  };

  const toggleHighlight = () => {
    const highlights = JSON.parse(localStorage.getItem('cathedra_highlights') || '[]');
    let newHighlights;
    const removing = highlights.includes(itemId);

    if (removing) {
      newHighlights = highlights.filter((id: string) => id !== itemId);
    } else {
      newHighlights = [...highlights, itemId];
    }
    
    localStorage.setItem('cathedra_highlights', JSON.stringify(newHighlights));
    setIsHighlighted(!removing);
    updateSavedData(itemId, fullData, removing && !isBookmarked);
    window.dispatchEvent(new CustomEvent('highlight-change', { detail: { itemId, status: !removing } }));
  };

  const handleShare = async () => {
    if (!textToCopy) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cathedra Digital - Sabedoria',
          text: `${textToCopy}\n\nVia: Cathedra Digital 🏛️`,
          url: window.location.href
        });
      } catch (err) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button 
        onClick={toggleHighlight}
        className={`p-2 rounded-full transition-all hover:bg-stone-100 dark:hover:bg-stone-800 ${isHighlighted ? 'text-[#d4af37] bg-stone-50 dark:bg-stone-900' : 'text-stone-300'}`}
        title="Destacar Texto"
      >
        <Icons.Feather className="w-4 h-4" />
      </button>
      
      <button 
        onClick={handleShare}
        className="p-2 rounded-full transition-all hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-300"
        title="Compartilhar"
      >
        <Icons.Globe className="w-4 h-4" />
      </button>

      <button 
        onClick={toggleBookmark}
        className={`p-2 rounded-full transition-all hover:bg-stone-100 dark:hover:bg-stone-800 ${isBookmarked ? 'text-[#8b0000] bg-stone-50 dark:bg-stone-900' : 'text-stone-300'}`}
        title="Marcar Página"
      >
        <Icons.History className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
      </button>

      <button 
        onClick={copyToClipboard}
        className={`p-2 rounded-full transition-all hover:bg-stone-100 dark:hover:bg-stone-800 ${isCopied ? 'text-green-600' : 'text-stone-300'}`}
        title="Copiar"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isCopied ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          )}
        </svg>
      </button>
    </div>
  );
};

export default ActionButtons;
