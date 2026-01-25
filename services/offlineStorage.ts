
export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface CatechismEntry {
  id: string;
  number: number;
  text: string;
  section: string;
}

const DB_NAME = 'CathedraDB';
const DB_VERSION = 1;

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
        }

        if (!db.objectStoreNames.contains('catechism')) {
          const catechismStore = db.createObjectStore('catechism', { keyPath: 'id' });
          catechismStore.createIndex('number', 'number', { unique: true });
        }

        if (!db.objectStoreNames.contains('sync_status')) {
          db.createObjectStore('sync_status', { keyPath: 'id' });
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
        store.put({ id: `${book}-${chapter}-${v.verse}`, book, chapter, verse: v.verse, text: v.text });
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

  async clearAll(): Promise<void> {
    await this.init();
    const transaction = this.db!.transaction(['bible_verses', 'catechism', 'sync_status'], 'readwrite');
    transaction.objectStore('bible_verses').clear();
    transaction.objectStore('catechism').clear();
    transaction.objectStore('sync_status').clear();
  }
}

export const offlineStorage = new OfflineStorage();
