
export interface BibleVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface CachedContent {
  id: string;
  type: 'catechism' | 'magisterium' | 'saint';
  title: string;
  content: any;
  timestamp: number;
}

const DB_NAME = 'CathedraDB';
const DB_VERSION = 3; // Incrementado para novos stores

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

        if (!db.objectStoreNames.contains('sacra_knowledge')) {
          const knowledgeStore = db.createObjectStore('sacra_knowledge', { keyPath: 'id' });
          knowledgeStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // Métodos Genéricos de Persistência
  async saveContent(id: string, type: 'catechism' | 'magisterium' | 'saint', title: string, content: any): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sacra_knowledge'], 'readwrite');
      const store = transaction.objectStore('sacra_knowledge');
      store.put({ id, type, title, content, timestamp: Date.now() });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getContent(id: string): Promise<any | null> {
    await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['sacra_knowledge'], 'readonly');
      const store = transaction.objectStore('sacra_knowledge');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result ? request.result.content : null);
      request.onerror = () => resolve(null);
    });
  }

  async getPreservedIds(type: string): Promise<Set<string>> {
    await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['sacra_knowledge'], 'readonly');
      const store = transaction.objectStore('sacra_knowledge');
      const index = store.index('type');
      const request = index.getAllKeys(type);
      request.onsuccess = () => resolve(new Set(request.result as string[]));
      request.onerror = () => resolve(new Set());
    });
  }

  // Métodos da Bíblia (Mantidos e Otimizados)
  async saveBibleVerses(book: string, chapter: number, verses: any[]): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['bible_verses'], 'readwrite');
      const store = transaction.objectStore('bible_verses');
      verses.forEach(v => {
        store.put({ id: `${book}-${chapter}-${v.verse}`, book, chapter, verse: v.verse, text: v.text });
      });
      transaction.oncomplete = () => resolve();
    });
  }

  async getBibleVerses(book: string, chapter: number): Promise<any[] | null> {
    await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['bible_verses'], 'readonly');
      const store = transaction.objectStore('bible_verses');
      const index = store.index('book_chapter');
      const request = index.getAll(IDBKeyRange.only([book, chapter]));
      request.onsuccess = () => {
        const results = request.result;
        resolve(results.length > 0 ? results.sort((a,b) => a.verse - b.verse) : null);
      };
    });
  }

  async getDownloadedBooks(): Promise<Set<string>> {
    await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['bible_verses'], 'readonly');
      const store = transaction.objectStore('bible_verses');
      const request = store.getAll();
      request.onsuccess = () => resolve(new Set(request.result.map(v => v.book)));
    });
  }
}

export const offlineStorage = new OfflineStorage();
