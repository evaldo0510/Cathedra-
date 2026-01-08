
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma, Language } from "../types";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = (lang: Language) => 
  `Cathedra: Responda APENAS JSON. Rigor católico. Idioma: ${lang}.`;

export const DEFAULT_BUNDLE = {
  gospel: { 
    reference: "", text: "", reflection: "", title: "", 
    calendar: { color: "white", season: "Tempo Comum", rank: "Feria", dayName: "Sincronizando...", cycle: "", week: "" }
  },
  saint: { name: "", feastDay: "", patronage: "", biography: "", image: "", quote: "" },
  quote: { quote: "", author: "" },
  insight: ""
};

const safeJsonParse = (text: string, fallback: any) => {
  try {
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(clean.substring(start, end + 1));
    }
    return JSON.parse(clean || (Array.isArray(fallback) ? "[]" : "{}"));
  } catch (e) {
    return fallback;
  }
};

export const getDailyBundle = async (lang: Language = 'pt'): Promise<{ gospel: Gospel, saint: Saint, quote: { quote: string, author: string }, insight: string }> => {
  try {
    const ai = getAIInstance();
    const today = new Date().toLocaleDateString('pt-BR');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `JSON HOJE ${today}: {gospel:{ref,text,reflection,title,calendar:{color,season,rank,dayName,cycle,week}},saint:{name,feastDay,patronage,biography,image,quote},quote:{quote,author},insight}`,
      config: { 
        systemInstruction: getSystemInstruction(lang), 
        responseMimeType: "application/json",
        temperature: 0
      }
    });
    return safeJsonParse(response.text || "", DEFAULT_BUNDLE);
  } catch (error) {
    return DEFAULT_BUNDLE;
  }
};

export const fetchRealBibleText = async (book: string, chapter: number, lang: Language = 'pt'): Promise<Verse[]> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `JSON ARRAY: ${book} ${chapter}. [{book,chapter,verse,text}]`,
      config: { 
        responseMimeType: "application/json",
        temperature: 0
      }
    });
    return safeJsonParse(response.text || "", []);
  } catch (e) { return []; }
};

export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Estudo: "${topic}". JSON: {summary, bibleVerses, catechismParagraphs, magisteriumDocs, saintsQuotes}.`,
    config: { 
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json" 
    }
  });
  return safeJsonParse(response.text || "", { topic, summary: "Erro.", bibleVerses: [], catechismParagraphs: [], magisteriumDocs: [], saintsQuotes: [] });
};

export const searchVerse = async (query: string, book?: string, chapter?: number, verse?: number, lang: Language = 'pt'): Promise<Verse[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busca: "${query}". JSON ARRAY.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const getCatenaAureaCommentary = async (verse: Verse, lang: Language = 'pt'): Promise<{ content: string, fathers: string[], sources: { title: string; uri: string }[] }> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Catena Aurea ${verse.book} ${verse.chapter}:${verse.verse}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", { content: "Indisponível.", fathers: [], sources: [] });
};

export const getDailyGospel = async (): Promise<Gospel> => {
  const bundle = await getDailyBundle();
  return bundle.gospel;
};

export const getWeeklyCalendar = async (lang: Language = 'pt'): Promise<LiturgyInfo[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `7 dias. JSON ARRAY.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getSaintsList = async (): Promise<Saint[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "4 santos. JSON ARRAY.",
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const searchSaint = async (name: string): Promise<Saint | null> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Santo: "${name}". JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", null);
};

export const getCatechismSearch = async (query: string, filters: any = {}, lang: Language = 'pt'): Promise<CatechismParagraph[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `CIC: "${query}". JSON ARRAY.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]): Promise<Record<number, Dogma[]>> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Dogmas CIC ${paragraphs.map(p => p.number).join(',')}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getMagisteriumDocs = async (category: string): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `3 docs: "${category}". JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getDogmas = async (query: string): Promise<Dogma[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Dogmas: "${query}". JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export async function* getTheologicalDialogueStream(message: string) {
  const ai = getAIInstance();
  const stream = await ai.models.generateContentStream({
    model: 'gemini-3-pro-preview',
    contents: message,
    config: { systemInstruction: "Teólogo católico fiel." }
  });
  for await (const chunk of stream) {
    yield chunk.text || "";
  }
}

export const getThomisticSynthesis = async (topic: string): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Suma: "${topic}". JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", { title: topic, objections: [], sedContra: "", respondeo: "", replies: [] });
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `3 pontos Lectio: "${text}". JSON ARRAY.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getAIStudySuggestions = async (lang: Language = 'pt'): Promise<string[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `4 temas teologia. JSON ARRAY.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};
