
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

// Added missing interface LiturgyInfo to fix reported errors
export interface LiturgyInfo {
  color: string;
  season: string;
  rank: string;
  dayName: string;
  cycle: string;
  week: string;
  date?: string;
}

// Added missing interface Gospel to fix reported errors
export interface Gospel {
  reference: string;
  text: string;
  reflection: string;
  calendar: LiturgyInfo;
}

// Added missing interface StudyResult to fix reported errors
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
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'pilgrim' | 'scholar' | 'admin';
  joinedAt: string;
  avatar?: string;
  stats: {
    versesSaved: number;
    studiesPerformed: number;
    daysActive: number;
  };
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
  LITURGICAL_CALENDAR = '/calendar',
  LOGIN = '/login',
  PROFILE = '/profile',
  ADMIN = '/admin',
  COMMUNITY = '/community'
}
