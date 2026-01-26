
import { CatechismHierarchy } from "../types";

export const CIC_STRUCTURE: Record<string, CatechismHierarchy[]> = {
  "part_1": [
    { id: "p1_s1", title: "A Vida do Homem: Conhecer e Amar a Deus", level: "section" },
    { id: "p1_s2", title: "A Profissão da Fé Cristã: O Credo", level: "section" }
  ],
  "part_2": [
    { id: "p2_s1", title: "A Economia Sacramental", level: "section" },
    { id: "p2_s2", title: "Os Sete Sacramentos da Igreja", level: "section" }
  ],
  "part_3": [
    { id: "p3_s1", title: "A Vocação do Homem: A Vida no Espírito", level: "section" },
    { id: "p3_s2", title: "Os Dez Mandamentos", level: "section" }
  ],
  "part_4": [
    { id: "p4_s1", title: "A Oração na Vida Cristã", level: "section" },
    { id: "p4_s2", title: "A Oração do Senhor: Pai Nosso", level: "section" }
  ],
  "p1_s1": [
    { id: "p1_s1_c1", title: "O Homem é 'capaz' de Deus", level: "chapter" },
    { id: "p1_s1_c2", title: "Deus vem ao encontro do Homem", level: "chapter" },
    { id: "p1_s1_c3", title: "A Resposta do Homem a Deus", level: "chapter" }
  ],
  "p1_s2": [
    { id: "p1_s2_c1", title: "Creio em Deus Pai", level: "chapter" },
    { id: "p1_s2_c2", title: "Creio em Jesus Cristo", level: "chapter" },
    { id: "p1_s2_c3", title: "Creio no Espírito Santo", level: "chapter" }
  ],
  "p3_s2": [
    { id: "m1", title: "1º Mandamento: Amar a Deus sobre todas as coisas", level: "article" },
    { id: "m2", title: "2º Mandamento: Não tomar seu Santo Nome em vão", level: "article" },
    { id: "m3", title: "3º Mandamento: Guardar Domingos e Festas", level: "article" },
    { id: "m4", title: "4º Mandamento: Honrar Pai e Mãe", level: "article" },
    { id: "m5", title: "5º Mandamento: Não Matar", level: "article" }
  ]
};

export const CIC_STATIC_PARAGRAPHS: Record<string, string> = {
  "1": "Deus, infinitamente perfeito e bem-aventurado em si mesmo, em um desígnio de pura bondade, criou livremente o homem para fazê-lo participar de sua vida bem-aventurada.",
  "27": "O desejo de Deus está inscrito no coração do homem, já que o homem é criado por Deus e para Deus.",
  "121": "O Antigo Testamento é uma parte da Sagrada Escritura da qual não se pode prescindir. Seus livros são divinamente inspirados e conservam um valor permanente.",
  "422": "'Mas, quando veio a plenitude dos tempos, Deus enviou seu Filho, nascido de uma mulher, nascido sob a Lei, para resgatar os que estavam sob a Lei, a fim de que recebêssemos a adoção filial' (Gl 4,4-5).",
  "1324": "A Eucaristia é 'fonte e ápice de toda a vida cristã'.",
  "2558": "'O mistério da fé é grande'. A Igreja o confessa no Símbolo dos Apóstolos e o celebra na Liturgia sacramental, para que a vida dos fiéis seja conformada a Cristo no Espírito Santo para a glória de Deus Pai."
};

export const getLocalHierarchy = (parentId?: string): CatechismHierarchy[] => {
  if (!parentId) return [];
  return CIC_STRUCTURE[parentId] || [];
};

export const getLocalParagraph = (num: number) => {
  const text = CIC_STATIC_PARAGRAPHS[String(num)];
  if (text) {
    return [{ number: num, content: text, context: "Fonte Local" }];
  }
  return null;
};
