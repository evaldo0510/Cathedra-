
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma, Language, ThomisticArticle, UniversalSearchResult, CatechismHierarchy, DailyLiturgyContent, QuizQuestion } from "../types";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const cacheHelper = {
  get: (key: string) => {
    try {
      const cached = localStorage.getItem(`cathedra_cache_${key}`);
      if (!cached) return null;
      const { data, expiry } = JSON.parse(cached);
      if (new Date().getTime() > expiry) return null;
      return data;
    } catch (e) { return null; }
  },
  set: (key: string, data: any, ttlHours: number = 24) => {
    try {
      const expiry = new Date().getTime() + (ttlHours * 60 * 60 * 1000);
      localStorage.setItem(`cathedra_cache_${key}`, JSON.stringify({ data, expiry }));
    } catch (e) {}
  }
};

async function generateWithRetry(config: any, retries = 2, backoff = 1000): Promise<any> {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent(config);
    return response;
  } catch (error: any) {
    const errorMsg = error?.message?.toUpperCase() || "";
    const isQuota = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED');
    if (isQuota && retries > 0) {
      await sleep(backoff);
      return generateWithRetry(config, retries - 1, backoff * 2);
    }
    return null;
  }
}

const safeJsonParse = (text: string, fallback: any) => {
  try {
    if (!text) return fallback;
    // Limpeza profunda de markdown e espaços invisíveis
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);
    return parsed || fallback;
  } catch (e) { 
    console.warn("Falha no parse de JSON da IA:", e);
    return fallback; 
  }
};

export const fetchLiturgyByDate = async (date: string, lang: Language = 'pt'): Promise<{content: DailyLiturgyContent, sources: any[]}> => {
  const cacheKey = `liturgy_${date}_${lang}`;
  const cached = cacheHelper.get(cacheKey);
  if (cached) return cached;

  const defaultContent: DailyLiturgyContent = { 
    date,
    collect: "Deus eterno e todo-poderoso, que governais o céu e a terra, escutai com bondade as preces do vosso povo.",
    firstReading: { reference: "Leitura do Dia", text: "Estamos recuperando a leitura sagrada para esta data. Por favor, tente novamente em instantes ou verifique sua conexão." },
    psalm: { title: "Salmo Responsorial", text: "O Senhor é o meu Pastor, nada me faltará." },
    gospel: { 
      reference: "Evangelho", 
      text: "Em verdade, em verdade vos digo: quem ouve a minha palavra e crê naquele que me enviou, tem a vida eterna.",
      reflection: "A liturgia é o encontro do tempo com a eternidade. Medite no silêncio do seu coração.",
      calendar: {
        dayName: "Féria ou Memória",
        rank: "Féria",
        color: "white",
        cycle: "Impar/Par",
        season: "Tempo Comum"
      }
    }
  };

  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Retorne a Liturgia Católica Apostólica Romana para o dia ${date}. Responda APENAS o JSON rigoroso.
    Formato:
    {
      "date": "${date}",
      "collect": "Oração...",
      "firstReading": {"reference": "Ref", "text": "Texto"},
      "psalm": {"title": "Salmo X", "text": "Texto"},
      "gospel": {
        "reference": "Evangelho X", 
        "text": "Texto", 
        "reflection": "Breve reflexão teológica",
        "calendar": { "dayName": "Nome", "rank": "Solenidade|Féria", "color": "green|purple|white|red", "cycle": "A|B|C", "season": "Tempo" }
      }
    }`,
    config: { responseMimeType: "application/json" }
  });

  const content = response ? safeJsonParse(response.text || "", defaultContent) : defaultContent;
  
  // Mesclagem profunda para garantir que sub-objetos (calendar, readings) nunca sejam undefined
  const finalContent: DailyLiturgyContent = {
    ...defaultContent,
    ...content,
    firstReading: { ...defaultContent.firstReading, ...(content.firstReading || {}) },
    psalm: { ...defaultContent.psalm, ...(content.psalm || {}) },
    gospel: { 
      ...defaultContent.gospel, 
      ...(content.gospel || {}),
      calendar: { ...defaultContent.gospel.calendar, ...(content.gospel?.calendar || {}) }
    }
  };

  const result = { content: finalContent, sources: [] };
  if (response) cacheHelper.set(cacheKey, result);
  return result;
};

export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Analise o tema: "${topic}". Retorne JSON com summary, bibleVerses[], catechismParagraphs[], magisteriumDocs[], saintsQuotes[].`,
    config: { responseMimeType: "application/json", tools: [{ googleSearch: {} }] }
  });
  if (!response) throw new Error("A conexão com a inteligência foi interrompida.");
  return safeJsonParse(response.text || "", {});
};

export const universalSearch = async (query: string, lang: Language = 'pt'): Promise<UniversalSearchResult[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Busca Universal: "${query}". Retorne array JSON de resultados teológicos.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const fetchDailyVerse = async (lang: Language = 'pt'): Promise<any> => {
  const date = new Date().toISOString().split('T')[0];
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Versículo do dia ${date}. JSON: { "verse": "...", "reference": "...", "imageUrl": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getDailyBundle = async (lang: Language = 'pt'): Promise<any> => {
  const date = new Date().toISOString().split('T')[0];
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Santo e Evangelho do dia ${date}. JSON: { "saint": { "name": "...", "quote": "..." }, "gospel": { "reference": "..." } }`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", { saint: { name: 'São Bento', quote: 'Ora et Labora' }, gospel: { reference: 'Mt 1' } }) : {};
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Leia com voz solene: ${text}` }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } },
    });
    return response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
  } catch (e) { return undefined; }
};

export const getAIStudySuggestions = async (lang: Language = 'pt'): Promise<string[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Gere 5 temas de estudo católico. JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const fetchQuizQuestions = async (category: string, difficulty: string, lang: Language = 'pt'): Promise<QuizQuestion[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Gerar 5 perguntas de quiz sobre ${category}. JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const fetchBibleChapterIA = async (book: string, chapter: number, lang: Language = 'pt'): Promise<Verse[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Retorne versículos de ${book} ${chapter}. JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const fetchMonthlyCalendar = async (month: number, year: number, lang: Language = 'pt'): Promise<LiturgyInfo[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Calendário litúrgico ${month}/${year}. JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const fetchThomisticArticle = async (work: string, reference: string, lang: Language = 'pt'): Promise<ThomisticArticle> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Artigo ${work} ${reference}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {} as ThomisticArticle;
};

export const fetchLitanies = async (type: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Ladainha: ${type}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getDogmas = async (query: string): Promise<Dogma[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Dogmas sobre "${query}". JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const getSaintsList = async (): Promise<Saint[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Lista de santos. JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const getMagisteriumDocs = async (category: string, lang: Language = 'pt'): Promise<any[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Docs Magistério ${category}. JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const getMagisteriumDeepDive = async (title: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Análise doc "${title}". JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getThomisticSynthesis = async (query: string): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Síntese tomista sobre "${query}". JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getCatenaAureaCommentary = async (verse: Verse): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Catena Aurea para ${verse.book} ${verse.chapter}:${verse.verse}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getDailyGospel = async (): Promise<Gospel> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Evangelho hoje. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : { reference: "Jo 1", text: "O Verbo se fez carne." };
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `3 pontos Lectio Divina para: "${text}". JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const fetchBreviaryHour = async (hour: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Ofício - Hora: ${hour}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getMoralDiscernment = async (input: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Moral: "${input}". JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export async function* getTheologicalDialogueStream(message: string): AsyncIterable<string> {
  const ai = getAIInstance();
  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: message,
      config: { systemInstruction: "Você é S. Tomás de Aquino." }
    });
    for await (const chunk of stream) if (chunk.text) yield chunk.text;
  } catch (e) { yield "A conexão falhou."; }
}

export const searchSaint = async (query: string): Promise<Saint> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Hagiografia "${query}". JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {} as Saint;
};
