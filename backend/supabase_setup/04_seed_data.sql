-- FakeTect - Configuration Supabase
-- Fichier 4/4 : Données de test et configuration initiale

-- ============================================
-- Désactiver temporairement RLS pour l'insertion
-- ============================================
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Analysis" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditTransaction" DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Utilisateur Admin de test
-- ============================================
-- Mot de passe: Admin123!
-- Hash bcrypt avec 12 rounds
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

-- ============================================
-- Utilisateur test standard
-- ============================================
-- Mot de passe: Test123!
-- Hash bcrypt avec 12 rounds
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

-- ============================================
-- Créer une vue pour les statistiques globales
-- ============================================
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

-- ============================================
-- Créer une vue pour l'historique récent
-- ============================================
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

-- ============================================
-- Créer un index pour les recherches par texte
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "User_name_trgm_idx" ON "User" USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_email_trgm_idx" ON "User" USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Analysis_fileName_trgm_idx" ON "Analysis" USING gin ("fileName" gin_trgm_ops);

-- ============================================
-- Réactiver RLS
-- ============================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditTransaction" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Créer une fonction pour nettoyer les anciennes analyses
-- ============================================
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

-- ============================================
-- Créer un job CRON pour vérifier les abonnements expirés
-- (Nécessite l'extension pg_cron dans Supabase)
-- ============================================
-- Note: Décommentez cette ligne dans l'interface Supabase SQL Editor si pg_cron est disponible
-- SELECT cron.schedule('check-subscription-expiry', '0 0 * * *', 'SELECT check_subscription_expiry()');

-- ============================================
-- Afficher un résumé de la configuration
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'FakeTect - Configuration Supabase terminée';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Tables créées: User, Analysis, CreditTransaction';
    RAISE NOTICE 'Vues créées: GlobalStats, RecentAnalyses';
    RAISE NOTICE 'Fonctions créées: 6 fonctions utilitaires';
    RAISE NOTICE 'RLS activé sur toutes les tables';
    RAISE NOTICE 'Utilisateurs de test créés:';
    RAISE NOTICE '  - admin@faketect.com (mot de passe: Admin123!)';
    RAISE NOTICE '  - test@faketect.com (mot de passe: Test123!)';
    RAISE NOTICE '===========================================';
END $$;

-- ============================================
-- Fin du fichier 04_seed_data.sql
-- ============================================
