
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configurações do Supabase (Substitua pelas suas)
const SUPABASE_URL = 'SUA_URL_AQUI';
const SUPABASE_KEY = 'SUA_SERVICE_ROLE_KEY_AQUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importarDados(tabela, arquivo) {
  console.log(`Iniciando importação de ${tabela}...`);
  const rawData = fs.readFileSync(arquivo, 'utf8');
  const data = JSON.parse(rawData);

  // Inserção em lotes (batches) de 100 para evitar timeout
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase.from(tabela).insert(batch);
    
    if (error) {
      console.error(`Erro no lote ${i}:`, error.message);
    } else {
      console.log(`Lote ${i} de ${data.length} importado com sucesso.`);
    }
  }
}

// Exemplo de uso (comente/descomente conforme necessário)
// importarDados('livros', 'json/livros.json');
// importarDados('biblia', 'json/biblia_completa.json');
// importarDados('catecismo', 'json/cic.json');

console.log('Script de importação pronto.');
