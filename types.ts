
export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface CatechismParagraph {
  number: number;
  title?: string;
  content: string;
}

export interface Saint {
  name: string;
  feastDay: string;
  patronage: string;
  biography: string;
  image?: string;
  quote?: string;
}

export interface Dogma {
  title: string;
  definition: string;
  council: string;
  year: string;
  tags: string[];
  sourceUrl?: string;
  period?: string;
}

export interface SocialDoctrineTheme {
  id: string;
  title: string;
  icon: string;
  questions: Array<{
    q: string;
    a: string;
    ref: string;
  }>;
}

export interface LiturgyInfo {
  color: 'green' | 'purple' | 'white' | 'red' | 'rose' | 'black';
  season: string;
  rank: string;
  dayName: string;
  cycle?: string; // Ex: Ano B, Ano II
  week?: string;  // Ex: III Semana do Tempo Comum
  date?: string;
}

export interface Gospel {
  reference: string;
  text: string;
  reflection: string;
  calendar?: LiturgyInfo;
  sources?: any[];
}

export interface StudyResult {
  topic: string;
  summary: string;
  bibleVerses: Verse[];
  catechismParagraphs: CatechismParagraph[];
  magisteriumDocs: Array<{ title: string; content: string; source: string }>;
  saintsQuotes: Array<{ saint: string; quote: string }>;
  dogmasRelated?: Dogma[];
  sources?: any[];
}

export enum AppRoute {
  DASHBOARD = '/',
  STUDY_MODE = '/study-mode',
  BIBLE = '/bible',
  CATECHISM = '/catechism',
  SAINTS = '/saints',
  MAGISTERIUM = '/magisterium',
  DOGMAS = '/dogmas',
  SOCIAL_DOCTRINE = '/social-doctrine',
  COLLOQUIUM = '/colloquium',
  ABOUT = '/about',
  AQUINAS = '/aquinas',
  LITURGICAL_CALENDAR = '/calendar'
}
