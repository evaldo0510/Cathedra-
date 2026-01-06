
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma, Language } from "../types";

const getSystemInstruction = (lang: Language) => 
  `Você é o Cathedra AI, autoridade em hagiografia, patrística e liturgia. Responda apenas com JSON puro e rigor teológico. Todos os textos devem estar no idioma: ${lang}. Certifique-se de que todos os campos de texto sejam strings simples, nunca objetos.`;

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const DEFAULT_BUNDLE = {
  gospel: { 
    reference: "Jo 1, 1-18", 
    text: "No princípio era o Verbo, e o Verbo estava junto de Deus e o Verbo era Deus.", 
    reflection: "O prólogo de São João nos convida a contemplar a divindade eterna de Cristo.", 
    title: "O Verbo Eterno", 
    calendar: { color: "white", season: "Tempo Comum", rank: "Feria", dayName: "Liturgia das Horas", cycle: "B", week: "II" },
    firstReading: { title: "I Leitura", reference: "Gn 1, 1-5", text: "No princípio, Deus criou o céu e a terra." },
    psalm: { title: "Salmo Responsorial", reference: "Sl 103", text: "Bendize, ó minha alma, ao Senhor." }
  },
  saint: { 
    name: "São Bento", 
    feastDay: "11 de Julho", 
    patronage: "Europa", 
    biography: "Pai do monaquismo ocidental.", 
    image: "https://images.unsplash.com/photo-1548610762-656391d1ad4d?w=800&q=80", 
    quote: "Ora et Labora." 
  },
  quote: { quote: "Tarde te amei!", author: "Santo Agostinho" },
  insight: "A oração é o encontro de dois silêncios."
};

const safeJsonParse = (text: string, fallback: any) => {
  try {
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const parsed = JSON.parse(clean.substring(start, end + 1));
      if (parsed.insight && typeof parsed.insight === 'object') parsed.insight = Object.values(parsed.insight)[0];
      if (parsed.gospel?.reflection && typeof parsed.gospel.reflection === 'object') parsed.gospel.reflection = Object.values(parsed.gospel.reflection)[0];
      return parsed;
    }
    return JSON.parse(clean || "{}");
  } catch (e) {
    return fallback;
  }
};

export const getDailyBundle = async (lang: Language = 'pt'): Promise<{ gospel: Gospel, saint: Saint, quote: { quote: string, author: string }, insight: string }> => {
  try {
    const ai = getAIInstance();
    const dateStr = new Date().toLocaleDateString('pt-BR');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere o bundle católico completo de hoje (${dateStr}) em JSON no idioma ${lang}. Inclua a Liturgia da Palavra completa (firstReading, psalm, secondReading se houver, e gospel).`,
      config: { 
        systemInstruction: getSystemInstruction(lang), 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gospel: {
              type: Type.OBJECT,
              properties: {
                reference: { type: Type.STRING },
                text: { type: Type.STRING },
                reflection: { type: Type.STRING },
                title: { type: Type.STRING },
                calendar: {
                  type: Type.OBJECT,
                  properties: {
                    color: { type: Type.STRING },
                    season: { type: Type.STRING },
                    rank: { type: Type.STRING },
                    dayName: { type: Type.STRING },
                    cycle: { type: Type.STRING },
                    week: { type: Type.STRING }
                  }
                },
                firstReading: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    reference: { type: Type.STRING },
                    text: { type: Type.STRING }
                  }
                },
                psalm: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    reference: { type: Type.STRING },
                    text: { type: Type.STRING }
                  }
                },
                secondReading: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    reference: { type: Type.STRING },
                    text: { type: Type.STRING }
                  }
                }
              }
            },
            saint: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                feastDay: { type: Type.STRING },
                patronage: { type: Type.STRING },
                biography: { type: Type.STRING },
                image: { type: Type.STRING },
                quote: { type: Type.STRING }
              }
            },
            quote: {
              type: Type.OBJECT,
              properties: {
                quote: { type: Type.STRING },
                author: { type: Type.STRING }
              }
            },
            insight: { type: Type.STRING }
          }
        }
      }
    });
    
    return safeJsonParse(response.text || "", DEFAULT_BUNDLE);
  } catch (error) {
    return DEFAULT_BUNDLE;
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
  return safeJsonParse(response.text || "", { topic, summary: "Error.", bibleVerses: [], catechismParagraphs: [], magisteriumDocs: [], saintsQuotes: [] });
};

export const getAIStudySuggestions = async (lang: Language = 'pt'): Promise<string[]> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere 6 temas de estudo teológico católico profundos e interessantes para um fiel em busca de conhecimento. Retorne apenas um array de strings no idioma ${lang}.`,
      config: { 
        systemInstruction: getSystemInstruction(lang),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    const parsed = JSON.parse(response.text || "[]");
    return Array.isArray(parsed) ? parsed : ["A Natureza Divina de Jesus", "O Mistério da Eucaristia", "A Doutrina Social da Igreja"];
  } catch (err) {
    return ["A Natureza Divina de Jesus", "O Mistério da Eucaristia", "A Doutrina Social da Igreja"];
  }
};

export const searchVerse = async (q: string, books?: string[], chapters?: string[], verses?: string[], lang: Language = 'pt'): Promise<Verse[]> => {
  try {
    const ai = getAIInstance();
    const filters = [];
    if (books && books.length > 0) filters.push(`Livros: ${books.join(', ')}`);
    if (chapters && chapters.length > 0) filters.push(`Capítulos: ${chapters.join(', ')}`);
    if (verses && verses.length > 0) filters.push(`Versículos: ${verses.join(', ')}`);
    
    const prompt = `Busque versículos bíblicos que correspondam a: "${q}". 
    Filtros aplicados: ${filters.join(' | ')}. 
    Retorne um array JSON de objetos Verse (book, chapter, verse, text) no idioma ${lang}.
    Se encontrar uma referência exata, inclua-a primeiro. Responda apenas com o JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        systemInstruction: getSystemInstruction(lang),
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
            }
          }
        }
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (err) {
    console.error("Erro na busca de versículos:", err);
    return [];
  }
};

export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]) => {
  try {
    const ai = getAIInstance();
    const prompt = `Relacione Dogmas aos parágrafos CIC: ${paragraphs.map(p => p.number).join(', ')}. JSON: {numero: [Dogma]}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "", {});
  } catch (err) {
    return {};
  }
};

export const getDogmas = async (q?: string, lang: Language = 'pt'): Promise<Dogma[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: q ? `Dogmas sobre "${q}" em JSON no idioma ${lang}.` : `10 principais dogmas em JSON no idioma ${lang}.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getCatechismSearch = async (q: string, options: any = {}, lang: Language = 'pt'): Promise<CatechismParagraph[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busca no Catecismo: "${q}". Idioma: ${lang}. JSON array de CatechismParagraph.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getLectioPoints = async (text: string, lang: Language = 'pt'): Promise<string[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere 3 pontos de meditação para: "${text}" no idioma ${lang}. JSON: string[]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getSaintsList = async (lang: Language = 'pt'): Promise<Saint[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Lista de 12 grandes santos em JSON (idioma ${lang}).`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const searchSaint = async (name: string, lang: Language = 'pt'): Promise<Saint | null> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Biografia de ${name} em JSON Saint (idioma ${lang}).`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", null);
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { voiceName: 'Kore' } } }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const getDailyGospel = async (lang: Language = 'pt') => (await getDailyBundle(lang)).gospel;

/**
 * Busca comentário patrístico (Catena Aurea para Evangelhos, Patrística para outros)
 */
export const getCatenaAureaCommentary = async (v: Verse, lang: Language = 'pt') => {
  const ai = getAIInstance();
  const isGospel = ["Mateus", "Marcos", "Lucas", "João"].includes(v.book);
  
  const prompt = isGospel 
    ? `Gere o comentário da 'Catena Aurea' de São Tomás de Aquino para ${v.book} ${v.chapter}:${v.verse}.`
    : `Gere um comentário patrístico (estilo Glosa Ordinária ou Catena) para ${v.book} ${v.chapter}:${v.verse}, citando Padres da Igreja como Santo Agostinho, São Jerônimo ou São João Crisóstomo.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `${prompt} Retorne um JSON com 'content' (o comentário compilado) e 'fathers' (array com os nomes dos Padres citados). Idioma: ${lang}.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING },
          fathers: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  return safeJsonParse(response.text || "", { content: "Comentário indisponível no momento.", fathers: [] });
};

export const getVerseCommentary = async (v: Verse, lang: Language = 'pt'): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere uma breve meditação espiritual (estilo 'Meditatio') para o versículo ${v.book} ${v.chapter}:${v.verse} ("${v.text}"). Foco pastoral e místico. Idioma: ${lang}.`,
  });
  return response.text || "N/A";
};

// Fix for Magisterium.tsx: Add getMagisteriumDocs
export const getMagisteriumDocs = async (category: string, lang: Language = 'pt'): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere uma lista de 5 documentos importantes do Magistério para a categoria: "${category}". Retorne um array JSON de objetos com 'title', 'source', 'content' (resumo curto) e 'year'. Idioma: ${lang}.`,
    config: { 
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            source: { type: Type.STRING },
            content: { type: Type.STRING },
            year: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

// Fix for Colloquium.tsx: Add getTheologicalDialogueStream
export async function* getTheologicalDialogueStream(message: string, lang: Language = 'pt') {
  const ai = getAIInstance();
  const response = await ai.models.generateContentStream({
    model: 'gemini-3-pro-preview',
    contents: message,
    config: {
      systemInstruction: `Você é um doutor da igreja especializado em teologia católica. Responda de forma erudita, citando fontes como a Suma Teológica, o CIC ou o Magistério. Idioma: ${lang}.`,
    },
  });

  for await (const chunk of response) {
    yield chunk.text || "";
  }
}

// Fix for Aquinas.tsx: Add getThomisticSynthesis
export const getThomisticSynthesis = async (topic: string, lang: Language = 'pt'): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Sintetize a questão "${topic}" seguindo o método da Suma Teológica (Objeções, Sed Contra, Respondeo). Idioma: ${lang}.`,
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          objections: { type: Type.ARRAY, items: { type: Type.STRING } },
          sedContra: { type: Type.STRING },
          respondeo: { type: Type.STRING },
          replies: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

// Fix for LiturgicalCalendar.tsx: Add getWeeklyCalendar
export const getWeeklyCalendar = async (lang: Language = 'pt'): Promise<LiturgyInfo[]> => {
  const ai = getAIInstance();
  const today = new Date().toLocaleDateString('pt-BR');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere o calendário litúrgico para os próximos 7 dias a partir de ${today}. Retorne um array JSON de objetos LiturgyInfo (color, season, rank, dayName, cycle, week, date). Idioma: ${lang}.`,
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            color: { type: Type.STRING },
            season: { type: Type.STRING },
            rank: { type: Type.STRING },
            dayName: { type: Type.STRING },
            cycle: { type: Type.STRING },
            week: { type: Type.STRING },
            date: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};
