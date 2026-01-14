const GLOTPRESS_BASE = 'https://translate.wordpress.org/api/projects';

// Use CORS proxy for development (browser requests)
// In production, you'd use a backend proxy instead
const CORS_PROXY = 'https://corsproxy.io/?';
const USE_CORS_PROXY = true; // Set to false if using backend proxy

/**
 * Build URL with optional CORS proxy
 */
function buildUrl(path) {
  const fullUrl = `${GLOTPRESS_BASE}${path}`;
  return USE_CORS_PROXY ? `${CORS_PROXY}${encodeURIComponent(fullUrl)}` : fullUrl;
}

/**
 * Fisher-Yates shuffle for random sampling
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Fetch project information including translation sets
 * @param {string} projectSlug - e.g., 'wp/dev' or 'wp-plugins/woocommerce/dev'
 */
export async function fetchProjectStats(projectSlug) {
  const url = buildUrl(`/${projectSlug}/`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch project stats: ${response.status}`);
  }

  return response.json();
}

/**
 * Get untranslated count for a specific locale
 * @param {string} projectSlug
 * @param {string} localeSlug - e.g., 'pt-br'
 */
export async function getUntranslatedCount(projectSlug, localeSlug) {
  const stats = await fetchProjectStats(projectSlug);

  const translationSet = stats.translation_sets?.find(
    (set) => set.locale === localeSlug || set.slug === localeSlug
  );

  return translationSet?.untranslated_count || 0;
}

/**
 * Fetch untranslated strings for a project/locale
 * @param {string} projectSlug
 * @param {string} localeSlug
 */
export async function fetchUntranslatedStrings(projectSlug, localeSlug) {
  const url = buildUrl(`/${projectSlug}/${localeSlug}/default/?filters[status]=untranslated`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch strings: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch and randomly sample N strings for a translation session
 * @param {string} projectSlug
 * @param {string} localeSlug
 * @param {number} sampleSize - Number of strings to return
 */
export async function fetchSessionStrings(projectSlug, localeSlug, sampleSize = 10) {
  const allStrings = await fetchUntranslatedStrings(projectSlug, localeSlug);

  // Handle case where API returns object with rows property or direct array
  const stringsArray = Array.isArray(allStrings) ? allStrings : allStrings.rows || [];

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
export function normalizeString(rawString) {
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
