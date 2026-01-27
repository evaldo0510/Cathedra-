
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StudyResult, Verse, Saint, ThomisticArticle, Language, Dogma, LiturgyInfo, Gospel, QuizQuestion, UniversalSearchResult } from "../types";

// Always use a named parameter for the API key as per guidelines.
const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const safeJsonParse = (text: string | undefined, fallback: any) => {
  try {
    if (!text) return fallback;
    // Clean markdown code blocks if present
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
    contents: `Analise teologicamente: "${topic}". Conecte Escritura, Catecismo e Magistério. Idioma: ${lang}. Retorne JSON: { "topic": "string", "summary": "string", "bibleVerses": [{"book": "string", "chapter": number, "verse": number, "text": "string"}], "catechismParagraphs": [{"number": number, "content": "string"}], "magisteriumDocs": [{"title": "string", "source": "string", "year": "string", "summary": "string"}], "saintsQuotes": [{"saint": "string", "quote": "string"}] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

/**
 * CATEGORIA 2: ANALOGIAS E REFERÊNCIAS
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
 * CATEGORIA 3: O QUE OS OUTROS DISSERAM (Hagiografia e Tradição)
 */
export const searchSaint = async (name: string): Promise<Partial<Saint>> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça biografia aprofundada e sentenças famosas do santo: "${name}". Retorne JSON: { "biography": "string", "quote": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const getMagisteriumDeepDive = async (title: string, lang: Language = 'pt'): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Análise profunda do documento: "${title}". Idioma: ${lang}. Retorne JSON: { "historicalContext": "string", "corePoints": ["string"], "modernApplication": "string", "relatedCatechism": ["string"] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

// Funções de suporte a componentes existentes que chamam Gemini
export const fetchThomisticArticle = async (work: string, ref: string, lang: Language = 'pt'): Promise<ThomisticArticle> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Artigo de S. Tomás de Aquino (${work}) em ${ref}. Idioma: ${lang}. Retorne JSON formatado para ThomisticArticle.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {} as ThomisticArticle);
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

/**
 * MISSING EXPORTS TO FIX MODULE ERRORS
 */

// Added getDogmas for pages/Dogmas.tsx
export const getDogmas = async (query: string): Promise<Dogma[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Liste dogmas católicos relacionados a: "${query}". Retorne JSON: Array<{ title: string, definition: string, council?: string, year?: string, period?: string, tags?: string[], sourceUrl?: string }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

// Added getTheologicalDialogueStream for pages/Colloquium.tsx
export async function* getTheologicalDialogueStream(message: string) {
  const ai = getAIInstance();
  const response = await ai.models.generateContentStream({
    model: 'gemini-3-pro-preview',
    contents: message,
    config: {
        systemInstruction: "Você é um teólogo católico experiente (Doctor Angelicus). Responda com rigor e fidelidade ao Magistério da Igreja Católica."
    }
  });

  for await (const chunk of response) {
    if (chunk.text) yield chunk.text;
  }
}

// Added getThomisticSynthesis for pages/Aquinas.tsx
export const getThomisticSynthesis = async (topic: string): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Crie uma síntese escolástica (Summa) sobre: "${topic}". Siga o método da Quaestio Disputata. Retorne JSON: { "title": "string", "objections": ["string"], "sedContra": "string", "respondeo": "string", "replies": ["string"] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

// Added getCatenaAureaCommentary for pages/Aquinas.tsx
export const getCatenaAureaCommentary = async (verse: Verse): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Comentário da Catena Aurea (Cadeia de Ouro) compilado por São Tomás de Aquino para ${verse.book} ${verse.chapter}:${verse.verse}. Retorne JSON: { "content": "string", "fathers": ["string"], "sources": [{ "title": "string", "uri": "string" }] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

// Added fetchMonthlyCalendar for pages/LiturgicalCalendar.tsx
export const fetchMonthlyCalendar = async (month: number, year: number, lang: Language): Promise<LiturgyInfo[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere o calendário litúrgico católico romano para o mês ${month} do ano ${year}. Idioma: ${lang}. Retorne JSON: Array<{ color: "green"|"purple"|"white"|"red"|"rose"|"black", season: string, rank: string, dayName: string, cycle: string, week: string, date: "YYYY-MM-DD" }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

// Added getLectioPoints for pages/LectioDivina.tsx
export const getLectioPoints = async (text: string): Promise<string[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Dada a leitura bíblica: "${text}", forneça 3 pontos de meditação espiritual profunda seguindo a tradição da Lectio Divina. Retorne JSON: ["string", "string", "string"]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

// Added getDailyGospel for pages/LectioDivina.tsx
export const getDailyGospel = async (): Promise<Gospel> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça a referência e o texto integral do evangelho da missa de hoje conforme o lecionário romano. Retorne JSON: { "reference": "string", "text": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { reference: '', text: '' });
};

// Added getDailyBundle for services/notifications.ts
export const getDailyBundle = async (lang: Language): Promise<{ saint: Saint, gospel: Gospel }> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça o santo do dia e o evangelho da liturgia de hoje. Idioma: ${lang}. Retorne JSON: { "saint": { "name": "string", "feastDay": "string", "patronage": "string", "biography": "string", "image": "string" }, "gospel": { "reference": "string", "text": "string" } }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

// Added fetchBreviaryHour for pages/Breviary.tsx
export const fetchBreviaryHour = async (hour: string, lang: Language): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Forneça os textos para a Liturgia das Horas (Breviário) da hora: ${hour}. Idioma: ${lang}. Retorne JSON: { "hourName": "string", "invitatory": "string", "hymn": "string", "psalms": [{ "ref": "string", "text": "string" }], "prayer": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

// Added getMoralDiscernment for pages/Poenitentia.tsx
export const getMoralDiscernment = async (input: string, lang: Language): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Realize um discernimento moral baseado no Catecismo e na Teologia Moral para o seguinte ato ou dúvida: "${input}". Idioma: ${lang}. Retorne JSON: { "gravity": "mortal"|"venial", "explanation": "string", "cicRef": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

// Added fetchLitanies for pages/Litanies.tsx
export const fetchLitanies = async (type: string, lang: Language): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça o texto da ladainha: "${type}". Idioma: ${lang}. Retorne JSON: { "title": "string", "items": [{ "call": "string", "response": "string" }] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

// Added fetchQuizQuestions for pages/Certamen.tsx
export const fetchQuizQuestions = async (category: string, difficulty: string, lang: Language): Promise<QuizQuestion[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere 5 perguntas de quiz sobre ${category}, dificuldade ${difficulty}. Idioma: ${lang}. Retorne JSON: Array<{ "id": "string", "question": "string", "options": ["string"], "correctAnswer": number, "explanation": "string", "category": "string", "difficulty": "string" }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

// Added universalSearch for components/CommandCenter.tsx
export const universalSearch = async (query: string, lang: Language): Promise<UniversalSearchResult[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busca universal no santuário digital católico para o termo: "${query}". Pesquise em Bíblia, Catecismo, Magistério e Vida dos Santos. Idioma: ${lang}. Retorne JSON: Array<{ id: string, type: "verse"|"catechism"|"dogma"|"saint"|"aquinas"|"magisterium", title: string, snippet: string, source: { name: string, code: string, reliability: "high"|"medium" }, relevance: number }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};
