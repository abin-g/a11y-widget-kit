import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { createA11y, mountA11yWidget } from '../src';
import { ar } from '../src/i18n/locales/ar';

const key = (init: KeyboardEventInit) => document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
const trigger = () => document.querySelector<HTMLButtonElement>('.a11y-wk-trigger')!;
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');

function setup(options = {}) {
  const a11y = createA11y({ locale: 'en' });
  const widget = mountA11yWidget(a11y, options);
  return { a11y, widget };
}

describe('mountA11yWidget', () => {
  it('renders a labelled trigger that opens and closes the dialog', () => {
    const onOpenChange = vi.fn();
    setup({ onOpenChange });
    expect(trigger().getAttribute('aria-label')).toBe('Open accessibility menu (Shortcut: Alt + A)');
    trigger().click();
    expect(dialog()).not.toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(dialog());
    key({ key: 'Escape' });
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(trigger());
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it('supports built-in and caller-provided SVG icons', () => {
    const customIcon = vi.fn(() => {
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      return icon;
    });
    const { widget } = setup({ icon: customIcon });
    const triggerIcon = trigger().querySelector('svg')!;
    expect(triggerIcon.classList.contains('a11y-wk-icon')).toBe(true);
    expect(triggerIcon.getAttribute('aria-hidden')).toBe('true');
    expect(customIcon).toHaveBeenCalledTimes(1);

    widget.open();
    expect(dialog()!.querySelector('.a11y-wk-badge svg')).not.toBeNull();
    expect(customIcon).toHaveBeenCalledTimes(2);

    widget.update({ icon: 'eye' });
    expect(trigger().querySelector('svg path')?.getAttribute('d')).toContain('M2 12');
    expect(dialog()!.querySelector('.a11y-wk-badge svg path')?.getAttribute('d')).toContain('M2 12');
  });

  it('toggles with Alt+A using event.code (macOS types å) but not with Cmd+A', () => {
    setup();
    key({ key: 'å', code: 'KeyA', altKey: true });
    expect(dialog()).not.toBeNull();
    key({ key: 'a', code: 'KeyA', altKey: true });
    expect(dialog()).toBeNull();
    key({ key: 'a', code: 'KeyA', metaKey: true });
    expect(dialog()).toBeNull();
  });

  it('ignores the shortcut while typing', () => {
    setup();
    const input = document.body.appendChild(document.createElement('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', altKey: true, bubbles: true }));
    expect(dialog()).toBeNull();
  });

  it('updates the store from switches and option buttons', () => {
    const { a11y, widget } = setup();
    widget.open();
    const contrast = dialog()!.querySelector<HTMLElement>('[data-feature="highContrast"]')!;
    contrast.click();
    expect(a11y.get('highContrast')).toBe(true);
    expect(contrast.getAttribute('aria-checked')).toBe('true');

    const large = dialog()!.querySelector<HTMLElement>('[data-feature="fontScale"][data-value="large"]')!;
    large.click();
    expect(a11y.get('fontScale')).toBe('large');
    expect(large.getAttribute('aria-pressed')).toBe('true');

    a11y.set('highContrast', false);
    expect(contrast.getAttribute('aria-checked')).toBe('false');
  });

  it('traps Tab focus inside the dialog', () => {
    const { widget } = setup();
    widget.open();
    const panel = dialog()!;
    const buttons = panel.querySelectorAll<HTMLElement>('button');
    const last = buttons[buttons.length - 1];
    last.focus();
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(buttons[0]);
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(last);
  });

  it('re-renders texts and direction when the locale changes, keeping focus', () => {
    const a11y = createA11y({ locale: 'en', locales: [ar] });
    const widget = mountA11yWidget(a11y);
    widget.open();
    dialog()!.querySelector<HTMLElement>('[data-focus-key="done"]')!.focus();
    a11y.setLocale('ar');
    const root = widget.root!;
    expect(root.getAttribute('dir')).toBe('rtl');
    expect(root.getAttribute('lang')).toBe('ar');
    expect(root.querySelector('.a11y-wk-title')!.textContent).toBe('تفضيلات إمكانية الوصول');
    expect(document.activeElement?.getAttribute('data-focus-key')).toBe('done');
  });

  it('falls back to English for a locale that was not loaded', () => {
    const { a11y } = setup();
    a11y.setLocale('ar-EG');
    expect(a11y.getLocale()).toBe('en');
  });

  it('supports headless mode, positioning and destroy', () => {
    const { widget } = setup({ renderTrigger: false, position: 'top-right' });
    expect(trigger()).toBeNull();
    widget.update({ renderTrigger: true, position: 'top-right', offset: { x: 10, y: '2rem' } });
    const wrap = document.querySelector<HTMLElement>('.a11y-wk-trigger-wrap')!;
    expect(wrap.classList.contains('a11y-wk-pos-top-right')).toBe(true);
    expect(wrap.style.getPropertyValue('--a11y-wk-offset-x')).toBe('10px');
    expect(wrap.style.getPropertyValue('--a11y-wk-offset-y')).toBe('2rem');
    widget.destroy();
    expect(document.querySelector('.a11y-wk-root')).toBeNull();
  });

  it('has no axe violations when open', async () => {
    const { widget } = setup();
    widget.open();
    const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
