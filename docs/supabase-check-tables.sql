-- ============================================
-- Script de vérification Supabase FakeTect
-- Vérifie que toutes les tables nécessaires existent
-- ============================================

-- Vue qui liste toutes les tables requises et leur statut
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    ) THEN '✅ Existe'  
    ELSE '❌ Manquante'
  END as status,
  CASE table_name
    WHEN 'profiles' THEN 'Profils utilisateurs (OBLIGATOIRE)'
    WHEN 'analyses' THEN 'Analyses d''images (OBLIGATOIRE)'
    WHEN 'analysis_batches' THEN 'Lots d''analyses (OBLIGATOIRE)'
    WHEN 'reports' THEN 'Rapports PDF (OBLIGATOIRE)'
    WHEN 'daily_usage' THEN 'Quotas journaliers (OBLIGATOIRE)'
    WHEN 'api_keys' THEN 'Clés API (OBLIGATOIRE)'
    WHEN 'billing_transactions' THEN 'Transactions de paiement (OBLIGATOIRE)'
    WHEN 'subscriptions' THEN 'Abonnements (OBLIGATOIRE)'
    WHEN 'certificates' THEN 'Certificats (OBLIGATOIRE)'
    WHEN 'support_conversations' THEN 'Conversations support (NOUVEAU)'
    WHEN 'cache' THEN 'Cache analyses (OPTIONNEL)'
    ELSE 'Autre'
  END as description,
  CASE table_name
    WHEN 'profiles' THEN 'supabase-schema.sql'
    WHEN 'analyses' THEN 'supabase-schema.sql'
    WHEN 'analysis_batches' THEN 'supabase-schema.sql'
    WHEN 'reports' THEN 'supabase-schema.sql'
    WHEN 'daily_usage' THEN 'supabase-schema.sql'
    WHEN 'api_keys' THEN 'supabase-schema.sql'
    WHEN 'billing_transactions' THEN 'supabase-billing-schema.sql'
    WHEN 'subscriptions' THEN 'supabase-billing-schema.sql'
    WHEN 'certificates' THEN 'supabase-certificates-schema.sql'
    WHEN 'support_conversations' THEN 'supabase-support-conversations.sql'
    WHEN 'cache' THEN 'supabase-cache.sql'
    ELSE ''
  END as script_source
FROM (
  VALUES 
    ('profiles'),
    ('analyses'),
    ('analysis_batches'),
    ('reports'),
    ('daily_usage'),
    ('api_keys'),
    ('billing_transactions'),
    ('subscriptions'),
    ('certificates'),
    ('support_conversations'),
    ('cache')
) AS required_tables(table_name)
ORDER BY 
  CASE 
    WHEN table_name IN (
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    ) THEN 0
    ELSE 1
  END,
  table_name;

-- Compte les tables manquantes
SELECT 
  COUNT(*) FILTER (WHERE status = '❌ Manquante') as tables_manquantes,
  COUNT(*) FILTER (WHERE status = '✅ Existe') as tables_presentes,
  COUNT(*) as total_tables_requises
FROM (
  SELECT 
    table_name,
    CASE 
      WHEN table_name IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      ) THEN '✅ Existe'
      ELSE '❌ Manquante'
    END as status
  FROM (
    VALUES 
      ('profiles'),
      ('analyses'),
      ('analysis_batches'),
      ('reports'),
      ('daily_usage'),
      ('api_keys'),
      ('billing_transactions'),
      ('subscriptions'),
      ('certificates'),
      ('support_conversations'),
      ('cache')
  ) AS required_tables(table_name)
) AS check_result;

-- Liste toutes les tables actuellement présentes
SELECT 
  '📋 Tables actuellement dans votre base:' as info;

SELECT 
  tablename as table_name,
  schemaname as schema
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
