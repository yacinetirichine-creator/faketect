# 🚀 Guide de Démarrage Rapide - Tests, SEO et Analytics

## Installation en 5 Minutes

### 1️⃣ Installer les dépendances

```bash
cd /Users/yacinetirichine/Downloads/faketect-main\ 2
npm install
npx playwright install
```

### 2️⃣ Configurer les variables d'environnement

```bash
cd packages/web
cp .env.example .env
```

Éditer `.env` :
```env
# Analytics (Optionnel en dev, requis en prod)
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_ENABLE_GA4=false                    # false en dev
VITE_HOTJAR_SITE_ID=1234567
VITE_ENABLE_HOTJAR=false                 # false en dev

# API
VITE_API_URL=http://localhost:3001

# Supabase
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
```

### 3️⃣ Tester que tout fonctionne

```bash
# Tests unitaires
npm run test:web

# Tests E2E
npm run test:e2e

# Générer SEO
npm run seo:generate
```

### 4️⃣ Lancer en développement

```bash
npm run dev
```

Ouvrir http://localhost:5173

---

## 🧪 Tests

### Tests Rapides

```bash
# Un seul test
npm run test:web -- Button.test.jsx

# Mode watch (auto-refresh)
npm run test:web -- --watch

# Interface UI
npm run test:ui
```

### Tests E2E Spécifiques

```bash
# Un seul fichier
npm run test:e2e -- upload.spec.js

# Mode debug (pause sur échec)
npm run test:e2e -- --debug

# Voir le navigateur
npm run test:e2e -- --headed
```

---

## 🔍 SEO - Utilisation

### Dans un composant React

```javascript
import { useSEO, useStructuredData } from '@/hooks/useSEO';

function MaPage() {
  // SEO basique
  useSEO({
    title: 'Titre de ma page',
    description: 'Description courte',
    keywords: 'mot1, mot2',
  });

  // Données structurées (optionnel)
  useStructuredData({
    '@type': 'WebPage',
    name: 'Ma Page',
  });

  return <div>Contenu</div>;
}
```

### Régénérer sitemap/robots

```bash
npm run seo:generate
```

Fichiers générés :
- `packages/web/public/sitemap.xml`
- `packages/web/public/robots.txt`

---

## 📊 Analytics - Utilisation

### Tracking de page (automatique)

```javascript
import { usePageTracking } from '@/hooks/useAnalytics';

function App() {
  usePageTracking();  // C'est tout !
  return <Routes>...</Routes>;
}
```

### Tracking d'événements

```javascript
import { useAnalytics } from '@/hooks/useAnalytics';

function MonComposant() {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent('button_click', {
      button_name: 'upload',
      page: window.location.pathname,
    });
  };

  return <button onClick={handleClick}>Upload</button>;
}
```

### Tracking d'analyse d'image

```javascript
import { trackImageAnalysis } from '@/services/analytics';

const startTime = Date.now();
const result = await analyzeImage(file);
const duration = Date.now() - startTime;

trackImageAnalysis(
  file.size,
  file.type,
  duration,
  result
);
```

---

## 🍪 Consentement Cookies

Ajouter dans `App.jsx` :

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

---

## 🔧 Configuration Production

### 1. Obtenir les clés Analytics

#### Google Analytics 4
1. Aller sur https://analytics.google.com
2. Créer une propriété
3. Copier le Measurement ID (format : `G-XXXXXXXXXX`)

#### Hotjar
1. Aller sur https://www.hotjar.com
2. Créer un site
3. Copier le Site ID (format : `1234567`)

### 2. Configurer les variables d'environnement

Ajouter dans `.env.production` ou votre plateforme de déploiement :

```env
VITE_GA4_MEASUREMENT_ID=G-VOTRE-ID-REEL
VITE_ENABLE_GA4=true
VITE_HOTJAR_SITE_ID=VOTRE-ID-REEL
VITE_ENABLE_HOTJAR=true
```

### 3. Build et déploiement

```bash
# Générer SEO
npm run seo:generate

# Build
npm run build

# Tester le build
npm run preview
```

---

## 📝 Écrire un Nouveau Test

### Test Unitaire (Vitest)

Créer `packages/web/src/tests/components/MonComposant.test.jsx` :

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MonComposant from '@/components/MonComposant';

describe('MonComposant', () => {
  it('affiche le texte', () => {
    render(<MonComposant text="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('appelle onClick', () => {
    const onClick = vi.fn();
    render(<MonComposant onClick={onClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

Lancer :
```bash
npm run test:web -- MonComposant.test.jsx
```

### Test E2E (Playwright)

Créer `e2e/mon-feature.spec.js` :

```javascript
import { test, expect } from '@playwright/test';

test('ma feature fonctionne', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="mon-bouton"]');
  await expect(page.locator('[data-testid="resultat"]')).toBeVisible();
});
```

Lancer :
```bash
npm run test:e2e -- mon-feature.spec.js
```

---

## 🐛 Dépannage Rapide

### Les tests ne passent pas

```bash
# Nettoyer le cache
rm -rf node_modules/.vitest
npm run test -- --no-cache
```

### GA4 ne track pas

```bash
# Vérifier les variables
echo $VITE_GA4_MEASUREMENT_ID

# Vérifier dans la console du navigateur
window.dataLayer
```

### Playwright échoue

```bash
# Réinstaller les navigateurs
npx playwright install --force

# Vérifier que le serveur tourne
curl http://localhost:5173
```

---

## 📚 Documentation Complète

Pour plus de détails, consulter :
- **`docs/TESTING-SEO-ANALYTICS.md`** - Guide complet
- **`RECAP-TESTS-SEO-ANALYTICS.md`** - Récapitulatif
- **`e2e/README.md`** - Guide Playwright

---

## ✅ Checklist Avant Déploiement

- [ ] Tous les tests passent : `npm run test`
- [ ] Tests E2E passent : `npm run test:e2e`
- [ ] SEO généré : `npm run seo:generate`
- [ ] Variables d'env production configurées
- [ ] GA4 et Hotjar configurés avec vrais IDs
- [ ] Build réussit : `npm run build`
- [ ] Preview fonctionne : `npm run preview`

---

## 🆘 Besoin d'aide ?

1. Vérifier la documentation : `docs/TESTING-SEO-ANALYTICS.md`
2. Regarder les exemples de tests dans `packages/web/src/tests/`
3. Consulter les tests E2E dans `e2e/`
4. Activer le mode debug : `VITE_DEBUG=true npm run dev`

---

**Bon développement ! 🚀**
