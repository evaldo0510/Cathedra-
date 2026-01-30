
import { MagisteriumDoc } from "../types";
import { getChurchDocumentsFromCloud } from "./supabase";
import { getDocsByCategory } from "./magisteriumLocal";

export const magisteriumService = {
  /**
   * Carrega documentos por categoria com fallback para dados locais
   */
  async getDocuments(category: string): Promise<MagisteriumDoc[]> {
    try {
      const cloudDocs = await getChurchDocumentsFromCloud(category);
      if (cloudDocs && cloudDocs.length > 0) {
        return cloudDocs.map(d => ({
          title: d.title,
          source: d.type || "Magistério",
          year: d.year?.toString() || "S/D",
          summary: d.summary || d.content.substring(0, 150) + "..."
        }));
      }
    } catch (e) {
      console.warn(`Cloud Magisterium fail for ${category}, using internal data.`);
    }
    
    // Fallback para dados curados locais
    return getDocsByCategory(category);
  }
};
