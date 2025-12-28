-- FakeTect - Configuration Supabase
-- Fichier 3/4 : Politiques RLS (Row Level Security)

-- ============================================
-- Supprimer les anciennes politiques si elles existent
-- ============================================
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

-- ============================================
-- Activer RLS sur toutes les tables
-- ============================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditTransaction" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Politiques RLS pour la table User
-- ============================================

-- Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Users can read own profile"
    ON "User"
    FOR SELECT
    USING (auth.uid()::TEXT = id);

-- Les utilisateurs peuvent mettre à jour leur propre profil (sauf role)
CREATE POLICY "Users can update own profile"
    ON "User"
    FOR UPDATE
    USING (auth.uid()::TEXT = id)
    WITH CHECK (auth.uid()::TEXT = id);

-- Les admins peuvent tout lire
CREATE POLICY "Admins can read all users"
    ON "User"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE id = auth.uid()::TEXT
            AND role = 'ADMIN'
        )
    );

-- Les admins peuvent tout mettre à jour
CREATE POLICY "Admins can update all users"
    ON "User"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE id = auth.uid()::TEXT
            AND role = 'ADMIN'
        )
    );

-- Permettre l'insertion (pour l'inscription)
CREATE POLICY "Allow user registration"
    ON "User"
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- Politiques RLS pour la table Analysis
-- ============================================

-- Les utilisateurs peuvent lire leurs propres analyses
CREATE POLICY "Users can read own analyses"
    ON "Analysis"
    FOR SELECT
    USING (auth.uid()::TEXT = "userId");

-- Les utilisateurs peuvent créer leurs propres analyses
CREATE POLICY "Users can create own analyses"
    ON "Analysis"
    FOR INSERT
    WITH CHECK (auth.uid()::TEXT = "userId");

-- Les utilisateurs peuvent supprimer leurs propres analyses
CREATE POLICY "Users can delete own analyses"
    ON "Analysis"
    FOR DELETE
    USING (auth.uid()::TEXT = "userId");

-- Les admins peuvent tout lire
CREATE POLICY "Admins can read all analyses"
    ON "Analysis"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE id = auth.uid()::TEXT
            AND role = 'ADMIN'
        )
    );

-- Les admins peuvent tout supprimer
CREATE POLICY "Admins can delete all analyses"
    ON "Analysis"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE id = auth.uid()::TEXT
            AND role = 'ADMIN'
        )
    );

-- ============================================
-- Politiques RLS pour la table CreditTransaction
-- ============================================

-- Les utilisateurs peuvent lire leurs propres transactions
CREATE POLICY "Users can read own transactions"
    ON "CreditTransaction"
    FOR SELECT
    USING (auth.uid()::TEXT = "userId");

-- Les admins peuvent tout lire
CREATE POLICY "Admins can read all transactions"
    ON "CreditTransaction"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE id = auth.uid()::TEXT
            AND role = 'ADMIN'
        )
    );

-- Les admins peuvent créer des transactions (pour créditer manuellement)
CREATE POLICY "Admins can create transactions"
    ON "CreditTransaction"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE id = auth.uid()::TEXT
            AND role = 'ADMIN'
        )
    );

-- ============================================
-- Fin du fichier 03_rls_policies.sql
-- ============================================
