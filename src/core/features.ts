import type { FeatureDefinition, FeatureInput, FontScaleStep } from './types';

export const FONT_SCALE_PROPERTY = '--a11y-font-scale';

export const DEFAULT_FONT_SCALES: FontScaleStep[] = [
  { value: 'normal', scale: 1, labelKey: 'feature.fontScale.option.normal' },
  { value: 'large', scale: 1.15, labelKey: 'feature.fontScale.option.large' },
  { value: 'xlarge', scale: 1.3, labelKey: 'feature.fontScale.option.xlarge' },
];

export const BUILT_IN_FEATURE_IDS = [
  'highContrast',
  'fontScale',
  'readableFont',
  'highlightLinks',
  'visualAlerts',
  'reducedMotion',
] as const;

export type BuiltInFeatureId = (typeof BUILT_IN_FEATURE_IDS)[number];

export function createBuiltInFeatures(fontScales: FontScaleStep[]): Record<BuiltInFeatureId, FeatureDefinition> {
  const steps = fontScales.length ? fontScales : DEFAULT_FONT_SCALES;
  return {
    highContrast: { id: 'highContrast', type: 'toggle', section: 'visual', default: false },
    fontScale: {
      id: 'fontScale',
      type: 'select',
      section: 'visual',
      default: steps[0].value,
      options: steps.map((step) => ({
        value: step.value,
        label: step.label ?? (step.labelKey ? undefined : `${Math.round(step.scale * 100)}%`),
        labelKey: step.labelKey,
        vars: { percent: Math.round(step.scale * 100) },
      })),
      apply(value, target) {
        const step = steps.find((s) => s.value === value);
        if (step && step.scale !== 1) target.style.setProperty(FONT_SCALE_PROPERTY, String(step.scale));
        else target.style.removeProperty(FONT_SCALE_PROPERTY);
      },
    },
    readableFont: { id: 'readableFont', type: 'toggle', section: 'visual', default: false },
    highlightLinks: { id: 'highlightLinks', type: 'toggle', section: 'visual', default: false },
    // Exposed as a setting for the host app to read; it has no visual effect of its own.
    visualAlerts: { id: 'visualAlerts', type: 'toggle', section: 'hearing', default: true, attribute: false },
    reducedMotion: { id: 'reducedMotion', type: 'toggle', section: 'motor', default: false },
  };
}

export function toKebab(id: string): string {
  return id.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function attributeName(feature: FeatureDefinition): string | null {
  if (feature.attribute === false) return null;
  return `data-a11y-${feature.attribute ?? toKebab(feature.id)}`;
}

export function resolveFeatures(inputs: FeatureInput[] | undefined, fontScales: FontScaleStep[]): FeatureDefinition[] {
  const builtIns = createBuiltInFeatures(fontScales);
  const list = inputs ?? [...BUILT_IN_FEATURE_IDS];
  const seen = new Set<string>();
  const resolved: FeatureDefinition[] = [];

  for (const input of list) {
    const partial = typeof input === 'string' ? { id: input } : input;
    if (seen.has(partial.id)) continue;
    const base = (builtIns as Record<string, FeatureDefinition | undefined>)[partial.id];
    const feature = { ...base, ...partial } as FeatureDefinition;

    if (!feature.type || !feature.section || feature.default === undefined) {
      warn(`Feature "${partial.id}" is not built in and needs "type", "section" and "default".`);
      continue;
    }
    if (feature.type === 'select' && !feature.options?.length) {
      warn(`Select feature "${feature.id}" needs at least one option.`);
      continue;
    }
    seen.add(feature.id);
    resolved.push(feature);
  }
  return resolved;
}

export function isValidValue(feature: FeatureDefinition, value: unknown): boolean {
  if (feature.type === 'toggle') return typeof value === 'boolean';
  return typeof value === 'string' && !!feature.options?.some((o) => o.value === value);
}

export function warn(message: string): void {
  if (typeof console !== 'undefined') console.warn(`[a11y-widget-kit] ${message}`);
}
