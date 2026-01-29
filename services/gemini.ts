
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StudyResult, Verse, Saint, ThomisticArticle, Language, Dogma, LiturgyInfo, Gospel, QuizQuestion, UniversalSearchResult, DailyLiturgyContent } from "../types";

// Helper to create a new instance every time to avoid stale keys
const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const safeJsonParse = (text: string | undefined, fallback: any) => {
  try {
    if (!text) return fallback;
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean) || fallback;
  } catch (e) { return fallback; }
};

/**
 * BUSCA DA ÚLTIMA AUDIÊNCIA PAPAL (Grounding)
 * Conecta-se ao site do Vaticano via busca para trazer a mensagem mais recente de quarta-feira.
 */
export const fetchLatestPapalAudience = async (lang: Language = 'pt'): Promise<any> => {
  const ai = getAIInstance();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Identifique o tema e forneça um resumo curto (2 a 3 linhas) da ÚLTIMA Audiência Geral de quarta-feira do Papa Francisco. 
    Busque especificamente no site oficial vatican.va ou Vatican News.
    Idioma: ${lang}.
    
    Retorne EXATAMENTE este formato JSON:
    {
      "date": "Data da audiência (Ex: 23 de Outubro de 2024)",
      "topic": "Título ou tema central da catequese",
      "summary": "Resumo teológico conciso",
      "vaticanUrl": "Link direto para o texto no Vaticano"
    }`,
    config: { 
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    }
  });

  return safeJsonParse(response.text, { 
    topic: "Magistério Vivo", 
    summary: "Conectando-se à Cátedra de Pedro para trazer as últimas exortações do Santo Padre.",
    date: "Atualizando...",
    vaticanUrl: "https://www.vatican.va"
  });
};

/**
 * BUSCA DE LITURGIA EM TEMPO REAL (Grounding)
 */
export const fetchLiveLiturgy = async (date: string, lang: Language = 'pt'): Promise<{ data: DailyLiturgyContent, sources: any[] }> => {
  const ai = getAIInstance();
  const year = new Date().getFullYear();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Consulte a Liturgia Diária Católica Oficial do Brasil (CNBB) para a data específica: ${date}. 
    Estamos no ano de ${year}. Busque os textos integrais do Lecionário para Missa do Dia.
    
    Retorne JSON:
    {
      "date": "${date}",
      "collect": "Oração do dia",
      "firstReading": { "reference": "Ref", "text": "Texto" },
      "psalm": { "title": "Ref", "text": "Texto" },
      "gospel": { "reference": "Ref", "text": "Texto", "reflection": "Reflexão" }
    }`,
    config: { 
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    }
  });

  const data = safeJsonParse(response.text, null);
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  return { data, sources };
};

export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analise teologicamente: "${topic}". Conecte Escritura, Catecismo e Magistério. Idioma: ${lang}. Retorne JSON: { "topic": "string", "summary": "string", "bibleVerses": [{"book": "string", "chapter": number, "verse": number, "text": "string"}], "catechismParagraphs": [{"number": number, "content": "string"}], "magisteriumDocs": [{"title": "string", "source": "string", "year": "string", "summary": "string"}], "saintsQuotes": [{"saint": "string", "quote": "string"}] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const searchSaint = async (name: string): Promise<Partial<Saint>> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça biografia aprofundada e sentenças famosas do santo: "${name}". Retorne JSON: { "biography": "string", "quote": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const getMagisteriumDeepDive = async (title: string, lang: Language = 'pt'): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Análise profunda do documento: "${title}". Idioma: ${lang}. Retorne JSON: { "historicalContext": "string", "corePoints": ["string"], "modernApplication": "string", "relatedCatechism": ["string"] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

export const fetchThomisticArticle = async (work: string, ref: string, lang: Language = 'pt'): Promise<ThomisticArticle> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Artigo de S. Tomás de Aquino (${work}) em ${ref}. Idioma: ${lang}. Retorne JSON formatado para ThomisticArticle.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {} as ThomisticArticle);
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

export const getDogmas = async (query: string): Promise<Dogma[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Liste dogmas católicos relacionados a: "${query}". Retorne JSON: Array<{ title: string, definition: string, council?: string, year?: string, period?: string, tags?: string[], sourceUrl?: string }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export async function* getTheologicalDialogueStream(message: string) {
  const ai = getAIInstance();
  const response = await ai.models.generateContentStream({
    model: 'gemini-3-pro-preview',
    contents: message,
    config: {
        systemInstruction: "Você é um teólogo católico experiente (Doctor Angelicus). Responda com rigor e fidelidade ao Magistério da Igreja Católica."
    }
  });

  for await (const chunk of response) {
    if (chunk.text) yield chunk.text;
  }
}

export const universalSearch = async (query: string, lang: Language): Promise<UniversalSearchResult[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busca universal no santuário digital católico para o termo: "${query}". Pesquise em Bíblia, Catecismo, Magistério e Vida dos Santos. Idioma: ${lang}. Retorne JSON: Array<{ id: string, type: "verse"|"catechism"|"dogma"|"saint"|"aquinas"|"magisterium", title: string, snippet: string, source: { name: string, code: string, reliability: "high"|"medium" }, relevance: number }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const getDailyGospel = async (): Promise<Gospel> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça a referência e o texto integral do evangelho da missa de hoje conforme o lecionário romano. Retorne JSON: { "reference": "string", "text": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, { reference: '', text: '' });
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Dada a leitura bíblica: "${text}", forneça 3 pontos de meditação espiritual profunda seguindo a tradição da Lectio Divina. Retorne JSON: ["string", "string", "string"]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const fetchQuizQuestions = async (category: string, difficulty: string, lang: Language): Promise<QuizQuestion[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere 5 perguntas de quiz sobre ${category}, dificuldade ${difficulty}. Idioma: ${lang}. Retorne JSON: Array<{ "id": "string", "question": "string", "options": ["string"], "correctAnswer": number, "explanation": "string", "category": "string", "difficulty": "string" }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const fetchBreviaryHour = async (hour: string, lang: Language): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Forneça os textos para a Liturgia das Horas (Breviário) da hora: ${hour}. Idioma: ${lang}. Retorne JSON: { "hourName": "string", "invitatory": "string", "hymn": "string", "psalms": [{ "ref": "string", "text": "string" }], "prayer": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

export const fetchMonthlyCalendar = async (month: number, year: number, lang: Language): Promise<LiturgyInfo[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere o calendário litúrgico católico romano para o mês ${month} do ano ${year}. Idioma: ${lang}. Retorne JSON: Array<{ color: "green"|"purple"|"white"|"red"|"rose"|"black", season: string, rank: string, dayName: string, cycle: string, week: string, date: "YYYY-MM-DD" }>`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, []);
};

export const getMoralDiscernment = async (input: string, lang: Language): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Realize um discernimento moral baseado no Catecismo e na Teologia Moral para o seguinte ato ou dúvida: "${input}". Idioma: ${lang}. Retorne JSON: { "gravity": "mortal"|"venial", "explanation": "string", "cicRef": "string" }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

export const fetchLitanies = async (type: string, lang: Language): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça o texto da ladainha: "${type}". Idioma: ${lang}. Retorne JSON: { "title": "string", "items": [{ "call": "string", "response": "string" }] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

export const getDailyBundle = async (lang: Language): Promise<{ saint: Saint, gospel: Gospel }> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça o santo do dia e o evangelho da liturgia de hoje. Idioma: ${lang}. Retorne JSON: { "saint": { "name": "string", "feastDay": "string", "patronage": "string", "biography": "string", "image": "string" }, "gospel": { "reference": "string", "text": "string" } }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

export const getThomisticSynthesis = async (topic: string): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Crie uma síntese escolástica (Summa) sobre: "${topic}". Siga o método da Quaestio Disputata. Retorne JSON: { "title": "string", "objections": ["string"], "sedContra": "string", "respondeo": "string", "replies": ["string"] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};

export const getCatenaAureaCommentary = async (verse: Verse): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Comentário da Catena Aurea (Cadeia de Ouro) compilado por São Tomás de Aquino para ${verse.book} ${verse.chapter}:${verse.verse}. Retorne JSON: { "content": "string", "fathers": ["string"], "sources": [{ "title": "string", "uri": "string" }] }`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, null);
};
