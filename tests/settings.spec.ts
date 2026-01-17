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
    // Settings screen header (text may be translated)
    await expect(page.locator('.header-navy h1')).toBeVisible();
  });

  test('shows UI language selection dropdown', async ({ page }) => {
    const uiLangSection = page.locator('.settings-section').first();
    await expect(uiLangSection).toBeVisible();

    const uiLangSelect = uiLangSection.locator('select');
    await expect(uiLangSelect).toBeVisible();
  });

  test('shows locale selection dropdown', async ({ page }) => {
    // Second section is translation language (after UI language)
    const localeSection = page.locator('.settings-section').nth(1);
    await expect(localeSection).toBeVisible();

    const localeSelect = localeSection.locator('select');
    await expect(localeSelect).toBeVisible();
  });

  test('shows project selection dropdown', async ({ page }) => {
    const projectSection = page.locator('.settings-section').nth(2);
    await expect(projectSection).toBeVisible();

    const projectSelect = projectSection.locator('select');
    await expect(projectSelect).toBeVisible();
  });

  test('shows strings per session dropdown', async ({ page }) => {
    const stringsSection = page.locator('.settings-section').nth(3);
    await expect(stringsSection).toBeVisible();

    const stringsSelect = stringsSection.locator('select');
    await expect(stringsSelect).toBeVisible();
  });

  test('can change locale selection', async ({ page }) => {
    // Translation language is second section (index 1)
    const localeSelect = page.locator('.settings-section').nth(1).locator('select');

    // Wait for options to be populated (options are hidden until dropdown opens)
    await expect(localeSelect.locator('option')).not.toHaveCount(0);

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
    // Project is third section (index 2)
    const projectSelect = page.locator('.settings-section').nth(2).locator('select');

    // Wait for options to be populated
    await expect(projectSelect.locator('option')).not.toHaveCount(0);

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
    // Strings per session is fourth section (index 3)
    const stringsSelect = page.locator('.settings-section').nth(3).locator('select');

    // Wait for options to be populated
    await expect(stringsSelect.locator('option')).not.toHaveCount(0);

    // Get current value and available options
    const options = await stringsSelect.locator('option').all();
    expect(options.length).toBe(6);

    // Select second option
    const secondValue = await options[1].getAttribute('value');
    if (secondValue) {
      await stringsSelect.selectOption(secondValue);
      await expect(stringsSelect).toHaveValue(secondValue);
    }
  });

  test('settings persist after navigation', async ({ page }) => {
    // Strings per session is fourth section (index 3)
    const stringsSelect = page.locator('.settings-section').nth(3).locator('select');
    // Wait for options to be populated
    await expect(stringsSelect.locator('option')).not.toHaveCount(0);
    // Get available options and select a different one
    const options = await stringsSelect.locator('option').all();
    const thirdValue = await options[2].getAttribute('value');
    if (!thirdValue) return;
    await stringsSelect.selectOption(thirdValue);

    // Navigate to dashboard
    await page.locator('.bottom-nav button').first().click();

    // Navigate back to settings
    await page.locator('.bottom-nav button').last().click();

    // Settings should be preserved (index 3 for strings per session)
    const stringsSelectAfter = page.locator('.settings-section').nth(3).locator('select');
    await expect(stringsSelectAfter).toHaveValue(thirdValue);
  });

  test('settings persist after page reload', async ({ page }) => {
    // Strings per session is fourth section (index 3)
    const stringsSelect = page.locator('.settings-section').nth(3).locator('select');
    // Wait for options to be populated
    await expect(stringsSelect.locator('option')).not.toHaveCount(0);
    // Get available options and select the last one
    const options = await stringsSelect.locator('option').all();
    const lastValue = await options[options.length - 1].getAttribute('value');
    if (!lastValue) return;
    await stringsSelect.selectOption(lastValue);

    // Reload the page
    await page.reload();

    // Navigate to settings
    await page.locator('.bottom-nav button').last().click();

    // Settings should be preserved from localStorage
    const stringsSelectAfter = page.locator('.settings-section').nth(3).locator('select');
    await expect(stringsSelectAfter).toHaveValue(lastValue);
  });

  test('settings button is active on settings screen', async ({ page }) => {
    const settingsButton = page.locator('.bottom-nav button').last();
    await expect(settingsButton).toHaveClass(/active/);
  });

  test('strings per session has expected options', async ({ page }) => {
    // Strings per session is fourth section (index 3)
    const stringsSelect = page.locator('.settings-section').nth(3).locator('select');
    // Wait for options to be populated
    await expect(stringsSelect.locator('option')).not.toHaveCount(0);
    const options = await stringsSelect.locator('option').all();

    // Should have 6 options (5, 10, 15, 20, 25, 30) - text may be translated
    expect(options.length).toBe(6);
  });
});
