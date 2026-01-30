
import { CatechismParagraph } from "../types";
import { getCatechismRangeFromCloud } from "./supabase";
import { offlineStorage } from "./offlineStorage";
import { fetchCatechismRange } from "./gemini";

export const CIC_PARTS = [
  { id: '1', title: 'A Profissão da Fé (Credo)', color: 'bg-sacred', range: [1, 1065] },
  { id: '2', title: 'A Celebração do Mistério Cristão (Sacramentos)', color: 'bg-gold', range: [1066, 1690] },
  { id: '3', title: 'A Vida em Cristo (Moral)', color: 'bg-emerald-700', range: [1691, 2557] },
  { id: '4', title: 'A Oração Cristã (Pai Nosso)', color: 'bg-stone-800', range: [2558, 2865] }
];

export const CIC_STRUCTURE: Record<string, any[]> = {
  "1": [
    { id: "1.1", title: "O Homem é capaz de Deus", chapters: [{ name: "O desejo de Deus", start: 27, end: 30 }, { name: "Caminhos do conhecimento", start: 31, end: 38 }] },
    { id: "1.2", title: "Deus vem ao encontro do Homem", chapters: [{ name: "A Revelação", start: 50, end: 73 }, { name: "A Sagrada Escritura", start: 101, end: 141 }] },
    { id: "1.3", title: "A Resposta do Homem a Deus", chapters: [{ name: "Eu creio", start: 144, end: 184 }] }
  ],
  "2": [
    { id: "2.1", title: "A Economia Sacramental", chapters: [{ name: "O Mistério Pascal", start: 1076, end: 1112 }, { name: "Os sete sacramentos", start: 1113, end: 1134 }] },
    { id: "2.2", title: "Os Sete Sacramentos da Igreja", chapters: [{ name: "Batismo", start: 1213, end: 1284 }, { name: "Eucaristia", start: 1322, end: 1419 }] }
  ],
  "3": [
    { id: "3.1", title: "A Vocação do Homem", chapters: [{ name: "Dignidade da pessoa", start: 1700, end: 1876 }, { name: "A Lei Moral", start: 1950, end: 1986 }] },
    { id: "3.2", title: "Os Dez Mandamentos", chapters: [{ name: "Amarás ao Senhor", start: 2084, end: 2195 }, { name: "Amarás ao próximo", start: 2196, end: 2557 }] }
  ],
  "4": [
    { id: "4.1", title: "A Oração na Vida Cristã", chapters: [{ name: "Revelação da Oração", start: 2566, end: 2649 }, { name: "A tradição da Oração", start: 2650, end: 2696 }] },
    { id: "4.2", title: "A Oração do Senhor: Pai-Nosso", chapters: [{ name: "Síntese do Evangelho", start: 2759, end: 2865 }] }
  ]
};

export const catechismService = {
  /**
   * Carrega parágrafos com hierarquia: IndexedDB -> Cloud SQL -> Gemini AI
   */
  async getParagraphs(start: number, end: number): Promise<CatechismParagraph[]> {
    // 1. Tentar Offline (IndexedDB)
    let cached: CatechismParagraph[] = [];
    for (let i = start; i <= end; i++) {
      const p = await offlineStorage.getContent(`cic-${i}`);
      if (p) cached.push(p);
    }

    if (cached.length === (end - start + 1)) return cached;

    // 2. Tentar Cloud SQL (Supabase)
    try {
      const cloudData = await getCatechismRangeFromCloud(start, end);
      if (cloudData && cloudData.length > 0) {
        const mapped: CatechismParagraph[] = cloudData.map(p => ({
          number: p.paragraph_number,
          content: p.text,
          context: p.section || "Doutrina"
        }));
        
        // Salvar novos dados localmente
        for (const p of mapped) {
          await offlineStorage.saveContent(`cic-${p.number}`, 'catechism', `CIC §${p.number}`, p);
        }
        return mapped;
      }
    } catch (e) {
      console.warn("SQL Catechism fetch failed, falling back to AI.");
    }

    // 3. Fallback para Gemini AI
    const fetched = await fetchCatechismRange(start, end);
    for (const p of fetched) {
      await offlineStorage.saveContent(`cic-${p.number}`, 'catechism', `CIC §${p.number}`, p);
    }
    return fetched;
  }
};
