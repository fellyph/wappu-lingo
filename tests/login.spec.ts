import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser, clearAuthentication, mockAuthError } from './helpers/auth';
import { mockBackendAPI } from './helpers/api';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication
    await clearAuthentication(page);
  });

  test('displays login screen when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should show login container
    await expect(page.locator('.login-container')).toBeVisible();

    // Should display Wappu Lingo title
    await expect(page.locator('h1')).toContainText('Wappu Lingo');

    // Should show login description
    await expect(page.locator('.login-card p')).toContainText('Gamify your WordPress translations');
  });

  test('shows Wapuu mascot on login screen', async ({ page }) => {
    await page.goto('/');

    // Should display Wapuu image
    const mascot = page.locator('.login-mascot img');
    await expect(mascot).toBeVisible();
    await expect(mascot).toHaveAttribute('alt', 'Wapuu');
  });

  test('shows login button with Gravatar text', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.locator('.btn-login');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toContainText('Login with Gravatar');
  });

  test('login button redirects to OAuth URL', async ({ page }) => {
    await page.goto('/');

    // Click login and wait for navigation to OAuth
    await Promise.all([
      page.waitForURL('**/public-api.wordpress.com/oauth2/authorize**', { timeout: 10000 }),
      page.locator('.btn-login').click(),
    ]);

    // Verify we're on the OAuth page
    const currentUrl = page.url();
    expect(currentUrl).toContain('public-api.wordpress.com/oauth2/authorize');
  });

  test('shows dashboard after successful authentication', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockBackendAPI(page);
    await page.goto('/');

    // Should show dashboard, not login
    await expect(page.locator('.login-container')).not.toBeVisible();
    await expect(page.locator('h1')).toContainText('WordPress Translator');
  });

  test('clears invalid token and shows login', async ({ page }) => {
    await mockAuthError(page);
    await page.goto('/');

    // Wait for auth check to complete
    await page.waitForTimeout(500);

    // Should show login screen after invalid token
    await expect(page.locator('.login-container')).toBeVisible();
  });

  test('shows powered by WordPress.com footer', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.login-footer')).toContainText('Powered by WordPress.com OAuth');
  });
});
