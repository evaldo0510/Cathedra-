
import { GoogleGenAI, Modality } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma } from "../types";

const SYSTEM_INSTRUCTION = `Você é o Cathedra AI, uma inteligência teológica de elite.
Sua missão é fornecer informações precisas sobre a fé Católica, baseada no Magistério, Sagrada Escritura e Tradição.
REGRAS:
1. Retorne APENAS JSON puro quando solicitado.
2. Grounding: Sempre use Google Search para Liturgia Diária e notícias recentes da Igreja.
3. Imagens de Santos: Para o campo "image", retorne sempre uma URL de alta qualidade do Unsplash ou Wikimedia Commons focada em arte sacra.
4. Rigor: Ao citar comentários, prefira Santo Agostinho, São Tomás de Aquino e o Catecismo.`;

const IMAGE_FALLBACKS = [
  "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800",
  "https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=800",
  "https://images.unsplash.com/photo-1515600051222-73c3393ba0a2?q=80&w=800",
  "https://images.unsplash.com/photo-1590070183023-e5757f72236d?q=80&w=800"
];

// DADOS DE EMERGÊNCIA (Caso a API falhe)
const FALLBACK_GOSPEL: Gospel = {
  reference: "Jo 1, 1-5",
  text: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus. Ele estava no princípio com Deus. Tudo foi feito por meio dele.",
  reflection: "Hoje somos convidados a contemplar a luz de Cristo que brilha nas trevas de nossa história.",
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
  image: "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800",
  quote: "A oração deve ser curta e pura."
};

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = JSON.stringify(error).toLowerCase();
    const isQuotaError = errorStr.includes("429") || errorStr.includes("resource_exhausted") || errorStr.includes("quota");
    
    if (isQuotaError && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

const handleApiError = (error: any) => {
  const errorMessage = JSON.stringify(error).toLowerCase();
  if (errorMessage.includes("429") || errorMessage.includes("resource_exhausted") || errorMessage.includes("not found")) {
    window.dispatchEvent(new CustomEvent('cathedra-api-quota-exceeded'));
  }
  throw error;
};

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDailyGospel = async (): Promise<Gospel> => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const today = new Date().toLocaleDateString('pt-BR');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Pesquise a Liturgia de hoje (${today}). JSON: { "reference": string, "text": string, "reflection": string, "calendar": { "color": string, "season": string, "rank": string, "dayName": string, "cycle": string, "week": string } }`,
        config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.warn("Usando Fallback para Evangelho");
      handleApiError(error);
      return FALLBACK_GOSPEL;
    }
  });
};

export const getDailySaint = async (): Promise<Saint> => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Identifique o santo de hoje. JSON: { "name": string, "feastDay": string, "patronage": string, "biography": string, "image": string, "quote": string }`,
        config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.warn("Usando Fallback para Santo");
      handleApiError(error);
      return FALLBACK_SAINT;
    }
  });
};

export const getDailyQuote = async () => {
  try {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: "Citação curta de um santo. JSON: { \"quote\": string, \"author\": string }", 
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" } 
    });
    return JSON.parse(res.text || "{}");
  } catch {
    return { quote: "Onde há amor e caridade, Deus aí está.", author: "Hino Antigo" };
  }
};

export const getIntelligentStudy = async (topic: string): Promise<StudyResult> => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Estudo teológico sobre: "${topic}". JSON Schema: { "topic": string, "summary": string, "bibleVerses": [{"book": string, "chapter": number, "verse": number, "text": string}], "catechismParagraphs": [{"number": number, "content": string}], "magisteriumDocs": [{"title": string, "content": string, "source": string}], "saintsQuotes": [{"saint": string, "quote": string}] }`,
        config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      return handleApiError(error);
    }
  });
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Leia: ${text}` }] }],
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) {
    throw e;
  }
};

export const getSaintsList = async (): Promise<Saint[]> => {
  try {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: "Lista de 6 santos. JSON.", 
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" } 
    });
    return JSON.parse(res.text || "[]");
  } catch {
    return [FALLBACK_SAINT];
  }
};

export const getWeeklyCalendar = async (): Promise<LiturgyInfo[]> => {
  try {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: "Calendário litúrgico 7 dias. JSON.", 
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" } 
    });
    return JSON.parse(res.text || "[]");
  } catch {
    return [FALLBACK_GOSPEL.calendar];
  }
};

export const searchVerse = async (query: string): Promise<Verse> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Busque versículo: "${query}". JSON.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch {
    return { book: "Salmos", chapter: 23, verse: 1, text: "O Senhor é o meu pastor, nada me faltará." };
  }
};

export const getVerseCommentary = async (verse: Verse): Promise<string> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Comente: ${verse.book} ${verse.chapter}:${verse.verse}.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "";
  } catch {
    return "Comentário indisponível.";
  }
};

export const getCatechismSearch = async (query: string): Promise<CatechismParagraph[]> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Catecismo sobre: "${query}". JSON.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch {
    return [{ number: 1, content: "Deus, infinitamente Perfeito e Bem-aventurado em Si mesmo..." }];
  }
};

export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]): Promise<Record<number, Dogma[]>> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Dogmas para parágrafos ${paragraphs.map(p=>p.number).join(',')}. JSON.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch {
    return {};
  }
};

export const getMagisteriumDocs = async (category: string): Promise<any[]> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Docs magistério: "${category}". JSON.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch {
    return [];
  }
};

export const getDogmas = async (query?: string): Promise<Dogma[]> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Dogmas católicos ${query||''}. JSON.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch {
    return [];
  }
};

export async function* getTheologicalDialogueStream(message: string): AsyncGenerator<string> {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    for await (const chunk of response) {
      yield chunk.text || "";
    }
  } catch {
    yield "Erro na conexão.";
  }
}

export const getThomisticSynthesis = async (topic: string): Promise<any> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Síntese tomista: "${topic}". JSON.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch {
    return null;
  }
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Pontos lectio: "${text}". JSON.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch {
    return ["Reflexão silenciosa."];
  }
};
