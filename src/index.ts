import { createA11y } from './core/store';
import type { A11yInstance, A11yOptions } from './core/types';
import { mountA11yWidget, type WidgetController, type WidgetOptions } from './ui/widget';

export { createA11y, DEFAULT_STORAGE_KEY } from './core/store';
export {
  BUILT_IN_FEATURE_IDS,
  DEFAULT_FONT_SCALES,
  FONT_SCALE_PROPERTY,
  type BuiltInFeatureId,
} from './core/features';
export { mountA11yWidget } from './ui/widget';
export { accessibilityIconSvg, WIDGET_ICONS, widgetIconSvg } from './ui/icon';
export { registerLocale, getRegisteredLocales, resolveLocale, interpolate } from './i18n';
export { en, type MessageKey } from './i18n/locales/en';
export type * from './core/types';
export type { WidgetController, WidgetIcon, WidgetOptions, WidgetPosition, WidgetTheme } from './ui/widget';
export type { WidgetIconName } from './ui/icon';

export interface InitOptions extends A11yOptions {
  /** Options for the floating widget, or `false` to create the store only. */
  widget?: WidgetOptions | false;
}

/** One-call setup: creates the store and mounts the widget. */
export function init(options: InitOptions = {}): { a11y: A11yInstance; widget: WidgetController | null } {
  const { widget: widgetOptions, ...storeOptions } = options;
  const a11y = createA11y(storeOptions);
  const widget = widgetOptions === false ? null : mountA11yWidget(a11y, widgetOptions);
  return { a11y, widget };
}
