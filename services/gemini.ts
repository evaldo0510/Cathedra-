
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, Dogma, CatechismParagraph, LiturgyInfo } from "../types";

const CACHE_KEYS = {
  SAINT_DAILY: 'cathedra_daily_saint',
  SAINT_LIST: 'cathedra_saints_list',
  GOSPEL: 'cathedra_daily_gospel',
  WEEKLY_CALENDAR: 'cathedra_weekly_calendar',
  DOGMAS_BASE: 'cathedra_base_dogmas',
  DOGMATIC_LINKS_BIBLE: 'cathedra_dogma_links_bible_',
  DOGMATIC_LINKS_CIC: 'cathedra_dogma_links_cic_',
  MAGISTERIUM_PREFIX: 'cathedra_mag_',
  CURIOSITY: 'cathedra_daily_curiosity',
  DAILY_QUOTE: 'cathedra_daily_quote',
  DATE: 'cathedra_cache_date',
  QUOTA_LOCK: 'cathedra_quota_lock_until',
  SEARCH_PREFIX: 'cathedra_search_',
  DIALOGUE_PREFIX: 'cathedra_dialogue_',
  AQUINAS_PREFIX: 'cathedra_aquinas_'
};

function getCache<T>(key: string, ignoreDate = false): T | null {
  const cachedDate = localStorage.getItem(CACHE_KEYS.DATE);
  const today = new Date().toDateString();
  const isOffline = !navigator.onLine;
  
  if (isOffline) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  if (!ignoreDate && cachedDate !== today && !key.startsWith(CACHE_KEYS.SEARCH_PREFIX) && !key.startsWith(CACHE_KEYS.DOGMATIC_LINKS_BIBLE) && !key.startsWith(CACHE_KEYS.DOGMATIC_LINKS_CIC)) return null;
  
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function setCache(key: string, data: any) {
  const today = new Date().toDateString();
  localStorage.setItem(CACHE_KEYS.DATE, today);
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    if (e instanceof Error && e.name === 'QuotaExceededError') {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(CACHE_KEYS.SEARCH_PREFIX)) localStorage.removeItem(k);
      });
      localStorage.setItem(key, JSON.stringify(data));
    }
  }
}

async function withRetry<T>(fn: () => Promise<T>, cacheKey?: string): Promise<T> {
  if (!navigator.onLine && cacheKey) {
    const stale = getCache<T>(cacheKey, true);
    if (stale) return stale;
    throw new Error("OFFLINE_NO_CACHE");
  }

  try {
    return await fn();
  } catch (e: any) {
    if (cacheKey) {
      const stale = getCache<any>(cacheKey, true);
      if (stale) return stale;
    }
    throw e;
  }
}

const SYSTEM_INSTRUCTION = `Você é o Cathedra AI, uma inteligência teológica de elite.
Sua missão é fornecer informações precisas, reverentes e profundas sobre a fé Católica, o Magistério e as Sagradas Escrituras.
REGRAS:
1. Retorne APENAS JSON puro quando solicitado, sem Markdown ou explicações extras fora do objeto.
2. Grounding: Sempre use Google Search para fatos atuais e para identificar vínculos dogmáticos precisos.
3. Tom: Solene, acadêmico e devocional.
4. Idioma: Português do Brasil (PT-BR).`;

export const getDailyGospel = async (): Promise<Gospel> => {
  const cached = getCache<Gospel>(CACHE_KEYS.GOSPEL);
  if (cached) return cached;
  
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const today = new Date().toLocaleDateString('pt-BR');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Pesquise a Liturgia Diária de hoje (${today}). Extraia texto INTEGRAL, referência, reflexão e calendário. 
      JSON Schema: { 
        "reference": string, 
        "text": string, 
        "reflection": string, 
        "calendar": { 
          "color": "green"|"purple"|"white"|"red"|"rose"|"black", 
          "season": string, 
          "rank": string, 
          "dayName": string,
          "cycle": string,
          "week": string
        } 
      }`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    
    const result = JSON.parse(response.text || "{}") as Gospel;
    if (result.text) {
      setCache(CACHE_KEYS.GOSPEL, result);
    }
    return result;
  }, CACHE_KEYS.GOSPEL);
};

export const getWeeklyCalendar = async (): Promise<LiturgyInfo[]> => {
  const cached = getCache<LiturgyInfo[]>(CACHE_KEYS.WEEKLY_CALENDAR);
  if (cached) return cached;

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const today = new Date().toLocaleDateString('pt-BR');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Pesquise o Calendário Litúrgico Católico para os próximos 7 dias a partir de hoje (${today}).
      JSON Schema: Array<{ 
        "color": "green"|"purple"|"white"|"red"|"rose"|"black", 
        "season": string, 
        "rank": string, 
        "dayName": string,
        "cycle": string,
        "week": string,
        "date": string
      }>`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    const result = JSON.parse(response.text || "[]");
    setCache(CACHE_KEYS.WEEKLY_CALENDAR, result);
    return result;
  }, CACHE_KEYS.WEEKLY_CALENDAR);
};

export const getDogmaticLinksForVerses = async (verses: Verse[]): Promise<Record<number, Dogma[]>> => {
  if (verses.length === 0) return {};
  const first = verses[0];
  const cacheKey = `${CACHE_KEYS.DOGMATIC_LINKS_BIBLE}${first.book}_${first.chapter}`;
  const cached = getCache<Record<number, Dogma[]>>(cacheKey);
  if (cached) return cached;

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const textContext = verses.map(v => `${v.verse}: ${v.text}`).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise os seguintes versículos e identifique dogmas católicos relacionados.
      JSON Schema: { [verseNumber: string]: Array<{ "title": string, "definition": string, "council": string, "year": string, "tags": string[] }> }
      Versículos:\n${textContext}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });
    const result = JSON.parse(response.text || "{}");
    setCache(cacheKey, result);
    return result;
  }, cacheKey);
};

export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]): Promise<Record<number, Dogma[]>> => {
  if (paragraphs.length === 0) return {};
  const querySummary = paragraphs.map(p => p.number).join('_');
  const cacheKey = `${CACHE_KEYS.DOGMATIC_LINKS_CIC}${querySummary.slice(0, 50)}`;
  const cached = getCache<Record<number, Dogma[]>>(cacheKey);
  if (cached) return cached;

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const textContext = paragraphs.map(p => `${p.number}: ${p.content}`).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise os seguintes parágrafos do Catecismo da Igreja Católica e identifique dogmas relacionados.
      JSON Schema: { [paragraphNumber: string]: Array<{ "title": string, "definition": string, "council": string, "year": string, "tags": string[] }> }
      Parágrafos:\n${textContext}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const prompt = q 
      ? `Explique e liste dogmas católicos relacionados a: "${q}".` 
      : `Liste os principais dogmas da Igreja Católica (Marianos, Cristológicos, Sacramentais). 
         Para cada um, identifique obrigatoriamente: título, definição curta e clara, concílio ou documento definidor, ano, tags, sourceUrl (link oficial vatican.va ou similar) e período (Antiguidade, Escolástica, Conciliar Moderna, Contemporânea).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${prompt} JSON Schema: Array<{ "title": string, "definition": string, "council": string, "year": string, "tags": string[], "sourceUrl": string, "period": string }>`,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json" 
      }
    });

    const result = JSON.parse(response.text || "[]");
    if (Array.isArray(result) && result.length > 0) {
      setCache(cacheKey, result);
    }
    return result;
  }, cacheKey);
};

export const getThomisticSynthesis = async (topic: string) => {
  const cacheKey = `${CACHE_KEYS.AQUINAS_PREFIX}${topic.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = getCache<any>(cacheKey);
  if (cached) return cached;

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Desenvolva uma Disputatio Escolástica sobre: "${topic}". 
      JSON Schema: { "title": string, "objections": string[], "sedContra": string, "respondeo": string, "replies": string[] }`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });
    const result = JSON.parse(response.text || "{}");
    setCache(cacheKey, result);
    return result;
  }, cacheKey);
};

export const getIntelligentStudy = async (topic: string): Promise<StudyResult> => {
  const cacheKey = `${CACHE_KEYS.SEARCH_PREFIX}study_${topic.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = getCache<StudyResult>(cacheKey);
  if (cached) return cached;
  
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
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

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: { 
      responseModalities: [Modality.AUDIO], 
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
    }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const getDailySaint = async (): Promise<Saint> => {
  const cached = getCache<Saint>(CACHE_KEYS.SAINT_DAILY);
  if (cached) return cached;
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Quem é o Santo do dia hoje? JSON Schema: { "name": string, "feastDay": string, "patronage": string, "biography": string, "image": string, "quote": string }`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || "{}");
    setCache(CACHE_KEYS.SAINT_DAILY, result);
    return result;
  }, CACHE_KEYS.SAINT_DAILY);
};

export const getTheologicalDialogue = async (message: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const chat = ai.chats.create({ model: 'gemini-3-pro-preview' });
  const response = await chat.sendMessage({ message });
  return response.text;
};

export const getCatechismSearch = async (query: string): Promise<CatechismParagraph[]> => {
  const cacheKey = `${CACHE_KEYS.SEARCH_PREFIX}cic_${query.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = getCache<CatechismParagraph[]>(cacheKey);
  if (cached) return cached;
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Busque parágrafos do Catecismo sobre: "${query}". JSON Schema: Array<{ "number": number, "content": string }>`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || "[]");
    setCache(cacheKey, result);
    return result;
  }, cacheKey);
};

export const searchVerse = async (query: string): Promise<Verse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Identifique versículo bíblico para: "${query}". JSON Schema: { "book": string, "chapter": number, "verse": number, "text": string }`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const getDailyQuote = async () => withRetry(async () => {
  const cached = getCache<any>(CACHE_KEYS.DAILY_QUOTE);
  if (cached) return cached;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: "Citação inspiradora católica. JSON: { \"quote\": string, \"author\": string }", 
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" } 
  });
  const result = JSON.parse(res.text || "{}");
  setCache(CACHE_KEYS.DAILY_QUOTE, result);
  return result;
}, CACHE_KEYS.DAILY_QUOTE);

export const getMagisteriumDocs = async (category: string) => withRetry(async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: `Documentos do Magistério: ${category}. JSON: Array<{ "title": string, "source": string, "content": string, "year": string }>`, 
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" } 
  });
  return JSON.parse(res.text || "[]");
}, undefined);

export const getSaintsList = async () => withRetry(async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: "Lista de santos. JSON Schema: Array<{ \"name\": string, \"feastDay\": string, \"patronage\": string, \"biography\": string, \"image\": string, \"quote\": string }>", 
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" } 
  });
  return JSON.parse(res.text || "[]");
}, CACHE_KEYS.SAINT_LIST);

export const getRelatedSaints = async (saint: Saint): Promise<Saint[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Santos relacionados a ${saint.name}. JSON Schema: Array<{ \"name\": string, \"feastDay\": string, \"patronage\": string, \"biography\": string, \"image\": string, \"quote\": string }>`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
};
