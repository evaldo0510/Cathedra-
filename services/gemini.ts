
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma } from "../types";

const SYSTEM_INSTRUCTION = "Você é o Cathedra AI, um especialista em hagiografia e teologia católica. Seu objetivo é realizar investigações profundas correlacionando a Sagrada Escritura, o Catecismo, o Magistério e a Tradição dos Santos. " +
"Sempre retorne apenas JSON puro seguindo rigorosamente o esquema fornecido. Nunca use blocos de código markdown. " +
"Garanta precisão doutrinária e referências canônicas exatas.";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const DEFAULT_BUNDLE = {
  gospel: { 
    reference: "Lc 1, 1", 
    text: "Aguardando a luz da Palavra...", 
    reflection: "Prepare o coração para a leitura do dia.", 
    title: "Evangelho", 
    calendar: { color: "white", season: "Tempo Comum", rank: "Feria", dayName: "Dia de Estudo", cycle: "A", week: "I" }
  },
  saint: { 
    name: "Santos de Deus", 
    feastDay: "Hoje", 
    patronage: "Igreja Universal", 
    biography: "Carregando a vida inspiradora dos santos...", 
    image: "https://images.unsplash.com/photo-1548610762-656391d1ad4d?w=800&q=80", 
    quote: "Onde há amor, Deus aí está." 
  },
  quote: { quote: "Fizeste-nos para Ti, Senhor.", author: "Santo Agostinho" },
  insight: "A sabedoria patrística nos convida ao silêncio interior."
};

const safeJsonParse = (text: string, fallback: any) => {
  try {
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(clean.substring(start, end + 1));
    }
    const arrayStart = clean.indexOf('[');
    const arrayEnd = clean.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1) {
        return JSON.parse(clean.substring(arrayStart, arrayEnd + 1));
    }
    return JSON.parse(clean || "{}");
  } catch (e) {
    console.error("Erro no parse de JSON:", e);
    return fallback;
  }
};

export const getDailyBundle = async (): Promise<{ gospel: Gospel, saint: Saint, quote: { quote: string, author: string }, insight: string }> => {
  try {
    const ai = getAIInstance();
    const dateStr = new Date().toLocaleDateString('pt-BR');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere o bundle teológico de ${dateStr}. JSON: gospel, saint, quote, insight.`,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION, 
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json" 
      }
    });
    
    return safeJsonParse(response.text || "", DEFAULT_BUNDLE);
  } catch (error) {
    return DEFAULT_BUNDLE;
  }
};

export const getIntelligentStudy = async (topic: string): Promise<StudyResult> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Realize uma investigação teológica completa sobre: "${topic}". 
    Você deve correlacionar as fontes. Retorne um JSON com:
    topic: string,
    summary: string (síntese teológica profunda),
    bibleVerses: Array<{book, chapter, verse, text}> (mínimo 3),
    catechismParagraphs: Array<{number, content}> (mínimo 2),
    magisteriumDocs: Array<{title, content, source}> (ex: encíclicas, concílios),
    saintsQuotes: Array<{saint, quote}>,
    sources: Array<{title, uri}>`,
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json" 
    }
  });
  return safeJsonParse(response.text || "", { 
    topic, 
    summary: "Não foi possível processar a investigação no momento.",
    bibleVerses: [],
    catechismParagraphs: [],
    magisteriumDocs: [],
    saintsQuotes: []
  });
};

export const getSaintsList = async (): Promise<Saint[]> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma lista de 12 santos católicos populares variados (Apóstolos, Mártires, Doutores, Virgens). 
      JSON: Array<{name, feastDay, patronage, biography, image, quote}>. 
      Use imagens do Unsplash relacionadas a arte sacra clássica.`,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json" 
      }
    });
    return safeJsonParse(response.text || "", []);
  } catch (e) {
    return [];
  }
};

export const searchSaint = async (name: string): Promise<Saint | null> => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Investigue profundamente a vida de: "${name}". 
        JSON: {name, feastDay, patronage, biography, image, quote}. 
        Use imagem Unsplash de arte sacra específica do santo se possível.`,
        config: { 
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json" 
        }
      });
      return safeJsonParse(response.text || "", null);
    } catch (e) {
      return null;
    }
};

export const getCatenaAureaCommentary = async (verse: Verse): Promise<{ content: string; fathers: string[]; sources: any[] }> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Catena Aurea: ${verse.book} ${verse.chapter}:${verse.verse}.`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", { content: "Indisponível", fathers: [] });
  } catch (e) {
    return { content: "Erro de conexão", fathers: [], sources: [] };
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { voiceName: 'Kore' } } }
  });
  return response.candidates?.[0]?.content?.[0]?.inlineData?.data || "";
};

export const getDailyGospel = async () => (await getDailyBundle()).gospel;
export const getLectioPoints = async (text: string) => ["Ponto 1", "Ponto 2", "Ponto 3"];
export const getWeeklyCalendar = async () => [];
export const searchVerse = async (q: string) => ({ book: "Mateus", chapter: 1, verse: 1, text: "Buscando..." });
export const getVerseCommentary = async (v: any) => "Comentário...";
export const getCatechismSearch = async (q: string, options?: any) => [];
export const getDogmaticLinksForCatechism = async (p: any) => ({});
export const getMagisteriumDocs = async (c: string) => [];
export const getDogmas = async (q?: string) => [];
export async function* getTheologicalDialogueStream(m: string) { yield "..."; }
export const getThomisticSynthesis = async (t: string) => ({});
