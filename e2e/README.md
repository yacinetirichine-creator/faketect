# Tests E2E - Playwright

## Structure des Tests

```
e2e/
├── fixtures/           # Fichiers de test (images, documents)
├── upload.spec.js      # Tests upload et analyse
├── auth.spec.js        # Tests authentification
└── payment.spec.js     # Tests paiement
```

## Lancer les Tests

```bash
# Tous les tests
npm run test:e2e

# Mode UI interactif
npm run test:e2e:ui

# Tests spécifiques
npm run test:e2e -- upload.spec.js

# Sur un navigateur spécifique
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit

# Mode debug
npm run test:e2e -- --debug

# Headed mode (voir le navigateur)
npm run test:e2e -- --headed
```

## Rapports

Les rapports sont générés automatiquement dans `playwright-report/`.

```bash
# Voir le rapport
npx playwright show-report
```

## Bonnes Pratiques

### 1. Utiliser des data-testid
```jsx
<button data-testid="upload-button">Upload</button>
```

```javascript
await page.click('[data-testid="upload-button"]');
```

### 2. Attendre les éléments
```javascript
await expect(page.locator('[data-testid="results"]')).toBeVisible({
  timeout: 30000
});
```

### 3. Nettoyer après les tests
```javascript
test.afterEach(async ({ page }) => {
  // Nettoyage
  await page.close();
});
```

## Ajouter de Nouveaux Tests

1. Créer un fichier `.spec.js` dans `e2e/`
2. Importer Playwright test
3. Écrire vos scénarios
4. Lancer avec `npm run test:e2e -- votre-fichier.spec.js`
