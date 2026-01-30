
import { LearningTrack, TrackStep } from "../types";
import { getTrailsFromCloud } from "./supabase";
import { NATIVE_TRACKS } from "./tracksLocal";

export const tracksService = {
  /**
   * Obtém todas as trilhas, priorizando SQL e caindo para dados estáticos se necessário.
   */
  async getAllTracks(): Promise<LearningTrack[]> {
    try {
      const cloudTrails = await getTrailsFromCloud();
      if (cloudTrails && cloudTrails.length > 0) {
        // Mapeamento de estrutura SQL para o Type TypeScript do app
        return cloudTrails.map(t => ({
          id: t.id.toString(),
          title: t.title,
          description: t.description,
          level: t.level as any,
          icon: t.icon,
          image: t.image_url,
          modules: t.modules
            .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((m: any) => {
              // Unifica trail_steps e module_contents no mesmo array de conteúdo
              const combinedSteps: TrackStep[] = [
                ...(m.steps || [])
                  .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
                  .map((s: any) => ({
                    type: s.type,
                    ref: s.reference,
                    label: s.label
                  })),
                ...(m.contents || [])
                  .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
                  .map((c: any) => ({
                    type: c.content_type.replace('_id', '') as any,
                    ref: c.content_id.toString(),
                    label: `Conteúdo Ref #${c.content_id}`
                  }))
              ];

              return {
                id: m.id.toString(),
                title: m.title,
                content: combinedSteps
              };
            })
        }));
      }
    } catch (e) {
      console.warn("SQL Trails fetch failed, using local curation.");
    }
    return NATIVE_TRACKS;
  }
};
