-- ============================================
-- FAKETECT v2.1 - Mise à jour schéma
-- Nouvelles fonctionnalités: Free Plan obligatoire, Admin amélioré
-- ============================================

-- 1. Ajouter colonne role aux profiles si elle n'existe pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));

-- 2. Ajouter colonne is_blocked aux profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- 3. Table pour les transactions de billing (si elle n'existe pas)
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

CREATE INDEX IF NOT EXISTS idx_billing_transactions_user ON billing_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_status ON billing_transactions(status);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_created ON billing_transactions(created_at DESC);

-- 4. Table pour les problématiques IA (support_conversations déjà existante)
-- Ajouter colonne priority si elle n'existe pas
ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id);

-- 5. Vue pour les statistiques support
CREATE OR REPLACE VIEW support_stats AS
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
  )::NUMERIC(10,2) as avg_response_time_hours
FROM support_conversations;

-- 6. Fonction pour bloquer/débloquer un utilisateur
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

-- 7. Fonction pour obtenir les stats admin
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

-- 8. Mise à jour du trigger pour les nouveaux utilisateurs (plan free par défaut)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url, plan, analyses_limit, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'free',
    3, -- 3 analyses par jour pour le plan free
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RLS pour billing_transactions
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON billing_transactions;
CREATE POLICY "Users can view own transactions" ON billing_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 10. Index supplémentaires pour performances
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON profiles(is_blocked);
CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON analyses(user_id, created_at DESC);

-- 11. Mise à jour des limites par plan
COMMENT ON TABLE profiles IS 'Limites par plan: free=3/jour, starter=20/jour, pro=100/jour, business=500/jour, enterprise=illimité';

-- 12. Fonction pour vérifier et mettre à jour le quota
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
