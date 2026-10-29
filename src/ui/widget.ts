import type { A11yInstance, FeatureDefinition } from '../core/types';
import { GLYPHS, widgetIconSvg, type WidgetIconName } from './icon';
import { isEditable, matchesShortcut, parseShortcut, trapTab, type Shortcut } from './keyboard';

export type WidgetPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
export type WidgetTheme = 'light' | 'dark' | 'auto';
export type WidgetIcon = WidgetIconName | (() => SVGElement);

export interface WidgetOptions {
  /** Corner of the floating trigger button. Default `'bottom-left'`. */
  position?: WidgetPosition;
  /** Distance from the corner. Numbers are pixels; strings are any CSS length. Default `24`. */
  offset?: { x?: number | string; y?: number | string };
  /** Keyboard shortcut that toggles the panel, e.g. `'alt+a'`. `false` disables it. Default `'alt+a'`. */
  shortcut?: string | false;
  /** Show the text label next to the icon on wider screens. Default `true`. */
  showLabel?: boolean;
  /** Built-in icon name, or a factory that returns a fresh SVG element. Default `'accessibility'`. */
  icon?: WidgetIcon;
  /** Render the floating trigger button. Set `false` to open the panel from your own button. Default `true`. */
  renderTrigger?: boolean;
  /** Element the widget is appended to. Default `document.body`. */
  container?: HTMLElement;
  zIndex?: number;
  /** Colour scheme of the panel. Default `'light'`. */
  theme?: WidgetTheme;
  /** Close the panel when the backdrop is clicked. Default `true`. */
  closeOnBackdrop?: boolean;
  /** Extra class name on the widget root, for scoping your own theme variables. */
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export interface WidgetController {
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
  /** Change options after mounting, e.g. move the trigger when a page has a bottom bar. */
  update(options: Partial<WidgetOptions>): void;
  destroy(): void;
  readonly root: HTMLElement | null;
}

type ResolvedOptions = WidgetOptions &
  Required<Pick<WidgetOptions, 'position' | 'shortcut' | 'showLabel' | 'renderTrigger' | 'theme' | 'closeOnBackdrop'>>;

const DEFAULT_OFFSET = 24;

const DEFAULTS: ResolvedOptions = {
  position: 'bottom-left',
  shortcut: 'alt+a',
  showLabel: true,
  icon: 'accessibility',
  renderTrigger: true,
  theme: 'light',
  closeOnBackdrop: true,
};

let instanceCount = 0;

type Attrs = Record<string, string | undefined>;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, children: (Node | string)[] = []) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined) continue;
    if (name === 'class') node.className = value;
    else node.setAttribute(name, value);
  }
  node.append(...children);
  return node;
}

/** Builds a node from one of the package's own static SVG strings (never from user input). */
function svg(markup: string): Node {
  const template = document.createElement('template');
  template.innerHTML = markup;
  return template.content.firstChild as Node;
}

function widgetIcon(icon: WidgetIcon, className = 'a11y-wk-icon'): Node {
  if (typeof icon === 'function') {
    const element = icon();
    element.classList.add(className);
    element.setAttribute('aria-hidden', 'true');
    element.setAttribute('focusable', 'false');
    return element;
  }
  return svg(widgetIconSvg(icon, className));
}

/** Drops `undefined` entries so unset options (e.g. React props) never override defaults. */
function defined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

const toLength = (value: number | string | undefined, fallback: number) =>
  value === undefined ? `${fallback}px` : typeof value === 'number' ? `${value}px` : value;

const noopController: WidgetController = {
  open() {},
  close() {},
  toggle() {},
  isOpen: () => false,
  update() {},
  destroy() {},
  root: null,
};

/**
 * Mounts the floating accessibility button and preferences dialog. Framework-agnostic: it only
 * needs a store from `createA11y()`. Safe to call during SSR (returns a no-op controller).
 */
export function mountA11yWidget(a11y: A11yInstance, options: WidgetOptions = {}): WidgetController {
  if (typeof document === 'undefined') return noopController;

  let opts: ResolvedOptions = { ...DEFAULTS, ...defined(options) };
  let shortcut: Shortcut | null = opts.shortcut ? parseShortcut(opts.shortcut) : null;
  const uid = `a11y-wk-${++instanceCount}`;
  const root = el('div');
  (opts.container ?? document.body).appendChild(root);

  let trigger: HTMLButtonElement | null = null;
  let backdrop: HTMLElement | null = null;
  let panel: HTMLElement | null = null;
  let isOpen = false;
  let returnFocusTo: HTMLElement | null = null;
  let lastLocale = a11y.getLocale();

  const t = a11y.t;

  function applyRootOptions() {
    root.className = ['a11y-wk-root', `a11y-wk-theme-${opts.theme}`, opts.className].filter(Boolean).join(' ');
    root.setAttribute('lang', a11y.getLocale());
    root.setAttribute('dir', a11y.getDir());
    if (opts.zIndex !== undefined) root.style.setProperty('--a11y-wk-z', String(opts.zIndex));
    else root.style.removeProperty('--a11y-wk-z');
  }

  function renderTrigger() {
    trigger?.parentElement?.remove();
    trigger = null;
    if (!opts.renderTrigger) return;

    const label = shortcut
      ? `${t('trigger.ariaLabel')} (${t('trigger.shortcutHint', { shortcut: shortcut.label })})`
      : t('trigger.ariaLabel');
    const button = el(
      'button',
      {
        type: 'button',
        class: 'a11y-wk-trigger',
        'aria-haspopup': 'dialog',
        'aria-expanded': String(isOpen),
        'aria-label': label,
        title: label,
      },
      [widgetIcon(opts.icon ?? 'accessibility')],
    );
    if (opts.showLabel) button.append(el('span', { class: 'a11y-wk-trigger-label' }, [t('trigger.label')]));
    button.addEventListener('click', () => toggle());

    const wrap = el('div', { class: `a11y-wk-trigger-wrap a11y-wk-pos-${opts.position}` }, [button]);
    wrap.style.setProperty('--a11y-wk-offset-x', toLength(opts.offset?.x, DEFAULT_OFFSET));
    wrap.style.setProperty('--a11y-wk-offset-y', toLength(opts.offset?.y, DEFAULT_OFFSET));
    root.prepend(wrap);
    trigger = button;
  }

  function renderToggle(feature: FeatureDefinition, labelId: string, descId: string | undefined) {
    const button = el(
      'button',
      {
        type: 'button',
        role: 'switch',
        class: 'a11y-wk-switch',
        'aria-checked': String(a11y.get(feature.id) === true),
        'aria-labelledby': labelId,
        'aria-describedby': descId,
        'data-feature': feature.id,
        'data-focus-key': `f:${feature.id}`,
      },
      [el('span', { class: 'a11y-wk-switch-thumb', 'aria-hidden': 'true' })],
    );
    button.addEventListener('click', () => {
      a11y.toggle(feature.id);
      const key = a11y.get(feature.id) ? 'announce.enabled' : 'announce.disabled';
      a11y.announce(t(key, { feature: a11y.label(feature.id) }));
    });
    return button;
  }

  function renderSelect(feature: FeatureDefinition, labelId: string, descId: string | undefined) {
    const group = el('div', {
      class: 'a11y-wk-options',
      role: 'group',
      'aria-labelledby': labelId,
      'aria-describedby': descId,
    });
    for (const option of feature.options ?? []) {
      const button = el(
        'button',
        {
          type: 'button',
          class: 'a11y-wk-option',
          'aria-pressed': String(a11y.get(feature.id) === option.value),
          'data-feature': feature.id,
          'data-value': option.value,
          'data-focus-key': `f:${feature.id}:${option.value}`,
        },
        [a11y.label(feature.id, option.value)],
      );
      button.addEventListener('click', () => {
        a11y.set(feature.id, option.value);
        a11y.announce(
          t('announce.changed', { feature: a11y.label(feature.id), value: a11y.label(feature.id, option.value) }),
        );
      });
      group.append(button);
    }
    return group;
  }

  function renderRow(feature: FeatureDefinition) {
    const labelId = `${uid}-${feature.id}-label`;
    const description = a11y.description(feature.id);
    const descId = description ? `${uid}-${feature.id}-desc` : undefined;
    const text = el('div', { class: 'a11y-wk-row-text' }, [
      el('p', { class: 'a11y-wk-row-label', id: labelId }, [a11y.label(feature.id)]),
    ]);
    if (description) text.append(el('p', { class: 'a11y-wk-row-desc', id: descId }, [description]));

    const isSelect = feature.type === 'select';
    return el('div', { class: `a11y-wk-row${isSelect ? ' a11y-wk-row-stacked' : ''}` }, [
      text,
      isSelect ? renderSelect(feature, labelId, descId) : renderToggle(feature, labelId, descId),
    ]);
  }

  function renderSections() {
    const sections = new Map<string, FeatureDefinition[]>();
    for (const feature of a11y.getFeatures()) {
      if (feature.hidden) continue;
      const list = sections.get(feature.section) ?? [];
      list.push(feature);
      sections.set(feature.section, list);
    }
    return [...sections].map(([section, features]) => {
      const headingId = `${uid}-section-${section}`;
      const glyph = (GLYPHS as Record<string, string>)[section];
      const heading = el('h3', { class: 'a11y-wk-section-title', id: headingId }, [t(`section.${section}`)]);
      if (glyph) heading.prepend(svg(glyph));
      return el('section', { class: 'a11y-wk-section', 'aria-labelledby': headingId }, [
        heading,
        el('div', { class: 'a11y-wk-list' }, features.map(renderRow)),
      ]);
    });
  }

  function renderDialog() {
    const titleId = `${uid}-title`;
    const subtitleId = `${uid}-subtitle`;

    const closeButton = el(
      'button',
      { type: 'button', class: 'a11y-wk-icon-button', 'aria-label': t('dialog.close'), 'data-focus-key': 'close' },
      [svg(GLYPHS.close)],
    );
    closeButton.addEventListener('click', () => close());

    const resetButton = el('button', { type: 'button', class: 'a11y-wk-link-button', 'data-focus-key': 'reset' }, [
      svg(GLYPHS.reset),
      t('dialog.reset'),
    ]);
    resetButton.addEventListener('click', () => a11y.reset());

    const doneButton = el('button', { type: 'button', class: 'a11y-wk-primary-button', 'data-focus-key': 'done' }, [
      t('dialog.done'),
    ]);
    doneButton.addEventListener('click', () => close());

    const panelEl = el(
      'div',
      {
        class: 'a11y-wk-panel',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': titleId,
        'aria-describedby': subtitleId,
        tabindex: '-1',
      },
      [
        el('div', { class: 'a11y-wk-header' }, [
          el('div', { class: 'a11y-wk-header-main' }, [
            el('div', { class: 'a11y-wk-badge' }, [widgetIcon(opts.icon ?? 'accessibility')]),
            el('div', {}, [
              el('h2', { class: 'a11y-wk-title', id: titleId }, [t('dialog.title')]),
              el('p', { class: 'a11y-wk-subtitle', id: subtitleId }, [t('dialog.subtitle')]),
            ]),
          ]),
          closeButton,
        ]),
        el('div', { class: 'a11y-wk-body' }, renderSections()),
        el('div', { class: 'a11y-wk-footer' }, [resetButton, doneButton]),
      ],
    );
    panelEl.addEventListener('keydown', (event) => trapTab(event, panelEl));

    const backdropEl = el('div', { class: 'a11y-wk-backdrop' }, [panelEl]);
    backdropEl.addEventListener('click', (event) => {
      if (event.target === backdropEl && opts.closeOnBackdrop) close();
    });
    return { backdropEl, panelEl };
  }

  function syncControls() {
    if (!panel) return;
    panel.querySelectorAll<HTMLElement>('[data-feature]').forEach((node) => {
      const value = a11y.get(node.dataset.feature as string);
      if (node.dataset.value !== undefined) node.setAttribute('aria-pressed', String(value === node.dataset.value));
      else node.setAttribute('aria-checked', String(value === true));
    });
  }

  function rerenderDialog() {
    if (!backdrop || !panel) return;
    const active = document.activeElement as HTMLElement | null;
    const focusKey = active && panel.contains(active) ? active.dataset.focusKey : undefined;
    const { backdropEl, panelEl } = renderDialog();
    backdrop.replaceWith(backdropEl);
    backdrop = backdropEl;
    panel = panelEl;
    const restore = focusKey ? panel.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`) : null;
    (restore ?? panel).focus();
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const { backdropEl, panelEl } = renderDialog();
    backdrop = backdropEl;
    panel = panelEl;
    root.append(backdropEl);
    trigger?.setAttribute('aria-expanded', 'true');
    panelEl.focus();
    opts.onOpenChange?.(true);
  }

  function close(restoreFocus = true) {
    if (!isOpen) return;
    isOpen = false;
    backdrop?.remove();
    backdrop = null;
    panel = null;
    trigger?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) {
      const previous =
        returnFocusTo && returnFocusTo !== document.body && returnFocusTo.isConnected ? returnFocusTo : null;
      (previous ?? trigger)?.focus();
      a11y.announce(t('announce.closed'));
    }
    returnFocusTo = null;
    opts.onOpenChange?.(false);
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (isOpen && event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (shortcut && matchesShortcut(event, shortcut) && !isEditable(event.target)) {
      event.preventDefault();
      toggle();
    }
  }

  const unsubscribe = a11y.subscribe((state) => {
    if (state.locale === lastLocale) {
      syncControls();
      return;
    }
    lastLocale = state.locale;
    applyRootOptions();
    renderTrigger();
    rerenderDialog();
  });

  document.addEventListener('keydown', onKeyDown);
  applyRootOptions();
  renderTrigger();

  return {
    open,
    close: () => close(),
    toggle,
    isOpen: () => isOpen,
    update(next) {
      opts = { ...opts, ...defined(next) };
      if (next.shortcut !== undefined) shortcut = opts.shortcut ? parseShortcut(opts.shortcut) : null;
      applyRootOptions();
      renderTrigger();
      if (next.icon !== undefined && isOpen) rerenderDialog();
    },
    destroy() {
      close(false);
      unsubscribe();
      document.removeEventListener('keydown', onKeyDown);
      root.remove();
    },
    root,
  };
}
