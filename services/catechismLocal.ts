
import { CatechismParagraph } from "../types";

export const CIC_STATIC_DATABASE: Record<string, string> = {
  "1": "Deus, infinitamente perfeito e bem-aventurado em si mesmo, em um desígnio de pura bondade, criou livremente o homem para fazê-lo participar de sua vida bem-aventurada.",
  "2": "Pelo que, em todos os tempos e em todos os lugares, Ele está perto do homem.",
  "27": "O desejo de Deus está inscrito no coração do homem, já que o homem é criado por Deus e para Deus; e Deus não cessa de atrair o homem para si.",
  "121": "O Antigo Testamento é uma parte da Sagrada Escritura da qual não se pode prescindir. Seus livros são divinamente inspirados.",
  "422": "Mas, quando veio a plenitude dos tempos, Deus enviou seu Filho.",
  "1324": "A Eucaristia é fonte e ápice de toda a vida cristã.",
  "2113": "A idolatria não diz respeito apenas aos falsos cultos do paganismo. Ela continua a ser uma tentação constante para a fé.",
  "2558": "O mistério da fé é grande. A Igreja o confessa no Símbolo dos Apóstolos."
};

export const CIC_PARTS = [
  { id: '1', title: 'A Profissão da Fé', color: 'bg-sacred' },
  { id: '2', title: 'A Celebração do Mistério', color: 'bg-gold' },
  { id: '3', title: 'A Vida em Cristo', color: 'bg-emerald-700' },
  { id: '4', title: 'A Oração Cristã', color: 'bg-blue-700' }
];

export const CIC_STRUCTURE: Record<string, any[]> = {
  "1": [
    { id: "1.1", title: "O Homem é capaz de Deus", chapters: ["1", "2"] },
    { id: "1.2", title: "Deus ao encontro do homem", chapters: ["1", "2", "3"] }
  ],
  "2": [
    { id: "2.1", title: "A Economia Sacramental", chapters: ["1", "2"] },
    { id: "2.2", title: "Os Sete Sacramentos", chapters: ["1", "2", "3"] }
  ],
  "3": [
    { id: "3.1", title: "A Vocação do Homem", chapters: ["1", "2"] },
    { id: "3.2", title: "Os Dez Mandamentos", chapters: ["1", "2", "3", "4", "5"] }
  ],
  "4": [
    { id: "4.1", title: "A Oração na Vida Cristã", chapters: ["1", "2"] },
    { id: "4.2", title: "O Pai-Nosso", chapters: ["1", "2"] }
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
  return Object.entries(CIC_STATIC_DATABASE)
    .filter(([_, text]) => text.toLowerCase().includes(q))
    .map(([num, text]) => ({
      number: Number(num),
      content: text,
      context: "Resultado da Busca"
    }));
}

export function getParagraphsForChapter(partId: string, sectionTitle: string, chapterId: string): CatechismParagraph[] {
  const base = Number(partId) * 100 + Number(chapterId) * 10;
  const nums = [base + 1, base + 2, base + 3, base + 4, base + 5];
  
  return nums.map(n => ({
    number: n,
    content: CIC_STATIC_DATABASE[String(n)] || `O parágrafo ${n} faz parte da síntese de ${sectionTitle} no capítulo ${chapterId}. Conteúdo em indexação local para suporte offline.`,
    context: `Parte ${partId}, ${sectionTitle}`
  }));
}
