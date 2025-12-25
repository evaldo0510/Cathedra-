
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Nota: Em um ambiente de produção real, estas variáveis viriam do process.env
// Como estamos em um ambiente de prototipagem profissional, definimos a estrutura.
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';

export const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

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

export const fetchUserData = async (userId: string) => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
};
