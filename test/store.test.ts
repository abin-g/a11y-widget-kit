import { describe, expect, it, vi } from 'vitest';
import { createA11y, DEFAULT_STORAGE_KEY } from '../src';

const html = () => document.documentElement;

describe('createA11y', () => {
  it('starts from built-in defaults and applies data attributes', () => {
    const a11y = createA11y();
    expect(a11y.getSettings()).toEqual({
      highContrast: false,
      fontScale: 'normal',
      readableFont: false,
      highlightLinks: false,
      visualAlerts: true,
      reducedMotion: false,
    });
    expect(html().getAttribute('data-a11y-high-contrast')).toBe('false');
    expect(html().getAttribute('data-a11y-font-scale')).toBe('normal');
    expect(html().hasAttribute('data-a11y-visual-alerts')).toBe(false);
  });

  it('persists changes and restores them in a new instance', () => {
    createA11y().set('highContrast', true);
    expect(JSON.parse(localStorage.getItem(DEFAULT_STORAGE_KEY)!).highContrast).toBe(true);
    expect(createA11y().get('highContrast')).toBe(true);
  });

  it('ignores corrupted or invalid stored values', () => {
    localStorage.setItem(DEFAULT_STORAGE_KEY, '{not json');
    expect(createA11y().get('fontScale')).toBe('normal');
    localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ fontScale: 'huge', highContrast: 'yes', readableFont: true }));
    const a11y = createA11y();
    expect(a11y.get('fontScale')).toBe('normal');
    expect(a11y.get('highContrast')).toBe(false);
    expect(a11y.get('readableFont')).toBe(true);
  });

  it('works without storage', () => {
    const a11y = createA11y({ storage: false });
    a11y.set('readableFont', true);
    expect(localStorage.length).toBe(0);
  });

  it('sets the font scale CSS variable', () => {
    const a11y = createA11y();
    a11y.set('fontScale', 'xlarge');
    expect(html().style.getPropertyValue('--a11y-font-scale')).toBe('1.3');
    a11y.set('fontScale', 'normal');
    expect(html().style.getPropertyValue('--a11y-font-scale')).toBe('');
  });

  it('cycles select features on toggle and rejects invalid values', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const a11y = createA11y();
    a11y.toggle('fontScale');
    expect(a11y.get('fontScale')).toBe('large');
    a11y.set('fontScale', 'giant');
    a11y.set('nope', true);
    expect(a11y.get('fontScale')).toBe('large');
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('resets to defaults and notifies subscribers and onChange', () => {
    const onChange = vi.fn();
    const a11y = createA11y({ onChange, defaults: { fontScale: 'large' } });
    const listener = vi.fn();
    a11y.subscribe(listener);
    a11y.set('highContrast', true);
    expect(listener).toHaveBeenLastCalledWith(a11y.getState(), { id: 'highContrast', value: true });
    a11y.reset();
    expect(a11y.getSettings()).toMatchObject({ highContrast: false, fontScale: 'large' });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('returns a new state object only when something changes', () => {
    const a11y = createA11y();
    const before = a11y.getState();
    a11y.set('highContrast', false);
    expect(a11y.getState()).toBe(before);
    a11y.set('highContrast', true);
    expect(a11y.getState()).not.toBe(before);
  });

  it('supports a subset of features, custom features and custom font scales', () => {
    const apply = vi.fn();
    const a11y = createA11y({
      features: [
        'fontScale',
        { id: 'grayscale', type: 'toggle', section: 'visual', default: false, label: 'Grayscale', apply },
        { id: 'highContrast', hidden: true },
      ],
      fontScales: [
        { value: 'normal', scale: 1 },
        { value: 'huge', scale: 2, label: 'Huge' },
      ],
    });
    expect(a11y.getFeatures().map((f) => f.id)).toEqual(['fontScale', 'grayscale', 'highContrast']);
    expect(apply).toHaveBeenCalledWith(false, html());
    a11y.set('grayscale', true);
    expect(html().getAttribute('data-a11y-grayscale')).toBe('true');
    expect(a11y.label('grayscale')).toBe('Grayscale');
    expect(a11y.label('fontScale', 'normal')).toBe('100%');
    expect(a11y.label('fontScale', 'huge')).toBe('Huge');
  });

  it('seeds defaults from system preferences', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduced-motion') }));
    expect(createA11y().get('reducedMotion')).toBe(true);
    expect(createA11y({ respectSystemPreferences: false }).get('reducedMotion')).toBe(false);
    vi.unstubAllGlobals();
  });

  it('applies to a custom target and cleans up on destroy', () => {
    const target = document.createElement('main');
    const a11y = createA11y({ target });
    expect(target.getAttribute('data-a11y-reduced-motion')).toBe('false');
    expect(html().hasAttribute('data-a11y-reduced-motion')).toBe(false);
    a11y.destroy();
    expect(target.hasAttribute('data-a11y-reduced-motion')).toBe(false);
  });

  it('announces messages through a polite live region', () => {
    vi.useFakeTimers();
    const a11y = createA11y();
    a11y.announce('Hello');
    vi.advanceTimersByTime(60);
    const region = document.querySelector('[aria-live="polite"]');
    expect(region?.textContent).toBe('Hello');
    vi.advanceTimersByTime(3000);
    expect(region?.textContent).toBe('');
    vi.useRealTimers();
  });
});
