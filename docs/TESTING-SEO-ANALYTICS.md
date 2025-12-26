# Guide Complet : Tests, SEO et Analytics

## 📋 Table des matières

1. [Tests](#tests)
2. [SEO](#seo)
3. [Analytics](#analytics)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Utilisation](#utilisation)

---

## 🧪 Tests

### Tests Unitaires et d'Intégration

#### Frontend (Vitest + Testing Library)

**Configuration** : `packages/web/vitest.config.js`

```bash
# Lancer les tests
npm run test:web

# Mode watch
npm run test:web -- --watch

# Avec couverture
npm run test:coverage

# Interface UI
npm run test:ui
```

**Structure des tests** :
```
packages/web/src/
├── tests/
│   ├── setup.js              # Configuration globale
│   └── components/
│       └── Button.test.jsx   # Exemple de test
```

**Exemple de test** :
```javascript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('MonComposant', () => {
  it('affiche le texte correct', () => {
    render(<MonComposant text="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

#### Backend (Jest)

**Configuration** : `packages/api/jest.config.js`

```bash
# Lancer les tests
npm run test:api

# Mode watch
npm run test:api -- --watch

# Avec couverture
npm run test:api -- --coverage
```

**Structure des tests** :
```
packages/api/
├── tests/
│   ├── setup.js                    # Configuration Jest
│   └── services/
│       └── analyzer.test.js        # Tests des services
```

### Tests End-to-End (Playwright)

**Configuration** : `playwright.config.js`

```bash
# Installer Playwright
npx playwright install

# Lancer les tests E2E
npm run test:e2e

# Mode UI interactif
npm run test:e2e:ui

# Tests spécifiques
npm run test:e2e -- upload.spec.js

# Sur un navigateur spécifique
npm run test:e2e -- --project=chromium
```

**Structure des tests** :
```
e2e/
├── fixtures/
│   └── test-image.jpg      # Fichiers de test
└── upload.spec.js          # Scénarios E2E
```

**Exemple de test E2E** :
```javascript
test('upload et analyse image', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('input[type="file"]', 'fixtures/test.jpg');
  await expect(page.locator('[data-testid="results"]')).toBeVisible();
});
```

### Couverture de Code

**Objectifs** :
- ✅ Lignes : 80%
- ✅ Fonctions : 80%
- ✅ Branches : 80%
- ✅ Statements : 80%

**Rapports** :
- HTML : `packages/web/coverage/index.html`
- JSON : `coverage/coverage-final.json`
- LCOV : Pour intégration CI/CD

---

## 🔍 SEO

### Métadonnées Dynamiques

**Hook `useSEO`** :
```javascript
import { useSEO } from '@/hooks/useSEO';

function MaPage() {
  useSEO({
    title: 'Analyser une Image',
    description: 'Uploadez une image pour détecter si elle est générée par IA',
    keywords: 'détection IA, analyse image',
    ogImage: 'https://faketect.com/og-analyze.jpg',
  });
  
  return <div>...</div>;
}
```

### Données Structurées (Schema.org)

**Hook `useStructuredData`** :
```javascript
import { useStructuredData } from '@/hooks/useSEO';

function HomePage() {
  useStructuredData({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'FakeTect',
    description: 'Détecteur d\'images IA',
    // ...
  });
  
  return <div>...</div>;
}
```

### Sitemap et Robots.txt

**Générer les fichiers** :
```bash
# Générer sitemap.xml
npm run generate:sitemap

# Générer robots.txt
npm run generate:robots

# Générer les deux
npm run seo:generate
```

**Fichiers générés** :
- `packages/web/public/sitemap.xml`
- `packages/web/public/robots.txt`

**Configuration** : `packages/web/src/config/seo.js`

### Optimisations SEO Implémentées

✅ **Meta tags dynamiques** : Title, Description, Keywords
✅ **Open Graph** : Facebook, LinkedIn
✅ **Twitter Cards** : Aperçus enrichis
✅ **Canonical URLs** : Éviter le contenu dupliqué
✅ **Robots meta** : Contrôle de l'indexation
✅ **Structured Data** : JSON-LD (Schema.org)
✅ **Sitemap XML** : Indexation complète
✅ **Robots.txt** : Directives pour crawlers
✅ **Language** : Attribut lang dynamique
✅ **Performance** : Préchargement DNS, polices

### Checklist SEO

- [ ] Configurer Google Search Console
- [ ] Soumettre le sitemap
- [ ] Vérifier les Core Web Vitals
- [ ] Tester avec Lighthouse
- [ ] Configurer les balises hreflang (multilingue)
- [ ] Optimiser les images (alt, format, taille)
- [ ] Ajouter un fichier manifest.json (PWA)

---

## 📊 Analytics

### Google Analytics 4 (GA4)

**Configuration** :
```env
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_ENABLE_GA4=true
```

**Initialisation automatique** : Le service analytics s'initialise au chargement de l'app.

**Tracking des pages** :
```javascript
import { usePageTracking } from '@/hooks/useAnalytics';

function App() {
  usePageTracking(); // Track automatique des changements de page
  return <Routes>...</Routes>;
}
```

**Tracking des événements** :
```javascript
import { useAnalytics } from '@/hooks/useAnalytics';

function MonComposant() {
  const { trackEvent } = useAnalytics();
  
  const handleClick = () => {
    trackEvent('button_click', {
      button_name: 'upload',
      page: '/analyze',
    });
  };
  
  return <button onClick={handleClick}>Upload</button>;
}
```

**Événements prédéfinis** :
- `image_upload_start`
- `image_analysis_complete`
- `report_download`
- `subscription_start`
- `purchase_complete`
- etc.

### Hotjar

**Configuration** :
```env
VITE_HOTJAR_SITE_ID=1234567
VITE_ENABLE_HOTJAR=true
```

**Tracking Hotjar** :
```javascript
import { useAnalytics } from '@/hooks/useAnalytics';

const { trackHotjarEvent } = useAnalytics();

trackHotjarEvent('conversion');
```

### Identification Utilisateur

```javascript
import { analytics } from '@/services/analytics';

// Identifier un utilisateur connecté
analytics.identifyUser(user.id, {
  email: user.email,
  plan: user.subscription_plan,
  created_at: user.created_at,
});
```

### Tracking des Performances

**Hook automatique** :
```javascript
import { usePerformanceTracking } from '@/hooks/useAnalytics';

function App() {
  usePerformanceTracking(); // Track LCP, FID, etc.
  return <div>...</div>;
}
```

**Métriques trackées** :
- Page Load Time
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)

### Tracking des Erreurs

**Hook automatique** :
```javascript
import { useErrorTracking } from '@/hooks/useAnalytics';

function App() {
  useErrorTracking(); // Track erreurs JS globales
  return <div>...</div>;
}
```

**Tracking manuel** :
```javascript
import { analytics } from '@/services/analytics';

try {
  // Code risqué
} catch (error) {
  analytics.trackError(error, false); // false = non fatal
}
```

### Fonctions Utilitaires

```javascript
import { 
  trackImageAnalysis,
  trackDocumentAnalysis,
  trackSubscription 
} from '@/services/analytics';

// Analyser une image
trackImageAnalysis(fileSize, fileType, duration, result);

// Analyser un document
trackDocumentAnalysis(fileSize, fileType, pageCount, duration);

// Nouvelle souscription
trackSubscription('pro', 9.99, 'month');
```

### Consentement Cookies (RGPD)

**Composant** : `<CookieConsent />`

```javascript
import CookieConsent from '@/components/CookieConsent';

function App() {
  return (
    <>
      <Routes>...</Routes>
      <CookieConsent />
    </>
  );
}
```

**Fonctionnalités** :
- ✅ Bannière de consentement conforme RGPD
- ✅ Choix granulaire (Essentiels, Analytics, Marketing)
- ✅ Durée de validité : 13 mois
- ✅ Réinitialisation automatique après expiration
- ✅ Intégration avec GA4 et Hotjar

**Mode Debug** :
```javascript
// En développement, voir les logs dans la console
// Les analytics sont désactivés sauf si VITE_ENABLE_GA4=true
```

---

## 🚀 Installation

### 1. Installer les dépendances

```bash
# À la racine du projet
npm install

# Installer Playwright
npx playwright install
```

### 2. Configurer les variables d'environnement

```bash
# Web
cd packages/web
cp .env.example .env
# Éditer .env avec vos clés

# API
cd ../api
cp .env.example .env
# Éditer .env
```

### 3. Configurer Google Analytics

1. Créer un compte GA4 : https://analytics.google.com
2. Créer une propriété
3. Copier le Measurement ID (G-XXXXXXXXXX)
4. Ajouter dans `packages/web/.env` :
   ```
   VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   VITE_ENABLE_GA4=true
   ```

### 4. Configurer Hotjar

1. Créer un compte : https://www.hotjar.com
2. Créer un site
3. Copier le Site ID
4. Ajouter dans `packages/web/.env` :
   ```
   VITE_HOTJAR_SITE_ID=1234567
   VITE_ENABLE_HOTJAR=true
   ```

---

## ⚙️ Configuration

### CI/CD (GitHub Actions)

```yaml
name: Tests & Build

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      
      # Tests unitaires
      - run: npm install
      - run: npm run test
      
      # Tests E2E
      - run: npx playwright install
      - run: npm run test:e2e
      
      # Couverture
      - run: npm run test:coverage
      
      # Upload coverage à Codecov
      - uses: codecov/codecov-action@v3
```

### Vérification avant déploiement

```bash
# Tests complets
npm run test

# Tests E2E
npm run test:e2e

# Générer SEO
npm run seo:generate

# Build production
npm run build
```

---

## 📝 Utilisation

### Exemple Complet

```javascript
import { useSEO, useStructuredData } from '@/hooks/useSEO';
import { usePageTracking, useAnalytics } from '@/hooks/useAnalytics';

function AnalyzePage() {
  // SEO
  useSEO({
    title: 'Analyser une Image',
    description: 'Détectez si votre image est générée par IA',
    keywords: 'détection IA, analyse image',
  });

  useStructuredData({
    '@type': 'WebPage',
    name: 'Analyse Image',
    description: 'Page d\'analyse',
  });

  // Analytics
  usePageTracking();
  const { trackEvent } = useAnalytics();

  const handleAnalyze = async (file) => {
    trackEvent('image_upload_start', { file_size: file.size });
    
    const startTime = Date.now();
    
    try {
      const result = await analyzeImage(file);
      const duration = Date.now() - startTime;
      
      trackImageAnalysis(file.size, file.type, duration, result);
      trackEvent('image_analysis_complete', {
        is_ai: result.isAI,
        confidence: result.confidence,
      });
    } catch (error) {
      trackError(error);
    }
  };

  return <div>...</div>;
}
```

---

## 🎯 Best Practices

### Tests
- ✅ Tester les comportements, pas l'implémentation
- ✅ Utiliser des data-testid pour les éléments critiques
- ✅ Mocker les appels API externes
- ✅ Maintenir une couverture > 80%

### SEO
- ✅ Titres uniques pour chaque page (< 60 caractères)
- ✅ Descriptions engageantes (< 160 caractères)
- ✅ Images optimisées (WebP, lazy loading)
- ✅ URLs propres et descriptives

### Analytics
- ✅ Respecter le consentement RGPD
- ✅ Anonymiser les données sensibles
- ✅ Tracker les événements métier importants
- ✅ Monitorer les erreurs et performances

---

## 📚 Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Hotjar Documentation](https://help.hotjar.com/)
- [Schema.org](https://schema.org/)
- [Google Search Console](https://search.google.com/search-console)

---

## 🆘 Dépannage

### Les tests ne passent pas
```bash
# Vérifier la config
cat vitest.config.js

# Effacer le cache
rm -rf node_modules/.vitest
npm run test -- --no-cache
```

### GA4 ne track pas
```bash
# Vérifier les variables d'env
echo $VITE_GA4_MEASUREMENT_ID

# Vérifier dans la console navigateur
window.dataLayer

# Mode debug
VITE_DEBUG=true npm run dev
```

### Playwright échoue
```bash
# Réinstaller les navigateurs
npx playwright install --force

# Vérifier les ports
lsof -i :5173
```

---

**Date de création** : Décembre 2024
**Version** : 1.0.0
