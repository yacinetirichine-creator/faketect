-- FakeTect - Nettoyage rapide des fonctions et triggers
-- Utilisez ce fichier si vous avez l'erreur "cannot drop function because other objects depend on it"

-- ============================================
-- Supprimer le trigger AVANT la fonction
-- ============================================
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";

-- ============================================
-- Supprimer les fonctions avec CASCADE
-- ============================================
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS decrement_user_credits(TEXT, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS add_user_credits(TEXT, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS check_subscription_expiry() CASCADE;
DROP FUNCTION IF EXISTS get_user_stats(TEXT) CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_analyses(INTEGER) CASCADE;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Triggers et fonctions supprimés';
    RAISE NOTICE 'Vous pouvez maintenant exécuter 02_functions_triggers.sql';
    RAISE NOTICE '===========================================';
END $$;
