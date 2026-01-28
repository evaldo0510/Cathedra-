
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';

interface VoicePlayerProps {
  text: string;
  className?: string;
}

const VoicePlayer: React.FC<VoicePlayerProps> = ({ text, className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    setSynth(window.speechSynthesis);
    return () => window.speechSynthesis.cancel();
  }, []);

  const speak = () => {
    if (!synth) return;

    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
      return;
    }

    // Limpar o texto de referências técnicas e colchetes para uma leitura fluida
    const cleanText = text.replace(/\[.*?\]/g, '').replace(/§/g, 'parágrafo');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Tenta encontrar uma voz bonita em Português
    const voices = synth.getVoices();
    const premiumVoice = voices.find(v => 
      (v.name.includes('Google') || v.name.includes('Neural') || v.name.includes('Microsoft Maria')) && 
      v.lang.startsWith('pt')
    ) || voices.find(v => v.lang.startsWith('pt'));

    if (premiumVoice) utterance.voice = premiumVoice;
    
    utterance.rate = 0.95; // Velocidade levemente reduzida para tom meditativo
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    synth.speak(utterance);
  };

  return (
    <button 
      onClick={speak}
      className={`p-3 rounded-2xl transition-all flex items-center justify-center ${isPlaying ? 'bg-gold text-stone-900 shadow-lg scale-110' : 'text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'} ${className}`}
      title={isPlaying ? "Parar Leitura" : "Ouvir Texto"}
    >
      {isPlaying ? (
        <Icons.Stop className="w-5 h-5 animate-pulse" />
      ) : (
        <Icons.Audio className="w-5 h-5" />
      )}
    </button>
  );
};

export default VoicePlayer;
