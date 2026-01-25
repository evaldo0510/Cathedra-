
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

/**
 * EXTRAÇÃO DE TEXTO BÍBLICO INTEGRAL VIA IA
 * Otimizado para máxima fidelidade e contorno de recusas automáticas.
 */
export const fetchBibleChapterIA = async (book: string, chapter: number, lang: Language = 'pt'): Promise<Verse[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Transcreva INTEGRALMENTE todos os versículos de ${book}, capítulo ${chapter}, seguindo a tradução católica oficial (como Ave Maria ou CNBB) em ${lang}. 
                 Você deve retornar o texto sacro exatamente como consta nos manuscritos oficiais, sem resumos ou paráfrases. 
                 Retorne obrigatoriamente em formato JSON array de versículos.`,
      config: { 
        systemInstruction: "Você é um arquivista bíblico erudito e fiel do Vaticano. Seu objetivo é fornecer transcrições exatas e completas de textos das Sagradas Escrituras para fins de oração e estudo teológico. Não omita versículos.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              book: { type: Type.STRING },
              chapter: { type: Type.INTEGER },
              verse: { type: Type.INTEGER },
              text: { type: Type.STRING }
            },
            required: ["book", "chapter", "verse", "text"]
          }
        },
        temperature: 0.1
      }
    });
    
    const parsed = safeJsonParse(response.text || "", []);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error("Erro na extração IA:", e);
    return [];
  }
};

export const universalSearch = async (query: string, lang: Language = 'pt'): Promise<UniversalSearchResult[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Busque no Depósito da Fé (Escritura, Catecismo, Dogmas, Santos): "${query}". Idioma: ${lang}. JSON array: [{ "id": "1", "type": "verse", "title": "...", "snippet": "...", "source": { "name": "...", "code": "..." }, "relevance": 0.9 }]`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", []);
  } catch (e) { return []; }
};

export const fetchDailyVerse = async (lang: Language = 'pt'): Promise<any> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Providencie um Versículo do Dia inspirador em ${lang}. JSON: { "verse": "...", "reference": "...", "imageUrl": "..." }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { return null; }
};

export const getDailyBundle = async (lang: Language = 'pt'): Promise<any> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Bundle devocional diário em ${lang}. JSON: { "saint": { "name": "...", "image": "...", "quote": "..." }, "gospel": { "reference": "...", "text": "..." } }`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (e) { return null; }
};

export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Realize uma Investigação Teológica Relacional sobre: "${topic}". Conecte Escritura, Tradição e Magistério. Idioma: ${lang}. JSON: { "topic": "...", "summary": "...", "bibleVerses": [], "catechismParagraphs": [], "magisteriumDocs": [], "saintsQuotes": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Leia com solenidade e reverência sagrada: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    const partWithAudio = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData && p.inlineData.mimeType.includes('audio'));
    return partWithAudio?.inlineData?.data;
  } catch (e) { return undefined; }
};

export const fetchLiturgyByDate = async (date: string, lang: Language = 'pt'): Promise<DailyLiturgyContent> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Liturgia para ${date}. JSON: { "date": "${date}", "collect": "...", "firstReading": {"reference": "...", "text": "..."}, "psalm": {"title": "...", "text": "..."}, "gospel": {"reference": "...", "text": "...", "calendar": {"dayName": "...", "rank": "...", "color": "...", "cycle": "..."}}, "saint": {"name": "...", "image": "..."} }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const fetchQuizQuestions = async (category: string, difficulty: string, lang: Language = 'pt'): Promise<QuizQuestion[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Gere 5 perguntas desafiadoras de quiz sobre "${category}" no nível "${difficulty}" em ${lang}. JSON array: [{ "id": "...", "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..." }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const fetchThomisticArticle = async (work: string, reference: string, lang: Language = 'pt'): Promise<ThomisticArticle> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Artigo Escolástico de S. Tomás: "${reference}". JSON: { "reference": "...", "questionTitle": "...", "articleTitle": "...", "objections": [{"id": 1, "text": "..."}], "sedContra": "...", "respondeo": "...", "replies": [{"id": 1, "text": "..."}] }`,
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
    contents: `Liste dogmas católicos sobre: "${query}". JSON array: [{ "title": "...", "definition": "...", "council": "...", "year": "...", "period": "...", "tags": [] }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getCatechismSearch = async (query: string, options: any = {}, lang: Language = 'pt'): Promise<CatechismParagraph[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Busque no Catecismo da Igreja Católica (CIC): "${query}". JSON array: [{ "number": 1, "content": "...", "context": "..." }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getCatechismHierarchy = async (parentId?: string, lang: Language = 'pt'): Promise<CatechismHierarchy[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Estrutura do CIC ${parentId || 'raiz'}. JSON array: [{ "id": "...", "title": "...", "level": "part" }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getAIStudySuggestions = async (lang: Language = 'pt'): Promise<string[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Sugira 4 temas teológicos profundos para estudo em ${lang}. JSON array de strings.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getSaintsList = async (): Promise<Saint[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Liste 12 santos e beatos católicos. JSON: [{ "name": "...", "feastDay": "...", "patronage": "...", "image": "unsplash_url" }]`,
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
      config: { systemInstruction: "Você é S. Tomás de Aquino, o Doutor Angélico. Responda com rigor escolástico e clareza pastoral." }
    });
    for await (const chunk of responseStream) if (chunk.text) yield chunk.text;
  } catch (e) { yield "Sobrecarga nos canais do Vaticano. Tente em instantes."; }
}

export const searchSaint = async (query: string): Promise<Saint> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Hagiografia completa: "${query}". JSON: { "name": "...", "feastDay": "...", "patronage": "...", "biography": "...", "image": "unsplash_url", "quote": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]): Promise<Record<number, Dogma[]>> => {
  const numbers = paragraphs.map(p => p.number).join(', ');
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Conecte os seguintes parágrafos do CIC (${numbers}) a Dogmas de Fé. JSON: { "número_parágrafo": [{"title": "...", "definition": "..."}] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getMagisteriumDeepDive = async (title: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Análise profunda do documento: "${title}". JSON: { "historicalContext": "...", "corePoints": [], "modernApplication": "...", "relatedCatechism": [] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getThomisticSynthesis = async (query: string): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Síntese Tomista sobre: "${query}". JSON: { "title": "...", "objections": [], "sedContra": "...", "respondeo": "...", "replies": [] }`,
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
    contents: `Calendário litúrgico católico para ${month}/${year}. JSON array: [{ "date": "YYYY-MM-DD", "color": "green", "dayName": "...", "rank": "...", "season": "...", "cycle": "...", "week": "...", "saints": [] }]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getDailyGospel = async (): Promise<Gospel> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Evangelho da Missa de hoje. JSON: { "reference": "...", "text": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `3 pontos de meditação profunda para este texto: "${text}". JSON array de strings.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const fetchBreviaryHour = async (hour: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Ofício da Liturgia das Horas (${hour}). JSON: { "hourName": "...", "invitatory": "...", "hymn": "...", "psalms": [{"ref": "...", "text": "..."}], "prayer": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const fetchDailyMass = async (lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Ordo Missae de hoje em ${lang}. JSON: { "intro": {"antiphon": "...", "collect": "..."}, "word": {"firstReading": {"ref": "...", "text": "..."}, "psalm": {"text": "..."}, "gospel": {"ref": "...", "text": "..."}}, "eucharist": {"prayer": "..."} }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};
