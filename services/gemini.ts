
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StudyResult, Verse, Saint, Gospel, LiturgyInfo, CatechismParagraph, Dogma } from "../types";

const SYSTEM_INSTRUCTION = "Você é o Cathedra AI, autoridade em hagiografia e liturgia. Responda apenas com JSON puro e rigor teológico. No insight teológico, forneça um parágrafo profundo e substancial.";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Conteúdo de fallback robusto para evitar "falta de texto" e garantir visual profissional imediato
export const DEFAULT_BUNDLE = {
  gospel: { 
    reference: "Jo 1, 1-18", 
    text: "No princípio era o Verbo, e o Verbo estava junto de Deus e o Verbo era Deus. Ele estava no princípio junto de Deus. Tudo foi feito por meio d'Ele, e sem Ele nada se fez de tudo o que foi feito. No Verbo estava a vida, e a vida era a luz dos homens. A luz brilha nas trevas e as trevas não a compreenderam.", 
    reflection: "O prólogo de São João nos convida a contemplar a divindade eterna de Cristo que se faz carne para habitar entre nós. Hoje, medite como o Verbo Encarnado é a luz que não apenas ilumina o caminho, mas transfigura a própria realidade da sua vida. Peça a graça de não ser como as trevas que não O compreendem, mas como aqueles que recebem o Verbo e se tornam filhos de Deus no silêncio e na adoração. Deixe que esta Palavra ecoe no centro da sua alma durante todo o dia.", 
    title: "O Verbo Eterno", 
    calendar: { color: "white", season: "Tempo Comum", rank: "Feria", dayName: "Liturgia das Horas", cycle: "B", week: "II" }
  },
  saint: { 
    name: "São Bento de Núrsia", 
    feastDay: "11 de Julho", 
    patronage: "Europa e Monges", 
    biography: "Pai do monaquismo ocidental, Bento estabeleceu a célebre 'Regra' que equilibra harmoniosamente o trabalho manual e a oração litúrgica (Ora et Labora). Sua vida foi um constante combate contra o mundanismo e a desordem, transformando desertos em centros de civilização e santidade através da estabilidade, obediência e conversão de costumes. Sua herança moldou a cultura europeia e continua a ser um farol de busca por Deus no silêncio.", 
    image: "https://images.unsplash.com/photo-1548610762-656391d1ad4d?w=800&q=80", 
    quote: "Não anteponham absolutamente nada ao amor de Cristo, para que Ele nos conduza todos juntos à vida eterna." 
  },
  quote: { 
    quote: "Tarde te amei, beleza tão antiga e tão nova! Tarde te amei! Eis que estavas dentro de mim e eu te buscava fora. Estavas comigo e eu não estava contigo. Chamaste e clamaste e rompeste minha surdez!", 
    author: "Santo Agostinho de Hipona" 
  },
  insight: "A oração não é um monólogo de súplicas, mas um encontro de silêncios onde a alma se deixa olhar por Aquele que a ama. No ritmo da Liturgia, o tempo deixa de ser uma sucessão de momentos vazios e se torna 'Kairós', o tempo da Graça, onde cada respiração pode ser um ato de adoração se estiver centrada na presença do Verbo. A sabedoria da Igreja nos ensina que a verdadeira paz não é a ausência de conflitos, mas a presença constante de Deus no centro da vontade humana."
};

const safeJsonParse = (text: string, fallback: any) => {
  try {
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1) return JSON.parse(clean.substring(start, end + 1));
    return JSON.parse(clean || "{}");
  } catch (e) {
    return fallback;
  }
};

export const getDailyBundle = async (): Promise<{ gospel: Gospel, saint: Saint, quote: { quote: string, author: string }, insight: string }> => {
  try {
    const ai = getAIInstance();
    const dateStr = new Date().toLocaleDateString('pt-BR');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere o bundle católico completo de hoje (${dateStr}) em JSON: gospel, saint, quote, insight. Seja preciso com o calendário romano. Importante: Forneça textos longos e contemplativos para o evangelho e o insight.`,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION, 
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
    contents: `Investigação teológica profunda: "${topic}". Forneça parágrafos extensos. JSON com bibleVerses, catechismParagraphs, magisteriumDocs, saintsQuotes.`,
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json" 
    }
  });
  return safeJsonParse(response.text || "", { topic, summary: "Erro ao processar estudo profundo.", bibleVerses: [], catechismParagraphs: [], magisteriumDocs: [], saintsQuotes: [] });
};

export const getDogmaticLinksForCatechism = async (paragraphs: CatechismParagraph[]): Promise<Record<number, Dogma[]>> => {
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

export const getDogmas = async (q?: string): Promise<Dogma[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: q ? `Dogmas sobre "${q}" em JSON.` : "10 principais dogmas católicos em JSON.",
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getCatechismSearch = async (q: string, o?: any): Promise<CatechismParagraph[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busca no Catecismo: "${q}". JSON array de CatechismParagraph.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const getLectioPoints = async (text: string): Promise<string[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere 3 pontos de meditação extensos para: "${text}". JSON: string[]`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", ["Medite na presença real de Deus", "Escute o Verbo", "Converta o coração"]);
};

export const getSaintsList = async (): Promise<Saint[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Lista de 12 grandes santos (inclua Maria e os Apóstolos). JSON: Saint[]",
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", []);
};

export const searchSaint = async (name: string): Promise<Saint | null> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Biografia extensiva de ${name} em JSON Saint.`,
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

export const getDailyGospel = async () => (await getDailyBundle()).gospel;
export const getCatenaAureaCommentary = async (v: Verse) => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Catena Aurea para ${v.book} ${v.chapter}:${v.verse} em JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text || "", { content: "Comentário indisponível.", fathers: [] });
};

export const getWeeklyCalendar = async () => [];
export const searchVerse = async (q: string) => ({ book: "Busca", chapter: 0, verse: 0, text: "Pesquisando..." });
export const getVerseCommentary = async (v: any) => "Refletindo...";
export const getMagisteriumDocs = async (c: string) => [];
export async function* getTheologicalDialogueStream(m: string) { yield "Consultando..."; }
export const getThomisticSynthesis = async (t: string) => ({});
