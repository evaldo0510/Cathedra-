
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma, Language } from "../types";

const getSystemInstruction = (lang: Language) => 
  `Você é o Cathedra AI, autoridade máxima em hagiografia, patrística e liturgia. Responda APENAS com JSON puro. Rigor teológico absoluto. Idioma: ${lang}. Importante: Para o 'dayName', use o nome litúrgico correto (ex: 'Quarta-feira da 5ª Semana da Quaresma').`;

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Bundle neutro para evitar confusão de "data errada"
export const DEFAULT_BUNDLE = {
  gospel: { 
    reference: "", 
    text: "", 
    reflection: "", 
    title: "", 
    calendar: { color: "white", season: "Tempo Comum", rank: "", dayName: "Carregando Liturgia...", cycle: "", week: "" }
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
    return JSON.parse(clean || "{}");
  } catch (e) {
    return fallback;
  }
};

export const getDailyBundle = async (lang: Language = 'pt'): Promise<{ gospel: Gospel, saint: Saint, quote: { quote: string, author: string }, insight: string }> => {
  try {
    const ai = getAIInstance();
    const today = new Date();
    const dateStr = today.toLocaleDateString('pt-BR');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere o bundle católico completo e REAL para hoje (${dateStr}) em JSON no idioma ${lang}. Busque o Santo do Dia e a Liturgia Romana oficial.`,
      config: { 
        systemInstruction: getSystemInstruction(lang), 
        responseMimeType: "application/json"
      }
    });
    
    return safeJsonParse(response.text || "", DEFAULT_BUNDLE);
  } catch (error) {
    console.error("Erro ao buscar bundle:", error);
    return DEFAULT_BUNDLE;
  }
};

export const fetchRealBibleText = async (book: string, chapter: number, lang: Language = 'pt'): Promise<Verse[]> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Retorne o texto integral do capítulo ${chapter} do livro de ${book} da Bíblia Sagrada (Tradução Católica). Retorne um ARRAY JSON de objetos {book, chapter, verse, text}. Idioma: ${lang}.`,
      config: { 
        systemInstruction: "Você é um bibliotecário bíblico. Retorne apenas JSON puro.",
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
};

export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Investigação teológica profunda sobre: "${topic}" no idioma ${lang}. JSON com bibleVerses, catechismParagraphs, magisteriumDocs, saintsQuotes.`,
    config: { 
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json" 
    }
  });
  return safeJsonParse(response.text || "", { topic, summary: "Erro na investigação.", bibleVerses: [], catechismParagraphs: [], magisteriumDocs: [], saintsQuotes: [] });
};

export const getWeeklyCalendar = async (lang: Language = 'pt'): Promise<LiturgyInfo[]> => {
  const cacheKey = `cathedra_weekly_${lang}_${new Date().toISOString().split('T')[0]}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere o calendário litúrgico para os próximos 7 dias em JSON.`,
      config: { 
        systemInstruction: getSystemInstruction(lang),
        responseMimeType: "application/json"
      }
    });
    const data = JSON.parse(response.text || "[]");
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (err) {
    return [];
  }
};
