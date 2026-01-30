
import React, { useState } from 'react';
import { Icons } from '../constants';
import { Verse } from '../types';
import ActionButtons from './ActionButtons';
import Commentary from './Commentary';
import ReadingModeToggle from './ReadingModeToggle';
import ReflectionBox from './ReflectionBox';

interface BibleReaderProps {
  book: string;
  chapter: number;
  verses: Verse[];
  onVerseSelect?: (verse: Verse) => void;
}

const BibleReader: React.FC<BibleReaderProps> = ({ book, chapter, verses }) => {
  const [fontSize, setFontSize] = useState(1.15);
  const [mode, setMode] = useState<'study' | 'prayer'>('study');
  const [activeVerse, setActiveVerse] = useState<number | null>(null);

  return (
    <section className={`max-w-4xl mx-auto px-4 md:px-0 animate-in fade-in duration-1000 pb-20 ${mode === 'study' ? 'study-mode' : 'prayer-mode'}`}>
      {/* Toolbar Flutuante Pro */}
      <div className="sticky top-20 z-[100] flex justify-center mb-16">
        <div className="bg-pro-main/90 dark:bg-stone-900/95 backdrop-blur-xl border border-pro-border dark:border-white/5 px-6 py-3 rounded-2xl shadow-4xl flex items-center gap-6">
          <div className="flex items-center gap-4 border-r border-pro-border pr-6">
            <span className="text-[10px] font-black uppercase text-pro-muted tracking-widest">Tipografia</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setFontSize(f => Math.max(0.8, f - 0.1))} className="text-pro-muted hover:text-pro-accent transition-colors font-bold px-2">A-</button>
              <button onClick={() => setFontSize(f => Math.min(2.5, f + 0.1))} className="text-pro-muted hover:text-pro-accent transition-colors font-bold text-lg px-2">A+</button>
            </div>
          </div>
          
          <ReadingModeToggle mode={mode} setMode={setMode} />
        </div>
      </div>
      
      {/* Cabeçalho Pro */}
      <header className="text-center mb-24 space-y-4">
        <div className="flex items-center justify-center gap-4 mb-2">
           <div className="h-px w-10 bg-pro-border" />
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">Sacra Scriptura</span>
           <div className="h-px w-10 bg-pro-border" />
        </div>
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-pro-accent dark:text-stone-100 tracking-tight leading-none">
          {book}
        </h1>
        <p className="text-2xl font-serif italic text-pro-muted">
          Capitulum <span className="text-sacred font-bold">{chapter}</span>
        </p>
      </header>

      {/* Grid de Versículos Pro */}
      <article 
        className={`reader-text space-y-4 leading-[1.8] text-justify selection:bg-gold/20 ${mode === 'prayer' ? 'italic' : ''}`}
        style={{ fontSize: mode === 'prayer' ? '1.25rem' : `${fontSize}rem`, lineHeight: mode === 'prayer' ? '2.1' : '1.8' }}
      >
        {verses.map((verse) => {
          const isSelected = activeVerse === verse.verse;
          return (
            <div 
              key={verse.verse} 
              className={`relative group transition-all duration-300 rounded-2xl p-4 ${isSelected ? 'bg-pro-soft ring-1 ring-pro-border shadow-sm' : 'hover:bg-pro-soft/50'}`}
              onClick={() => setActiveVerse(verse.verse)}
            >
              <div className="flex gap-6">
                <span className={`text-xs font-black font-sans transition-colors mt-2 w-6 shrink-0 text-right ${isSelected ? 'text-gold' : 'text-pro-border'}`}>
                  {verse.verse}
                </span>
                
                <div className="space-y-4 flex-1">
                  <p className={`text-pro-accent dark:text-stone-200 transition-colors duration-300 ${isSelected ? 'opacity-100' : 'opacity-90'}`}>
                    {verse.text}
                  </p>
                  
                  {mode === 'study' && (isSelected) && (
                    <div className="flex items-center gap-4 animate-in fade-in duration-300 pt-2">
                      <ActionButtons 
                        itemId={`pro_reader_${book}_${chapter}_${verse.verse}`} 
                        type="verse" 
                        title={`${book} ${chapter}:${verse.verse}`} 
                        content={verse.text} 
                        className="scale-90 origin-left" 
                        readingMode={mode}
                      />
                      <div className="h-px flex-1 bg-pro-border" />
                    </div>
                  )}
                  
                  {mode === 'study' && verse.verse === 1 && (
                    <Commentary 
                      verse={verse.verse}
                      source="Symphonia IA" 
                      content="O texto original sugere uma continuidade eterna da ação divina através do Verbo." 
                      className="commentary mt-4 border-l-2 border-gold/40"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </article>

      {/* Seção de Reflexão Pro */}
      <div className="mt-20">
        <ReflectionBox 
          itemId={`bible_${book}_${chapter}`} 
          title={`${book} ${chapter}`} 
        />
      </div>

      <footer className="mt-32 pt-12 border-t border-pro-border text-center opacity-30">
        <Icons.Cross className="w-8 h-8 mx-auto mb-4 text-pro-muted" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-pro-muted">Ad Maiorem Dei Gloriam</p>
      </footer>
    </section>
  );
};

export default BibleReader;
