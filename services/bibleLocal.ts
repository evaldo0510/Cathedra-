
import { Verse } from "../types";

export type BibleVersion = {
  id: string;
  name: string;
  description: string;
};

export const BIBLE_VERSIONS: BibleVersion[] = [
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

const SAMPLE_TEXTS = [
  "No princípio era o Verbo, e o Verbo estava com Deus.",
  "O Senhor é meu pastor, nada me faltará.",
  "Tudo posso naquele que me fortalece.",
  "Amarás o teu próximo como a ti mesmo.",
  "Buscai primeiro o Reino de Deus e sua justiça.",
  "A graça de Nosso Senhor Jesus Cristo esteja convosco.",
  "Fazei tudo o que Ele vos disser.",
  "Eis que faço novas todas as coisas.",
  "O Verbo se fez carne e habitou entre nós.",
  "Deus é amor, e quem permanece no amor permanece em Deus."
];

export const fetchLocalChapter = async (versionId: string, book: string, chapter: number): Promise<Verse[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Gerador de conteúdo dinâmico baseado no livro e versão para evitar conteúdo repetitivo
  return [...Array(12)].map((_, i) => {
    const seed = (book.length + chapter + i + versionId.length) % SAMPLE_TEXTS.length;
    const prefix = versionId === 'jerusalem' ? "[Jerusalém] " : versionId === 'ave_maria' ? "[AM] " : "";
    return {
      book,
      chapter,
      verse: i + 1,
      text: `${prefix}${SAMPLE_TEXTS[seed]} (Versículo de estudo ${i + 1})`
    };
  });
};
