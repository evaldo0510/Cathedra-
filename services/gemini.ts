
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
 * MOTOR DE ÁUDIO BÍBLICO PROFISSIONAL
 * Gera o áudio integral do capítulo + Pequeno trecho de meditação
 */
export const generateBibleAudio = async (text: string, includeReflection: boolean = true): Promise<string> => {
  const ai = getAI();
  const prompt = includeReflection 
    ? `Leia solenemente este capítulo da Bíblia: ${text}. Ao final, adicione uma breve frase de 10 segundos incentivando a oração.`
    : `Leia solenemente este capítulo da Bíblia: ${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // Tom equilibrado entre autoridade e doçura
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
    contents: `Retorne o texto INTEGRAL (ipsis litteris) de ${book}, capítulo ${chapter}. JSON: [{"book": "${book}", "chapter": ${chapter}, "verse": number, "text": "string"}]`,
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

export const getThomisticSynthesis = async (query: string): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Questão teológica: "${query}". Estilo escolástico. JSON: { "title": "string", "objections": ["string"], "sedContra": "string", "respondeo": "string", "replies": ["string"] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { title: query, objections: [], sedContra: "", respondeo: "", replies: [] });
};

export const getCatenaAureaCommentary = async (verse: Verse): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Catena Aurea para ${verse.book} ${verse.chapter}:${verse.verse}. JSON: { "content": "string", "fathers": ["string"] }`,
    config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { content: "Sem comentários no momento.", fathers: [] });
};

export const universalSearch = async (query: string, lang: Language): Promise<UniversalSearchResult[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busca católica: "${query}". JSON: Array<{ id: string, type: string, title: string, snippet: string, source: { name: string, code: string }, relevance: number }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Investigação profunda sobre: "${topic}". Conecte Escritura, CIC e Magistério. JSON: { "topic": "string", "summary": "string", "bibleVerses": [], "catechismParagraphs": [], "magisteriumDocs": [], "saintsQuotes": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { topic, summary: "Erro.", bibleVerses: [], catechismParagraphs: [] });
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

export const fetchQuizQuestions = async (category: string, difficulty: string, lang: Language): Promise<QuizQuestion[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Quiz ${category}. JSON: Array<{ "id": "string", "question": "string", "options": ["string"], "correctAnswer": number, "explanation": "string" }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `3 pontos de meditação para Lectio Divina: "${text}". JSON: Array<string>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const getDailyGospel = async (): Promise<Gospel> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Evangelho católico de hoje. JSON: { "reference": "string", "text": "string" }`,
    config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { reference: "", text: "" });
};

export const fetchMonthlyCalendar = async (m: number, y: number, l: Language): Promise<LiturgyInfo[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Calendário litúrgico católico ${m}/${y}. JSON: Array<{ "date": "string", "color": "string", "dayName": "string", "rank": "string" }>`,
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
    contents: `Análise moral católica: "${i}". JSON: { "gravity": "string", "explanation": "string", "cicRef": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const fetchLitanies = async (t: string, l: Language): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Ladainha católica: ${t}. JSON: { "title": "string", "items": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { title: t, items: [] });
};

export const getMagisteriumDeepDive = async (title: string, lang: Language): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analise o documento magisterial: "${title}". JSON: { "historicalContext": "string", "corePoints": [], "modernApplication": "string", "relatedCatechism": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const searchSaint = async (name: string): Promise<Partial<Saint>> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Dados biográficos e hagiográficos: ${name}. JSON: { "biography": "string", "quote": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const getDogmas = async (query: string): Promise<Dogma[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Liste dogmas católicos sobre: "${query}". JSON: Array<{ title: string, definition: string, council: string, year: string, tags: string[], period: string }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const getDailyBundle = async (lang: Language): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Santo e Evangelho do dia. JSON: { "saint": { "name": "string" }, "gospel": { "reference": "string" } }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { saint: { name: "Santo do Dia" }, gospel: { reference: "" } });
};

export async function* getTheologicalDialogueStream(message: string) {
  const ai = getAI();
  const response = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: message,
    config: {
      systemInstruction: "Você é o 'Doctor Angelicus' (Santo Tomás de Aquino). Responda com rigor escolástico e caridade.",
    },
  });
  for await (const chunk of response) {
    if (chunk.text) yield chunk.text;
  }
}
