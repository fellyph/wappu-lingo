import type { GlotPressProject, RawGlotPressString, TranslationString } from '../types';

const GLOTPRESS_BASE = 'https://translate.wordpress.org/api/projects';

// Use CORS proxy for development (browser requests)
// In production, you'd use a backend proxy instead
const CORS_PROXY = 'https://corsproxy.io/?';
const USE_CORS_PROXY = true; // Set to false if using backend proxy

/**
 * Build URL with optional CORS proxy
 */
function buildUrl(path: string): string {
  const fullUrl = `${GLOTPRESS_BASE}${path}`;
  return USE_CORS_PROXY ? `${CORS_PROXY}${encodeURIComponent(fullUrl)}` : fullUrl;
}

/**
 * Fisher-Yates shuffle for random sampling
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Fetch project information including translation sets
 * @param projectSlug - e.g., 'wp/dev' or 'wp-plugins/woocommerce/dev'
 */
export async function fetchProjectStats(projectSlug: string): Promise<GlotPressProject> {
  const url = buildUrl(`/${projectSlug}/`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch project stats: ${response.status}`);
  }

  return response.json();
}

/**
 * Get untranslated count for a specific locale
 */
export async function getUntranslatedCount(
  projectSlug: string,
  localeSlug: string
): Promise<number> {
  const stats = await fetchProjectStats(projectSlug);

  const translationSet = stats.translation_sets?.find(
    (set) => set.locale === localeSlug || set.slug === localeSlug
  );

  return translationSet?.untranslated_count || 0;
}

/**
 * Fetch untranslated strings for a project/locale
 */
export async function fetchUntranslatedStrings(
  projectSlug: string,
  localeSlug: string
): Promise<RawGlotPressString[]> {
  const url = buildUrl(`/${projectSlug}/${localeSlug}/default/?filters[status]=untranslated`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch strings: ${response.status}`);
  }

  const data = (await response.json()) as RawGlotPressString[] | { rows?: RawGlotPressString[] };
  // Handle case where API returns object with rows property or direct array
  return Array.isArray(data) ? data : data.rows || [];
}

/**
 * Fetch and randomly sample N strings for a translation session
 */
export async function fetchSessionStrings(
  projectSlug: string,
  localeSlug: string,
  sampleSize: number = 10
): Promise<RawGlotPressString[]> {
  const stringsArray = await fetchUntranslatedStrings(projectSlug, localeSlug);

  if (stringsArray.length === 0) {
    return [];
  }

  // Random sample: shuffle and take first N
  const shuffled = shuffleArray(stringsArray);
  return shuffled.slice(0, Math.min(sampleSize, shuffled.length));
}

/**
 * Normalize a string object from GlotPress API
 */
export function normalizeString(rawString: RawGlotPressString): TranslationString {
  return {
    id: rawString.original_id,
    singular: rawString.singular,
    plural: rawString.plural || null,
    context: rawString.context || null,
    references: rawString.references || [],
    priority: rawString.priority || 'normal',
    projectId: rawString.project_id,
  };
}
