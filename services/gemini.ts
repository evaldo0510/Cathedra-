
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StudyResult, Verse, Saint, ThomisticArticle, Language, Dogma, LiturgyInfo, Gospel, QuizQuestion, UniversalSearchResult, DailyLiturgyContent, CatechismParagraph } from "../types";

// Inicialização segura do SDK Gemini
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const safeJsonParse = (text: string | undefined, fallback: any) => {
  if (!text) return fallback;
  try {
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean) || fallback;
  } catch (e) {
    console.error("Parser Error:", e);
    return fallback;
  }
};

/**
 * BUSCA BÍBLICA VIA GROUNDING
 */
export const fetchBibleChapter = async (book: string, chapter: number): Promise<Verse[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Extraia o texto integral de ${book}, capítulo ${chapter} da Bíblia Católica. JSON: [{"book": "${book}", "chapter": ${chapter}, "verse": number, "text": "string"}]`,
    config: { 
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    }
  });
  return safeJsonParse(response.text, []);
};

/**
 * BUSCA CATECISMO (CIC)
 */
export const fetchCatechismRange = async (start: number, end: number): Promise<CatechismParagraph[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça os parágrafos do Catecismo da Igreja Católica de ${start} a ${end}. JSON: [{"number": number, "content": "string", "context": "Doutrina"}]`,
    config: { 
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    }
  });
  return safeJsonParse(response.text, []);
};

/**
 * INVESTIGAÇÃO TEOLÓGICA PROFUNDA
 */
export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Análise magistral sobre: "${topic}". Conecte Escritura, Catecismo e Magistério. JSON: { "topic": "string", "summary": "string", "bibleVerses": [], "catechismParagraphs": [], "magisteriumDocs": [], "saintsQuotes": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { topic, summary: "Ocorreu um erro na síntese.", bibleVerses: [], catechismParagraphs: [] });
};

/**
 * DIÁLOGO TEOLÓGICO EM STREAMING (COLLOQUIUM)
 */
export async function* getTheologicalDialogueStream(message: string) {
  const ai = getAI();
  const response = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: message,
    config: {
      systemInstruction: "Você é o 'Doctor Angelicus' (Santo Tomás de Aquino). Responda com rigor escolástico, profundidade teológica e caridade. Cite a Suma Teológica e a Bíblia sempre que possível.",
    },
  });

  for await (const chunk of response) {
    if (chunk.text) yield chunk.text;
  }
}

/**
 * PESQUISA DE SANTOS
 */
export const searchSaint = async (name: string): Promise<Partial<Saint>> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Dados biográficos do santo: ${name}. JSON: { "biography": "string", "quote": "string", "feastDay": "string", "patronage": "string" }`,
    config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

/**
 * DOGMAS E VERDADES DE FÉ
 */
export const getDogmas = async (query: string): Promise<Dogma[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Liste dogmas católicos relacionados a: "${query}". JSON: Array<{ title: string, definition: string, council: string, year: string, tags: string[] }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

/**
 * BUSCA UNIVERSAL (OMNISEARCH)
 */
export const universalSearch = async (query: string, lang: Language): Promise<UniversalSearchResult[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busque no depósito da fé católico: "${query}". JSON: Array<{ id: string, type: string, title: string, snippet: string, source: { name: string, code: string }, relevance: number }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

// Funções de suporte litúrgico e acadêmico
export const getDailyGospel = async (): Promise<Gospel> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Evangelho católico de hoje (${new Date().toISOString()}). JSON: { "reference": "string", "text": "string" }`,
    config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { reference: "Consultando...", text: "Preparando lecionário..." });
};

export const fetchLatestPapalAudience = async (lang: Language): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Resumo da última audiência papal. JSON: { "date": "string", "topic": "string", "summary": "string", "vaticanUrl": "string" }`,
    config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const getMagisteriumDeepDive = async (title: string, lang: Language): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analise o documento: "${title}". JSON: { "historicalContext": "string", "corePoints": [], "modernApplication": "string", "relatedCatechism": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const fetchQuizQuestions = async (category: string, difficulty: string, lang: Language): Promise<QuizQuestion[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere 5 perguntas de quiz sobre ${category} no nível ${difficulty}. JSON: Array<{ "id": "string", "question": "string", "options": ["string"], "correctAnswer": number, "explanation": "string" }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Sugira 3 pontos de meditação para: "${text}". JSON: Array<string>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const getThomisticSynthesis = async (topic: string): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Questão tomista (Quaestio Disputata) sobre: "${topic}". JSON: { "title": "string", "objections": [], "sedContra": "string", "respondeo": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const getCatenaAureaCommentary = async (verse: Verse): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Comentário da Catena Aurea para ${verse.book} ${verse.chapter}:${verse.verse}. JSON: { "content": "string", "fathers": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const fetchMonthlyCalendar = async (m: number, y: number, l: Language): Promise<LiturgyInfo[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Calendário litúrgico católico para ${m}/${y}. JSON: Array<{ "date": "string", "color": "string", "dayName": "string", "rank": "string", "season": "string", "cycle": "string" }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const fetchBreviaryHour = async (h: string, l: Language): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Conteúdo para o Ofício das Horas (${h}). JSON: { "hourName": "string", "invitatory": "string", "hymn": "string", "psalms": [], "prayer": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const fetchThomisticArticle = async (w: string, r: string, l: Language): Promise<ThomisticArticle> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Recupere o artigo: ${w} ${r}. JSON: { "articleTitle": "string", "objections": [], "respondeo": "string", "reference": "${r}" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { reference: r, articleTitle: "Artigo não encontrado", objections: [], respondeo: "" });
};

export const getMoralDiscernment = async (i: string, l: Language): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Análise moral católica para: "${i}". JSON: { "gravity": "string", "explanation": "string", "cicRef": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const fetchLitanies = async (t: string, l: Language): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Texto da Ladainha: ${t}. JSON: { "title": "string", "items": [{"call": "string", "response": "string"}] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { title: t, items: [] });
};

export const getDailyBundle = async (lang: Language): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Santo e Evangelho de hoje. JSON: { "saint": { "name": "string" }, "gospel": { "reference": "string" } }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { saint: { name: "São Pedro" }, gospel: { reference: "Mt 16" } });
};
