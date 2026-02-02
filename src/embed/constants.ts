/**
 * Constants for the embeddable widget
 */

/** Default API endpoint */
export const DEFAULT_API_ENDPOINT = 'https://api.haskyos.com/v1/chat';

/** Widget version - should match package.json */
export const WIDGET_VERSION = '1.1.3';

/** Storage key prefix for embedded widget */
export const EMBED_STORAGE_PREFIX = 'hocw_embed';

/** Shadow DOM container ID */
export const SHADOW_HOST_ID = 'hasky-chat-widget-host';

/** PostHog project API key - injected at build time via esbuild define */
declare const __POSTHOG_API_KEY__: string;
export const POSTHOG_API_KEY = typeof __POSTHOG_API_KEY__ !== 'undefined' ? __POSTHOG_API_KEY__ : '';

/** PostHog API host */
export const POSTHOG_HOST = 'https://us.i.posthog.com';

/** Default theme */
export const DEFAULT_THEME = 'imessage';

/** Default store name */
export const DEFAULT_STORE_NAME = 'Chat';

/** Default welcome message */
export const DEFAULT_WELCOME_MESSAGE = 'Hello! How can I help you today?';

/** Default placeholder */
export const DEFAULT_PLACEHOLDER = 'Type a message...';

/** Default reopen button text */
export const DEFAULT_REOPEN_TEXT = 'Chat with us';

/** Default booking time slots */
export const DEFAULT_TIME_SLOTS = [
  '9:00 AM',
  '9:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
  '3:30 PM',
  '4:00 PM',
  '4:30 PM',
  '5:00 PM',
];

/** CSS reset for Shadow DOM isolation */
export const SHADOW_DOM_RESET = `
:host {
  all: initial;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #000;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:host * {
  box-sizing: border-box;
}
`;
