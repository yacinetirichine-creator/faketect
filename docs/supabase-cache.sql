-- 🎬 Supabase Migration: Analysis Cache Table
-- Permet le caching des analyses par MD5 hash

-- ⚠️ IMPORTANT: Activer l'extension pg_cron (si pas encore activée)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer table cache
CREATE TABLE IF NOT EXISTS analysis_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Hash MD5 de l'image (unique)
  image_hash TEXT NOT NULL UNIQUE,
  
  -- Résultat d'analyse complet (JSON)
  result JSONB NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_analysis_cache_hash ON analysis_cache(image_hash);
CREATE INDEX IF NOT EXISTS idx_analysis_cache_expires ON analysis_cache(expires_at);

-- Fonction de cleanup auto (7 jours)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM analysis_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger cleanup quotidien
SELECT cron.schedule('cleanup-analysis-cache', '0 2 * * *', 'SELECT cleanup_expired_cache()');

-- RLS Policy
ALTER TABLE analysis_cache ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire le cache
CREATE POLICY "Allow public read cache" ON analysis_cache
  FOR SELECT USING (true);

-- Seulement l'API peut écrire
CREATE POLICY "Allow API write cache" ON analysis_cache
  FOR INSERT WITH CHECK (true);
