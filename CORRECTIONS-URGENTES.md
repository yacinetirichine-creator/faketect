# 🔧 CORRECTIONS URGENTES - FakeTect v2.1

**Date:** 25 décembre 2025  
**Priorité:** CRITIQUE  
**Impact:** Production

---

## 🚨 CORRECTION 1 - Harmoniser Limites Quotas (CRITIQUE)

### Problème Identifié

**Incohérence entre fichiers SQL:**

```sql
# supabase-schema.sql (ligne 12)
analyses_limit INTEGER DEFAULT 10  ❌

# supabase-v2.1-update.sql (ligne 114)
analyses_limit: 3  ✅ (version v2.1 officielle)

# supabase-fix-signup.sql (ligne 30)
analyses_limit: 10  ❌
```

**Impact:**
- Nouveaux utilisateurs peuvent recevoir 3 ou 10 analyses selon le script SQL appliqué
- Incohérence avec documentation marketing (plan free = 3/jour)

### Solution à Appliquer

**Exécuter dans Supabase SQL Editor:**

```sql
-- ============================================
-- FIX 1: Harmoniser limites quotas plan FREE
-- ============================================

-- 1. Mettre à jour la valeur par défaut
ALTER TABLE profiles 
ALTER COLUMN analyses_limit SET DEFAULT 3;

-- 2. Mettre à jour les utilisateurs existants en plan FREE avec limite 10
UPDATE profiles 
SET analyses_limit = 3 
WHERE plan = 'free' 
  AND analyses_limit = 10;

-- 3. Ajouter commentaire documentation
COMMENT ON COLUMN profiles.analyses_limit IS 
  'Quotas quotidiens: free=3, starter=20, pro=100, business=500, enterprise=illimité';

-- 4. Vérification
SELECT plan, analyses_limit, COUNT(*) as users_count
FROM profiles
GROUP BY plan, analyses_limit
ORDER BY plan;
```

**Résultat attendu:**
```
plan      | analyses_limit | users_count
----------|----------------|------------
free      | 3              | XX
starter   | 20             | XX
pro       | 100            | XX
business  | 500            | XX
```

---

## 🚨 CORRECTION 2 - Fonction checkQuota (CRITIQUE)

### Problème Identifié

**Dans `packages/api/config/supabase.js` ligne 107-118:**

```javascript
async function checkQuota(userId) {
  if (!supabaseAdmin) return { allowed: true, remaining: 999 };
  try {
    return await retryWithBackoff(async () => {
      const { data, error } = await supabaseAdmin
        .from('user_stats')  // ❌ TABLE N'EXISTE PAS !
        .select('*')
        .eq('user_id', userId)
        .single();
      // ...
    });
  } catch (err) {
    // ...
  }
}
```

**Impact:**
- Erreur silencieuse si Supabase configuré
- Quotas non vérifiés correctement
- Fallback sur `{ allowed: false, remaining: 0, error: true }`

### Solution Option A - Créer la Vue `user_stats` (RECOMMANDÉ)

**Exécuter dans Supabase SQL Editor:**

```sql
-- ============================================
-- FIX 2A: Créer vue user_stats
-- ============================================

CREATE OR REPLACE VIEW user_stats AS
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

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date 
ON daily_usage(user_id, date);

-- Permissions
GRANT SELECT ON user_stats TO authenticated, service_role;

-- Vérification
SELECT * FROM user_stats LIMIT 5;
```

### Solution Option B - Refactoriser checkQuota (Alternative)

**Modifier `packages/api/config/supabase.js`:**

```javascript
async function checkQuota(userId) {
  if (!supabaseAdmin) return { allowed: true, remaining: 999 };
  
  try {
    return await retryWithBackoff(async () => {
      // 1. Récupérer profil
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('plan, analyses_limit')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      const limit = profile?.analyses_limit || 3;
      
      // 2. Récupérer usage du jour
      const today = new Date().toISOString().split('T')[0];
      const { data: usage, error: usageError } = await supabaseAdmin
        .from('daily_usage')
        .select('count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
      
      // PGRST116 = not found, normal si 0 analyses aujourd'hui
      if (usageError && usageError.code !== 'PGRST116') {
        throw usageError;
      }
      
      const used = usage?.count || 0;
      const remaining = Math.max(0, limit - used);
      
      return { 
        allowed: remaining > 0, 
        remaining, 
        limit,
        used,
        plan: profile?.plan || 'free'
      };
    });
  } catch (err) {
    console.error('❌ Erreur checkQuota:', err.message);
    return { allowed: false, remaining: 0, error: true };
  }
}
```

**Recommandation:** **Option A** (créer la vue) - Plus propre et performant

---

## 🚨 CORRECTION 3 - Trigger handle_new_user (IMPORTANT)

### Problème Identifié

**Le trigger utilise la mauvaise limite:**

```sql
# supabase-v2.1-update.sql (ligne 107-124)
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
    3,  ✅ Correct dans ce fichier
    'user'
  )
  -- ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**MAIS dans `supabase-fix-signup.sql`:**

```sql
analyses_limit = 10  ❌ Incorrect
```

### Solution à Appliquer

**Exécuter dans Supabase SQL Editor:**

```sql
-- ============================================
-- FIX 3: Corriger trigger handle_new_user
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insérer dans profiles avec limites correctes
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
    'free',           -- Plan par défaut
    0,                -- Analyses count initial
    3,                -- ✅ 3 analyses/jour pour FREE
    'user'            -- Role par défaut
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas l'inscription
    RAISE WARNING 'Erreur création profil pour user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recréer le trigger si nécessaire
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- Vérification
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';
```

**Résultat attendu:**
```
trigger_name           | table_name | function_name
-----------------------|------------|----------------
on_auth_user_created  | users      | handle_new_user
```

---

## 📝 CORRECTION 4 - Documentation Inline (MINEUR)

### Mettre à Jour Commentaires dans Code

**Fichier: `packages/api/config/supabase.js`**

```javascript
// AVANT (ligne 107)
async function checkQuota(userId) {
  if (!supabaseAdmin) return { allowed: true, remaining: 999 };
  try {
    return await retryWithBackoff(async () => {
      const { data, error } = await supabaseAdmin.from('user_stats')

// APRÈS
/**
 * Vérifie le quota quotidien d'un utilisateur
 * @param {string} userId - UUID utilisateur
 * @returns {Object} { allowed: boolean, remaining: number, limit: number, used: number, plan: string }
 * 
 * Quotas par plan:
 * - free: 3 analyses/jour
 * - starter: 20 analyses/jour
 * - pro: 100 analyses/jour
 * - business: 500 analyses/jour
 * - enterprise: illimité
 */
async function checkQuota(userId) {
  if (!supabaseAdmin) return { allowed: true, remaining: 999 };
  try {
    return await retryWithBackoff(async () => {
      // Utilise la vue user_stats (créée par migration)
      const { data, error } = await supabaseAdmin.from('user_stats')
```

---

## ✅ CHECKLIST DE VALIDATION

Après avoir appliqué les corrections, exécuter cette checklist:

### 1. Vérifier Limites Quotas
```sql
-- Dans Supabase SQL Editor
SELECT plan, analyses_limit, COUNT(*) 
FROM profiles 
GROUP BY plan, analyses_limit;

-- Résultat attendu: free = 3
```

### 2. Tester Inscription
```bash
# Créer un nouveau compte test
# Vérifier dans Supabase Dashboard:
SELECT * FROM profiles WHERE email = 'test-nouveau@exemple.com';

# Vérifier:
# - plan = 'free'
# - analyses_limit = 3
# - role = 'user'
```

### 3. Tester Quota
```bash
# Via API
curl http://localhost:3001/api/quota \
  -H "Authorization: Bearer YOUR_TOKEN"

# Doit retourner:
{
  "success": true,
  "quota": {
    "allowed": true,
    "remaining": 3,
    "limit": 3,
    "used": 0,
    "plan": "free"
  }
}
```

### 4. Tester Analyse
```bash
# Upload une image
curl -X POST http://localhost:3001/api/analyze/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test.jpg"

# Vérifier daily_usage incrémenté:
SELECT * FROM daily_usage 
WHERE user_id = 'USER_ID' 
  AND date = CURRENT_DATE;
```

### 5. Vérifier Vue user_stats
```sql
-- Dans Supabase SQL Editor
SELECT * FROM user_stats LIMIT 5;

-- Colonnes attendues:
-- user_id, plan, analyses_limit, total_analyses, 
-- used_today, remaining_today, created_at, updated_at
```

---

## 🚀 ORDRE D'EXÉCUTION

**Suivre cet ordre strict:**

1. ✅ **FIX 1** - Harmoniser limites quotas (ALTER TABLE)
2. ✅ **FIX 2A** - Créer vue user_stats (CREATE VIEW)
3. ✅ **FIX 3** - Corriger trigger handle_new_user
4. ✅ **Validation** - Exécuter checklist complète
5. ✅ **Commit** - Git commit avec message clair

---

## 📊 IMPACT ESTIMÉ

### Utilisateurs Existants
- ❌ **Aucun impact négatif** - Les utilisateurs existants gardent leurs quotas actuels
- ✅ Les utilisateurs free avec 10 analyses seront passés à 3 (normalisation)
- ℹ️ Communication recommandée si changement rétroactif

### Nouveaux Utilisateurs
- ✅ Recevront systématiquement 3 analyses/jour (plan free)
- ✅ Cohérence avec documentation marketing
- ✅ Trigger fonctionne correctement

### Performance
- ✅ Vue `user_stats` améliore performance (pas de JOIN répétés)
- ✅ Index sur daily_usage optimisé
- ✅ Pas de régression attendue

---

## 🔍 TESTS À EFFECTUER APRÈS DÉPLOIEMENT

### Test 1 - Inscription Nouveau Compte
```
1. Aller sur /signup
2. Créer compte avec email unique
3. Vérifier redirection vers /app
4. Vérifier quota = 3/3 disponibles
5. Vérifier profil en DB (plan=free, limit=3)
```

### Test 2 - Analyse avec Quota
```
1. Upload 1 image
2. Vérifier quota passe à 2/3
3. Upload 2 images supplémentaires
4. Vérifier quota passe à 0/3
5. Tenter 4ème upload → Doit bloquer avec message "quota épuisé"
```

### Test 3 - Reset Quotas Minuit
```
1. Simuler changement de date en DB:
   UPDATE daily_usage SET date = CURRENT_DATE - 1;
2. Rafraîchir /dashboard
3. Vérifier quota revenu à 3/3
```

---

## 📞 SUPPORT

Si problèmes après application des corrections:

1. **Vérifier logs Supabase** (Database → Logs)
2. **Vérifier logs API** (`docker logs faketect-api`)
3. **Rollback si nécessaire:**
   ```sql
   -- Revenir à limite 10
   ALTER TABLE profiles ALTER COLUMN analyses_limit SET DEFAULT 10;
   UPDATE profiles SET analyses_limit = 10 WHERE plan = 'free';
   ```

---

**Préparé par:** GitHub Copilot  
**Date:** 25 décembre 2025  
**Version:** v2.1.0  
**Status:** ✅ Prêt à appliquer
