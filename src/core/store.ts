import { createTranslator, getRegisteredLocales, resolveLocale, type Translator } from '../i18n';
import { createAnnouncer, type Announcer } from './announcer';
import { attributeName, DEFAULT_FONT_SCALES, isValidValue, resolveFeatures, warn } from './features';
import { getDefaultStorage, readJSON, writeJSON } from './storage';
import type {
  A11yInstance,
  A11yListener,
  A11yOptions,
  A11yState,
  FeatureDefinition,
  LocaleDefinition,
  SettingChange,
  SettingValue,
  Settings,
  StorageLike,
  TranslationVars,
} from './types';

export const DEFAULT_STORAGE_KEY = 'a11y-widget-kit:v1';

function matchesMedia(query: string): boolean {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

function sanitize(features: FeatureDefinition[], input: unknown): Settings {
  const result: Settings = {};
  if (!input || typeof input !== 'object') return result;
  for (const feature of features) {
    const value = (input as Record<string, unknown>)[feature.id];
    if (isValidValue(feature, value)) result[feature.id] = value as SettingValue;
  }
  return result;
}

/**
 * Creates the accessibility settings store. It is framework-agnostic and works without any UI:
 * pair it with `mountA11yWidget()` for the built-in panel, or drive it from your own controls.
 */
export function createA11y(options: A11yOptions = {}): A11yInstance {
  const features = resolveFeatures(options.features, options.fontScales ?? DEFAULT_FONT_SCALES);
  const featureMap = new Map(features.map((f) => [f.id, f]));
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const storage: StorageLike | null = options.storage === false ? null : (options.storage ?? getDefaultStorage());
  const target: HTMLElement | null =
    options.target !== undefined ? options.target : typeof document !== 'undefined' ? document.documentElement : null;

  const locales = new Map<string, LocaleDefinition>();
  for (const locale of [...getRegisteredLocales(), ...(options.locales ?? [])]) {
    const code = locale.code.toLowerCase();
    const existing = locales.get(code);
    locales.set(code, { ...existing, ...locale, code, messages: { ...existing?.messages, ...locale.messages } });
  }
  const overrides = options.messages ?? {};
  const availableCodes = () => new Set([...locales.keys(), ...Object.keys(overrides).map((c) => c.toLowerCase())]);

  const baseDefaults: Settings = {};
  for (const feature of features) baseDefaults[feature.id] = feature.default;
  const configuredDefaults = { ...baseDefaults, ...sanitize(features, options.defaults) };

  const defaults: Settings = { ...configuredDefaults };
  if (options.respectSystemPreferences !== false) {
    if (featureMap.has('reducedMotion') && options.defaults?.reducedMotion === undefined) {
      defaults.reducedMotion = matchesMedia('(prefers-reduced-motion: reduce)');
    }
    if (featureMap.has('highContrast') && options.defaults?.highContrast === undefined) {
      defaults.highContrast = matchesMedia('(prefers-contrast: more)');
    }
  }

  let translator: Translator = createTranslator(resolveLocale(options.locale ?? 'auto', availableCodes()), locales, overrides);
  let state: A11yState = {
    settings: { ...defaults, ...sanitize(features, readJSON(storage, storageKey)) },
    locale: translator.locale,
    dir: translator.dir,
  };
  const serverState: A11yState = { settings: configuredDefaults, locale: state.locale, dir: state.dir };

  const listeners = new Set<A11yListener>();
  const announcer: Announcer | null = options.announcer === false ? null : createAnnouncer();
  let destroyed = false;

  function applyFeature(feature: FeatureDefinition, value: SettingValue) {
    if (!target) return;
    const attr = attributeName(feature);
    if (attr) target.setAttribute(attr, String(value));
    try {
      feature.apply?.(value, target);
    } catch (error) {
      warn(`apply() of feature "${feature.id}" threw: ${String(error)}`);
    }
  }

  function emit(change: SettingChange | null) {
    for (const listener of [...listeners]) listener(state, change);
  }

  function commit(settings: Settings, change: SettingChange | null) {
    state = { ...state, settings };
    writeJSON(storage, storageKey, settings);
    emit(change);
    options.onChange?.(settings, change);
  }

  for (const feature of features) applyFeature(feature, state.settings[feature.id]);

  const instance: A11yInstance = {
    target,
    getState: () => state,
    getServerState: () => serverState,
    getSettings: () => state.settings,
    get: (id) => state.settings[id],

    set(id, value) {
      if (destroyed) return;
      const feature = featureMap.get(id);
      if (!feature) return warn(`Unknown feature "${id}".`);
      if (!isValidValue(feature, value)) return warn(`Invalid value ${JSON.stringify(value)} for "${id}".`);
      if (state.settings[id] === value) return;
      applyFeature(feature, value);
      commit({ ...state.settings, [id]: value }, { id, value });
    },

    toggle(id) {
      const feature = featureMap.get(id);
      if (!feature) return warn(`Unknown feature "${id}".`);
      if (feature.type === 'toggle') return instance.set(id, !state.settings[id]);
      const opts = feature.options ?? [];
      const index = opts.findIndex((o) => o.value === state.settings[id]);
      instance.set(id, opts[(index + 1) % opts.length].value);
    },

    reset() {
      if (destroyed) return;
      for (const feature of features) applyFeature(feature, defaults[feature.id]);
      commit({ ...defaults }, null);
      instance.announce(translator.t('announce.reset'));
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    getFeatures: () => features,
    getFeature: (id) => featureMap.get(id),

    announce(message) {
      announcer?.announce(message);
    },

    t: (key: string, vars?: TranslationVars) => translator.t(key, vars),

    label(id, optionValue) {
      const feature = featureMap.get(id);
      if (!feature) return id;
      if (optionValue === undefined) {
        return feature.label ?? translator.t(feature.labelKey ?? `feature.${id}.label`);
      }
      const option = feature.options?.find((o) => o.value === optionValue);
      if (!option) return optionValue;
      if (option.label) return option.label;
      return translator.t(option.labelKey ?? `feature.${id}.option.${option.value}`, option.vars);
    },

    description(id) {
      const feature = featureMap.get(id);
      if (!feature) return '';
      if (feature.description !== undefined) return feature.description;
      const key = feature.descriptionKey ?? `feature.${id}.description`;
      const text = translator.t(key);
      return text === key ? '' : text;
    },

    setLocale(locale) {
      const next = createTranslator(resolveLocale(locale, availableCodes()), locales, overrides);
      if (next.locale === state.locale) return;
      translator = next;
      state = { ...state, locale: next.locale, dir: next.dir };
      emit(null);
    },

    getLocale: () => state.locale,
    getDir: () => state.dir,
    getAvailableLocales: () => [...locales.values()],

    destroy() {
      if (destroyed) return;
      destroyed = true;
      listeners.clear();
      announcer?.destroy();
      if (!target) return;
      for (const feature of features) {
        const attr = attributeName(feature);
        if (attr) target.removeAttribute(attr);
      }
      target.style.removeProperty('--a11y-font-scale');
    },
  };

  return instance;
}
