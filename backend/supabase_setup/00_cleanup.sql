-- FakeTect - Nettoyage Supabase
-- Fichier 0/4 : Suppression des objets existants
-- ATTENTION: Ce fichier supprime TOUTES les données et la structure

-- ============================================
-- OPTION A: Suppression complète (recommandé pour reset total)
-- ============================================

-- Désactiver RLS temporairement
ALTER TABLE IF EXISTS "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Analysis" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "CreditTransaction" DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques RLS
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

-- Supprimer les vues
DROP VIEW IF EXISTS "RecentAnalyses";
DROP VIEW IF EXISTS "GlobalStats";

-- Supprimer les triggers AVANT les fonctions (important!)
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS cleanup_old_analyses(INTEGER);
DROP FUNCTION IF EXISTS get_user_stats(TEXT);
DROP FUNCTION IF EXISTS check_subscription_expiry();
DROP FUNCTION IF EXISTS add_user_credits(TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS decrement_user_credits(TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Supprimer les tables (avec CASCADE pour supprimer les dépendances)
DROP TABLE IF EXISTS "CreditTransaction" CASCADE;
DROP TABLE IF EXISTS "Analysis" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Supprimer l'extension pg_trgm si elle n'est plus utilisée
-- DROP EXTENSION IF EXISTS pg_trgm;

-- ============================================
-- OPTION B: Suppression uniquement des politiques RLS
-- (décommentez cette section si vous voulez garder les données)
-- ============================================

/*
-- Supprimer uniquement les politiques RLS
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
*/

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'FakeTect - Nettoyage terminé';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Vous pouvez maintenant exécuter les fichiers de setup';
    RAISE NOTICE '===========================================';
END $$;
