
export type Language = 'pt' | 'en' | 'es' | 'la' | 'it' | 'fr' | 'de';

export interface SourceMetadata {
  name: string;
  code: string; 
  reliability: 'high' | 'medium';
  uri?: string;
}

export interface UniversalSearchResult {
  id: string;
  type: 'verse' | 'catechism' | 'dogma' | 'saint' | 'aquinas' | 'magisterium';
  title: string;
  snippet: string;
  source: SourceMetadata;
  relevance: number;
}

export interface CatechismHierarchy {
  id: string;
  title: string;
  level: 'part' | 'section' | 'chapter' | 'article' | 'paragraph';
  number?: string;
  children?: CatechismHierarchy[];
}

export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface SavedItem {
  id: string;
  type: 'verse' | 'catechism' | 'dogma' | 'study' | 'liturgy' | 'prayer' | 'aquinas';
  title: string;
  content: string;
  timestamp: string;
  metadata?: any;
}

export interface LiturgyInfo {
  color: 'green' | 'purple' | 'white' | 'red' | 'rose' | 'black';
  season: string;
  rank: string;
  rankValue: number;
  dayName: string;
  cycle: string;
  week: string;
  psalterWeek?: string;
  date: string;
  isHolyDayOfObligation?: boolean;
}

export interface DailyLiturgyContent {
  date: string;
  collect: string;
  firstReading: { reference: string; text: string };
  psalm: { title: string; text: string };
  secondReading?: { reference: string; text: string };
  gospel: { reference: string; text: string; homily?: string; reflection?: string; calendar?: any };
  saint?: Saint;
}

export interface AquinasWork {
  id: string;
  title: string;
  category: 'summa' | 'disputed' | 'commentary' | 'opuscula';
  description: string;
  parts: string[];
}

export interface ThomisticArticle {
  reference: string;
  questionTitle: string;
  articleTitle: string;
  objections: { id: number; text: string }[];
  sedContra: string;
  respondeo: string;
  replies: { id: number; text: string }[];
  latin?: {
    articleTitle: string;
    objections: string[];
    sedContra: string;
    respondeo: string;
    replies: string[];
  };
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

export interface Saint {
  name: string;
  feastDay: string;
  patronage: string;
  biography: string;
  image: string;
  quote?: string;
}

export interface CatechismParagraph {
  number: number;
  content: string;
  context?: string;
}

export interface MagisteriumDoc {
  title: string;
  source: string;
  year: string;
  summary: string;
}

export interface SaintQuote {
  saint: string;
  quote: string;
}

export interface StudyResult {
  topic: string;
  summary: string;
  bibleVerses: Verse[];
  catechismParagraphs: CatechismParagraph[];
  magisteriumDocs: MagisteriumDoc[];
  saintsQuotes: SaintQuote[];
}

export interface Dogma {
  title: string;
  definition: string;
  council?: string;
  year?: string;
  period?: string;
  tags?: string[];
  sourceUrl?: string;
}

export interface Prayer {
  id: string;
  title: string;
  latin?: string;
  vernacular: string;
  category: 'daily' | 'marian' | 'latin' | 'rosary' | 'litany' | string;
}

export interface Gospel {
  reference: string;
  text: string;
  reflection?: string;
  homily?: string;
  calendar?: any;
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
  BREVIARY = '/breviario',
  MISSAL = '/missal',
  DAILY_LITURGY = '/liturgia-diaria',
  PRAYERS = '/oracoes',
  FAVORITES = '/favoritos',
  AQUINAS_OPERA = '/aquinas-opera',
  POENITENTIA = '/confissao',
  ORDO_MISSAE = '/ordinario-missa',
  ROSARY = '/rosario',
  VIA_CRUCIS = '/via-sacra',
  LITANIES = '/ladainhas'
}
