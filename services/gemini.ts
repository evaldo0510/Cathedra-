
import { GoogleGenAI, Modality } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma } from "../types";

const SYSTEM_INSTRUCTION = `Você é o Cathedra AI, uma inteligência teológica de elite.
Sua missão é fornecer informações precisas sobre a fé Católica, baseada no Magistério, Sagrada Escritura e Tradição.
REGRAS:
1. Retorne APENAS JSON puro quando solicitado.
2. Grounding: Sempre use Google Search para Liturgia Diária e notícias recentes da Igreja.
3. Imagens de Santos: No campo "image", retorne SEMPRE uma URL direta e válida do Unsplash (ex: https://images.unsplash.com/photo-...) focada em arte sacra, vitrais ou ícones. Não invente URLs.
4. Rigor: Ao citar comentários, prefira Santo Agostinho, São Tomás de Aquino e o Catecismo.`;

// IMAGENS DE BACKUP INFALÍVEIS
const IMAGE_BACKUPS = [
  "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800",
  "https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=800",
  "https://images.unsplash.com/photo-1515600051222-73c3393ba0a2?q=80&w=800"
];

// DADOS DE EMERGÊNCIA (Fallbacks garantidos)
const FALLBACK_GOSPEL: Gospel = {
  reference: "Jo 1, 1-5",
  text: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus. Ele estava no princípio com Deus. Tudo foi feito por meio dele.",
  reflection: "Hoje contemplamos o Verbo Encarnado que ilumina as trevas do mundo.",
  title: "Evangelho segundo João",
  calendar: {
    color: "white",
    season: "Tempo Comum",
    rank: "Féria",
    dayName: "Dia do Senhor",
    cycle: "B",
    week: "I Semana"
  }
};

const FALLBACK_SAINT: Saint = {
  name: "São Bento de Núrsia",
  feastDay: "11 de Julho",
  patronage: "Padroeiro da Europa e dos Monges",
  biography: "Pai do monaquismo ocidental, São Bento ensinou o equilíbrio entre a oração e o trabalho (Ora et Labora). Sua regra guia milhares até hoje.",
  image: IMAGE_BACKUPS[0],
  quote: "A oração deve ser curta e pura."
};

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

async function withRetry<T>(fn: () => Promise<T>, fallback: T, retries = 1): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errStr = JSON.stringify(error).toLowerCase();
    if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("exhausted")) {
        console.warn("Cota atingida, acionando fallback instantâneo.");
        return fallback;
    }
    
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return withRetry(fn, fallback, retries - 1);
    }
    return fallback;
  }
}

export const getDailyGospel = async (): Promise<Gospel> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const today = new Date().toLocaleDateString('pt-BR');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Pesquise a Liturgia Católica de hoje (${today}). JSON: { "reference": string, "text": string, "reflection": string, "calendar": { "color": string, "season": string, "rank": string, "dayName": string, "cycle": string, "week": string } }`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || JSON.stringify(FALLBACK_GOSPEL));
  }, FALLBACK_GOSPEL);
};

export const getDailySaint = async (): Promise<Saint> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identifique o santo do dia de hoje. JSON: { "name": string, "feastDay": string, "patronage": string, "biography": string, "image": string, "quote": string }`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const parsed = JSON.parse(response.text || JSON.stringify(FALLBACK_SAINT));
    // Garante que se a imagem vier vazia, usa o backup
    if (!parsed.image || parsed.image.length < 10) parsed.image = IMAGE_BACKUPS[0];
    return parsed;
  }, FALLBACK_SAINT);
};

export const getDailyQuote = async () => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: "Uma citação curta e inspiradora de um santo. JSON: { \"quote\": string, \"author\": string }", 
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" } 
    });
    return JSON.parse(res.text || '{"quote": "Onde há amor e caridade, Deus aí está.", "author": "Ubi Caritas"}');
  }, { quote: "Onde há amor e caridade, Deus aí está.", author: "Ubi Caritas" });
};

export const getIntelligentStudy = async (topic: string): Promise<StudyResult> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Estudo teológico sobre: "${topic}". JSON Schema: { "topic": string, "summary": string, "bibleVerses": [{"book": string, "chapter": number, "verse": number, "text": string}], "catechismParagraphs": [{"number": number, "content": string}], "magisteriumDocs": [{"title": string, "content": string, "source": string}], "saintsQuotes": [{"saint": string, "quote": string}] }`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Leia com voz solene: ${text}` }] }],
    config: { 
      responseModalalities: [Modality.AUDIO], 
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
    }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const getSaintsList = async (): Promise<Saint[]> => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: "Lista de 6 santos populares. JSON.", 
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" } 
  });
  return JSON.parse(res.text || "[]");
};

export const getWeeklyCalendar = async (): Promise<LiturgyInfo[]> => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: "Calendário litúrgico para os próximos 7 dias. JSON.", 
    config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" } 
  });
  return JSON.parse(res.text || "[]");
};

export const searchVerse = async (query: string): Promise<Verse> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busque o versículo exato para: "${query}". JSON.`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const getVerseCommentary = async (verse: Verse): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça um comentário exegético católico para: ${verse.book} ${verse.chapter}:${verse.verse}.`,
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });
  return response.text || "Comentário indisponível.";
};

export const getCatechismSearch = async (query: string): Promise<CatechismParagraph[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busque no Catecismo da Igreja Católica sobre: "${query}". JSON.`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
};

export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]): Promise<Record<number, Dogma[]>> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Identifique dogmas relacionados aos parágrafos do Catecismo: ${paragraphs.map(p=>p.number).join(',')}. JSON.`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const getMagisteriumDocs = async (category: string): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busque documentos do magistério sobre: "${category}". JSON.`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
};

export const getDogmas = async (query?: string): Promise<Dogma[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Lista de dogmas católicos ${query ? `sobre ${query}` : ''}. JSON.`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
};

export async function* getTheologicalDialogueStream(message: string): AsyncGenerator<string> {
  const ai = getAIInstance();
  const response = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: message,
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });
  for await (const chunk of response) {
    yield chunk.text || "";
  }
}

export const getThomisticSynthesis = async (topic: string): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Síntese tomista sobre: "${topic}". JSON.`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Pontos de meditação para Lectio Divina sobre: "${text}". JSON.`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
};
