
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma, Language, ThomisticArticle, UniversalSearchResult, CatechismHierarchy, DailyLiturgyContent, QuizQuestion } from "../types";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// TESOURO ESTÁTICO - Fallback para funcionamento 90% offline
const STATIC_TREASURY = {
  verses: [
    { verse: "O Senhor é meu pastor, nada me faltará.", reference: "Salmos 23, 1", imageUrl: "https://images.unsplash.com/photo-1548610762-656391d1ad4d" },
    { verse: "Tudo posso Naquele que me fortalece.", reference: "Filipenses 4, 13", imageUrl: "https://images.unsplash.com/photo-1544033527-b192daee1f5b" },
    { verse: "O Verbo se fez carne e habitou entre nós.", reference: "João 1, 14", imageUrl: "https://images.unsplash.com/photo-1512403754473-27835f7b9984" },
    { verse: "Eu sou o Caminho, a Verdade e a Vida.", reference: "João 14, 6", imageUrl: "https://images.unsplash.com/photo-1543158021-00212008304f" }
  ],
  saints: [
    { name: "São Bento", quote: "Ora et Labora.", patronage: "Padroeiro da Europa" },
    { name: "Santa Teresinha", quote: "No coração da Igreja, serei o Amor.", patronage: "Padroeira das Missões" },
    { name: "Santo Agostinho", quote: "Fizeste-nos para Ti e o nosso coração está inquieto enquanto não repousa em Ti.", patronage: "Doutor da Graça" },
    { name: "São Tomás de Aquino", quote: "Para quem tem fé, nenhuma explicação é necessária.", patronage: "Doutor Angélico" }
  ]
};

const getStaticDaily = <T>(list: T[]): T => {
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return list[dayOfYear % list.length];
};

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
    return await ai.models.generateContent(config);
  } catch (error: any) {
    const errorMsg = error?.message?.toUpperCase() || "";
    const isQuota = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED');
    const isNetwork = errorMsg.includes('XHR ERROR') || errorMsg.includes('500');

    if ((isQuota || isNetwork) && retries > 0) {
      await sleep(backoff);
      return generateWithRetry(config, retries - 1, backoff * 2);
    }
    // Retorna null para sinalizar que o fallback deve ser usado
    return null;
  }
}

const safeJsonParse = (text: string, fallback: any) => {
  try {
    if (!text) return fallback;
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) { return fallback; }
};

export const fetchLiturgyByDate = async (date: string, lang: Language = 'pt'): Promise<{content: DailyLiturgyContent, sources: any[]}> => {
  const cacheKey = `liturgy_${date}_${lang}`;
  const cached = cacheHelper.get(cacheKey);
  if (cached) return cached;

  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Liturgia católica ${date}. JSON: { "date": "${date}", "collect": "...", "firstReading": {"reference": "...", "text": "..."}, "psalm": {"title": "...", "text": "..."}, "gospel": {"reference": "...", "text": "...", "homily": "...", "calendar": {"dayName": "...", "rank": "...", "color": "white", "cycle": "B", "season": "Tempo Comum"}} }`,
    config: { responseMimeType: "application/json" }
  });

  if (!response) {
    // Fallback estático para Lecionário (Dados genéricos de altar)
    const result = { 
      content: {
        date,
        collect: "Ó Deus, vinde em nosso auxílio.",
        firstReading: { reference: "Apocalipse 1, 1", text: "Leitura do Livro do Apocalipse. O Verbo de Deus é a luz do mundo." },
        psalm: { title: "O Senhor é minha luz e salvação", text: "A quem temerei?" },
        gospel: { reference: "João 1, 1", text: "No princípio era o Verbo.", homily: "A Palavra de Deus nos guia no silêncio.", calendar: { dayName: "Feria", rank: "Tempo Comum", color: "white", cycle: "B", season: "Hodie" } }
      },
      sources: []
    };
    return result;
  }

  const content = safeJsonParse(response.text || "", {});
  const result = { content, sources: [] };
  cacheHelper.set(cacheKey, result);
  return result;
};

export const fetchDailyVerse = async (lang: Language = 'pt'): Promise<any> => {
  const date = new Date().toISOString().split('T')[0];
  const cacheKey = `verse_${date}`;
  const cached = cacheHelper.get(cacheKey);
  if (cached) return cached;

  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Um versículo curto. JSON: { "verse": "...", "reference": "...", "imageUrl": "..." }`,
    config: { responseMimeType: "application/json" }
  });

  const data = response ? safeJsonParse(response.text || "", getStaticDaily(STATIC_TREASURY.verses)) : getStaticDaily(STATIC_TREASURY.verses);
  cacheHelper.set(cacheKey, data);
  return data;
};

export const getDailyBundle = async (lang: Language = 'pt'): Promise<any> => {
  const date = new Date().toISOString().split('T')[0];
  const cacheKey = `bundle_${date}`;
  const cached = cacheHelper.get(cacheKey);
  if (cached) return cached;

  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Santo do dia ${date}. JSON: { "saint": { "name": "...", "quote": "..." }, "gospel": { "reference": "..." } }`,
    config: { responseMimeType: "application/json" }
  });

  const staticSaint = getStaticDaily(STATIC_TREASURY.saints);
  const data = response ? safeJsonParse(response.text || "", { saint: staticSaint, gospel: { reference: "Mt 1, 1" } }) : { saint: staticSaint, gospel: { reference: "Mt 1, 1" } };
  cacheHelper.set(cacheKey, data);
  return data;
};

// Funções de IA - Mantidas com tratamento de erro mas focadas em análise profunda
export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Análise Teológica: "${topic}". JSON: { "topic": "...", "summary": "...", "bibleVerses": [], "catechismParagraphs": [], "magisteriumDocs": [], "saintsQuotes": [] }`,
    config: { responseMimeType: "application/json", tools: [{ googleSearch: {} }] }
  });
  if (!response) throw new Error("A conexão com a inteligência foi interrompida.");
  return safeJsonParse(response.text || "", {});
};

export const universalSearch = async (query: string, lang: Language = 'pt'): Promise<UniversalSearchResult[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Busca: "${query}". JSON array: [{ "id": "1", "type": "verse", "title": "...", "snippet": "...", "source": { "name": "...", "code": "..." }, "relevance": 0.9 }]`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const fetchQuizQuestions = async (category: string, difficulty: string, lang: Language = 'pt'): Promise<QuizQuestion[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Quiz: "${category}". JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const fetchBibleChapterIA = async (book: string, chapter: number, lang: Language = 'pt'): Promise<Verse[]> => {
  const cacheKey = `bible_${book}_${chapter}`;
  const cached = cacheHelper.get(cacheKey);
  if (cached) return cached;

  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Transcreva ${book} ${chapter}. JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  const verses = response ? safeJsonParse(response.text || "", []) : [];
  if (verses.length > 0) cacheHelper.set(cacheKey, verses, 720);
  return verses;
};

// ... Restante das funções auxiliares ...
export const fetchMonthlyCalendar = async (month: number, year: number, lang: Language = 'pt'): Promise<LiturgyInfo[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Calendário ${month}/${year}. JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
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

export const getCatechismSearch = async (query: string, options: any = {}, lang: Language = 'pt'): Promise<CatechismParagraph[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `CIC sobre "${query}". JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const getCatechismHierarchy = async (parentId?: string, lang: Language = 'pt'): Promise<CatechismHierarchy[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Estrutura CIC ${parentId}. JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const fetchThomisticArticle = async (work: string, reference: string, lang: Language = 'pt'): Promise<ThomisticArticle> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `S. Tomás ${reference}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const fetchLitanies = async (type: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Ladainha ${type}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getDogmas = async (query: string): Promise<Dogma[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Dogmas "${query}". JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const getAIStudySuggestions = async (lang: Language = 'pt'): Promise<string[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `4 temas teológicos. JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const getSaintsList = async (): Promise<Saint[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `12 santos. JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const getMagisteriumDocs = async (category: string, lang: Language = 'pt'): Promise<any[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Docs ${category}. JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const getMoralDiscernment = async (input: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Moral "${input}". JSON.`,
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
  } catch (e) { yield "A conexão com a Suma falhou devido ao limite de cota."; }
}

export const searchSaint = async (query: string): Promise<Saint> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Hagiografia ${query}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getMagisteriumDeepDive = async (title: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Análise ${title}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getThomisticSynthesis = async (query: string): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Sintese tomista "${query}". JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getCatenaAureaCommentary = async (verse: Verse): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Catena Aurea ${verse.book} ${verse.chapter}:${verse.verse}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getDailyGospel = async (): Promise<Gospel> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Evangelho. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", { reference: "João 1, 1", text: "No princípio era o Verbo." }) : { reference: "João 1, 1", text: "No princípio era o Verbo." };
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `3 pontos Lectio: "${text}". JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", ["Medite na grandeza de Deus.", "O Verbo habita em nós.", "A Palavra é alimento."]) : ["Medite na grandeza de Deus.", "O Verbo habita em nós.", "A Palavra é alimento."];
};

export const fetchBreviaryHour = async (hour: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Ofício ${hour}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const fetchDailyMass = async (lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Missa. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};
