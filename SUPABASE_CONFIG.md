# 🗄️ Configuration Supabase - FakeTect

## 📋 Informations de connexion

**Project URL** : `https://ljrwqjaflgtfddcyumqg.supabase.co`  
**Database Host** : `db.ljrwqjaflgtfddcyumqg.supabase.co`  
**Region** : Auto-détectée par Supabase

### 🔑 Clés d'API

```env
# Clé publique (anon) - Safe pour le frontend
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcndxamFmbGd0ZmRkY3l1bXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTk0MjUsImV4cCI6MjA4MjQ5NTQyNX0.IVYuiohHgB4eBDILxI5-QzthiJRRqyD4tvIXJy4agXs

# Connection string PostgreSQL (backend uniquement)
DATABASE_URL=postgresql://postgres.ljrwqjaflgtfddcyumqg:[PASSWORD]@db.ljrwqjaflgtfddcyumqg.supabase.co:5432/postgres
```

> ⚠️ **Important** : Remplacer `[PASSWORD]` par votre mot de passe Supabase

---

## 🚀 Initialisation de la base de données

### Étape 1 : Générer le client Prisma
```bash
cd backend
npx prisma generate
```

### Étape 2 : Pousser le schéma vers Supabase
```bash
npx prisma db push
```

Cette commande va créer les tables :
- ✅ `User`
- ✅ `Analysis`

### Étape 3 : Vérifier la création
```bash
npx prisma studio
```

Ouvre une interface web sur `http://localhost:5555` pour voir vos tables.

---

## 📊 Structure des tables créées

### Table `User`
```sql
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "role" TEXT DEFAULT 'USER',
  "plan" TEXT DEFAULT 'FREE',
  "language" TEXT DEFAULT 'fr',
  "stripeId" TEXT,
  "usedToday" INTEGER DEFAULT 0,
  "usedMonth" INTEGER DEFAULT 0,
  "lastReset" TIMESTAMP DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP
);
```

### Table `Analysis`
```sql
CREATE TABLE "Analysis" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  "type" TEXT DEFAULT 'IMAGE',
  "fileName" TEXT,
  "fileUrl" TEXT,
  "aiScore" DOUBLE PRECISION,
  "isAi" BOOLEAN,
  "confidence" DOUBLE PRECISION,
  "details" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

---

## 🔒 Configuration RLS (Row Level Security)

Pour activer la sécurité au niveau des lignes dans Supabase :

### 1. Activer RLS sur les tables

Dans le dashboard Supabase → SQL Editor :

```sql
-- Activer RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Analysis" ENABLE ROW LEVEL SECURITY;

-- Politique pour User : un utilisateur ne peut voir que ses propres données
CREATE POLICY "Users can view own data" ON "User"
  FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON "User"
  FOR UPDATE
  USING (auth.uid()::text = id);

-- Politique pour Analysis : un utilisateur ne peut voir que ses analyses
CREATE POLICY "Users can view own analyses" ON "Analysis"
  FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own analyses" ON "Analysis"
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own analyses" ON "Analysis"
  FOR DELETE
  USING (auth.uid()::text = "userId");

-- Admin peut tout voir
CREATE POLICY "Admins can view all data" ON "User"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );
```

> ⚠️ **Note** : Actuellement, l'app utilise JWT côté backend, pas Supabase Auth. RLS est optionnel.

---

## 📁 Supabase Storage (optionnel)

Pour stocker les fichiers uploadés dans Supabase Storage au lieu du disque local :

### 1. Créer un bucket
```sql
-- Dans Supabase Dashboard → Storage
Bucket name: faketect-uploads
Public: false
File size limit: 50MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

### 2. Modifier le backend

```javascript
// backend/src/routes/analysis.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service key, pas anon key
);

router.post('/file', auth, checkLimit, upload.single('file'), async (req, res) => {
  try {
    // Upload vers Supabase Storage
    const fileName = `${uuid()}-${req.file.originalname}`;
    const { data, error } = await supabase.storage
      .from('faketect-uploads')
      .upload(`${req.user.id}/${fileName}`, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });
    
    if (error) throw error;
    
    // Obtenir l'URL publique signée (1h)
    const { data: urlData } = await supabase.storage
      .from('faketect-uploads')
      .createSignedUrl(`${req.user.id}/${fileName}`, 3600);
    
    const analysis = await prisma.analysis.create({
      data: {
        id: uuid(),
        userId: req.user.id,
        type: req.file.mimetype.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
        fileName: req.file.originalname,
        fileUrl: urlData.signedUrl
      }
    });
    
    // Analyse IA...
    const result = await detection.analyze(req.file.buffer, req.file.mimetype);
    
    // Mise à jour avec résultats
    const updated = await prisma.analysis.update({
      where: { id: analysis.id },
      data: { aiScore: result.aiScore, isAi: result.isAi, confidence: result.confidence, details: result }
    });
    
    res.json({ success: true, analysis: { ...updated, verdict: result.verdict } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur analyse' });
  }
});
```

### 3. Politique Storage RLS
```sql
-- Permettre upload uniquement pour utilisateurs authentifiés
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'faketect-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Permettre lecture uniquement de ses propres fichiers
CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'faketect-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 📈 Monitoring Supabase

### Dashboard Supabase
- **Database** → Voir les tables, requêtes
- **Storage** → Fichiers uploadés, usage
- **Logs** → Requêtes SQL, erreurs
- **API** → Stats d'utilisation

### Métriques à surveiller
- **Database size** : Limite Free = 500MB
- **Bandwidth** : Limite Free = 5GB/mois
- **API requests** : Pas de limite stricte

### Upgrade si nécessaire
```
Free    : 0$/mois    → 500MB DB, 1GB storage
Pro     : 25$/mois   → 8GB DB, 100GB storage
Team    : 599$/mois  → 32GB DB, 200GB storage
```

---

## 🔧 Maintenance

### Réinitialiser les compteurs quotidiens
```sql
-- À exécuter via cron job (tous les jours à 00:00 UTC)
UPDATE "User"
SET "usedToday" = 0
WHERE "lastReset" < NOW() - INTERVAL '1 day';
```

### Réinitialiser les compteurs mensuels
```sql
-- Premier jour du mois
UPDATE "User"
SET "usedMonth" = 0
WHERE "lastReset" < DATE_TRUNC('month', NOW());
```

### Implémenter via Supabase Edge Functions
```javascript
// supabase/functions/reset-quotas/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Reset daily
  const { data, error } = await supabase
    .from('User')
    .update({ usedToday: 0 })
    .lt('lastReset', new Date(Date.now() - 24 * 60 * 60 * 1000))

  return new Response(JSON.stringify({ success: true, updated: data?.length }))
})
```

Puis configurer un cron job dans Supabase Dashboard → Edge Functions.

---

## 🚨 Backup & Recovery

### Backup automatique (Supabase Pro)
- Daily backups (rétention 7j)
- Point-in-time recovery

### Backup manuel
```bash
# Exporter toutes les données
npx prisma db pull
npx prisma db seed

# Ou via pg_dump
pg_dump -h db.ljrwqjaflgtfddcyumqg.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f backup_$(date +%Y%m%d).dump
```

---

## ✅ Checklist de déploiement

- [ ] `.env` configuré avec DATABASE_URL
- [ ] `npx prisma generate` exécuté
- [ ] `npx prisma db push` réussi
- [ ] Tables visibles dans Prisma Studio
- [ ] RLS activé (optionnel)
- [ ] Storage bucket créé (optionnel)
- [ ] Policies configurées
- [ ] Backup configuré
- [ ] Monitoring activé

---

**Dernière mise à jour** : 28 décembre 2025  
**Documentation Supabase** : https://supabase.com/docs
