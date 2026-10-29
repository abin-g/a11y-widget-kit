import { afterEach } from 'vitest';

// jsdom has no canvas; axe-core probes it for icon-font detection and logs noise otherwise.
HTMLCanvasElement.prototype.getContext = (() => null) as never;

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  for (const attr of [...document.documentElement.attributes]) {
    if (attr.name.startsWith('data-a11y-')) document.documentElement.removeAttribute(attr.name);
  }
  document.documentElement.removeAttribute('style');
});
