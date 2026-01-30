
import React, { useState, useEffect, useContext } from 'react';
import { Icons } from '../constants';
import { LearningTrack, TrackStep } from '../types';
import { tracksService } from '../services/tracksService';
import SacredImage from '../components/SacredImage';
import Progress from '../components/Progress';
import TrailCard from '../components/TrailCard';
import { LangContext } from '../App';
import { getUserModuleProgress, updateModuleProgress } from '../services/supabase';

interface TracksProps {
  onNavigateBible: (book: string, chapter: number) => void;
  onNavigateCIC: (para: number) => void;
  userId?: string;
}

const Tracks: React.FC<TracksProps> = ({ onNavigateBible, onNavigateCIC, userId }) => {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<LearningTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [userModuleCompletion, setUserModuleCompletion] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await tracksService.getAllTracks();
      setTracks(data);

      if (userId) {
        try {
          const progress = await getUserModuleProgress(userId);
          const completionMap: Record<string, boolean> = {};
          progress.forEach((p: any) => {
            completionMap[p.module_id.toString()] = p.completed;
          });
          setUserModuleCompletion(completionMap);
        } catch (e) {
          console.warn("Falha ao carregar progresso do usuário:", e);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [userId]);

  const handleStepAction = (step: TrackStep) => {
    if (step.type === 'biblia') {
       const parts = step.ref.split(' ');
       const book = parts.slice(0, -1).join(' ');
       const chapterStr = parts[parts.length - 1].split(':')[0];
       const chapter = parseInt(chapterStr);
       if (book && !isNaN(chapter)) onNavigateBible(book, chapter);
    } else if (step.type === 'cic') {
       const para = parseInt(step.ref);
       if (!isNaN(para)) onNavigateCIC(para);
    }
  };

  const toggleModuleCompletion = async (moduleId: string) => {
    if (!userId) return;
    const isCompleted = !userModuleCompletion[moduleId];
    
    // UI Update otimista
    setUserModuleCompletion(prev => ({ ...prev, [moduleId]: isCompleted }));

    try {
      await updateModuleProgress(userId, parseInt(moduleId), isCompleted);
    } catch (e) {
      console.error("Erro ao salvar progresso:", e);
      // Reverter se falhar
      setUserModuleCompletion(prev => ({ ...prev, [moduleId]: !isCompleted }));
    }
  };

  const calculateTrackProgress = (track: LearningTrack) => {
    const totalModules = track.modules.length;
    if (totalModules === 0) return 0;
    const completedModules = track.modules.filter(m => userModuleCompletion[m.id]).length;
    return Math.round((completedModules / totalModules) * 100);
  };

  if (selectedTrack) {
    const trackProgress = calculateTrackProgress(selectedTrack);
    return (
      <div className="max-w-5xl mx-auto space-y-12 pb-48 animate-in fade-in duration-500">
        <button 
          onClick={() => setSelectedTrack(null)}
          className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-gold transition-colors"
        >
          <Icons.ArrowDown className="w-4 h-4 rotate-90" /> Voltar às Trilhas
        </button>

        <header className="relative h-80 rounded-[4rem] overflow-hidden shadow-2xl group">
           <SacredImage src={selectedTrack.image || ""} alt={selectedTrack.title} className="w-full h-full" priority={true} />
           <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/40 to-transparent" />
           <div className="absolute bottom-10 left-10 right-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                 <span className="px-4 py-1 bg-gold text-stone-900 rounded-full text-[9px] font-black uppercase tracking-widest">{selectedTrack.level}</span>
                 <h2 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight">{selectedTrack.title}</h2>
              </div>
              <div className="w-full md:w-64 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                 <Progress percent={trackProgress} label="Sua Jornada" />
              </div>
           </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-12">
           <div className="lg:col-span-8 space-y-10">
              {selectedTrack.modules.map((module, mIdx) => {
                const isModuleCompleted = userModuleCompletion[module.id];
                return (
                  <section key={module.id} className="space-y-6 animate-in slide-in-from-bottom-6" style={{ animationDelay: `${mIdx * 100}ms` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-serif text-2xl font-bold shadow-lg transition-colors ${isModuleCompleted ? 'bg-emerald-500 text-white' : 'bg-stone-900 text-gold'}`}>
                          {isModuleCompleted ? <Icons.Star className="w-6 h-6 fill-current" /> : mIdx + 1}
                        </div>
                        <h3 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">{module.title}</h3>
                      </div>
                      
                      {userId && (
                        <button 
                          onClick={() => toggleModuleCompletion(module.id)}
                          className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isModuleCompleted ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-stone-100 text-stone-400 border border-stone-200 hover:border-gold hover:text-gold'}`}
                        >
                          {isModuleCompleted ? 'Concluído' : 'Marcar Concluído'}
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 ml-6 md:ml-18">
                        {module.content.map((step, sIdx) => (
                          <button 
                            key={sIdx}
                            onClick={() => handleStepAction(step)}
                            className={`w-full text-left p-6 bg-white dark:bg-stone-900 border rounded-3xl hover:border-gold hover:shadow-xl transition-all group flex items-center justify-between ${isModuleCompleted ? 'opacity-60 grayscale-[0.5]' : 'border-stone-100 dark:border-stone-800'}`}
                          >
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl text-sacred group-hover:text-gold transition-colors">
                                  {step.type === 'biblia' ? <Icons.Book className="w-5 h-5" /> : step.type === 'cic' ? <Icons.Cross className="w-5 h-5" /> : <Icons.Feather className="w-5 h-5" />}
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-0.5">{step.type} • {step.ref}</p>
                                  <h4 className="text-lg font-serif font-bold dark:text-stone-200">{step.label || 'Ver conteúdo'}</h4>
                                </div>
                            </div>
                            <Icons.ArrowDown className="w-5 h-5 -rotate-90 text-stone-200 group-hover:text-gold transition-transform group-hover:translate-x-1" />
                          </button>
                        ))}
                    </div>
                  </section>
                );
              })}
           </div>

           <aside className="lg:col-span-4 space-y-6">
              <div className="p-8 bg-[#fcf8e8] dark:bg-stone-900 rounded-[3rem] border border-gold/20 shadow-xl">
                 <h4 className="text-sm font-serif font-bold mb-4 flex items-center gap-3"><Icons.History className="w-4 h-4 text-gold" /> Objetivo da Trilha</h4>
                 <p className="text-stone-600 dark:text-stone-400 font-serif italic leading-relaxed text-lg">
                   {selectedTrack.description}
                 </p>
              </div>
              <div className="p-8 bg-stone-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
                 <Icons.Cross className="absolute -bottom-6 -right-6 w-32 h-32 opacity-[0.03]" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-gold mb-3">Symphonia Tutor</h4>
                 <p className="font-serif italic text-white/80">Esta trilha foi curada pela Symphonia IA para garantir uma formação doutrinária sólida e hierárquica.</p>
              </div>
           </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in duration-700 pb-48 pt-10">
      <header className="text-center space-y-4">
        <h2 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 dark:text-gold tracking-tighter">Trilhas Formativas</h2>
        <p className="text-stone-400 italic text-2xl font-serif">"Educa o jovem no caminho em que deve andar." — Provérbios 22:6</p>
      </header>

      {loading ? (
        <div className="py-24 text-center">
           <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-6" />
           <p className="text-xl font-serif italic text-stone-400">Mapeando caminhos de sabedoria...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {tracks.map(track => (
            <TrailCard 
              key={track.id} 
              track={track} 
              onClick={setSelectedTrack} 
            />
          ))}
        </div>
      )}
      
      <footer className="text-center opacity-30 pt-12">
        <Icons.Cross className="w-8 h-8 mx-auto" />
      </footer>
    </div>
  );
};

export default Tracks;
