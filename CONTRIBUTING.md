# Contributing

Thanks for helping make the web more accessible!

## Setup

```bash
npm install
npm run verify   # typecheck, lint, tests, build and package checks
```

## Guidelines

- Every UI change must stay keyboard- and screen-reader-friendly. The axe test in `test/widget.test.ts` must keep passing.
- Add tests for new behaviour.
- Keep the core free of framework dependencies. Framework-specific code goes in an adapter, such as `src/react`.
- Never insert user-provided strings with `innerHTML`; use `textContent`.

## Translations

Locale files live in `src/i18n/locales/`. To add or improve a language:

1. Copy `en.ts` to `<code>.ts` and translate every value. Keep the `{placeholders}` exactly as they are.
2. Set `dir: 'rtl'` for right-to-left scripts.
3. Add it to `src/i18n/locales/all.ts` and to the `LOCALES` list in `tsup.config.ts`.
4. Run `npm test`. A test makes sure that every locale has every key.

We especially welcome reviews of the existing non-English locales from native speakers.

## Commits & releases

Use clear commit messages, for example `feat: …`, `fix: …` or `docs: …`. Maintainers handle versioning and publishing; see the README.
