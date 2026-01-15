/**
 * Shared type definitions for Wappu Lingo
 */

// =============================================================================
// Settings Types
// =============================================================================

export interface Locale {
  code: string;
  name: string;
  wpLocale: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
}

// =============================================================================
// User & Auth Types
// =============================================================================

export interface GravatarProfile {
  hash?: string;
  display_name?: string;
  avatar_url?: string;
  email?: string;
  profile_url?: string;
  location?: string;
  description?: string;
  job_title?: string;
  company?: string;
  error?: string;
}

// =============================================================================
// Translation Types
// =============================================================================

export interface TranslationString {
  id: string;
  singular: string;
  plural: string | null;
  context: string | null;
  references: string[];
  priority: 'normal' | 'high';
  projectId: string;
}

export interface SessionStats {
  total: number;
  completed: number;
  skipped: number;
}

export interface SessionContext {
  projectSlug: string | null;
  projectName: string | null;
  locale: string | null;
  userId: string | null;
  userEmail: string | null;
}

export interface StartSessionOptions {
  projectSlug: string;
  projectName: string;
  localeSlug: string;
  sampleSize: number;
  userId: string;
  userEmail: string | null;
}

// =============================================================================
// GlotPress API Types
// =============================================================================

export interface GlotPressProject {
  name?: string;
  slug?: string;
  translation_sets?: TranslationSet[];
}

export interface TranslationSet {
  locale: string;
  slug?: string;
  name: string;
  current_count: number;
  untranslated_count: number;
  waiting_count: number;
  fuzzy_count: number;
  all_count: number;
  percent_translated: string;
  wp_locale: string;
}

export interface RawGlotPressString {
  original_id: string;
  singular: string;
  plural: string | null;
  context: string | null;
  translations?: string[];
  references?: string[];
  priority?: 'normal' | 'high';
  status?: string;
  project_id: string;
}

// =============================================================================
// Database / API Types
// =============================================================================

export interface TranslationRecord {
  id?: number;
  user_id: string;
  user_email: string | null;
  project_slug: string;
  project_name: string | null;
  locale: string;
  original_id: string;
  original_string: string;
  translation: string;
  context: string | null;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

export interface SubmitTranslationPayload {
  user_id: string;
  user_email?: string | null;
  project_slug: string;
  project_name?: string | null;
  locale: string;
  original_id: string;
  original_string: string;
  translation: string;
  context?: string | null;
  status?: 'pending' | 'submitted' | 'approved' | 'rejected';
}

export interface TranslationFilters {
  project?: string;
  locale?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface UserStats {
  total: number;
  byProject: Record<string, number>;
  byLocale: Record<string, number>;
  byStatus: Record<string, number>;
  byDate: Record<string, number>;
}

export interface TranslationsResponse {
  translations: TranslationRecord[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

// =============================================================================
// Hook Return Types
// =============================================================================

export interface UILanguage {
  code: string;
  name: string;
  dir: 'ltr' | 'rtl';
}

export interface UseSettingsReturn {
  locale: string;
  localeObj: Locale;
  setLocale: (newLocale: string) => void;
  projectId: string;
  project: Project;
  setProject: (newProjectId: string) => void;
  stringsPerSession: number;
  setStringsPerSession: (count: number) => void;
  availableProjects: Project[];
  availableLocales: Locale[];
  uiLanguage: string;
  setUILanguage: (langCode: string) => void;
  availableUILanguages: readonly UILanguage[];
}

export interface UseTranslationSessionReturn {
  strings: TranslationString[];
  currentString: TranslationString | null;
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  isSessionComplete: boolean;
  progressPercent: number;
  sessionStats: SessionStats;
  startSession: (options: StartSessionOptions) => Promise<void>;
  submitTranslation: (translation: string) => Promise<void>;
  skipString: () => void;
  resetSession: () => void;
}
