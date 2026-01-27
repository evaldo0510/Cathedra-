
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
    biography: "O Poverello de Assis, que encontrou Deus na simplicidade e na pobreza radical. Sua vida foi um hino à Criação e ao seguimento de Cristo Crucificado.",
    image: "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800",
    quote: "Comece fazendo o que é necessário, depois o que é possível e, de repente, estará fazendo o impossível."
  },
  { 
    name: "Santo Agostinho", 
    feastDay: "28 de Agosto", 
    patronage: "Teólogos e impressores", 
    biography: "Bispo de Hipona e Doutor da Igreja. Sua conversão e seus escritos sobre a Graça definiram o pensamento teológico ocidental por séculos.",
    image: "https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=800",
    quote: "Fizeste-nos para Ti, Senhor, e inquieto está o nosso coração enquanto não repousar em Ti."
  },
  { 
    name: "Santa Teresinha do Menino Jesus", 
    feastDay: "1 de Outubro", 
    patronage: "Missões e Doutora da Igreja", 
    biography: "A Pequena Flor do Carmelo. Ensinou a 'Pequena Via' do amor, da confiança e do abandono total nas mãos misericordiosas do Pai.",
    image: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800",
    quote: "No coração da Igreja, minha Mãe, eu serei o Amor."
  },
  { 
    name: "São Bento de Núrsia", 
    feastDay: "11 de Julho", 
    patronage: "Europa e Monges", 
    biography: "Pai do monaquismo ocidental e autor da Santa Regra. Estabeleceu o equilíbrio entre o trabalho e a oração (Ora et Labora).",
    image: "https://images.unsplash.com/photo-1512403754473-27835f7b9984?q=80&w=800",
    quote: "Não anteponham nada ao amor de Cristo."
  },
  { 
    name: "Santo Tomás de Aquino", 
    feastDay: "28 de Janeiro", 
    patronage: "Estudantes e Teólogos", 
    biography: "O Doutor Angélico. Autor da Suma Teológica, reconciliou a fé com a razão e sistematizou a doutrina católica com rigor inigualável.",
    image: "https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=800",
    quote: "Tudo o que escrevi parece-me palha comparado ao que Deus me revelou."
  }
];

export const getNativeLiturgy = (date: string): DailyLiturgyContent => {
  // Simulador de lecionário local robusto para garantir gratificação instantânea
  const liturgias: Record<string, DailyLiturgyContent> = {
    "default": {
      date,
      collect: "Deus eterno e todo-poderoso, aumentai em nós a fé, a esperança e a caridade; e para que possamos merecer o que prometeis, fazei-nos amar o que ordenais.",
      firstReading: { 
        reference: "Efésios 2, 1-10", 
        text: "Irmãos, Deus, que é rico em misericórdia, pelo grande amor com que nos amou, deu-nos a vida juntamente com Cristo, quando estávamos mortos por causa de nossas faltas. É pela graça que fostes salvos!" 
      },
      psalm: { 
        title: "Salmo 99", 
        text: "Sabei que o Senhor é Deus, Ele nos fez, e a Ele pertencemos; somos o seu povo e as ovelhas de seu rebanho. Entrai por suas portas dando graças!" 
      },
      gospel: { 
        reference: "Lucas 12, 13-21", 
        text: "Naquele tempo, alguém do meio da multidão disse a Jesus: 'Mestre, dize ao meu irmão que reparta a herança comigo'. Jesus respondeu: 'Homem, quem me encarregou de julgar ou dividir vossos bens?' E disse-lhes: 'Atenção! Guardai-vos de todo tipo de ganância, pois mesmo que se tenha muita coisa, a vida não consiste na abundância de bens'.",
        reflection: "A verdadeira riqueza do homem não está no que ele acumula, mas no que ele é diante de Deus."
      }
    }
  };
  return liturgias[date] || liturgias["default"];
};

export const getDailyNativeContent = () => {
  const day = new Date().getDate();
  const month = new Date().getMonth();
  return {
    verse: NATIVE_DAILY_VERSES[(day + month) % NATIVE_DAILY_VERSES.length],
    saint: NATIVE_SAINTS[(day + month) % NATIVE_SAINTS.length]
  };
};
