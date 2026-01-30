
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';

export const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

/**
 * BUSCA UNIVERSAL AUTORITATIVA (SQL Full Text Search)
 * Utiliza o índice GIN configurado no PostgreSQL para resultados precisos.
 */
export const searchSacredVaultFromCloud = async (query: string) => {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('search_sacred_vault', { query_text: query });
  if (error) throw error;
  return data;
};

/**
 * FETCH BIBLE BOOKS FROM SQL
 */
export const getBibleBooksFromCloud = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('bible_books')
    .select('*')
    .order('position', { ascending: true });
  if (error) throw error;
  return data;
};

/**
 * FETCH CHAPTERS FOR A BOOK
 */
export const getChaptersFromCloud = async (bookId: number) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('bible_chapters')
    .select('*')
    .eq('book_id', bookId)
    .order('chapter_number', { ascending: true });
  if (error) throw error;
  return data;
};

/**
 * FETCH VERSES FOR A CHAPTER
 */
export const getVersesFromCloud = async (chapterId: number) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('bible_verses')
    .select('id, verse_number, text')
    .eq('chapter_id', chapterId)
    .order('verse_number', { ascending: true });
  if (error) throw error;
  return data;
};

/**
 * FETCH CATECHISM PARAGRAPHS FROM SQL
 */
export const getCatechismRangeFromCloud = async (start: number, end: number) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('catechism')
    .select('id, paragraph_number, text, title, section')
    .gte('paragraph_number', start)
    .lte('paragraph_number', end)
    .order('paragraph_number', { ascending: true });
  if (error) throw error;
  return data;
};

/**
 * FETCH CHURCH DOCUMENTS BY CATEGORY FROM SQL
 */
export const getChurchDocumentsFromCloud = async (category: string) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('church_documents')
    .select('*')
    .eq('category', category)
    .order('year', { ascending: false });
  if (error) throw error;
  return data;
};

/**
 * FETCH LEARNING TRACKS WITH NESTED MODULES, STEPS AND CONTENTS
 */
export const getTrailsFromCloud = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('trails')
    .select(`
      *,
      modules:trail_modules(
        *,
        steps:trail_steps(*),
        contents:module_contents(*)
      )
    `)
    .order('position', { ascending: true });
  
  if (error) throw error;
  return data;
};

/**
 * USER PROGRESS METHODS
 */
export const getUserModuleProgress = async (userId: string) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('user_progress')
    .select('module_id, completed')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
};

export const updateModuleProgress = async (userId: string, moduleId: number, completed: boolean) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('user_progress')
    .upsert({ 
      user_id: userId, 
      module_id: moduleId, 
      completed,
      updated_at: new Date().toISOString() 
    });
  if (error) throw error;
};

/**
 * FETCH CROSS REFERENCES
 */
export const getTheologicalReferences = async (type: string, id: number) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('theological_references')
    .select('*')
    .or(`and(source_type.eq.${type},source_id.eq.${id}),and(target_type.eq.${type},target_id.eq.${id})`);
  if (error) throw error;
  return data;
};

export const syncUserData = async (userId: string, data: { highlights: any[], history: any[], progress: any[] }) => {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('user_data')
      .upsert({ 
        id: userId, 
        highlights: data.highlights,
        history: data.history,
        progress: data.progress,
        updated_at: new Date().toISOString()
      });
    if (error) throw error;
  } catch (err) {
    console.error("Erro na sincronização Supabase:", err);
  }
};
