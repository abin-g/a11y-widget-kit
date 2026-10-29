const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true',
  );
}

/** Keeps Tab / Shift+Tab cycling inside `container`. Call from a keydown handler. */
export function trapTab(event: KeyboardEvent, container: HTMLElement): void {
  if (event.key !== 'Tab') return;
  const focusable = getFocusable(container);
  if (!focusable.length) {
    event.preventDefault();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = container.ownerDocument.activeElement;
  const outside = !active || !container.contains(active);

  if (event.shiftKey && (active === first || active === container || outside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || outside)) {
    event.preventDefault();
    first.focus();
  }
}

export interface Shortcut {
  alt: boolean;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
  key: string;
  code?: string;
  label: string;
}

/** Parses strings such as `alt+a`, `ctrl+shift+u` or `meta+.`. */
export function parseShortcut(input: string): Shortcut {
  const parts = input.toLowerCase().split('+').map((p) => p.trim()).filter(Boolean);
  const key = parts.pop() ?? '';
  const has = (...names: string[]) => parts.some((p) => names.includes(p));
  // Matching letters and digits by `event.code` keeps Alt+A working on macOS, where Option+A types "å".
  const code = /^[a-z]$/.test(key) ? `Key${key.toUpperCase()}` : /^[0-9]$/.test(key) ? `Digit${key}` : undefined;
  const label = [...parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)), key.toUpperCase()].join(' + ');
  return {
    alt: has('alt', 'option'),
    ctrl: has('ctrl', 'control'),
    shift: has('shift'),
    meta: has('meta', 'cmd', 'command'),
    key,
    code,
    label,
  };
}

export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  if (
    event.altKey !== shortcut.alt ||
    event.ctrlKey !== shortcut.ctrl ||
    event.shiftKey !== shortcut.shift ||
    event.metaKey !== shortcut.meta
  ) {
    return false;
  }
  if (shortcut.code && event.code === shortcut.code) return true;
  return (event.key ?? '').toLowerCase() === shortcut.key;
}

export function isEditable(target: EventTarget | null): boolean {
  if (!target || !(target as HTMLElement).tagName) return false;
  const el = target as HTMLElement;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return true;
  const editable = el.closest?.('[contenteditable]')?.getAttribute('contenteditable');
  return el.isContentEditable || (editable != null && editable !== 'false');
}
