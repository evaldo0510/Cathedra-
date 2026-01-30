
import { MagisteriumDoc } from "../types";

const GITHUB_DOCS_RAW = 'https://raw.githubusercontent.com/evaldo0510/cathedra-data/main/documentos';

export const magisteriumService = {
  async getIndex(): Promise<any[]> {
    try {
      const res = await fetch(`${GITHUB_DOCS_RAW}/index.json`, { cache: 'force-cache' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("Erro ao carregar índice magisterial.");
    }
    return [];
  },

  async getDocuments(category: string): Promise<MagisteriumDoc[]> {
    const index = await this.getIndex();
    const filtered = index.filter((d: any) => 
      category === 'Todos' || d.tipo === category || d.categoria === category
    );
    
    return filtered.map((d: any) => ({
      title: d.titulo,
      source: d.tipo || d.autor,
      year: d.ano.toString(),
      summary: d.resumo || `Documento histórico: ${d.arquivo}`,
      arquivo: d.arquivo
    }));
  },

  async loadDocumentContent(fileName: string): Promise<string> {
    try {
      const res = await fetch(`${GITHUB_DOCS_RAW}/${fileName}`, { cache: 'force-cache' });
      if (res.ok) {
        if (fileName.endsWith('.json')) {
          const data = await res.json();
          return data.conteudo || data.texto;
        }
        return await res.text();
      }
    } catch (e) {
      console.error(`Falha no carregamento: ${fileName}`);
    }
    return "Conteúdo indisponível offline.";
  }
};
