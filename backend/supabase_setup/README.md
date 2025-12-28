# Configuration Supabase pour FakeTect

## 📋 Fichiers SQL à exécuter

Exécutez ces fichiers **dans l'ordre** dans le SQL Editor de Supabase:

### 1️⃣ `01_create_tables.sql` - Tables principales
- ✅ Table `User` (utilisateurs)
- ✅ Table `Analysis` (analyses)
- ✅ Table `CreditTransaction` (transactions de crédits)
- ✅ Index optimisés pour les performances

### 2️⃣ `02_functions_triggers.sql` - Logique métier
- ✅ Fonction `update_updated_at_column()` - Mise à jour automatique timestamps
- ✅ Fonction `decrement_user_credits()` - Débit de crédits avec transaction
- ✅ Fonction `add_user_credits()` - Crédit de crédits avec transaction
- ✅ Fonction `check_subscription_expiry()` - Vérification expiration abonnements
- ✅ Fonction `get_user_stats()` - Statistiques utilisateur
- ✅ Trigger automatique sur `User.updatedAt`

### 3️⃣ `03_rls_policies.sql` - Sécurité RLS
- ✅ Activation Row Level Security sur toutes les tables
- ✅ Politiques pour `User` (lecture/écriture propre profil + admin)
- ✅ Politiques pour `Analysis` (CRUD sur propres analyses + admin)
- ✅ Politiques pour `CreditTransaction` (lecture seule + admin)

### 4️⃣ `04_seed_data.sql` - Données initiales
- ✅ Utilisateur admin: `admin@faketect.com` / `Admin123!`
- ✅ Utilisateur test: `test@faketect.com` / `Test123!`
- ✅ Vues: `GlobalStats`, `RecentAnalyses`
- ✅ Extension `pg_trgm` pour recherche full-text
- ✅ Fonction `cleanup_old_analyses()` pour maintenance

---

## 🚀 Instructions d'exécution

### Méthode 1: Supabase Dashboard (Recommandé)

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet `ljrwqjaflgtfddcyumqg`
3. Menu latéral: **SQL Editor**
4. Cliquez sur **New Query**
5. Copiez-collez le contenu de `01_create_tables.sql`
6. Cliquez sur **RUN** (Ctrl+Enter)
7. Répétez pour les fichiers 02, 03, 04 dans l'ordre

### Méthode 2: Supabase CLI

```bash
# Installer Supabase CLI
brew install supabase/tap/supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref ljrwqjaflgtfddcyumqg

# Exécuter les migrations
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.ljrwqjaflgtfddcyumqg.supabase.co:5432/postgres"
```

---

## 🔐 Récupérer le mot de passe PostgreSQL

Le mot de passe PostgreSQL n'est PAS la clé API Supabase. Voici comment le trouver:

### Option A: Dashboard Supabase
1. Allez sur https://supabase.com/dashboard/project/ljrwqjaflgtfddcyumqg
2. Menu: **Settings** → **Database**
3. Section **Connection string**
4. Cliquez sur **Show** pour révéler le mot de passe
5. Copiez la valeur après `postgres:[PASSWORD]@`

### Option B: Réinitialiser le mot de passe
1. Dashboard → **Settings** → **Database**
2. Section **Database password**
3. Cliquez sur **Reset database password**
4. Nouveau mot de passe généré automatiquement
5. **⚠️ IMPORTANT**: Copiez-le immédiatement (affiché une seule fois)

---

## 📝 Mise à jour du fichier .env

Une fois le mot de passe récupéré, mettez à jour `backend/.env`:

```bash
# Avant (incorrect - utilise la clé publique)
DATABASE_URL="postgresql://postgres:eyJhbGc...@db.ljrwqjaflgtfddcyumqg.supabase.co:5432/postgres"

# Après (correct - utilise le vrai mot de passe)
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE_ICI@db.ljrwqjaflgtfddcyumqg.supabase.co:5432/postgres?schema=public&sslmode=require"
```

---

## ✅ Vérification de la configuration

Après avoir exécuté tous les fichiers SQL:

### 1. Vérifier les tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Résultat attendu:
- `User`
- `Analysis`
- `CreditTransaction`

### 2. Vérifier les fonctions
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

Résultat attendu:
- `update_updated_at_column`
- `decrement_user_credits`
- `add_user_credits`
- `check_subscription_expiry`
- `get_user_stats`
- `cleanup_old_analyses`

### 3. Vérifier les politiques RLS
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

Résultat: 11 politiques actives

### 4. Vérifier les utilisateurs de test
```sql
SELECT id, email, name, role, credits, subscription 
FROM "User";
```

Résultat:
- admin@faketect.com (ADMIN, 1000 crédits)
- test@faketect.com (USER, 10 crédits)

### 5. Tester la connexion depuis le backend
```bash
cd backend
npx prisma db pull  # Synchronise le schéma
npx prisma generate # Génère le client
npm run dev         # Démarre le serveur
```

---

## 🎯 Prochaines étapes

Une fois Supabase configuré:

1. ✅ Mettre à jour `DATABASE_URL` dans `.env`
2. ✅ Exécuter `npx prisma db pull` pour synchroniser
3. ✅ Redémarrer le backend avec `./start-all.sh`
4. ✅ Tester l'inscription d'un nouvel utilisateur
5. ✅ Tester une analyse d'image
6. ✅ Vérifier l'historique dans le dashboard admin

---

## 📊 Schéma de base de données

```
User (Utilisateurs)
├── id: TEXT (PK)
├── email: TEXT (UNIQUE)
├── password: TEXT (bcrypt hash)
├── name: TEXT
├── role: TEXT (USER|ADMIN)
├── credits: INTEGER
├── subscription: TEXT (FREE|PRO|PREMIUM)
├── subscriptionExpiry: TIMESTAMP
├── createdAt: TIMESTAMP
└── updatedAt: TIMESTAMP

Analysis (Analyses)
├── id: TEXT (PK)
├── userId: TEXT (FK → User.id)
├── type: TEXT (IMAGE|VIDEO|TEXT)
├── fileUrl: TEXT
├── fileName: TEXT
├── result: JSONB
├── aiProbability: DOUBLE
├── isAiGenerated: BOOLEAN
└── createdAt: TIMESTAMP

CreditTransaction (Transactions)
├── id: TEXT (PK)
├── userId: TEXT (FK → User.id)
├── amount: INTEGER
├── type: TEXT (CREDIT|DEBIT)
├── description: TEXT
└── createdAt: TIMESTAMP
```

---

## 🛠️ Fonctions utilitaires disponibles

### Décrémenter les crédits
```sql
SELECT decrement_user_credits(
    'user_id_here',
    1,
    'Analyse d''image'
);
```

### Ajouter des crédits
```sql
SELECT add_user_credits(
    'user_id_here',
    100,
    'Achat pack PRO'
);
```

### Statistiques utilisateur
```sql
SELECT * FROM get_user_stats('user_id_here');
```

### Vérifier abonnements expirés
```sql
SELECT check_subscription_expiry();
```

### Nettoyer anciennes analyses (>90 jours)
```sql
SELECT cleanup_old_analyses(90);
```

---

## 🔒 Sécurité RLS

Les politiques Row Level Security garantissent:

- ✅ Les utilisateurs ne voient que leurs propres données
- ✅ Les admins ont accès complet en lecture/écriture
- ✅ Les transactions de crédits sont en lecture seule
- ✅ L'inscription est publique (sans authentification)
- ✅ Toutes les autres opérations nécessitent une authentification

---

## 📞 Support

En cas de problème:

1. Vérifiez les logs Supabase: Dashboard → **Logs**
2. Vérifiez le mot de passe PostgreSQL
3. Testez la connexion: `psql "postgresql://postgres:[PASSWORD]@db.ljrwqjaflgtfddcyumqg.supabase.co:5432/postgres"`
4. Consultez la documentation: https://supabase.com/docs

---

**Dernière mise à jour**: 28 décembre 2025
