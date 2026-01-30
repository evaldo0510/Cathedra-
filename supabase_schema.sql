
-- Tabela de Livros
CREATE TABLE bible_books (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  abbreviation VARCHAR(10),
  testament VARCHAR(20) CHECK (testament IN ('Antigo Testamento', 'Novo Testamento')),
  position INT UNIQUE,
  category VARCHAR(50),
  total_chapters INT
);

-- Tabela de Capítulos
CREATE TABLE bible_chapters (
  id SERIAL PRIMARY KEY,
  book_id INT REFERENCES bible_books(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  UNIQUE(book_id, chapter_number)
);

-- Tabela de Versículos
CREATE TABLE bible_verses (
  id SERIAL PRIMARY KEY,
  chapter_id INT REFERENCES bible_chapters(id) ON DELETE CASCADE,
  verse_number INT NOT NULL,
  text TEXT NOT NULL,
  UNIQUE(chapter_id, verse_number)
);

-- Tabela do Catecismo da Igreja Católica (CIC)
CREATE TABLE catechism (
  id SERIAL PRIMARY KEY,
  paragraph_number INT UNIQUE NOT NULL,
  title VARCHAR(255),
  text TEXT NOT NULL,
  section VARCHAR(100)
);

-- Tabela de Documentos da Igreja (Magistério)
CREATE TABLE church_documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- Concílios, Pontifícios, etc
  type VARCHAR(100), -- Encíclica, etc
  year INT,
  content TEXT NOT NULL,
  summary TEXT
);

-- Tabela de Referências Cruzadas (Nexus Theologicus)
CREATE TABLE theological_references (
  id SERIAL PRIMARY KEY,
  source_type VARCHAR(50) NOT NULL, -- 'verse', 'catechism', 'document'
  source_id INT NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id INT NOT NULL,
  description TEXT 
);

-- Tabela de Trilhas Formativas
CREATE TABLE trails (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  level VARCHAR(50) CHECK (level IN ('Iniciante', 'Intermediário', 'Avançado')),
  icon VARCHAR(50),
  image_url TEXT,
  position INT DEFAULT 0
);

-- Tabela de Módulos da Trilha
CREATE TABLE trail_modules (
  id SERIAL PRIMARY KEY,
  trail_id INT REFERENCES trails(id) ON DELETE CASCADE,
  title VARCHAR(255),
  order_index INT DEFAULT 0
);

-- Tabela de Etapas do Módulo (Baseadas em Texto/Referência)
CREATE TABLE trail_steps (
  id SERIAL PRIMARY KEY,
  module_id INT REFERENCES trail_modules(id) ON DELETE CASCADE,
  type VARCHAR(50) CHECK (type IN ('biblia', 'cic', 'documento', 'video', 'quiz')),
  reference VARCHAR(255) NOT NULL,
  label VARCHAR(255),
  position INT DEFAULT 0
);

-- Tabela de Conteúdos do Módulo (Baseadas em IDs Relacionais)
CREATE TABLE module_contents (
  id SERIAL PRIMARY KEY,
  module_id INT REFERENCES trail_modules(id) ON DELETE CASCADE,
  content_type VARCHAR(50), -- Ex: 'verse_id', 'catechism_id'
  content_id INT,
  order_index INT DEFAULT 0
);

-- Tabela de Progresso do Usuário
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL, 
  module_id INT REFERENCES trail_modules(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, module_id)
);

-- Índices para performance
CREATE INDEX idx_verses_chapter ON bible_verses(chapter_id);
CREATE INDEX idx_chapters_book ON bible_chapters(book_id);
CREATE INDEX idx_catechism_number ON catechism(paragraph_number);
CREATE INDEX idx_church_docs_cat ON church_documents(category);
CREATE INDEX idx_theol_ref_source ON theological_references(source_type, source_id);
CREATE INDEX idx_theol_ref_target ON theological_references(target_type, target_id);
CREATE INDEX idx_trail_modules_trail ON trail_modules(trail_id);
CREATE INDEX idx_trail_steps_module ON trail_steps(module_id);
CREATE INDEX idx_module_contents_module ON module_contents(module_id);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);

-- Índices GIN para Busca Textual (Full Text Search)
CREATE INDEX idx_bible_text ON bible_verses USING gin(to_tsvector('portuguese', text));
CREATE INDEX idx_cic_text ON catechism USING gin(to_tsvector('portuguese', text));
CREATE INDEX idx_docs_text ON church_documents USING gin(to_tsvector('portuguese', content));

-- Função de Busca Universal (RPC para Supabase)
CREATE OR REPLACE FUNCTION search_sacred_vault(query_text TEXT)
RETURNS TABLE (
  source_type TEXT,
  title TEXT,
  snippet TEXT,
  ref_id TEXT,
  relevance REAL
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  (
    -- Busca na Bíblia
    SELECT 
      'Bíblia'::TEXT as source_type,
      b.name || ' ' || c.chapter_number || ':' || v.verse_number as title,
      v.text as snippet,
      v.id::TEXT as ref_id,
      ts_rank(to_tsvector('portuguese', v.text), plainto_tsquery('portuguese', query_text)) as relevance
    FROM bible_verses v
    JOIN bible_chapters c ON v.chapter_id = c.id
    JOIN bible_books b ON c.book_id = b.id
    WHERE to_tsvector('portuguese', v.text) @@ plainto_tsquery('portuguese', query_text)
    
    UNION ALL
    
    -- Busca no Catecismo
    SELECT 
      'Catecismo'::TEXT as source_type,
      'Parágrafo §' || paragraph_number as title,
      text as snippet,
      paragraph_number::TEXT as ref_id,
      ts_rank(to_tsvector('portuguese', text), plainto_tsquery('portuguese', query_text)) as relevance
    FROM catechism
    WHERE to_tsvector('portuguese', text) @@ plainto_tsquery('portuguese', query_text)
    
    UNION ALL
    
    -- Busca no Magistério
    SELECT 
      'Magistério'::TEXT as source_type,
      title,
      summary as snippet,
      id::TEXT as ref_id,
      ts_rank(to_tsvector('portuguese', content), plainto_tsquery('portuguese', query_text)) as relevance
    FROM church_documents
    WHERE to_tsvector('portuguese', content) @@ plainto_tsquery('portuguese', query_text)
  )
  ORDER BY relevance DESC
  LIMIT 20;
END;
$$;
