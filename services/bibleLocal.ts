
import { Verse } from "../types";

export type BibleVersion = {
  id: string;
  slug: string; 
  name: string;
  lang: string;
  description: string;
  isLatin?: boolean;
  isCatholic?: boolean;
  isIA?: boolean;
};

export const BIBLE_VERSIONS: BibleVersion[] = [
  // ESTUDO EXEGÉTICO E ACADÊMICO (IA ASSISTED PARA PRECISÃO)
  { 
    id: 'jerusalem', 
    slug: 'ai_jerusalem', 
    name: 'B. de Jerusalém', 
    lang: 'pt', 
    description: 'Referência exegética mundial. Tradução baseada nos originais com rigor científico.', 
    isCatholic: true, 
    isIA: true 
  },
  { 
    id: 'teb', 
    slug: 'ai_teb', 
    name: 'TEB (Ecumênica)', 
    lang: 'pt', 
    description: 'Tradução Ecumênica da Bíblia. Famosa pela precisão técnica e notas teológicas profundas.', 
    isCatholic: true, 
    isIA: true 
  },
  { 
    id: 'peregrino', 
    slug: 'ai_peregrino', 
    name: 'B. do Peregrino', 
    lang: 'pt', 
    description: 'Tradução de Luis Alonso Schökel. Foco na beleza literária e poética dos textos originais.', 
    isCatholic: true, 
    isIA: true 
  },
  
  // PADRÕES LITÚRGICOS E POPULARES
  { 
    id: 'cnbb', 
    slug: 'ai_cnbb', 
    name: 'Bíblia da CNBB', 
    lang: 'pt', 
    description: 'Tradução oficial da Igreja no Brasil para a liturgia e sacramentos.', 
    isCatholic: true, 
    isIA: true 
  },
  { 
    id: 'ave_maria', 
    slug: 'ai_ave_maria', 
    name: 'Ave Maria', 
    lang: 'pt', 
    description: 'A versão mais popular entre os fiéis lusófonos desde 1959.', 
    isCatholic: true, 
    isIA: true 
  },
  
  // TRADIÇÃO LATINA E HISTÓRICA
  { 
    id: 'vulgata', 
    slug: 'clementine', 
    name: 'Vulgata Clementina', 
    lang: 'la', 
    description: 'Bíblia Sacra (Ed. 1592). O padrão latino histórico da Igreja Católica.', 
    isLatin: true, 
    isCatholic: true 
  },
  { 
    id: 'nvulgata', 
    slug: 'ai_nvulgata', 
    name: 'Nova Vulgata', 
    lang: 'la', 
    description: 'Edição típica oficial do Vaticano (promulgada por S. João Paulo II).', 
    isLatin: true, 
    isCatholic: true, 
    isIA: true 
  },
  
  // REFERÊNCIAS INTERNACIONAIS (API)
  { 
    id: 'drb', 
    slug: 'drb', 
    name: 'Douay-Rheims', 
    lang: 'en', 
    description: 'A tradicional Bíblia Católica de língua inglesa, baseada na Vulgata.', 
    isCatholic: true 
  },
  { 
    id: 'kjv', 
    slug: 'kjv', 
    name: 'King James', 
    lang: 'en', 
    description: 'Clássico da literatura inglesa (Authorized Version). Uso comparativo.', 
    isCatholic: false 
  }
];

export const LATIN_BOOK_NAMES: Record<string, string> = {
  "Gênesis": "Liber Genesis", "Êxodo": "Liber Exodus", "Levítico": "Liber Leviticus",
  "Números": "Liber Numeri", "Deuteronômio": "Liber Deuteronomii", "Josué": "Liber Iosue",
  "Juízes": "Liber Iudicum", "Rute": "Liber Ruth", "1 Samuel": "Liber Primus Samuelis",
  "2 Samuel": "Liber Secundus Samuelis", "1 Reis": "Liber Primus Regum", "2 Reis": "Liber Secundus Regum",
  "1 Crônicas": "Liber Primus Paralipomenon", "2 Crônicas": "Liber Secundus Paralipomenon",
  "Esdras": "Liber Esdrae", "Neemias": "Liber Nehemiae", "Tobias": "Liber Tobiae",
  "Judite": "Liber Iudith", "Ester": "Liber Esther", "1 Macabeus": "Liber Primus Machabaeorum",
  "2 Macabeus": "Liber Secundus Machabaeorum", "Jó": "Liber Iob", "Salmos": "Liber Psalmorum",
  "Provérbios": "Liber Proverbiorum", "Eclesiastes": "Liber Ecclesiastes", "Cântico dos Cânticos": "Canticum Canticorum",
  "Sabedoria": "Liber Sapientiae", "Eclesiástico": "Liber Ecclesiasticus", "Isaías": "Prophetia Isaiae",
  "Jeremias": "Prophetia Ieremiae", "Lamentações": "Lamentationes", "Baruc": "Prophetia Baruch",
  "Ezequiel": "Prophetia Ezechielis", "Daniel": "Prophetia Danielis", "Oseias": "Prophetia Osee",
  "Joel": "Prophetia Ioel", "Amós": "Prophetia Amos", "Abdias": "Prophetia Abdiae",
  "Jonas": "Prophetia Ionae", "Miqueias": "Prophetia Michaeae", "Naum": "Prophetia NAM",
  "Habacuc": "Prophetia Habacuc", "Sofonias": "Prophetia Sophoniae", "Ageu": "Prophetia Aggaei",
  "Zacarias": "Prophetia Zachariae", "Malaquias": "Prophetia Malachiae", "Mateus": "Evangelium secundum Matthaeum",
  "Marcos": "Evangelium secundum Marcum", "Lucas": "Evangelium secundum Lucam", "João": "Evangelium secundum Ioannem",
  "Atos dos Apóstolos": "Actus Apostolorum", "Romanos": "Epistula ad Romanos", "1 Coríntios": "Epistula ad Corinthios I",
  "2 Coríntios": "Epistula ad Corinthios II", "Gálatas": "Epistula ad Galatas", "Efésios": "Epistula ad Ephesios",
  "Filipenses": "Epistula ad Philippenses", "Colossenses": "Epistula ad Colossenses", "1 Tessalonicenses": "Epistula ad Thessalonicenses I",
  "2 Tessalonicenses": "Epistula ad Thessalonicenses II", "1 Timóteo": "Epistula ad Timotheum I",
  "2 Timóteo": "Epistula ad Timotheum II", "Tito": "Epistula ad Titum", "Filémon": "Epistula ad Philemonem",
  "Hebreus": "Epistula ad Hebraeos", "Tiago": "Epistula Iacobi", "1 Pedro": "Epistula Petri I",
  "2 Pedro": "Epistula Petri II", "1 João": "Epistula Ioannis I", "2 João": "Epistula Ioannis II",
  "3 João": "Epistula Ioannis III", "Judas": "Epistula Iudae", "Apocalipse": "Apocalypsis Ioannis"
};

export const DEUTEROCANONICAL_BOOKS = [
  "Tobias", "Judite", "1 Macabeus", "2 Macabeus", "Sabedoria", "Eclesiástico", "Baruc"
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
      "Epístolas": ["Romanos", "1 Coríntios", "2 Coríntios", "Gálatas", "Efésios", "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo", "2 Timóteo", "Tito", "Filémon", "Hebreus", "Tiago", "1 Pedro", "2 Pedro", "1 João", "2 João", "3 João", "Judas"],
      "Profético": ["Apocalipse"]
    }
  };
};

export const getChapterCount = (book: string): number => {
  const counts: Record<string, number> = { "Gênesis": 50, "Êxodo": 40, "Levítico": 27, "Números": 36, "Deuteronômio": 34, "Salmos": 150, "Isaías": 66, "Mateus": 28, "Apocalipse": 22 };
  return counts[book] || 20;
};

export const fetchLocalFallback = (book: string, chapter: number): Verse[] => {
  return [{ book, chapter, verse: 1, text: "Recuperando texto da Tradição..." }];
};
