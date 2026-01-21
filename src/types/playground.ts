/**
 * WordPress Playground integration type definitions
 */

// =============================================================================
// Blueprint Types
// =============================================================================

export interface BlueprintStep {
  step: string;
  [key: string]: unknown;
}

export interface WriteFileStep extends BlueprintStep {
  step: 'writeFile';
  path: string;
  data: string;
}

export interface InstallPluginStep extends BlueprintStep {
  step: 'installPlugin';
  pluginZipFile?: {
    resource: string;
    slug: string;
  };
  pluginData?: {
    resource: string;
    slug: string;
  };
}

export interface InstallThemeStep extends BlueprintStep {
  step: 'installTheme';
  themeZipFile?: {
    resource: string;
    slug: string;
  };
  themeData?: {
    resource: string;
    slug: string;
  };
}

export interface SetSiteLanguageStep extends BlueprintStep {
  step: 'setSiteLanguage';
  language: string;
}

export interface LoginStep extends BlueprintStep {
  step: 'login';
  username?: string;
  password?: string;
}

export interface PlaygroundBlueprint {
  landingPage?: string;
  preferredVersions?: {
    php?: string;
    wp?: string;
  };
  phpExtensionBundles?: string[];
  features?: {
    networking?: boolean;
  };
  steps: BlueprintStep[];
}

// =============================================================================
// PO File Types
// =============================================================================

export interface POEntry {
  msgid: string;
  msgid_plural?: string;
  msgstr: string | string[];
  msgctxt?: string;
  references?: string[];
}

export interface POHeaders {
  'Project-Id-Version'?: string;
  'Report-Msgid-Bugs-To'?: string;
  'POT-Creation-Date'?: string;
  'PO-Revision-Date'?: string;
  'Last-Translator'?: string;
  'Language-Team'?: string;
  'Language'?: string;
  'MIME-Version'?: string;
  'Content-Type'?: string;
  'Content-Transfer-Encoding'?: string;
  'Plural-Forms'?: string;
  [key: string]: string | undefined;
}

// =============================================================================
// Translation Preview Types
// =============================================================================

export interface TranslationForPreview {
  original: string;
  translation: string;
  context?: string;
  plural?: string;
}

export interface TranslationPreviewConfig {
  projectSlug: string;
  locale: string;
  wpLocale: string;
  translations: TranslationForPreview[];
}

export type ProjectType = 'plugin' | 'theme' | 'core';

// =============================================================================
// Hook Types
// =============================================================================

export interface UsePlaygroundReturn {
  isOpen: boolean;
  isLoading: boolean;
  playgroundURL: string | null;
  error: string | null;
  openPreview: (translations: TranslationForPreview[]) => void;
  closePreview: () => void;
}
