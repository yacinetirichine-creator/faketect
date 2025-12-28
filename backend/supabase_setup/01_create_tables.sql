-- FakeTect - Configuration Supabase
-- Fichier 1/4 : Création des tables principales

-- ============================================
-- Table: User (Utilisateurs)
-- ============================================
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

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_subscription_idx" ON "User"("subscription");

-- ============================================
-- Table: Analysis (Analyses)
-- ============================================
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

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "Analysis_userId_idx" ON "Analysis"("userId");
CREATE INDEX IF NOT EXISTS "Analysis_type_idx" ON "Analysis"("type");
CREATE INDEX IF NOT EXISTS "Analysis_createdAt_idx" ON "Analysis"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Analysis_isAiGenerated_idx" ON "Analysis"("isAiGenerated");

-- ============================================
-- Table: CreditTransaction (Transactions de crédits)
-- ============================================
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

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");
CREATE INDEX IF NOT EXISTS "CreditTransaction_type_idx" ON "CreditTransaction"("type");
CREATE INDEX IF NOT EXISTS "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt" DESC);

-- ============================================
-- Commentaires sur les tables
-- ============================================
COMMENT ON TABLE "User" IS 'Table des utilisateurs du système FakeTect';
COMMENT ON TABLE "Analysis" IS 'Table des analyses d''images, vidéos et textes';
COMMENT ON TABLE "CreditTransaction" IS 'Table des transactions de crédits utilisateurs';

-- ============================================
-- Fin du fichier 01_create_tables.sql
-- ============================================
