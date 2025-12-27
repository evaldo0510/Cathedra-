
import { GoogleGenAI, Modality } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma } from "../types";

const SYSTEM_INSTRUCTION = `Você é o Cathedra AI, uma inteligência teológica de elite. 
Foco: Precisão absoluta e brevidade teológica.
Sua missão é fornecer informações sobre a fé Católica baseada no Magistério, Sagrada Escritura e Tradição.
JSON: Retorne apenas JSON válido e purificado.
LITURGIA: Use cores litúrgicas exatas (green, purple, white, red, rose). 
GROUNDING: Use Google Search para validar calendários litúrgicos e biografias de santos.`;

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
    const dateStr = now.toLocaleDateString('pt-BR');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Catálogo litúrgico para ${dateStr}. Retorne JSON rigoroso: 
      { 
        "reference": "ref", "text": "texto evangelho", "reflection": "meditação concisa (max 300 caracteres)", "title": "Evangelho",
        "calendar": { "color": "green|purple|white|red|rose", "season": "Tempo", "rank": "Tipo", "dayName": "Nome", "cycle": "A|B|C", "week": "Semana" }
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
      contents: `Santo católico do dia ${dateStr}. JSON: { "name": string, "feastDay": string, "patronage": string, "biography": "bio breve", "image": "URL estável Unsplash/Wikimedia", "quote": "frase" }.`,
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
    const res = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: "Frase curta de um Santo para hoje. JSON: { \"quote\": string, \"author\": string }", 
      config: { responseMimeType: "application/json" } 
    });
    return JSON.parse(res.text || '{}');
  }, { quote: "Onde há amor, Deus aí está.", author: "Santo Agostinho" });
};

export const getIntelligentStudy = async (topic: string): Promise<StudyResult> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Investigação teológica profunda sobre "${topic}". Retorne JSON estruturado com BibleVerses, CatechismParagraphs e MagisteriumDocs.`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  const data = JSON.parse(response.text || "{}");
  data.sources = extractSources(response);
  return data;
};

export const getLiturgyInsight = async (title: string, reference: string, text: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: `Comentário patrístico breve sobre: "${title} (${reference}): ${text}". Foco em aplicação espiritual prática.`,
    config: { systemInstruction: "Teólogo especializado em exegese espiritual." } 
  });
  return response.text || "Meditação indisponível no momento.";
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const getSaintsList = async (): Promise<Saint[]> => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: "Lista de 12 santos católicos com nome, festa, imagem e patrocínio. JSON ARRAY.", 
    config: { responseMimeType: "application/json" } 
  });
  return JSON.parse(res.text || "[]");
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: `3 pontos de meditação para Lectio Divina sobre: "${text}". JSON String Array.`, 
    config: { responseMimeType: "application/json" } 
  });
  return JSON.parse(response.text || "[]");
};

export const getWeeklyCalendar = async (): Promise<LiturgyInfo[]> => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: "Calendário litúrgico dos próximos 7 dias. JSON ARRAY.", 
    config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" } 
  });
  return JSON.parse(res.text || "[]");
};

export const searchVerse = async (query: string): Promise<Verse> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: `Localize o versículo: "${query}". Retorne JSON: { "book": string, "chapter": number, "verse": number, "text": string }`, 
    config: { responseMimeType: "application/json" } 
  });
  return JSON.parse(response.text || "{}");
};

export const getVerseCommentary = async (verse: Verse): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: `Explicação espiritual curta para: ${verse.book} ${verse.chapter}:${verse.verse}.` 
  });
  return response.text || "Comentário indisponível.";
};

export const getCatechismSearch = async (query: string): Promise<CatechismParagraph[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: `Busca no Catecismo sobre "${query}". JSON ARRAY de objetos { "number": number, "content": string }.`, 
    config: { responseMimeType: "application/json" } 
  });
  return JSON.parse(response.text || "[]");
};

// Fix: Implemented getDogmaticLinksForCatechism which was missing and causing a compilation error in pages/Catechism.tsx
export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]): Promise<Record<number, Dogma[]>> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identifique dogmas da fé católica relacionados aos seguintes parágrafos do Catecismo: ${paragraphs.map(p => p.number).join(', ')}. 
      Retorne um JSON mapeando o número do parágrafo para uma lista de dogmas: { [paragraphNumber: string]: Dogma[] }.
      Cada objeto Dogma deve seguir esta estrutura: { "title": string, "definition": string, "council": string, "year": string, "tags": string[] }.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  }, {} as Record<number, Dogma[]>);
};

export const getMagisteriumDocs = async (category: string): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: `Documentos do Magistério sobre "${category}". JSON ARRAY.`, 
    config: { responseMimeType: "application/json" } 
  });
  return JSON.parse(response.text || "[]");
};

export const getDogmas = async (query?: string): Promise<Dogma[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: `Dogmas da fé católica. JSON ARRAY.`, 
    config: { responseMimeType: "application/json" } 
  });
  return JSON.parse(response.text || "[]");
};

export async function* getTheologicalDialogueStream(message: string): AsyncGenerator<string> {
  const ai = getAIInstance();
  const response = await ai.models.generateContentStream({ 
    model: 'gemini-3-flash-preview', 
    contents: message,
    config: { systemInstruction: "Você é um teólogo escolástico. Responda de forma dialética e clara." }
  });
  for await (const chunk of response) { yield chunk.text || ""; }
}

export const getThomisticSynthesis = async (topic: string): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: `Síntese de Tomás de Aquino sobre "${topic}". JSON estruturado com Objeções, Sed Contra e Respondeo.`, 
    config: { responseMimeType: "application/json" } 
  });
  return JSON.parse(response.text || "{}");
};
