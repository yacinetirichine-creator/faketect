# 🚀 Configuration Redis Cache (Upstash)

## 📊 Objectif

Réduire les coûts d'API de **70-80%** en cachant les résultats d'analyse identiques.

## 🎯 Avantages

- ✅ **Économies massives** : Même fichier = résultat en cache (pas d'appel API)
- ✅ **Performances** : Réponses instantanées pour les analyses déjà effectuées
- ✅ **Fallback gracieux** : L'app fonctionne avec ou sans Redis
- ✅ **Gratuit** : Upstash offre 10 000 commandes/jour gratuitement

## 🛠️ Configuration Upstash Redis

### Étape 1 : Créer un compte Upstash

1. Aller sur [https://upstash.com](https://upstash.com)
2. S'inscrire gratuitement (GitHub/Google)
3. Créer une nouvelle base Redis :
   - **Name** : `faketect-cache`
   - **Type** : Regional (plus rapide)
   - **Region** : Choisir la région la plus proche (ex: `eu-west-1` pour l'Europe)
   - **Eviction** : `allkeys-lru` (supprime les clés les moins utilisées automatiquement)

### Étape 2 : Récupérer l'URL de connexion

1. Dans le dashboard Upstash, cliquer sur votre base Redis
2. Copier l'URL de connexion (format : `rediss://default:xxx@yyy.upstash.io:6379`)

### Étape 3 : Configurer les variables d'environnement

#### Backend local (`.env`)

```bash
# Redis Cache (Upstash)
REDIS_URL=rediss://default:VOTRE_TOKEN@VOTRE_HOST.upstash.io:6379
```

#### Production (Render)

1. Aller dans les **Environment Variables** de votre service backend
2. Ajouter :
   - **Key** : `REDIS_URL`
   - **Value** : `rediss://default:VOTRE_TOKEN@VOTRE_HOST.upstash.io:6379`
3. Redéployer le service

## 📦 Fonctionnement du Cache

### Cache des analyses d'images/vidéos

- **Clé** : `analysis:{SHA256_du_fichier}`
- **TTL** : 7 jours
- **Logique** : Même fichier (même hash) = même résultat

### Cache des analyses de texte

- **Clé** : `text:{SHA256_du_texte}`
- **TTL** : 30 jours
- **Logique** : Même texte = même résultat

## 🔍 Vérification

### Logs backend

Avec Redis configuré :
```
✅ Redis connecté - cache activé
```

Sans Redis :
```
⚠️  Redis non configuré - cache désactivé (mode dégradé)
```

### Logs d'analyse

**Cache HIT** (résultat trouvé) :
```
✅ Cache HIT pour photo.jpg (a3f7b9c2e1d4...)
```

**Cache MISS** (nouvel appel API) :
```
⚠️  Cache MISS pour photo.jpg (a3f7b9c2e1d4...)
```

### API Admin

**Statistiques du cache** (requiert rôle ADMIN) :
```bash
GET /api/admin/cache/stats
```

Réponse :
```json
{
  "success": true,
  "cache": {
    "enabled": true,
    "status": "connected",
    "hits": "1234",
    "misses": "567"
  }
}
```

**Vider le cache** :
```bash
POST /api/admin/cache/clear
Content-Type: application/json

{
  "pattern": "analysis:*"  // Optionnel, défaut: "*" (tout)
}
```

## 📈 Estimation des Économies

### Scénario : 1000 analyses/mois

Sans cache :
- **Coût API** : 1000 appels × $0.01 = **$10/mois**

Avec cache (taux de hit 70%) :
- **Cache hits** : 700 × $0 = $0
- **Cache misses** : 300 × $0.01 = $3
- **Économie** : **$7/mois** (70%)

### Scénario : 10 000 analyses/mois

Sans cache :
- **Coût API** : 10 000 × $0.01 = **$100/mois**

Avec cache (taux de hit 75%) :
- **Cache hits** : 7 500 × $0 = $0
- **Cache misses** : 2 500 × $0.01 = $25
- **Économie** : **$75/mois** (75%)

## 🧪 Test en Local

1. Configurer `REDIS_URL` dans `.env`
2. Redémarrer le backend : `./start-backend.sh`
3. Analyser une image 2 fois :
   - **1ère fois** : `Cache MISS` (appel API)
   - **2ème fois** : `Cache HIT` (instantané, gratuit)

## 🔒 Sécurité

- ✅ **TLS** : Connexion chiffrée (`rediss://`)
- ✅ **Authentification** : Token Upstash requis
- ✅ **Isolation** : Chaque environnement (dev/prod) peut avoir son propre Redis
- ✅ **Expiration automatique** : TTL pour éviter les données obsolètes

## 📊 Monitoring Upstash

Dashboard Upstash affiche :
- **Daily Requests** : Nombre de commandes/jour (limite gratuite : 10 000)
- **Storage** : Taille des données en cache
- **Latency** : Temps de réponse moyen
- **Hit Rate** : Pourcentage de cache hits

## 🚨 Limites du Plan Gratuit

- ✅ **10 000 commandes/jour** : Largement suffisant pour démarrer
- ✅ **256 MB de stockage** : ~100 000 résultats d'analyse
- ⚠️ Si dépassement : Passer au plan payant ($0.20 / 100K commandes)

## 💡 Conseils

1. **Activer Redis en prod en premier** : Économies immédiates
2. **Surveiller le Hit Rate** : Si < 50%, ajuster les TTL
3. **Vider le cache si nécessaire** : Via l'API admin ou le dashboard Upstash
4. **Analyser les patterns** : Quels types d'analyses sont les plus cachés ?

## 🆘 Dépannage

### "Redis connection failed"

- Vérifier que `REDIS_URL` est correct
- Tester la connexion depuis le dashboard Upstash (bouton "Connect")
- Vérifier que le serveur Render peut accéder à Upstash (pas de firewall)

### Cache ne fonctionne pas

- Vérifier les logs : "Cache HIT" vs "Cache MISS"
- Tester avec le même fichier 2 fois de suite
- Vérifier les stats admin : `/api/admin/cache/stats`

### Performances dégradées

- Le mode dégradé (sans Redis) fonctionne normalement
- Redis ajoute ~10-20ms de latence (négligeable vs appel API)
- Si problème Upstash, désactiver temporairement `REDIS_URL`

---

✅ **Redis configuré et testé** - Prêt pour la production !
