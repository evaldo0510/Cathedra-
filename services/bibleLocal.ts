
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

// Simulação de carregamento de capítulo do JSON estruturado (damarals/pepaulo)
export const fetchLocalChapter = async (versionId: string, book: string, chapter: number): Promise<Verse[]> => {
  // Simulando latência de carregamento local
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Em um cenário real, aqui seria o fetch do JSON correspondente
  // Ex: const data = await fetch(`/biblias/${versionId}/${book}/${chapter}.json`);
  
  // Mock de dados para demonstração do layout
  return [
    { book, chapter, verse: 1, text: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus." },
    { book, chapter, verse: 2, text: "Ele estava no princípio com Deus." },
    { book, chapter, verse: 3, text: "Todas as coisas foram feitas por intermédio dele, e, sem ele, nada do que foi feito se fez." },
    { book, chapter, verse: 4, text: "A vida estava nele e a vida era a luz dos homens." },
    { book, chapter, verse: 5, text: "A luz resplandece nas trevas, e as trevas não prevaleceram contra ela." }
  ];
};
