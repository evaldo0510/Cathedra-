
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

// Utilitário de Retentativa com Backoff Exponencial
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = JSON.stringify(error).toLowerCase();
    const isQuotaError = errorStr.includes("429") || errorStr.includes("resource_exhausted") || errorStr.includes("quota");
    
    if (isQuotaError && retries > 0) {
      console.warn(`Cota atingida. Tentando novamente em ${delay}ms... (Restam ${retries} tentativas)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

const handleApiError = async (error: any) => {
  const errorMessage = JSON.stringify(error).toLowerCase();
  if (errorMessage.includes("429") || errorMessage.includes("resource_exhausted") || errorMessage.includes("requested entity was not found")) {
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
        contents: `Pesquise a Liturgia da Palavra de hoje (${today}). JSON Schema: { "reference": string, "text": string, "reflection": string, "firstReading": { "title": string, "reference": string, "text": string }, "psalm": { "title": string, "reference": string, "text": string }, "secondReading": { "title": string, "reference": string, "text": string }, "calendar": { "color": string, "season": string, "rank": string, "dayName": string, "cycle": string, "week": string } }`,
        config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      return handleApiError(error);
    }
  });
};

export const getIntelligentStudy = async (topic: string): Promise<StudyResult> => {
  const runStudy = async (modelName: string) => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Realize um estudo teológico profundo sobre: "${topic}". JSON Schema: { "topic": string, "summary": string, "bibleVerses": [{"book": string, "chapter": number, "verse": number, "text": string}], "catechismParagraphs": [{"number": number, "content": string}], "magisteriumDocs": [{"title": string, "content": string, "source": string}], "saintsQuotes": [{"saint": string, "quote": string}] }`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || "{}");
    const history = JSON.parse(localStorage.getItem('cathedra_history') || '[]');
    const newHistory = [result, ...history.filter((h: any) => h.topic !== result.topic)].slice(0, 20);
    localStorage.setItem('cathedra_history', JSON.stringify(newHistory));
    return result;
  };

  return withRetry(async () => {
    try {
      return await runStudy('gemini-3-pro-preview');
    } catch (error: any) {
      const errorStr = JSON.stringify(error).toLowerCase();
      if (errorStr.includes("429") || errorStr.includes("resource_exhausted")) {
        console.warn("Cota Pro atingida em Estudo, tentando com Flash...");
        try {
          return await runStudy('gemini-3-flash-preview');
        } catch (innerError) {
          return handleApiError(innerError);
        }
      }
      return handleApiError(error);
    }
  });
};

export const generateSpeech = async (text: string): Promise<string> => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Leia solenemente: ${text}` }] }],
        config: { 
          responseModalities: [Modality.AUDIO], 
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
        }
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    } catch (error) {
      return handleApiError(error);
    }
  });
};

export const getDailySaint = async (): Promise<Saint> => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Identifique o santo celebrado hoje. Forneça biografia e imagem REAL de arte sacra. JSON Schema: { "name": string, "feastDay": string, "patronage": string, "biography": string, "image": string, "quote": string }`,
        config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text || "{}");
      if (!data.image || data.image.includes("fallback")) {
        data.image = IMAGE_FALLBACKS[Math.floor(Math.random() * IMAGE_FALLBACKS.length)];
      }
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  });
};

export const getSaintsList = async (): Promise<Saint[]> => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const res = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: "Gere uma lista de 6 grandes santos da Igreja com URLs de imagens válidas de arte sacra. JSON: Array<{ \"name\": string, \"feastDay\": string, \"patronage\": string, \"biography\": string, \"image\": string, \"quote\": string }>", 
        config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" } 
      });
      const saints = JSON.parse(res.text || "[]");
      return saints.map((s: Saint, idx: number) => ({
        ...s,
        image: s.image && s.image.startsWith("http") ? s.image : IMAGE_FALLBACKS[idx % IMAGE_FALLBACKS.length]
      }));
    } catch (error) {
      return handleApiError(error);
    }
  });
};

export const getDailyQuote = async () => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const res = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: "Citação profunda de um santo para hoje. JSON: { \"quote\": string, \"author\": string }", 
        config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" } 
      });
      return JSON.parse(res.text || "{}");
    } catch (error) {
      return handleApiError(error);
    }
  });
};

export const getWeeklyCalendar = async (): Promise<LiturgyInfo[]> => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const res = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: "Calendário litúrgico próximos 7 dias. JSON: Array<{ \"color\": string, \"season\": string, \"rank\": string, \"dayName\": string, \"cycle\": string, \"week\": string, \"date\": string }>", 
        config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" } 
      });
      return JSON.parse(res.text || "[]");
    } catch (error) {
      return handleApiError(error);
    }
  });
};

export const searchVerse = async (query: string): Promise<Verse> => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Encontre um versículo bíblico católico que corresponda a: "${query}". JSON Schema: { "book": string, "chapter": number, "verse": number, "text": string }`,
        config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      return handleApiError(error);
    }
  });
};

export const getVerseCommentary = async (verse: Verse): Promise<string> => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Forneça um comentário exegético e espiritual profundo para o versículo: ${verse.book} ${verse.chapter}:${verse.verse} ("${verse.text}"). Baseie-se nos Padres da Igreja e no Magistério.`,
        config: { systemInstruction: SYSTEM_INSTRUCTION }
      });
      return response.text || "Comentário indisponível no momento.";
    } catch (error) {
      return handleApiError(error);
    }
  });
};

export const getCatechismSearch = async (query: string): Promise<CatechismParagraph[]> => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Busque parágrafos do Catecismo da Igreja Católica relacionados a: "${query}". JSON Schema: Array<{ "number": number, "content": string }>`,
        config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "[]");
    } catch (error) {
      return handleApiError(error);
    }
  });
};

export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]): Promise<Record<number, Dogma[]>> => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const numbers = paragraphs.map(p => p.number).join(', ');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Para os seguintes parágrafos do Catecismo (${numbers}), identifique dogmas católicos relacionados. JSON Schema: { [paragraphNumber: number]: Array<{ "title": string, "definition": string, "council": string, "year": string, "tags": string[] }> }`,
        config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Erro ao vincular dogmas:", error);
      return {};
    }
  });
};

export const getMagisteriumDocs = async (category: string): Promise<any[]> => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Liste os principais documentos do Magistério na categoria: "${category}". JSON Schema: Array<{ "title": string, "source": string, "content": string, "year": string }>`,
        config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "[]");
    } catch (error) {
      return handleApiError(error);
    }
  });
};

export const getDogmas = async (query?: string): Promise<Dogma[]> => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const prompt = query ? `Busque dogmas da Igreja Católica relacionados a: "${query}".` : "Liste os dogmas fundamentais da Igreja Católica.";
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${prompt} JSON Schema: Array<{ "title": string, "definition": string, "council": string, "year": string, "tags": string[], "period": string, "sourceUrl": string }>`,
        config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "[]");
    } catch (error) {
      return handleApiError(error);
    }
  });
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
  } catch (error) {
    console.error("Erro no stream teológico:", error);
    yield "Desculpe, ocorreu um erro na conexão com o santuário digital.";
  }
}

export const getThomisticSynthesis = async (topic: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Realize uma síntese escolástica sobre: "${topic}". JSON Schema: { "title": string, "objections": string[], "sedContra": string, "respondeo": string, "replies": string[] }`,
        config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      return handleApiError(error);
    }
  });
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  return withRetry(async () => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Forneça 3 a 5 pontos curtos de reflexão para o texto: "${text}". JSON Schema: Array<string>`,
        config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "[]");
    } catch (error) {
      return handleApiError(error);
    }
  });
};
