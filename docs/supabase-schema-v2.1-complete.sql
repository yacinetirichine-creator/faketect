-- ============================================
-- FAKETECT v2.1 - SCHÉMA CONSOLIDÉ COMPLET
-- Date: 25 décembre 2025
-- Version: 2.1.0 FINAL
-- ============================================

-- Ce fichier consolide TOUS les schémas SQL en UN seul fichier
-- Ordre d'exécution: Exécuter ce fichier UNE FOIS sur une DB vide
-- Ou exécuter uniquement les sections manquantes

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLES PROFILS UTILISATEURS
-- ============================================

-- Table profiles (profil de base)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Plan et limites
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'business', 'enterprise')),
  analyses_count INTEGER DEFAULT 0,
  analyses_limit INTEGER DEFAULT 3, -- ✅ CORRIGÉ: 3/jour pour FREE
  
  -- v2.1: Rôles et blocage
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_at TIMESTAMPTZ,
  blocked_reason TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Profils utilisateurs avec quotas. Quotas: free=3/jour, starter=20/jour, pro=100/jour, business=500/jour, enterprise=illimité';
COMMENT ON COLUMN profiles.analyses_limit IS 'free=3/jour, starter=20/jour, pro=100/jour, business=500/jour, enterprise=illimité';

-- Table user_profiles (facturation entreprise)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type de compte
  account_type VARCHAR(20) NOT NULL DEFAULT 'individual' CHECK (account_type IN ('individual', 'business')),
  
  -- Informations communes
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  country VARCHAR(2) DEFAULT 'FR',
  language VARCHAR(2) DEFAULT 'fr',
  
  -- Informations particulier
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  
  -- Informations entreprise
  company_name VARCHAR(255),
  company_legal_form VARCHAR(50),
  siret VARCHAR(14),
  vat_number VARCHAR(50),
  company_address TEXT,
  company_postal_code VARCHAR(10),
  company_city VARCHAR(100),
  company_country VARCHAR(2) DEFAULT 'FR',
  
  -- Facturation
  billing_email VARCHAR(255),
  billing_address TEXT,
  billing_postal_code VARCHAR(10),
  billing_city VARCHAR(100),
  billing_country VARCHAR(2) DEFAULT 'FR',
  
  -- Stripe
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255),
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(user_id),
  CONSTRAINT email_required CHECK (email IS NOT NULL),
  CONSTRAINT individual_names CHECK (
    account_type = 'business' OR (first_name IS NOT NULL AND last_name IS NOT NULL)
  ),
  CONSTRAINT business_info CHECK (
    account_type = 'individual' OR company_name IS NOT NULL
  )
);

-- ============================================
-- 2. TABLES ANALYSES
-- ============================================

-- Analyses individuelles
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  batch_id UUID,
  
  -- Fichier source
  filename TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT,
  mime_type TEXT,
  source_type TEXT DEFAULT 'image' CHECK (source_type IN ('image', 'url', 'document', 'video')),
  document_name TEXT,
  document_page INTEGER,
  
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

-- Lots d'analyse (batch)
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

-- ============================================
-- 3. TABLES QUOTAS
-- ============================================

-- Quotas journaliers utilisateurs connectés
CREATE TABLE IF NOT EXISTS daily_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Quotas journaliers vidéo (auth requis)
CREATE TABLE IF NOT EXISTS video_daily_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Quotas journaliers invités (non connectés)
CREATE TABLE IF NOT EXISTS guest_daily_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash TEXT NOT NULL, -- SHA-256 de l'IP
  fingerprint TEXT,       -- Hash navigateur
  date DATE DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABLES FACTURATION
-- ============================================

-- Transactions de paiement (v2.1)
CREATE TABLE IF NOT EXISTS billing_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  amount INTEGER NOT NULL DEFAULT 0, -- en centimes
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Factures
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Numérotation
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Type et statut
  invoice_type VARCHAR(20) NOT NULL DEFAULT 'invoice' CHECK (invoice_type IN ('invoice', 'quote', 'credit_note')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled', 'overdue')),
  
  -- Montants (en centimes)
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  
  -- TVA
  tax_rate DECIMAL(5,2) DEFAULT 20.00,
  tax_type VARCHAR(50) DEFAULT 'TVA FR',
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Client (snapshot pour archivage)
  client_type VARCHAR(20) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_address TEXT,
  client_siret VARCHAR(14),
  client_vat_number VARCHAR(50),
  
  -- Paiement
  payment_method VARCHAR(50),
  payment_date TIMESTAMP WITH TIME ZONE,
  stripe_payment_intent_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  
  -- Fichier PDF
  pdf_url TEXT,
  pdf_generated_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT positive_amounts CHECK (
    subtotal_cents >= 0 AND tax_cents >= 0 AND total_cents >= 0
  )
);

-- Lignes de facture
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  
  tax_rate DECIMAL(5,2) DEFAULT 20.00,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_price CHECK (unit_price_cents >= 0)
);

-- ============================================
-- 5. TABLES RAPPORTS ET CERTIFICATS
-- ============================================

-- Rapports PDF générés
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

-- Certificats de vérification
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  
  certificate_number TEXT UNIQUE,
  verification_code TEXT UNIQUE,
  
  filename TEXT,
  file_url TEXT,
  qr_code_url TEXT,
  
  valid_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. TABLES SUPPORT (v2.1)
-- ============================================

-- Conversations support
CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  assigned_to UUID REFERENCES profiles(id),
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Messages support
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES support_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  message TEXT NOT NULL,
  is_staff BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEX
-- ============================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON profiles(is_blocked);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- User Profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_type ON user_profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Analyses
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_batch_id ON analyses(batch_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON analyses(user_id, created_at DESC);

-- Batches
CREATE INDEX IF NOT EXISTS idx_batches_user_id ON analysis_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_batches_created_at ON analysis_batches(created_at DESC);

-- Quotas
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_video_daily_usage_user_date ON video_daily_usage(user_id, date);

-- Index quotas invités (index partiels)
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

-- Billing
CREATE INDEX IF NOT EXISTS idx_billing_transactions_user ON billing_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_status ON billing_transactions(status);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_created ON billing_transactions(created_at DESC);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_profile_id ON invoices(profile_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date DESC);

-- Invoice Items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Support
CREATE INDEX IF NOT EXISTS idx_support_conversations_user ON support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_support_conversations_assigned ON support_conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_messages_conversation ON support_messages(conversation_id);

-- ============================================
-- VUES
-- ============================================

-- ✅ Vue user_stats (corrige l'erreur checkQuota)
-- IMPORTANT: Supprimer l'ancienne vue si elle existe avec une structure différente
DROP VIEW IF EXISTS user_stats CASCADE;

CREATE VIEW user_stats AS
SELECT 
  p.id as user_id,
  p.plan,
  p.analyses_limit,
  p.analyses_count as total_analyses,
  
  -- Usage aujourd'hui
  COALESCE(du.count, 0) as used_today,
  
  -- Calcul remaining
  GREATEST(p.analyses_limit - COALESCE(du.count, 0), 0) as remaining_today,
  
  -- Timestamps
  p.created_at,
  p.updated_at
  
FROM profiles p
LEFT JOIN daily_usage du ON (
  du.user_id = p.id 
  AND du.date = CURRENT_DATE
);

-- Vue support_stats (v2.1)
DROP VIEW IF EXISTS support_stats CASCADE;

CREATE VIEW support_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'open') as open_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_count,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_count,
  COALESCE(
    EXTRACT(EPOCH FROM AVG(
      CASE WHEN status = 'resolved' 
        THEN updated_at - created_at 
        ELSE NULL 
      END
    )) / 3600,
    0
  )::NUMERIC as avg_response_time_hours
FROM support_conversations;

-- ============================================
-- FONCTIONS
-- ============================================

-- Fonction: Mise à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Créer profil à l'inscription (CORRIGÉE v2.1)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    avatar_url, 
    plan, 
    analyses_count, 
    analyses_limit,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'free',
    0,
    3, -- ✅ CORRIGÉ: 3 analyses/jour pour plan FREE
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erreur création profil pour user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Fonction: Incrémenter compteur analyses
CREATE OR REPLACE FUNCTION increment_analysis_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET analyses_count = analyses_count + 1 
  WHERE id = NEW.user_id;
  
  INSERT INTO daily_usage (user_id, date, count) 
  VALUES (NEW.user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    count = daily_usage.count + 1,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Bloquer/débloquer utilisateur (v2.1)
CREATE OR REPLACE FUNCTION toggle_user_block(
  p_user_id UUID,
  p_blocked BOOLEAN,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET 
    is_blocked = p_blocked,
    blocked_at = CASE WHEN p_blocked THEN NOW() ELSE NULL END,
    blocked_reason = CASE WHEN p_blocked THEN p_reason ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Stats dashboard admin (v2.1)
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE(
  total_users BIGINT,
  active_users BIGINT,
  blocked_users BIGINT,
  total_analyses BIGINT,
  today_analyses BIGINT,
  week_analyses BIGINT,
  total_revenue BIGINT,
  month_revenue BIGINT,
  avg_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profiles)::BIGINT as total_users,
    (SELECT COUNT(*) FROM profiles WHERE is_blocked = FALSE)::BIGINT as active_users,
    (SELECT COUNT(*) FROM profiles WHERE is_blocked = TRUE)::BIGINT as blocked_users,
    (SELECT COUNT(*) FROM analyses)::BIGINT as total_analyses,
    (SELECT COUNT(*) FROM analyses WHERE created_at >= CURRENT_DATE)::BIGINT as today_analyses,
    (SELECT COUNT(*) FROM analyses WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as week_analyses,
    COALESCE((SELECT SUM(amount) FROM billing_transactions WHERE status = 'succeeded'), 0)::BIGINT as total_revenue,
    COALESCE((SELECT SUM(amount) FROM billing_transactions WHERE status = 'succeeded' AND created_at >= date_trunc('month', CURRENT_DATE)), 0)::BIGINT as month_revenue,
    COALESCE((SELECT AVG(combined_score) * 100 FROM analyses WHERE combined_score IS NOT NULL), 0)::NUMERIC as avg_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Vérifier et mettre à jour quota (v2.1)
CREATE OR REPLACE FUNCTION check_and_update_quota(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, "limit" INTEGER, used INTEGER, plan TEXT) AS $$
DECLARE
  v_plan TEXT;
  v_limit INTEGER;
  v_used INTEGER;
BEGIN
  -- Récupérer le plan et la limite
  SELECT p.plan, p.analyses_limit INTO v_plan, v_limit
  FROM profiles p
  WHERE p.id = p_user_id;
  
  IF v_plan IS NULL THEN
    v_plan := 'free';
    v_limit := 3;
  END IF;
  
  -- Compter l'usage du jour
  SELECT COALESCE(d.count, 0) INTO v_used
  FROM daily_usage d
  WHERE d.user_id = p_user_id AND d.date = CURRENT_DATE;
  
  v_used := COALESCE(v_used, 0);
  
  RETURN QUERY SELECT 
    (v_used < v_limit),
    GREATEST(v_limit - v_used, 0),
    v_limit,
    v_used,
    v_plan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Quota vidéo (v2.1)
DROP FUNCTION IF EXISTS get_video_quota(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_video_quota(p_user_id UUID, p_limit INTEGER)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, "limit" INTEGER, used INTEGER) AS $$
DECLARE
  v_used INTEGER;
BEGIN
  SELECT COALESCE(count, 0) INTO v_used
  FROM video_daily_usage
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  v_used := COALESCE(v_used, 0);
  
  RETURN QUERY SELECT 
    (v_used < p_limit),
    GREATEST(p_limit - v_used, 0),
    p_limit,
    v_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Consommer quota vidéo (v2.1)
DROP FUNCTION IF EXISTS consume_video_quota(UUID, INTEGER);

CREATE OR REPLACE FUNCTION consume_video_quota(p_user_id UUID, p_limit INTEGER)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, "limit" INTEGER, used INTEGER) AS $$
DECLARE
  v_used INTEGER;
BEGIN
  INSERT INTO video_daily_usage (user_id, date, count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    count = video_daily_usage.count + 1,
    updated_at = NOW()
  RETURNING count INTO v_used;
  
  RETURN QUERY SELECT 
    (v_used <= p_limit),
    GREATEST(p_limit - v_used, 0),
    p_limit,
    v_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Création profil à l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- Trigger: Mise à jour updated_at (profiles)
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

-- Trigger: Mise à jour updated_at (user_profiles)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger: Mise à jour updated_at (invoices)
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger: Incrémenter compteur analyses
DROP TRIGGER IF EXISTS on_analysis_created ON analyses;
CREATE TRIGGER on_analysis_created
  AFTER INSERT ON analyses
  FOR EACH ROW 
  EXECUTE FUNCTION increment_analysis_count();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Policies: profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies: user_profiles
DROP POLICY IF EXISTS "Users can view own user_profile" ON user_profiles;
CREATE POLICY "Users can view own user_profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own user_profile" ON user_profiles;
CREATE POLICY "Users can update own user_profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own user_profile" ON user_profiles;
CREATE POLICY "Users can insert own user_profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: analyses
DROP POLICY IF EXISTS "Users can view own analyses" ON analyses;
CREATE POLICY "Users can view own analyses" ON analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analyses" ON analyses;
CREATE POLICY "Users can insert own analyses" ON analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own analyses" ON analyses;
CREATE POLICY "Users can delete own analyses" ON analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Policies: analysis_batches
DROP POLICY IF EXISTS "Users can manage own batches" ON analysis_batches;
CREATE POLICY "Users can manage own batches" ON analysis_batches
  FOR ALL USING (auth.uid() = user_id);

-- Policies: daily_usage
DROP POLICY IF EXISTS "Users can manage own usage" ON daily_usage;
CREATE POLICY "Users can manage own usage" ON daily_usage
  FOR ALL USING (auth.uid() = user_id);

-- Policies: video_daily_usage
DROP POLICY IF EXISTS "Users can manage own video usage" ON video_daily_usage;
CREATE POLICY "Users can manage own video usage" ON video_daily_usage
  FOR ALL USING (auth.uid() = user_id);

-- Policies: billing_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON billing_transactions;
CREATE POLICY "Users can view own transactions" ON billing_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Policies: invoices
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

-- Policies: invoice_items (via invoice)
DROP POLICY IF EXISTS "Users can view own invoice items" ON invoice_items;
CREATE POLICY "Users can view own invoice items" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
        AND invoices.user_id = auth.uid()
    )
  );

-- Policies: reports
DROP POLICY IF EXISTS "Users can manage own reports" ON reports;
CREATE POLICY "Users can manage own reports" ON reports
  FOR ALL USING (auth.uid() = user_id);

-- Policies: certificates
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
CREATE POLICY "Users can view own certificates" ON certificates
  FOR SELECT USING (auth.uid() = user_id);

-- Policies: support_conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON support_conversations;
CREATE POLICY "Users can view own conversations" ON support_conversations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own conversations" ON support_conversations;
CREATE POLICY "Users can create own conversations" ON support_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: support_messages
DROP POLICY IF EXISTS "Users can view messages from own conversations" ON support_messages;
CREATE POLICY "Users can view messages from own conversations" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_conversations 
      WHERE support_conversations.id = support_messages.conversation_id 
        AND support_conversations.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in own conversations" ON support_messages;
CREATE POLICY "Users can insert messages in own conversations" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_conversations 
      WHERE support_conversations.id = support_messages.conversation_id 
        AND support_conversations.user_id = auth.uid()
    )
  );

-- NOTE: guest_daily_usage n'a pas de policies publiques
-- (Service role bypass RLS)

-- ============================================
-- PERMISSIONS
-- ============================================

-- Permissions vues
GRANT SELECT ON user_stats TO authenticated, service_role;
GRANT SELECT ON support_stats TO authenticated, service_role;

-- Permissions tables (service_role a tous les droits)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================
-- VÉRIFICATIONS FINALES
-- ============================================

-- Vérifier que le trigger est créé
SELECT 
  'Trigger on_auth_user_created: ' || CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- Vérifier que la vue user_stats existe
SELECT 
  'Vue user_stats: ' || CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM information_schema.views
WHERE table_schema = 'public' AND table_name = 'user_stats';

-- Vérifier les limites par défaut
SELECT 
  'Limite analyses FREE: ' || column_default as status
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'analyses_limit';

-- Résumé tables créées
SELECT 
  'Tables créées: ' || COUNT(*) || ' tables' as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'profiles', 'user_profiles', 'analyses', 'analysis_batches',
    'daily_usage', 'video_daily_usage', 'guest_daily_usage',
    'billing_transactions', 'invoices', 'invoice_items',
    'reports', 'certificates', 'support_conversations', 'support_messages'
  );

-- ============================================
-- FIN DU SCHÉMA
-- ============================================

-- ✅ Schéma v2.1 consolidé créé avec succès !
-- 📋 Prochaines étapes:
-- 1. Vérifier les résultats des requêtes ci-dessus
-- 2. Tester inscription d'un nouveau compte
-- 3. Vérifier que les quotas fonctionnent (3/jour pour free)
-- 4. Tester upload d'une image
