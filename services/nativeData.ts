
import { Saint, Verse, DailyLiturgyContent } from "../types";

// Versículos curados para o Ano A - Foco em São Mateus
export const NATIVE_DAILY_VERSES = [
  { verse: "Vós sois o sal da terra; vós sois a luz do mundo. Não se pode esconder uma cidade edificada sobre um monte.", reference: "Mateus 5, 13-14", imageUrl: "https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=1600" },
  { verse: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", reference: "Mateus 11, 28", imageUrl: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=1600" },
  { verse: "Buscai primeiro o Reino de Deus e a sua justiça, e todas estas coisas vos serão acrescentadas.", reference: "Mateus 6, 33", imageUrl: "https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=1600" }
];

export const NATIVE_SAINTS: Saint[] = [
  { 
    name: "São Mateus", 
    feastDay: "21 de Setembro", 
    patronage: "Contabilistas e Alfandegários", 
    biography: "Apóstolo e Evangelista, deixou a coletoria de impostos para seguir o Mestre e registrar as Suas palavras.",
    image: "https://images.unsplash.com/photo-1541339907198-e08759df9a73?q=80&w=800",
    quote: "Ide, pois, e ensinai a todas as nações, batizando-as em nome do Pai, e do Filho, e do Espírito Santo."
  }
];

export const getNativeLiturgy = (dateStr: string): DailyLiturgyContent => {
  // Sincronizado com Ciclo I / Ano A
  return {
    date: dateStr,
    collect: "Deus de poder e misericórdia, afastai de nós todo obstáculo, para que, inteiramente vossos, possamos cumprir vossa vontade.",
    firstReading: { 
      reference: "Ex 19, 2-6a", 
      text: "Naqueles dias, os filhos de Israel chegaram ao deserto do Sinai. Moisés subiu ao encontro de Deus e o Senhor o chamou do alto do monte, dizendo: 'Vós vistes o que eu fiz aos egípcios. Se ouvirdes a minha voz, sereis minha propriedade exclusiva'." 
    },
    psalm: { 
      title: "Salmo 99 (100)", 
      text: "Nós somos o seu povo e as ovelhas do seu rebanho." 
    },
    gospel: { 
      reference: "Mt 9, 36 – 10, 8", 
      text: "Jesus, vendo as multidões, compadeceu-se delas, porque estavam cansadas e abatidas como ovelhas sem pastor. Então disse aos discípulos: 'A colheita é grande, mas os trabalhadores são poucos. Pedi ao dono da colheita que envie trabalhadores'." ,
      reflection: "O Reino de Deus se aproxima por meio da compaixão e do envio missionário."
    }
  };
};

export const getDailyNativeContent = () => {
  const d = new Date();
  const day = d.getDate();
  const month = d.getMonth();
  const idx = (day + month) % NATIVE_SAINTS.length;
  return {
    verse: NATIVE_DAILY_VERSES[day % NATIVE_DAILY_VERSES.length],
    saint: NATIVE_SAINTS[idx]
  };
};
