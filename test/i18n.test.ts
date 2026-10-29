import { describe, expect, it, vi } from 'vitest';
import { createA11y, interpolate, registerLocale, resolveLocale } from '../src';
import { ar } from '../src/i18n/locales/ar';
import { ta } from '../src/i18n/locales/ta';
import { en } from '../src/i18n/locales/en';
import { allLocales } from '../src/i18n/locales/all';

describe('i18n', () => {
  it('interpolates variables and leaves unknown ones untouched', () => {
    expect(interpolate('{feature} set to {value} {x}', { feature: 'Text', value: 2 })).toBe('Text set to 2 {x}');
  });

  it('resolves exact, base-language, regional and fallback locales', () => {
    const available = ['en', 'ta', 'zh-tw'];
    expect(resolveLocale('ta', available)).toBe('ta');
    expect(resolveLocale('ta-IN', available)).toBe('ta');
    expect(resolveLocale('zh', available)).toBe('zh-tw');
    expect(resolveLocale('xx', available)).toBe('en');
  });

  it('follows the browser language when locale is auto', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ta-IN', 'en']);
    const a11y = createA11y({ locales: [ta] });
    expect(a11y.getLocale()).toBe('ta');
    expect(a11y.t('dialog.done')).toBe('முடிந்தது');
  });

  it('uses per-instance locales, overrides and English fallback', () => {
    const a11y = createA11y({
      locale: 'ar',
      locales: [{ ...ar, messages: { ...ar.messages, 'dialog.done': undefined as unknown as string } }],
      messages: { ar: { 'dialog.title': 'عنوان مخصص' } },
    });
    expect(a11y.getDir()).toBe('rtl');
    expect(a11y.t('dialog.title')).toBe('عنوان مخصص');
    expect(a11y.t('dialog.done')).toBe('Done');
    expect(a11y.t('missing.key')).toBe('missing.key');
  });

  it('switches locale at runtime and notifies subscribers', () => {
    registerLocale(ta);
    const a11y = createA11y({ locale: 'en' });
    const listener = vi.fn();
    a11y.subscribe(listener);
    a11y.setLocale('ta');
    expect(listener).toHaveBeenCalledOnce();
    expect(a11y.label('fontScale', 'large')).toBe('பெரியது (115%)');
  });

  it('ships every English key in every bundled locale', () => {
    const keys = Object.keys(en.messages).sort();
    for (const locale of allLocales) {
      expect(Object.keys(locale.messages).sort(), locale.code).toEqual(keys);
    }
  });
});
