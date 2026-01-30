
import { offlineStorage } from './offlineStorage';
import { getBibleBooksFromCloud, getChaptersFromCloud, getVersesFromCloud } from './supabase';
import { CATHOLIC_BIBLE_BOOKS } from './bibleLocal';
import { fetchBibleChapter } from './gemini';
import { Verse } from '../types';

export const bibleService = {
  /**
   * Get all books with fallback to local static data
   */
  async getBooks() {
    try {
      const cloudBooks = await getBibleBooksFromCloud();
      if (cloudBooks) return cloudBooks;
    } catch (e) {
      console.warn("Cloud Bible fail, using internal static cannon.");
    }
    return CATHOLIC_BIBLE_BOOKS;
  },

  /**
   * Get chapters for a book
   */
  async getChapters(bookId: number, bookName: string) {
    try {
      const cloudChapters = await getChaptersFromCloud(bookId);
      if (cloudChapters) return cloudChapters;
    } catch (e) {
      const book = CATHOLIC_BIBLE_BOOKS.find(b => b.id === bookId);
      return Array.from({ length: book?.chapters || 0 }, (_, i) => ({ chapter_number: i + 1 }));
    }
    return [];
  },

  /**
   * Load actual text content (verses)
   * Hierarchy: IndexedDB -> Supabase SQL -> Gemini AI
   */
  async getVerses(bookName: string, chapter: number, chapterId?: number): Promise<Verse[]> {
    // 1. Check Offline Storage (Highest Priority)
    let data = await offlineStorage.getBibleVerses(bookName, chapter);
    if (data && data.length > 0) return data;

    // 2. Check Supabase SQL Cloud (Market Priority)
    if (chapterId) {
      try {
        const cloudVerses = await getVersesFromCloud(chapterId);
        if (cloudVerses && cloudVerses.length > 0) {
          const mapped: Verse[] = cloudVerses.map(v => ({
            book: bookName,
            chapter: chapter,
            verse: v.verse_number,
            text: v.text
          }));
          await offlineStorage.saveBibleVerses(bookName, chapter, mapped);
          return mapped;
        }
      } catch (e) {
        console.warn("SQL Verse fetch failed, falling back to AI.");
      }
    }
    
    // 3. Fallback to Gemini AI (Dynamic Generation)
    data = await fetchBibleChapter(bookName, chapter);
    if (data && data.length > 0) {
      await offlineStorage.saveBibleVerses(bookName, chapter, data);
    }
    
    return data || [];
  }
};
