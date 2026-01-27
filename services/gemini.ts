
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { StudyResult, Verse, Saint, ThomisticArticle, Language, UniversalSearchResult, Dogma, QuizQuestion, DailyLiturgyContent, Gospel } from "../types";

// Initialize AI instance using process.env.API_KEY
const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const safeJsonParse = (text: string | undefined, fallback: any) => {
  try {
    if (!text) return fallback;
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean) || fallback;
  } catch (e) { return fallback; }
};

/**
 * CATEGORIA 1: ESTUDO APROFUNDADO (Symphonia)
 */
export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analise teologicamente o tema: "${topic}". Conecte Escritura, Catecismo e Magistério. Idioma: ${lang}. Retorne JSON: { "topic": "string", "summary": "string", "bibleVerses": [{"book": "string", "chapter": number, "verse": number, "text": "string"}], "catechismParagraphs": [{"number": number, "content": "string"}], "magisteriumDocs": [{"title": "string", "source": "string", "year": "string", "summary": "string"}], "saintsQuotes": [{"saint": "string", "quote": "string"}] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

// Fix for StudyMode.tsx: Added getAIStudySuggestions
export const getAIStudySuggestions = async (topic: string, lang: Language = 'pt'): Promise<string[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Sugira 5 temas relacionados a "${topic}" para estudo teológico católico. Idioma: ${lang}. Retorne JSON array de strings.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

/**
 * CATEGORIA 2: ANALOGIAS E CORRELAÇÕES
 */
export const getTheologicalCorrelation = async (sourceText: string, lang: Language = 'pt'): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Dada a citação: "${sourceText}", identifique 3 parágrafos do CIC e 2 passagens bíblicas análogas. Idioma: ${lang}. Retorne JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

/**
 * CATEGORIA 3: O QUE OS OUTROS DISSERAM
 */
// Fix for AquinasOpera.tsx: Added lang parameter to match call site
export const fetchThomisticArticle = async (work: string, reference: string, lang: Language = 'pt'): Promise<ThomisticArticle> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Artigo de S. Tomás de Aquino (${work}) em ${reference}. Idioma: ${lang}. Formato JSON: { "reference": "string", "questionTitle": "string", "articleTitle": "string", "objections": [{"id":number, "text":"string"}], "sedContra": "string", "respondeo": "string", "replies": [{"id":number, "text":"string"}] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {} as ThomisticArticle);
};

// Fix for Aquinas.tsx: Added getThomisticSynthesis
export const getThomisticSynthesis = async (query: string): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Responda à questão "${query}" no estilo de um artigo da Suma Teológica. Retorne JSON: { "title": "string", "objections": ["string"], "sedContra": "string", "respondeo": "string", "replies": ["string"] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

export const getCatenaAureaCommentary = async (verse: Verse): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Comentário da Catena Aurea para ${verse.book} ${verse.chapter}:${verse.verse}. Retorne JSON com content (string), fathers (string array) e sources (array de {title, uri}).`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const searchSaint = async (query: string): Promise<Saint> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Hagiografia completa de "${query}". Vida, virtudes e o que a Igreja diz. Retorne JSON compatível com a interface Saint.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {} as Saint);
};

// Fix for Magisterium.tsx: Added getMagisteriumDocs
export const getMagisteriumDocs = async (category: string, lang: Language): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Liste 5 documentos principais do magistério para a categoria "${category}". Idioma: ${lang}. Retorne JSON array: [{title, source, year, summary}]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

// Fix for Magisterium.tsx: Added getMagisteriumDeepDive
export const getMagisteriumDeepDive = async (title: string, lang: Language): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analise profundamente o documento "${title}". Idioma: ${lang}. Retorne JSON: { historicalContext, corePoints: [], modernApplication, relatedCatechism: [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

// Fix for Dogmas.tsx: Added getDogmas
export const getDogmas = async (query: string): Promise<Dogma[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Liste dogmas católicos relacionados a "${query}". Retorne JSON array de objetos: { title, definition, council, year, period, tags, sourceUrl }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

// Fix for Colloquium.tsx: Added getTheologicalDialogueStream
export async function* getTheologicalDialogueStream(userMsg: string) {
  const ai = getAIInstance();
  const response = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: userMsg,
    config: {
      systemInstruction: "Você é um mestre em teologia católica (Doctor Angelicus), respondendo com profundidade e fidelidade à Tradição."
    }
  });
  for await (const chunk of response) {
    yield chunk.text || "";
  }
}

// Fix for LiturgicalCalendar.tsx: Added fetchMonthlyCalendar
export const fetchMonthlyCalendar = async (month: number, year: number, lang: Language): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere o calendário litúrgico católico para ${month}/${year}. Idioma: ${lang}. Retorne JSON array: [{date: "YYYY-MM-DD", color: "green|red|white|purple|rose|black", season, rank, dayName, cycle}]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

// Fix for LectioDivina.tsx: Added getLectioPoints
export const getLectioPoints = async (text: string): Promise<string[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Dada a leitura: "${text}", sugira 4 pontos de meditação para Lectio Divina. Retorne JSON array de strings.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

// Fix for LectioDivina.tsx: Added getDailyGospel
export const getDailyGospel = async (): Promise<Gospel> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Retorne o Evangelho da Missa de hoje no Brasil. JSON: { reference, text, reflection }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {} as Gospel);
};

// Fix for notifications.ts: Added getDailyBundle
export const getDailyBundle = async (lang: Language): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere um resumo litúrgico para hoje. Idioma: ${lang}. JSON: { saint: {name}, gospel: {reference} }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

// Fix for Breviary.tsx: Added fetchBreviaryHour
export const fetchBreviaryHour = async (hour: string, lang: Language): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Gere a hora de ${hour} do Ofício Divino para hoje. Idioma: ${lang}. JSON: { hourName, invitatory, hymn, psalms: [{ref, text}], prayer }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

// Fix for DailyLiturgy.tsx: Added fetchLiturgyByDate
export const fetchLiturgyByDate = async (date: string, lang: Language): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Retorne a liturgia diária completa para ${date}. Idioma: ${lang}. JSON: { content: { date, collect, firstReading: {reference, text}, psalm: {title, text}, gospel: {reference, text, reflection, calendar: {color, dayName, rank, season}} } }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

// Fix for Poenitentia.tsx: Added getMoralDiscernment
export const getMoralDiscernment = async (input: string, lang: Language): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analise moralmente: "${input}". Idioma: ${lang}. Retorne JSON: { gravity: "mortal|venial", explanation, cicRef }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

// Fix for Litanies.tsx: Added fetchLitanies
export const fetchLitanies = async (type: string, lang: Language): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Retorne a ladainha: "${type}". Idioma: ${lang}. JSON: { title, items: [{call, response}] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

// Fix for Certamen.tsx: Added fetchQuizQuestions
export const fetchQuizQuestions = async (category: string, difficulty: string, lang: Language): Promise<QuizQuestion[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere 5 questões de quiz católico sobre "${category}" nível "${difficulty}". Idioma: ${lang}. JSON array: [{id, question, options: [], correctAnswer: index, explanation}]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

// Fix for CommandCenter.tsx: Added universalSearch
export const universalSearch = async (query: string, lang: Language): Promise<UniversalSearchResult[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busque no depósito da fé por: "${query}". Idioma: ${lang}. JSON array: [{id, type, title, snippet, source: {name, code, reliability}, relevance}]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } },
    });
    return response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
  } catch (e) { return undefined; }
};
