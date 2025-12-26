import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Image Upload and Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/FakeTect/);
    await expect(page.locator('h1')).toContainText(/FakeTect|Détecteur/i);
  });

  test('should upload and analyze image', async ({ page }) => {
    // Attendre que la zone de drop soit visible
    const dropzone = page.locator('[data-testid="dropzone"]').first();
    await expect(dropzone).toBeVisible();

    // Simuler l'upload d'une image
    const filePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    await page.setInputFiles('input[type="file"]', filePath);

    // Attendre le début de l'analyse
    await expect(page.locator('text=/Analyse en cours/i')).toBeVisible({
      timeout: 10000,
    });

    // Attendre les résultats (avec timeout généreux)
    await expect(page.locator('[data-testid="results"]')).toBeVisible({
      timeout: 30000,
    });

    // Vérifier que le score est affiché
    await expect(page.locator('[data-testid="ai-score"]')).toBeVisible();
  });

  test('should handle invalid file type', async ({ page }) => {
    const dropzone = page.locator('[data-testid="dropzone"]').first();
    await expect(dropzone).toBeVisible();

    // Essayer d'uploader un fichier non-image
    const filePath = path.join(__dirname, 'fixtures', 'test-document.txt');
    await page.setInputFiles('input[type="file"]', filePath);

    // Vérifier le message d'erreur
    await expect(page.locator('text=/format non supporté/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should navigate to history page', async ({ page }) => {
    await page.click('a[href*="history"]');
    await expect(page).toHaveURL(/history/);
    await expect(page.locator('h1, h2')).toContainText(/Historique/i);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const dropzone = page.locator('[data-testid="dropzone"]').first();
    await expect(dropzone).toBeVisible();
    
    // Vérifier que le menu mobile est accessible
    const menuButton = page.locator('button[aria-label*="menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.locator('nav')).toBeVisible();
    }
  });
});

test.describe('Authentication Flow', () => {
  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login|auth/);
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
