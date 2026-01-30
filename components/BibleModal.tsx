
import React, { useState, useEffect, useMemo } from 'react';
import { Icons, Logo } from '../constants';
import { CATHOLIC_BIBLE_BOOKS, Book } from '../services/bibleLocal';
import { bibleService } from '../services/bibleService';
import { Verse } from '../types';

interface BibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFullRead?: (book: string, chapter: number) => void;
}

type Step = 'books' | 'chapters' | 'reading';

const BibleModal: React.FC<BibleModalProps> = ({ isOpen, onClose, onFullRead }) => {
  const [step, setStep] = useState<Step>('books');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('books');
        setSearchTerm('');
        setSelectedBook(null);
        setVerses([]);
      }, 300);
    }
  }, [isOpen]);

  const filteredBooks = useMemo(() => {
    return CATHOLIC_BIBLE_BOOKS.filter(b => 
      b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    setStep('chapters');
  };

  const handleChapterSelect = async (ch: number) => {
    if (!selectedBook) return;
    setSelectedChapter(ch);
    setStep('reading');
    setLoading(true);
    try {
      const data = await bibleService.getVerses(selectedBook.name, ch);
      setVerses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-[#fdfcf8] dark:bg-stone-900 rounded-[3rem] shadow-4xl border border-gold/20 overflow-hidden animate-modal-zoom flex flex-col max-h-[90vh]">
        
        <header className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo className="w-8 h-8" />
            <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-gold uppercase tracking-widest">Bíblia Sagrada</h2>
          </div>
          <button onClick={onClose} className="p-3 bg-stone-100 dark:bg-stone-800 rounded-full hover:text-sacred transition-all">
            <Icons.Cross className="w-5 h-5 rotate-45" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
          {step === 'books' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="relative max-w-xl mx-auto">
                <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
                <input 
                  type="text" 
                  placeholder="Pesquisar livro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-stone-50 dark:bg-stone-800 border-2 border-transparent focus:border-gold/30 rounded-2xl outline-none font-serif italic text-xl transition-all"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredBooks.map(book => (
                  <button 
                    key={book.id}
                    onClick={() => handleBookSelect(book)}
                    className="p-4 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl text-left hover:border-gold transition-all"
                  >
                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">{book.testament}</span>
                    <h4 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100 truncate">{book.name}</h4>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'chapters' && selectedBook && (
            <div className="space-y-10 animate-in slide-in-from-right">
              <button onClick={() => setStep('books')} className="text-stone-400 text-xs font-black uppercase hover:text-gold flex items-center gap-2">
                <Icons.ArrowDown className="w-4 h-4 rotate-90" /> Voltar
              </button>
              <h3 className="text-4xl font-serif font-bold text-center text-stone-900 dark:text-gold">{selectedBook.name}</h3>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 max-w-3xl mx-auto">
                {Array.from({ length: selectedBook.chapters }).map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => handleChapterSelect(i + 1)}
                    className="aspect-square bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl flex items-center justify-center font-serif text-xl font-bold hover:bg-gold hover:text-stone-900 transition-all shadow-sm"
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'reading' && (
            <div className="animate-in fade-in max-w-3xl mx-auto space-y-10 pb-10">
              <header className="flex items-center justify-between border-b dark:border-stone-800 pb-6">
                <button onClick={() => setStep('chapters')} className="p-2 text-stone-400"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
                <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-gold">{selectedBook?.name} {selectedChapter}</h3>
                <div className="w-10" />
              </header>

              {loading ? (
                <div className="py-24 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-stone-400 font-serif italic">Carregando Escrituras...</p>
                </div>
              ) : (
                <article className="space-y-4 font-serif text-xl md:text-2xl leading-relaxed text-justify text-stone-800 dark:text-stone-200">
                  {verses.map(v => (
                    <span key={v.verse} className="inline group">
                      <sup className="text-[10px] font-sans font-black mr-1.5 text-gold/60">{v.verse}</sup>
                      {v.text}{' '}
                    </span>
                  ))}
                </article>
              )}
            </div>
          )}
        </div>

        <footer className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 text-center">
           <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Cathedra Digital Data Protocol v1.2</span>
        </footer>
      </div>
    </div>
  );
};

export default BibleModal;
