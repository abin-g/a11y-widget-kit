import { copyFile } from 'node:fs/promises';
import { defineConfig } from 'tsup';

const LOCALES = ['en', 'es', 'fr', 'de', 'ar', 'hi', 'ta', 'zh'];

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      react: 'src/react/index.tsx',
      ...Object.fromEntries(LOCALES.map((code) => [`locales/${code}`, `src/i18n/locales/${code}.ts`])),
    },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: true,
    sourcemap: true,
    treeshake: true,
    target: 'es2019',
    external: ['react', 'react/jsx-runtime'],
    async onSuccess() {
      await copyFile('src/styles.css', 'dist/styles.css');
    },
  },
  {
    // Drop-in <script> build for CDNs: exposes window.A11yWidgetKit with every locale registered.
    entry: { 'a11y-widget-kit': 'src/global.ts' },
    format: ['iife'],
    globalName: 'A11yWidgetKit',
    minify: true,
    sourcemap: true,
    target: 'es2019',
    outExtension: () => ({ js: '.global.js' }),
  },
]);
