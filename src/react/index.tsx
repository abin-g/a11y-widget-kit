import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type SVGProps,
} from 'react';
import { createA11y } from '../core/store';
import type { A11yInstance, A11yOptions, A11yState, SettingValue, TranslationVars } from '../core/types';
import { ACCESSIBILITY_ICON_BODY, ACCESSIBILITY_ICON_RING } from '../ui/icon';
import { mountA11yWidget, type WidgetController, type WidgetOptions } from '../ui/widget';

const A11yContext = createContext<A11yInstance | null>(null);

export interface A11yProviderProps {
  /** Store options. Read once, on first render. */
  options?: A11yOptions;
  /** Use a store you created yourself with `createA11y()` instead. */
  instance?: A11yInstance;
  children?: ReactNode;
}

export function A11yProvider({ options, instance, children }: A11yProviderProps) {
  const [a11y] = useState(() => instance ?? createA11y(options));
  return <A11yContext.Provider value={a11y}>{children}</A11yContext.Provider>;
}

/** The raw store, for advanced use. */
export function useA11yInstance(): A11yInstance {
  const a11y = useContext(A11yContext);
  if (!a11y) throw new Error('useA11y must be used inside <A11yProvider>.');
  return a11y;
}

export interface UseA11yResult extends A11yState {
  set(id: string, value: SettingValue): void;
  toggle(id: string): void;
  reset(): void;
  announce(message: string): void;
  setLocale(locale: string): void;
  t(key: string, vars?: TranslationVars): string;
  instance: A11yInstance;
}

/** Current settings and locale; re-renders whenever either changes. */
export function useA11y(): UseA11yResult {
  const a11y = useA11yInstance();
  const state = useSyncExternalStore(a11y.subscribe, a11y.getState, a11y.getServerState);
  return useMemo(
    () => ({
      ...state,
      set: a11y.set,
      toggle: a11y.toggle,
      reset: a11y.reset,
      announce: a11y.announce,
      setLocale: a11y.setLocale,
      t: a11y.t,
      instance: a11y,
    }),
    [state, a11y],
  );
}

/** Renders the floating button and dialog. The ref exposes `open()`, `close()` and `toggle()`. */
export const A11yWidget = forwardRef<WidgetController | null, WidgetOptions>(function A11yWidget(props, ref) {
  const a11y = useA11yInstance();
  const controller = useRef<WidgetController | null>(null);
  const latestProps = useRef(props);
  latestProps.current = props;

  useEffect(() => {
    const widget = mountA11yWidget(a11y, latestProps.current);
    controller.current = widget;
    return () => {
      widget.destroy();
      controller.current = null;
    };
  }, [a11y]);

  const { position, offset, shortcut, showLabel, icon, renderTrigger, zIndex, theme, closeOnBackdrop, className } =
    props;
  const offsetX = offset?.x;
  const offsetY = offset?.y;
  useEffect(() => {
    controller.current?.update({
      position,
      offset: { x: offsetX, y: offsetY },
      shortcut,
      showLabel,
      icon,
      renderTrigger,
      zIndex,
      theme,
      closeOnBackdrop,
      className,
      onOpenChange: (open) => latestProps.current.onOpenChange?.(open),
    });
  }, [position, offsetX, offsetY, shortcut, showLabel, icon, renderTrigger, zIndex, theme, closeOnBackdrop, className]);

  useImperativeHandle(
    ref,
    () => ({
      open: () => controller.current?.open(),
      close: () => controller.current?.close(),
      toggle: () => controller.current?.toggle(),
      isOpen: () => controller.current?.isOpen() ?? false,
      update: (next) => controller.current?.update(next),
      destroy: () => controller.current?.destroy(),
      get root() {
        return controller.current?.root ?? null;
      },
    }),
    [],
  );

  return null;
});

export function AccessibilityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      width="1em"
      height="1em"
      {...props}
    >
      <path fillRule="evenodd" d={ACCESSIBILITY_ICON_RING} />
      <circle cx="256" cy="122" r="36" />
      <path d={ACCESSIBILITY_ICON_BODY} />
    </svg>
  );
}

export * from '../index';
