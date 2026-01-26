
import { CatechismParagraph } from "../types";

// Base de Dados Estática (Exemplos fundamentais - Em prod seria o JSON completo de 2865 parágrafos)
export const CIC_STATIC_DATABASE: Record<string, string> = {
  "1": "Deus, infinitamente perfeito e bem-aventurado em si mesmo, em um desígnio de pura bondade, criou livremente o homem para fazê-lo participar de sua vida bem-aventurada.",
  "27": "O desejo de Deus está inscrito no coração do homem, já que o homem é criado por Deus e para Deus; e Deus não cessa de atrair o homem para si.",
  "121": "O Antigo Testamento é uma parte da Sagrada Escritura da qual não se pode prescindir. Seus livros são divinamente inspirados e conservam um valor permanente.",
  "422": "'Mas, quando veio a plenitude dos tempos, Deus enviou seu Filho, nascido de uma mulher, nascido sob a Lei, para resgatar os que estavam sob a Lei'.",
  "1324": "A Eucaristia é 'fonte e ápice de toda a vida cristã'. Os demais sacramentos, assim como todos os ministérios eclesiásticos, vinculam-se à sagrada Eucaristia.",
  "2113": "A idolatria não diz respeito apenas aos falsos cultos do paganismo. Ela continua a ser uma tentação constante para a fé. Ela consiste em divinizar o que não é Deus.",
  "2558": "'O mistério da fé é grande'. A Igreja o confessa no Símbolo dos Apóstolos e o celebra na Liturgia sacramental, para que a vida dos fiéis seja conformada a Cristo."
};

export const CIC_PARTS = [
  { id: '1', title: 'A Profissão da Fé', subtitle: 'O Credo', color: 'bg-sacred' },
  { id: '2', title: 'A Celebração do Mistério', subtitle: 'Os Sacramentos', color: 'bg-gold' },
  { id: '3', title: 'A Vida em Cristo', subtitle: 'Os Dez Mandamentos', color: 'bg-emerald-700' },
  { id: '4', title: 'A Oração Cristã', subtitle: 'O Pai-Nosso', color: 'bg-blue-700' }
];

export const CIC_STRUCTURE: Record<string, any[]> = {
  "1": [
    { id: "1.1", title: "O Homem é capaz de Deus", chapters: ["1", "2"] },
    { id: "1.2", title: "A Profissão da Fé Cristã", chapters: ["1", "2", "3"] }
  ],
  "3": [
    { id: "3.1", title: "A Vocação do Homem", chapters: ["1", "2"] },
    { id: "3.2", title: "Os Dez Mandamentos", chapters: ["1", "2"] }
  ]
};

export function getParagraphLocal(num: number): CatechismParagraph | null {
  const text = CIC_STATIC_DATABASE[String(num)];
  if (text) {
    return { number: num, content: text, context: "Catecismo da Igreja Católica" };
  }
  return null;
}

export function searchCatechismLocal(query: string): CatechismParagraph[] {
  const q = query.toLowerCase();
  if (!isNaN(Number(q))) {
    const p = getParagraphLocal(Number(q));
    return p ? [p] : [];
  }
  
  return Object.entries(CIC_STATIC_DATABASE)
    .filter(([_, text]) => text.toLowerCase().includes(q))
    .slice(0, 10)
    .map(([num, text]) => ({
      number: Number(num),
      content: text,
      context: "Resultado da Busca"
    }));
}

export function getParagraphsForChapter(partId: string, sectionId: string, chapterId: string): CatechismParagraph[] {
  // Mapeamento simulado para demonstração offline
  const base = Number(partId) * 100;
  const nums = [base + 1, base + 2, base + 3];
  return nums.map(n => ({
    number: n,
    content: CIC_STATIC_DATABASE[String(n)] || "Texto oficial em carregamento...",
    context: `Parte ${partId}, Seção ${sectionId}`
  }));
}
