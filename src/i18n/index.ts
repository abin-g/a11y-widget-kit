import type { LocaleDefinition, TextDirection, TranslationVars } from '../core/types';
import { en } from './locales/en';

const RTL_LANGUAGES = new Set(['ar', 'arc', 'dv', 'fa', 'he', 'ku', 'ps', 'sd', 'ug', 'ur', 'yi']);

const registry = new Map<string, LocaleDefinition>([[en.code, en]]);

const normalize = (code: string) => code.trim().toLowerCase().replace(/_/g, '-');
const baseOf = (code: string) => normalize(code).split('-')[0];

/** Makes locales available to every instance created afterwards (e.g. `registerLocale(ta, ar)`). */
export function registerLocale(...locales: LocaleDefinition[]): void {
  for (const locale of locales) {
    const code = normalize(locale.code);
    const existing = registry.get(code);
    registry.set(code, {
      ...existing,
      ...locale,
      code,
      messages: { ...existing?.messages, ...locale.messages },
    });
  }
}

export function getRegisteredLocales(): LocaleDefinition[] {
  return [...registry.values()];
}

export function getDirection(code: string, locale?: LocaleDefinition): TextDirection {
  return locale?.dir ?? (RTL_LANGUAGES.has(baseOf(code)) ? 'rtl' : 'ltr');
}

export function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

function browserLanguages(): string[] {
  if (typeof navigator === 'undefined') return [];
  const list = navigator.languages?.length ? navigator.languages : [navigator.language];
  return list.filter(Boolean);
}

/**
 * Picks the best available locale: an exact match, then the base language (`pt-BR` → `pt`),
 * then a regional variant of the base language (`zh` → `zh-tw`), then English.
 */
export function resolveLocale(requested: string | undefined, available: Iterable<string>): string {
  const codes = [...available].map(normalize);
  const candidates = !requested || requested === 'auto' ? browserLanguages() : [requested];

  for (const candidate of candidates) {
    const code = normalize(candidate);
    if (codes.includes(code)) return code;
    const base = baseOf(code);
    if (codes.includes(base)) return base;
    const variant = codes.find((c) => baseOf(c) === base);
    if (variant) return variant;
  }
  return 'en';
}

export interface Translator {
  locale: string;
  dir: TextDirection;
  t(key: string, vars?: TranslationVars): string;
}

/** Builds a lookup that falls back from the locale to its base language, then to English, then to the key. */
export function createTranslator(
  locale: string,
  locales: Map<string, LocaleDefinition>,
  overrides: Record<string, Record<string, string>> = {},
): Translator {
  const code = normalize(locale);
  const base = baseOf(code);
  const normalizedOverrides = Object.fromEntries(
    Object.entries(overrides).map(([key, value]) => [normalize(key), value]),
  );
  const chain = [
    normalizedOverrides[code],
    locales.get(code)?.messages,
    code !== base ? normalizedOverrides[base] : undefined,
    code !== base ? locales.get(base)?.messages : undefined,
    normalizedOverrides.en,
    en.messages,
  ].filter(Boolean) as Record<string, string>[];

  return {
    locale: code,
    dir: getDirection(code, locales.get(code)),
    t(key, vars) {
      for (const messages of chain) {
        const value = messages[key];
        if (value !== undefined) return interpolate(value, vars);
      }
      return key;
    },
  };
}

export { en };
