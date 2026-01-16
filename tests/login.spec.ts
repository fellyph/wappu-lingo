import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser, clearAuthentication, mockAuthError } from './helpers/auth';
import { mockBackendAPI, mockConfigAPI } from './helpers/api';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication
    await clearAuthentication(page);
    // Mock config API so login button gets enabled
    await mockConfigAPI(page);
  });

  test('displays login screen when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should show login container
    await expect(page.locator('.login-container')).toBeVisible();

    // Should display app title
    await expect(page.locator('.login-card h1')).toBeVisible();

    // Should show login description
    await expect(page.locator('.login-card p')).toBeVisible();
  });

  test('shows Wapuu mascot on login screen', async ({ page }) => {
    await page.goto('/');

    // Should display Wapuu image
    const mascot = page.locator('.login-mascot img');
    await expect(mascot).toBeVisible();
    // Alt text may be translated
    await expect(mascot).toHaveAttribute('alt', /.+/);
  });

  test('shows login button', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.locator('.btn-login');
    await expect(loginButton).toBeVisible();
    // Button text may be translated
    await expect(loginButton).toBeEnabled();
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
    await expect(page.locator('.header-navy')).toBeVisible();
  });

  test('clears invalid token and shows login', async ({ page }) => {
    await mockAuthError(page);
    await page.goto('/');

    // Wait for auth check to complete
    await page.waitForTimeout(500);

    // Should show login screen after invalid token
    await expect(page.locator('.login-container')).toBeVisible();
  });

  test('shows footer text', async ({ page }) => {
    await page.goto('/');

    // Footer text may be translated
    await expect(page.locator('.login-footer')).toBeVisible();
  });
});
