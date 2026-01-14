/**
 * Translations API service
 * Handles persisting and retrieving user translations from D1 database
 */

// In dev mode with wrangler pages dev, use port 8788
// In production on Cloudflare Pages, use relative path
const API_BASE = import.meta.env.DEV ? '' : '';

/**
 * Submit a translation to the database
 * @param {Object} translation - Translation data
 * @param {string} translation.user_id - User's unique ID
 * @param {string} translation.user_email - User's email (optional)
 * @param {string} translation.project_slug - Project slug (e.g., 'wp/dev')
 * @param {string} translation.project_name - Project display name
 * @param {string} translation.locale - Locale code (e.g., 'pt-br')
 * @param {string} translation.original_id - Original string ID from GlotPress
 * @param {string} translation.original_string - Original string text
 * @param {string} translation.translation - User's translation
 * @param {string} translation.context - String context (optional)
 * @param {string} translation.status - Status: pending, submitted, approved, rejected
 */
export async function submitTranslation(translation) {
  const response = await fetch(`${API_BASE}/api/translations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(translation),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit translation');
  }

  return response.json();
}

/**
 * Fetch user's translations with optional filters
 * @param {string} userId - User's unique ID
 * @param {Object} filters - Optional filters
 * @param {string} filters.project - Filter by project slug
 * @param {string} filters.locale - Filter by locale
 * @param {string} filters.status - Filter by status
 * @param {string} filters.date_from - Filter by start date (ISO string)
 * @param {string} filters.date_to - Filter by end date (ISO string)
 * @param {number} filters.limit - Number of results (default: 50)
 * @param {number} filters.offset - Offset for pagination
 */
export async function fetchUserTranslations(userId, filters = {}) {
  const params = new URLSearchParams({ user_id: userId });

  if (filters.project) params.append('project', filters.project);
  if (filters.locale) params.append('locale', filters.locale);
  if (filters.status) params.append('status', filters.status);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const response = await fetch(`${API_BASE}/api/translations?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch translations');
  }

  return response.json();
}

/**
 * Get translation statistics for a user
 * @param {string} userId - User's unique ID
 */
export async function fetchUserStats(userId) {
  const { translations } = await fetchUserTranslations(userId, { limit: 1000 });

  const stats = {
    total: translations.length,
    byProject: {},
    byLocale: {},
    byStatus: {},
    byDate: {},
  };

  for (const t of translations) {
    // By project
    stats.byProject[t.project_slug] = (stats.byProject[t.project_slug] || 0) + 1;

    // By locale
    stats.byLocale[t.locale] = (stats.byLocale[t.locale] || 0) + 1;

    // By status
    stats.byStatus[t.status] = (stats.byStatus[t.status] || 0) + 1;

    // By date (day)
    const date = t.created_at.split('T')[0];
    stats.byDate[date] = (stats.byDate[date] || 0) + 1;
  }

  return stats;
}
