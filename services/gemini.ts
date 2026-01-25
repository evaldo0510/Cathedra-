
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma, Language, ThomisticArticle, UniversalSearchResult, CatechismHierarchy, DailyLiturgyContent, QuizQuestion } from "../types";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWithRetry(config: any, retries = 3, backoff = 1500): Promise<any> {
  const ai = getAIInstance();
  try {
    return await ai.models.generateContent(config);
  } catch (error: any) {
    if ((error?.message?.includes('429') || error?.status === 429) && retries > 0) {
      await sleep(backoff);
      return generateWithRetry(config, retries - 1, backoff * 2);
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

export const fetchLiturgyByDate = async (date: string, lang: Language = 'pt'): Promise<{content: DailyLiturgyContent, sources: any[]}> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Pesquise as leituras bíblicas oficiais da Igreja Católica para o dia ${date}. Retorne o Missal completo. JSON: { "date": "${date}", "collect": "oração coleta", "firstReading": {"reference": "Ref", "text": "texto"}, "psalm": {"title": "refrão", "text": "versos"}, "gospel": {"reference": "Ref", "text": "texto", "homily": "homilia teológica", "calendar": {"dayName": "Nome", "rank": "Grau", "color": "green/red/white/purple", "cycle": "Ano"}}, "saint": {"name": "Nome", "image": "unsplash"} }`,
    config: { 
      systemInstruction: "Você é um mestre litúrgico. Use a busca para garantir que as leituras correspondam exatamente ao calendário litúrgico oficial (lecionário romano).",
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }] 
    }
  });

  const content = safeJsonParse(response.text || "", {});
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  return { content, sources };
};

export const fetchBibleChapterIA = async (book: string, chapter: number, lang: Language = 'pt'): Promise<Verse[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Transcreva INTEGRALMENTE todos os versículos de ${book}, capítulo ${chapter}, seguindo a tradução católica oficial. JSON array de versículos: [{"book": "${book}", "chapter": ${chapter}, "verse": 1, "text": "..."}]`,
      config: { 
        systemInstruction: "Você é um arquivista bíblico. Não resuma. Não pule versículos.",
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
    return safeJsonParse(response.text || "", []);
  } catch (e) { return []; }
};

export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Investigação Teológica sobre: "${topic}". JSON: { "topic": "...", "summary": "...", "bibleVerses": [], "catechismParagraphs": [], "magisteriumDocs": [], "saintsQuotes": [] }`,
    config: { 
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }]
    }
  });
  return safeJsonParse(response.text || "", {});
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Leia com solenidade e reverência: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    const partWithAudio = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData && p.inlineData.mimeType.includes('audio'));
    return partWithAudio?.inlineData?.data;
  } catch (e) { return undefined; }
};

export const getCatechismSearch = async (query: string, options: any = {}, lang: Language = 'pt'): Promise<CatechismParagraph[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Extraia parágrafos do CIC sobre: "${query}". JSON array: [{ "number": 1, "content": "..." }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getCatechismHierarchy = async (parentId?: string, lang: Language = 'pt'): Promise<CatechismHierarchy[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Estrutura do CIC partindo de: ${parentId || 'Início'}. JSON array: [{ "id": "...", "title": "...", "level": "part" }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const universalSearch = async (query: string, lang: Language = 'pt'): Promise<UniversalSearchResult[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Busca no Depósito da Fé: "${query}". JSON array: [{ "id": "1", "type": "verse", "title": "...", "snippet": "...", "source": { "name": "...", "code": "..." }, "relevance": 0.9 }]`,
    config: { responseMimeType: "application/json", tools: [{ googleSearch: {} }] }
  });
  return safeJsonParse(response.text || "", []);
};

export const fetchDailyVerse = async (lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Versículo do Dia inspirador. JSON: { "verse": "...", "reference": "...", "imageUrl": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getDailyBundle = async (lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Bundle devocional. JSON: { "saint": { "name": "...", "image": "...", "quote": "..." }, "gospel": { "reference": "...", "text": "..." } }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const fetchQuizQuestions = async (category: string, difficulty: string, lang: Language = 'pt'): Promise<QuizQuestion[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Quiz sobre "${category}" nível "${difficulty}". JSON array: [{ "id": "...", "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..." }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const fetchThomisticArticle = async (work: string, reference: string, lang: Language = 'pt'): Promise<ThomisticArticle> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Artigo de S. Tomás: "${reference}". JSON: { "reference": "...", "questionTitle": "...", "articleTitle": "...", "objections": [{"id": 1, "text": "..."}], "sedContra": "...", "respondeo": "...", "replies": [{"id": 1, "text": "..."}] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const fetchLitanies = async (type: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Ladainha: "${type}". JSON: { "title": "...", "items": [{ "call": "...", "response": "..." }] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getDogmas = async (query: string): Promise<Dogma[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Liste dogmas sobre: "${query}". JSON array: [{ "title": "...", "definition": "...", "council": "...", "year": "...", "period": "...", "tags": [] }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getAIStudySuggestions = async (lang: Language = 'pt'): Promise<string[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `4 temas teológicos para estudo. JSON array de strings.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getSaintsList = async (): Promise<Saint[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Liste 12 santos. JSON: [{ "name": "...", "feastDay": "...", "patronage": "...", "image": "unsplash" }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getMagisteriumDocs = async (category: string, lang: Language = 'pt'): Promise<any[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Documentos do Magistério: "${category}". JSON: [{ "title": "...", "source": "...", "year": "...", "summary": "..." }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getMoralDiscernment = async (input: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Análise Moral: "${input}". JSON: { "gravity": "mortal", "explanation": "...", "cicRef": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export async function* getTheologicalDialogueStream(message: string): AsyncIterable<string> {
  const ai = getAIInstance();
  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: message,
      config: { systemInstruction: "Você é S. Tomás de Aquino. Responda com rigor escolástico." }
    });
    for await (const chunk of responseStream) if (chunk.text) yield chunk.text;
  } catch (e) { yield "Erro na conexão sagrada."; }
}

export const searchSaint = async (query: string): Promise<Saint> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Hagiografia: "${query}". JSON: { "name": "...", "feastDay": "...", "patronage": "...", "biography": "...", "image": "unsplash", "quote": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getMagisteriumDeepDive = async (title: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Análise do documento: "${title}". JSON: { "historicalContext": "...", "corePoints": [], "modernApplication": "...", "relatedCatechism": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getThomisticSynthesis = async (query: string): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Síntese Tomista: "${query}". JSON: { "title": "...", "objections": [], "sedContra": "...", "respondeo": "...", "replies": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getCatenaAureaCommentary = async (verse: Verse): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Catena Aurea para ${verse.book} ${verse.chapter}:${verse.verse}. JSON: { "content": "...", "fathers": [], "sources": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const fetchMonthlyCalendar = async (month: number, year: number, lang: Language = 'pt'): Promise<LiturgyInfo[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Calendário litúrgico ${month}/${year}. JSON array: [{ "date": "YYYY-MM-DD", "color": "green", "dayName": "...", "rank": "...", "season": "...", "cycle": "...", "week": "...", "saints": [] }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getDailyGospel = async (): Promise<Gospel> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Evangelho de hoje. JSON: { "reference": "...", "text": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `3 pontos de meditação: "${text}". JSON array de strings.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const fetchBreviaryHour = async (hour: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Ofício (${hour}). JSON: { "hourName": "...", "invitatory": "...", "hymn": "...", "psalms": [{"ref": "...", "text": "..."}], "prayer": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const fetchDailyMass = async (lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Missa de hoje. JSON: { "intro": {"antiphon": "...", "collect": "..."}, "word": {"firstReading": {"ref": "...", "text": "..."}, "psalm": {"text": "..."}, "gospel": {"ref": "...", "text": "..."}}, "eucharist": {"prayer": "..."} }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};
