
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma, Language, ThomisticArticle, UniversalSearchResult, CatechismHierarchy, DailyLiturgyContent } from "../types";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

// Utilitário para pausa (Backoff)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Wrapper resiliente para chamadas Gemini
async function generateWithRetry(config: any, retries = 3, backoff = 1500): Promise<any> {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent(config);
    return response;
  } catch (error: any) {
    // Se for erro de cota (429) e ainda houver tentativas
    if (error?.message?.includes('429') || error?.status === 429) {
      if (retries > 0) {
        console.warn(`Cota atingida. Tentando novamente em ${backoff}ms... (${retries} restantes)`);
        await sleep(backoff);
        return generateWithRetry(config, retries - 1, backoff * 2);
      }
    }
    throw error;
  }
}

const safeJsonParse = (text: string, fallback: any) => {
  try {
    if (!text) return fallback;
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1) return JSON.parse(clean.substring(start, end + 1));
    const arrayStart = clean.indexOf('[');
    const arrayEnd = clean.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1) return JSON.parse(clean.substring(arrayStart, arrayEnd + 1));
    return JSON.parse(clean || (Array.isArray(fallback) ? "[]" : "{}"));
  } catch (e) { return fallback; }
};

const ensureArray = (data: any): any[] => Array.isArray(data) ? data : [];

// CACHE LOGIC
const getCache = (key: string) => {
  const saved = localStorage.getItem(`cathedra_cache_${key}`);
  if (!saved) return null;
  const { data, expiry } = JSON.parse(saved);
  if (new Date().getTime() > expiry) {
    localStorage.removeItem(`cathedra_cache_${key}`);
    return null;
  }
  return data;
};

const setCache = (key: string, data: any, ttlHours = 12) => {
  const expiry = new Date().getTime() + (ttlHours * 60 * 60 * 1000);
  localStorage.setItem(`cathedra_cache_${key}`, JSON.stringify({ data, expiry }));
};

export const fetchRealBibleText = async (book: string, chapter: number, version: string, lang: Language = 'pt'): Promise<Verse[]> => {
  const cacheKey = `bible_${book}_${chapter}_${version}_${lang}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const isVulgata = version.toLowerCase().includes('vulgata');
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Retorne o texto exato de ${book} ${chapter} na versão ${version}. 
                 ${isVulgata ? 'IMPORTANTE: Use o texto da Biblia Sacra Vulgata.' : ''} 
                 Idioma: ${lang}. JSON array: [{ "book": "${book}", "chapter": ${chapter}, "verse": 1, "text": "..." }]`,
      config: { 
        systemInstruction: "Você é um bibliotecário do Vaticano perito em manuscritos.",
        responseMimeType: "application/json" 
      }
    });
    const result = ensureArray(safeJsonParse(response.text || "", []));
    if (result.length > 0) setCache(cacheKey, result, 24);
    return result;
  } catch (e) { return []; }
};

export const getDailyBundle = async (lang: Language = 'pt'): Promise<any> => {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `bundle_${today}_${lang}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Gere um bundle diário de conteúdo católico em ${lang}. 
                 Retorne JSON: {
                   "saint": { "name": "Nome do Santo", "image": "URL Unsplash de arte sacra" },
                   "gospel": { "reference": "Ref", "text": "Texto" }
                 }`,
      config: { responseMimeType: "application/json" }
    });
    const result = safeJsonParse(response.text || "", {});
    if (result.saint) setCache(cacheKey, result, 12);
    return result;
  } catch (e) { return { saint: { name: "Igreja Católica", image: "" }, gospel: { reference: "", text: "" } }; }
};

export const fetchDailyVerse = async (lang: Language = 'pt'): Promise<any> => {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `daily_verse_${today}_${lang}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Gere o versículo do dia em ${lang} com uma URL de imagem do Unsplash relacionada a catolicismo. 
                 Retorne JSON: { "verse": "texto", "reference": "ref", "imageUrl": "url" }`,
      config: { responseMimeType: "application/json" }
    });
    const result = safeJsonParse(response.text || "", {});
    if (result.verse) setCache(cacheKey, result, 12);
    return result;
  } catch (e) { return null; }
};

export const universalSearch = async (query: string, lang: Language = 'pt'): Promise<UniversalSearchResult[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Busque no Depósito da Fé: "${query}". Idioma: ${lang}.
                 Retorne JSON array: [{ "id": "${Math.random()}", "type": "verse|catechism|dogma", "title": "...", "snippet": "...", "source": { "name": "...", "code": "..." }, "relevance": 0.9 }]`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-pro-preview',
      contents: `Estudo teológico profundo sobre: "${topic}". Idioma: ${lang}.
                 Retorne JSON: {
                   "topic": "${topic}", "summary": "...",
                   "bibleVerses": [{ "book": "...", "chapter": 1, "verse": 1, "text": "..." }],
                   "catechismParagraphs": [{ "number": 1, "content": "..." }],
                   "magisteriumDocs": [], "saintsQuotes": []
                 }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { throw e; }
};

export const fetchLiturgyByDate = async (date: string, lang: Language = 'pt'): Promise<DailyLiturgyContent> => {
  const cacheKey = `liturgy_${date}_${lang}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Gere a Liturgia da Missa (Lectionarium) para ${date}. Idioma ${lang}.
                 Retorne JSON: { 
                   "date": "${date}",
                   "collect": "oração coleta", 
                   "firstReading": { "reference": "livro", "text": "texto" },
                   "psalm": { "title": "salmo", "text": "texto" },
                   "secondReading": { "reference": "livro", "text": "texto" },
                   "gospel": { "reference": "livro", "text": "texto", "reflection": "breve reflexão", "homily": "homilia", "calendar": { "color": "green|purple|white|red", "dayName": "nome", "cycle": "A|B|C", "rank": "Solenidade|Féria" } },
                   "saint": { "name": "nome", "image": "unsplash_url" }
                 }`,
      config: { systemInstruction: "Você é um liturgista perito no Missale Romanum.", responseMimeType: "application/json" }
    });
    const result = safeJsonParse(response.text || "", {});
    if (result.date) setCache(cacheKey, result, 48);
    return result;
  } catch (e) { throw e; }
};

export const fetchThomisticArticle = async (work: string, reference: string, lang: Language = 'pt'): Promise<ThomisticArticle> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-pro-preview',
      contents: `Recupere o Artigo da Summa Theologiae: "${reference}" (${work}). Idioma ${lang}.
                 Retorne JSON: { 
                   "reference": "${reference}",
                   "questionTitle": "...",
                   "articleTitle": "...",
                   "objections": [{ "id": 1, "text": "..." }],
                   "sedContra": "...", 
                   "respondeo": "...", 
                   "replies": [{ "id": 1, "text": "..." }]
                 }`,
      config: { systemInstruction: "Você é um bibliotecário do Angelicum.", responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { throw e; }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e) { return undefined; }
};

export const fetchLitanies = async (type: string, lang: Language = 'pt'): Promise<any> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Gere a ladainha: "${type}" em ${lang}. JSON: { "title": "...", "items": [{ "call": "...", "response": "..." }] }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { return { title: type, items: [] }; }
};

export const getDogmas = async (query: string): Promise<Dogma[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Liste dogmas católicos relacionados a: "${query}". JSON array: [{ "title": "...", "definition": "...", "council": "...", "year": "...", "period": "...", "tags": [] }]`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const getCatechismSearch = async (query: string, options: any = {}, lang: Language = 'pt'): Promise<CatechismParagraph[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Busque no Catecismo: "${query}". Idioma: ${lang}. JSON array: [{ "number": 1, "content": "...", "context": "..." }]`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const getCatechismHierarchy = async (parentId?: string, lang: Language = 'pt'): Promise<CatechismHierarchy[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Retorne a hierarquia do Catecismo ${parentId ? `sob o ID ${parentId}` : 'nível raiz'}. Idioma: ${lang}. JSON array: [{ "id": "...", "title": "...", "level": "part|section|chapter|article|paragraph", "number": "..." }]`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const fetchComparisonVerses = async (book: string, chapter: number, verse: number, versions: string[], lang: Language = 'pt'): Promise<Record<string, string>> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Compare ${book} ${chapter}:${verse} em: ${versions.join(', ')}. Idioma: ${lang}. JSON: { "Versão": "Texto" }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { return {}; }
};

export const getAIStudySuggestions = async (lang: Language = 'pt'): Promise<string[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Sugira 4 temas teológicos em ${lang}. JSON array de strings: ["Tema 1", "Tema 2", "Tema 3", "Tema 4"]`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const getSaintsList = async (): Promise<Saint[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Retorne uma lista de 12 santos católicos famosos. JSON array: [{ "name": "...", "feastDay": "...", "patronage": "...", "biography": "...", "image": "unsplash_url", "quote": "..." }]`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const getMagisteriumDocs = async (category: string, lang: Language = 'pt'): Promise<any[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Liste documentos do Magistério em "${category}". Idioma: ${lang}. JSON array: [{ "title": "...", "source": "...", "year": "...", "summary": "..." }]`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const fetchBreviaryHour = async (hour: string, lang: Language = 'pt'): Promise<any> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Gere o Ofício Divino para "${hour}" em ${lang}. JSON: { "hourName": "...", "invitatory": "...", "hymn": "...", "psalms": [{ "ref": "...", "text": "..." }], "prayer": "..." }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { return null; }
};

export const fetchDailyMass = async (lang: Language = 'pt'): Promise<any> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Ordinário da Missa em ${lang}. JSON: { "intro": { "antiphon": "...", "collect": "..." }, "word": { "firstReading": { "ref": "...", "text": "..." }, "psalm": { "text": "..." }, "gospel": { "ref": "...", "text": "..." } }, "eucharist": { "prayer": "..." } }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { return null; }
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `3 pontos de meditação para: "${text}". JSON array de strings.`,
      config: { responseMimeType: "application/json" }
    });
    return ensureArray(safeJsonParse(response.text || "", []));
  } catch (e) { return []; }
};

export const getDailyGospel = async (): Promise<Gospel> => {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `gospel_text_${today}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Retorne o Evangelho da missa de hoje (${today}). JSON: { "reference": "...", "text": "...", "reflection": "..." }`,
      config: { responseMimeType: "application/json" }
    });
    const result = safeJsonParse(response.text || "", {});
    if (result.text) setCache(cacheKey, result, 24);
    return result;
  } catch (e) { throw e; }
};

export const getMoralDiscernment = async (input: string, lang: Language = 'pt'): Promise<any> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-pro-preview',
      contents: `Discernimento moral sobre: "${input}". Idioma: ${lang}. JSON: { "gravity": "mortal|venial", "explanation": "...", "cicRef": "..." }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { return null; }
};

export async function* getTheologicalDialogueStream(message: string): AsyncIterable<string> {
  const ai = getAIInstance();
  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: message,
      config: {
        systemInstruction: "Você é S. Tomás de Aquino. Responda com rigor escolástico."
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) yield chunk.text;
    }
  } catch (e) {
    yield "O silêncio é a linguagem da eternidade, mas aqui ele se deve a uma sobrecarga em nossos arquivos. Por favor, aguarde um instante e tente novamente.";
  }
}

// Fix: Adicionando funções ausentes exportadas pelos componentes

/**
 * Busca hagiografia detalhada de um santo via IA.
 */
export const searchSaint = async (query: string): Promise<Saint> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Pesquise sobre o santo: "${query}". Retorne JSON: { "name": "...", "feastDay": "...", "patronage": "...", "biography": "...", "image": "unsplash_url", "quote": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

/**
 * Obtém links dogmáticos baseados em parágrafos do Catecismo.
 */
export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]): Promise<Record<number, Dogma[]>> => {
  const numbers = paragraphs.map(p => p.number).join(', ');
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Para os parágrafos do Catecismo ${numbers}, liste dogmas relacionados. Retorne JSON: { "número_do_parágrafo": [{ "title": "...", "definition": "..." }] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

/**
 * Gera análise profunda de documentos do Magistério.
 */
export const getMagisteriumDeepDive = async (title: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Análise profunda do documento do Magistério: "${title}". Idioma: ${lang}. 
               Retorne JSON: { 
                 "historicalContext": "...", 
                 "corePoints": ["..."], 
                 "modernApplication": "...", 
                 "relatedCatechism": ["..."] 
               }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

/**
 * Gera síntese teológica tomista (Summa Disputatio).
 */
export const getThomisticSynthesis = async (query: string): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Gere uma síntese tomista (Estilo Summa) sobre: "${query}". 
               Retorne JSON: { 
                 "title": "...", 
                 "objections": ["..."], 
                 "sedContra": "...", 
                 "respondeo": "...", 
                 "replies": ["..."] 
               }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

/**
 * Recupera comentário da Catena Aurea (Cadeia de Ouro).
 */
export const getCatenaAureaCommentary = async (verse: Verse): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Gere um comentário da Catena Aurea (Cadeia de Ouro) para ${verse.book} ${verse.chapter}:${verse.verse}. 
               Retorne JSON: { 
                 "content": "...", 
                 "fathers": ["..."], 
                 "sources": [{ "title": "...", "uri": "..." }] 
               }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

/**
 * Gera calendário litúrgico mensal completo.
 */
export const fetchMonthlyCalendar = async (month: number, year: number, lang: Language = 'pt'): Promise<LiturgyInfo[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Gere o calendário litúrgico completo para o mês ${month} de ${year}. Idioma: ${lang}. 
               Retorne JSON array: [{ 
                 "date": "YYYY-MM-DD", 
                 "color": "green|purple|white|red|rose|black", 
                 "season": "...", 
                 "rank": "...", 
                 "dayName": "...", 
                 "cycle": "A|B|C", 
                 "week": "...", 
                 "psalterWeek": "...", 
                 "isHolyDayOfObligation": false 
               }]`,
    config: { responseMimeType: "application/json" }
  });
  return ensureArray(safeJsonParse(response.text || "", []));
};
