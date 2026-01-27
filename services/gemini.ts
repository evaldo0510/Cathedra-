
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StudyResult, Verse, Saint, ThomisticArticle, Language, QuizQuestion, LiturgyInfo, Gospel, UniversalSearchResult } from "../types";

// Always use named parameter for initialization
const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const safeJsonParse = (text: string | undefined, fallback: any) => {
  try {
    if (!text) return fallback;
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean) || fallback;
  } catch (e) { return fallback; }
};

/**
 * CATEGORIA 1: ESTUDO APROFUNDADO (Symphonia)
 */
export const getIntelligentStudy = async (topic: string, lang: Language = 'pt'): Promise<StudyResult> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analise teologicamente o tema: "${topic}". Conecte Escritura, Catecismo e Magistério. Idioma: ${lang}. Retorne JSON rigoroso.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          summary: { type: Type.STRING },
          bibleVerses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                book: { type: Type.STRING },
                chapter: { type: Type.NUMBER },
                verse: { type: Type.NUMBER },
                text: { type: Type.STRING }
              }
            }
          },
          catechismParagraphs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                number: { type: Type.NUMBER },
                content: { type: Type.STRING }
              }
            }
          },
          magisteriumDocs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                source: { type: Type.STRING },
                year: { type: Type.STRING },
                summary: { type: Type.STRING }
              }
            }
          },
          saintsQuotes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                saint: { type: Type.STRING },
                quote: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  return safeJsonParse(response.text, {});
};

// Fix for Saints.tsx: Module '"../services/gemini"' has no exported member 'searchSaint'.
export const searchSaint = async (name: string): Promise<Partial<Saint>> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça detalhes biográficos e uma citação famosa do santo: "${name}". Retorne JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          biography: { type: Type.STRING },
          quote: { type: Type.STRING }
        }
      }
    }
  });
  return safeJsonParse(response.text, {});
};

// Fix for Magisterium.tsx: Module '"../services/gemini"' has no exported member 'getMagisteriumDocs'.
export const getMagisteriumDocs = async (category: string, lang: Language = 'pt'): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Liste 4 documentos importantes do Magistério na categoria: "${category}". Idioma: ${lang}. Retorne JSON ARRAY de objetos com title, source, year, summary.`,
    config: {
      responseMimeType: "application/json"
    }
  });
  return safeJsonParse(response.text, []);
};

// Fix for Magisterium.tsx: Module '"../services/gemini"' has no exported member 'getMagisteriumDeepDive'.
export const getMagisteriumDeepDive = async (title: string, lang: Language = 'pt'): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Análise profunda do documento: "${title}". Idioma: ${lang}. Retorne JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          historicalContext: { type: Type.STRING },
          corePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          modernApplication: { type: Type.STRING },
          relatedCatechism: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  return safeJsonParse(response.text, {});
};

// Fix for Dogmas.tsx: Module '"../services/gemini"' has no exported member 'getDogmas'.
export const getDogmas = async (query: string): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Pesquise dogmas católicos relacionados a: "${query}". Retorne um JSON ARRAY.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            definition: { type: Type.STRING },
            council: { type: Type.STRING },
            year: { type: Type.STRING },
            period: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            sourceUrl: { type: Type.STRING }
          }
        }
      }
    }
  });
  return safeJsonParse(response.text, []);
};

// Fix for Colloquium.tsx: Module '"../services/gemini"' has no exported member 'getTheologicalDialogueStream'.
export async function* getTheologicalDialogueStream(message: string) {
  const ai = getAIInstance();
  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: message,
    config: {
      systemInstruction: "Você é um 'Doctor Angelicus', um mestre em teologia respondendo com o rigor de S. Tomás de Aquino e a clareza do Magistério. Use português solene e acolhedor."
    }
  });

  for await (const chunk of responseStream) {
    if (chunk.text) yield chunk.text;
  }
}

// Fix for Aquinas.tsx: Module '"../services/gemini"' has no exported member 'getThomisticSynthesis'.
export const getThomisticSynthesis = async (query: string): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Crie uma síntese escolástica sobre: "${query}". Siga a estrutura da Summa Theologiae. Retorne JSON.`,
    config: {
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
  return safeJsonParse(response.text, {});
};

// Fix for LiturgicalCalendar.tsx: Module '"../services/gemini"' has no exported member 'fetchMonthlyCalendar'.
export const fetchMonthlyCalendar = async (month: number, year: number, lang: string = 'pt'): Promise<LiturgyInfo[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere o calendário litúrgico católico para ${month}/${year}. Idioma: ${lang}. Retorne JSON ARRAY de LiturgyInfo.`,
    config: {
      responseMimeType: "application/json"
    }
  });
  return safeJsonParse(response.text, []);
};

// Fix for LectioDivina.tsx: Module '"../services/gemini"' has no exported member 'getLectioPoints'.
export const getLectioPoints = async (text: string): Promise<string[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça 3 pontos de meditação teológica para a seguinte passagem: "${text}". Retorne JSON ARRAY de strings.`,
    config: {
      responseMimeType: "application/json"
    }
  });
  return safeJsonParse(response.text, []);
};

// Fix for LectioDivina.tsx: Module '"../services/gemini"' has no exported member 'getDailyGospel'.
export const getDailyGospel = async (): Promise<Gospel> => {
  const ai = getAIInstance();
  const today = new Date().toISOString().split('T')[0];
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça o Evangelho do dia para a data ${today} conforme o lecionário católico. Retorne JSON com reference e text.`,
    config: {
      responseMimeType: "application/json"
    }
  });
  return safeJsonParse(response.text, { reference: 'João 1, 1', text: 'No princípio era o Verbo...' });
};

// Fix for notifications.ts: Module '"./gemini"' has no exported member 'getDailyBundle'.
export const getDailyBundle = async (lang: Language = 'pt'): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça o Santo do dia e o Evangelho do dia para hoje. Idioma: ${lang}. Retorne JSON { saint: { name: "string" }, gospel: { reference: "string" } }.`,
    config: {
      responseMimeType: "application/json"
    }
  });
  return safeJsonParse(response.text, {});
};

// Fix for Breviary.tsx: Module '"../services/gemini"' has no exported member 'fetchBreviaryHour'.
export const fetchBreviaryHour = async (hourName: string, lang: Language = 'pt'): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere a hora litúrgica "${hourName}" do Breviário Romano para hoje. Idioma: ${lang}. Retorne JSON com hourName, invitatory, hymn, psalms (ARRAY de {ref, text}), prayer.`,
    config: {
      responseMimeType: "application/json"
    }
  });
  return safeJsonParse(response.text, {});
};

// Fix for Poenitentia.tsx: Module '"../services/gemini"' has no exported member 'getMoralDiscernment'.
export const getMoralDiscernment = async (input: string, lang: Language = 'pt'): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analise a gravidade moral deste ato sob a ótica do Catecismo: "${input}". Idioma: ${lang}. Retorne JSON com gravity (mortal/venial), explanation, cicRef.`,
    config: {
      responseMimeType: "application/json"
    }
  });
  return safeJsonParse(response.text, {});
};

// Fix for Litanies.tsx: Module '"../services/gemini"' has no exported member 'fetchLitanies'.
export const fetchLitanies = async (type: string, lang: Language = 'pt'): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere os itens da ladainha: "${type}". Idioma: ${lang}. Retorne JSON { title: string, items: ARRAY of { call, response } }.`,
    config: {
      responseMimeType: "application/json"
    }
  });
  return safeJsonParse(response.text, { title: type, items: [] });
};

// Fix for Certamen.tsx: Module '"../services/gemini"' has no exported member 'fetchQuizQuestions'.
export const fetchQuizQuestions = async (category: string, difficulty: string, lang: Language = 'pt'): Promise<QuizQuestion[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere 5 perguntas de quiz sobre "${category}" nível "${difficulty}". Idioma: ${lang}. Retorne JSON ARRAY de objetos QuizQuestion.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
            category: { type: Type.STRING },
            difficulty: { type: Type.STRING }
          }
        }
      }
    }
  });
  return safeJsonParse(response.text, []);
};

// Fix for CommandCenter.tsx: Module '"../services/gemini"' has no exported member 'universalSearch'.
export const universalSearch = async (query: string, lang: Language = 'pt'): Promise<UniversalSearchResult[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Pesquisa universal no depósito da fé por: "${query}". Idioma: ${lang}. Retorne JSON ARRAY de UniversalSearchResult.`,
    config: {
      responseMimeType: "application/json"
    }
  });
  return safeJsonParse(response.text, []);
};

/**
 * CATEGORIA 2: ANALOGIAS E REFERÊNCIAS (Bíblia vs Catecismo)
 */
export const getTheologicalCorrelation = async (sourceText: string, lang: Language = 'pt'): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Dada a citação: "${sourceText}", identifique 3 parágrafos do CIC e 2 passagens bíblicas análogas. Idioma: ${lang}. Retorne JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

/**
 * CATEGORIA 3: O QUE OS OUTROS DISSERAM (Tradição e Tomás)
 */
export const fetchThomisticArticle = async (work: string, reference: string, lang: Language = 'pt'): Promise<ThomisticArticle> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Artigo de S. Tomás de Aquino (${work}) em ${reference}. Idioma: ${lang}. Formato JSON rigoroso.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reference: { type: Type.STRING },
          questionTitle: { type: Type.STRING },
          articleTitle: { type: Type.STRING },
          objections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                text: { type: Type.STRING }
              }
            }
          },
          sedContra: { type: Type.STRING },
          respondeo: { type: Type.STRING },
          replies: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                text: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  return safeJsonParse(response.text, {} as ThomisticArticle);
};

export const getCatenaAureaCommentary = async (verse: Verse): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Comentário da Catena Aurea para ${verse.book} ${verse.chapter}:${verse.verse}. Retorne JSON com content, fathers (string array) e sources.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text, {});
};

// TTS nativo para acessibilidade
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
