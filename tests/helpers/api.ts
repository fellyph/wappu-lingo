import { Page } from '@playwright/test';
import {
  mockStrings,
  mockProjectStats,
  mockSubmitResponse,
  mockTranslationsResponse,
} from '../fixtures/strings';

/**
 * Mock config API endpoint (returns OAuth client ID)
 */
export async function mockConfigAPI(page: Page) {
  await page.route('**/api/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ gravatarClientId: '12345' }),
    });
  });
}

/**
 * Mock GlotPress API endpoints
 * The app uses corsproxy.io with URL-encoded target URLs
 * Example: https://corsproxy.io/?https%3A%2F%2Ftranslate.wordpress.org%2Fapi%2Fprojects%2F...
 */
export async function mockGlotPressAPI(page: Page) {
  // Mock all requests to corsproxy.io
  await page.route('**/corsproxy.io/**', async (route) => {
    const url = decodeURIComponent(route.request().url());

    // Check if requesting untranslated strings (has locale/default in path)
    if (url.includes('/default/') || url.includes('/default?')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStrings),
      });
    } else if (url.includes('translate.wordpress.org/api/projects')) {
      // Project stats
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProjectStats),
      });
    } else {
      // Let other requests through
      await route.continue();
    }
  });
}

/**
 * Mock backend API endpoints (D1 database)
 */
export async function mockBackendAPI(page: Page) {
  // Mock POST /api/translations (submit translation)
  await page.route('**/api/translations', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSubmitResponse),
      });
    } else if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTranslationsResponse),
      });
    }
  });
}

/**
 * Mock all external APIs
 */
export async function mockAllAPIs(page: Page) {
  await mockConfigAPI(page);
  await mockGlotPressAPI(page);
  await mockBackendAPI(page);
}

/**
 * Mock API to return empty strings (no translations available)
 */
export async function mockEmptyStrings(page: Page) {
  await page.route('**/corsproxy.io/**', async (route) => {
    const url = decodeURIComponent(route.request().url());

    if (url.includes('/default/') || url.includes('/default?')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else if (url.includes('translate.wordpress.org/api/projects')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockProjectStats,
          translation_sets: [
            {
              ...mockProjectStats.translation_sets[0],
              untranslated_count: 0,
            },
          ],
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock API error responses
 */
export async function mockAPIError(page: Page) {
  await page.route('**/corsproxy.io/**', async (route) => {
    const url = route.request().url();
    if (url.includes('corsproxy.io')) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    } else {
      await route.continue();
    }
  });
}
