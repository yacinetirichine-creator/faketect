# Configuration du Chatbot IA FakeTect

## 🤖 État actuel

Le chatbot est **fonctionnel** mais nécessite une clé API OpenAI pour fonctionner pleinement.

## ✅ Fonctionnalités

- ✅ Support multi-langue (FR, EN, ES, DE, IT, PT)
- ✅ Historique de conversation sauvegardé en DB
- ✅ Interface publique (pas d'authentification requise)
- ✅ Fallback automatique si API indisponible
- ✅ Système de prompts personnalisés par langue

## 🔧 Configuration requise

### 1. Obtenir une clé API OpenAI

1. Créer un compte sur https://platform.openai.com/
2. Aller dans **API keys** : https://platform.openai.com/api-keys
3. Cliquer sur **Create new secret key**
4. Copier la clé (commence par `sk-...`)

### 2. Configurer la clé dans le backend

**Option A : Développement local**
```bash
cd backend
nano .env  # ou vim, code, etc.
```

Décommenter et remplir :
```env
OPENAI_API_KEY=sk-votre-cle-ici
```

**Option B : Production (Render.com)**
1. Aller dans le Dashboard Render
2. Sélectionner votre service backend
3. Aller dans **Environment**
4. Ajouter la variable :
   - Clé : `OPENAI_API_KEY`
   - Valeur : `sk-votre-cle-ici`
5. Sauvegarder (redémarrage automatique)

### 3. Redémarrer le serveur

**Local :**
```bash
cd backend
npm run dev
```

**Render :** redémarre automatiquement après modification des variables d'environnement

## 📊 Coûts OpenAI

Le chatbot utilise **GPT-3.5-turbo** (économique) :

- **Prix** : ~$0.002 par conversation (250 tokens max)
- **Budget estimé** : $5/mois pour ~2500 conversations
- **Crédit gratuit** : $5 offerts à l'inscription OpenAI

### Modèles utilisés

| Fonctionnalité | Modèle | Coût/1K tokens |
|---------------|--------|----------------|
| Chatbot | gpt-3.5-turbo | $0.001 |
| Analyse texte | gpt-4 | $0.03 |
| Analyse image | gpt-4-vision | $0.04 |

## 🧪 Tester le chatbot

### Via l'interface frontend
```
http://localhost:5173
→ Cliquer sur l'icône du chatbot (coin inférieur droit)
→ Envoyer un message
```

### Via API directe
```bash
curl -X POST http://localhost:3001/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Comment fonctionne FakeTect?",
    "language": "fr"
  }'
```

## 🔍 Debug

### Vérifier que la clé est chargée
```bash
cd backend
node -e "require('dotenv').config(); console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configurée' : '❌ Manquante')"
```

### Logs du chatbot
```bash
# Les logs incluent :
# - "Chatbot conversation" : succès
# - "Chatbot error" : erreur API
# - Réponse fallback si API indisponible
```

### Réponse fallback (sans API)
Si `OPENAI_API_KEY` n'est pas configurée, le chatbot répond :
```
"Désolé, je rencontre un problème technique. Un administrateur va vous répondre rapidement. [HUMAN_SUPPORT]"
```

Le tag `[HUMAN_SUPPORT]` alerte les admins pour intervention manuelle.

## 🌍 Prompts par langue

Le chatbot adapte automatiquement son comportement selon la langue :

- **Plans** : FREE (3/jour), PRO (50/jour), BUSINESS (illimité)
- **Formats acceptés** : JPG, PNG, MP4, MOV (max 100MB)
- **Sujets couverts** : analyse, plans, paiement, technique

## 📝 Amélioration continue

Pour améliorer les réponses :
1. Modifier les prompts dans `/backend/src/services/openai.js`
2. Ajouter des exemples de conversations dans `systemPrompts`
3. Ajuster `temperature` (0.7 = créatif, 0.3 = précis)
4. Augmenter `max_tokens` si réponses trop courtes

## ⚠️ Sécurité

- ✅ Clé API dans `.env` (jamais commitée)
- ✅ `.env` dans `.gitignore`
- ✅ Rate limiting sur `/api/chatbot/message`
- ✅ Validation des entrées utilisateur

## 🚀 Prochaines étapes

Pour améliorer le chatbot :
- [ ] Ajouter RAG (Retrieval Augmented Generation) pour les FAQ
- [ ] Intégrer l'historique des analyses utilisateur
- [ ] Support audio (Speech-to-Text)
- [ ] Analytics des conversations
- [ ] Transfert vers agent humain

## 💡 Alternatives à OpenAI

Si vous voulez éviter OpenAI :

1. **Anthropic Claude** (meilleur pour le français)
2. **Google Gemini** (gratuit jusqu'à 60 req/min)
3. **Mistral AI** (français, moins cher)
4. **Ollama** (local, gratuit, privé)

## 📞 Support

Questions ? Créer une issue sur GitHub ou contacter l'équipe.
