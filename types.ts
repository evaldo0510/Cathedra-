
export type Language = 'pt' | 'en' | 'es' | 'la' | 'it' | 'fr' | 'de';

export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface SavedSearchFilter {
  id: string;
  name: string;
  query: string;
  books: string[];
  chapters: string[];
  verses: string[];
  createdAt: string;
}

export interface CatechismParagraph {
  number: number;
  title?: string;
  content: string;
  source?: string;
  tags?: string[];
}

export interface Saint {
  name: string;
  feastDay: string;
  patronage: string;
  biography: string;
  image?: string;
  quote?: string;
  sources?: { title: string; uri: string }[];
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

export interface LiturgyInfo {
  color: string;
  season: string;
  rank: string;
  dayName: string;
  cycle: string;
  week: string;
  psalterWeek?: string;
  date?: string;
}

export interface LiturgyReading {
  title: string;
  reference: string;
  text: string;
}

export interface Gospel extends LiturgyReading {
  reflection: string;
  calendar: LiturgyInfo;
  firstReading?: LiturgyReading;
  psalm?: LiturgyReading;
  secondReading?: LiturgyReading;
  sources?: { title: string; uri: string }[];
}

export interface StudyResult {
  topic: string;
  summary: string;
  bibleVerses: Verse[];
  catechismParagraphs: CatechismParagraph[];
  magisteriumDocs: {
    title: string;
    content: string;
    source: string;
  }[];
  saintsQuotes: {
    saint: string;
    quote: string;
  }[];
  sources?: { title: string; uri: string }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'pilgrim' | 'scholar' | 'admin';
  isPremium?: boolean;
  joinedAt: string;
  avatar?: string;
  stats: {
    versesSaved: number;
    studiesPerformed: number;
    daysActive: number;
    lastChapterRead?: string;
  };
}

export interface CommunityReply {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  isAI?: boolean;
}

export interface CommunityQuestion {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  createdAt: string;
  votes: number;
  category: string;
  replies: CommunityReply[];
}

export enum AppRoute {
  DASHBOARD = '/',
  BIBLE = '/biblia',
  CATECHISM = '/catecismo',
  SAINTS = '/santos',
  STUDY_MODE = '/relacional',
  COMMUNITY = '/aula-magna',
  LITURGICAL_CALENDAR = '/calendario',
  LOGIN = '/acesso',
  PROFILE = '/perfil',
  ADMIN = '/curadoria',
  LECTIO_DIVINA = '/lectio',
  CHECKOUT = '/assinar',
  MAGISTERIUM = '/magisterio',
  DOGMAS = '/dogmas',
  SOCIAL_DOCTRINE = '/doutrina-social',
  COLLOQUIUM = '/colloquium',
  ABOUT = '/sobre',
  AQUINAS = '/aquinate'
}
