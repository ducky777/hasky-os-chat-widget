'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Product, BookingFormData } from '../types';

/**
 * Payment provider configuration
 */
export interface PaymentConfig {
  provider: 'stripe' | 'hitpay';
  publicKey: string;
}

/**
 * Booking configuration
 */
export interface EmbedBookingConfig {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  hintText?: string;
  timeSlots?: string[];
  monthsAhead?: number;
}

/**
 * Products configuration
 */
export interface EmbedProductsConfig {
  enabled?: boolean;
  headerText?: string;
  enableAISuggestions?: boolean;
}

/**
 * Checkout result
 */
export interface CheckoutResult {
  orderId: string;
  status: 'success' | 'pending' | 'failed';
  amount: number;
  currency: string;
  items: Array<{
    product: Product;
    quantity: number;
    size?: string;
  }>;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
}

/**
 * Cart state
 */
export interface CartState {
  items: Array<{
    product: Product;
    quantity: number;
    size?: string;
  }>;
  totalItems: number;
  totalAmount: number;
  currency: string;
}

/**
 * Quick reply option
 */
export interface QuickReply {
  text: string;
  subtext?: string;
}

/**
 * ChatWidgetEmbed props - thin wrapper that loads the CDN widget
 */
export interface ChatWidgetEmbedProps {
  /** Client ID for authentication (required) */
  clientId: string;

  /** Custom API endpoint (defaults to haskyos API) */
  apiEndpoint?: string;

  /** UI theme */
  theme?: 'whatsapp' | 'imessage';

  /** Brand/store name */
  storeName?: string;

  /** Primary accent color (hex) */
  primaryColor?: string;

  /** Welcome message */
  welcomeMessage?: string;

  /** Input placeholder */
  placeholder?: string;

  /** Quick reply options */
  quickReplies?: QuickReply[];

  /** Reopen button text */
  reopenButtonText?: string;

  /** Booking configuration */
  booking?: EmbedBookingConfig;

  /** Products configuration */
  products?: EmbedProductsConfig;

  /** Payment configuration */
  payment?: PaymentConfig;

  /** Function to retrieve products */
  getProducts?: () => Promise<Product[]> | Product[];

  // Event callbacks
  onReady?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
  onCartUpdated?: (cart: CartState) => void;
  onCheckoutStarted?: (data: { items: CartState['items'] }) => void;
  onCheckoutComplete?: (result: CheckoutResult) => void;
  onCheckoutFailed?: (error: { error: string; code?: string }) => void;
  onBookingSubmitted?: (data: { date: Date; time: string; formData: BookingFormData }) => void;
  onBookingComplete?: (data: { date: Date; time: string; formData: BookingFormData; bookingId?: string }) => void;
  onMessageSent?: (data: { message: string; messageCount: number }) => void;
  onError?: (error: { message: string; code?: string }) => void;

  /** CDN URL for the widget script (defaults to widget.haskyos.com) */
  cdnUrl?: string;
}

/** Default CDN URL */
const DEFAULT_CDN_URL = 'https://widget.haskyos.com/v1/chat-widget.min.js';

/** Widget version for cache busting */
const WIDGET_VERSION = '1.1.2';

/**
 * ChatWidgetEmbed - React wrapper component that loads the CDN-hosted widget
 *
 * This component provides a React-friendly API while using the CDN-hosted
 * widget bundle, ensuring all clients use the same codebase and analytics.
 *
 * @example
 * ```tsx
 * <ChatWidgetEmbed
 *   clientId="your-client-id"
 *   theme="whatsapp"
 *   getProducts={async () => fetchMyProducts()}
 *   payment={{ provider: 'stripe', publicKey: 'pk_live_xxx' }}
 *   onCheckoutComplete={(result) => console.log('Order:', result.orderId)}
 * />
 * ```
 */
export function ChatWidgetEmbed({
  clientId,
  apiEndpoint,
  theme,
  storeName,
  primaryColor,
  welcomeMessage,
  placeholder,
  quickReplies,
  reopenButtonText,
  booking,
  products,
  payment,
  getProducts,
  onReady,
  onOpen,
  onClose,
  onMinimize,
  onCartUpdated,
  onCheckoutStarted,
  onCheckoutComplete,
  onCheckoutFailed,
  onBookingSubmitted,
  onBookingComplete,
  onMessageSent,
  onError,
  cdnUrl = DEFAULT_CDN_URL,
}: ChatWidgetEmbedProps) {
  const isInitialized = useRef(false);
  const scriptLoaded = useRef(false);

  // Memoize callbacks to avoid re-registering
  const callbacks = useRef({
    onReady,
    onOpen,
    onClose,
    onMinimize,
    onCartUpdated,
    onCheckoutStarted,
    onCheckoutComplete,
    onCheckoutFailed,
    onBookingSubmitted,
    onBookingComplete,
    onMessageSent,
    onError,
  });

  // Update callbacks ref when props change
  useEffect(() => {
    callbacks.current = {
      onReady,
      onOpen,
      onClose,
      onMinimize,
      onCartUpdated,
      onCheckoutStarted,
      onCheckoutComplete,
      onCheckoutFailed,
      onBookingSubmitted,
      onBookingComplete,
      onMessageSent,
      onError,
    };
  }, [
    onReady,
    onOpen,
    onClose,
    onMinimize,
    onCartUpdated,
    onCheckoutStarted,
    onCheckoutComplete,
    onCheckoutFailed,
    onBookingSubmitted,
    onBookingComplete,
    onMessageSent,
    onError,
  ]);

  // Initialize widget
  const initWidget = useCallback(() => {
    if (!window.ChatWidget || isInitialized.current) return;

    const ChatWidget = window.ChatWidget;

    // Register event listeners
    ChatWidget.on('ready', () => callbacks.current.onReady?.());
    ChatWidget.on('open', () => callbacks.current.onOpen?.());
    ChatWidget.on('close', () => callbacks.current.onClose?.());
    ChatWidget.on('minimize', () => callbacks.current.onMinimize?.());
    ChatWidget.on('cartUpdated', (data) => callbacks.current.onCartUpdated?.(data as CartState));
    ChatWidget.on('checkoutStarted', (data) => callbacks.current.onCheckoutStarted?.(data as { items: CartState['items'] }));
    ChatWidget.on('checkoutComplete', (data) => callbacks.current.onCheckoutComplete?.(data as CheckoutResult));
    ChatWidget.on('checkoutFailed', (data) => callbacks.current.onCheckoutFailed?.(data as { error: string; code?: string }));
    ChatWidget.on('bookingSubmitted', (data) => callbacks.current.onBookingSubmitted?.(data as { date: Date; time: string; formData: BookingFormData }));
    ChatWidget.on('bookingComplete', (data) => callbacks.current.onBookingComplete?.(data as { date: Date; time: string; formData: BookingFormData; bookingId?: string }));
    ChatWidget.on('messageSent', (data) => callbacks.current.onMessageSent?.(data as { message: string; messageCount: number }));
    ChatWidget.on('error', (data) => callbacks.current.onError?.(data as { message: string; code?: string }));

    // Initialize with config
    ChatWidget.init({
      clientId,
      apiEndpoint,
      theme,
      storeName,
      primaryColor,
      welcomeMessage,
      placeholder,
      quickReplies,
      reopenButtonText,
      booking,
      products,
      payment,
      getProducts,
    });

    isInitialized.current = true;
  }, [
    clientId,
    apiEndpoint,
    theme,
    storeName,
    primaryColor,
    welcomeMessage,
    placeholder,
    quickReplies,
    reopenButtonText,
    booking,
    products,
    payment,
    getProducts,
  ]);

  // Load script and initialize
  useEffect(() => {
    // Skip on server
    if (typeof window === 'undefined') return;

    // If ChatWidget already exists (script already loaded), just init
    if (window.ChatWidget) {
      initWidget();
      return;
    }

    // Don't load script twice
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    // Load the CDN script with cache-busting version
    const script = document.createElement('script');
    script.src = `${cdnUrl}?v=${WIDGET_VERSION}`;
    script.async = true;
    script.onload = () => {
      initWidget();
    };
    script.onerror = () => {
      console.error('[ChatWidgetEmbed] Failed to load widget script from:', cdnUrl);
      callbacks.current.onError?.({
        message: 'Failed to load widget script',
        code: 'SCRIPT_LOAD_ERROR',
      });
    };

    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      if (window.ChatWidget?.isInitialized()) {
        window.ChatWidget.destroy();
      }
      isInitialized.current = false;
    };
  }, [cdnUrl, initWidget]);

  // This component doesn't render anything - the widget renders itself
  return null;
}

/**
 * Type declaration for window.ChatWidget
 * The actual implementation is loaded from the CDN script
 */
interface ChatWidgetGlobal {
  init: (config: Record<string, unknown>) => void;
  open: (message?: string) => void;
  close: () => void;
  destroy: () => void;
  on: (event: string, handler: (data?: unknown) => void) => void;
  off: (event: string, handler: (data?: unknown) => void) => void;
  getCart: () => CartState;
  addToCart: (product: Product, quantity?: number, size?: string) => void;
  clearCart: () => void;
  isInitialized: () => boolean;
  version: string;
}

// Extend window type locally for this module
declare const window: Window & { ChatWidget?: ChatWidgetGlobal };

export default ChatWidgetEmbed;
