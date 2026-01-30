
import { CatechismParagraph } from "../types";
import { offlineStorage } from "./offlineStorage";
import { fetchCatechismRange } from "./gemini";

const GITHUB_CIC_RAW = 'https://raw.githubusercontent.com/evaldo0510/cathedra-data/main/cic';

export const CIC_PARTS = [
  { id: '1', title: 'A Profissão da Fé', color: 'bg-sacred', range: [1, 1065], file: 'parte1.json' },
  { id: '2', title: 'A Celebração do Mistério Cristão', color: 'bg-gold', range: [1066, 1690], file: 'parte2.json' },
  { id: '3', title: 'A Vida em Cristo', color: 'bg-emerald-700', range: [1691, 2557], file: 'parte3.json' },
  { id: '4', title: 'A Oração Cristã', color: 'bg-stone-800', range: [2558, 2865], file: 'parte4.json' }
];

export const CIC_STRUCTURE: Record<string, any[]> = {
  "1": [
    { id: "1.1", title: "O Homem é capaz de Deus", chapters: [{ name: "O desejo de Deus", start: 27, end: 30 }, { name: "Caminhos do conhecimento", start: 31, end: 38 }] },
    { id: "1.2", title: "Deus vem ao encontro do Homem", chapters: [{ name: "A Revelação", start: 50, end: 73 }, { name: "A Sagrada Escritura", start: 101, end: 141 }] }
  ]
};

export const catechismService = {
  async getParagraphs(start: number, end: number): Promise<CatechismParagraph[]> {
    // 1. Cache Local
    let cached: CatechismParagraph[] = [];
    for (let i = start; i <= end; i++) {
      const p = await offlineStorage.getContent(`cic-${i}`);
      if (p) cached.push(p);
    }
    if (cached.length >= (end - start + 1)) return cached.sort((a,b) => a.number - b.number);

    // 2. Fetch Nativo (GitHub)
    try {
      const part = CIC_PARTS.find(p => start >= p.range[0] && start <= p.range[1]);
      if (part) {
        const res = await fetch(`${GITHUB_CIC_RAW}/${part.file}`, { cache: 'force-cache' });
        if (res.ok) {
          const data = await res.json();
          const filtered = data.paragrafos.filter((p: any) => p.numero >= start && p.numero <= end);
          const mapped = filtered.map((p: any) => ({ 
            number: p.numero, 
            content: p.texto, 
            context: part.title 
          }));
          
          for (const item of mapped) {
            await offlineStorage.saveContent(`cic-${item.number}`, 'catechism', `CIC §${item.number}`, item);
          }
          return mapped;
        }
      }
    } catch (e) {
      console.warn("CIC Nativo Offline. Tentando IA.");
    }

    return await fetchCatechismRange(start, end);
  }
};
