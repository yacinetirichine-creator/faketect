# 🌐 Configuration des Domaines

## Domaines
- **faketect.com** - Landing page
- **faketect.app** - Application complète
- **api.faketect.app** - Backend API

## 1️⃣ Configuration Vercel (Frontend)

### Sur Vercel Dashboard :
1. Va dans **Settings → Domains**
2. Ajoute les deux domaines :
   - `faketect.com`
   - `www.faketect.com` (redirect vers faketect.com)
   - `faketect.app`
   - `www.faketect.app` (redirect vers faketect.app)

### Configuration DNS Squarespace pour **faketect.com** et **faketect.app** :

**Type A Record:**
```
Host: @
Points to: 76.76.21.21
TTL: Auto
```

**Type CNAME Record (pour www):**
```
Host: www
Points to: cname.vercel-dns.com
TTL: Auto
```

## 2️⃣ Configuration Render (Backend)

### Sur Render Dashboard :
1. Va dans ton service backend → **Settings**
2. Scroll jusqu'à **Custom Domain**
3. Ajoute : `api.faketect.app`
4. Render te donnera une adresse CNAME (ex: `faketect.onrender.com`)

### Configuration DNS Squarespace pour **api.faketect.app** :

**Type CNAME Record:**
```
Host: api
Points to: faketect.onrender.com (ou l'adresse donnée par Render)
TTL: Auto
```

## 3️⃣ Mise à jour des Variables d'Environnement

### Backend Render - Mettre à jour :
```
FRONTEND_URL=https://faketect.app
```

### Frontend Vercel - Mettre à jour :
```
VITE_API_URL=https://api.faketect.app/api
```

## 4️⃣ Stripe Webhook

### Mettre à jour l'URL webhook sur Stripe Dashboard :
```
https://api.faketect.app/api/stripe/webhook
```

Events à écouter :
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## ✅ Vérification Post-Déploiement

Une fois tout configuré, teste :

1. **Landing page** : `https://faketect.com`
2. **Application** : `https://faketect.app`
3. **API Health** : `https://api.faketect.app/api/health`
4. **Login/Register** : Créer un compte depuis faketect.app
5. **Stripe Checkout** : Tester un paiement (mode test d'abord)

## 🔐 Compte Admin

Pour créer ton compte admin, après avoir créé ton compte sur faketect.app :
1. Va sur Supabase Dashboard
2. Ouvre la table `User`
3. Trouve ton utilisateur par email
4. Change le champ `role` de `USER` à `ADMIN`
5. Recharge l'application

Ou utilise ce script SQL dans Supabase SQL Editor :
```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'ton-email@exemple.com';
```

## 📌 Propagation DNS

⚠️ La propagation DNS peut prendre **24-48h** mais généralement c'est fait en 10-30 minutes.

Vérifie la propagation sur : https://dnschecker.org
