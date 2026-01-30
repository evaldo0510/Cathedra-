
import { LearningTrack } from "../types";

export const NATIVE_TRACKS: LearningTrack[] = [
  {
    id: "fundamentos-fe",
    title: "Fundamentos da Fé",
    description: "A base segura para compreender a fé católica a partir da Escritura e do Catecismo.",
    level: "Iniciante",
    icon: "🏛️",
    image: "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=1200",
    modules: [
      {
        id: "revelacao",
        title: "Revelação e Palavra",
        content: [
          { type: "biblia", ref: "João 1:1-5", label: "O Prólogo do Verbo" },
          { type: "cic", ref: "50", label: "O desejo de Deus pelo homem" },
          { type: "cic", ref: "73", label: "A Revelação de Si mesmo" }
        ]
      },
      {
        id: "tradicao",
        title: "Tradição e Magistério",
        content: [
          { type: "cic", ref: "74", label: "A Transmissão da Revelação" },
          { type: "documento", ref: "Dei Verbum", label: "Constituição sobre a Revelação" }
        ]
      }
    ]
  },
  {
    id: "vias-aquinate",
    title: "Iniciação ao Tomismo",
    description: "Um percurso pelas 'Cinco Vias' de Santo Tomás para provar a existência de Deus pela razão.",
    level: "Avançado",
    icon: "✍️",
    image: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=1200",
    modules: [
      {
        id: "via-movimento",
        title: "O Primeiro Motor",
        content: [
          { type: "cic", ref: "31", label: "As vias para conhecer Deus" },
          { type: "cic", ref: "34", label: "O mundo e a pessoa humana" }
        ]
      }
    ]
  }
];

export const getTrackById = (id: string) => NATIVE_TRACKS.find(t => t.id === id);
