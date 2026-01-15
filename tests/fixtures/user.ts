/**
 * Mock Gravatar user profile for testing
 */
export const mockUser = {
  hash: 'abc123def456',
  display_name: 'Test User',
  avatar_url: 'https://www.gravatar.com/avatar/abc123def456?s=256',
  profile_url: 'https://gravatar.com/testuser',
  email: 'test@example.com',
  location: 'Test City',
  description: 'A test user for e2e testing',
};

/**
 * Mock OAuth token
 */
export const mockToken = 'mock_test_token_12345';

/**
 * Mock user stats response
 */
export const mockUserStats = {
  total: 42,
  byProject: {
    'wp/dev': 30,
    'wp-plugins/woocommerce/dev': 12,
  },
  byLocale: {
    'pt-br': 42,
  },
  byStatus: {
    pending: 35,
    approved: 7,
  },
  byDate: {
    '2024-01-15': 10,
    '2024-01-14': 15,
    '2024-01-13': 17,
  },
};
