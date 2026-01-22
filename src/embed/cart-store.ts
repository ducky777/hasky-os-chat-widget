/**
 * Cart state management for embedded widget
 * Self-contained cart that lives inside the widget
 */

import type { Product, CartItem, CartUpdateEvent } from './types';
import { eventBridge } from './event-bridge';
import { Analytics } from './analytics';

class CartStore {
  private items: CartItem[] = [];
  private currency: string = 'SGD';

  /**
   * Add item to cart
   */
  addItem(product: Product, quantity: number = 1, size?: string): void {
    const existingIndex = this.items.findIndex(
      (item) => item.product.id === product.id && item.size === size
    );

    if (existingIndex >= 0) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({ product, quantity, size });
    }

    // Use product currency or default
    if (product.currency) {
      this.currency = product.currency;
    }

    // Track analytics
    Analytics.productAddedToCart(product.id, product.name, size);

    this.emitUpdate();
  }

  /**
   * Remove item from cart
   */
  removeItem(productId: string, size?: string): void {
    this.items = this.items.filter(
      (item) => !(item.product.id === productId && item.size === size)
    );
    this.emitUpdate();
  }

  /**
   * Update item quantity
   */
  updateQuantity(productId: string, quantity: number, size?: string): void {
    const item = this.items.find(
      (item) => item.product.id === productId && item.size === size
    );

    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId, size);
      } else {
        item.quantity = quantity;
        this.emitUpdate();
      }
    }
  }

  /**
   * Clear all items from cart
   */
  clear(): void {
    this.items = [];
    this.emitUpdate();
  }

  /**
   * Get current cart state
   */
  getState(): CartUpdateEvent {
    const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = this.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    return {
      items: [...this.items],
      totalItems,
      totalAmount,
      currency: this.currency,
    };
  }

  /**
   * Get items array
   */
  getItems(): CartItem[] {
    return [...this.items];
  }

  /**
   * Check if cart is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Emit cart update event
   */
  private emitUpdate(): void {
    const state = this.getState();
    Analytics.cartUpdated(state.totalItems, state.totalAmount);
    eventBridge.emit('cartUpdated', state);
  }
}

// Singleton instance
export const cartStore = new CartStore();
