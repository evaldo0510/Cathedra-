
import { Verse } from "../types";

export type BibleVersion = {
  id: string;
  name: string;
  description: string;
  isPilgrim?: boolean;
};

export const BIBLE_VERSIONS: BibleVersion[] = [
  { id: 'pilgrim', name: 'Bíblia do Peregrino', description: 'Tradução de Luís Alonso Schökel. Foco na beleza literária e profundidade poética.', isPilgrim: true },
  { id: 'ave_maria', name: 'Ave Maria', description: 'Tradução católica clássica com linguagem devocional.' },
  { id: 'jerusalem', name: 'Bíblia de Jerusalém', description: 'Referência mundial em exegese e rigor acadêmico.' },
  { id: 'almeida', name: 'Almeida Revista', description: 'Tradução tradicional de grande valor literário.' }
];

export const getCatholicCanon = () => {
  return {
    "Antigo Testamento": {
      "Pentateuco": ["Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio"],
      "Históricos": ["Josué", "Juízes", "Rute", "1 Samuel", "2 Samuel", "1 Reis", "2 Reis", "1 Crônicas", "2 Crônicas", "Esdras", "Neemias", "Tobias", "Judite", "Ester", "1 Macabeus", "2 Macabeus"],
      "Sapienciais": ["Jó", "Salmos", "Provérbios", "Eclesiastes", "Cântico dos Cânticos", "Sabedoria", "Eclesiástico"],
      "Proféticos": ["Isaías", "Jeremias", "Lamentações", "Baruc", "Ezequiel", "Daniel", "Oseias", "Joel", "Amós", "Abdias", "Jonas", "Miqueias", "Naum", "Habacuc", "Sofonias", "Ageu", "Zacarias", "Malaquias"]
    },
    "Novo Testamento": {
      "Evangelhos": ["Mateus", "Marcos", "Lucas", "João"],
      "Atos": ["Atos dos Apóstolos"],
      "Epístolas Paulinas": ["Romanos", "1 Coríntios", "2 Coríntios", "Gálatas", "Efésios", "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo", "2 Timóteo", "Tito", "Filémon"],
      "Epístolas Universais": ["Hebreus", "Tiago", "1 Pedro", "2 Pedro", "1 João", "2 João", "3 João", "Judas"],
      "Profético": ["Apocalipse"]
    }
  };
};

const CHAPTER_COUNTS: Record<string, number> = {
  "Gênesis": 50, "Êxodo": 40, "Levítico": 27, "Números": 36, "Deuteronômio": 34,
  "Josué": 24, "Juízes": 21, "Rute": 4, "1 Samuel": 31, "2 Samuel": 24, "1 Reis": 22, "2 Reis": 25, "1 Crônicas": 29, "2 Crônicas": 36, "Esdras": 10, "Neemias": 13, "Tobias": 14, "Judite": 16, "Ester": 10, "1 Macabeus": 16, "2 Macabeus": 15,
  "Jó": 42, "Salmos": 150, "Provérbios": 31, "Eclesiastes": 12, "Cântico dos Cânticos": 8, "Sabedoria": 19, "Eclesiástico": 51,
  "Isaías": 66, "Jeremias": 52, "Lamentações": 5, "Baruc": 6, "Ezequiel": 48, "Daniel": 14, "Oseias": 14, "Joel": 3, "Amós": 9, "Abdias": 1, "Jonas": 4, "Miqueias": 7, "Naum": 3, "Habacuc": 3, "Sofonias": 3, "Ageu": 2, "Zacarias": 14, "Malaquias": 4,
  "Mateus": 28, "Marcos": 16, "Lucas": 24, "João": 21, "Atos dos Apóstolos": 28,
  "Romanos": 16, "1 Coríntios": 16, "2 Coríntios": 13, "Gálatas": 6, "Efésios": 6, "Filipenses": 4, "Colossenses": 4, "1 Tessalonicenses": 5, "2 Tessalonicenses": 3, "1 Timóteo": 6, "2 Timóteo": 4, "Tito": 3, "Filémon": 1,
  "Hebreus": 13, "Tiago": 5, "1 Pedro": 5, "2 Pedro": 3, "1 João": 5, "2 João": 1, "3 João": 1, "Judas": 1, "Apocalipse": 22
};

export const getChapterCount = (book: string): number => {
  return CHAPTER_COUNTS[book] || 50;
};

const BIBLE_TEXTS_POOL = [
  "No princípio era o Verbo, e o Verbo estava junto de Deus e o Verbo era Deus. Ele estava no princípio junto de Deus. Tudo foi feito por meio dele, e sem ele nada se fez de tudo o que foi feito.",
  "O Senhor é meu pastor, nada me faltará. Em verdes pastagens me faz repousar, para as águas tranquilas me conduz. Restaura minhas forças e guia-me por caminhos retos por amor do seu nome.",
  "Ainda que eu falasse as línguas dos homens e dos anjos, se não tivesse caridade, sou como o bronze que soa ou o címbalo que retine. E ainda que tivesse o dom da profecia e conhecesse todos os mistérios.",
  "Tudo posso naquele que me fortalece. Pois Deus é quem produz em vós tanto o querer como o realizar, segundo a sua boa vontade. Fazei todas as coisas sem murmurações nem contendas.",
  "Buscai em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas vos serão dadas por acréscimo. Portanto, não vos inquieteis com o dia de amanhã, pois o amanhã trará os seus cuidados.",
  "Porque Deus amou tanto o mundo que deu o seu Filho Unigênito, para que todo o que nele crer não pereça, mas tenha a vida eterna. Pois Deus não enviou o seu Filho ao mundo para condenar o mundo.",
  "Fazei tudo o que ele vos disser. Ora, havia ali seis talhas de pedra, para a purificação dos judeus, cada uma das quais levava duas ou três metretas. Disse-lhes Jesus: Enchei de água as talhas.",
  "Eis que faço novas todas as coisas. E disse: Escreve, porque estas palavras são fiéis e verdadeiras. Disse-me ainda: Está feito! Eu sou o Alfa e o Ômega, o Princípio e o Fim.",
  "E o Verbo se fez carne e habitou entre nós, e vimos a sua glória, glória como de Unigênito do Pai, cheio de graça e de verdade. João dá testemunho dele e exclama: Este era aquele de quem eu disse.",
  "Deus é amor, e quem permanece no amor permanece em Deus e Deus nele. Nisto a caridade é perfeita em nós: para que tenhamos confiança no dia do julgamento; pois como ele é, assim somos nós neste mundo."
];

export const fetchLocalChapter = async (versionId: string, book: string, chapter: number): Promise<Verse[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [...Array(15)].map((_, i) => {
    const seed = (book.length + chapter + i + versionId.length) % BIBLE_TEXTS_POOL.length;
    return {
      book,
      chapter,
      verse: i + 1,
      text: BIBLE_TEXTS_POOL[seed]
    };
  });
};
