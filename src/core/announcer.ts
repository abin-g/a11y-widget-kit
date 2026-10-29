export interface Announcer {
  announce(message: string): void;
  destroy(): void;
}

const CLEAR_AFTER_MS = 3000;

/** Polite aria-live region that screen readers read out without moving focus. */
export function createAnnouncer(): Announcer {
  if (typeof document === 'undefined') {
    return { announce() {}, destroy() {} };
  }

  let region: HTMLElement | null = null;
  let setTimer: ReturnType<typeof setTimeout> | undefined;
  let clearTimer: ReturnType<typeof setTimeout> | undefined;

  const ensureRegion = () => {
    if (region && region.isConnected) return region;
    region = document.createElement('div');
    region.className = 'a11y-wk-sr-only';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
    return region;
  };

  return {
    announce(message) {
      const node = ensureRegion();
      clearTimeout(setTimer);
      clearTimeout(clearTimer);
      // Clearing first makes screen readers repeat identical consecutive messages.
      node.textContent = '';
      setTimer = setTimeout(() => {
        node.textContent = message;
        clearTimer = setTimeout(() => {
          node.textContent = '';
        }, CLEAR_AFTER_MS);
      }, 50);
    },
    destroy() {
      clearTimeout(setTimer);
      clearTimeout(clearTimer);
      region?.remove();
      region = null;
    },
  };
}
