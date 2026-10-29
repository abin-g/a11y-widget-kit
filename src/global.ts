// Entry for the <script>/CDN build: registers every bundled locale up front.
import { registerLocale } from './i18n';
import { allLocales } from './i18n/locales/all';

registerLocale(...allLocales);

export * from './index';
export { allLocales as locales };
