/**
 * Event bridge for communication between widget and host page
 * Handles event registration, emission, and callback invocation
 */

import type {
  ChatWidgetEventType,
  ChatWidgetEventHandler,
  ChatWidgetEventMap,
  ChatWidgetConfig,
  Product,
} from './types';

type EventListeners = {
  [K in ChatWidgetEventType]: Set<ChatWidgetEventHandler<ChatWidgetEventMap[K]>>;
};

class EventBridge {
  private listeners: EventListeners;
  private config: ChatWidgetConfig | null = null;
  private pendingProductRequests: Map<string, (products: Product[]) => void> = new Map();

  constructor() {
    this.listeners = {
      ready: new Set(),
      open: new Set(),
      close: new Set(),
      minimize: new Set(),
      cartUpdated: new Set(),
      checkoutStarted: new Set(),
      checkoutComplete: new Set(),
      checkoutFailed: new Set(),
      bookingSubmitted: new Set(),
      bookingComplete: new Set(),
      messageSent: new Set(),
      error: new Set(),
    };
  }

  /**
   * Set the widget configuration (stores callbacks like getProducts)
   */
  setConfig(config: ChatWidgetConfig): void {
    this.config = config;
  }

  /**
   * Register an event listener
   */
  on<K extends ChatWidgetEventType>(
    event: K,
    handler: ChatWidgetEventHandler<ChatWidgetEventMap[K]>
  ): void {
    const handlers = this.listeners[event];
    if (!handlers) {
      console.warn(`[ChatWidget] Unknown event type: "${event}". Valid events: ${Object.keys(this.listeners).join(', ')}`);
      return;
    }
    handlers.add(handler as ChatWidgetEventHandler<unknown>);
  }

  /**
   * Remove an event listener
   */
  off<K extends ChatWidgetEventType>(
    event: K,
    handler: ChatWidgetEventHandler<ChatWidgetEventMap[K]>
  ): void {
    const handlers = this.listeners[event];
    if (!handlers) {
      console.warn(`[ChatWidget] Unknown event type: "${event}". Valid events: ${Object.keys(this.listeners).join(', ')}`);
      return;
    }
    handlers.delete(handler as ChatWidgetEventHandler<unknown>);
  }

  /**
   * Emit an event to all registered listeners
   */
  emit<K extends ChatWidgetEventType>(
    event: K,
    data?: ChatWidgetEventMap[K]
  ): void {
    const handlers = this.listeners[event];
    if (!handlers) {
      return;
    }
    handlers.forEach((handler) => {
      try {
        (handler as ChatWidgetEventHandler<ChatWidgetEventMap[K]>)(data as ChatWidgetEventMap[K]);
      } catch (error) {
        console.error(`[ChatWidget] Error in ${event} handler:`, error);
      }
    });
  }

  /**
   * Request products from host page via getProducts callback
   */
  async requestProducts(): Promise<Product[]> {
    if (!this.config?.getProducts) {
      return [];
    }

    try {
      const products = await this.config.getProducts();
      return products || [];
    } catch (error) {
      console.error('[ChatWidget] Error fetching products:', error);
      this.emit('error', {
        message: 'Failed to fetch products',
        code: 'PRODUCTS_FETCH_ERROR'
      });
      return [];
    }
  }

  /**
   * Check if getProducts callback is configured
   */
  hasProductsCallback(): boolean {
    return typeof this.config?.getProducts === 'function';
  }

  /**
   * Get the current configuration
   */
  getConfig(): ChatWidgetConfig | null {
    return this.config;
  }

  /**
   * Clear all listeners (for cleanup)
   */
  clear(): void {
    Object.keys(this.listeners).forEach((key) => {
      this.listeners[key as ChatWidgetEventType].clear();
    });
    this.config = null;
    this.pendingProductRequests.clear();
  }
}

// Singleton instance
export const eventBridge = new EventBridge();
