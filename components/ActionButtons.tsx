
import React, { useState, useEffect, memo } from 'react';
import { Icons } from '../constants';
import { SavedItem } from '../types';
import VoicePlayer from './VoicePlayer';
import { generatePDF, downloadPDF } from '../utils/export';

interface ActionButtonsProps {
  itemId: string;
  type: SavedItem['type'];
  title: string;
  content?: string;
  metadata?: any;
  className?: string;
  readingMode?: 'study' | 'prayer';
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  itemId, 
  type, 
  title, 
  content, 
  metadata, 
  className = "",
  readingMode = 'study'
}) => {
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
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    }
    
    localStorage.setItem('cathedra_saved_items', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('cathedra-saved-updated'));
  };

  const handlePDFExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Fix: Cast readingMode to the specific literal union expected by generatePDF to avoid widening to 'string'
    const config = generatePDF({
      title,
      content: content || "",
      mode: readingMode as 'study' | 'prayer',
      metadata
    });
    downloadPDF(config);
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${title}\n\n${content}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`flex items-center gap-1 relative ${className}`}>
      {showToast && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-pro-accent text-white text-[8px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-300 whitespace-nowrap z-[100] border border-white/10">
          Item Guardado
        </div>
      )}

      {content && (
        <VoicePlayer 
          text={content} 
          className="hover:bg-pro-soft text-pro-muted hover:text-pro-accent rounded-xl" 
        />
      )}

      <button 
        onClick={toggleBookmark}
        className={`p-2.5 rounded-xl transition-all active:scale-90 flex items-center justify-center ${isBookmarked ? 'text-sacred bg-sacred/5' : 'text-pro-muted hover:bg-pro-soft hover:text-pro-accent'}`}
        aria-label="Favoritar"
      >
        <Icons.Star className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
      </button>

      <button 
        onClick={handlePDFExport}
        className="p-2.5 rounded-xl text-pro-muted hover:bg-pro-soft hover:text-gold transition-all active:scale-90 flex items-center justify-center"
        aria-label="Exportar PDF"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>

      <button 
        onClick={copyToClipboard}
        className={`p-2.5 rounded-xl transition-all active:scale-90 flex items-center justify-center ${isCopied ? 'text-emerald-600 bg-emerald-50' : 'text-pro-muted hover:bg-pro-soft hover:text-pro-accent'}`}
        aria-label="Copiar"
      >
        <Icons.ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
};

export default memo(ActionButtons);
