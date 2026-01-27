
import { Saint, Verse } from "../types";

export const NATIVE_DAILY_VERSES: any[] = [
  { verse: "O Senhor é o meu pastor, nada me faltará.", reference: "Salmos 23:1", imageUrl: "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=1600" },
  { verse: "Eu sou o caminho, a verdade e a vida.", reference: "João 14:6", imageUrl: "https://images.unsplash.com/photo-1515606378517-3451a42adc42?q=80&w=1600" },
  { verse: "O Verbo se fez carne e habitou entre nós.", reference: "João 1:14", imageUrl: "https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=1600" },
  { verse: "Tudo posso naquele que me fortalece.", reference: "Filipenses 4:13", imageUrl: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=1600" }
];

export const NATIVE_SAINTS: Saint[] = [
  { 
    name: "São Francisco de Assis", 
    feastDay: "4 de Outubro", 
    patronage: "Ecologia e Animais", 
    biography: "Fundador da Ordem dos Frades Menores, viveu a pobreza evangélica radical.",
    image: "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800",
    quote: "Comece fazendo o que é necessário, depois o que é possível, e de repente você estará fazendo o impossível."
  },
  { 
    name: "Santa Teresinha do Menino Jesus", 
    feastDay: "1 de Outubro", 
    patronage: "Missões", 
    biography: "Doutora da Igreja, ensinou a 'Pequena Via' da confiança e do amor.",
    image: "https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=800",
    quote: "No coração da Igreja, minha Mãe, eu serei o amor."
  },
  { 
    name: "Santo Agostinho", 
    feastDay: "28 de Agosto", 
    patronage: "Teólogos", 
    biography: "Bispo de Hipona e um dos maiores pensadores da história cristã.",
    image: "https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=800",
    quote: "Fizeste-nos para Ti, Senhor, e o nosso coração está inquieto enquanto não repousar em Ti."
  }
];

export const getDailyNativeContent = () => {
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return {
    verse: NATIVE_DAILY_VERSES[dayOfYear % NATIVE_DAILY_VERSES.length],
    saint: NATIVE_SAINTS[dayOfYear % NATIVE_SAINTS.length]
  };
};
