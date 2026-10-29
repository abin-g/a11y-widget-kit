export type SettingValue = boolean | string;
export type Settings = Record<string, SettingValue>;
export type FeatureType = 'toggle' | 'select';
export type TextDirection = 'ltr' | 'rtl';
export type TranslationVars = Record<string, string | number>;

export interface FeatureOption {
  value: string;
  /** Literal label. Takes precedence over `labelKey`. */
  label?: string;
  /** Message key used to translate the label. */
  labelKey?: string;
  /** Values interpolated into the translated label, e.g. `{ percent: 115 }`. */
  vars?: TranslationVars;
}

export interface FeatureDefinition {
  /** Unique setting key, e.g. `highContrast`. */
  id: string;
  type: FeatureType;
  /** Section the control is grouped under in the widget (`visual`, `hearing`, `motor` or your own). */
  section: string;
  default: SettingValue;
  /** Choices for `select` features. */
  options?: FeatureOption[];
  /** Literal label. Defaults to the `feature.<id>.label` message. */
  label?: string;
  labelKey?: string;
  /** Literal description. Defaults to the `feature.<id>.description` message. */
  description?: string;
  descriptionKey?: string;
  /**
   * Suffix of the `data-a11y-*` attribute written to the target element.
   * Defaults to the kebab-cased id. `false` writes no attribute.
   */
  attribute?: string | false;
  /** Keep the setting (stored, readable, applied) but do not render a control for it. */
  hidden?: boolean;
  /** Extra side effect run whenever the value changes (and once on start). */
  apply?: (value: SettingValue, target: HTMLElement) => void;
}

/** A built-in feature id, a full custom definition, or a partial override of a built-in. */
export type FeatureInput = string | (Partial<FeatureDefinition> & { id: string });

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export interface FontScaleStep {
  value: string;
  /** Multiplier applied to the root font size, e.g. `1.15`. */
  scale: number;
  label?: string;
  labelKey?: string;
}

export interface LocaleDefinition {
  /** BCP 47 language tag, e.g. `ta` or `pt-BR`. */
  code: string;
  /** Native name of the language, e.g. `தமிழ்`. */
  name?: string;
  dir?: TextDirection;
  messages: Record<string, string>;
}

export interface SettingChange {
  id: string;
  value: SettingValue;
}

export interface A11yOptions {
  /** Which features to enable, in display order. Defaults to all built-ins. */
  features?: FeatureInput[];
  /** Override default values, e.g. `{ fontScale: 'large' }`. */
  defaults?: Partial<Settings>;
  /** Steps offered by the text scaling feature. Defaults to 100%, 115% and 130%. */
  fontScales?: FontScaleStep[];
  /** Where settings are persisted. Defaults to `localStorage`; `false` disables persistence. */
  storage?: StorageLike | false;
  storageKey?: string;
  /** Element that receives the `data-a11y-*` attributes. Defaults to `<html>`. */
  target?: HTMLElement | null;
  /** Seed `reducedMotion` and `highContrast` from the user's OS preferences. Default `true`. */
  respectSystemPreferences?: boolean;
  /** Locale code, or `'auto'` to follow the browser. Default `'auto'`. */
  locale?: string;
  /** Extra locales for this instance (see `a11y-widget-kit/locales/*`). */
  locales?: LocaleDefinition[];
  /** Per-locale message overrides: `{ en: { 'dialog.title': 'Display settings' } }`. */
  messages?: Record<string, Record<string, string>>;
  /** Render an aria-live region for announcements. Default `true`. */
  announcer?: boolean;
  onChange?: (settings: Settings, change: SettingChange | null) => void;
}

export interface A11yState {
  settings: Settings;
  locale: string;
  dir: TextDirection;
}

export type A11yListener = (state: A11yState, change: SettingChange | null) => void;

export interface A11yInstance {
  /** Immutable snapshot; a new object is returned after every change. */
  getState(): A11yState;
  /** Snapshot built from defaults only, for server rendering and hydration. */
  getServerState(): A11yState;
  getSettings(): Settings;
  get(id: string): SettingValue | undefined;
  set(id: string, value: SettingValue): void;
  /** Flips a toggle, or advances a select to its next option. */
  toggle(id: string): void;
  reset(): void;
  subscribe(listener: A11yListener): () => void;
  getFeatures(): FeatureDefinition[];
  getFeature(id: string): FeatureDefinition | undefined;
  announce(message: string): void;
  t(key: string, vars?: TranslationVars): string;
  /** Translated label of a feature (or of one of its options). */
  label(id: string, optionValue?: string): string;
  description(id: string): string;
  setLocale(locale: string): void;
  getLocale(): string;
  getAvailableLocales(): LocaleDefinition[];
  getDir(): TextDirection;
  readonly target: HTMLElement | null;
  /** Removes attributes, listeners and the live region. */
  destroy(): void;
}
