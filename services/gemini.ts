
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, Dogma, CatechismParagraph, LiturgyInfo } from "../types";

// Gateway Protection Simulation: No production app should keep API Key in frontend.
// This service simulates a call to a backend proxy where the API_KEY would actually live.
const CACHE_KEYS = {
  SAINT_DAILY: 'cathedra_daily_saint',
  GOSPEL: 'cathedra_daily_gospel',
  WEEKLY_CALENDAR: 'cathedra_weekly_calendar',
  DOGMAS_BASE: 'cathedra_base_dogmas',
  DATE: 'cathedra_cache_date',
  SEARCH_PREFIX: 'cathedra_search_',
  AQUINAS_PREFIX: 'cathedra_aquinas_'
};

function checkSession() {
  const user = localStorage.getItem('cathedra_user');
  if (!user) throw new Error("UNAUTHORIZED: Session required for AI features");
  return JSON.parse(user);
}

function getCache<T>(key: string, ignoreDate = false): T | null {
  const cachedDate = localStorage.getItem(CACHE_KEYS.DATE);
  const today = new Date().toDateString();
  const data = localStorage.getItem(key);
  if (!data) return null;
  if (!ignoreDate && cachedDate !== today && !key.startsWith(CACHE_KEYS.SEARCH_PREFIX)) return null;
  return JSON.parse(data);
}

function setCache(key: string, data: any) {
  const today = new Date().toDateString();
  localStorage.setItem(CACHE_KEYS.DATE, today);
  localStorage.setItem(key, JSON.stringify(data));
}

async function withRetry<T>(fn: () => Promise<T>, cacheKey?: string): Promise<T> {
  if (!navigator.onLine && cacheKey) {
    const stale = getCache<T>(cacheKey, true);
    if (stale) return stale;
  }
  return await fn();
}

const SYSTEM_INSTRUCTION = `Você é o Cathedra AI, uma inteligência teológica de elite.
Sua missão é fornecer informações precisas, reverentes e profundas sobre a fé Católica, o Magistério e as Sagradas Escrituras.
REGRAS:
1. Retorne APENAS JSON puro quando solicitado.
2. Grounding: Sempre use Google Search para fatos atuais.
3. Tom: Solene, acadêmico e devocional.
4. Idioma: Português do Brasil (PT-BR).`;

export const getDailyGospel = async (): Promise<Gospel> => {
  const cached = getCache<Gospel>(CACHE_KEYS.GOSPEL);
  if (cached) return cached;
  
  return withRetry(async () => {
    // Fix: Always use process.env.API_KEY directly for initialization
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const today = new Date().toLocaleDateString('pt-BR');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Pesquise a Liturgia Diária de hoje (${today}). JSON Schema: { "reference": string, "text": string, "reflection": string, "calendar": { "color": "green"|"purple"|"white"|"red"|"rose"|"black", "season": string, "rank": string, "dayName": string, "cycle": string, "week": string } }`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || "{}") as Gospel;
    setCache(CACHE_KEYS.GOSPEL, result);
    return result;
  }, CACHE_KEYS.GOSPEL);
};

export const getIntelligentStudy = async (topic: string): Promise<StudyResult> => {
  checkSession(); // Protege o recurso
  const cacheKey = `${CACHE_KEYS.SEARCH_PREFIX}study_${topic.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = getCache<StudyResult>(cacheKey);
  if (cached) return cached;
  
  return withRetry(async () => {
    // Fix: Always use process.env.API_KEY directly for initialization
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Estudo teológico sobre: "${topic}". JSON Schema: { "topic": string, "summary": string, "bibleVerses": [{"book": string, "chapter": number, "verse": number, "text": string}], "catechismParagraphs": [{"number": number, "content": string}], "magisteriumDocs": [{"title": string, "content": string, "source": string}], "saintsQuotes": [{"saint": string, "quote": string}] }`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || "{}");
    setCache(cacheKey, result);
    return result;
  }, cacheKey);
};

export const getDogmas = async (q?: string): Promise<Dogma[]> => {
  const cacheKey = q ? `${CACHE_KEYS.SEARCH_PREFIX}dogma_${q.toLowerCase().replace(/\s+/g, '_')}` : CACHE_KEYS.DOGMAS_BASE;
  const cached = getCache<Dogma[]>(cacheKey);
  if (cached) return cached;

  return withRetry(async () => {
    // Fix: Always use process.env.API_KEY directly for initialization
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = q ? `Explique dogmas relacionados a: "${q}".` : `Liste os principais dogmas católicos.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${prompt} JSON Schema: Array<{ "title": string, "definition": string, "council": string, "year": string, "tags": string[], "sourceUrl": string, "period": string }>`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || "[]");
    setCache(cacheKey, result);
    return result;
  }, cacheKey);
};

export const getThomisticSynthesis = async (topic: string) => {
  checkSession();
  const cacheKey = `${CACHE_KEYS.AQUINAS_PREFIX}${topic.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = getCache<any>(cacheKey);
  if (cached) return cached;

  return withRetry(async () => {
    // Fix: Always use process.env.API_KEY directly for initialization
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Disputatio Escolástica sobre: "${topic}". JSON Schema: { "title": string, "objections": string[], "sedContra": string, "respondeo": string, "replies": string[] }`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || "{}");
    setCache(cacheKey, result);
    return result;
  }, cacheKey);
};

export const generateSpeech = async (text: string): Promise<string> => {
  // Fix: Always use process.env.API_KEY directly for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const getDailySaint = async (): Promise<Saint> => {
  const cached = getCache<Saint>(CACHE_KEYS.SAINT_DAILY);
  if (cached) return cached;
  return withRetry(async () => {
    // Fix: Always use process.env.API_KEY directly for initialization
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Santo do dia. JSON Schema: { "name": string, "feastDay": string, "patronage": string, "biography": string, "image": string, "quote": string }`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || "{}");
    setCache(CACHE_KEYS.SAINT_DAILY, result);
    return result;
  }, CACHE_KEYS.SAINT_DAILY);
};

export const getWeeklyCalendar = async (): Promise<LiturgyInfo[]> => {
  const cached = getCache<LiturgyInfo[]>(CACHE_KEYS.WEEKLY_CALENDAR);
  if (cached) return cached;
  return withRetry(async () => {
    // Fix: Always use process.env.API_KEY directly for initialization
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Calendário Litúrgico próximos 7 dias. JSON Schema: Array<{ "color": string, "season": string, "rank": string, "dayName": string, "cycle": string, "week": string, "date": string }>`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || "[]");
    setCache(CACHE_KEYS.WEEKLY_CALENDAR, result);
    return result;
  }, CACHE_KEYS.WEEKLY_CALENDAR);
};

export const getTheologicalDialogue = async (message: string) => {
  checkSession();
  // Fix: Always use process.env.API_KEY directly for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({ model: 'gemini-3-pro-preview' });
  const response = await chat.sendMessage({ message });
  return response.text;
};

export const getCatechismSearch = async (query: string): Promise<CatechismParagraph[]> => {
  // Fix: Always use process.env.API_KEY directly for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busque parágrafos do Catecismo sobre: "${query}". JSON Schema: Array<{ "number": number, "content": string }>`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
};

export const searchVerse = async (query: string): Promise<Verse> => {
  // Fix: Always use process.env.API_KEY directly for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Identifique versículo bíblico para: "${query}". JSON Schema: { "book": string, "chapter": number, "verse": number, "text": string }`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const getDailyQuote = async () => {
  // Fix: Always use process.env.API_KEY directly for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: "Citação católica. JSON: { \"quote\": string, \"author\": string }", 
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" } 
  });
  return JSON.parse(res.text || "{}");
};

export const getMagisteriumDocs = async (category: string) => {
  // Fix: Always use process.env.API_KEY directly for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: `Docs Magistério: ${category}. JSON: Array<{ "title": string, "source": string, "content": string, "year": string }>`, 
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" } 
  });
  return JSON.parse(res.text || "[]");
};

export const getSaintsList = async () => {
  // Fix: Always use process.env.API_KEY directly for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: "Lista de santos. JSON: Array<{ \"name\": string, \"feastDay\": string, \"patronage\": string, \"biography\": string, \"image\": string, \"quote\": string }>", 
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" } 
  });
  return JSON.parse(res.text || "[]");
};

export const getRelatedSaints = async (saint: Saint): Promise<Saint[]> => {
  // Fix: Always use process.env.API_KEY directly for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Santos relacionados a ${saint.name}. JSON: Array<{ \"name\": string, \"feastDay\": string, \"patronage\": string, \"biography\": string, \"image\": string, \"quote\": string }>`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
};

/**
 * Fix: Added missing export getDogmaticLinksForVerses
 */
export const getDogmaticLinksForVerses = async (verses: Verse[]): Promise<Record<number, Dogma[]>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const text = verses.map(v => `${v.book} ${v.chapter}:${v.verse}: ${v.text}`).join('\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Identifique dogmas católicos relacionados a estes versículos bíblicos. 
    Retorne um objeto onde a chave é o número do versículo e o valor é um array de dogmas.
    Versículos:
    ${text}
    JSON Schema: { [verseNumber: number]: Array<{ "title": string, "definition": string, "council": string, "year": string, "tags": string[] }> }`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

/**
 * Fix: Added missing export getDogmaticLinksForCatechism
 */
export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]): Promise<Record<number, Dogma[]>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const text = paragraphs.map(p => `Parágrafo ${p.number}: ${p.content}`).join('\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Identifique dogmas católicos relacionados a estes parágrafos do Catecismo da Igreja Católica.
    Retorne um objeto onde a chave é o número do parágrafo e o valor é um array de dogmas.
    Parágrafos:
    ${text}
    JSON Schema: { [paragraphNumber: number]: Array<{ "title": string, "definition": string, "council": string, "year": string, "tags": string[] }> }`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};
