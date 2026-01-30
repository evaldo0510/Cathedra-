
import { offlineStorage } from './offlineStorage';
import { CATHOLIC_BIBLE_BOOKS } from './bibleLocal';
import { fetchBibleChapter } from './gemini';
import { Verse } from '../types';

const GITHUB_BIBLE_RAW = 'https://raw.githubusercontent.com/evaldo0510/cathedra-data/main/biblia';

export const bibleService = {
  async getBooks() {
    return CATHOLIC_BIBLE_BOOKS;
  },

  normalizeBookName(name: string): string {
    return name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace('1-', '1')
      .replace('2-', '2');
  },

  /**
   * Estratégia High-Speed: Cache First -> GitHub Raw -> Fallback IA
   */
  async getVerses(bookName: string, chapter: number): Promise<Verse[]> {
    // 1. Instantâneo: IndexedDB
    let data = await offlineStorage.getBibleVerses(bookName, chapter);
    if (data && data.length > 0) return data;

    // 2. Rápido: GitHub JSON
    try {
      const fileName = this.normalizeBookName(bookName);
      const response = await fetch(`${GITHUB_BIBLE_RAW}/${fileName}.json`, {
        cache: 'force-cache'
      });
      
      if (response.ok) {
        const bookData = await response.json();
        const chapterData = bookData.capitulos[chapter - 1];
        
        if (chapterData?.versiculos) {
          const mapped: Verse[] = chapterData.versiculos.map((v: any) => ({
            book: bookName,
            chapter: chapter,
            verse: v.n,
            text: v.t
          }));
          await offlineStorage.saveBibleVerses(bookName, chapter, mapped);
          return mapped;
        }
      }
    } catch (e) {
      console.warn(`Fonte nativa falhou para ${bookName}. Recorrendo à IA.`);
    }
    
    // 3. Fallback: Gemini IA
    data = await fetchBibleChapter(bookName, chapter);
    if (data && data.length > 0) {
      await offlineStorage.saveBibleVerses(bookName, chapter, data);
    }
    
    return data || [];
  }
};
