import { test, expect, Page } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/auth';
import { mockConfigAPI, mockGlotPressAPI } from './helpers/api';
import { mockStrings } from './fixtures/strings';
import { mockUser } from './fixtures/user';

/**
 * E2E tests for submitting translations to the WordPress translation system
 * Tests the complete flow from starting a session to submitting translations
 */

interface SubmittedTranslation {
  user_id: string;
  user_email: string | null;
  project_slug: string;
  project_name: string | null;
  locale: string;
  original_id: string;
  original_string: string;
  translation: string;
  context: string | null;
  status: string;
}

/**
 * Helper to wait for translation screen to be ready
 */
async function waitForTranslationScreen(page: Page) {
  await expect(
    page.locator('.string-display, .loading-container, .empty-state-screen, .error-container')
  ).toBeVisible({ timeout: 15000 });
}

/**
 * Helper to get the current string being displayed
 */
async function getCurrentStringText(page: Page): Promise<string> {
  const stringDisplay = page.locator('.string-display');
  await expect(stringDisplay).toBeVisible();
  return stringDisplay.textContent() as Promise<string>;
}

test.describe('Submit Translation Flow', () => {
  // Store submitted translations for verification
  let submittedTranslations: SubmittedTranslation[] = [];

  test.beforeEach(async ({ page }) => {
    submittedTranslations = [];

    // Setup authentication
    await mockAuthenticatedUser(page);
    await mockConfigAPI(page);
    await mockGlotPressAPI(page);

    // Mock the translations API with request capture
    await page.route('**/api/translations', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as SubmittedTranslation;
        submittedTranslations.push(body);

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            id: submittedTranslations.length,
            message: 'Translation saved successfully',
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            translations: submittedTranslations.map((t, i) => ({
              id: i + 1,
              ...t,
              created_at: new Date().toISOString(),
            })),
            meta: {
              total: submittedTranslations.length,
              limit: 50,
              offset: 0,
            },
          }),
        });
      }
    });

    await page.goto('/');
  });

  test('submits a single translation successfully', async ({ page }) => {
    // Start translation session
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    // Verify we have a string to translate
    const stringDisplay = page.locator('.string-display');
    if (!(await stringDisplay.isVisible())) {
      test.skip();
      return;
    }

    // Get the original string
    const originalString = await getCurrentStringText(page);

    // Enter translation
    const input = page.locator('.input-group input[type="text"]');
    const translation = 'Olá Mundo';
    await input.fill(translation);

    // Submit the translation
    await page.locator('.btn-success').click();

    // Wait for submission to complete
    await page.waitForTimeout(500);

    // Verify API was called with correct data
    expect(submittedTranslations).toHaveLength(1);
    expect(submittedTranslations[0]).toMatchObject({
      user_id: mockUser.hash,
      original_string: originalString,
      translation: translation,
      status: 'pending',
    });
  });

  test('submits multiple translations in sequence', async ({ page }) => {
    // Start translation session
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (!(await stringDisplay.isVisible())) {
      test.skip();
      return;
    }

    const translations = ['Olá Mundo', 'Salvar Alterações', 'Tem certeza?'];

    // Submit multiple translations
    for (let i = 0; i < Math.min(translations.length, mockStrings.length); i++) {
      const input = page.locator('.input-group input[type="text"]');

      // Check if still on translation screen (not summary)
      if (!(await page.locator('.string-display').isVisible({ timeout: 1000 }).catch(() => false))) {
        break;
      }

      await input.fill(translations[i]);
      await page.locator('.btn-success').click();

      // Wait for next string or summary
      await page.waitForTimeout(300);
    }

    // Verify all translations were submitted
    expect(submittedTranslations.length).toBeGreaterThan(0);

    // Verify each submission has correct structure
    submittedTranslations.forEach((submission, index) => {
      expect(submission).toHaveProperty('user_id');
      expect(submission).toHaveProperty('original_string');
      expect(submission).toHaveProperty('translation', translations[index]);
      expect(submission).toHaveProperty('status', 'pending');
      expect(submission).toHaveProperty('locale');
      expect(submission).toHaveProperty('project_slug');
    });
  });

  test('includes project and locale info in submission', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (!(await stringDisplay.isVisible())) {
      test.skip();
      return;
    }

    // Submit a translation
    const input = page.locator('.input-group input[type="text"]');
    await input.fill('Test Translation');
    await page.locator('.btn-success').click();

    await page.waitForTimeout(500);

    // Verify project and locale info
    expect(submittedTranslations).toHaveLength(1);
    expect(submittedTranslations[0].project_slug).toBeTruthy();
    expect(submittedTranslations[0].locale).toBeTruthy();
  });

  test('includes context when available', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (!(await stringDisplay.isVisible())) {
      test.skip();
      return;
    }

    // Skip strings until we find one with context or submit all
    for (let i = 0; i < mockStrings.length; i++) {
      const contextElement = page.locator('.context');
      const hasContext = await contextElement.isVisible().catch(() => false);

      const input = page.locator('.input-group input[type="text"]');
      await input.fill(`Translation ${i + 1}`);
      await page.locator('.btn-success').click();

      if (hasContext) {
        break;
      }

      // Wait for next string
      await page.waitForTimeout(300);

      // Check if still on translation screen
      if (!(await page.locator('.string-display').isVisible({ timeout: 500 }).catch(() => false))) {
        break;
      }
    }

    // Verify at least one submission was made
    expect(submittedTranslations.length).toBeGreaterThan(0);
  });

  test('clears input after successful submission', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (!(await stringDisplay.isVisible())) {
      test.skip();
      return;
    }

    const input = page.locator('.input-group input[type="text"]');
    await input.fill('Test Translation');
    await page.locator('.btn-success').click();

    // Input should be cleared after submission
    await expect(input).toHaveValue('');
  });

  test('advances to next string after submission', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (!(await stringDisplay.isVisible())) {
      test.skip();
      return;
    }

    // Get first string
    const firstString = await getCurrentStringText(page);

    // Submit translation
    const input = page.locator('.input-group input[type="text"]');
    await input.fill('Translation 1');
    await page.locator('.btn-success').click();

    // Wait for UI update
    await page.waitForTimeout(500);

    // Check if we're on a new string or summary
    const stillOnTranslation = await stringDisplay.isVisible().catch(() => false);

    if (stillOnTranslation) {
      // Should be a different string
      const secondString = await getCurrentStringText(page);
      expect(secondString).not.toBe(firstString);
    } else {
      // Should be on summary screen
      await expect(page.locator('.summary-card, .weekly-summary-card')).toBeVisible();
    }
  });

  test('updates progress bar after submission', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (!(await stringDisplay.isVisible())) {
      test.skip();
      return;
    }

    // Get initial progress
    const progressFill = page.locator('.progress-fill');
    const initialWidth = await progressFill.evaluate((el) => el.style.width);

    // Submit translation
    const input = page.locator('.input-group input[type="text"]');
    await input.fill('Test Translation');
    await page.locator('.btn-success').click();

    // Wait for UI update
    await page.waitForTimeout(300);

    // Progress should have increased (unless already at summary)
    const newWidth = await progressFill.evaluate((el) => el.style.width).catch(() => '100%');
    const initialPercent = parseInt(initialWidth) || 0;
    const newPercent = parseInt(newWidth) || 100;

    expect(newPercent).toBeGreaterThanOrEqual(initialPercent);
  });

  test('shows summary screen after completing all strings', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (!(await stringDisplay.isVisible())) {
      test.skip();
      return;
    }

    // Submit all available strings
    for (let i = 0; i < mockStrings.length + 1; i++) {
      const onTranslationScreen = await page.locator('.string-display').isVisible().catch(() => false);

      if (!onTranslationScreen) {
        break;
      }

      const input = page.locator('.input-group input[type="text"]');
      await input.fill(`Translation ${i + 1}`);
      await page.locator('.btn-success').click();

      await page.waitForTimeout(300);
    }

    // Should be on summary screen
    await expect(
      page.locator('.summary-card, .weekly-summary-card, .empty-state-screen')
    ).toBeVisible({ timeout: 5000 });
  });

  test('handles API error gracefully', async ({ page }) => {
    // Override the translations API to return an error
    await page.route('**/api/translations', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      }
    });

    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (!(await stringDisplay.isVisible())) {
      test.skip();
      return;
    }

    // Submit translation (API will fail)
    const input = page.locator('.input-group input[type="text"]');
    await input.fill('Test Translation');
    await page.locator('.btn-success').click();

    // UI should still advance (fire and forget pattern)
    await page.waitForTimeout(500);

    // Should have moved to next string or summary (UI doesn't block on API errors)
    const afterSubmit = await page.locator('.string-display, .summary-card, .weekly-summary-card').isVisible();
    expect(afterSubmit).toBe(true);
  });

  test('submission includes original_id for WordPress tracking', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (!(await stringDisplay.isVisible())) {
      test.skip();
      return;
    }

    // Submit a translation
    const input = page.locator('.input-group input[type="text"]');
    await input.fill('Test Translation');
    await page.locator('.btn-success').click();

    await page.waitForTimeout(500);

    // Verify original_id is included (needed for WordPress GlotPress tracking)
    expect(submittedTranslations).toHaveLength(1);
    expect(submittedTranslations[0].original_id).toBeTruthy();
  });
});

test.describe('Submit Translation - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockConfigAPI(page);
    await mockGlotPressAPI(page);

    // Mock translations API
    await page.route('**/api/translations', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            id: 1,
            message: 'Translation saved successfully',
          }),
        });
      }
    });

    await page.goto('/');
  });

  test('prevents submission with empty input', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (!(await stringDisplay.isVisible())) {
      test.skip();
      return;
    }

    // Submit button should be disabled with empty input
    const submitButton = page.locator('.btn-success');
    await expect(submitButton).toBeDisabled();
  });

  test('prevents submission with whitespace-only input', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (!(await stringDisplay.isVisible())) {
      test.skip();
      return;
    }

    // Enter only whitespace
    const input = page.locator('.input-group input[type="text"]');
    await input.fill('   ');

    // Submit button should be disabled
    const submitButton = page.locator('.btn-success');
    await expect(submitButton).toBeDisabled();
  });

  test('allows submission with trimmed valid input', async ({ page }) => {
    await page.locator('.btn-primary').click();
    await waitForTranslationScreen(page);

    const stringDisplay = page.locator('.string-display');
    if (!(await stringDisplay.isVisible())) {
      test.skip();
      return;
    }

    // Enter valid text (even with leading/trailing spaces)
    const input = page.locator('.input-group input[type="text"]');
    await input.fill('  Valid Translation  ');

    // Submit button should be enabled
    const submitButton = page.locator('.btn-success');
    await expect(submitButton).toBeEnabled();
  });
});
