/**
 * Translations API service
 * Handles persisting and retrieving user translations from D1 database
 */

import type {
  SubmitTranslationPayload,
  TranslationFilters,
  TranslationRecord,
  TranslationsResponse,
  UserStats,
} from '../types';

// In dev mode with wrangler pages dev, use port 8788
// In production on Cloudflare Pages, use relative path
const API_BASE = import.meta.env.DEV ? '' : '';

interface SubmitResponse {
  success: boolean;
  id: number;
  message: string;
}

interface ErrorResponse {
  error: string;
}

/**
 * Submit a translation to the database
 */
export async function submitTranslation(
  translation: SubmitTranslationPayload
): Promise<SubmitResponse> {
  const response = await fetch(`${API_BASE}/api/translations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(translation),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to submit translation');
  }

  return response.json();
}

/**
 * Fetch user's translations with optional filters
 */
export async function fetchUserTranslations(
  userId: string,
  filters: TranslationFilters = {}
): Promise<TranslationsResponse> {
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
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch translations');
  }

  return response.json();
}

/**
 * Compute statistics from an array of translations (no network request)
 */
export function computeStatsFromTranslations(
  translations: TranslationRecord[]
): UserStats {
  const stats: UserStats = {
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
    const date = t.created_at?.split('T')[0] || 'unknown';
    stats.byDate[date] = (stats.byDate[date] || 0) + 1;
  }

  return stats;
}

/**
 * Get translation statistics for a user
 */
export async function fetchUserStats(userId: string): Promise<UserStats> {
  const { translations } = await fetchUserTranslations(userId, { limit: 1000 });
  return computeStatsFromTranslations(translations);
}
