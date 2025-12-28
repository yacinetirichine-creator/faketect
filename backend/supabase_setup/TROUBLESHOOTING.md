# 🔧 Guide de résolution - Erreur "policy already exists"

## ❌ Erreur rencontrée
```
ERROR: 42710: policy "Users can read own profile" for table "User" already exists
```

## ✅ Solutions

### **Solution 1 : Nettoyage puis réinstallation (RECOMMANDÉ)**

Exécutez les fichiers dans cet ordre :

```sql
-- 1. Nettoyage (supprime tout)
00_cleanup.sql

-- 2. Recréation
01_create_tables.sql
02_functions_triggers.sql
03_rls_policies.sql (maintenant avec DROP IF EXISTS)
04_seed_data.sql
```

### **Solution 2 : Fichier complet mis à jour**

Le fichier `00_complete_setup.sql` a été mis à jour avec `DROP POLICY IF EXISTS`. 

Vous pouvez l'exécuter directement, il supprimera les anciennes politiques avant de les recréer.

### **Solution 3 : Suppression manuelle des politiques uniquement**

Si vous voulez garder vos données et uniquement recréer les politiques RLS :

```sql
-- Supprimer les politiques RLS
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

-- Puis exécutez 03_rls_policies.sql
```

### **Solution 4 : Suppression des fonctions et triggers**

Si vous avez l'erreur "cannot drop function because other objects depend on it" :

```sql
-- Supprimer le trigger AVANT la fonction
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";

-- Puis supprimer la fonction avec CASCADE
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Puis exécutez 02_functions_triggers.sql pour recréer
```

---

## 📋 Ordre d'exécution recommandé

### **Méthode A : Installation propre (avec nettoyage)**

1. ✅ `00_cleanup.sql` - Supprime tout
2. ✅ `01_create_tables.sql` - Crée les tables
3. ✅ `02_functions_triggers.sql` - Crée les fonctions
4. ✅ `03_rls_policies.sql` - Crée les politiques RLS
5. ✅ `04_seed_data.sql` - Insère les données de test

### **Méthode B : Fichier unique**

1. ✅ `00_complete_setup.sql` - Tout en un (avec DROP IF EXISTS)

---

## 🔍 Vérifier l'état actuel de votre base

### Lister toutes les politiques RLS existantes :
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Lister toutes les tables :
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Lister toutes les fonctions :
```sql
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

---

## ⚠️ Important

- **00_cleanup.sql** supprime TOUTES les données (tables, fonctions, politiques)
- **03_rls_policies.sql** a été mis à jour avec `DROP POLICY IF EXISTS`
- **00_complete_setup.sql** a été mis à jour pour éviter les conflits

Les fichiers sont maintenant **idempotents** : vous pouvez les exécuter plusieurs fois sans erreur.

---

## 🎯 Prochaine étape

Choisissez votre méthode préférée et exécutez les fichiers SQL dans Supabase !

**Dernière mise à jour** : 28 décembre 2025
