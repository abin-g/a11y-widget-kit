# a11y-widget-kit

A framework-agnostic, i18n-ready accessibility preferences widget. It adds a floating button that opens an accessible dialog where visitors can:

- turn on **high contrast**
- **scale text** (100 / 115 / 130 %, configurable)
- switch to a **readable font with wider spacing** (dyslexia-friendly)
- **highlight links**
- **reduce motion**
- opt in to **visual alerts** (a setting your app can read)

Choices are saved in `localStorage` and applied as `data-a11y-*` attributes on `<html>`, which the bundled CSS reacts to.

- **No framework required.** It works in plain HTML from a CDN, and in Vue, Svelte, Angular and others. A first-class React adapter is included.
- **International.** It ships with 8 locales: English, Español, Français, Deutsch, العربية (RTL), हिन्दी, தமிழ் and 中文. You can override any string or add your own language.
- **Fully configurable.** You can pick and reorder features, add custom ones, change the font-scale steps, use your own storage, theme everything with CSS variables, or go headless and use your own button.
- **Accessible itself.** It uses a real focus trap, Escape to close, focus return, `role="switch"`, `aria-pressed` and a polite live region, and it is tested with axe-core.
- **SSR-safe.** It never touches `window` or `localStorage` on the server.

> **Note:** This widget helps users adjust presentation. It does **not** make an inaccessible site compliant. Keep following WCAG in your own markup.

## Install

```bash
npm install a11y-widget-kit
```

## Quick start

### Any bundler (vanilla JS / Vue / Svelte / Angular …)

```js
import { init } from 'a11y-widget-kit';
import 'a11y-widget-kit/styles.css';

const { a11y, widget } = init({
  locale: 'auto',            // follow the browser language
  widget: { position: 'bottom-right' },
});
```

### React

```jsx
import { A11yProvider, A11yWidget, useA11y } from 'a11y-widget-kit/react';
import 'a11y-widget-kit/styles.css';

export function App() {
  return (
    <A11yProvider options={{ locale: 'en' }}>
      <Routes />
      <A11yWidget position="bottom-left" />
    </A11yProvider>
  );
}

function Toast({ message }) {
  const { settings } = useA11y();
  return settings.visualAlerts ? <Banner>{message}</Banner> : null;
}
```

### Plain HTML / CDN

The `<script>` build already registers every bundled locale.

```html
<link rel="stylesheet" href="https://unpkg.com/a11y-widget-kit@0.1.0/dist/styles.css" />
<script src="https://unpkg.com/a11y-widget-kit@0.1.0/dist/a11y-widget-kit.global.js"></script>
<script>
  A11yWidgetKit.init({ locale: 'auto', widget: { position: 'bottom-right' } });
</script>
```

## Core API

```ts
import { createA11y, mountA11yWidget } from 'a11y-widget-kit';

const a11y = createA11y(options);       // the settings store (no UI)
const widget = mountA11yWidget(a11y, widgetOptions); // the floating button + dialog
```

### `createA11y(options)`

| Option | Default | Description |
| --- | --- | --- |
| `features` | all built-ins | Feature ids, overrides or custom definitions, in display order. |
| `defaults` | — | Override default values, e.g. `{ fontScale: 'large' }`. |
| `fontScales` | 100 / 115 / 130 % | Steps for text scaling: `{ value, scale, label?, labelKey? }[]`. |
| `storage` | `localStorage` | Any `{ getItem, setItem }` object. Set `false` to turn off persistence. |
| `storageKey` | `'a11y-widget-kit:v1'` | Key under which settings are saved. |
| `target` | `<html>` | Element that receives the `data-a11y-*` attributes. |
| `respectSystemPreferences` | `true` | Seeds `reducedMotion` and `highContrast` from `prefers-reduced-motion` and `prefers-contrast`. |
| `locale` | `'auto'` | Locale code, or `'auto'` for the browser language. Falls back to `en`. |
| `locales` | `[]` | Extra locale definitions for this instance. |
| `messages` | `{}` | Per-locale string overrides: `{ en: { 'dialog.title': 'Display' } }`. |
| `announcer` | `true` | Renders an `aria-live` region for announcements. |
| `onChange` | — | `(settings, change) => void`. Use it to sync to your backend, analytics and so on. |

The instance it returns provides these methods:

| Method | Description |
| --- | --- |
| `getSettings()`, `get(id)` | Read the current settings. |
| `set(id, value)` | Set a value. Invalid values are rejected with a console warning. |
| `toggle(id)` | Flip a toggle. On a select feature, move to the next option. |
| `reset()` | Restore the defaults. |
| `subscribe(listener)` | Listen for changes. Returns an unsubscribe function. |
| `getState()`, `getServerState()` | Immutable snapshots, compatible with `useSyncExternalStore`. |
| `setLocale(code)`, `getLocale()`, `getDir()` | Switch or read the language and text direction at runtime. |
| `t(key, vars)`, `label(id, option?)`, `description(id)` | Translated strings. |
| `announce(message)` | Send a message to screen readers. |
| `getFeatures()`, `getAvailableLocales()` | Inspect the configuration. |
| `destroy()` | Remove attributes, the live region and listeners. |

### `mountA11yWidget(a11y, options)`

| Option | Default | Description |
| --- | --- | --- |
| `position` | `'bottom-left'` | `bottom-left`, `bottom-right`, `top-left` or `top-right`. |
| `offset` | `{ x: 24, y: 24 }` | Distance from the corner. Numbers are px; strings are any CSS length, e.g. `'calc(5rem + env(safe-area-inset-bottom))'`. |
| `shortcut` | `'alt+a'` | Any combination such as `'ctrl+shift+u'`. Set `false` to disable. It is ignored while typing in a field. |
| `showLabel` | `true` | Show the text label next to the icon on screens ≥ 640 px. |
| `icon` | `'accessibility'` | Choose `'accessibility'`, `'eye'`, `'sparkles'` or `'hand'`, or provide a factory that returns a fresh SVG element. |
| `renderTrigger` | `true` | Set `false` for headless mode; then call `widget.open()` from your own button. |
| `theme` | `'light'` | `light`, `dark` or `auto` (follows `prefers-color-scheme`). |
| `zIndex` | `2147483000` | Stacking order. |
| `closeOnBackdrop` | `true` | Close the dialog when the backdrop is clicked. |
| `container` | `document.body` | Where the widget is mounted. |
| `className` | — | Extra class on the widget root, for scoped theming. |
| `onOpenChange` | — | `(open) => void`. |

For a custom icon, return a new SVG element each time the factory is called. It is marked decorative and sized by the widget:

```js
const starIcon = () => {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'currentColor');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'm12 2 2.8 6.2 6.7.7-5 4.5 1.4 6.6-5.9-3.4-5.9 3.4 1.4-6.6-5-4.5 6.7-.7z');
  icon.append(path);
  return icon;
};

const { widget } = init({ widget: { icon: starIcon } });
```

The controller it returns has `open()`, `close()`, `toggle()`, `isOpen()`, `update(partialOptions)` and `destroy()`.

The example below moves the trigger above a sticky mobile action bar on some routes:

```js
router.afterEach((to) => {
  widget.update({ offset: { y: to.path.startsWith('/listing/') ? '5.25rem' : 24 } });
});
```

In React, pass the new props to `<A11yWidget offset={…} />`. Use a `ref` to call `open()` and `close()`.

## Features

| Id | Type | Attribute on target | Effect in `styles.css` |
| --- | --- | --- | --- |
| `highContrast` | toggle | `data-a11y-high-contrast` | Contrast filter and solid outlines on interactive elements. |
| `fontScale` | select | `data-a11y-font-scale` + `--a11y-font-scale` | Scales the root font size, so all `rem` units scale with it. |
| `readableFont` | toggle | `data-a11y-readable-font` | Readable font, wider letter and word spacing, line height 1.7. |
| `highlightLinks` | toggle | `data-a11y-highlight-links` | Underlined, bold, high-contrast links. |
| `reducedMotion` | toggle | `data-a11y-reduced-motion` | Turns off animations, transitions and smooth scrolling. |
| `visualAlerts` | toggle | *(none)* | Only a setting. Read it in your app to show on-screen alerts instead of sounds. |

### Choosing, overriding and adding features

```js
createA11y({
  features: [
    'fontScale',
    'highContrast',
    { id: 'visualAlerts', hidden: true },            // keep the setting, hide the control
    {
      id: 'grayscale',                               // a custom feature
      type: 'toggle',
      section: 'visual',
      default: false,
      labelKey: 'feature.grayscale.label',           // or label: 'Grayscale'
      descriptionKey: 'feature.grayscale.description',
      apply: (on, target) => { target.style.filter = on ? 'grayscale(1)' : ''; },
    },
  ],
  fontScales: [
    { value: 'normal', scale: 1 },
    { value: 'large', scale: 1.25, labelKey: 'feature.fontScale.option.large' },
    { value: 'huge', scale: 1.5, label: 'Huge' },
  ],
  messages: {
    en: { 'feature.grayscale.label': 'Grayscale', 'feature.grayscale.description': 'Remove colours' },
  },
});
```

A custom feature also gets a `data-a11y-<kebab-id>` attribute, so you can style it purely in CSS. Set `attribute: false` to skip it. A custom `section` takes its heading from the `section.<id>` message.

## Internationalisation

- With `locale: 'auto'`, the widget tries the browser languages in order. It matches the exact code first (`pt-BR`), then the base language (`pt`), and falls back to English.
- Any missing key falls back to the base language and then to English. Text direction comes from the locale (`dir`), and the widget renders RTL correctly.
- Locales are separate modules, so bundles stay small:

```js
import { createA11y, registerLocale } from 'a11y-widget-kit';
import ta from 'a11y-widget-kit/locales/ta';
import ar from 'a11y-widget-kit/locales/ar';

registerLocale(ta, ar);              // global, for every instance
const a11y = createA11y({ locale: 'auto' });
a11y.setLocale('ta');                // switch at runtime, e.g. from your language picker
```

To add a language, pass a `LocaleDefinition` (`{ code, name, dir, messages }`) in `locales` or to `registerLocale`. See [`src/i18n/locales/en.ts`](src/i18n/locales/en.ts) for every key. The `MessageKey` type lists them all too.

Bundled locales: `en`, `es`, `fr`, `de`, `ar` (RTL), `hi`, `ta`, `zh`. The non-English translations are first drafts. **Reviews from native speakers are very welcome.** See [CONTRIBUTING.md](CONTRIBUTING.md).

## Theming

The widget uses CSS variables. Override them globally, or scope them with `className`:

```css
.a11y-wk-root {
  --a11y-wk-primary: #4f46e5;
  --a11y-wk-primary-hover: #4338ca;
  --a11y-wk-on-primary: #fff;
  --a11y-wk-accent: #a5b4fc;
  --a11y-wk-radius: 12px;
  --a11y-wk-font: 'Inter', sans-serif;
}

:root {
  --a11y-readable-font: 'Lexend', sans-serif;  /* font used by readableFont */
  --a11y-link-color: #b00020;                  /* colour used by highlightLinks */
  --a11y-contrast-filter: contrast(1.25);
}
```

The package doesn't load any web fonts. If you want Lexend, Atkinson Hyperlegible or OpenDyslexic, load the font yourself and set `--a11y-readable-font`.

You can also skip `styles.css` entirely and write your own rules against the `data-a11y-*` attributes and the `.a11y-wk-*` classes.

## Server-side rendering

`createA11y` and `mountA11yWidget` are no-ops for the DOM on the server. `<A11yProvider>` uses `getServerState()` (the defaults) during hydration. It then switches to the stored settings on the client.

To avoid a flash of default styles before hydration, add a small inline script to `<head>` that copies the stored settings onto `<html>`, or render the attributes on the server from a cookie.

## Keyboard

| Key | Action |
| --- | --- |
| `Alt` + `A` (configurable) | Open or close the dialog. On macOS this is `Option` + `A`. |
| `Tab` / `Shift` + `Tab` | Move through the controls. Focus is trapped inside the dialog. |
| `Space` / `Enter` | Activate a switch or option. |
| `Esc` | Close the dialog and return focus. |

## Browser support

Current versions of Chrome, Edge, Firefox and Safari. The output targets ES2019.

## Development

```bash
npm install
npm run dev          # rebuild on change
npm test             # vitest + jsdom + axe-core
npm run verify       # typecheck, lint, test, build, publint and attw: everything CI runs
```

Open `examples/vanilla.html` after `npm run build` to try the widget in a browser.

## Publishing (maintainers)

1. Run `npm run verify` and make sure it passes.
2. Run `npm version patch|minor|major`, update `CHANGELOG.md`, then `git push --follow-tags`.
3. Create a GitHub Release for the tag. The `release.yml` workflow then runs `npm publish --provenance`.

The release workflow needs one of the following:
- npm **Trusted Publishing**, configured for this repo on npmjs.com, or
- an `NPM_TOKEN` repository secret.

## License

[MIT](LICENSE)
