
import { Saint, Verse, DailyLiturgyContent } from "../types";

export const NATIVE_DAILY_VERSES = [
  { verse: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.", reference: "João 1, 1", imageUrl: "https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=1600" },
  { verse: "O Senhor é o meu pastor, nada me faltará.", reference: "Salmo 22 (23), 1", imageUrl: "https://images.unsplash.com/photo-1512403754473-27835f7b9984?q=80&w=1600" }
];

export const NATIVE_SAINTS: Saint[] = [
  { 
    name: "Santo Agostinho", 
    feastDay: "28 de Agosto", 
    patronage: "Teólogos", 
    biography: "Bispo de Hipona e Doutor da Igreja. Sua jornada de conversão, descrita nas 'Confissões', é um farol para a inteligência da fé.",
    image: "https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=800",
    quote: "Fizeste-nos para Ti, Senhor, e inquieto está o nosso coração enquanto não repousar em Ti."
  }
];

export const getNativeLiturgy = (dateStr: string): DailyLiturgyContent => {
  return {
    date: dateStr,
    collect: "Deus eterno e todo-poderoso, guiai-nos em nossas ações para que possamos produzir frutos de boas obras.",
    firstReading: { 
      reference: "Filipenses 4, 4-9", 
      text: "Irmãos: Alegrai-vos sempre no Senhor; repito, alegrai-vos! Seja a vossa amabilidade conhecida de todos os homens. O Senhor está próximo. Não vos inquieteis com nada; mas apresentai a Deus todas as vossas necessidades pela oração e pela súplica, acompanhadas de ação de graças. E a paz de Deus, que sobrepassa todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus." 
    },
    psalm: { 
      title: "Salmo 22 (23)", 
      text: "O Senhor é o meu pastor: nada me faltará." 
    },
    gospel: { 
      reference: "João 15, 1-8", 
      text: "Eu sou a videira verdadeira, e Meu Pai é o agricultor. Todo ramo que em Mim não dá fruto, Ele o corta; e todo ramo que dá fruto, Ele o limpa, para que dê mais fruto ainda. Vós já estais limpos por causa da palavra que vos tenho falado. Permanecei em Mim, e Eu permanecerei em vós.",
      reflection: "A Palavra de hoje nos convida a permanecer em Cristo como os ramos na videira."
    }
  };
};

export const getDailyNativeContent = () => {
  const d = new Date();
  const day = d.getDate();
  const month = d.getMonth();
  const idx = (day + month) % NATIVE_SAINTS.length;
  return {
    verse: NATIVE_DAILY_VERSES[idx % NATIVE_DAILY_VERSES.length],
    saint: NATIVE_SAINTS[idx]
  };
};
