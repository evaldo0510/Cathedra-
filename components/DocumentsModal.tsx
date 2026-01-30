
import React, { useState, useEffect } from 'react';
import { Icons, Logo } from '../constants';
import { magisteriumService } from '../services/magisteriumService';
import { getMagisteriumDeepDive } from '../services/gemini';
import { MagisteriumDoc } from '../types';

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

const CATEGORIES = [
  { id: 'Concílio', label: 'Concílios' },
  { id: 'Encíclica', label: 'Encíclicas' },
  { id: 'Exortação', label: 'Exortações' },
  { id: 'Carta', label: 'Cartas' }
];

const DocumentsModal: React.FC<DocumentsModalProps> = ({ isOpen, onClose, lang }) => {
  const [step, setStep] = useState<'categories' | 'list' | 'reading'>('categories');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docs, setDocs] = useState<MagisteriumDoc[]>([]);
  const [docContent, setDocContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [deepDive, setDeepDive] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('categories');
      setSelectedCat(null);
      setSelectedDoc(null);
      setDocContent('');
    }
  }, [isOpen]);

  const handleCategorySelect = async (catId: string) => {
    setSelectedCat(catId);
    setStep('list');
    setLoading(true);
    try {
      const data = await magisteriumService.getDocuments(catId);
      setDocs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDocSelect = async (doc: any) => {
    setSelectedDoc(doc);
    setStep('reading');
    setLoading(true);
    try {
      const content = await magisteriumService.loadDocumentContent(doc.arquivo);
      setDocContent(content);
      const analysis = await getMagisteriumDeepDive(doc.title, lang as any);
      setDeepDive(analysis);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-[#fdfcf8] dark:bg-stone-900 rounded-[2.5rem] shadow-4xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[85vh] animate-modal-zoom">
        <header className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-sacred rounded-lg text-white"><Icons.Globe className="w-5 h-5" /></div>
            <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">Documentos da Sé</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"><Icons.Cross className="w-5 h-5 rotate-45 text-stone-400" /></button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {step === 'categories' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => handleCategorySelect(cat.id)}
                  className="p-8 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl text-left hover:border-gold hover:shadow-lg transition-all group"
                >
                  <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-gold">{cat.label}</h3>
                  <p className="text-[10px] uppercase font-black text-stone-400 mt-2">Acessar Arquivos</p>
                </button>
              ))}
            </div>
          )}

          {step === 'list' && (
            <div className="space-y-4">
              <button onClick={() => setStep('categories')} className="text-stone-400 text-[10px] font-black uppercase mb-4 flex items-center gap-2"><Icons.ArrowDown className="w-3 h-3 rotate-90" /> Voltar</button>
              {loading ? <div className="py-20 text-center animate-pulse">Consultando Arquivos...</div> : (
                <div className="grid gap-4">
                  {docs.map((doc, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleDocSelect(doc)}
                      className="p-6 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl text-left hover:border-gold transition-all"
                    >
                      <h4 className="text-lg font-serif font-bold">{doc.title}</h4>
                      <p className="text-xs text-stone-400 mt-1">{doc.source} • {doc.year}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'reading' && selectedDoc && (
            <div className="space-y-8 animate-in fade-in pb-10">
              <button onClick={() => setStep('list')} className="text-stone-400 text-[10px] font-black uppercase flex items-center gap-2"><Icons.ArrowDown className="w-3 h-3 rotate-90" /> Lista</button>
              <header className="text-center">
                <h3 className="text-3xl font-serif font-bold">{selectedDoc.title}</h3>
                <p className="text-gold font-serif italic text-lg">{selectedDoc.source}, {selectedDoc.year}</p>
              </header>
              
              <div className="bg-white dark:bg-stone-800 p-8 rounded-[2rem] shadow-inner font-serif text-lg leading-relaxed text-justify whitespace-pre-wrap selection:bg-gold/30">
                {loading ? "Carregando conteúdo..." : docContent}
              </div>

              {deepDive && (
                <div className="mt-10 p-8 bg-stone-900 text-white rounded-[2rem] border-l-8 border-gold">
                  <h5 className="font-black uppercase tracking-widest text-[10px] text-gold mb-4">Investigação IA Profunda</h5>
                  <p className="text-lg italic font-serif leading-relaxed">{deepDive.modernApplication}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsModal;
