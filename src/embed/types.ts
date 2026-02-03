/**
 * Embed Widget Configuration Types
 * These types define the public API for the embeddable widget
 */

import type { Product as ProductType, BookingFormData, QuickReply, ChatStyle } from '../types';

// Re-export Product type for external use
export type Product = ProductType;

/**
 * Payment provider configuration
 */
export interface PaymentConfig {
  /** Payment provider: 'stripe' or 'hitpay' */
  provider: 'stripe' | 'hitpay';
  /** Publishable/public key (safe for frontend) */
  publicKey: string;
  /**
   * Use external checkout instead of the widget's built-in checkout modal.
   * When true, clicking the cart button emits 'checkoutRequested' event
   * instead of opening the built-in checkout modal.
   * The host site should listen for this event and open their own checkout.
   */
  useExternalCheckout?: boolean;
}

/**
 * Booking configuration for embedded widget
 */
export interface EmbedBookingConfig {
  /** Enable the booking feature */
  enabled?: boolean;
  /** Modal title */
  title?: string;
  /** Modal subtitle */
  subtitle?: string;
  /** Hint text (e.g., availability hours) */
  hintText?: string;
  /** Available time slots */
  timeSlots?: string[];
  /** How many months ahead can be booked */
  monthsAhead?: number;
}

/**
 * Products configuration for embedded widget
 */
export interface EmbedProductsConfig {
  /** Enable product features */
  enabled?: boolean;
  /** Header text for product carousel */
  headerText?: string;
  /** Enable AI-suggested products during chat */
  enableAISuggestions?: boolean;
}

/**
 * Checkout result returned after successful payment
 */
export interface CheckoutResult {
  /** Order ID from payment provider */
  orderId: string;
  /** Payment status */
  status: 'success' | 'pending' | 'failed';
  /** Total amount paid */
  amount: number;
  /** Currency code */
  currency: string;
  /** Items purchased */
  items: Array<{
    product: Product;
    quantity: number;
    size?: string;
  }>;
  /** Customer info */
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
}

/**
 * Cart item
 */
export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
}

/**
 * Cart update event data
 */
export interface CartUpdateEvent {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  currency: string;
}

/**
 * Booking submit event data
 */
export interface BookingSubmitEvent {
  date: Date;
  time: string;
  formData: BookingFormData;
}

/**
 * Main configuration for ChatWidget.init()
 */
export interface ChatWidgetConfig {
  // Required
  /** Client ID for authentication and tracking */
  clientId: string;

  // Optional API endpoint (defaults to haskyos API)
  /** Custom API endpoint (defaults to https://api.haskyos.com/v1/chat) */
  apiEndpoint?: string;

  // Theming
  /** UI theme: 'whatsapp' or 'imessage' */
  theme?: ChatStyle;
  /** Brand/store name shown in header */
  storeName?: string;
  /** Primary accent color (hex) */
  primaryColor?: string;

  // Content
  /** Initial welcome message */
  welcomeMessage?: string;
  /** Input placeholder text */
  placeholder?: string;
  /** Quick reply suggestions */
  quickReplies?: QuickReply[];
  /** Text on reopen button when minimized */
  reopenButtonText?: string;

  // Features
  /** Booking calendar configuration */
  booking?: EmbedBookingConfig;
  /** Products configuration */
  products?: EmbedProductsConfig;
  /** Payment configuration */
  payment?: PaymentConfig;

  // Callbacks (called via postMessage bridge)
  /**
   * Function to retrieve available products
   * Called by widget to populate product carousels
   */
  getProducts?: () => Promise<Product[]> | Product[];
}

/**
 * Event types emitted by the widget
 */
export type ChatWidgetEventType =
  | 'ready'
  | 'open'
  | 'close'
  | 'minimize'
  | 'addToCart'
  | 'cartUpdated'
  | 'checkoutStarted'
  | 'checkoutRequested'
  | 'checkoutComplete'
  | 'checkoutFailed'
  | 'bookingSubmitted'
  | 'bookingComplete'
  | 'messageSent'
  | 'error';

/**
 * Event handler function type
 */
export type ChatWidgetEventHandler<T = unknown> = (data: T) => void;

/**
 * Event data types for each event
 */
export interface ChatWidgetEventMap {
  ready: void;
  open: void;
  close: void;
  minimize: void;
  /** Emitted when a product is added to cart */
  addToCart: Product;
  cartUpdated: CartUpdateEvent;
  checkoutStarted: { items: CartItem[] };
  /** Emitted when useExternalCheckout is true and user clicks cart button */
  checkoutRequested: { items: CartItem[]; totalAmount: number; currency: string };
  checkoutComplete: CheckoutResult;
  checkoutFailed: { error: string; code?: string };
  bookingSubmitted: BookingSubmitEvent;
  bookingComplete: BookingSubmitEvent & { bookingId?: string };
  messageSent: { message: string; messageCount: number };
  error: { message: string; code?: string };
}

/**
 * Public API exposed on window.ChatWidget
 */
export interface ChatWidgetAPI {
  /** Initialize the widget with configuration */
  init: (config: ChatWidgetConfig) => void;

  /** Open the chat modal */
  open: (message?: string) => void;

  /** Close/minimize the chat modal */
  close: () => void;

  /** Destroy the widget and clean up */
  destroy: () => void;

  /** Register an event listener */
  on: <K extends ChatWidgetEventType>(
    event: K,
    handler: ChatWidgetEventHandler<ChatWidgetEventMap[K]>
  ) => void;

  /** Remove an event listener */
  off: <K extends ChatWidgetEventType>(
    event: K,
    handler: ChatWidgetEventHandler<ChatWidgetEventMap[K]>
  ) => void;

  /** Get current cart state */
  getCart: () => CartUpdateEvent;

  /** Add item to cart programmatically */
  addToCart: (product: Product, quantity?: number, size?: string) => void;

  /** Clear the cart */
  clearCart: () => void;

  /** Check if widget is initialized */
  isInitialized: () => boolean;

  /** Get widget version */
  version: string;

  /**
   * Track a custom event through the widget's analytics.
   * If the host site has PostHog installed, events flow through that instance.
   * Event names are prefixed with "site_" to distinguish from widget events.
   *
   * @param event - Event name (e.g., 'page_view', 'add_to_cart', 'purchase')
   * @param properties - Optional event properties
   */
  track: (event: string, properties?: Record<string, unknown>) => void;

  /**
   * Get the current session ID for linking external tracking systems.
   * @returns The session ID or null if not initialized
   */
  getSessionId: () => string | null;

  /**
   * Get the current client ID.
   * @returns The client ID or null if not initialized
   */
  getClientId: () => string | null;

  /**
   * Check if the widget is using the host site's PostHog instance.
   * @returns true if using host's PostHog, false if using widget's own instance
   */
  isUsingHostPostHog: () => boolean;
}

/**
 * Internal message types for postMessage communication
 */
export type WidgetMessageType =
  | 'WIDGET_INIT'
  | 'WIDGET_OPEN'
  | 'WIDGET_CLOSE'
  | 'WIDGET_DESTROY'
  | 'WIDGET_EVENT'
  | 'WIDGET_GET_PRODUCTS'
  | 'WIDGET_PRODUCTS_RESPONSE'
  | 'WIDGET_ADD_TO_CART'
  | 'WIDGET_CLEAR_CART'
  | 'WIDGET_GET_CART';

export interface WidgetMessage {
  type: WidgetMessageType;
  payload?: unknown;
  requestId?: string;
}
