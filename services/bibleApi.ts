
import { Verse } from "../types";
import { DEUTEROCANONICAL_BOOKS } from "./bibleLocal";

const BASE_URL = "https://bible-api.com";

const BOOK_MAP: Record<string, string> = {
  "Gênesis": "GEN", "Êxodo": "EXO", "Levítico": "LEV", "Números": "NUM", "Deuteronômio": "DEU",
  "Josué": "JOS", "Juízes": "JDG", "Rute": "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA",
  "1 Reis": "1KI", "2 Reis": "2KI", "1 Crônicas": "1CH", "2 Crônicas": "2CH",
  "Esdras": "EZR", "Neemias": "NEH", "Tobias": "TOB", "Judite": "JDT", "Ester": "EST",
  "1 Macabeus": "1MA", "2 Macabeus": "2MA", "Jó": "JOB", "Salmos": "PSA", "Provérbios": "PRO",
  "Eclesiastes": "ECC", "Cântico dos Cânticos": "SNG", "Sabedoria": "WIS", "Eclesiástico": "SIR",
  "Isaías": "ISA", "Jeremias": "JER", "Lamentações": "LAM", "Baruc": "BAR", "Ezequiel": "EZK",
  "Daniel": "DAN", "Oseias": "HOS", "Joel": "JOL", "Amós": "AMO", "Abdias": "OBA",
  "Jonas": "JON", "Miqueias": "MIC", "Naum": "NAM", "Habacuc": "HAB", "Sofonias": "ZEP",
  "Ageu": "HAG", "Zacarias": "ZEC", "Malaquias": "MAL",
  "Mateus": "MAT", "Marcos": "MRK", "Lucas": "LUK", "João": "JHN", "Atos dos Apóstolos": "ACT",
  "Romanos": "ROM", "1 Coríntios": "1CO", "2 Coríntios": "2CO", "Gálatas": "GAL",
  "Efésios": "EPH", "Filipenses": "PHP", "Colossenses": "COL", "1 Tessalonicenses": "1TH",
  "2 Tessalonicenses": "2TH", "1 Timóteo": "1TI", "2 Timóteo": "2TI", "Tito": "TIT",
  "Filêmon": "PHM", "Hebreus": "HEB", "Tiago": "JAS", "1 Pedro": "1PE", "2 Pedro": "2PE",
  "1 João": "1JN", "2 João": "2JN", "3 João": "3JN", "Judas": "JUD", "Apocalipse": "REV"
};

export const fetchExternalBibleText = async (book: string, chapter: number, versionSlug: string = 'almeida'): Promise<Verse[] | null> => {
  const slug = BOOK_MAP[book] || book;
  
  // O endpoint da bible-api.com usa o formato: /book+chapter?translation=slug
  // Para português, usaremos 'almeida' como padrão estável na API.
  const url = `${BASE_URL}/${slug}+${chapter}?translation=${versionSlug}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
        // Tenta um fallback sem tradução específica se falhar
        const fallbackRes = await fetch(`${BASE_URL}/${slug}+${chapter}`);
        if (!fallbackRes.ok) return null;
        const fallbackData = await fallbackRes.json();
        return mapApiToVerses(book, fallbackData);
    }
    const data = await response.json();
    return mapApiToVerses(book, data);
  } catch (e) {
    console.error("Erro na busca API Scriptura:", e);
    return null;
  }
};

const mapApiToVerses = (book: string, data: any): Verse[] => {
    if (data.verses && Array.isArray(data.verses)) {
        return data.verses.map((v: any) => ({
          book: book,
          chapter: v.chapter,
          verse: v.verse,
          text: v.text.trim()
        }));
      }
      return [];
};
