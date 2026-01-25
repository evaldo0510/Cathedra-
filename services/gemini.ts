
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma, Language, ThomisticArticle, UniversalSearchResult, CatechismHierarchy, DailyLiturgyContent, QuizQuestion } from "../types";
import { offlineStorage } from "./offlineStorage";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWithRetry(config: any, retries = 3, backoff = 1500): Promise<any> {
  const ai = getAIInstance();
  try {
    return await ai.models.generateContent(config);
  } catch (error: any) {
    if ((error?.message?.includes('429') || error?.status === 429) && retries > 0) {
      await sleep(backoff);
      return generateWithRetry(config, retries - 1, backoff * 2);
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

/**
 * Recupera o texto INTEGRAL de um capítulo bíblico.
 * Implementa estratégia Offline-First com IndexedDB.
 */
export const fetchRealBibleText = async (book: string, chapter: number, version: string, lang: Language = 'pt'): Promise<Verse[]> => {
  // 1. Tentar Banco Local (IndexedDB)
  const localData = await offlineStorage.getBibleVerses(book, chapter);
  if (localData) return localData;

  // 2. Se não houver local e houver internet, buscar na IA
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Você é o Arquivista do Vaticano. Forneça a transcrição INTEGRAL de ${book}, capítulo ${chapter}, tradução "${version}".
                 Retorne TODOS os versículos. Formato JSON: [{"verse": número, "text": "conteúdo"}]`,
      config: { responseMimeType: "application/json" }
    });
    const result = safeJsonParse(response.text || "", []);
    if (Array.isArray(result) && result.length > 0) {
      // 3. Salvar no Banco Local para o futuro
      await offlineStorage.saveBibleVerses(book, chapter, result);
      return result;
    }
    return [];
  } catch (e) { 
    console.error("Erro ao carregar Bíblia:", e);
    return []; 
  }
};

// ... Restante das funções (universalSearch, fetchDailyVerse, etc) preservadas
export const universalSearch = async (query: string, lang: Language = 'pt'): Promise<UniversalSearchResult[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Busque no Depósito da Fé: "${query}". Idioma: ${lang}. JSON array: [{ "id": "1", "type": "verse", "title": "...", "snippet": "...", "source": { "name": "...", "code": "..." }, "relevance": 0.9 }]`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", []);
  } catch (e) { return []; }
};

export const fetchDailyVerse = async (lang: Language = 'pt'): Promise<any> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Versículo do dia em ${lang}. JSON: { "verse": "...", "reference": "...", "imageUrl": "..." }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { return null; }
};

export const getDailyBundle = async (lang: Language = 'pt'): Promise<any> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Bundle diário em ${lang}. JSON: { "saint": { "name": "...", "image": "...", "quote": "..." }, "gospel": { "reference": "...", "text": "..." } }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { return null; }
};

export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Estudo teológico: "${topic}". Idioma: ${lang}. JSON: { "topic": "...", "summary": "...", "bibleVerses": [], "catechismParagraphs": [], "magisteriumDocs": [], "saintsQuotes": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Leia com solenidade: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    const partWithAudio = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData && p.inlineData.mimeType.includes('audio'));
    return partWithAudio?.inlineData?.data;
  } catch (e) { return undefined; }
};

export const fetchLiturgyByDate = async (date: string, lang: Language = 'pt'): Promise<DailyLiturgyContent> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Liturgia para ${date}. JSON: { "date": "${date}", "collect": "...", "firstReading": {}, "psalm": {}, "gospel": {}, "saint": {} }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const fetchQuizQuestions = async (category: string, difficulty: string, lang: Language = 'pt'): Promise<QuizQuestion[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Gere 5 perguntas de quiz sobre "${category}" no nível "${difficulty}" em ${lang}.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const fetchThomisticArticle = async (work: string, reference: string, lang: Language = 'pt'): Promise<ThomisticArticle> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Artigo de S. Tomás: "${reference}". JSON: { "reference": "...", "questionTitle": "...", "articleTitle": "...", "objections": [], "sedContra": "...", "respondeo": "...", "replies": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const fetchLitanies = async (type: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Ladainha: "${type}". JSON: { "title": "...", "items": [{ "call": "...", "response": "..." }] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getDogmas = async (query: string): Promise<Dogma[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Liste dogmas sobre: "${query}". JSON array: [{ "title": "...", "definition": "..." }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getCatechismSearch = async (query: string, options: any = {}, lang: Language = 'pt'): Promise<CatechismParagraph[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Busque no Catecismo: "${query}". JSON: [{ "number": 1, "content": "..." }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getCatechismHierarchy = async (parentId?: string, lang: Language = 'pt'): Promise<CatechismHierarchy[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Hierarquia CIC ${parentId || 'raiz'}. JSON: [{ "id": "...", "title": "...", "level": "part" }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getAIStudySuggestions = async (lang: Language = 'pt'): Promise<string[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Sugira 4 temas teológicos em ${lang}. JSON array de strings.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getSaintsList = async (): Promise<Saint[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Liste 12 santos famosos. JSON: [{ "name": "...", "feastDay": "...", "image": "unsplash_url" }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getMagisteriumDocs = async (category: string, lang: Language = 'pt'): Promise<any[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Docs Magistério: "${category}". JSON: [{ "title": "...", "summary": "..." }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const fetchBreviaryHour = async (hour: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Ofício: "${hour}". JSON: { "hourName": "...", "hymn": "...", "psalms": [], "prayer": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const fetchDailyMass = async (lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Missa em ${lang}. JSON: { "intro": {}, "word": {}, "eucharist": {} }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `3 pontos de meditação para: "${text}". JSON array de strings.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getDailyGospel = async (): Promise<Gospel> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Evangelho de hoje. JSON: { "reference": "...", "text": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getMoralDiscernment = async (input: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Moral: "${input}". JSON: { "gravity": "mortal", "explanation": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
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
    contents: `Santo: "${query}". JSON: { "name": "...", "biography": "..." }`,
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
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Calendário litúrgico ${month}/${year}. JSON: [{ "date": "YYYY-MM-DD", "color": "green", "dayName": "..." }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};
