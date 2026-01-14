import type { Locale } from '../types';

export const LOCALES: Locale[] = [
  { code: 'pt-br', name: 'Portuguese (Brazil)', wpLocale: 'pt_BR' },
  { code: 'es', name: 'Spanish', wpLocale: 'es_ES' },
  { code: 'fr', name: 'French', wpLocale: 'fr_FR' },
  { code: 'de', name: 'German', wpLocale: 'de_DE' },
  { code: 'it', name: 'Italian', wpLocale: 'it_IT' },
  { code: 'ja', name: 'Japanese', wpLocale: 'ja' },
  { code: 'ar', name: 'Arabic', wpLocale: 'ar' },
  { code: 'nl', name: 'Dutch', wpLocale: 'nl_NL' },
];

export const DEFAULT_LOCALE = 'it';
