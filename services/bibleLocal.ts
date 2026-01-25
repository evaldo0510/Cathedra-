
import { Verse } from "../types";

export type Book = {
  id: number;
  name: string;
  chapters: number;
  testament: "AT" | "NT";
  category: string;
};

export type BibleVersion = {
  id: string;
  slug: string; 
  name: string;
  lang: string;
  description: string;
  isCatholic: boolean;
};

export const BIBLE_VERSIONS: BibleVersion[] = [
  { id: 'ave_maria', slug: 'ave_maria', name: 'Ave Maria', lang: 'pt', description: 'Tradução católica clássica e piedosa.', isCatholic: true },
  { id: 'vulgata', slug: 'clementine', name: 'Vulgata Clementina', lang: 'la', description: 'Bíblia Sacra (Ed. 1592). Padrão latino.', isCatholic: true },
];

export const CATHOLIC_BIBLE_BOOKS: Book[] = [
  // PENTATEUCO
  { id: 1, name: "Gênesis", chapters: 50, testament: "AT", category: "Pentateuco" },
  { id: 2, name: "Êxodo", chapters: 40, testament: "AT", category: "Pentateuco" },
  { id: 3, name: "Levítico", chapters: 27, testament: "AT", category: "Pentateuco" },
  { id: 4, name: "Números", chapters: 36, testament: "AT", category: "Pentateuco" },
  { id: 5, name: "Deuteronômio", chapters: 34, testament: "AT", category: "Pentateuco" },
  // HISTÓRICOS
  { id: 6, name: "Josué", chapters: 24, testament: "AT", category: "Históricos" },
  { id: 7, name: "Juízes", chapters: 21, testament: "AT", category: "Históricos" },
  { id: 8, name: "Rute", chapters: 4, testament: "AT", category: "Históricos" },
  { id: 9, name: "1 Samuel", chapters: 31, testament: "AT", category: "Históricos" },
  { id: 10, name: "2 Samuel", chapters: 24, testament: "AT", category: "Históricos" },
  { id: 11, name: "1 Reis", chapters: 22, testament: "AT", category: "Históricos" },
  { id: 12, name: "2 Reis", chapters: 25, testament: "AT", category: "Históricos" },
  { id: 13, name: "1 Crônicas", chapters: 29, testament: "AT", category: "Históricos" },
  { id: 14, name: "2 Crônicas", chapters: 36, testament: "AT", category: "Históricos" },
  { id: 15, name: "Esdras", chapters: 10, testament: "AT", category: "Históricos" },
  { id: 16, name: "Neemias", chapters: 13, testament: "AT", category: "Históricos" },
  { id: 17, name: "Tobias", chapters: 14, testament: "AT", category: "Históricos" },
  { id: 18, name: "Judite", chapters: 16, testament: "AT", category: "Históricos" },
  { id: 19, name: "Ester", chapters: 10, testament: "AT", category: "Históricos" },
  { id: 20, name: "1 Macabeus", chapters: 16, testament: "AT", category: "Históricos" },
  { id: 21, name: "2 Macabeus", chapters: 15, testament: "AT", category: "Históricos" },
  // POÉTICOS E SAPIENCIAIS
  { id: 22, name: "Jó", chapters: 42, testament: "AT", category: "Sapienciais" },
  { id: 23, name: "Salmos", chapters: 150, testament: "AT", category: "Sapienciais" },
  { id: 24, name: "Provérbios", chapters: 31, testament: "AT", category: "Sapienciais" },
  { id: 25, name: "Eclesiastes", chapters: 12, testament: "AT", category: "Sapienciais" },
  { id: 26, name: "Cântico dos Cânticos", chapters: 8, testament: "AT", category: "Sapienciais" },
  { id: 27, name: "Sabedoria", chapters: 19, testament: "AT", category: "Sapienciais" },
  { id: 28, name: "Eclesiástico", chapters: 51, testament: "AT", category: "Sapienciais" },
  // PROFETAS MAIORES
  { id: 29, name: "Isaías", chapters: 66, testament: "AT", category: "Profetas" },
  { id: 30, name: "Jeremias", chapters: 52, testament: "AT", category: "Profetas" },
  { id: 31, name: "Lamentações", chapters: 5, testament: "AT", category: "Profetas" },
  { id: 32, name: "Baruc", chapters: 6, testament: "AT", category: "Profetas" },
  { id: 33, name: "Ezequiel", chapters: 48, testament: "AT", category: "Profetas" },
  { id: 34, name: "Daniel", chapters: 14, testament: "AT", category: "Profetas" },
  // PROFETAS MENORES
  { id: 35, name: "Oseias", chapters: 14, testament: "AT", category: "Profetas Menores" },
  { id: 36, name: "Joel", chapters: 4, testament: "AT", category: "Profetas Menores" },
  { id: 37, name: "Amós", chapters: 9, testament: "AT", category: "Profetas Menores" },
  { id: 38, name: "Abdias", chapters: 1, testament: "AT", category: "Profetas Menores" },
  { id: 39, name: "Jonas", chapters: 4, testament: "AT", category: "Profetas Menores" },
  { id: 40, name: "Miqueias", chapters: 7, testament: "AT", category: "Profetas Menores" },
  { id: 41, name: "Naum", chapters: 3, testament: "AT", category: "Profetas Menores" },
  { id: 42, name: "Habacuc", chapters: 3, testament: "AT", category: "Profetas Menores" },
  { id: 43, name: "Sofonias", chapters: 3, testament: "AT", category: "Profetas Menores" },
  { id: 44, name: "Ageu", chapters: 2, testament: "AT", category: "Profetas Menores" },
  { id: 45, name: "Zacarias", chapters: 14, testament: "AT", category: "Profetas Menores" },
  { id: 46, name: "Malaquias", chapters: 4, testament: "AT", category: "Profetas Menores" },
  // EVANGELHOS
  { id: 47, name: "Mateus", chapters: 28, testament: "NT", category: "Evangelhos" },
  { id: 48, name: "Marcos", chapters: 16, testament: "NT", category: "Evangelhos" },
  { id: 49, name: "Lucas", chapters: 24, testament: "NT", category: "Evangelhos" },
  { id: 50, name: "João", chapters: 21, testament: "NT", category: "Evangelhos" },
  // ATOS
  { id: 51, name: "Atos dos Apóstolos", chapters: 28, testament: "NT", category: "Histórico NT" },
  // EPÍSTOLAS PAULINAS
  { id: 52, name: "Romanos", chapters: 16, testament: "NT", category: "Cartas de S. Paulo" },
  { id: 53, name: "1 Coríntios", chapters: 16, testament: "NT", category: "Cartas de S. Paulo" },
  { id: 54, name: "2 Coríntios", chapters: 13, testament: "NT", category: "Cartas de S. Paulo" },
  { id: 55, name: "Gálatas", chapters: 6, testament: "NT", category: "Cartas de S. Paulo" },
  { id: 56, name: "Efésios", chapters: 6, testament: "NT", category: "Cartas de S. Paulo" },
  { id: 57, name: "Filipenses", chapters: 4, testament: "NT", category: "Cartas de S. Paulo" },
  { id: 58, name: "Colossenses", chapters: 4, testament: "NT", category: "Cartas de S. Paulo" },
  { id: 59, name: "1 Tessalonicenses", chapters: 5, testament: "NT", category: "Cartas de S. Paulo" },
  { id: 60, name: "2 Tessalonicenses", chapters: 3, testament: "NT", category: "Cartas de S. Paulo" },
  { id: 61, name: "1 Timóteo", chapters: 6, testament: "NT", category: "Cartas de S. Paulo" },
  { id: 62, name: "2 Timóteo", chapters: 4, testament: "NT", category: "Cartas de S. Paulo" },
  { id: 63, name: "Tito", chapters: 3, testament: "NT", category: "Cartas de S. Paulo" },
  { id: 64, name: "Filêmon", chapters: 1, testament: "NT", category: "Cartas de S. Paulo" },
  { id: 65, name: "Hebreus", chapters: 13, testament: "NT", category: "Cartas de S. Paulo" },
  // EPÍSTOLAS CATÓLICAS
  { id: 66, name: "Tiago", chapters: 5, testament: "NT", category: "Cartas Católicas" },
  { id: 67, name: "1 Pedro", chapters: 5, testament: "NT", category: "Cartas Católicas" },
  { id: 68, name: "2 Pedro", chapters: 3, testament: "NT", category: "Cartas Católicas" },
  { id: 69, name: "1 João", chapters: 5, testament: "NT", category: "Cartas Católicas" },
  { id: 70, name: "2 João", chapters: 1, testament: "NT", category: "Cartas Católicas" },
  { id: 71, name: "3 João", chapters: 1, testament: "NT", category: "Cartas Católicas" },
  { id: 72, name: "Judas", chapters: 1, testament: "NT", category: "Cartas Católicas" },
  // APOCALIPSE
  { id: 73, name: "Apocalipse", chapters: 22, testament: "NT", category: "Profecia" }
];

// Added DEUTEROCANONICAL_BOOKS export to fix bibleApi.ts import error
export const DEUTEROCANONICAL_BOOKS = [
  "Tobias",
  "Judite",
  "Sabedoria",
  "Eclesiástico",
  "Baruc",
  "1 Macabeus",
  "2 Macabeus"
];

export const getCatholicCanon = () => {
  const canon: any = { "Antigo Testamento": {}, "Novo Testamento": {} };
  CATHOLIC_BIBLE_BOOKS.forEach(b => {
    const test = b.testament === "AT" ? "Antigo Testamento" : "Novo Testamento";
    if (!canon[test][b.category]) canon[test][b.category] = [];
    canon[test][b.category].push(b.name);
  });
  return canon;
};

export const getBibleBooks = () => CATHOLIC_BIBLE_BOOKS;

export const getChapterCount = (bookName: string): number => {
  const book = CATHOLIC_BIBLE_BOOKS.find(b => b.name === bookName);
  return book ? book.chapters : 1;
};

// Exemplos estáticos para gratificação instantânea nos livros mais lidos
export const BIBLE_VERSES_STATIC: Record<string, Record<string, string[]>> = {
  "Gênesis": {
    "1": [
      "No princípio, criou Deus os céus e a terra.",
      "A terra era sem forma e vazia; havia trevas sobre a face do abismo, e o Espírito de Deus pairava sobre as águas.",
      "Disse Deus: Haja luz; e houve luz.",
      "Viu Deus que a luz era boa; e fez separação entre a luz e as trevas.",
      "Chamou Deus à luz dia, e às trevas noite. Houve entardecer e madrugada: foi o primeiro dia."
    ]
  },
  "Salmos": {
    "23": [
      "O Senhor é o meu pastor, nada me faltará.",
      "Em verdes pastagens me faz repousar e conduz-me a águas tranquilas.",
      "Restaura-me as forças e guia-me por caminhos retos, por amor do seu nome.",
      "Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo."
    ]
  },
  "João": {
    "1": [
      "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.",
      "Ele estava no princípio com Deus.",
      "Todas as coisas foram feitas por intermédio dele; e sem ele, nada do que foi feito se fez.",
      "Nela estava a vida, e a vida era a luz dos homens.",
      "A luz resplandece nas trevas, e as trevas não prevaleceram contra ela."
    ]
  }
};

export const getBibleVersesLocal = (book: string, chapter: number): Verse[] => {
  const content = BIBLE_VERSES_STATIC[book]?.[String(chapter)];
  if (content) {
    return content.map((text, i) => ({ book, chapter, verse: i + 1, text }));
  }
  return [];
};
