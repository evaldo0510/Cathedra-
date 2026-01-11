
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma, Language, ThomisticArticle, UniversalSearchResult, CatechismHierarchy, DailyLiturgyContent, QuizQuestion } from "../types";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWithRetry(config: any, retries = 3, backoff = 1500): Promise<any> {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent(config);
    return response;
  } catch (error: any) {
    if (error?.message?.includes('429') || error?.status === 429) {
      if (retries > 0) {
        await sleep(backoff);
        return generateWithRetry(config, retries - 1, backoff * 2);
      }
    }
    throw error;
  }
}

const safeJsonParse = (text: string, fallback: any) => {
  try {
    if (!text) return fallback;
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1) return JSON.parse(clean.substring(start, end + 1));
    const arrayStart = clean.indexOf('[');
    const arrayEnd = clean.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1) return JSON.parse(clean.substring(arrayStart, arrayEnd + 1));
    return JSON.parse(clean || (Array.isArray(fallback) ? "[]" : "{}"));
  } catch (e) { return fallback; }
};

const ensureArray = (data: any): any[] => Array.isArray(data) ? data : [];

const getCache = (key: string) => {
  const saved = localStorage.getItem(`cathedra_cache_${key}`);
  if (!saved) return null;
  const { data, expiry } = JSON.parse(saved);
  if (new Date().getTime() > expiry) {
    localStorage.removeItem(`cathedra_cache_${key}`);
    return null;
  }
  return data;
};

const setCache = (key: string, data: any, ttlHours = 12) => {
  const expiry = new Date().getTime() + (ttlHours * 60 * 60 * 1000);
  localStorage.setItem(`cathedra_cache_${key}`, JSON.stringify({ data, expiry }));
};

export const fetchRealBibleText = async (book: string, chapter: number, version: string, lang: Language = 'pt'): Promise<Verse[]> => {
  const cacheKey = `bible_${book}_${chapter}_${version}_${lang}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Você é um erudito bíblico. Retorne TODO o texto integral de ${book}, capítulo ${chapter}, na versão "${version}". 
                 Idioma do texto: ${lang}. 
                 Formato: Retorne APENAS um array JSON de objetos: [{"book": "${book}", "chapter": ${chapter}, "verse": número, "text": "conteúdo do versículo"}]. 
                 Não pule nenhum versículo.`,
      config: { responseMimeType: "application/json" }
    });
    const result = ensureArray(safeJsonParse(response.text || "", []));
    if (result.length > 0) setCache(cacheKey, result, 720); // Cache de 30 dias para textos bíblicos
    return result;
  } catch (e) { 
    console.error("AI Bible Fetch Error:", e);
    return []; 
  }
};

export const fetchQuizQuestions = async (category: string, difficulty: string, lang: Language = 'pt'): Promise<QuizQuestion[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Gere 5 perguntas de quiz sobre "${category}" no nível "${difficulty}" para o aplicativo Cathedra. 
                 Idioma: ${lang}. 
                 Retorne APENAS um JSON array: [{ "id": "uuid", "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "...", "category": "${category}", "difficulty": "${difficulty}" }]`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const getDailyBundle = async (lang: Language = 'pt'): Promise<any> => {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `bundle_${today}_${lang}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Gere um bundle diário de conteúdo católico em ${lang}. JSON: { "saint": { "name": "Nome", "image": "url" }, "gospel": { "reference": "Ref", "text": "Texto" } }`,
      config: { responseMimeType: "application/json" }
    });
    const result = safeJsonParse(response.text || "", {});
    if (result.saint) setCache(cacheKey, result, 12);
    return result;
  } catch (e) { return { saint: { name: "Igreja", image: "" }, gospel: { reference: "", text: "" } }; }
};

export const fetchDailyVerse = async (lang: Language = 'pt'): Promise<any> => {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `daily_verse_${today}_${lang}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Versículo do dia em ${lang}. JSON: { "verse": "texto", "reference": "ref", "imageUrl": "url" }`,
      config: { responseMimeType: "application/json" }
    });
    const result = safeJsonParse(response.text || "", {});
    if (result.verse) setCache(cacheKey, result, 12);
    return result;
  } catch (e) { return null; }
};

export const universalSearch = async (query: string, lang: Language = 'pt'): Promise<UniversalSearchResult[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Busque no Depósito da Fé: "${query}". Idioma: ${lang}. JSON array: [{ "id": "1", "type": "verse", "title": "...", "snippet": "...", "source": { "name": "...", "code": "..." }, "relevance": 0.9 }]`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-pro-preview',
      contents: `Estudo profundo sobre: "${topic}". Idioma: ${lang}. JSON: { "topic": "...", "summary": "...", "bibleVerses": [], "catechismParagraphs": [], "magisteriumDocs": [], "saintsQuotes": [] }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { throw e; }
};

export const fetchLiturgyByDate = async (date: string, lang: Language = 'pt'): Promise<DailyLiturgyContent> => {
  const cacheKey = `liturgy_${date}_${lang}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Liturgia para ${date}. Idioma ${lang}. JSON: { "date": "${date}", "collect": "...", "firstReading": {}, "psalm": {}, "gospel": {}, "saint": {} }`,
      config: { responseMimeType: "application/json" }
    });
    const result = safeJsonParse(response.text || "", {});
    if (result.date) setCache(cacheKey, result, 48);
    return result;
  } catch (e) { throw e; }
};

export const fetchThomisticArticle = async (work: string, reference: string, lang: Language = 'pt'): Promise<ThomisticArticle> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-pro-preview',
      contents: `Artigo da Summa: "${reference}". Idioma ${lang}. JSON: { "reference": "...", "questionTitle": "...", "articleTitle": "...", "objections": [], "sedContra": "...", "respondeo": "...", "replies": [] }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { throw e; }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e) { return undefined; }
};

export const fetchLitanies = async (type: string, lang: Language = 'pt'): Promise<any> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Ladainha: "${type}" em ${lang}. JSON: { "title": "...", "items": [{ "call": "...", "response": "..." }] }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { return { title: type, items: [] }; }
};

export const getDogmas = async (query: string): Promise<Dogma[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Liste dogmas sobre: "${query}". JSON array: [{ "title": "...", "definition": "..." }]`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const getCatechismSearch = async (query: string, options: any = {}, lang: Language = 'pt'): Promise<CatechismParagraph[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Busque no Catecismo: "${query}". Idioma: ${lang}. JSON array: [{ "number": 1, "content": "..." }]`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const getCatechismHierarchy = async (parentId?: string, lang: Language = 'pt'): Promise<CatechismHierarchy[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Hierarquia do Catecismo ${parentId || 'raiz'}. Idioma: ${lang}. JSON array: [{ "id": "...", "title": "...", "level": "part" }]`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const fetchComparisonVerses = async (book: string, chapter: number, verse: number, versions: string[], lang: Language = 'pt'): Promise<Record<string, string>> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Compare ${book} ${chapter}:${verse} em: ${versions.join(', ')}. JSON: { "Versão": "Texto" }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { return {}; }
};

export const getAIStudySuggestions = async (lang: Language = 'pt'): Promise<string[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Sugira 4 temas teológicos em ${lang}. JSON array de strings.`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const getSaintsList = async (): Promise<Saint[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Liste 12 santos católicos famosos. JSON array: [{ "name": "...", "feastDay": "...", "image": "unsplash_url" }]`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const getMagisteriumDocs = async (category: string, lang: Language = 'pt'): Promise<any[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Documentos do Magistério: "${category}". JSON array: [{ "title": "...", "summary": "..." }]`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const fetchBreviaryHour = async (hour: string, lang: Language = 'pt'): Promise<any> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Ofício Divino: "${hour}" em ${lang}. JSON: { "hourName": "...", "hymn": "...", "psalms": [], "prayer": "..." }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { return null; }
};

export const fetchDailyMass = async (lang: Language = 'pt'): Promise<any> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Missa em ${lang}. JSON: { "intro": {}, "word": {}, "eucharist": {} }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { return null; }
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `3 pontos de meditação para: "${text}". JSON array de strings.`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const getDailyGospel = async (): Promise<Gospel> => {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `gospel_text_${today}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Evangelho de hoje (${today}). JSON: { "reference": "...", "text": "..." }`,
      config: { responseMimeType: "application/json" }
    });
    const result = safeJsonParse(response.text || "", {});
    if (result.text) setCache(cacheKey, result, 24);
    return result;
  } catch (e) { throw e; }
};

export const getMoralDiscernment = async (input: string, lang: Language = 'pt'): Promise<any> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-pro-preview',
      contents: `Moral: "${input}". JSON: { "gravity": "mortal", "explanation": "..." }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { return null; }
};

export async function* getTheologicalDialogueStream(message: string): AsyncIterable<string> {
  const ai = getAIInstance();
  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: message,
      config: { systemInstruction: "Você é S. Tomás de Aquino." }
    });
    for await (const chunk of responseStream) if (chunk.text) yield chunk.text;
  } catch (e) { yield "Sobrecarga."; }
}

export const searchSaint = async (query: string): Promise<Saint> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Pesquise santo: "${query}". JSON: { "name": "...", "biography": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]): Promise<Record<number, Dogma[]>> => {
  const numbers = paragraphs.map(p => p.number).join(', ');
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Dogmas para parágrafos ${numbers}. JSON: { "número": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getMagisteriumDeepDive = async (title: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Análise: "${title}". JSON: { "historicalContext": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getThomisticSynthesis = async (query: string): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Síntese Tomista: "${query}". JSON: { "title": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getCatenaAureaCommentary = async (verse: Verse): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Catena Aurea ${verse.book} ${verse.chapter}:${verse.verse}. JSON: { "content": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const fetchMonthlyCalendar = async (month: number, year: number, lang: Language = 'pt'): Promise<LiturgyInfo[]> => {
  const cacheKey = `calendar_${month}_${year}_${lang}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Gere o calendário litúrgico completo para o mês ${month} de ${year}. 
               Para cada dia, inclua: data (YYYY-MM-DD), cor litúrgica (green/purple/white/red/rose/black), tempo litúrgico, classe/ranking, nome do dia, ciclo e uma lista de 1 a 3 santos celebrados no dia.
               Retorne APENAS um JSON array de objetos LiturgyInfo.`,
    config: { responseMimeType: "application/json" }
  });
  
  const result = ensureArray(safeJsonParse(response.text || "", []));
  if (result.length > 0) setCache(cacheKey, result, 168); // 1 semana de cache
  return result;
};
