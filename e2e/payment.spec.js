import { test, expect } from '@playwright/test';

test.describe('Pricing and Payment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('should display all pricing plans', async ({ page }) => {
    // Vérifier la présence des 3 plans
    await expect(page.locator('text=/Gratuit|Free/i')).toBeVisible();
    await expect(page.locator('text=/Pro/i')).toBeVisible();
    await expect(page.locator('text=/Enterprise/i')).toBeVisible();
    
    // Vérifier les prix
    await expect(page.locator('text=/0.*€/i')).toBeVisible();
    await expect(page.locator('text=/9.99.*€/i')).toBeVisible();
  });

  test('should show features for each plan', async ({ page }) => {
    // Free plan features
    const freePlan = page.locator('[data-testid="plan-free"]');
    await expect(freePlan.locator('text=/5 analyses\/mois/i')).toBeVisible();
    
    // Pro plan features
    const proPlan = page.locator('[data-testid="plan-pro"]');
    await expect(proPlan.locator('text=/illimité/i')).toBeVisible();
    await expect(proPlan.locator('text=/support prioritaire/i')).toBeVisible();
  });

  test('should redirect to login when clicking subscribe without auth', async ({ page }) => {
    // Cliquer sur le bouton subscribe du plan Pro
    const proButton = page.locator('[data-testid="plan-pro"] button:has-text("Souscrire")');
    await proButton.click();
    
    // Devrait être redirigé vers login
    await expect(page).toHaveURL(/login|auth/);
  });

  test('should show billing toggle monthly/yearly', async ({ page }) => {
    // Vérifier la présence du toggle
    const toggle = page.locator('[data-testid="billing-toggle"]');
    await expect(toggle).toBeVisible();
    
    // Cliquer pour passer en annuel
    await toggle.click();
    
    // Vérifier que les prix changent (réduction de 20%)
    await expect(page.locator('text=/7.99.*€|8.*€/i')).toBeVisible();
    await expect(page.locator('text=/économisez|save/i')).toBeVisible();
  });
});

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter d'abord
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard|home/);
  });

  test('should navigate to checkout when clicking subscribe', async ({ page }) => {
    await page.goto('/pricing');
    
    // Cliquer sur subscribe pour le plan Pro
    await page.click('[data-testid="plan-pro"] button:has-text("Souscrire")');
    
    // Vérifier qu'on est sur la page de checkout
    await expect(page).toHaveURL(/checkout|payment/);
    
    // Vérifier les informations du plan
    await expect(page.locator('text=/Plan Pro/i')).toBeVisible();
    await expect(page.locator('text=/9.99.*€/i')).toBeVisible();
  });

  test('should show Stripe payment form', async ({ page }) => {
    await page.goto('/checkout?plan=pro');
    
    // Attendre le chargement de Stripe
    await page.waitForTimeout(2000);
    
    // Vérifier la présence de l'iframe Stripe
    const stripeFrame = page.frameLocator('iframe[name*="stripe"]').first();
    await expect(stripeFrame.locator('input[name="cardnumber"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should validate card information', async ({ page }) => {
    await page.goto('/checkout?plan=pro');
    
    // Attendre Stripe
    await page.waitForTimeout(2000);
    
    const stripeFrame = page.frameLocator('iframe[name*="stripe"]').first();
    
    // Remplir avec une carte de test invalide
    await stripeFrame.locator('input[name="cardnumber"]').fill('4000000000000002');
    await stripeFrame.locator('input[name="exp-date"]').fill('12/25');
    await stripeFrame.locator('input[name="cvc"]').fill('123');
    
    // Soumettre
    await page.click('button[type="submit"]:has-text("Payer")');
    
    // Vérifier l'erreur
    await expect(page.locator('text=/carte.*déclinée/i')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should show success message after successful payment', async ({ page }) => {
    await page.goto('/checkout?plan=pro');
    
    // Attendre Stripe
    await page.waitForTimeout(2000);
    
    const stripeFrame = page.frameLocator('iframe[name*="stripe"]').first();
    
    // Remplir avec une carte de test valide
    await stripeFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
    await stripeFrame.locator('input[name="exp-date"]').fill('12/25');
    await stripeFrame.locator('input[name="cvc"]').fill('123');
    
    // Soumettre
    await page.click('button[type="submit"]:has-text("Payer")');
    
    // Vérifier le succès
    await expect(page.locator('text=/paiement réussi|success/i')).toBeVisible({
      timeout: 15000,
    });
    
    // Vérifier la redirection vers le dashboard
    await expect(page).toHaveURL(/dashboard|success/);
  });
});

test.describe('Subscription Management', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter avec un compte ayant un abonnement
    await page.goto('/login');
    await page.fill('input[type="email"]', 'pro-user@example.com');
    await page.fill('input[type="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard|home/);
  });

  test('should display current subscription in dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Vérifier les informations d'abonnement
    await expect(page.locator('text=/Plan Pro/i')).toBeVisible();
    await expect(page.locator('text=/Actif|Active/i')).toBeVisible();
  });

  test('should allow upgrading to enterprise plan', async ({ page }) => {
    await page.goto('/pricing');
    
    // Le plan Pro devrait montrer "Plan actuel"
    await expect(page.locator('[data-testid="plan-pro"] text=/actuel|current/i')).toBeVisible();
    
    // Cliquer pour upgrader vers Enterprise
    await page.click('[data-testid="plan-enterprise"] button:has-text("Upgrader")');
    
    // Vérifier la confirmation
    await expect(page.locator('text=/upgrade|amélioration/i')).toBeVisible();
  });

  test('should allow canceling subscription', async ({ page }) => {
    await page.goto('/dashboard/subscription');
    
    // Cliquer sur annuler
    await page.click('button:has-text("Annuler l\'abonnement")');
    
    // Confirmer dans la modale
    await expect(page.locator('[data-testid="cancel-modal"]')).toBeVisible();
    await page.click('[data-testid="cancel-modal"] button:has-text("Confirmer")');
    
    // Vérifier le message de succès
    await expect(page.locator('text=/annulé avec succès/i')).toBeVisible();
  });

  test('should display invoice history', async ({ page }) => {
    await page.goto('/dashboard/billing');
    
    // Vérifier la présence de l'historique
    await expect(page.locator('[data-testid="invoice-history"]')).toBeVisible();
    
    // Vérifier qu'il y a au moins une facture
    await expect(page.locator('[data-testid="invoice-item"]').first()).toBeVisible();
    
    // Vérifier les boutons de téléchargement
    await expect(page.locator('button:has-text("Télécharger")').first()).toBeVisible();
  });
});
