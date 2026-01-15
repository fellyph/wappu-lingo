import { Page } from '@playwright/test';
import { mockUser, mockToken } from '../fixtures/user';

/**
 * Inject OAuth token and mock user authentication
 * This simulates a logged-in user without going through OAuth flow
 */
export async function mockAuthenticatedUser(page: Page) {
  // Set token in localStorage before navigating
  await page.addInitScript((token) => {
    localStorage.setItem('gravatar_token', token);
  }, mockToken);

  // Mock Gravatar profile API
  await page.route('https://api.gravatar.com/v3/me/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    });
  });
}

/**
 * Clear authentication state
 */
export async function clearAuthentication(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('gravatar_token');
  });
}

/**
 * Mock an authentication error
 */
export async function mockAuthError(page: Page) {
  await page.addInitScript((token) => {
    localStorage.setItem('gravatar_token', token);
  }, mockToken);

  await page.route('https://api.gravatar.com/v3/me/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Invalid token' }),
    });
  });
}
