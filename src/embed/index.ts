/**
 * Main entry point for the embeddable chat widget
 * Exposes ChatWidget global API and handles Shadow DOM mounting
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { EmbedApp } from './EmbedApp';
import { eventBridge } from './event-bridge';
import { cartStore } from './cart-store';
import { initAnalytics, Analytics, trackEvent, getSessionId, getClientId, isUsingHostPostHog } from './analytics';
import type {
  ChatWidgetAPI,
  ChatWidgetConfig,
  ChatWidgetEventType,
  ChatWidgetEventHandler,
  ChatWidgetEventMap,
  Product,
} from './types';
import {
  WIDGET_VERSION,
  SHADOW_HOST_ID,
  SHADOW_DOM_RESET,
  EMBED_STORAGE_PREFIX,
} from './constants';

// Module state
let isInitialized = false;
let shadowRoot: ShadowRoot | null = null;
let reactRoot: Root | null = null;
let config: ChatWidgetConfig | null = null;

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get or create session ID from storage
 */
function getSessionId(clientId: string): string {
  const storageKey = `${EMBED_STORAGE_PREFIX}_${clientId}_session_id`;
  let sessionId = localStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

/**
 * Create Shadow DOM host element
 */
function createShadowHost(): HTMLElement {
  // Remove existing host if present
  const existing = document.getElementById(SHADOW_HOST_ID);
  if (existing) {
    existing.remove();
  }

  const host = document.createElement('div');
  host.id = SHADOW_HOST_ID;
  host.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 2147483647;
    pointer-events: none;
  `;

  document.body.appendChild(host);
  return host;
}

/**
 * Load and inject styles into Shadow DOM
 */
async function injectStyles(shadow: ShadowRoot): Promise<void> {
  // Create style element for reset
  const resetStyle = document.createElement('style');
  resetStyle.textContent = SHADOW_DOM_RESET;
  shadow.appendChild(resetStyle);

  // Fetch and inject main styles
  // In production, this URL would be the CDN URL
  try {
    const styleUrl = (window as { __CHAT_WIDGET_STYLE_URL__?: string }).__CHAT_WIDGET_STYLE_URL__
      || 'https://widget.haskyos.com/v1/styles.css';

    const response = await fetch(styleUrl);
    if (response.ok) {
      const css = await response.text();
      const mainStyle = document.createElement('style');
      mainStyle.textContent = css;
      shadow.appendChild(mainStyle);
    }
  } catch (error) {
    console.warn('[ChatWidget] Failed to load styles:', error);
  }

  // Add embed-specific styles
  const embedStyle = document.createElement('style');
  embedStyle.textContent = getEmbedStyles();
  shadow.appendChild(embedStyle);
}

/**
 * Get embed-specific CSS
 */
function getEmbedStyles(): string {
  return `
    /* Ensure widget container allows pointer events */
    .chat-widget-container {
      pointer-events: auto;
      position: fixed;
      bottom: 0;
      right: 0;
      z-index: 2147483647;
    }

    /* Cart button styles */
    .pcm-cart-button {
      position: relative;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      color: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pcm-cart-button:hover {
      opacity: 0.8;
    }

    .pcm-cart-badge {
      position: absolute;
      top: 0;
      right: 0;
      background: #ef4444;
      color: white;
      font-size: 10px;
      font-weight: 600;
      min-width: 16px;
      height: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }

    /* Checkout overlay */
    .pcm-checkout-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      pointer-events: auto;
    }

    .pcm-checkout-modal {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 400px;
      max-height: 80vh;
      overflow-y: auto;
      padding: 24px;
      position: relative;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .pcm-checkout-close {
      position: absolute;
      top: 12px;
      right: 12px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .pcm-checkout-close:hover {
      background: #f0f0f0;
    }

    .pcm-checkout-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 20px 0;
      color: #111;
    }

    .pcm-checkout-items {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .pcm-checkout-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: #f8f8f8;
      border-radius: 8px;
    }

    .pcm-checkout-item-image {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 8px;
    }

    .pcm-checkout-item-details {
      flex: 1;
    }

    .pcm-checkout-item-name {
      font-weight: 500;
      color: #111;
    }

    .pcm-checkout-item-size,
    .pcm-checkout-item-qty {
      font-size: 13px;
      color: #666;
    }

    .pcm-checkout-item-price {
      font-weight: 600;
      color: #111;
    }

    .pcm-checkout-total {
      display: flex;
      justify-content: space-between;
      padding: 16px 0;
      border-top: 1px solid #eee;
      font-size: 18px;
      font-weight: 600;
    }

    .pcm-checkout-button {
      width: 100%;
      padding: 14px 24px;
      background: #111;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      margin-top: 16px;
    }

    .pcm-checkout-button:hover:not(:disabled) {
      background: #333;
    }

    .pcm-checkout-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .pcm-checkout-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .pcm-form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .pcm-form-group label {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .pcm-form-group input {
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 16px;
    }

    .pcm-form-group input:focus {
      outline: none;
      border-color: #111;
    }

    .pcm-checkout-summary {
      text-align: center;
      padding: 20px;
      background: #f8f8f8;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .pcm-checkout-summary p {
      margin: 4px 0;
    }

    .pcm-checkout-error {
      background: #fef2f2;
      color: #dc2626;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .pcm-checkout-success {
      text-align: center;
      padding: 20px 0;
    }

    .pcm-checkout-success-icon {
      width: 64px;
      height: 64px;
      background: #10b981;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin: 0 auto 16px;
    }

    .pcm-checkout-success h2 {
      margin: 0 0 8px 0;
      color: #111;
    }

    .pcm-checkout-success p {
      color: #666;
      margin: 0 0 20px 0;
    }
  `;
}

/**
 * Initialize the widget
 */
async function init(widgetConfig: ChatWidgetConfig): Promise<void> {
  if (isInitialized) {
    console.warn('[ChatWidget] Already initialized. Call destroy() first to reinitialize.');
    return;
  }

  if (!widgetConfig.clientId) {
    throw new Error('[ChatWidget] clientId is required');
  }

  config = widgetConfig;

  // Set config in event bridge
  eventBridge.setConfig(config);

  // Initialize analytics with client segregation
  const sessionId = getSessionId(config.clientId);
  await initAnalytics(config.clientId, sessionId);

  // Create Shadow DOM (closed mode for production security)
  const host = createShadowHost();
  shadowRoot = host.attachShadow({ mode: 'closed' });

  // Inject styles
  await injectStyles(shadowRoot);

  // Create container for React
  const container = document.createElement('div');
  container.className = 'chat-widget-container';
  shadowRoot.appendChild(container);

  // Mount React app
  reactRoot = createRoot(container);
  reactRoot.render(React.createElement(EmbedApp, { config }));

  isInitialized = true;

  // Track initialization
  Analytics.widgetInitialized({
    theme: config.theme || 'imessage',
    hasBooking: !!config.booking?.enabled,
    hasProducts: !!config.products?.enabled,
    hasPayment: !!config.payment,
  });

  // Emit ready event
  eventBridge.emit('ready');
}

/**
 * Open the chat modal
 */
function open(message?: string): void {
  if (!isInitialized) {
    console.warn('[ChatWidget] Not initialized. Call init() first.');
    return;
  }

  // Trigger open via localStorage event (ChatModalContext listens for this)
  const storageKey = `${EMBED_STORAGE_PREFIX}_${config!.clientId}-minimized`;
  localStorage.setItem(storageKey, 'false');
  window.dispatchEvent(new StorageEvent('storage', { key: storageKey }));

  if (message) {
    // Store pending message
    const messageKey = `${EMBED_STORAGE_PREFIX}_${config!.clientId}_pending_message`;
    localStorage.setItem(messageKey, message);
    window.dispatchEvent(new StorageEvent('storage', { key: messageKey }));
  }
}

/**
 * Close/minimize the chat modal
 */
function close(): void {
  if (!isInitialized) {
    return;
  }

  const storageKey = `${EMBED_STORAGE_PREFIX}_${config!.clientId}-minimized`;
  localStorage.setItem(storageKey, 'true');
  window.dispatchEvent(new StorageEvent('storage', { key: storageKey }));
  eventBridge.emit('close');
}

/**
 * Destroy the widget and clean up
 */
function destroy(): void {
  if (!isInitialized) {
    return;
  }

  // Unmount React
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }

  // Remove Shadow DOM host
  const host = document.getElementById(SHADOW_HOST_ID);
  if (host) {
    host.remove();
  }

  // Clear event listeners
  eventBridge.clear();

  // Clear cart
  cartStore.clear();

  // Reset state
  shadowRoot = null;
  config = null;
  isInitialized = false;
}

/**
 * Public API
 */
const ChatWidget: ChatWidgetAPI = {
  init,
  open,
  close,
  destroy,

  on: <K extends ChatWidgetEventType>(
    event: K,
    handler: ChatWidgetEventHandler<ChatWidgetEventMap[K]>
  ) => {
    eventBridge.on(event, handler);
  },

  off: <K extends ChatWidgetEventType>(
    event: K,
    handler: ChatWidgetEventHandler<ChatWidgetEventMap[K]>
  ) => {
    eventBridge.off(event, handler);
  },

  getCart: () => cartStore.getState(),

  addToCart: (product: Product, quantity?: number, size?: string) => {
    cartStore.addItem(product, quantity, size);
  },

  clearCart: () => {
    cartStore.clear();
  },

  isInitialized: () => isInitialized,

  version: WIDGET_VERSION,

  /**
   * Track a custom event through the widget's analytics.
   * If the host site has PostHog installed, events flow through that instance.
   * This allows the host site to track page views, add-to-cart, etc.
   * under the same session as widget interactions.
   *
   * @param event - Event name (will be prefixed with "site_" to distinguish from widget events)
   * @param properties - Optional event properties
   *
   * @example
   * ChatWidget.track('page_view', { page: '/products', referrer: document.referrer });
   * ChatWidget.track('add_to_cart', { product_id: 'abc', price: 19.99 });
   * ChatWidget.track('purchase', { order_id: '123', total: 99.99 });
   */
  track: (event: string, properties?: Record<string, unknown>) => {
    trackEvent(`site_${event}`, properties);
  },

  /**
   * Get the current session ID.
   * This can be used to link external tracking systems to the widget's session.
   *
   * @returns The session ID or null if not initialized
   */
  getSessionId: () => getSessionId(),

  /**
   * Get the current client ID.
   *
   * @returns The client ID or null if not initialized
   */
  getClientId: () => getClientId(),

  /**
   * Check if the widget is using the host site's PostHog instance.
   *
   * @returns true if using host's PostHog, false if using widget's own instance
   */
  isUsingHostPostHog: () => isUsingHostPostHog(),
};

// Expose to window
declare global {
  interface Window {
    ChatWidget: ChatWidgetAPI;
  }
}

window.ChatWidget = ChatWidget;

export default ChatWidget;
export { ChatWidget };
export type { ChatWidgetAPI, ChatWidgetConfig } from './types';
