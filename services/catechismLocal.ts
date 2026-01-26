
import { CatechismParagraph } from "../types";

// Base de Dados Estática (Exemplos fundamentais)
export const CIC_STATIC_DATABASE: Record<string, string> = {
  "1": "Deus, infinitamente perfeito e bem-aventurado em si mesmo, em um desígnio de pura bondade, criou livremente o homem para fazê-lo participar de sua vida bem-aventurada.",
  "27": "O desejo de Deus está inscrito no coração do homem, já que o homem é criado por Deus e para Deus; e Deus não cessa de atrair o homem para si.",
  "121": "O Antigo Testamento é uma parte da Sagrada Escritura da qual não se pode prescindir. Seus livros são divinamente inspirados e conservam um valor permanente.",
  "422": "'Mas, quando veio a plenitude dos tempos, Deus enviou seu Filho, nascido de uma mulher, nascido sob a Lei, para resgatar os que estavam sob a Lei'.",
  "1113": "Toda a vida litúrgica da Igreja gira em torno do Sacrifício eucarístico e dos sacramentos. Há na Igreja sete sacramentos: o Batismo, a Confirmação ou Crisma, a Eucaristia, a Penitência, a Unção dos Enfermos, a Ordem e o Matrimônio.",
  "1324": "A Eucaristia é 'fonte e ápice de toda a vida cristã'. Os demais sacramentos, assim como todos os ministérios eclesiásticos, vinculam-se à sagrada Eucaristia.",
  "2113": "A idolatria não diz respeito apenas aos falsos cultos do paganismo. Ela continua a ser uma tentação constante para a fé. Ela consiste em divinizar o que não é Deus.",
  "2558": "'O mistério da fé é grande'. A Igreja o confessa no Símbolo dos Apóstolos e o celebra na Liturgia sacramental, para que a vida dos fiéis seja conformada a Cristo."
};

export const CIC_PARTS = [
  { id: '1', title: 'A Profissão da Fé', subtitle: 'A Fé Professada (O Credo)', color: 'bg-sacred' },
  { id: '2', title: 'A Celebração do Mistério', subtitle: 'A Fé Celebrada (Liturgia e Sacramentos)', color: 'bg-gold' },
  { id: '3', title: 'A Vida em Cristo', subtitle: 'A Fé Vivida (Os Mandamentos)', color: 'bg-emerald-700' },
  { id: '4', title: 'A Oração Cristã', subtitle: 'A Fé Rezada (O Pai-Nosso)', color: 'bg-blue-700' }
];

export const CIC_STRUCTURE: Record<string, any[]> = {
  "1": [
    { id: "1.1", title: "O Homem é capaz de Deus", chapters: ["1", "2"] },
    { id: "1.2", title: "Deus ao encontro do homem", chapters: ["1", "2", "3"] },
    { id: "1.3", title: "A Resposta do homem a Deus", chapters: ["1", "2"] }
  ],
  "2": [
    { id: "2.1", title: "A Economia Sacramental", chapters: ["1", "2"] },
    { id: "2.2", title: "Os Sete Sacramentos da Igreja", chapters: ["1", "2", "3", "4"] }
  ],
  "3": [
    { id: "3.1", title: "A Vocação do Homem: A Vida no Espírito", chapters: ["1", "2", "3"] },
    { id: "3.2", title: "Os Dez Mandamentos", chapters: ["1", "2", "3", "4", "5"] }
  ],
  "4": [
    { id: "4.1", title: "A Oração na Vida Cristã", chapters: ["1", "2", "3"] },
    { id: "4.2", title: "A Oração do Senhor: Pai-Nosso", chapters: ["1", "2"] }
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

export function getParagraphsForChapter(partId: string, sectionTitle: string, chapterId: string): CatechismParagraph[] {
  // Simulação de parágrafos baseada na estrutura
  const base = Number(partId) * 100 + Number(chapterId) * 10;
  const nums = [base + 1, base + 2, base + 3];
  
  return nums.map(n => ({
    number: n,
    content: CIC_STATIC_DATABASE[String(n)] || `O parágrafo ${n} trata de temas fundamentais sobre ${sectionTitle.toLowerCase()} no capítulo ${chapterId}. [Texto em fase de indexação total]`,
    context: `Parte ${partId}, ${sectionTitle}`
  }));
}
