import { Saint, Verse, DailyLiturgyContent } from "../types";

// Versículos curados para o Tempo Comum - Ano B (2024)
export const NATIVE_DAILY_VERSES = [
  { verse: "Em verdade, em verdade vos digo: se o grão de trigo que cai na terra não morre, ele fica só. Mas, se morre, produz muito fruto.", reference: "João 12, 24", imageUrl: "https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=1600" },
  { verse: "O Senhor é o meu pastor, nada me faltará.", reference: "Salmo 22 (23), 1", imageUrl: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=1600" },
  { verse: "Eu sou a videira, vós sois os ramos. Quem permanece em mim e eu nele, esse dá muito fruto.", reference: "João 15, 5", imageUrl: "https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=1600" }
];

export const NATIVE_SAINTS: Saint[] = [
  { 
    name: "Santo Agostinho", 
    feastDay: "28 de Agosto", 
    patronage: "Teólogos e Eruditos", 
    biography: "Doutor da Graça, cujas Confissões moldaram o pensamento cristão ocidental. Defensor da fé contra as heresias do seu tempo.",
    image: "https://images.unsplash.com/photo-1541339907198-e08759df9a73?q=80&w=800",
    quote: "Fizeste-nos para Ti, Senhor, e inquieto está o nosso coração enquanto não repousar em Ti."
  }
];

export const getNativeLiturgy = (dateStr: string): DailyLiturgyContent => {
  // Sincronizado com Ciclo II / Ano B (2024)
  return {
    date: dateStr,
    collect: "Deus eterno e todo-poderoso, aumentai em nós a fé, a esperança e a caridade, e dai-nos amar o que ordenais para conseguirmos o que prometeis.",
    firstReading: { 
      reference: "Tg 2, 14-24.26", 
      text: "Meus irmãos, que aproveita se alguém disser que tem fé, e não tiver as obras? Porventura a fé pode salvá-lo? Assim também a fé, se não tiver as obras, é morta em si mesma. Como o corpo sem o espírito é morto, assim também a fé sem as obras é morta." 
    },
    psalm: { 
      title: "Salmo 111 (112)", 
      text: "Feliz o homem que respeita o Senhor e ama com carinho a sua lei." 
    },
    gospel: { 
      reference: "Mc 8, 34–9, 1", 
      text: "Quem quiser salvar a sua vida, perdê-la-á; mas quem perder a sua vida por causa de mim e do Evangelho, salvá-la-á. De que aproveita ao homem ganhar o mundo inteiro se perder a sua alma?" ,
      reflection: "A radicalidade do seguimento de Cristo exige a entrega total da vontade e a aceitação da cruz cotidiana."
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