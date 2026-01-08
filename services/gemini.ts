
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma, Language } from "../types";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = (lang: Language) => 
  `Cathedra: Você é uma API de dados teológicos católicos de nível acadêmico. Rigor absoluto. Responda APENAS JSON. Idioma: ${lang}.`;

export const DEFAULT_BUNDLE = {
  gospel: { reference: "", text: "", reflection: "", calendar: { color: "white", season: "", rank: "", dayName: "", cycle: "", week: "" } },
  saint: { name: "", feastDay: "", patronage: "", biography: "", image: "" },
  insight: "",
  quote: { quote: "", author: "" }
};

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isTransient = error?.message?.includes('500') || error?.message?.includes('xhr error') || error?.message?.includes('code: 6') || error?.message?.includes('UNAVAILABLE');
    if (retries > 0 && isTransient) {
      await new Promise(res => setTimeout(res, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

const safeJsonParse = (text: string, fallback: any) => {
  try {
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

export const fetchRealBibleText = async (book: string, chapter: number, version: string = 'catolica', lang: Language = 'pt'): Promise<Verse[]> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Texto integral (todos os versículos) de ${book}, capítulo ${chapter}, versão ${version}. Retorne um ARRAY JSON: [{"book": "${book}", "chapter": ${chapter}, "verse": number, "text": "string"}]`,
      config: { temperature: 0.1, responseMimeType: "application/json" }
    });
    const parsed = safeJsonParse(response.text || "", []);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty Bible response");
    return parsed;
  });
};

export const searchBible = async (query: string, lang: Language = 'pt'): Promise<Verse[]> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Pesquise versículos para: "${query}". JSON ARRAY: [{"book": "string", "chapter": number, "verse": number, "text": "string"}]`,
      config: { systemInstruction: getSystemInstruction(lang), responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", []);
  });
};

export const getMagisteriumDocs = async (category: string, lang: Language = 'pt'): Promise<any[]> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Liste 4 documentos principais da categoria "${category}". JSON ARRAY: [{title, source, year, summary}]`,
      config: { systemInstruction: getSystemInstruction(lang), responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", []);
  });
};

export const getMagisteriumDeepDive = async (docTitle: string, lang: Language = 'pt'): Promise<any> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Análise profunda do documento: "${docTitle}". JSON: {historicalContext, corePoints: [], modernApplication, relatedCatechism: []}`,
      config: { systemInstruction: getSystemInstruction(lang), responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  });
};

export const getChapterAnalysis = async (book: string, chapter: number, lang: Language = 'pt'): Promise<any> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analise Teológica de ${book} ${chapter}. JSON: {propheticInsight, catechismLinks: [{number, text}], magisteriumStatements: [{source, quote}], patristicView}`,
      config: { systemInstruction: getSystemInstruction(lang), responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  });
};

export const getDailyBundle = async (lang: Language = 'pt'): Promise<any> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `JSON Daily Bundle com evangelho, santo, insight e citação para hoje.`,
      config: { systemInstruction: getSystemInstruction(lang), responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  });
};

export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Estudo: "${topic}". JSON completo.`,
      config: { systemInstruction: getSystemInstruction(lang), responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", { topic, summary: "", bibleVerses: [], catechismParagraphs: [], magisteriumDocs: [], saintsQuotes: [] });
  });
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  });
};

export const getCatenaAureaCommentary = async (v: Verse, lang: Language = 'pt'): Promise<any> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Catena Aurea ${v.book} ${v.chapter}:${v.verse}. JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  });
};

export const getDailyGospel = async (): Promise<any> => {
  const b = await getDailyBundle();
  return b.gospel;
};

export const getWeeklyCalendar = async (): Promise<any[]> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Calendário Litúrgico de 7 dias. JSON ARRAY.`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", []);
  });
};

export const getSaintsList = async (): Promise<any[]> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Saints list. JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", []);
  });
};

export const searchSaint = async (name: string): Promise<any> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Saint ${name}. JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", null);
  });
};

export const getCatechismSearch = async (q: string, f: any, lang: Language): Promise<any[]> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Catechism search ${q}. JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", []);
  });
};

export const getDogmaticLinksForCatechism = async (p: any[]): Promise<any> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Dogmatic links for CIC paragraphs. JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  });
};

export const getDogmas = async (q: string): Promise<any[]> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Dogmas search ${q}. JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", []);
  });
};

export async function* getTheologicalDialogueStream(m: string) {
  const ai = getAIInstance();
  const stream = await ai.models.generateContentStream({
    model: 'gemini-3-pro-preview',
    contents: m,
    config: { systemInstruction: "Teólogo católico." }
  });
  for await (const chunk of stream) { yield chunk.text || ""; }
}

export const getThomisticSynthesis = async (topic: string): Promise<any> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Thomistic synthesis ${topic}. JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  });
};

export const getLectioPoints = async (t: string): Promise<string[]> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Lectio points for ${t}. JSON ARRAY.`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", []);
  });
};

export const getAIStudySuggestions = async (l: Language): Promise<string[]> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `4 study suggestions. JSON ARRAY.`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", []);
  });
};
