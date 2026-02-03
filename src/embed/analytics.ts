/**
 * PostHog analytics integration for embedded widget
 * Tracks all client widget usage with client segregation
 *
 * If the host site already has PostHog initialized (window.posthog exists),
 * the widget will use the existing instance instead of loading its own.
 * This ensures all events (site + widget) flow through the same session.
 */

import { POSTHOG_API_KEY, POSTHOG_HOST } from './constants';

interface PostHogInstance {
  init: (apiKey: string, options: Record<string, unknown>) => void;
  identify: (distinctId: string, properties?: Record<string, unknown>) => void;
  group: (type: string, key: string, properties?: Record<string, unknown>) => void;
  capture: (event: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
  get_distinct_id?: () => string;
}

declare global {
  interface Window {
    posthog?: PostHogInstance;
  }
}

let isInitialized = false;
let usingHostPostHog = false;
let clientId: string | null = null;
let sessionId: string | null = null;

/**
 * Check if PostHog is already initialized by the host site
 */
function isPostHogAlreadyInitialized(): boolean {
  return !!(window.posthog && typeof window.posthog.capture === 'function');
}

/**
 * Load PostHog script dynamically (only if not already present)
 */
function loadPostHogScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.posthog) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://us-assets.i.posthog.com/static/array.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PostHog'));
    document.head.appendChild(script);
  });
}

/**
 * Initialize PostHog with client segregation
 *
 * If window.posthog already exists (host site installed PostHog),
 * we'll use that instance and just add widget context to events.
 * This means all tracking flows through the same PostHog session.
 */
export async function initAnalytics(
  widgetClientId: string,
  widgetSessionId: string
): Promise<void> {
  if (isInitialized) {
    return;
  }

  clientId = widgetClientId;
  sessionId = widgetSessionId;

  // Check if host site already has PostHog initialized
  if (isPostHogAlreadyInitialized()) {
    console.log('[ChatWidget] Using existing PostHog instance from host site');
    usingHostPostHog = true;
    isInitialized = true;

    // Add widget context to the existing session
    window.posthog?.group('widget_client', clientId!, {
      domain: window.location.hostname,
      widget_session_id: sessionId,
      first_seen: new Date().toISOString(),
    });

    return;
  }

  // No existing PostHog - load our own if we have an API key
  if (!POSTHOG_API_KEY) {
    console.warn('[ChatWidget] PostHog API key not configured and no host PostHog found');
    return;
  }

  try {
    await loadPostHogScript();

    if (!window.posthog) {
      console.warn('[ChatWidget] PostHog not available after script load');
      return;
    }

    window.posthog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      persistence: 'localStorage',
      autocapture: false, // We'll track manually
      capture_pageview: false, // Don't track host page views
      disable_session_recording: true, // Don't record host sessions
      loaded: () => {
        // Identify by session with client metadata
        window.posthog?.identify(sessionId!, {
          widget_client_id: clientId,
          widget_domain: window.location.hostname,
          widget_url: window.location.href,
        });

        // Group by client for easy filtering
        window.posthog?.group('client', clientId!, {
          domain: window.location.hostname,
          first_seen: new Date().toISOString(),
        });

        isInitialized = true;
      },
    });
  } catch (error) {
    console.warn('[ChatWidget] Failed to initialize analytics:', error);
  }
}

/**
 * Check if we're using the host site's PostHog instance
 */
export function isUsingHostPostHog(): boolean {
  return usingHostPostHog;
}

/**
 * Get the current session ID (useful for host sites to link their events)
 */
export function getSessionId(): string | null {
  return sessionId;
}

/**
 * Get the current client ID
 */
export function getClientId(): string | null {
  return clientId;
}

/**
 * Track an event with automatic client context
 */
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
): void {
  if (!isInitialized || !window.posthog) {
    return;
  }

  window.posthog.capture(`widget_${event}`, {
    ...properties,
    widget_client_id: clientId,
    widget_domain: window.location.hostname,
    widget_session_id: sessionId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Pre-defined tracking events
 */
export const Analytics = {
  // Widget lifecycle
  widgetInitialized: (config: { theme: string; hasBooking: boolean; hasProducts: boolean; hasPayment: boolean }) =>
    trackEvent('initialized', config),

  widgetOpened: () => trackEvent('opened'),

  widgetClosed: () => trackEvent('closed'),

  widgetMinimized: () => trackEvent('minimized'),

  // Chat events
  messageSent: (messageCount: number) =>
    trackEvent('message_sent', { message_count: messageCount }),

  messageReceived: (responseTimeMs: number) =>
    trackEvent('message_received', { response_time_ms: responseTimeMs }),

  quickReplyClicked: (text: string) =>
    trackEvent('quick_reply_clicked', { text }),

  suggestedResponseClicked: (text: string) =>
    trackEvent('suggested_response_clicked', { text }),

  // Product events
  productViewed: (productId: string, productName: string) =>
    trackEvent('product_viewed', { product_id: productId, product_name: productName }),

  productAddedToCart: (productId: string, productName: string, size?: string) =>
    trackEvent('product_added_to_cart', { product_id: productId, product_name: productName, size }),

  cartUpdated: (itemCount: number, totalAmount: number) =>
    trackEvent('cart_updated', { item_count: itemCount, total_amount: totalAmount }),

  // Checkout events
  checkoutStarted: (itemCount: number, totalAmount: number) =>
    trackEvent('checkout_started', { item_count: itemCount, total_amount: totalAmount }),

  checkoutCompleted: (orderId: string, amount: number, currency: string) =>
    trackEvent('checkout_completed', { order_id: orderId, amount, currency }),

  checkoutFailed: (error: string) =>
    trackEvent('checkout_failed', { error }),

  // Booking events
  bookingOpened: () => trackEvent('booking_opened'),

  bookingDateSelected: (date: string) =>
    trackEvent('booking_date_selected', { date }),

  bookingTimeSelected: (time: string) =>
    trackEvent('booking_time_selected', { time }),

  bookingSubmitted: (date: string, time: string) =>
    trackEvent('booking_submitted', { date, time }),

  bookingCompleted: (date: string, time: string, durationMs: number) =>
    trackEvent('booking_completed', { date, time, duration_ms: durationMs }),

  bookingAbandoned: (step: string, durationMs: number) =>
    trackEvent('booking_abandoned', { step, duration_ms: durationMs }),

  // Error tracking
  errorOccurred: (error: string, errorType: string) =>
    trackEvent('error', { error, error_type: errorType }),
};
