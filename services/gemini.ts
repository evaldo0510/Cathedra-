
import { GoogleGenAI, Modality } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma } from "../types";

const SYSTEM_INSTRUCTION = `Você é o Cathedra AI, uma inteligência teológica de elite.
Sua missão é fornecer informações precisas sobre a fé Católica, baseada no Magistério, Sagrada Escritura e Tradição.
REGRAS:
1. Retorne APENAS JSON puro quando solicitado.
2. Grounding: Sempre use Google Search para buscar informações precisas e recentes.
3. Imagens: Ao buscar santos, você DEVE retornar URLs de imagens PÚBLICAS e ESTÁVEIS.
4. Liturgia: Verifique a data ATUAL exata informada pelo usuário. Use cores: 'green', 'purple', 'white', 'red' ou 'rose'.`;

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const extractSources = (response: any) => {
  return response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => ({
      title: chunk.web?.title || chunk.web?.uri,
      uri: chunk.web?.uri
    }))
    .filter((s: any) => s.uri) || [];
};

async function withRetry<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch (error: any) { console.error("API Error:", error); return fallback; }
}

export const getDailyGospel = async (): Promise<Gospel> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Liturgia Católica oficial HOJE (${dateStr}). Retorne JSON: 
      { 
        "reference": "ref", "text": "texto evangelho", "reflection": "meditação profunda", "title": "Evangelho segundo...",
        "calendar": { "color": "green|purple|white|red|rose", "season": "Tempo", "rank": "Solenidade|Festa|Memória|Féria", "dayName": "Nome dia", "cycle": "A|B|C", "week": "Semana" }
      }`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const data = JSON.parse(response.text || "{}");
    data.sources = extractSources(response);
    return data;
  }, {} as any);
};

export const getDailySaint = async (): Promise<Saint> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Santo do dia ${dateStr}. JSON: { "name": string, "feastDay": string, "patronage": string, "biography": "bio", "image": "URL", "quote": "frase" }.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const parsed = JSON.parse(response.text || "{}");
    parsed.sources = extractSources(response);
    return parsed;
  }, {} as any);
};

export const getDailyQuote = async () => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: "Citação Santo hoje. JSON: { \"quote\": string, \"author\": string }", config: { responseMimeType: "application/json" } });
    return JSON.parse(res.text || '{}');
  }, { quote: "Onde há amor, Deus aí está.", author: "Ubi Caritas" });
};

export const getIntelligentStudy = async (topic: string): Promise<StudyResult> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Estudo teológico: "${topic}". JSON Schema: { "topic": string, "summary": string, "bibleVerses": [{"book": string, "chapter": number, "verse": number, "text": string}], "catechismParagraphs": [{"number": number, "content": string}], "magisteriumDocs": [{"title": string, "content": string, "source": string}], "saintsQuotes": [{"saint": string, "quote": string}] }`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  const data = JSON.parse(response.text || "{}");
  data.sources = extractSources(response);
  return data;
};

export const getLiturgyInsight = async (title: string, reference: string, text: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Comentário exegético: "${title} (${reference}): ${text}".`, config: { systemInstruction: "Teólogo patrístico e escolástico." } });
  return response.text || "Comentário indisponível.";
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Diga: ${text}` }] }],
    config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const getSaintsList = async (): Promise<Saint[]> => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: "Lista 6 santos populares. JSON.", config: { responseMimeType: "application/json" } });
  return JSON.parse(res.text || "[]");
};

export const getWeeklyCalendar = async (): Promise<LiturgyInfo[]> => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: "Calendário litúrgico 7 dias. JSON.", config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" } });
  return JSON.parse(res.text || "[]");
};

export const searchVerse = async (query: string): Promise<Verse> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Versículo exato: "${query}". JSON.`, config: { responseMimeType: "application/json" } });
  return JSON.parse(response.text || "{}");
};

export const getVerseCommentary = async (verse: Verse): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Comentário católico: ${verse.book} ${verse.chapter}:${verse.verse}.` });
  return response.text || "Sem comentário disponível.";
};

export const getCatechismSearch = async (query: string): Promise<CatechismParagraph[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Catecismo Igreja Católica: "${query}". JSON.`, config: { responseMimeType: "application/json" } });
  return JSON.parse(response.text || "[]");
};

export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]): Promise<Record<number, Dogma[]>> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Dogmas parágrafos CIC: ${paragraphs.map(p=>p.number).join(',')}. JSON.`, config: { responseMimeType: "application/json" } });
  return JSON.parse(response.text || "{}");
};

export const getMagisteriumDocs = async (category: string): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Documentos Magistério: "${category}". JSON.`, config: { responseMimeType: "application/json" } });
  return JSON.parse(response.text || "[]");
};

export const getDogmas = async (query?: string): Promise<Dogma[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Dogmas católicos. JSON.`, config: { responseMimeType: "application/json" } });
  return JSON.parse(response.text || "[]");
};

export async function* getTheologicalDialogueStream(message: string): AsyncGenerator<string> {
  const ai = getAIInstance();
  const response = await ai.models.generateContentStream({ model: 'gemini-3-flash-preview', contents: message });
  for await (const chunk of response) { yield chunk.text || ""; }
}

export const getThomisticSynthesis = async (topic: string): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Síntese tomista: "${topic}". JSON.`, config: { responseMimeType: "application/json" } });
  return JSON.parse(response.text || "{}");
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Lectio Divina: "${text}". JSON.`, config: { responseMimeType: "application/json" } });
  return JSON.parse(response.text || "[]");
};
