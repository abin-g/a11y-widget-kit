/** Universal accessibility symbol (figure with outstretched arms inside a ring), drawn in `currentColor`. */
export const ACCESSIBILITY_ICON_RING =
  'M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm0 42c118.2 0 214 95.8 214 214s-95.8 214-214 214S42 374.2 42 256 137.8 42 256 42z';
export const ACCESSIBILITY_ICON_BODY =
  'M 256.0 178.0 C 273.0 178.0, 279.4 177.5, 302.0 174.0 C 324.6 170.5, 362.1 161.6, 378.0 159.0 C 393.9 156.4, 384.1 158.3, 388.0 160.0 C 391.9 161.7, 396.4 164.9, 399.0 168.0 C 401.6 171.1, 401.6 173.7, 402.0 177.0 C 402.4 180.3, 401.7 183.2, 401.0 186.0 C 400.3 188.8, 400.4 189.6, 398.0 192.0 C 395.6 194.4, 406.3 194.6, 388.0 199.0 C 369.7 203.4, 316.2 211.9, 299.0 216.0 C 281.8 220.1, 295.7 217.1, 295.0 221.0 C 294.3 224.9, 294.4 230.5, 295.0 237.0 C 295.6 243.5, 297.4 252.3, 298.0 256.0 C 298.6 259.7, 297.3 251.1, 298.0 257.0 C 298.7 262.9, 300.1 277.3, 302.0 288.0 C 303.9 298.7, 301.1 294.3, 308.0 315.0 C 314.9 335.7, 333.3 382.6, 339.0 400.0 C 344.7 417.4, 339.6 406.0, 339.0 409.0 C 338.4 412.0, 338.0 413.4, 336.0 416.0 C 334.0 418.6, 331.7 421.3, 328.0 423.0 C 324.3 424.7, 319.7 425.2, 316.0 425.0 C 312.3 424.8, 310.8 423.9, 308.0 422.0 C 305.2 420.1, 308.6 433.9, 301.0 415.0 C 293.4 396.1, 274.8 340.7, 267.0 320.0 C 259.2 299.3, 260.5 306.3, 259.0 303.0 C 257.5 299.7, 259.2 302.4, 259.0 302.0 C 258.8 301.6, 258.6 300.8, 258.0 301.0 C 257.4 301.2, 256.7 303.0, 256.0 303.0 C 255.3 303.0, 254.6 301.2, 254.0 301.0 C 253.4 300.8, 253.2 301.6, 253.0 302.0 C 252.8 302.4, 254.5 299.7, 253.0 303.0 C 251.5 306.3, 252.8 299.3, 245.0 320.0 C 237.2 340.7, 218.6 396.1, 211.0 415.0 C 203.4 433.9, 206.8 420.1, 204.0 422.0 C 201.2 423.9, 199.7 424.8, 196.0 425.0 C 192.3 425.2, 187.7 424.7, 184.0 423.0 C 180.3 421.3, 178.0 418.6, 176.0 416.0 C 174.0 413.4, 173.6 412.0, 173.0 409.0 C 172.4 406.0, 167.3 417.4, 173.0 400.0 C 178.7 382.6, 197.1 335.7, 204.0 315.0 C 210.9 294.3, 208.1 298.7, 210.0 288.0 C 211.9 277.3, 213.3 262.9, 214.0 257.0 C 214.7 251.1, 213.4 259.7, 214.0 256.0 C 214.6 252.3, 216.4 243.5, 217.0 237.0 C 217.6 230.5, 217.7 224.9, 217.0 221.0 C 216.3 217.1, 230.2 220.1, 213.0 216.0 C 195.8 211.9, 142.3 203.4, 124.0 199.0 C 105.7 194.6, 116.4 194.4, 114.0 192.0 C 111.6 189.6, 111.7 188.8, 111.0 186.0 C 110.3 183.2, 109.6 180.3, 110.0 177.0 C 110.4 173.7, 110.4 171.1, 113.0 168.0 C 115.6 164.9, 120.1 161.7, 124.0 160.0 C 127.9 158.3, 118.1 156.4, 134.0 159.0 C 149.9 161.6, 187.4 170.5, 210.0 174.0 C 232.6 177.5, 239.0 178.0, 256.0 178.0 Z';

export function accessibilityIconSvg(className = 'a11y-wk-icon'): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="${className}" aria-hidden="true" focusable="false">` +
    `<path fill-rule="evenodd" d="${ACCESSIBILITY_ICON_RING}"/>` +
    `<circle cx="256" cy="122" r="36"/>` +
    `<path d="${ACCESSIBILITY_ICON_BODY}"/></svg>`
  );
}

export const WIDGET_ICONS = ['accessibility', 'eye', 'sparkles', 'hand'] as const;
export type WidgetIconName = (typeof WIDGET_ICONS)[number];

const WIDGET_ICON_PATHS: Record<Exclude<WidgetIconName, 'accessibility'>, string> = {
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  sparkles:
    '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z"/>',
  hand: '<path d="M8 11V5a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-6a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6 7h-2c-2 0-3.5-1-4.5-2.5L4 13a1.5 1.5 0 0 1 2.5-1.7L8 13"/>',
};

export function widgetIconSvg(icon: WidgetIconName, className = 'a11y-wk-icon'): string {
  if (icon === 'accessibility') return accessibilityIconSvg(className);
  return stroke(WIDGET_ICON_PATHS[icon]).replace('a11y-wk-glyph', className);
}

const stroke = (paths: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="a11y-wk-glyph" aria-hidden="true" focusable="false">${paths}</svg>`;

export const GLYPHS = {
  close: stroke('<path d="M18 6 6 18M6 6l12 12"/>'),
  reset: stroke('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
  visual: stroke('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  hearing: stroke('<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>'),
  motor: stroke('<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>'),
} as const;
