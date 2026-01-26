
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma, Language, ThomisticArticle, UniversalSearchResult, CatechismHierarchy, DailyLiturgyContent, QuizQuestion } from "../types";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    const response = await ai.models.generateContent(config);
    return response;
  } catch (error: any) {
    const errorMsg = error?.message?.toUpperCase() || "";
    const isQuota = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED');
    if (isQuota && retries > 0) {
      await sleep(backoff);
      return generateWithRetry(config, retries - 1, backoff * 2);
    }
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

export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Você é a Cátedra Digital, uma inteligência teológica especializada em Cruzamento de Dados (Symphonia Fidei).
    Analise o tema/texto: "${topic}".
    Sua resposta deve ser um JSON rigoroso contendo:
    1. Resumo teológico profundo.
    2. 3-4 Versículos bíblicos diretamente relacionados (Objeto Verse).
    3. 2-3 Parágrafos do Catecismo (CIC) que validam o tema (Objeto CatechismParagraph).
    4. 2 Documentos do Magistério.
    5. 2 Sentenças de Santos.
    
    JSON: { "topic": "...", "summary": "...", "bibleVerses": [], "catechismParagraphs": [], "magisteriumDocs": [], "saintsQuotes": [] }`,
    config: { responseMimeType: "application/json", tools: [{ googleSearch: {} }] }
  });
  if (!response) throw new Error("A conexão com a inteligência foi interrompida.");
  return safeJsonParse(response.text || "", {});
};

export const fetchLiturgyByDate = async (date: string, lang: Language = 'pt'): Promise<{content: DailyLiturgyContent, sources: any[]}> => {
  const cacheKey = `liturgy_${date}_${lang}`;
  const cached = cacheHelper.get(cacheKey);
  if (cached) return cached;

  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Retorne a Liturgia Católica Apostólica Romana para o dia ${date} no Lecionário Romano. Responda APENAS o JSON.
    Formato esperado:
    {
      "date": "${date}",
      "collect": "Oração do dia...",
      "firstReading": {"reference": "Livro Cap, Ver", "text": "Texto completo..."},
      "psalm": {"title": "Salmo X", "text": "Refrão e estrofes..."},
      "gospel": {
        "reference": "Evangelho Cap, Ver", 
        "text": "Texto do Evangelho...", 
        "reflection": "Reflexão profunda baseada no magistério...",
        "calendar": {
          "dayName": "Nome do Dia (Ex: XX Domingo do Tempo Comum)",
          "rank": "Solenidade|Festa|Memória|Féria",
          "color": "green|purple|white|red|rose",
          "cycle": "A|B|C",
          "season": "Tempo Comum|Advento|Natal|Quaresma|Páscoa"
        }
      }
    }`,
    config: { responseMimeType: "application/json" }
  });

  const defaultContent: DailyLiturgyContent = { 
    date,
    collect: "Deus eterno e todo-poderoso, que governais o céu e a terra, escutai com bondade as preces do vosso povo e dai ao nosso tempo a vossa paz.",
    firstReading: { reference: "Leitura I", text: "O conteúdo desta leitura está sendo processado ou não está disponível para esta data específica no momento." },
    psalm: { title: "Salmo Responsorial", text: "O Senhor é minha luz e minha salvação!" },
    gospel: { 
      reference: "Evangelho", 
      text: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.",
      reflection: "A liturgia deste dia nos convida à conversão e à escuta atenta da Palavra.",
      calendar: {
        dayName: "Dia Litúrgico",
        rank: "Féria",
        color: "white",
        cycle: "A",
        season: "Tempo Comum"
      }
    }
  };

  const content = response ? safeJsonParse(response.text || "", defaultContent) : defaultContent;
  
  // Garantir integridade da estrutura caso o JSON venha incompleto da IA
  const finalContent = {
    ...defaultContent,
    ...content,
    firstReading: { ...defaultContent.firstReading, ...content.firstReading },
    psalm: { ...defaultContent.psalm, ...content.psalm },
    gospel: { 
      ...defaultContent.gospel, 
      ...content.gospel,
      calendar: { ...defaultContent.gospel.calendar, ...(content.gospel?.calendar || {}) }
    }
  };

  const result = { content: finalContent, sources: [] };
  if (response) cacheHelper.set(cacheKey, result);
  return result;
};

export const universalSearch = async (query: string, lang: Language = 'pt'): Promise<UniversalSearchResult[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Busca Universal: "${query}". Retorne array JSON de resultados vinculados ao depósito da fé católico.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const fetchDailyVerse = async (lang: Language = 'pt'): Promise<any> => {
  const date = new Date().toISOString().split('T')[0];
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Versículo do dia ${date}. JSON: { "verse": "...", "reference": "...", "imageUrl": "..." }`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getDailyBundle = async (lang: Language = 'pt'): Promise<any> => {
  const date = new Date().toISOString().split('T')[0];
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Santo e Evangelho do dia ${date}. JSON: { "saint": { "name": "...", "quote": "..." }, "gospel": { "reference": "..." } }`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", { saint: { name: 'São Bento', quote: 'Ora et Labora' }, gospel: { reference: 'Mt 1' } }) : {};
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Leia com voz solene e reverente: ${text}` }] }],
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
      },
    });
    return response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
  } catch (e) { return undefined; }
};

export const getAIStudySuggestions = async (lang: Language = 'pt'): Promise<string[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Gere 5 temas curtos de estudo teológico católico para inspiração (ex: "A transubstanciação", "As virtudes cardeais"). Retorne apenas um array JSON de strings.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const fetchQuizQuestions = async (category: string, difficulty: string, lang: Language = 'pt'): Promise<QuizQuestion[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Gerar 5 perguntas de quiz sobre ${category} nível ${difficulty}. JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const fetchBibleChapterIA = async (book: string, chapter: number, lang: Language = 'pt'): Promise<Verse[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Retorne todos os versículos de ${book} capítulo ${chapter}. JSON array de objetos Verse { book, chapter, verse, text }.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const fetchMonthlyCalendar = async (month: number, year: number, lang: Language = 'pt'): Promise<LiturgyInfo[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Calendário litúrgico ${month}/${year}. JSON array de objetos LiturgyInfo.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const fetchThomisticArticle = async (work: string, reference: string, lang: Language = 'pt'): Promise<ThomisticArticle> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Artigo da obra ${work} referência ${reference}. JSON rigoroso conforme tipo ThomisticArticle.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {} as ThomisticArticle;
};

export const fetchLitanies = async (type: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Ladainha: ${type}. JSON: { title, items: [{call, response}] }.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getDogmas = async (query: string): Promise<Dogma[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Dogmas relacionados a "${query}". JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const getSaintsList = async (): Promise<Saint[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Lista de 12 grandes santos. JSON array de objetos Saint.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const getMagisteriumDocs = async (category: string, lang: Language = 'pt'): Promise<any[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Documentos do Magistério categoria ${category}. JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const getMagisteriumDeepDive = async (title: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Análise profunda do documento "${title}". JSON com historicalContext, corePoints[], modernApplication, relatedCatechism[].`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getThomisticSynthesis = async (query: string): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Síntese tomista sobre "${query}". Formato Disputatio (Videtur Quod, Sed Contra, Respondeo).`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getCatenaAureaCommentary = async (verse: Verse): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Catena Aurea para ${verse.book} ${verse.chapter}:${verse.verse}. JSON: { content, fathers: [], sources: [] }.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getDailyGospel = async (): Promise<Gospel> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Evangelho do dia. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : { reference: "Jo 1", text: "O Verbo se fez carne." };
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `3 pontos de Lectio Divina para o texto: "${text}". JSON array.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", []) : [];
};

export const fetchBreviaryHour = async (hour: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Ofício Divino - Hora: ${hour}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {};
};

export const getMoralDiscernment = async (input: string, lang: Language = 'pt'): Promise<any> => {
  const response = await generateWithRetry({
    model: 'gemini-3-pro-preview',
    contents: `Analise moral: "${input}". JSON: { gravity: "mortal|venial", explanation, cicRef }.`,
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
      config: { systemInstruction: "Você é S. Tomás de Aquino, respondendo com precisão e humildade." }
    });
    for await (const chunk of stream) if (chunk.text) yield chunk.text;
  } catch (e) { yield "A conexão falhou."; }
}

export const searchSaint = async (query: string): Promise<Saint> => {
  const response = await generateWithRetry({
    model: 'gemini-3-flash-preview',
    contents: `Hagiografia completa de "${query}". JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return response ? safeJsonParse(response.text || "", {}) : {} as Saint;
};
