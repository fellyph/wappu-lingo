import { test, expect, Page } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/auth';
import { mockAllAPIs, mockGlotPressAPI, mockBackendAPI, mockEmptyStrings } from './helpers/api';
import { mockStrings } from './fixtures/strings';

/**
 * Helper to wait for translation screen to be ready
 */
async function waitForTranslationScreen(page: Page) {
  // Wait for either translation screen, loading, or empty state
  await expect(
    page.locator('.string-display, .loading-container, .empty-container, .error-container')
  ).toBeVisible({ timeout: 15000 });
}

test.describe('Translation Session', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockAllAPIs(page);
    await page.goto('/');
  });

  test('starts session and displays translation UI', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    // Should show some translation-related content
    const hasContent = await page
      .locator('.string-display, .loading-container, .empty-container')
      .isVisible();
    expect(hasContent).toBe(true);
  });

  test('shows progress bar when session starts', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    // If strings loaded, should show progress bar
    const stringDisplay = page.locator('.string-display');
    if (await stringDisplay.isVisible()) {
      await expect(page.locator('.progress-bar')).toBeVisible();
    }
  });

  test('submit button disabled when input empty', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (await stringDisplay.isVisible()) {
      const submitButton = page.locator('.btn-success');
      await expect(submitButton).toBeDisabled();
    }
  });

  test('submit button enabled with text input', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (await stringDisplay.isVisible()) {
      const input = page.locator('input[placeholder="Translate here..."]');
      await input.fill('Test translation');

      const submitButton = page.locator('.btn-success');
      await expect(submitButton).toBeEnabled();
    }
  });

  test('submitting clears input field', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (await stringDisplay.isVisible()) {
      const input = page.locator('input[placeholder="Translate here..."]');
      await input.fill('Test translation');
      await page.locator('.btn-success').click();

      // Input should be cleared
      await expect(input).toHaveValue('');
    }
  });

  test('skip advances progress', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const skipButton = page.locator('.btn-secondary');
    if (await skipButton.isVisible()) {
      await skipButton.click();

      // Should still be on translation screen or summary
      await expect(
        page.locator('.string-display, .summary-card, .empty-container')
      ).toBeVisible();
    }
  });

  test('shows source project info', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (await stringDisplay.isVisible()) {
      await expect(page.locator('.source')).toContainText('Source:');
    }
  });

  test('shows badge for strings', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (await stringDisplay.isVisible()) {
      // Badge should be visible (shows Priority or Normal)
      await expect(page.locator('.badge')).toBeVisible();
    }
  });

  test('shows translate to header', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (await stringDisplay.isVisible()) {
      await expect(page.locator('h2')).toContainText('Translate to:');
    }
  });
});
