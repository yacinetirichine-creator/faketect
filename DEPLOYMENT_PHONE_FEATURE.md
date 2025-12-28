# Guide de déploiement - Collecte téléphone WhatsApp

## 🚀 Déploiement Production

### 1. Base de données (DÉJÀ FAIT ✅)
```bash
cd backend
npx prisma db push
npx prisma generate
```

### 2. Vérification des variables d'environnement
Assurez-vous que ces variables sont configurées sur Render :
```env
DATABASE_URL=postgresql://...  # Votre Supabase/Neon DB
JWT_SECRET=votre-secret-jwt
STRIPE_SECRET_KEY=sk_live_...  # Clé Stripe production
OPENAI_API_KEY=sk-...
```

### 3. Déploiement Backend (Render)
```bash
git add .
git commit -m "feat: ajout collecte téléphone pour marketing WhatsApp avec consentement RGPD"
git push origin main
```

Render détectera automatiquement le push et redéployera.

### 4. Déploiement Frontend (Vercel)
Vercel se déploie automatiquement sur push. Vérifiez que :
```env
VITE_API_URL=https://votre-backend.onrender.com
```

### 5. Tests post-déploiement

#### Test inscription basique
1. Aller sur https://faketect.com/register
2. Remplir : nom, email, mot de passe
3. **NE PAS** remplir le téléphone
4. **NE PAS** cocher marketing
5. Soumettre → Vérifier création compte

#### Test avec téléphone sans marketing
1. Nouvelle inscription
2. Remplir téléphone : +33 6 12 34 56 78
3. **NE PAS** cocher marketing
4. Soumettre → Vérifier en DB : phone présent, acceptMarketing=false

#### Test avec téléphone + marketing
1. Nouvelle inscription
2. Remplir téléphone : +33 7 12 34 56 78
3. **COCHER** marketing
4. Soumettre → Vérifier en DB : phone présent, acceptMarketing=true

### 6. Vérification base de données

Connectez-vous à votre DB et vérifiez :
```sql
-- Voir les derniers utilisateurs avec téléphone
SELECT email, phone, "acceptMarketing", "createdAt" 
FROM "User" 
WHERE phone IS NOT NULL 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Compter les opt-ins marketing
SELECT 
  COUNT(*) as total_users,
  COUNT(phone) as users_with_phone,
  SUM(CASE WHEN "acceptMarketing" THEN 1 ELSE 0 END) as marketing_opt_ins
FROM "User";
```

---

## 📋 Checklist pré-déploiement

- [x] Migration Prisma exécutée
- [x] Formulaire Register.jsx mis à jour
- [x] Traductions FR/EN complètes
- [x] Backend route /register modifiée
- [x] Politique confidentialité mise à jour
- [x] Documentation créée
- [ ] Tests manuels effectués
- [ ] Variables d'env production vérifiées
- [ ] Git commit + push
- [ ] Vérification déploiement Render
- [ ] Vérification déploiement Vercel
- [ ] Tests post-déploiement

---

## 🔍 Monitoring

### Logs à surveiller (Render)
Cherchez ces patterns dans les logs :
```
POST /api/auth/register
```

### Métriques à tracker
1. Taux de remplissage téléphone (% utilisateurs qui fournissent)
2. Taux opt-in marketing (% qui cochent la case)
3. Erreurs d'inscription liées au téléphone

---

## ⚠️ Rollback si besoin

Si problème en production :

### Option 1: Rendre le champ invisible temporairement
```jsx
// Dans Register.jsx, commenter le bloc téléphone
{/* <div>
  <label>...téléphone...</label>
</div> */}
```

### Option 2: Rollback complet
```bash
git revert HEAD
git push origin main
```

Puis en DB (si vraiment nécessaire) :
```sql
ALTER TABLE "User" DROP COLUMN phone;
ALTER TABLE "User" DROP COLUMN "acceptMarketing";
```

---

## 📊 Export des données marketing

Pour récupérer les numéros opt-in pour WhatsApp :

```sql
-- Utilisateurs ayant consenti au marketing
SELECT 
  email,
  name,
  phone,
  language,
  "createdAt"
FROM "User"
WHERE "acceptMarketing" = true
  AND phone IS NOT NULL
ORDER BY "createdAt" DESC;

-- Export CSV
COPY (
  SELECT email, name, phone, language
  FROM "User"
  WHERE "acceptMarketing" = true AND phone IS NOT NULL
) TO '/tmp/marketing_contacts.csv' WITH CSV HEADER;
```

**⚠️ RGPD:** Ne partagez jamais ce fichier. Utilisez-le uniquement pour :
- Import dans WhatsApp Business API
- Campagnes marketing autorisées
- Conservez l'audit trail des consentements

---

## 🎯 Prochaine phase : WhatsApp Business API

### Prérequis
1. Compte WhatsApp Business (business.whatsapp.com)
2. Numéro de téléphone professionnel
3. Vérification business Facebook
4. API key WhatsApp

### Intégration
- Utiliser Twilio WhatsApp API ou
- Meta WhatsApp Business API directe
- Template de messages approuvés par Meta

### Conformité
- Chaque message doit inclure lien désabonnement
- Respecter opt-out immédiat
- Logger tous les envois (audit RGPD)

---

## ✅ Validation finale

Avant de déployer, testez localement :

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

Puis :
1. Ouvrir http://localhost:5173/register
2. Tester inscription complète
3. Vérifier console backend
4. Vérifier base de données locale
5. Vérifier traductions FR/EN

Si tout est OK → **Déploiement production** 🚀
