# 🧪 Tests de Sécurité - Guide d'Utilisation

## Lancer les tests automatiques

### 1. Démarrer le serveur

```bash
cd backend
npm run dev
```

### 2. Dans un autre terminal, lancer les tests

```bash
cd /Users/yacinetirichine/Downloads/faketect
./test-security.sh
```

## Résultat attendu

```
🧪 Tests de sécurité FakeTect
==============================

Checking server status...
✓ Server is running

Testing: Health check... ✓ PASS (HTTP 200)
Testing: Invalid email validation... ✓ PASS (HTTP 400)
Testing: Weak password validation... ✓ PASS (HTTP 400)
Testing: Invalid phone validation... ✓ PASS (HTTP 400)
Testing: Login missing email... ✓ PASS (HTTP 400)

Testing rate limiting (5 attempts)...
......
✓ Rate limit triggered at attempt 6

==============================
Results:
  Passed: 6
  Failed: 0

🎉 All tests passed!
```

## Tests manuels

### Test validation email

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalidemail","password":"Test1234"}'
```

**Attendu:** `400 Bad Request` avec message d'erreur

### Test mot de passe faible

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123"}'
```

**Attendu:** Erreur validation (8+ caractères requis)

### Test rate limiting

```bash
# Lancer 6 fois rapidement
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

**Attendu:** La 6ème retourne `429 Too Many Requests`

### Vérifier les logs

```bash
# Logs combinés
tail -f backend/logs/combined.log

# Logs erreurs uniquement
tail -f backend/logs/error.log
```

## Troubleshooting

### Le serveur ne démarre pas

```bash
cd backend
npm install
npm run dev
```

### Les tests échouent

1. Vérifier que le serveur tourne : `curl http://localhost:3001/api/health`
2. Vérifier les logs : `tail -f backend/logs/combined.log`
3. Réinitialiser rate limits : Attendre 15 minutes ou redémarrer le serveur

### Permission denied sur test-security.sh

```bash
chmod +x test-security.sh
```

## Tests avec Postman

Importer cette collection pour tester manuellement :

```json
{
  "info": {
    "name": "FakeTect Security Tests"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "http://localhost:3001/api/health"
      }
    },
    {
      "name": "Register - Invalid Email",
      "request": {
        "method": "POST",
        "url": "http://localhost:3001/api/auth/register",
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"notanemail\",\"password\":\"Test1234\"}"
        }
      }
    }
  ]
}
```
