# Changelog

All notable changes to this project are documented here. This project follows [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-10-29

### Added
- Framework-agnostic store `createA11y()` with persistence, system-preference seeding, subscriptions and SSR snapshots.
- Floating widget `mountA11yWidget()`, which includes a focus trap, a configurable shortcut, positioning, themes and headless mode.
- Built-in features: high contrast, text scaling, readable font, highlight links, visual alerts and reduced motion. Custom features are also supported.
- i18n with runtime locale switching and RTL support. Bundled locales: en, es, fr, de, ar, hi, ta, zh.
- React adapter: `A11yProvider`, `useA11y`, `A11yWidget` and `AccessibilityIcon`.
- CDN build exposing `window.A11yWidgetKit`.
