import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show login form when clicking login button', async ({ page }) => {
    // Cliquer sur le bouton de connexion dans le header
    await page.click('a[href*="login"], button:has-text("Connexion")');
    
    // Vérifier qu'on est sur la page de login
    await expect(page).toHaveURL(/login|auth/);
    
    // Vérifier la présence du formulaire
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login');
    
    // Remplir avec un email invalide
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    
    // Soumettre le formulaire
    await page.click('button[type="submit"]');
    
    // Vérifier le message d'erreur
    await expect(page.locator('text=/email invalide/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/login');
    
    // Remplir le formulaire avec des credentials valides
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'ValidPassword123!');
    
    // Soumettre
    await page.click('button[type="submit"]');
    
    // Attendre la redirection vers le dashboard
    await expect(page).toHaveURL(/dashboard|home/, { timeout: 10000 });
    
    // Vérifier qu'on voit le contenu du dashboard
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('should be able to logout', async ({ page }) => {
    // D'abord se connecter
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard|home/);
    
    // Ensuite se déconnecter
    await page.click('button:has-text("Déconnexion"), a:has-text("Déconnexion")');
    
    // Vérifier qu'on est redirigé vers la page d'accueil
    await expect(page).toHaveURL(/^\/$|\/login/);
  });

  test('should show signup form', async ({ page }) => {
    await page.goto('/signup');
    
    // Vérifier la présence des champs
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    
    // Vérifier les liens
    await expect(page.locator('a[href*="login"]')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/signup');
    
    // Tester un mot de passe faible
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', '123');
    
    // Vérifier l'indicateur de force
    await expect(page.locator('text=/faible|weak/i')).toBeVisible();
    
    // Tester un mot de passe fort
    await page.fill('input[type="password"]', 'StrongP@ssw0rd123!');
    await expect(page.locator('text=/fort|strong/i')).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login|auth/);
  });

  test('should redirect to login when accessing history without auth', async ({ page }) => {
    await page.goto('/history');
    await expect(page).toHaveURL(/login|auth/);
  });

  test('should allow access to public pages without auth', async ({ page }) => {
    // Page d'accueil
    await page.goto('/');
    await expect(page).toHaveURL('/');
    
    // Tarifs
    await page.goto('/pricing');
    await expect(page).toHaveURL('/pricing');
    
    // Pages légales
    await page.goto('/legal/cgu');
    await expect(page).toHaveURL('/legal/cgu');
  });
});
