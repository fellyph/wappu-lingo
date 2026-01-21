/**
 * WordPress Playground service for translation preview
 * Generates blueprints and URLs to preview translations in a live WordPress environment
 */

import type {
  PlaygroundBlueprint,
  TranslationPreviewConfig,
  ProjectType,
  BlueprintStep,
} from '../types/playground';
import { generatePOContent, createPOEntries, getPluralForms } from '../utils/po-parser';

// =============================================================================
// Constants
// =============================================================================

const PLAYGROUND_BASE_URL = 'https://playground.wordpress.net';

/**
 * Map GlotPress locales to WordPress locales
 * GlotPress uses hyphen-lowercase, WordPress uses underscore-titlecase
 */
const LOCALE_MAP: Record<string, string> = {
  // Regional variants
  'pt-br': 'pt_BR',
  'zh-cn': 'zh_CN',
  'zh-tw': 'zh_TW',
  'es-mx': 'es_MX',
  'es-ar': 'es_AR',
  'es-ve': 'es_VE',
  'es-co': 'es_CO',
  'es-cl': 'es_CL',
  'es-pe': 'es_PE',
  'en-gb': 'en_GB',
  'en-au': 'en_AU',
  'en-ca': 'en_CA',
  'fr-ca': 'fr_CA',
  'fr-be': 'fr_BE',
  'nl-be': 'nl_BE',
  'de-ch': 'de_CH',
  'de-at': 'de_AT',

  // Simple mappings (GlotPress to WordPress)
  'es': 'es_ES',
  'fr': 'fr_FR',
  'de': 'de_DE',
  'it': 'it_IT',
  'nl': 'nl_NL',
  'pt': 'pt_PT',
  'ru': 'ru_RU',
  'ja': 'ja',
  'ar': 'ar',
  'he': 'he_IL',
  'ko': 'ko_KR',
  'pl': 'pl_PL',
  'tr': 'tr_TR',
  'cs': 'cs_CZ',
  'hu': 'hu_HU',
  'ro': 'ro_RO',
  'sv': 'sv_SE',
  'da': 'da_DK',
  'fi': 'fi',
  'no': 'nb_NO',
  'uk': 'uk',
  'vi': 'vi',
  'th': 'th',
  'id': 'id_ID',
  'el': 'el',
};

// =============================================================================
// Project Type Detection
// =============================================================================

/**
 * Detect the project type from the GlotPress project slug
 */
export function detectProjectType(projectSlug: string): ProjectType {
  if (projectSlug.startsWith('wp-plugins/')) {
    return 'plugin';
  }
  if (projectSlug.startsWith('wp-themes/')) {
    return 'theme';
  }
  return 'core';
}

/**
 * Extract the plugin/theme slug from the full project path
 * e.g., "wp-plugins/woocommerce/dev" -> "woocommerce"
 */
export function extractSlug(projectSlug: string): string {
  const parts = projectSlug.split('/');

  if (parts[0] === 'wp-plugins' && parts.length >= 2) {
    return parts[1];
  }
  if (parts[0] === 'wp-themes' && parts.length >= 2) {
    return parts[1];
  }

  // For core, return 'wordpress'
  return 'wordpress';
}

/**
 * Map GlotPress locale to WordPress locale format
 */
export function mapLocaleToWPLocale(locale: string): string {
  // First check direct mapping
  const normalizedLocale = locale.toLowerCase();
  if (LOCALE_MAP[normalizedLocale]) {
    return LOCALE_MAP[normalizedLocale];
  }

  // If it already looks like a WordPress locale, return as-is
  if (locale.includes('_')) {
    return locale;
  }

  // Otherwise try to construct a WordPress locale
  // Most locales that aren't in the map are already in the right format
  return locale;
}

// =============================================================================
// Translation File Path Generation
// =============================================================================

/**
 * Get the WordPress translation file path for a project
 */
export function getTranslationFilePath(
  projectType: ProjectType,
  slug: string,
  wpLocale: string
): string {
  switch (projectType) {
    case 'plugin':
      return `/wordpress/wp-content/languages/plugins/${slug}-${wpLocale}.po`;
    case 'theme':
      return `/wordpress/wp-content/languages/themes/${slug}-${wpLocale}.po`;
    case 'core':
      return `/wordpress/wp-content/languages/${wpLocale}.po`;
    default:
      return `/wordpress/wp-content/languages/${wpLocale}.po`;
  }
}

// =============================================================================
// PO File Generation
// =============================================================================

/**
 * Generate PO file content for the translations
 */
export function generateTranslationPO(config: TranslationPreviewConfig): string {
  const entries = createPOEntries(config.translations);

  const headers = {
    'Language': config.wpLocale,
    'Plural-Forms': getPluralForms(config.wpLocale),
  };

  return generatePOContent(entries, headers);
}

// =============================================================================
// Blueprint Generation
// =============================================================================

/**
 * Generate WordPress Playground blueprint for translation preview
 */
export function generateBlueprint(config: TranslationPreviewConfig): PlaygroundBlueprint {
  const projectType = detectProjectType(config.projectSlug);
  const slug = extractSlug(config.projectSlug);
  const wpLocale = config.wpLocale || mapLocaleToWPLocale(config.locale);

  // Generate PO file content
  const poContent = generateTranslationPO({
    ...config,
    wpLocale,
  });

  // Build the steps array
  const steps: BlueprintStep[] = [];

  // Step 1: Login as admin
  steps.push({
    step: 'login',
    username: 'admin',
    password: 'password',
  });

  // Step 2: Set site language
  steps.push({
    step: 'setSiteLanguage',
    language: wpLocale,
  });

  // Step 3: Install plugin/theme if needed
  if (projectType === 'plugin') {
    steps.push({
      step: 'installPlugin',
      pluginData: {
        resource: 'wordpress.org/plugins',
        slug: slug,
      },
    });
  } else if (projectType === 'theme') {
    steps.push({
      step: 'installTheme',
      themeData: {
        resource: 'wordpress.org/themes',
        slug: slug,
      },
    });
  }

  // Step 4: Create languages directory if needed
  const translationPath = getTranslationFilePath(projectType, slug, wpLocale);
  const langDir = translationPath.substring(0, translationPath.lastIndexOf('/'));

  steps.push({
    step: 'mkdir',
    path: langDir,
  });

  // Step 5: Write the translation PO file
  steps.push({
    step: 'writeFile',
    path: translationPath,
    data: poContent,
  });

  // Step 6: Also write an MO-compatible file (WordPress needs both in some cases)
  // For preview purposes, the PO file should work, but we also create a simple MO
  steps.push({
    step: 'writeFile',
    path: translationPath.replace('.po', '.mo'),
    data: poContent, // In a full implementation, this would be proper MO format
  });

  // Determine landing page based on project type
  let landingPage = '/wp-admin/';
  if (projectType === 'plugin') {
    // For WooCommerce, go to products page; for others, go to plugins list
    if (slug === 'woocommerce') {
      landingPage = '/wp-admin/admin.php?page=wc-admin';
    } else {
      landingPage = '/wp-admin/plugins.php';
    }
  } else if (projectType === 'theme') {
    landingPage = '/wp-admin/themes.php';
  }

  const blueprint: PlaygroundBlueprint = {
    landingPage,
    preferredVersions: {
      php: '8.2',
      wp: 'latest',
    },
    phpExtensionBundles: ['kitchen-sink'],
    features: {
      networking: true,
    },
    steps,
  };

  return blueprint;
}

// =============================================================================
// URL Building
// =============================================================================

/**
 * Encode blueprint for URL
 */
function encodeBlueprint(blueprint: PlaygroundBlueprint): string {
  const json = JSON.stringify(blueprint);
  // Use base64 encoding for the blueprint
  return btoa(unescape(encodeURIComponent(json)));
}

/**
 * Build the WordPress Playground URL with the encoded blueprint
 */
export function buildPlaygroundURL(blueprint: PlaygroundBlueprint): string {
  // Use the hash-based URL format for blueprints
  const url = new URL(PLAYGROUND_BASE_URL);
  url.hash = `#${encodeURIComponent(JSON.stringify(blueprint))}`;

  return url.toString();
}

/**
 * Alternative: Build URL with blueprint as query parameter
 * Some Playground implementations prefer this format
 */
export function buildPlaygroundURLWithQuery(blueprint: PlaygroundBlueprint): string {
  const url = new URL(PLAYGROUND_BASE_URL);
  url.searchParams.set('blueprint-url', `data:application/json;base64,${encodeBlueprint(blueprint)}`);
  return url.toString();
}

// =============================================================================
// Main Preview Function
// =============================================================================

/**
 * Generate a complete Playground preview URL for translations
 */
export function generatePreviewURL(config: TranslationPreviewConfig): string {
  const blueprint = generateBlueprint(config);
  return buildPlaygroundURL(blueprint);
}

/**
 * Check if Playground preview is supported for a project
 */
export function isPreviewSupported(projectSlug: string): boolean {
  const projectType = detectProjectType(projectSlug);

  // Core translations work in Playground
  if (projectType === 'core') {
    return true;
  }

  // Plugins from wordpress.org work
  if (projectType === 'plugin') {
    return true;
  }

  // Themes from wordpress.org work
  if (projectType === 'theme') {
    return true;
  }

  return false;
}
