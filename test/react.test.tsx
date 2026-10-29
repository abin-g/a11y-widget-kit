import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { A11yProvider, A11yWidget, useA11y, type WidgetController } from '../src/react';

function Status() {
  const { settings, toggle, t } = useA11y();
  return (
    <button type="button" onClick={() => toggle('highContrast')}>
      {t('feature.highContrast.label')}: {String(settings.highContrast)}
    </button>
  );
}

describe('React adapter', () => {
  it('re-renders when settings change from either side', () => {
    const widgetRef = createRef<WidgetController>();
    render(
      <A11yProvider options={{ locale: 'en' }}>
        <Status />
        <A11yWidget ref={widgetRef} position="bottom-right" />
      </A11yProvider>,
    );
    const button = screen.getByText(/High contrast mode/);
    expect(button.textContent).toBe('High contrast mode: false');
    act(() => button.click());
    expect(button.textContent).toBe('High contrast mode: true');

    act(() => widgetRef.current!.open());
    const control = document.querySelector<HTMLElement>('[data-feature="highContrast"]')!;
    expect(control.getAttribute('aria-checked')).toBe('true');
    act(() => control.click());
    expect(button.textContent).toBe('High contrast mode: false');
    expect(document.querySelector('.a11y-wk-pos-bottom-right')).not.toBeNull();
  });

  it('throws a helpful error outside the provider', () => {
    expect(() => render(<Status />)).toThrow(/A11yProvider/);
  });
});
