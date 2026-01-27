
import { Saint, Verse, DailyLiturgyContent } from "../types";

export const NATIVE_DAILY_VERSES = [
  { verse: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.", reference: "João 1:1", imageUrl: "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=1600" },
  { verse: "O Senhor é o meu pastor, nada me faltará.", reference: "Salmos 23:1", imageUrl: "https://images.unsplash.com/photo-1515606378517-3451a42adc42?q=80&w=1600" },
  { verse: "Eu sou o caminho, a verdade e a vida.", reference: "João 14:6", imageUrl: "https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=1600" }
];

export const NATIVE_SAINTS: Saint[] = [
  { 
    name: "São Francisco de Assis", 
    feastDay: "4 de Outubro", 
    patronage: "Ecologia", 
    biography: "O Poverello de Assis, que encontrou Deus na simplicidade e na criação.",
    image: "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800",
    quote: "Comece fazendo o que é necessário, depois o que é possível."
  },
  { 
    name: "Santo Agostinho", 
    feastDay: "28 de Agosto", 
    patronage: "Teólogos", 
    biography: "Doutor da Graça, autor das Confissões e da Cidade de Deus.",
    image: "https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=800",
    quote: "Fizeste-nos para Ti, Senhor, e inquieto está o nosso coração."
  }
];

// Fallback nativo para liturgia caso a IA ou API externa falhe
export const getNativeLiturgy = (date: string): DailyLiturgyContent => {
  return {
    date,
    collect: "Deus eterno e todo-poderoso, que governais o céu e a terra...",
    firstReading: { reference: "Gênesis 1, 1-5", text: "No princípio, Deus criou o céu e a terra..." },
    psalm: { title: "Salmo 22", text: "O Senhor é meu pastor..." },
    gospel: { 
      reference: "João 1, 1-18", 
      text: "No princípio era o Verbo...",
      reflection: "Medite hoje sobre a encarnação do Verbo em sua vida."
    }
  };
};

export const getDailyNativeContent = () => {
  const day = new Date().getDate();
  return {
    verse: NATIVE_DAILY_VERSES[day % NATIVE_DAILY_VERSES.length],
    saint: NATIVE_SAINTS[day % NATIVE_SAINTS.length]
  };
};
