
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StudyResult, Verse, Saint, ThomisticArticle, Language, Dogma, LiturgyInfo, Gospel, QuizQuestion, UniversalSearchResult, DailyLiturgyContent, CatechismParagraph } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const safeJsonParse = (text: string | undefined, fallback: any) => {
  if (!text) return fallback;
  try {
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean) || fallback;
  } catch (e) {
    console.error("Theological Parser Error:", e);
    return fallback;
  }
};

/**
 * MOTOR DE TEXT-TO-SPEECH (TTS) PARA A BÍBLIA
 * Gera áudio de alta qualidade para capítulos inteiros
 */
export const generateBibleAudio = async (text: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Leia solenemente este trecho da Bíblia Sagrada: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // Voz solene e clara
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio ? `data:audio/pcm;base64,${base64Audio}` : "";
};

export const fetchBibleChapter = async (book: string, chapter: number): Promise<Verse[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Retorne o texto INTEGRAL de ${book}, capítulo ${chapter}. JSON: [{"book": "${book}", "chapter": ${chapter}, "verse": number, "text": "string"}]`,
    config: { 
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    }
  });
  return safeJsonParse(response.text, []);
};

export const fetchCatechismRange = async (start: number, end: number): Promise<CatechismParagraph[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `CIC parágrafos ${start} a ${end}. JSON: [{"number": number, "content": "string", "context": "Doutrina"}]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Investigação teológica: "${topic}". JSON: { "topic": "string", "summary": "string", "bibleVerses": [], "catechismParagraphs": [], "magisteriumDocs": [], "saintsQuotes": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { topic, summary: "Erro na síntese.", bibleVerses: [], catechismParagraphs: [] });
};

export async function* getTheologicalDialogueStream(message: string) {
  const ai = getAI();
  const response = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: message,
    config: {
      systemInstruction: "Você é o 'Doctor Angelicus' (Santo Tomás de Aquino). Responda com escolástica e clareza.",
    },
  });
  for await (const chunk of response) {
    if (chunk.text) yield chunk.text;
  }
}

export const searchSaint = async (name: string): Promise<Partial<Saint>> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Biografia do santo: ${name}. JSON: { "biography": "string", "quote": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const universalSearch = async (query: string, lang: Language): Promise<UniversalSearchResult[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busca universal: "${query}". JSON: Array<{ id: string, type: string, title: string, snippet: string, source: { name: string, code: string }, relevance: number }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const getDogmas = async (query: string): Promise<Dogma[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Dogmas católicos sobre: "${query}". JSON: Array<{ title: string, definition: string, council: string, year: string }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const fetchLatestPapalAudience = async (lang: Language): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Resumo da audiência papal. JSON: { "date": "string", "topic": "string", "summary": "string", "vaticanUrl": "string" }`,
    config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const getDailyBundle = async (lang: Language): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Hoje: santo e evangelho. JSON: { "saint": { "name": "string" }, "gospel": { "reference": "string" } }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { saint: { name: "São Pedro" }, gospel: { reference: "Mt 16" } });
};

export const getDailyGospel = async (): Promise<Gospel> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Evangelho de hoje. JSON: { "reference": "string", "text": "string" }`,
    config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { reference: "", text: "" });
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `3 pontos de meditação: "${text}". JSON: Array<string>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const fetchMonthlyCalendar = async (m: number, y: number, l: Language): Promise<LiturgyInfo[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Calendário litúrgico ${m}/${y}. JSON: Array<{ "date": "string", "color": "string", "dayName": "string", "rank": "string" }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const fetchBreviaryHour = async (h: string, l: Language): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Ofício das Horas: ${h}. JSON: { "hourName": "string", "invitatory": "string", "hymn": "string", "psalms": [], "prayer": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const fetchThomisticArticle = async (w: string, r: string, l: Language): Promise<ThomisticArticle> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Artigo tomista: ${r}. JSON: { "articleTitle": "string", "objections": [], "respondeo": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { reference: r, articleTitle: "", objections: [], respondeo: "" });
};

export const getMoralDiscernment = async (i: string, l: Language): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Moral: "${i}". JSON: { "gravity": "string", "explanation": "string", "cicRef": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const fetchLitanies = async (t: string, l: Language): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Ladainha: ${t}. JSON: { "title": "string", "items": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { title: t, items: [] });
};

export const getMagisteriumDeepDive = async (title: string, lang: Language): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Documento: "${title}". JSON: { "historicalContext": "string", "corePoints": [], "modernApplication": "string", "relatedCatechism": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const fetchQuizQuestions = async (category: string, difficulty: string, lang: Language): Promise<QuizQuestion[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Quiz ${category}. JSON: Array<{ "id": "string", "question": "string", "options": ["string"], "correctAnswer": number, "explanation": "string" }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

/**
 * GERA UMA SÍNTESE ESCOLÁSTICA (ESTILO SANTO TOMÁS)
 * Responde a uma questão teológica usando a estrutura da Summa Theologiae
 */
export const getThomisticSynthesis = async (query: string): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Questão Teológica: "${query}". Responda rigorosamente em estilo Escolástico (Santo Tomás de Aquino). JSON: { "title": "string", "objections": ["string"], "sedContra": "string", "respondeo": "string", "replies": ["string"] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { 
    title: query, 
    objections: [], 
    sedContra: "Sed contra est...", 
    respondeo: "Respondeo dicendum...", 
    replies: [] 
  });
};

/**
 * GERA COMENTÁRIO PATRÍSTICO (CATENA AUREA)
 * Compila citações dos Padres da Igreja para um versículo bíblico específico
 */
export const getCatenaAureaCommentary = async (verse: Verse): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Catena Aurea para ${verse.book} ${verse.chapter}:${verse.verse}. Compile comentários dos Padres da Igreja (como Santo Agostinho, São João Crisóstomo, etc). JSON: { "content": "string", "fathers": ["string"], "sources": [] }`,
    config: { 
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json" 
    }
  });
  const data = safeJsonParse(response.text, { content: "Comentário indisponível no momento.", fathers: [], sources: [] });
  // Extração de fontes de grounding do Google Search
  if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    data.sources = response.candidates[0].groundingMetadata.groundingChunks.map((chunk: any) => ({
      title: chunk.web?.title || "Fonte Patrística",
      uri: chunk.web?.uri || "#"
    }));
  }
  return data;
};
