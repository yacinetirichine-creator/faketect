-- Extension du schéma Supabase pour gestion entreprises et facturation

-- =====================================================
-- 1. TABLE: user_profiles
-- Profils étendus pour entreprises et particuliers
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  company_legal_form VARCHAR(50), -- SARL, SAS, SA, EI, etc.
  siret VARCHAR(14),
  vat_number VARCHAR(50), -- TVA intracommunautaire
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

-- Index pour performances
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_account_type ON user_profiles(account_type);
CREATE INDEX idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. TABLE: invoices
-- Facturation pour entreprises et particuliers
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Numérotation
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Type et statut
  invoice_type VARCHAR(20) NOT NULL DEFAULT 'invoice' CHECK (invoice_type IN ('invoice', 'quote', 'credit_note')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled', 'overdue')),
  
  -- Montants (en centimes pour éviter problèmes arrondis)
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  
  -- TVA
  tax_rate DECIMAL(5,2) DEFAULT 20.00,
  tax_type VARCHAR(50) DEFAULT 'TVA FR',
  
  -- Devise
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Client (copie pour archivage)
  client_type VARCHAR(20) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_address TEXT,
  client_siret VARCHAR(14),
  client_vat_number VARCHAR(50),
  
  -- Paiement
  payment_method VARCHAR(50), -- card, sepa, transfer
  payment_date TIMESTAMP WITH TIME ZONE,
  stripe_payment_intent_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  
  -- Fichier PDF
  pdf_url TEXT,
  pdf_generated_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT positive_amounts CHECK (
    subtotal_cents >= 0 AND
    tax_cents >= 0 AND
    total_cents >= 0
  )
);

-- Index
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_profile_id ON invoices(profile_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_stripe_payment_intent ON invoices(stripe_payment_intent_id);

-- Trigger updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. TABLE: invoice_items
-- Lignes de facturation
-- =====================================================

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Description
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL,
  
  -- Montants
  subtotal_cents INTEGER NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 20.00,
  tax_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  
  -- Référence produit/service
  product_type VARCHAR(50), -- subscription, quota_pack, analysis, etc.
  product_id VARCHAR(100),
  
  -- Ordre d'affichage
  sort_order INTEGER DEFAULT 0,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_amounts CHECK (
    unit_price_cents >= 0 AND
    subtotal_cents >= 0 AND
    tax_cents >= 0 AND
    total_cents >= 0
  )
);

-- Index
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_type ON invoice_items(product_type);

-- =====================================================
-- 4. TABLE: subscriptions
-- Abonnements Stripe
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Plan
  plan_id VARCHAR(50) NOT NULL, -- free, starter, professional, enterprise
  plan_name VARCHAR(100) NOT NULL,
  
  -- Stripe
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  
  -- Statut
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  
  -- Périodes
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Facturation
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Quotas
  daily_analyses_quota INTEGER DEFAULT 20,
  
  -- Métadonnées
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_profile_id ON subscriptions(profile_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Trigger updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. TABLE: payment_methods
-- Moyens de paiement (cartes, SEPA, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Stripe
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Type et détails
  type VARCHAR(20) NOT NULL, -- card, sepa_debit, etc.
  is_default BOOLEAN DEFAULT false,
  
  -- Carte (si applicable)
  card_brand VARCHAR(20), -- visa, mastercard, amex
  card_last4 VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  
  -- SEPA (si applicable)
  sepa_last4 VARCHAR(4),
  sepa_bank_code VARCHAR(20),
  
  -- Statut
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_profile_id ON payment_methods(profile_id);
CREATE INDEX idx_payment_methods_stripe_pm ON payment_methods(stripe_payment_method_id);
CREATE INDEX idx_payment_methods_is_default ON payment_methods(is_default);

-- Trigger updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. TABLE: transactions
-- Historique des transactions
-- =====================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Stripe
  stripe_charge_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  
  -- Type et statut
  transaction_type VARCHAR(50) NOT NULL, -- subscription, quota_purchase, refund, etc.
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  
  -- Montants
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Méthode de paiement
  payment_method_type VARCHAR(20),
  
  -- Détails
  description TEXT,
  failure_reason TEXT,
  
  -- Métadonnées
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_invoice_id ON transactions(invoice_id);
CREATE INDEX idx_transactions_subscription_id ON transactions(subscription_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_stripe_charge ON transactions(stripe_charge_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies invoices
CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies invoice_items
CREATE POLICY "Users can view their own invoice items"
  ON invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()
  ));

-- Policies subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies payment_methods
CREATE POLICY "Users can view their own payment methods"
  ON payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
  ON payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- Policies transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- 8. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour générer un numéro de facture
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  new_number VARCHAR(50);
  year_prefix VARCHAR(4);
  sequence_num INTEGER;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 6) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM invoices
  WHERE invoice_number LIKE year_prefix || '%';
  
  new_number := year_prefix || LPAD(sequence_num::TEXT, 5, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les montants d'une facture
CREATE OR REPLACE FUNCTION calculate_invoice_totals(invoice_uuid UUID)
RETURNS VOID AS $$
DECLARE
  total_subtotal INTEGER;
  total_tax INTEGER;
  total_amount INTEGER;
BEGIN
  SELECT 
    COALESCE(SUM(subtotal_cents), 0),
    COALESCE(SUM(tax_cents), 0),
    COALESCE(SUM(total_cents), 0)
  INTO total_subtotal, total_tax, total_amount
  FROM invoice_items
  WHERE invoice_id = invoice_uuid;
  
  UPDATE invoices
  SET 
    subtotal_cents = total_subtotal,
    tax_cents = total_tax,
    total_cents = total_amount,
    updated_at = NOW()
  WHERE id = invoice_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger automatique pour recalculer les totaux
CREATE OR REPLACE FUNCTION trigger_calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_invoice_totals(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.invoice_id
      ELSE NEW.invoice_id
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_totals_on_items_change
  AFTER INSERT OR UPDATE OR DELETE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_invoice_totals();

-- =====================================================
-- 9. VUES UTILES
-- =====================================================

-- Vue: profils complets avec informations de facturation
CREATE OR REPLACE VIEW v_user_billing_info AS
SELECT 
  up.id,
  up.user_id,
  up.account_type,
  up.email,
  CASE 
    WHEN up.account_type = 'individual' 
    THEN up.first_name || ' ' || up.last_name
    ELSE up.company_name
  END as display_name,
  up.company_name,
  up.siret,
  up.vat_number,
  COALESCE(up.billing_address, up.company_address) as billing_address,
  COALESCE(up.billing_city, up.company_city) as billing_city,
  COALESCE(up.billing_country, up.company_country, 'FR') as billing_country,
  up.stripe_customer_id,
  up.created_at
FROM user_profiles up;

-- Vue: factures avec détails client
CREATE OR REPLACE VIEW v_invoices_detailed AS
SELECT 
  i.*,
  up.account_type,
  up.display_name as client_display_name,
  (i.total_cents / 100.0) as total_amount,
  (i.subtotal_cents / 100.0) as subtotal_amount,
  (i.tax_cents / 100.0) as tax_amount
FROM invoices i
JOIN v_user_billing_info up ON i.profile_id = up.id;

-- =====================================================
-- 10. DONNÉES INITIALES
-- =====================================================

-- Plans d'abonnement (référence)
COMMENT ON TABLE subscriptions IS 'Plans disponibles: free (20/jour), starter (100/jour, 9.99€), professional (500/jour, 29.99€), enterprise (illimité, sur devis)';

-- =====================================================
-- FIN DU SCHÉMA
-- =====================================================

-- Script terminé avec succès
SELECT 'Schéma de facturation et entreprise créé avec succès!' as status;
