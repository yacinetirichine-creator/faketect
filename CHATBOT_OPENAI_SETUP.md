# 🤖 Configuration du Chatbot avec OpenAI

## Statut Actuel

✅ **Le chatbot fonctionne en mode fallback intelligent**
- Répond aux questions courantes (plans, tarifs, formats)
- Support multilingue (FR, EN, ES, DE, IT, PT)
- Détection de mots-clés pour réponses contextuelles

⚠️ **API OpenAI non configurée** - Le chatbot utilise des réponses pré-définies

## Pourquoi activer OpenAI ?

Avec OpenAI GPT-3.5/4, le chatbot devient :
- Plus intelligent et conversationnel
- Capable de répondre à des questions complexes
- Personnalisé selon le contexte de l'utilisateur
- Évolutif avec l'apprentissage

## Configuration de l'API OpenAI

### 1. Obtenir une clé API OpenAI

1. Créer un compte sur [platform.openai.com](https://platform.openai.com)
2. Aller dans **API Keys** : https://platform.openai.com/api-keys
3. Cliquer sur **Create new secret key**
4. Copier la clé (format : `sk-...`)

**Coût estimé** : ~0.002€ par conversation (GPT-3.5-turbo)

### 2. Configurer dans FakeTect

**Backend** : `/workspaces/faketect/backend/.env`

```env
# Décommenter et ajouter votre clé
OPENAI_API_KEY=sk-votre-cle-ici
```

### 3. Redémarrer le backend

```bash
cd /workspaces/faketect/backend
npm start
```

Vous verrez dans les logs :
```
✅ OpenAI API configurée - Chatbot intelligent activé
```

Au lieu de :
```
⚠️  OpenAI API non configurée - Mode fallback activé
```

## Test du Chatbot

### Avec le mode fallback (actuel)

```bash
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Quels sont vos tarifs ?", "language": "fr"}'
```

**Réponse** : Réponse pré-définie basée sur des mots-clés

### Avec OpenAI activé

```bash
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Je veux analyser une vidéo deepfake, comment faire ?", "language": "fr"}'
```

**Réponse** : Réponse contextuelle et personnalisée générée par GPT-3.5

## Langues Supportées

Le chatbot répond dans toutes ces langues :

- 🇫🇷 **Français** (`language: "fr"`)
- 🇬🇧 **Anglais** (`language: "en"`)
- 🇪🇸 **Espagnol** (`language: "es"`)
- 🇩🇪 **Allemand** (`language: "de"`)
- 🇮🇹 **Italien** (`language: "it"`)
- 🇵🇹 **Portugais** (`language: "pt"`)

## Architecture du Chatbot

```
Frontend (Chatbot.jsx)
    ↓
Backend (/api/chatbot/message)
    ↓
OpenAI Service
    ↓
    ├─→ OpenAI API (si configuré) → GPT-3.5 Turbo
    └─→ Mode Fallback (si non configuré) → Réponses intelligentes
```

## Fonctionnalités du Mode Fallback

Le mode fallback actuel détecte automatiquement :

### Questions sur les Plans
**Mots-clés** : `plan`, `tarif`, `price`, `abonnement`, `subscription`

**Réponse (FR)** :
> FakeTect propose 3 plans : FREE (3 analyses/jour gratuites), PRO (50/jour à 9.99€/mois), et BUSINESS (illimité à 49.99€/mois). Besoin d'aide pour choisir ?

### Questions sur les Formats
**Mots-clés** : `format`, `file`, `fichier`, `video`, `image`

**Réponse (FR)** :
> Nous acceptons les formats JPG, PNG, MP4 et MOV jusqu'à 100MB. Pour de meilleurs résultats, utilisez des fichiers de bonne qualité.

### Questions sur les Prix
**Mots-clés** : `cost`, `coût`, `combien`, `how much`

**Réponse (FR)** :
> Nos tarifs : FREE (gratuit, 3 analyses/jour), PRO (9.99€/mois, 50 analyses/jour), BUSINESS (49.99€/mois, analyses illimitées).

### Message de Bienvenue
**Mots-clés** : `help`, `aide`, `bonjour`, `hello`

**Réponse (FR)** :
> Je peux vous aider avec : vos analyses, les plans tarifaires, les formats acceptés, les problèmes techniques. Que souhaitez-vous savoir ?

## Passage à la Production

### Option 1 : OpenAI (Recommandé)

**Avantages** :
- Réponses intelligentes et contextuelles
- Support de questions complexes
- Amélioration continue

**Coût** : ~50-100€/mois selon le trafic

### Option 2 : Mode Fallback Étendu

**Avantages** :
- Gratuit
- Réponses instantanées
- Pas de limite de requêtes

**Inconvénient** : Réponses limitées aux mots-clés

### Option 3 : Hybride (Meilleur des deux mondes)

1. Utiliser le fallback pour questions simples
2. Activer OpenAI pour questions complexes
3. Économiser sur les coûts API

## Monitoring

Vérifier les logs du chatbot :

```bash
tail -f /workspaces/faketect/backend/logs/combined.log | grep chatbot
```

Les métriques incluent :
- Nombre de conversations
- Langue utilisée
- Détection de support humain requis (`[HUMAN_SUPPORT]`)

## Support

Le chatbot escalade automatiquement vers un humain si :
- La réponse contient `[HUMAN_SUPPORT]`
- Question trop complexe
- Problème technique

Les admins sont notifiés via le dashboard `/admin/chat`

## Prochaines Améliorations

- [ ] Historique des conversations persistant
- [ ] Réponses suggérées automatiques
- [ ] Analytics des questions fréquentes
- [ ] Training sur FAQ spécifiques FakeTect
- [ ] Intégration Slack pour notifications admin

---

**Créé le** : 24 janvier 2026
**Statut** : ✅ Mode Fallback Actif | ⚠️ OpenAI Non Configuré
