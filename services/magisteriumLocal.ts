
import { MagisteriumDoc } from "../types";

export const NATIVE_MAGISTERIUM: Record<string, MagisteriumDoc[]> = {
  "Concílios Ecumênicos": [
    { title: "Sacrosanctum Concilium", source: "Vaticano II", year: "1963", summary: "Constituição sobre a Sagrada Liturgia. Recupera a participação ativa dos fiéis." },
    { title: "Lumen Gentium", source: "Vaticano II", year: "1964", summary: "Constituição Dogmática sobre a Igreja. A Igreja como Mistério e Povo de Deus." },
    { title: "Dei Verbum", source: "Vaticano II", year: "1965", summary: "Sobre a Revelação Divina. O nexo entre Escritura, Tradição e Magistério." },
    { title: "Decretos de Trento", source: "Concílio de Trento", year: "1545", summary: "A resposta firme à reforma, definindo o cânon e os sacramentos." }
  ],
  "Documentos Pontifícios": [
    { title: "Humanae Vitae", source: "São Paulo VI", year: "1968", summary: "Sobre a regulação da natalidade e a dignidade do amor humano." },
    { title: "Fides et Ratio", source: "São João Paulo II", year: "1998", summary: "Sobre a relação necessária entre a fé e a razão." },
    { title: "Spe Salvi", source: "Bento XVI", year: "2007", summary: "Encíclica sobre a esperança cristã no mundo contemporâneo." }
  ],
  "Doutrina Social": [
    { title: "Rerum Novarum", source: "Leão XIII", year: "1891", summary: "A primeira encíclica social, tratando da condição dos operários." },
    { title: "Caritas in Veritate", source: "Bento XVI", year: "2009", summary: "O desenvolvimento humano integral na caridade e na verdade." },
    { title: "Laudato Si'", source: "Papa Francisco", year: "2015", summary: "Sobre o cuidado da casa comum e a ecologia integral." }
  ],
  "Símbolos da Fé (Credos)": [
    { title: "Símbolo Apostólico", source: "Tradição", year: "Séc II", summary: "A regra de fé mais antiga e venerável da Igreja Romana." },
    { title: "Credo Niceno-Constantinopolitano", source: "Nicéia/Constantinopla", year: "381", summary: "A definição solene da divindade de Cristo e do Espírito Santo." }
  ]
};

export const getMagisteriumCategories = () => Object.keys(NATIVE_MAGISTERIUM);
export const getDocsByCategory = (cat: string) => NATIVE_MAGISTERIUM[cat] || [];
