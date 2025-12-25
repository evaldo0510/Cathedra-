
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, Dogma, CatechismParagraph, LiturgyInfo, LiturgyReading } from "../types";

const CACHE_KEYS = {
  SAINT_DAILY: 'cathedra_daily_saint',
  GOSPEL: 'cathedra_daily_gospel',
  WEEKLY_CALENDAR: 'cathedra_weekly_calendar',
  DOGMAS_BASE: 'cathedra_base_dogmas',
  DATE: 'cathedra_cache_date',
  SEARCH_PREFIX: 'cathedra_search_',
  AQUINAS_PREFIX: 'cathedra_aquinas_'
};

const SYSTEM_INSTRUCTION = `Você é o Cathedra AI, uma inteligência teológica de elite.
Sua missão é fornecer informações precisas sobre a fé Católica, baseada no Magistério, Sagrada Escritura e Tradição.
REGRAS:
1. Retorne APENAS JSON puro quando solicitado.
2. Grounding: Sempre use Google Search para Liturgia Diária e notícias recentes da Igreja.
3. Imagens de Santos: Para o campo "image", retorne sempre uma URL do Unsplash no formato: https://source.unsplash.com/featured/?catholic,saint,[NOME_DO_SANTO] ou uma busca relevante de arte sacra.
4. Rigor: Ao citar comentários, prefira Santo Agostinho, São Tomás de Aquino e o Catecismo.`;

/**
 * Busca a Liturgia da Palavra de hoje usando Google Search e Gemini.
 */
export const getDailyGospel = async (): Promise<Gospel> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date().toLocaleDateString('pt-BR');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Pesquise a Liturgia da Palavra Completa de hoje (${today}). Retorne um JSON seguindo este esquema: { "reference": string, "text": string, "reflection": string, "firstReading": { "title": string, "reference": string, "text": string }, "psalm": { "title": string, "reference": string, "text": string }, "secondReading": { "title": string, "reference": string, "text": string }, "calendar": { "color": string, "season": string, "rank": string, "dayName": string, "cycle": string, "week": string } }`,
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION, 
      tools: [{ googleSearch: {} }], 
      responseMimeType: "application/json" 
    }
  });
  return JSON.parse(response.text || "{}");
};

/**
 * Realiza um estudo inteligente cruzando Escritura, Tradição e Magistério.
 */
export const getIntelligentStudy = async (topic: string): Promise<StudyResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Realize um estudo teológico profundo sobre: "${topic}". Analise as conexões entre Bíblia, Catecismo e Magistério. JSON Schema: { "topic": string, "summary": string, "bibleVerses": [{"book": string, "chapter": number, "verse": number, "text": string}], "catechismParagraphs": [{"number": number, "content": string}], "magisteriumDocs": [{"title": string, "content": string, "source": string}], "saintsQuotes": [{"saint": string, "quote": string}] }`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  const result = JSON.parse(response.text || "{}");
  
  // Salvar no histórico local
  const history = JSON.parse(localStorage.getItem('cathedra_history') || '[]');
  const newHistory = [result, ...history.filter((h: any) => h.topic !== result.topic)].slice(0, 20);
  localStorage.setItem('cathedra_history', JSON.stringify(newHistory));
  
  return result;
};

/**
 * Transforma texto em áudio solene (Base64).
 */
export const generateSpeech = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Leia solenemente: ${text}` }] }],
    config: { 
      responseModalities: [Modality.AUDIO], 
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
    }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

/**
 * Identifica o Santo do Dia.
 */
export const getDailySaint = async (): Promise<Saint> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Identifique o santo celebrado hoje. Forneça biografia e imagem. JSON Schema: { "name": string, "feastDay": string, "patronage": string, "biography": string, "image": string, "quote": string }`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

/**
 * Gera uma lista de grandes Santos.
 */
export const getSaintsList = async (): Promise<Saint[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: "Gere uma lista de 6 grandes santos da Igreja. JSON: Array<{ \"name\": string, \"feastDay\": string, \"patronage\": string, \"biography\": string, \"image\": string, \"quote\": string }>", 
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" } 
  });
  return JSON.parse(res.text || "[]");
};

/**
 * Busca uma citação diária inspiradora.
 */
export const getDailyQuote = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: "Citação profunda de um santo para hoje. JSON: { \"quote\": string, \"author\": string }", 
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" } 
  });
  return JSON.parse(res.text || "{}");
};

/**
 * Gera o calendário litúrgico semanal.
 */
export const getWeeklyCalendar = async (): Promise<LiturgyInfo[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: "Calendário litúrgico próximos 7 dias. JSON: Array<{ \"color\": string, \"season\": string, \"rank\": string, \"dayName\": string, \"cycle\": string, \"week\": string, \"date\": string }>", 
    config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" } 
  });
  return JSON.parse(res.text || "[]");
};

/**
 * Busca um versículo bíblico por tema ou referência.
 */
export const searchVerse = async (query: string): Promise<Verse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Encontre o versículo bíblico mais relevante para: "${query}".`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          book: { type: Type.STRING },
          chapter: { type: Type.NUMBER },
          verse: { type: Type.NUMBER },
          text: { type: Type.STRING }
        },
        required: ['book', 'chapter', 'verse', 'text']
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

/**
 * Gera comentário exegético para um versículo específico.
 */
export const getVerseCommentary = async (verse: Verse): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça um comentário exegético e teológico católico para o versículo: ${verse.book} ${verse.chapter}:${verse.verse} - "${verse.text}". Cite grandes santos e doutores da Igreja.`,
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });
  return response.text || "";
};

/**
 * Pesquisa no Catecismo da Igreja Católica.
 */
export const getCatechismSearch = async (query: string): Promise<CatechismParagraph[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busque no Catecismo da Igreja Católica parágrafos sobre: "${query}".`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            number: { type: Type.NUMBER },
            content: { type: Type.STRING }
          },
          required: ['number', 'content']
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

/**
 * Identifica dogmas relacionados a parágrafos do Catecismo.
 */
export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]): Promise<Record<number, Dogma[]>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const numbers = paragraphs.map(p => p.number).join(', ');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Relacione dogmas aos parágrafos do CIC: ${numbers}.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            paragraphNumber: { type: Type.NUMBER },
            dogmas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  council: { type: Type.STRING },
                  year: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['title', 'definition', 'council', 'year', 'tags']
              }
            }
          },
          required: ['paragraphNumber', 'dogmas']
        }
      }
    }
  });
  
  const data: {paragraphNumber: number, dogmas: Dogma[]}[] = JSON.parse(response.text || "[]");
  const result: Record<number, Dogma[]> = {};
  data.forEach(item => {
    result[item.paragraphNumber] = item.dogmas;
  });
  return result;
};

/**
 * Busca documentos do Magistério por categoria.
 */
export const getMagisteriumDocs = async (category: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Liste documentos do Magistério na categoria: "${category}".`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            source: { type: Type.STRING },
            content: { type: Type.STRING },
            year: { type: Type.STRING }
          },
          required: ['title', 'source', 'content', 'year']
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

/**
 * Lista dogmas da Igreja, opcionalmente filtrados por busca.
 */
export const getDogmas = async (query?: string): Promise<Dogma[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = query ? `Liste dogmas católicos relacionados a: "${query}".` : "Liste os principais dogmas da Igreja Católica.";
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            definition: { type: Type.STRING },
            council: { type: Type.STRING },
            year: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            period: { type: Type.STRING },
            sourceUrl: { type: Type.STRING }
          },
          required: ['title', 'definition', 'council', 'year', 'tags']
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

/**
 * Diálogo teológico em streaming (Colloquium).
 */
export async function* getTheologicalDialogueStream(message: string): AsyncGenerator<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: message,
    config: { systemInstruction: "Você é um mestre de teologia escolástica e apologética. Responda com rigor teológico, citando as fontes da Tradição." }
  });

  for await (const chunk of response) {
    yield chunk.text || "";
  }
}

/**
 * Realiza uma síntese tomista (Artigo da Suma).
 */
export const getThomisticSynthesis = async (topic: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Realize uma síntese tomista sobre: "${topic}".`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          objections: { type: Type.ARRAY, items: { type: Type.STRING } },
          sedContra: { type: Type.STRING },
          respondeo: { type: Type.STRING },
          replies: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['title', 'objections', 'sedContra', 'respondeo', 'replies']
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

/**
 * Gera pontos de meditação para Lectio Divina.
 */
export const getLectioPoints = async (text: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere 3 a 5 pontos de meditação orante para este texto: "${text}".`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};
