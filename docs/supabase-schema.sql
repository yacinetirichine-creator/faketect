-- ============================================
-- FAKETECT v2.0 - Schéma Supabase
-- FakeTect
-- ============================================

-- 1. Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'business')),
  analyses_count INTEGER DEFAULT 0,
  analyses_limit INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des analyses (images individuelles)
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  batch_id UUID, -- Pour regrouper les analyses par lot
  
  -- Fichier source
  filename TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT,
  mime_type TEXT,
  source_type TEXT DEFAULT 'image' CHECK (source_type IN ('image', 'url', 'document')),
  document_name TEXT, -- Nom du document source si extrait
  document_page INTEGER, -- Page du document si PDF
  
  -- Métadonnées EXIF
  exif_data JSONB,
  exif_camera TEXT,
  exif_software TEXT,
  exif_date TIMESTAMPTZ,
  exif_has_ai_markers BOOLEAN DEFAULT FALSE,
  
  -- Résultats Sightengine
  sightengine_score DECIMAL(5,4),
  sightengine_raw JSONB,
  
  -- Résultats Illuminarty
  illuminarty_score DECIMAL(5,4),
  illuminarty_model TEXT,
  illuminarty_raw JSONB,
  
  -- Score combiné
  combined_score DECIMAL(5,4),
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low', 'error')),
  is_ai_generated BOOLEAN DEFAULT FALSE,
  
  -- Métadonnées
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'mobile', 'extension', 'api')),
  analysis_duration_ms INTEGER,
  ip_address INET,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des lots d'analyse (batch)
CREATE TABLE IF NOT EXISTS analysis_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  name TEXT,
  source_type TEXT CHECK (source_type IN ('multiple_images', 'document', 'url')),
  original_filename TEXT,
  
  total_images INTEGER DEFAULT 0,
  ai_detected_count INTEGER DEFAULT 0,
  average_score DECIMAL(5,4),
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4. Table des rapports PDF générés
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES analysis_batches(id) ON DELETE CASCADE,
  
  filename TEXT,
  file_url TEXT,
  file_size INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- 5. Table des quotas journaliers
CREATE TABLE IF NOT EXISTS daily_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  
  UNIQUE(user_id, date)
);

-- 5b. Quotas journaliers vidéo (auth requis)
CREATE TABLE IF NOT EXISTS video_daily_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 6. Table des quotas journaliers invités (non connectés)
-- Stocke un hash SHA-256 de l'IP (pas l'IP brute)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS guest_daily_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  -- Identifiant pseudo-anonyme du navigateur (recommandé: hash côté client)
  fingerprint TEXT,
  date DATE DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  -- Unicité gérée via index partiels (voir section INDEX)
);

-- ============================================
-- INDEX
-- ============================================

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_batch_id ON analyses(batch_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batches_user_id ON analysis_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_video_daily_usage_user_date ON video_daily_usage(user_id, date);
-- Index/contraintes invités: 2 clés possibles
-- - (ip_hash, date) quand fingerprint est NULL
-- - (fingerprint, date) quand fingerprint est NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS guest_daily_usage_uniq_ip_date_no_fp
  ON guest_daily_usage(ip_hash, date)
  WHERE fingerprint IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS guest_daily_usage_uniq_fp_date
  ON guest_daily_usage(fingerprint, date)
  WHERE fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guest_daily_usage_ip_date
  ON guest_daily_usage(ip_hash, date)
  WHERE fingerprint IS NULL;

CREATE INDEX IF NOT EXISTS idx_guest_daily_usage_fingerprint_date
  ON guest_daily_usage(fingerprint, date)
  WHERE fingerprint IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_daily_usage ENABLE ROW LEVEL SECURITY;

-- Policies profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies analyses
DROP POLICY IF EXISTS "Users can view own analyses" ON analyses;
CREATE POLICY "Users can view own analyses" ON analyses
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own analyses" ON analyses;
CREATE POLICY "Users can insert own analyses" ON analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own analyses" ON analyses;
CREATE POLICY "Users can delete own analyses" ON analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Policies batches
DROP POLICY IF EXISTS "Users can manage own batches" ON analysis_batches;
CREATE POLICY "Users can manage own batches" ON analysis_batches
  FOR ALL USING (auth.uid() = user_id);

-- Policies reports
DROP POLICY IF EXISTS "Users can manage own reports" ON reports;
CREATE POLICY "Users can manage own reports" ON reports
  FOR ALL USING (auth.uid() = user_id);

-- Policies daily_usage
DROP POLICY IF EXISTS "Users can manage own usage" ON daily_usage;
CREATE POLICY "Users can manage own usage" ON daily_usage
  FOR ALL USING (auth.uid() = user_id);

-- Policies video_daily_usage
DROP POLICY IF EXISTS "Users can manage own video usage" ON video_daily_usage;
CREATE POLICY "Users can manage own video usage" ON video_daily_usage
  FOR ALL USING (auth.uid() = user_id);

-- NOTE: No public policies for guest_daily_usage.
-- Service role (used by the API backend) bypasses RLS.

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Créer profil à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Incrémenter compteur d'analyses
CREATE OR REPLACE FUNCTION increment_analysis_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET analyses_count = analyses_count + 1 WHERE id = NEW.user_id;
  INSERT INTO daily_usage (user_id, date, count) VALUES (NEW.user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date) DO UPDATE SET count = daily_usage.count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_analysis_created ON analyses;
CREATE TRIGGER on_analysis_created
  AFTER INSERT ON analyses
  FOR EACH ROW EXECUTE FUNCTION increment_analysis_count();

-- Mettre à jour updated_at sur guest_daily_usage
CREATE OR REPLACE FUNCTION update_guest_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guest_daily_usage_updated_at ON guest_daily_usage;
CREATE TRIGGER guest_daily_usage_updated_at
  BEFORE UPDATE ON guest_daily_usage
  FOR EACH ROW EXECUTE FUNCTION update_guest_updated_at();

-- Mettre à jour updated_at sur video_daily_usage
CREATE OR REPLACE FUNCTION update_video_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS video_daily_usage_updated_at ON video_daily_usage;
CREATE TRIGGER video_daily_usage_updated_at
  BEFORE UPDATE ON video_daily_usage
  FOR EACH ROW EXECUTE FUNCTION update_video_updated_at();

-- RPC: récupérer quota invité
CREATE OR REPLACE FUNCTION get_guest_quota(p_ip TEXT, p_fingerprint TEXT DEFAULT NULL, p_limit INTEGER DEFAULT 3)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, "limit" INTEGER, used INTEGER) AS $$
DECLARE
  v_limit INTEGER := GREATEST(COALESCE(p_limit, 3), 1);
  v_ip_hash TEXT;
  v_used INTEGER;
  v_fp_used INTEGER;
  v_ip_used INTEGER;
  v_fp TEXT;
BEGIN
  v_fp := NULLIF(trim(COALESCE(p_fingerprint, '')), '');
  v_ip_hash := encode(digest(COALESCE(NULLIF(trim(p_ip), ''), 'unknown'), 'sha256'), 'hex');

  IF v_fp IS NOT NULL THEN
    -- Priorité au fingerprint. Fallback sur l'IP (utile lors de la migration).
    SELECT g.count INTO v_fp_used
    FROM guest_daily_usage g
    WHERE g.fingerprint = v_fp AND g.date = CURRENT_DATE;

    SELECT g.count INTO v_ip_used
    FROM guest_daily_usage g
    WHERE g.ip_hash = v_ip_hash AND g.date = CURRENT_DATE AND g.fingerprint IS NULL;

    v_used := COALESCE(v_fp_used, v_ip_used, 0);
  ELSE
    SELECT g.count INTO v_used
    FROM guest_daily_usage g
    WHERE g.ip_hash = v_ip_hash AND g.date = CURRENT_DATE AND g.fingerprint IS NULL;

    v_used := COALESCE(v_used, 0);
  END IF;

  RETURN QUERY SELECT (v_used < v_limit), GREATEST(v_limit - v_used, 0), v_limit, v_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Compat: ancienne signature (sans fingerprint)
CREATE OR REPLACE FUNCTION get_guest_quota(p_ip TEXT, p_limit INTEGER DEFAULT 3)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, "limit" INTEGER, used INTEGER) AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_guest_quota(p_ip, NULL, p_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: consommer quota invité (atomique)
CREATE OR REPLACE FUNCTION consume_guest_quota(p_ip TEXT, p_fingerprint TEXT DEFAULT NULL, p_limit INTEGER DEFAULT 3)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, "limit" INTEGER, used INTEGER) AS $$
DECLARE
  v_limit INTEGER := GREATEST(COALESCE(p_limit, 3), 1);
  v_ip_hash TEXT;
  v_fp TEXT;
  v_used INTEGER;
  v_updated INTEGER;
  v_ip_used INTEGER;
BEGIN
  v_fp := NULLIF(trim(COALESCE(p_fingerprint, '')), '');
  v_ip_hash := encode(digest(COALESCE(NULLIF(trim(p_ip), ''), 'unknown'), 'sha256'), 'hex');

  IF v_fp IS NULL THEN
    -- Mode legacy: quota par IP hash (fingerprint absent)
    INSERT INTO guest_daily_usage (ip_hash, fingerprint, date, count)
    VALUES (v_ip_hash, NULL, CURRENT_DATE, 0)
    ON CONFLICT (ip_hash, date) WHERE fingerprint IS NULL DO NOTHING;

    UPDATE guest_daily_usage
    SET count = count + 1
    WHERE ip_hash = v_ip_hash AND date = CURRENT_DATE AND fingerprint IS NULL AND count < v_limit
    RETURNING count INTO v_used;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated = 0 THEN
      SELECT g.count INTO v_used
      FROM guest_daily_usage g
      WHERE g.ip_hash = v_ip_hash AND g.date = CURRENT_DATE AND g.fingerprint IS NULL;
    END IF;
  ELSE
    -- Mode fingerprint: robuste aux changements d'IP
    -- Seed depuis l'usage IP du jour (utile au déploiement pour éviter un "reset" visuel).
    SELECT g.count INTO v_ip_used
    FROM guest_daily_usage g
    WHERE g.ip_hash = v_ip_hash AND g.date = CURRENT_DATE AND g.fingerprint IS NULL;
    v_ip_used := COALESCE(v_ip_used, 0);

    INSERT INTO guest_daily_usage (ip_hash, fingerprint, date, count)
    VALUES (v_ip_hash, v_fp, CURRENT_DATE, v_ip_used)
    ON CONFLICT (fingerprint, date) WHERE fingerprint IS NOT NULL DO NOTHING;

    UPDATE guest_daily_usage
    SET count = GREATEST(count, v_ip_used), ip_hash = v_ip_hash
    WHERE fingerprint = v_fp AND date = CURRENT_DATE;

    UPDATE guest_daily_usage
    SET count = count + 1
    WHERE fingerprint = v_fp AND date = CURRENT_DATE AND count < v_limit
    RETURNING count INTO v_used;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated = 0 THEN
      SELECT g.count INTO v_used
      FROM guest_daily_usage g
      WHERE g.fingerprint = v_fp AND g.date = CURRENT_DATE;
    END IF;
  END IF;

  v_used := COALESCE(v_used, 0);

  RETURN QUERY SELECT (v_updated = 1), GREATEST(v_limit - v_used, 0), v_limit, v_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Compat: ancienne signature (sans fingerprint)
CREATE OR REPLACE FUNCTION consume_guest_quota(p_ip TEXT, p_limit INTEGER DEFAULT 3)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, "limit" INTEGER, used INTEGER) AS $$
BEGIN
  RETURN QUERY SELECT * FROM consume_guest_quota(p_ip, NULL, p_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: récupérer quota vidéo (auth)
CREATE OR REPLACE FUNCTION get_video_quota(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, "limit" INTEGER, used INTEGER) AS $$
DECLARE
  v_limit INTEGER := GREATEST(COALESCE(p_limit, 10), 1);
  v_used INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN QUERY SELECT false, 0, v_limit, v_limit;
    RETURN;
  END IF;

  SELECT v.count INTO v_used
  FROM video_daily_usage v
  WHERE v.user_id = p_user_id AND v.date = CURRENT_DATE;

  v_used := COALESCE(v_used, 0);

  RETURN QUERY SELECT (v_used < v_limit), GREATEST(v_limit - v_used, 0), v_limit, v_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: consommer quota vidéo (atomique)
CREATE OR REPLACE FUNCTION consume_video_quota(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, "limit" INTEGER, used INTEGER) AS $$
DECLARE
  v_limit INTEGER := GREATEST(COALESCE(p_limit, 10), 1);
  v_used INTEGER;
  v_updated INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN QUERY SELECT false, 0, v_limit, v_limit;
    RETURN;
  END IF;

  -- Ensure row exists
  INSERT INTO video_daily_usage (user_id, date, count)
  VALUES (p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, date) DO NOTHING;

  -- Consume only if under limit
  UPDATE video_daily_usage
  SET count = count + 1
  WHERE user_id = p_user_id AND date = CURRENT_DATE AND count < v_limit
  RETURNING count INTO v_used;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    SELECT v.count INTO v_used
    FROM video_daily_usage v
    WHERE v.user_id = p_user_id AND v.date = CURRENT_DATE;
  END IF;

  v_used := COALESCE(v_used, 0);

  RETURN QUERY SELECT (v_updated = 1), GREATEST(v_limit - v_used, 0), v_limit, v_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VUE stats utilisateur
-- ============================================

CREATE OR REPLACE VIEW user_stats AS
SELECT 
  p.id as user_id,
  p.plan,
  p.analyses_count as total_analyses,
  p.analyses_limit,
  COALESCE(d.count, 0) as today_count,
  p.analyses_limit - COALESCE(d.count, 0) as remaining_today,
  (SELECT COUNT(*) FROM analyses a WHERE a.user_id = p.id AND a.is_ai_generated = true) as ai_detected_count,
  (SELECT AVG(a.combined_score) FROM analyses a WHERE a.user_id = p.id) as average_score
FROM profiles p
LEFT JOIN daily_usage d ON d.user_id = p.id AND d.date = CURRENT_DATE;
