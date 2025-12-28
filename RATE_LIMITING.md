# 🛡️ Rate Limiting & Protection Anti-Spam

FakeTect utilise une stratégie de protection multi-niveaux contre les abus, le spam et les attaques DDoS.

## 📊 Architecture de Protection

### Niveau 1 : DDoS Protection (Ultra-stricte)
- **Limite** : 300 requêtes/minute par IP
- **Objectif** : Bloquer les attaques DDoS massives
- **Scope** : Toutes les routes `/api/*`
- **Action** : Blocage immédiat avec log d'alerte

### Niveau 2 : Slow-Down Progressif
- **Démarrage** : Après 50 requêtes/15min
- **Délai** : +100ms par requête supplémentaire
- **Délai max** : 5 secondes
- **Objectif** : Ralentir les utilisateurs trop actifs avant blocage complet
- **Scope** : Toutes les routes `/api/*`

### Niveau 3 : Rate Limiting Global
- **Limite** : 200 requêtes/15min par IP
- **Objectif** : Usage normal de l'application
- **Scope** : Toutes les routes `/api/*`
- **Exclusions** : Health check, fichiers statiques

## 🔒 Rate Limiters Spécifiques

### Authentication (Login)
```javascript
authLimiter
- Fenêtre : 15 minutes
- Max : 10 tentatives
- Ne compte que les échecs (skipSuccessfulRequests: true)
- Protection : Brute-force attacks
- Route : /api/auth/login
```

### Registration (Signup)
```javascript
registerLimiter
- Fenêtre : 1 heure
- Max : 5 inscriptions par IP
- Protection : Spam de comptes
- Route : /api/auth/register
```

### Analysis
```javascript
analysisLimiter
- Fenêtre : 1 minute
- Max : 10 analyses
- Protection : Abus du service de détection
- Route : /api/analysis, /api/text-analysis
```

### Upload
```javascript
uploadLimiter
- Fenêtre : 1 minute
- Max : 5 fichiers
- Protection : Spam d'uploads
- Routes : POST avec multipart/form-data
```

### Admin Panel
```javascript
adminLimiter
- Fenêtre : 15 minutes
- Max : 50 requêtes
- Protection : Accès non-autorisé
- Route : /api/admin/*
```

### Payments (Stripe)
```javascript
paymentLimiter
- Fenêtre : 15 minutes
- Max : 20 tentatives
- Protection : Fraude par carte bancaire
- Route : /api/stripe/create-checkout
```

### Webhooks (Stripe)
```javascript
webhookLimiter
- Fenêtre : 1 minute
- Max : 100 webhooks
- Protection : Flood de webhooks
- Route : /api/stripe/webhook
- Note : Stripe peut envoyer plusieurs webhooks simultanés
```

### Password Reset
```javascript
passwordResetLimiter
- Fenêtre : 1 heure
- Max : 3 demandes
- Protection : Spam de réinitialisation
- Route : /api/auth/reset-password
```

## 📈 Réponses d'Erreur

Tous les limiters retournent un code **429 Too Many Requests** avec :

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Trop de requêtes, veuillez réessayer dans 15 minutes",
  "retryAfter": "15 minutes"
}
```

Codes d'erreur spécifiques :
- `RATE_LIMIT_EXCEEDED` - Limite globale
- `AUTH_RATE_LIMIT` - Trop de tentatives de connexion
- `REGISTER_RATE_LIMIT` - Trop d'inscriptions
- `ANALYSIS_RATE_LIMIT` - Trop d'analyses
- `UPLOAD_RATE_LIMIT` - Trop d'uploads
- `ADMIN_RATE_LIMIT` - Trop de requêtes admin
- `PAYMENT_RATE_LIMIT` - Trop de tentatives de paiement
- `WEBHOOK_RATE_LIMIT` - Trop de webhooks
- `PASSWORD_RESET_RATE_LIMIT` - Trop de demandes de reset
- `DDOS_PROTECTION` - Activité suspecte détectée

## 🔍 Monitoring

Toutes les violations de rate limit sont loguées avec :
- IP de l'utilisateur
- URL accédée
- Type de limitation
- User ID (si authentifié)
- Timestamp

Logs disponibles dans :
- Console serveur (développement)
- Sentry (production)
- Fichiers logs Winston

## ⚙️ Configuration

Les limiters sont configurables via `/backend/src/middleware/rateLimiter.js`

Pour ajuster les limites :
1. Modifier les valeurs `max` et `windowMs`
2. Redémarrer le serveur
3. Monitorer les logs pour détecter les faux positifs

## 🧪 Tests

### Tester une limite globale :
```bash
# Envoyer 201 requêtes en 15min
for i in {1..201}; do
  curl http://localhost:3001/api/health
done
# La 201ème devrait retourner 429
```

### Tester le slow-down :
```bash
# Envoyer 60 requêtes rapidement
for i in {1..60}; do
  time curl http://localhost:3001/api/health
done
# Les requêtes après la 50ème seront progressivement ralenties
```

### Tester auth limiter :
```bash
# 11 tentatives de login avec mauvais mot de passe
for i in {1..11}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# La 11ème devrait retourner 429
```

## 🚀 Production

En production, les limiters :
- ✅ Bloquent les attaques DDoS
- ✅ Protègent contre le brute-force
- ✅ Empêchent le spam de comptes
- ✅ Limitent l'abus du service
- ✅ Réduisent les coûts API (Sightengine)
- ✅ Améliorent la stabilité du serveur

## 📚 Références

- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)
- [express-slow-down](https://www.npmjs.com/package/express-slow-down)
- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
