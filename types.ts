
export type Language = 'pt' | 'en' | 'es' | 'la' | 'it' | 'fr' | 'de';

export enum AppRoute {
  DASHBOARD = '/',
  STUDY_MODE = '/study',
  BIBLE = '/bible',
  CATECHISM = '/catechism',
  SAINTS = '/saints',
  MAGISTERIUM = '/magisterium',
  DOGMAS = '/dogmas',
  DAILY_LITURGY = '/daily-liturgy',
  LITURGICAL_CALENDAR = '/calendar',
  AQUINAS_OPERA = '/aquinas',
  PROFILE = '/profile',
  LOGIN = '/login',
  CHECKOUT = '/checkout',
  CERTAMEN = '/quiz',
  POENITENTIA = '/confession',
  ORDO_MISSAE = '/mass',
  ROSARY = '/rosary',
  VIA_CRUCIS = '/viacrucis',
  LITANIES = '/litanies',
  PRAYERS = '/prayers',
  LECTIO_DIVINA = '/lectio',
  COMMUNITY = '/community',
  MISSAL = '/missal',
  BREVIARY = '/breviary',
  FAVORITES = '/favorites',
  DIAGNOSTICS = '/diagnostics'
}

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

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
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
  saints?: string[];
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
    quizScore?: number;
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

export interface ThomisticArticle {
  reference: string;
  questionTitle: string;
  articleTitle: string;
  objections: { id: number; text: string }[];
  sedContra: string;
  respondeo: string;
  replies: { id: number; text: string }[];
}

export interface AquinasWork {
  id: string;
  title: string;
  category: string;
  description: string;
  parts: string[];
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

export interface CommunityReply {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  isAI?: boolean;
}
