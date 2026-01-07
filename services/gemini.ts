
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma, Language } from "../types";

const getSystemInstruction = (lang: Language) => 
  `Você é o Cathedra AI, autoridade máxima em hagiografia, patrística e liturgia. Responda APENAS com JSON puro. Rigor teológico absoluto. Idioma: ${lang}. 
  Para o 'dayName', use o nome litúrgico correto (ex: 'Quarta-feira da 5ª Semana da Quaresma'). 
  Nunca invente dados. Se não souber a liturgia exata de um dia, retorne campos vazios ou erro.`;

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const DEFAULT_BUNDLE = {
  gospel: { 
    reference: "", 
    text: "", 
    reflection: "", 
    title: "", 
    calendar: { color: "white", season: "Tempo Comum", rank: "", dayName: "Sincronizando...", cycle: "", week: "" }
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
    console.error("JSON Parse Error:", e, text);
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
      contents: `Gere o bundle católico completo e REAL para hoje (${dateStr}) em JSON no idioma ${lang}. Busque o Santo do Dia e a Liturgia Romana oficial (I Leitura, Salmo, Evangelho).`,
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
      contents: `Retorne o texto integral de TODOS os versículos do capítulo ${chapter} do livro de ${book} da Bíblia Sagrada (Tradução Católica oficial). Retorne um ARRAY JSON de objetos {book, chapter, verse, text}. Idioma: ${lang}.`,
      config: { 
        systemInstruction: "Você é um bibliotecário bíblico rigoroso. Retorne apenas JSON puro sem markdown.",
        responseMimeType: "application/json"
      }
    });
    return safeJsonParse(response.text || "", []);
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
      contents: `Gere o calendário litúrgico detalhado para os próximos 7 dias em JSON. Inclua cor, tempo litúrgico e nome do dia.`,
      config: { 
        systemInstruction: getSystemInstruction(lang),
        responseMimeType: "application/json"
      }
    });
    const data = safeJsonParse(response.text || "", []);
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (err) {
    return [];
  }
};

export const searchVerse = async (query: string, book?: string, chapter?: number, verse?: number, lang: Language = 'pt'): Promise<Verse[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Pesquise versículos na Bíblia Católica que falem sobre: "${query}". ${book ? `No livro ${book}` : ''}. Idioma: ${lang}. Retorne um ARRAY JSON de objetos {book, chapter, verse, text}.`,
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
    contents: `Comentário da Catena Aurea (Santo Tomás de Aquino) para o versículo ${verse.book} ${verse.chapter}:${verse.verse}. Idioma: ${lang}. Retorne JSON { content: string, fathers: string[], sources: { title: string, uri: string }[] }.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", { content: "Comentário não disponível no momento.", fathers: [], sources: [] });
};

export const getAIStudySuggestions = async (lang: Language = 'pt'): Promise<string[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Sugira 4 temas profundos de estudo de teologia católica. Idioma: ${lang}. Retorne um ARRAY JSON de strings.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getSaintsList = async (): Promise<Saint[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Liste 4 santos católicos importantes. Retorne ARRAY JSON de objetos Saint (name, feastDay, patronage, biography, image, quote).",
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const searchSaint = async (name: string): Promise<Saint | null> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busque informações detalhadas sobre o santo: "${name}". Retorne um objeto JSON Saint (name, feastDay, patronage, biography, image, quote).`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", null);
};

export const getCatechismSearch = async (query: string, filters: any = {}, lang: Language = 'pt'): Promise<CatechismParagraph[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Pesquise no Catecismo da Igreja Católica (CIC): "${query}". Idioma: ${lang}. Retorne um ARRAY JSON de objetos {number, title, content}.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]): Promise<Record<number, Dogma[]>> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Liste dogmas católicos relacionados a estes parágrafos do CIC: ${paragraphs.map(p => p.number).join(', ')}. Retorne JSON { [paragrafoNumber: number]: Dogma[] }.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", {});
};

export const getMagisteriumDocs = async (category: string): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Liste 3 documentos importantes do Magistério na categoria: "${category}". Retorne um ARRAY JSON de objetos {title, source, content, year}.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getDogmas = async (query: string): Promise<Dogma[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Liste dogmas católicos que tratam de: "${query}". Retorne um ARRAY JSON de objetos Dogma (title, definition, council, year, tags, period).`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export async function* getTheologicalDialogueStream(message: string) {
  const ai = getAIInstance();
  const stream = await ai.models.generateContentStream({
    model: 'gemini-3-pro-preview',
    contents: message,
    config: {
      systemInstruction: "Você é um mestre de teologia católica. Diálogo profundo, reverente e fiel ao Magistério da Igreja.",
    }
  });
  for await (const chunk of stream) {
    yield chunk.text || "";
  }
}

export const getThomisticSynthesis = async (topic: string): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Sintetize uma Questão Disputada ao estilo de Santo Tomás de Aquino (Summa Theologica) sobre: "${topic}". Retorne JSON {title, objections: string[], sedContra: string, respondeo: string, replies: string[]}.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", { title: topic, objections: [], sedContra: "", respondeo: "", replies: [] });
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Para o seguinte texto bíblico: "${text}", sugira 3 pontos profundos para Meditatio (Lectio Divina). Retorne um ARRAY JSON de strings.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getDailyGospel = async (): Promise<Gospel> => {
  const bundle = await getDailyBundle();
  return bundle.gospel;
};
