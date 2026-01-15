/**
 * Mock GlotPress translation strings for testing
 */
export const mockStrings = [
  {
    original_id: '1001',
    singular: 'Hello World',
    plural: null,
    context: null,
    references: ['src/greeting.php:42'],
    priority: 'normal',
    project_id: '2905',
  },
  {
    original_id: '1002',
    singular: 'Save Changes',
    plural: null,
    context: 'button label',
    references: ['src/settings.php:100'],
    priority: 'high',
    project_id: '2905',
  },
  {
    original_id: '1003',
    singular: 'Are you sure?',
    plural: null,
    context: 'confirmation dialog',
    references: ['src/modal.php:25'],
    priority: 'normal',
    project_id: '2905',
  },
  {
    original_id: '1004',
    singular: '%d item',
    plural: '%d items',
    context: 'item count',
    references: ['src/list.php:88'],
    priority: 'normal',
    project_id: '2905',
  },
  {
    original_id: '1005',
    singular: 'Loading...',
    plural: null,
    context: null,
    references: ['src/loader.php:12'],
    priority: 'normal',
    project_id: '2905',
  },
];

/**
 * Mock project stats response
 */
export const mockProjectStats = {
  name: 'WordPress',
  slug: 'wp/dev',
  translation_sets: [
    {
      locale: 'pt-br',
      name: 'Portuguese (Brazil)',
      slug: 'default',
      current_count: 7000,
      untranslated_count: 74,
      waiting_count: 5,
      fuzzy_count: 2,
      all_count: 7074,
      percent_translated: '99%',
      wp_locale: 'pt_BR',
    },
  ],
};

/**
 * Mock translation submission response
 */
export const mockSubmitResponse = {
  success: true,
  id: 123,
  message: 'Translation saved successfully',
};

/**
 * Mock translations list response
 */
export const mockTranslationsResponse = {
  translations: [
    {
      id: 1,
      user_id: 'abc123def456',
      user_email: 'test@example.com',
      project_slug: 'wp/dev',
      project_name: 'WordPress',
      locale: 'pt-br',
      original_id: '1001',
      original_string: 'Hello World',
      translation: 'Olá Mundo',
      context: null,
      status: 'pending',
      created_at: '2024-01-15T10:30:00Z',
    },
  ],
  total: 1,
};
