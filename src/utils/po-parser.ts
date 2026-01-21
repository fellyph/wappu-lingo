/**
 * PO file parsing and generation utilities for WordPress translations
 */

import type { POEntry, POHeaders } from '../types/playground';

/**
 * Default PO file headers
 */
const DEFAULT_HEADERS: POHeaders = {
  'Project-Id-Version': 'Wappu Lingo Preview',
  'Report-Msgid-Bugs-To': '',
  'POT-Creation-Date': '',
  'PO-Revision-Date': new Date().toISOString().replace('T', ' ').slice(0, 19) + '+0000',
  'Last-Translator': 'Wappu Lingo User',
  'Language-Team': '',
  'Language': '',
  'MIME-Version': '1.0',
  'Content-Type': 'text/plain; charset=UTF-8',
  'Content-Transfer-Encoding': '8bit',
  'Plural-Forms': 'nplurals=2; plural=(n != 1);',
};

/**
 * Escape special characters in PO strings
 * Handles newlines, tabs, quotes, and backslashes
 */
export function escapePOString(str: string): string {
  if (!str) return '';

  return str
    .replace(/\\/g, '\\\\')  // Backslash must be first
    .replace(/"/g, '\\"')     // Escape quotes
    .replace(/\n/g, '\\n')    // Newlines
    .replace(/\r/g, '\\r')    // Carriage returns
    .replace(/\t/g, '\\t');   // Tabs
}

/**
 * Unescape PO string special characters
 */
export function unescapePOString(str: string): string {
  if (!str) return '';

  return str
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

/**
 * Format a string for PO file output
 * Handles long strings by splitting into multiple lines
 */
function formatPOString(str: string): string {
  const escaped = escapePOString(str);

  // If string contains newlines or is very long, split into multiline format
  if (escaped.includes('\\n') || escaped.length > 80) {
    const parts = escaped.split('\\n');
    if (parts.length > 1) {
      // Multiline format: "" on first line, then each part
      const lines = parts.map((part, index) => {
        const suffix = index < parts.length - 1 ? '\\n' : '';
        return `"${part}${suffix}"`;
      });
      return `""\n${lines.join('\n')}`;
    }
  }

  return `"${escaped}"`;
}

/**
 * Generate PO file header block
 */
function generatePOHeaders(headers: POHeaders): string {
  const lines: string[] = [];

  // Empty msgid indicates header
  lines.push('msgid ""');
  lines.push('msgstr ""');

  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined && value !== '') {
      lines.push(`"${key}: ${value}\\n"`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate a single PO entry
 */
function generatePOEntry(entry: POEntry): string {
  const lines: string[] = [];

  // Add references as comments
  if (entry.references && entry.references.length > 0) {
    for (const ref of entry.references) {
      lines.push(`#: ${ref}`);
    }
  }

  // Add context if present
  if (entry.msgctxt) {
    lines.push(`msgctxt ${formatPOString(entry.msgctxt)}`);
  }

  // Add original string
  lines.push(`msgid ${formatPOString(entry.msgid)}`);

  // Add plural if present
  if (entry.msgid_plural) {
    lines.push(`msgid_plural ${formatPOString(entry.msgid_plural)}`);

    // Handle plural translations
    const translations = Array.isArray(entry.msgstr) ? entry.msgstr : [entry.msgstr];
    translations.forEach((trans, index) => {
      lines.push(`msgstr[${index}] ${formatPOString(trans)}`);
    });
  } else {
    // Single translation
    const translation = Array.isArray(entry.msgstr) ? entry.msgstr[0] : entry.msgstr;
    lines.push(`msgstr ${formatPOString(translation)}`);
  }

  return lines.join('\n');
}

/**
 * Generate complete PO file content from entries
 */
export function generatePOContent(
  entries: POEntry[],
  customHeaders?: Partial<POHeaders>
): string {
  const headers: POHeaders = {
    ...DEFAULT_HEADERS,
    ...customHeaders,
  };

  const sections: string[] = [];

  // Add header block
  sections.push(generatePOHeaders(headers));

  // Add each entry
  for (const entry of entries) {
    sections.push(generatePOEntry(entry));
  }

  // Join with double newlines
  return sections.join('\n\n') + '\n';
}

/**
 * Create POEntry objects from translation data
 */
export function createPOEntries(
  translations: Array<{
    original: string;
    translation: string;
    context?: string;
    plural?: string;
    references?: string[];
  }>
): POEntry[] {
  return translations.map((t) => ({
    msgid: t.original,
    msgid_plural: t.plural,
    msgstr: t.plural ? [t.translation, t.translation] : t.translation,
    msgctxt: t.context,
    references: t.references,
  }));
}

/**
 * Get plural forms for common locales
 */
export function getPluralForms(locale: string): string {
  const pluralForms: Record<string, string> = {
    // Germanic languages
    en: 'nplurals=2; plural=(n != 1);',
    de: 'nplurals=2; plural=(n != 1);',
    nl: 'nplurals=2; plural=(n != 1);',

    // Romance languages
    es: 'nplurals=2; plural=(n != 1);',
    fr: 'nplurals=2; plural=(n > 1);',
    it: 'nplurals=2; plural=(n != 1);',
    pt: 'nplurals=2; plural=(n != 1);',
    pt_BR: 'nplurals=2; plural=(n > 1);',

    // Slavic languages
    ru: 'nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : 2);',
    pl: 'nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : 2);',
    cs: 'nplurals=3; plural=(n==1 ? 0 : (n>=2 && n<=4) ? 1 : 2);',

    // Asian languages
    ja: 'nplurals=1; plural=0;',
    zh: 'nplurals=1; plural=0;',
    zh_CN: 'nplurals=1; plural=0;',
    zh_TW: 'nplurals=1; plural=0;',
    ko: 'nplurals=1; plural=0;',

    // Other
    ar: 'nplurals=6; plural=(n==0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 && n%100<=99 ? 4 : 5);',
    he: 'nplurals=2; plural=(n != 1);',
    tr: 'nplurals=2; plural=(n > 1);',
  };

  // Normalize locale
  const normalizedLocale = locale.replace('-', '_');
  const shortLocale = normalizedLocale.split('_')[0];

  return pluralForms[normalizedLocale] || pluralForms[shortLocale] || 'nplurals=2; plural=(n != 1);';
}
