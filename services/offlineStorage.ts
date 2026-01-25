
export interface BibleVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

const DB_NAME = 'CathedraDB';
const DB_VERSION = 2;

export class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('bible_verses')) {
          const bibleStore = db.createObjectStore('bible_verses', { keyPath: 'id' });
          bibleStore.createIndex('book_chapter', ['book', 'chapter'], { unique: false });
          bibleStore.createIndex('text_search', 'text', { unique: false });
        }

        if (!db.objectStoreNames.contains('catechism')) {
          const catechismStore = db.createObjectStore('catechism', { keyPath: 'id' });
          catechismStore.createIndex('number', 'number', { unique: true });
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async saveBibleVerses(book: string, chapter: number, verses: any[]): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['bible_verses'], 'readwrite');
      const store = transaction.objectStore('bible_verses');
      verses.forEach(v => {
        store.put({ 
          id: `${book}-${chapter}-${v.verse}`, 
          book, 
          chapter, 
          verse: v.verse, 
          text: v.text 
        });
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getBibleVerses(book: string, chapter: number): Promise<any[] | null> {
    await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['bible_verses'], 'readonly');
      const store = transaction.objectStore('bible_verses');
      const index = store.index('book_chapter');
      const request = index.getAll(IDBKeyRange.only([book, chapter]));
      request.onsuccess = () => resolve(request.result.length > 0 ? request.result.sort((a,b) => a.verse - b.verse) : null);
      request.onerror = () => resolve(null);
    });
  }

  async getDownloadedBooks(): Promise<Set<string>> {
    await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['bible_verses'], 'readonly');
      const store = transaction.objectStore('bible_verses');
      const request = store.getAll();
      request.onsuccess = () => {
        const books = new Set<string>(request.result.map(v => v.book));
        resolve(books);
      };
      request.onerror = () => resolve(new Set());
    });
  }

  async searchOfflineText(query: string): Promise<BibleVerse[]> {
    await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['bible_verses'], 'readonly');
      const store = transaction.objectStore('bible_verses');
      const request = store.getAll();
      request.onsuccess = () => {
        const q = query.toLowerCase();
        const results = request.result.filter(v => v.text.toLowerCase().includes(q));
        resolve(results.slice(0, 50));
      };
      request.onerror = () => resolve([]);
    });
  }
}

export const offlineStorage = new OfflineStorage();
