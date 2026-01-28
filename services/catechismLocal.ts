
import { CatechismParagraph } from "../types";

export const CIC_STATIC_DATABASE: Record<string, string> = {
  "1": "Deus, infinitamente perfeito e bem-aventurado em Si mesmo, segundo um desígnio de pura bondade, criou livremente o homem para o fazer participar na Sua vida bem-aventurada. Por isso, em todos os tempos e em todos os lugares, Deus está perto do homem. Chama-o e ajuda-o a procurá-Lo, a conhecê-Lo e a amá-Lo com todas as suas forças.",
  "27": "O desejo de Deus está inscrito no coração do homem, já que o homem é criado por Deus e para Deus; e Deus não cessa de atrair o homem para Si, e só n'Ele o homem encontrará a verdade e a felicidade que não cessa de procurar.",
  "121": "O Antigo Testamento é uma parte da Sagrada Escritura da qual não se pode prescindir. Os seus livros são divinamente inspirados e conservam um valor permanente, porque a Antiga Aliança nunca foi revogada.",
  "1324": "A Eucaristia é «fonte e cume de toda a vida cristã». «Os restantes sacramentos, assim como todos os ministérios eclesiásticos e obras de apostolado, estão estreitamente ligados à sagrada Eucaristia e a ela se ordenam».",
  "2558": "«A oração é a elevação da alma a Deus ou o pedido a Deus dos bens convenientes». De onde falamos nós, ao rezar? Da altura do nosso orgulho e da nossa vontade própria, ou das «profundezas» (Sl 130, 1) de um coração humilde e contrito?",
  "2759": "Jesus «estava um dia a rezar em certo lugar. Quando acabou, disse-Lhe um dos discípulos: “Senhor, ensina-nos a rezar, como João ensinou os seus discípulos”» (Lc 11, 1). É em resposta a este pedido que o Senhor confia aos Seus discípulos e à Sua Igreja a oração cristã fundamental."
};

export const CIC_PARTS = [
  { id: '1', title: 'A Profissão da Fé', color: 'bg-sacred', range: [1, 1065] },
  { id: '2', title: 'A Celebração do Mistério', color: 'bg-gold', range: [1066, 1690] },
  { id: '3', title: 'A Vida em Cristo', color: 'bg-emerald-700', range: [1691, 2557] },
  { id: '4', title: 'A Oração Cristã', color: 'bg-blue-700', range: [2558, 2865] }
];

export const CIC_STRUCTURE: Record<string, any[]> = {
  "1": [
    { id: "1.1", title: "O Homem é 'capaz' de Deus", chapters: [
      { name: "O desejo de Deus", start: 27, end: 30 },
      { name: "Caminhos de conhecimento", start: 31, end: 38 }
    ]}
  ],
  "2": [
    { id: "2.1", title: "A Eucaristia", chapters: [
      { name: "Fonte e Cume", start: 1322, end: 1419 }
    ]}
  ],
  "4": [
    { id: "4.1", title: "A Oração do Senhor", chapters: [
      { name: "Pai Nosso", start: 2759, end: 2865 }
    ]}
  ]
};

export function getParagraphLocal(num: number): CatechismParagraph | null {
  const text = CIC_STATIC_DATABASE[String(num)];
  if (text) return { number: num, content: text, context: "Texto Integral Oficial (Editio Typica)" };
  return { 
    number: num, 
    content: `Conteúdo integral do §${num} aguardando sincronização de rede. Consulte parágrafos âncora como o §1 ou §1324 no modo offline.`,
    context: "Referência Doutrinária"
  };
}

export function searchCatechismLocal(query: string): CatechismParagraph[] {
  const q = query.toLowerCase();
  return Object.entries(CIC_STATIC_DATABASE)
    .filter(([_, text]) => text.toLowerCase().includes(q))
    .map(([num, text]) => ({
      number: Number(num),
      content: text,
      context: "Codex Fidei"
    }));
}

export function getParagraphsForChapter(start: number, end: number, chapterName: string): CatechismParagraph[] {
  const result: CatechismParagraph[] = [];
  const limit = Math.min(start + 50, end);
  for (let i = start; i <= limit; i++) {
    result.push({
      number: i,
      content: CIC_STATIC_DATABASE[String(i)] || `Resumo do estudo: ${chapterName}. Texto em carregamento...`,
      context: chapterName
    });
  }
  return result;
}
