import type { LocaleDefinition } from '../../core/types';

export const en = {
  code: 'en',
  name: 'English',
  dir: 'ltr',
  messages: {
    'trigger.label': 'Accessibility',
    'trigger.ariaLabel': 'Open accessibility menu',
    'trigger.shortcutHint': 'Shortcut: {shortcut}',
    'dialog.title': 'Accessibility preferences',
    'dialog.subtitle': 'Customize your visual, hearing, and interaction experience',
    'dialog.close': 'Close accessibility menu',
    'dialog.reset': 'Reset to defaults',
    'dialog.done': 'Done',
    'section.visual': 'Visual accessibility',
    'section.hearing': 'Hearing & audio support',
    'section.motor': 'Motor & interaction',
    'feature.highContrast.label': 'High contrast mode',
    'feature.highContrast.description': 'Enhance borders, sharpen text, and maximize contrast ratios',
    'feature.fontScale.label': 'Text scaling',
    'feature.fontScale.description': 'Adjust the content font size for better legibility',
    'feature.fontScale.option.normal': 'Default ({percent}%)',
    'feature.fontScale.option.large': 'Large ({percent}%)',
    'feature.fontScale.option.xlarge': 'X-Large ({percent}%)',
    'feature.readableFont.label': 'Readable font & spacing',
    'feature.readableFont.description': 'Increase line height and letter spacing for reading comfort',
    'feature.highlightLinks.label': 'Highlight links',
    'feature.highlightLinks.description': 'Underline and emphasize every clickable link',
    'feature.visualAlerts.label': 'Visual alerts & confirmations',
    'feature.visualAlerts.description': 'Show status updates, timers, and alerts as clear on-screen banners',
    'feature.reducedMotion.label': 'Reduce motion',
    'feature.reducedMotion.description': 'Disable animations, transitions, and autoplay',
    'announce.opened': 'Accessibility menu opened',
    'announce.closed': 'Accessibility menu closed',
    'announce.reset': 'Accessibility settings reset to defaults',
    'announce.enabled': '{feature} enabled',
    'announce.disabled': '{feature} disabled',
    'announce.changed': '{feature} set to {value}',
  },
} satisfies LocaleDefinition;

/** Every message key the widget uses. Translations may omit keys; missing ones fall back to English. */
export type MessageKey = keyof typeof en.messages;

export default en;
