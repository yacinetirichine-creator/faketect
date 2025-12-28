-- FakeTect - Configuration Supabase
-- FICHIER COMPLET - Tous les scripts en un seul fichier
-- À utiliser si vous préférez tout exécuter d'un coup

-- ============================================
-- PARTIE 1: CRÉATION DES TABLES
-- ============================================

-- Table: User (Utilisateurs)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "credits" INTEGER NOT NULL DEFAULT 10,
    "subscription" TEXT DEFAULT 'FREE',
    "subscriptionExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_subscription_idx" ON "User"("subscription");

-- Table: Analysis (Analyses)
CREATE TABLE IF NOT EXISTS "Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'IMAGE',
    "fileUrl" TEXT,
    "fileName" TEXT,
    "result" JSONB NOT NULL,
    "aiProbability" DOUBLE PRECISION,
    "isAiGenerated" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Analysis_userId_idx" ON "Analysis"("userId");
CREATE INDEX IF NOT EXISTS "Analysis_type_idx" ON "Analysis"("type");
CREATE INDEX IF NOT EXISTS "Analysis_createdAt_idx" ON "Analysis"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Analysis_isAiGenerated_idx" ON "Analysis"("isAiGenerated");

-- Table: CreditTransaction (Transactions de crédits)
CREATE TABLE IF NOT EXISTS "CreditTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");
CREATE INDEX IF NOT EXISTS "CreditTransaction_type_idx" ON "CreditTransaction"("type");
CREATE INDEX IF NOT EXISTS "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt" DESC);

COMMENT ON TABLE "User" IS 'Table des utilisateurs du système FakeTect';
COMMENT ON TABLE "Analysis" IS 'Table des analyses d''images, vidéos et textes';
COMMENT ON TABLE "CreditTransaction" IS 'Table des transactions de crédits utilisateurs';

-- ============================================
-- PARTIE 2: FONCTIONS ET TRIGGERS
-- ============================================

-- Fonction: Mise à jour automatique du champ updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Mise à jour automatique de User.updatedAt
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction: Décrémenter les crédits utilisateur
CREATE OR REPLACE FUNCTION decrement_user_credits(
    user_id TEXT,
    amount INTEGER,
    transaction_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    SELECT credits INTO current_credits
    FROM "User"
    WHERE id = user_id
    FOR UPDATE;

    IF current_credits IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF current_credits < amount THEN
        RETURN FALSE;
    END IF;

    UPDATE "User"
    SET credits = credits - amount
    WHERE id = user_id;

    INSERT INTO "CreditTransaction" (id, "userId", amount, type, description)
    VALUES (
        gen_random_uuid()::TEXT,
        user_id,
        -amount,
        'DEBIT',
        transaction_description
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Ajouter des crédits utilisateur
CREATE OR REPLACE FUNCTION add_user_credits(
    user_id TEXT,
    amount INTEGER,
    transaction_description TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE "User"
    SET credits = credits + amount
    WHERE id = user_id;

    INSERT INTO "CreditTransaction" (id, "userId", amount, type, description)
    VALUES (
        gen_random_uuid()::TEXT,
        user_id,
        amount,
        'CREDIT',
        transaction_description
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Vérifier l'expiration des abonnements
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS void AS $$
BEGIN
    UPDATE "User"
    SET 
        subscription = 'FREE',
        "subscriptionExpiry" = NULL
    WHERE 
        subscription != 'FREE'
        AND "subscriptionExpiry" IS NOT NULL
        AND "subscriptionExpiry" < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Obtenir les statistiques utilisateur
CREATE OR REPLACE FUNCTION get_user_stats(user_id TEXT)
RETURNS TABLE(
    total_analyses BIGINT,
    image_analyses BIGINT,
    video_analyses BIGINT,
    text_analyses BIGINT,
    ai_detected BIGINT,
    real_detected BIGINT,
    credits_spent INTEGER,
    credits_added INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(a.id)::BIGINT,
        COUNT(CASE WHEN a.type = 'IMAGE' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN a.type = 'VIDEO' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN a.type = 'TEXT' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN a."isAiGenerated" = true THEN 1 END)::BIGINT,
        COUNT(CASE WHEN a."isAiGenerated" = false THEN 1 END)::BIGINT,
        COALESCE(SUM(CASE WHEN ct.type = 'DEBIT' THEN ABS(ct.amount) ELSE 0 END), 0)::INTEGER,
        COALESCE(SUM(CASE WHEN ct.type = 'CREDIT' THEN ct.amount ELSE 0 END), 0)::INTEGER
    FROM "User" u
    LEFT JOIN "Analysis" a ON a."userId" = u.id
    LEFT JOIN "CreditTransaction" ct ON ct."userId" = u.id
    WHERE u.id = user_id
    GROUP BY u.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTIE 3: POLITIQUES RLS
-- ============================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can read own profile" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Admins can read all users" ON "User";
DROP POLICY IF EXISTS "Admins can update all users" ON "User";
DROP POLICY IF EXISTS "Allow user registration" ON "User";
DROP POLICY IF EXISTS "Users can read own analyses" ON "Analysis";
DROP POLICY IF EXISTS "Users can create own analyses" ON "Analysis";
DROP POLICY IF EXISTS "Users can delete own analyses" ON "Analysis";
DROP POLICY IF EXISTS "Admins can read all analyses" ON "Analysis";
DROP POLICY IF EXISTS "Admins can delete all analyses" ON "Analysis";
DROP POLICY IF EXISTS "Users can read own transactions" ON "CreditTransaction";
DROP POLICY IF EXISTS "Admins can read all transactions" ON "CreditTransaction";
DROP POLICY IF EXISTS "Admins can create transactions" ON "CreditTransaction";

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditTransaction" ENABLE ROW LEVEL SECURITY;

-- Politiques pour User
CREATE POLICY "Users can read own profile"
    ON "User" FOR SELECT
    USING (auth.uid()::TEXT = id);

CREATE POLICY "Users can update own profile"
    ON "User" FOR UPDATE
    USING (auth.uid()::TEXT = id)
    WITH CHECK (auth.uid()::TEXT = id);

CREATE POLICY "Admins can read all users"
    ON "User" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE id = auth.uid()::TEXT AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update all users"
    ON "User" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE id = auth.uid()::TEXT AND role = 'ADMIN'
        )
    );

CREATE POLICY "Allow user registration"
    ON "User" FOR INSERT
    WITH CHECK (true);

-- Politiques pour Analysis
CREATE POLICY "Users can read own analyses"
    ON "Analysis" FOR SELECT
    USING (auth.uid()::TEXT = "userId");

CREATE POLICY "Users can create own analyses"
    ON "Analysis" FOR INSERT
    WITH CHECK (auth.uid()::TEXT = "userId");

CREATE POLICY "Users can delete own analyses"
    ON "Analysis" FOR DELETE
    USING (auth.uid()::TEXT = "userId");

CREATE POLICY "Admins can read all analyses"
    ON "Analysis" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE id = auth.uid()::TEXT AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can delete all analyses"
    ON "Analysis" FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE id = auth.uid()::TEXT AND role = 'ADMIN'
        )
    );

-- Politiques pour CreditTransaction
CREATE POLICY "Users can read own transactions"
    ON "CreditTransaction" FOR SELECT
    USING (auth.uid()::TEXT = "userId");

CREATE POLICY "Admins can read all transactions"
    ON "CreditTransaction" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE id = auth.uid()::TEXT AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can create transactions"
    ON "CreditTransaction" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE id = auth.uid()::TEXT AND role = 'ADMIN'
        )
    );

-- ============================================
-- PARTIE 4: DONNÉES INITIALES ET VUES
-- ============================================

ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Analysis" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditTransaction" DISABLE ROW LEVEL SECURITY;

-- Utilisateur Admin (mot de passe: Admin123!)
INSERT INTO "User" (id, email, password, name, role, credits, subscription, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::TEXT,
    'admin@faketect.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWPyS1uG',
    'Admin FakeTect',
    'ADMIN',
    1000,
    'PREMIUM',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Utilisateur test (mot de passe: Test123!)
INSERT INTO "User" (id, email, password, name, role, credits, subscription, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::TEXT,
    'test@faketect.com',
    '$2a$12$VK8YvFZxN3V4Ov4KlLqx.eW5Z9fZ6qGZnNZ8YvFZxN3V4Ov4KlLq.',
    'Test User',
    'USER',
    10,
    'FREE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Vue pour statistiques globales
CREATE OR REPLACE VIEW "GlobalStats" AS
SELECT
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN u.role = 'ADMIN' THEN u.id END) as admin_users,
    COUNT(DISTINCT CASE WHEN u.subscription = 'FREE' THEN u.id END) as free_users,
    COUNT(DISTINCT CASE WHEN u.subscription = 'PRO' THEN u.id END) as pro_users,
    COUNT(DISTINCT CASE WHEN u.subscription = 'PREMIUM' THEN u.id END) as premium_users,
    COUNT(a.id) as total_analyses,
    COUNT(CASE WHEN a.type = 'IMAGE' THEN 1 END) as image_analyses,
    COUNT(CASE WHEN a.type = 'VIDEO' THEN 1 END) as video_analyses,
    COUNT(CASE WHEN a.type = 'TEXT' THEN 1 END) as text_analyses,
    COUNT(CASE WHEN a."isAiGenerated" = true THEN 1 END) as ai_detected,
    COUNT(CASE WHEN a."isAiGenerated" = false THEN 1 END) as real_detected,
    SUM(CASE WHEN ct.type = 'DEBIT' THEN ABS(ct.amount) ELSE 0 END) as total_credits_spent,
    SUM(CASE WHEN ct.type = 'CREDIT' THEN ct.amount ELSE 0 END) as total_credits_added
FROM "User" u
LEFT JOIN "Analysis" a ON a."userId" = u.id
LEFT JOIN "CreditTransaction" ct ON ct."userId" = u.id;

-- Vue pour historique récent
CREATE OR REPLACE VIEW "RecentAnalyses" AS
SELECT
    a.id,
    a."userId",
    u.email as "userEmail",
    u.name as "userName",
    a.type,
    a."fileName",
    a."aiProbability",
    a."isAiGenerated",
    a."createdAt"
FROM "Analysis" a
JOIN "User" u ON u.id = a."userId"
ORDER BY a."createdAt" DESC
LIMIT 100;

-- Extension pour recherche full-text
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "User_name_trgm_idx" ON "User" USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_email_trgm_idx" ON "User" USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Analysis_fileName_trgm_idx" ON "Analysis" USING gin ("fileName" gin_trgm_ops);

-- Fonction de nettoyage
CREATE OR REPLACE FUNCTION cleanup_old_analyses(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "Analysis"
    WHERE "createdAt" < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL
    AND "userId" IN (
        SELECT id FROM "User" WHERE subscription = 'FREE'
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Réactiver RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditTransaction" ENABLE ROW LEVEL SECURITY;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'FakeTect - Configuration Supabase terminée';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Tables: User, Analysis, CreditTransaction';
    RAISE NOTICE 'Vues: GlobalStats, RecentAnalyses';
    RAISE NOTICE 'Fonctions: 6 utilitaires + 1 trigger';
    RAISE NOTICE 'RLS: Activé avec 11 politiques';
    RAISE NOTICE 'Comptes test:';
    RAISE NOTICE '  admin@faketect.com / Admin123!';
    RAISE NOTICE '  test@faketect.com / Test123!';
    RAISE NOTICE '===========================================';
END $$;
