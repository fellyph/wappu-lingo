import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/auth';
import { mockBackendAPI } from './helpers/api';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockBackendAPI(page);
    await page.goto('/');

    // Navigate to settings
    await page.locator('.bottom-nav button').last().click();
  });

  test('displays settings screen header', async ({ page }) => {
    // Settings screen header
    await expect(page.locator('.header-navy h1')).toContainText('Settings');
  });

  test('shows locale selection dropdown', async ({ page }) => {
    const localeSection = page.locator('.settings-section').first();
    await expect(localeSection).toContainText('Translation Language');

    const localeSelect = localeSection.locator('select');
    await expect(localeSelect).toBeVisible();
  });

  test('shows project selection dropdown', async ({ page }) => {
    const projectSection = page.locator('.settings-section').nth(1);
    await expect(projectSection).toContainText('Project');

    const projectSelect = projectSection.locator('select');
    await expect(projectSelect).toBeVisible();
  });

  test('shows strings per session dropdown', async ({ page }) => {
    const stringsSection = page.locator('.settings-section').nth(2);
    await expect(stringsSection).toContainText('Strings per Session');

    const stringsSelect = stringsSection.locator('select');
    await expect(stringsSelect).toBeVisible();
  });

  test('can change locale selection', async ({ page }) => {
    const localeSelect = page.locator('.settings-section').first().locator('select');

    // Get available options
    const options = await localeSelect.locator('option').all();
    expect(options.length).toBeGreaterThan(0);

    // Select a different locale
    if (options.length > 1) {
      const secondOption = await options[1].getAttribute('value');
      if (secondOption) {
        await localeSelect.selectOption(secondOption);
        await expect(localeSelect).toHaveValue(secondOption);
      }
    }
  });

  test('can change project selection', async ({ page }) => {
    const projectSelect = page.locator('.settings-section').nth(1).locator('select');

    // Get available options
    const options = await projectSelect.locator('option').all();
    expect(options.length).toBeGreaterThan(0);

    // Select a different project
    if (options.length > 1) {
      const secondOption = await options[1].getAttribute('value');
      if (secondOption) {
        await projectSelect.selectOption(secondOption);
        await expect(projectSelect).toHaveValue(secondOption);
      }
    }
  });

  test('can change strings per session', async ({ page }) => {
    const stringsSelect = page.locator('.settings-section').nth(2).locator('select');

    // Select 15 strings
    await stringsSelect.selectOption('15');
    await expect(stringsSelect).toHaveValue('15');

    // Select 20 strings
    await stringsSelect.selectOption('20');
    await expect(stringsSelect).toHaveValue('20');
  });

  test('settings persist after navigation', async ({ page }) => {
    // Change strings per session
    const stringsSelect = page.locator('.settings-section').nth(2).locator('select');
    await stringsSelect.selectOption('25');

    // Navigate to dashboard
    await page.locator('.bottom-nav button').first().click();

    // Navigate back to settings
    await page.locator('.bottom-nav button').last().click();

    // Settings should be preserved
    const stringsSelectAfter = page.locator('.settings-section').nth(2).locator('select');
    await expect(stringsSelectAfter).toHaveValue('25');
  });

  test('settings persist after page reload', async ({ page }) => {
    // Change strings per session
    const stringsSelect = page.locator('.settings-section').nth(2).locator('select');
    await stringsSelect.selectOption('30');

    // Reload the page
    await page.reload();

    // Navigate to settings
    await page.locator('.bottom-nav button').last().click();

    // Settings should be preserved from localStorage
    const stringsSelectAfter = page.locator('.settings-section').nth(2).locator('select');
    await expect(stringsSelectAfter).toHaveValue('30');
  });

  test('settings button is active on settings screen', async ({ page }) => {
    const settingsButton = page.locator('.bottom-nav button').last();
    await expect(settingsButton).toHaveClass(/active/);
  });

  test('strings per session has expected options', async ({ page }) => {
    const stringsSelect = page.locator('.settings-section').nth(2).locator('select');
    const options = await stringsSelect.locator('option').allTextContents();

    expect(options).toContain('5 strings');
    expect(options).toContain('10 strings');
    expect(options).toContain('15 strings');
    expect(options).toContain('20 strings');
    expect(options).toContain('25 strings');
    expect(options).toContain('30 strings');
  });
});
