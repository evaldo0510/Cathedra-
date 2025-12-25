
import { GoogleGenAI, Modality } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma } from "../types";

const SYSTEM_INSTRUCTION = `Você é o Cathedra AI, uma inteligência teológica de elite.
Sua missão é fornecer informações precisas sobre a fé Católica, baseada no Magistério, Sagrada Escritura e Tradição.
REGRAS:
1. Retorne APENAS JSON puro quando solicitado.
2. Grounding: Sempre use Google Search para buscar informações precisas e recentes.
3. Imagens: Ao buscar santos, você DEVE retornar URLs de imagens PÚBLICAS e ESTÁVEIS (prioridade: Wikimedia Commons, Vatican.va, ou Unsplash). Certifique-se de que o link termine em .jpg, .png ou .webp.
4. Se não encontrar uma imagem real, use uma URL de alta qualidade de uma catedral clássica do Unsplash.
5. Liturgia: Ao retornar a cor litúrgica, use apenas as strings: 'green', 'purple', 'white', 'red' ou 'rose'.`;

const IMAGE_BACKUPS = [
  "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800",
  "https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=800"
];

const FALLBACK_GOSPEL: Gospel = {
  reference: "Jo 1, 1-5",
  text: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.",
  reflection: "Hoje contemplamos o mistério do Verbo Encarnado, a Luz que brilha nas trevas e que nos convida a sermos, também nós, portadores dessa luz no mundo.",
  title: "Evangelho segundo João",
  calendar: {
    color: "white",
    season: "Tempo Comum",
    rank: "Féria",
    dayName: "Feria de Estudo",
    cycle: "B",
    week: "I Semana"
  },
  firstReading: { title: "1ª Leitura", reference: "Gn 1, 1", text: "No princípio Deus criou o céu e a terra." },
  psalm: { title: "Salmo Responsorial", reference: "Sl 22", text: "O Senhor é o meu pastor, nada me faltará." }
};

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const extractSources = (response: any) => {
  return response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => ({
      title: chunk.web?.title || chunk.web?.uri,
      uri: chunk.web?.uri
    }))
    .filter((s: any) => s.uri) || [];
};

async function withRetry<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    console.error("Cathedra API Sync Error:", error);
    return fallback;
  }
}

export const getDailyGospel = async (): Promise<Gospel> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const today = new Date().toLocaleDateString('pt-BR');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Pesquise a Liturgia Católica oficial de hoje (${today}). Retorne JSON: 
      { 
        "reference": "ref", 
        "text": "texto integral do evangelho", 
        "reflection": "uma meditação teológica profunda de 3 parágrafos", 
        "title": "Evangelho segundo...",
        "calendar": { 
          "color": "green|purple|white|red|rose", 
          "season": "Tempo Litúrgico", 
          "rank": "Solenidade|Festa|Memória|Féria", 
          "dayName": "Nome do dia (ex: 4º Domingo do Advento)", 
          "cycle": "A|B|C", 
          "week": "Semana do Tempo" 
        },
        "firstReading": { "title": "1ª Leitura", "reference": "ref", "text": "texto" },
        "psalm": { "title": "Salmo Responsorial", "reference": "ref", "text": "texto" }
      }`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const data = JSON.parse(response.text || JSON.stringify(FALLBACK_GOSPEL));
    data.sources = extractSources(response);
    return data;
  }, FALLBACK_GOSPEL);
};

export const getDailySaint = async (): Promise<Saint> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const today = new Date().toLocaleDateString('pt-BR');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Santo do dia de hoje (${today}). Retorne JSON: { "name": string, "feastDay": string, "patronage": string, "biography": "biografia de 2 parágrafos", "image": "URL direta de imagem estável", "quote": "uma frase famosa do santo" }.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const parsed = JSON.parse(response.text || "{}");
    if (!parsed.image || !parsed.image.startsWith('http')) parsed.image = IMAGE_BACKUPS[0];
    parsed.sources = extractSources(response);
    return parsed;
  }, {
    name: "São Bento",
    feastDay: "11 de Julho",
    patronage: "Europa e Monges",
    biography: "Pai do monaquismo ocidental e autor da famosa Regra que equilibra oração e trabalho.",
    image: IMAGE_BACKUPS[0],
    quote: "A oração deve ser curta e pura, a menos que se prolongue por um afeto da inspiração divina."
  });
};

export const getDailyQuote = async () => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: "Citação inspiradora de um Santo para o dia de hoje. JSON: { \"quote\": string, \"author\": string }", 
      config: { responseMimeType: "application/json" } 
    });
    return JSON.parse(res.text || '{"quote": "Onde há amor, Deus aí está.", "author": "Ubi Caritas"}');
  }, { quote: "Onde há amor, Deus aí está.", author: "Ubi Caritas" });
};

export const getIntelligentStudy = async (topic: string): Promise<StudyResult> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Estudo teológico sobre: "${topic}". JSON Schema: { "topic": string, "summary": string, "bibleVerses": [{"book": string, "chapter": number, "verse": number, "text": string}], "catechismParagraphs": [{"number": number, "content": string}], "magisteriumDocs": [{"title": string, "content": string, "source": string}], "saintsQuotes": [{"saint": string, "quote": string}] }`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  const data = JSON.parse(response.text || "{}");
  data.sources = extractSources(response);
  return data;
};

export const getLiturgyInsight = async (title: string, reference: string, text: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Comentário exegético profundo: "${title} (${reference}): ${text}".`,
    config: { systemInstruction: "Seja um teólogo profundo, seguindo a tradição patrística e escolástica." }
  });
  return response.text || "Comentário indisponível.";
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Diga com solenidade e clareza: ${text}` }] }],
    config: { 
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const getSaintsList = async (): Promise<Saint[]> => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: "Lista de 6 santos populares com imagens estáveis. JSON.", 
    config: { responseMimeType: "application/json" } 
  });
  return JSON.parse(res.text || "[]");
};

export const getWeeklyCalendar = async (): Promise<LiturgyInfo[]> => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: "Calendário litúrgico dos próximos 7 dias. JSON.", 
    config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" } 
  });
  return JSON.parse(res.text || "[]");
};

export const searchVerse = async (query: string): Promise<Verse> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busque o versículo exato para: "${query}". JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const getVerseCommentary = async (verse: Verse): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça um comentário exegético católico sobre: ${verse.book} ${verse.chapter}:${verse.verse}.`,
  });
  return response.text || "Sem comentário disponível.";
};

export const getCatechismSearch = async (query: string): Promise<CatechismParagraph[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busque no Catecismo da Igreja Católica: "${query}". JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
};

export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]): Promise<Record<number, Dogma[]>> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Dogmas relacionados aos parágrafos do CIC: ${paragraphs.map(p=>p.number).join(',')}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const getMagisteriumDocs = async (category: string): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Documentos do Magistério para a categoria: "${category}". JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
};

export const getDogmas = async (query?: string): Promise<Dogma[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Principais dogmas católicos. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
};

export async function* getTheologicalDialogueStream(message: string): AsyncGenerator<string> {
  const ai = getAIInstance();
  const response = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: message,
  });
  for await (const chunk of response) {
    yield chunk.text || "";
  }
}

export const getThomisticSynthesis = async (topic: string): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Síntese tomista sobre: "${topic}". JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Pontos para Lectio Divina: "${text}". JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
};
