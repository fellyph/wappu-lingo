import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/auth';
import { mockGlotPressAPI, mockBackendAPI } from './helpers/api';
import { mockUser } from './fixtures/user';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockBackendAPI(page);
    await page.goto('/');
  });

  test('shows user display name in welcome message', async ({ page }) => {
    await expect(page.locator('.welcome-text')).toContainText(mockUser.display_name);
  });

  test('displays user avatar', async ({ page }) => {
    const avatar = page.locator('.user-avatar img');
    await expect(avatar).toBeVisible();
  });

  test('shows translation stats', async ({ page }) => {
    // Stats grid should be visible
    await expect(page.locator('.stats-grid')).toBeVisible();

    // Should show Translated label
    await expect(page.locator('.stat-item').first()).toContainText('Translated');

    // Should show Approved label
    await expect(page.locator('.stat-item').nth(1)).toContainText('Approved');
  });

  test('shows Start Translating button', async ({ page }) => {
    const startButton = page.locator('.btn-primary');
    await expect(startButton).toBeVisible();
    await expect(startButton).toContainText('Start Translating');
  });

  test('Start button triggers translation session', async ({ page }) => {
    await mockGlotPressAPI(page);

    await page.locator('.btn-primary').click();

    // Wait for loading to complete and translation screen to appear
    // It should either show translation screen or loading/empty state
    await expect(
      page.locator('.header-minimal, .loading-container, .empty-container')
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows bottom navigation bar', async ({ page }) => {
    await expect(page.locator('.bottom-nav')).toBeVisible();

    // Should have 4 navigation buttons
    const navButtons = page.locator('.bottom-nav button');
    await expect(navButtons).toHaveCount(4);
  });

  test('home button is active on dashboard', async ({ page }) => {
    const homeButton = page.locator('.bottom-nav button').first();
    await expect(homeButton).toHaveClass(/active/);
  });

  test('clicking avatar logs out user', async ({ page }) => {
    // Click on avatar to logout
    await page.locator('.user-avatar').click();

    // Should return to login screen
    await expect(page.locator('.login-container')).toBeVisible();
  });

  test('shows Wapuu mascot on dashboard', async ({ page }) => {
    const mascot = page.locator('.mascot-container img');
    await expect(mascot).toBeVisible();
    await expect(mascot).toHaveAttribute('alt', 'Happy Wapuu');
  });

  test('settings button navigates to settings screen', async ({ page }) => {
    // Click settings button (last in nav)
    await page.locator('.bottom-nav button').last().click();

    // Should show settings screen (Settings uses h1)
    await expect(page.locator('h1')).toContainText('Settings');
  });
});
