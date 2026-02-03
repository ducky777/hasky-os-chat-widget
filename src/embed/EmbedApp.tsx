'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ChatModal } from '../components/ChatModal';
import { ChatModalProvider } from '../context/ChatModalContext';
import type { ChatWidgetConfig, Product } from './types';
import type { AnalyticsCallbacks, BookingConfig, BookingFormData } from '../types';
import { eventBridge } from './event-bridge';
import { cartStore } from './cart-store';
import { Analytics } from './analytics';
import {
  DEFAULT_API_ENDPOINT,
  DEFAULT_THEME,
  DEFAULT_STORE_NAME,
  DEFAULT_WELCOME_MESSAGE,
  DEFAULT_PLACEHOLDER,
  DEFAULT_REOPEN_TEXT,
  DEFAULT_TIME_SLOTS,
  EMBED_STORAGE_PREFIX,
} from './constants';

interface EmbedAppProps {
  config: ChatWidgetConfig;
}

/**
 * Main embedded widget application
 * Renders ChatModal with all the embed-specific wiring
 */
export function EmbedApp({ config }: EmbedAppProps) {
  const [products, setProducts] = useState<Product[]>([]);

  // Load products from host callback on mount
  useEffect(() => {
    if (config.products?.enabled && eventBridge.hasProductsCallback()) {
      eventBridge
        .requestProducts()
        .then((fetchedProducts) => {
          setProducts(fetchedProducts);
        });
    }
  }, [config.products?.enabled]);

  // Analytics callbacks that wire to PostHog
  const analyticsCallbacks: AnalyticsCallbacks = {
    onChatOpened: () => {
      Analytics.widgetOpened();
      eventBridge.emit('open');
    },
    onChatMinimized: () => {
      Analytics.widgetMinimized();
      eventBridge.emit('minimize');
    },
    onChatMessageSent: (message, messageCount) => {
      Analytics.messageSent(messageCount);
      eventBridge.emit('messageSent', { message, messageCount });
    },
    onMessageReceived: ({ responseTimeMs }) => {
      Analytics.messageReceived(responseTimeMs);
    },
    onQuickReplyClicked: (text) => {
      Analytics.quickReplyClicked(text);
    },
    onSuggestedResponseClicked: (text) => {
      Analytics.suggestedResponseClicked(text);
    },
    onErrorOccurred: ({ error, errorType }) => {
      Analytics.errorOccurred(error, errorType);
      eventBridge.emit('error', { message: error, code: errorType });
    },
  };

  // Booking config with analytics wiring
  const bookingConfig: BookingConfig | undefined = config.booking?.enabled
    ? {
        enabled: true,
        title: config.booking.title,
        subtitle: config.booking.subtitle,
        hintText: config.booking.hintText,
        timeSlots: config.booking.timeSlots || DEFAULT_TIME_SLOTS,
        monthsAhead: config.booking.monthsAhead,
        onBookingSubmit: async (data: { date: Date; time: string; formData: BookingFormData }) => {
          // Emit event for host to handle
          eventBridge.emit('bookingSubmitted', data);

          // Post to haskyos booking API
          try {
            const response = await fetch(`${config.apiEndpoint || DEFAULT_API_ENDPOINT}/bookings`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Client-ID': config.clientId,
              },
              body: JSON.stringify({
                clientId: config.clientId,
                date: data.date.toISOString(),
                time: data.time,
                ...data.formData,
              }),
            });

            if (!response.ok) {
              throw new Error('Booking failed');
            }

            const result = await response.json();
            eventBridge.emit('bookingComplete', { ...data, bookingId: result.bookingId });
          } catch (error) {
            eventBridge.emit('error', {
              message: 'Failed to submit booking',
              code: 'BOOKING_SUBMIT_ERROR',
            });
          }
        },
        onBookingOpened: () => {
          Analytics.bookingOpened();
        },
        onDateSelected: (date) => {
          Analytics.bookingDateSelected(date.toISOString());
        },
        onTimeSelected: (time) => {
          Analytics.bookingTimeSelected(time);
        },
        onBookingSubmitted: ({ date, time }) => {
          Analytics.bookingSubmitted(date.toISOString(), time);
        },
        onBookingCompleted: ({ date, time, bookingDurationMs }) => {
          Analytics.bookingCompleted(date.toISOString(), time, bookingDurationMs);
        },
        onBookingAbandoned: ({ abandonedAtStep, durationMs }) => {
          Analytics.bookingAbandoned(abandonedAtStep, durationMs);
        },
      }
    : undefined;

  // Handle add to cart from product carousels
  const handleAddToCart = useCallback((product: Product, size?: string) => {
    cartStore.addItem(product, 1, size);
    // Emit addToCart event for host site to handle
    eventBridge.emit('addToCart', product);
  }, []);

  // Handle product click - emit event for host
  const handleProductClick = useCallback((product: Product) => {
    Analytics.productViewed(product.id, product.name);
    // If product has a slug, host might want to navigate
    if (product.slug) {
      window.open(product.slug, '_blank');
    }
  }, []);

  // Build request headers with client ID
  const headers: Record<string, string> = {
    'X-Client-ID': config.clientId,
  };

  return (
    <ChatModalProvider>
      <ChatModal
        // API
        apiEndpoint={config.apiEndpoint || DEFAULT_API_ENDPOINT}
        headers={headers}

        // Theming
        theme={config.theme || DEFAULT_THEME}
        storeName={config.storeName || DEFAULT_STORE_NAME}
        primaryColor={config.primaryColor}

        // Content
        welcomeMessage={config.welcomeMessage || DEFAULT_WELCOME_MESSAGE}
        placeholder={config.placeholder || DEFAULT_PLACEHOLDER}
        quickReplies={config.quickReplies}
        reopenButtonText={config.reopenButtonText || DEFAULT_REOPEN_TEXT}

        // Storage - use client-specific prefix
        storageKeyPrefix={`${EMBED_STORAGE_PREFIX}_${config.clientId}`}

        // Analytics
        analytics={analyticsCallbacks}

        // Booking
        booking={bookingConfig}

        // Products (static/featured)
        productSuggestions={
          config.products?.enabled && products.length > 0
            ? {
                enabled: true,
                products: products,
                headerText: config.products.headerText || 'Featured Products',
                onAddToCart: handleAddToCart,
                onProductClick: handleProductClick,
              }
            : undefined
        }

        // Dynamic AI suggestions
        dynamicProductSuggestions={
          config.products?.enableAISuggestions && eventBridge.hasProductsCallback()
            ? {
                enabled: true,
                getProducts: () => eventBridge.requestProducts(),
                headerText: 'Recommended for you',
                onAddToCart: handleAddToCart,
                onProductClick: handleProductClick,
              }
            : undefined
        }

        // Cart - render our embedded cart UI
        cart={
          config.payment
            ? {
                enabled: true,
                renderButton: <EmbedCartButton config={config} />,
              }
            : undefined
        }
      />
    </ChatModalProvider>
  );
}

/**
 * Embedded cart button component
 * Shows cart icon with count and handles checkout
 */
function EmbedCartButton({ config }: { config: ChatWidgetConfig }) {
  const [cartState, setCartState] = useState(cartStore.getState());
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Subscribe to cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      setCartState(cartStore.getState());
    };

    eventBridge.on('cartUpdated', handleCartUpdate);
    return () => {
      eventBridge.off('cartUpdated', handleCartUpdate);
    };
  }, []);

  const handleCheckoutClick = () => {
    if (cartState.totalItems > 0) {
      Analytics.checkoutStarted(cartState.totalItems, cartState.totalAmount);

      // If useExternalCheckout is enabled, emit event for host to handle
      if (config.payment?.useExternalCheckout) {
        eventBridge.emit('checkoutRequested', {
          items: cartState.items,
          totalAmount: cartState.totalAmount,
          currency: cartState.currency,
        });
      } else {
        // Use built-in checkout modal
        setIsCheckoutOpen(true);
        eventBridge.emit('checkoutStarted', { items: cartState.items });
      }
    }
  };

  return (
    <>
      <button
        onClick={handleCheckoutClick}
        className="pcm-cart-button"
        aria-label={`Cart with ${cartState.totalItems} items`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {cartState.totalItems > 0 && (
          <span className="pcm-cart-badge">{cartState.totalItems}</span>
        )}
      </button>

      {isCheckoutOpen && !config.payment?.useExternalCheckout && (
        <EmbedCheckoutModal
          config={config}
          cart={cartState}
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}
    </>
  );
}

/**
 * Embedded checkout modal
 * Handles the full checkout flow with Stripe/HitPay
 */
function EmbedCheckoutModal({
  config,
  cart,
  onClose,
}: {
  config: ChatWidgetConfig;
  cart: ReturnType<typeof cartStore.getState>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'review' | 'details' | 'payment' | 'success'>('review');
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePayment = async () => {
    if (!config.payment) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Call haskyos checkout API
      const response = await fetch(`${config.apiEndpoint || DEFAULT_API_ENDPOINT}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': config.clientId,
        },
        body: JSON.stringify({
          clientId: config.clientId,
          paymentProvider: config.payment.provider,
          items: cart.items.map((item) => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            size: item.size,
          })),
          customer: customerDetails,
          currency: cart.currency,
          totalAmount: cart.totalAmount,
        }),
      });

      if (!response.ok) {
        throw new Error('Checkout failed');
      }

      const result = await response.json();

      // Handle payment redirect or embedded payment
      if (result.paymentUrl) {
        // Redirect to payment provider
        window.location.href = result.paymentUrl;
      } else if (result.orderId) {
        // Payment completed (e.g., test mode)
        setStep('success');
        cartStore.clear();

        const checkoutResult = {
          orderId: result.orderId,
          status: 'success' as const,
          amount: cart.totalAmount,
          currency: cart.currency,
          items: cart.items,
          customer: customerDetails,
        };

        Analytics.checkoutCompleted(result.orderId, cart.totalAmount, cart.currency);
        eventBridge.emit('checkoutComplete', checkoutResult);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      Analytics.checkoutFailed(errorMessage);
      eventBridge.emit('checkoutFailed', { error: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cart.currency,
    }).format(amount);
  };

  return (
    <div className="pcm-checkout-overlay" onClick={onClose}>
      <div className="pcm-checkout-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pcm-checkout-close" onClick={onClose}>
          ×
        </button>

        {step === 'review' && (
          <>
            <h2 className="pcm-checkout-title">Your Cart</h2>
            <div className="pcm-checkout-items">
              {cart.items.map((item, index) => (
                <div key={`${item.product.id}-${item.size}-${index}`} className="pcm-checkout-item">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="pcm-checkout-item-image"
                  />
                  <div className="pcm-checkout-item-details">
                    <div className="pcm-checkout-item-name">{item.product.name}</div>
                    {item.size && (
                      <div className="pcm-checkout-item-size">Size: {item.size}</div>
                    )}
                    <div className="pcm-checkout-item-qty">Qty: {item.quantity}</div>
                  </div>
                  <div className="pcm-checkout-item-price">
                    {formatPrice(item.product.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            <div className="pcm-checkout-total">
              <span>Total</span>
              <span>{formatPrice(cart.totalAmount)}</span>
            </div>
            <button
              className="pcm-checkout-button"
              onClick={() => setStep('details')}
            >
              Continue to Checkout
            </button>
          </>
        )}

        {step === 'details' && (
          <>
            <h2 className="pcm-checkout-title">Your Details</h2>
            <form onSubmit={handleSubmitDetails} className="pcm-checkout-form">
              <div className="pcm-form-group">
                <label htmlFor="checkout-name">Name *</label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  value={customerDetails.name}
                  onChange={(e) =>
                    setCustomerDetails({ ...customerDetails, name: e.target.value })
                  }
                />
              </div>
              <div className="pcm-form-group">
                <label htmlFor="checkout-email">Email *</label>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  value={customerDetails.email}
                  onChange={(e) =>
                    setCustomerDetails({ ...customerDetails, email: e.target.value })
                  }
                />
              </div>
              <div className="pcm-form-group">
                <label htmlFor="checkout-phone">Phone</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  value={customerDetails.phone}
                  onChange={(e) =>
                    setCustomerDetails({ ...customerDetails, phone: e.target.value })
                  }
                />
              </div>
              <button type="submit" className="pcm-checkout-button">
                Continue to Payment
              </button>
            </form>
          </>
        )}

        {step === 'payment' && (
          <>
            <h2 className="pcm-checkout-title">Payment</h2>
            <div className="pcm-checkout-summary">
              <p>Total: {formatPrice(cart.totalAmount)}</p>
              <p>Payment via {config.payment?.provider === 'stripe' ? 'Stripe' : 'HitPay'}</p>
            </div>
            {error && <div className="pcm-checkout-error">{error}</div>}
            <button
              className="pcm-checkout-button"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : `Pay ${formatPrice(cart.totalAmount)}`}
            </button>
          </>
        )}

        {step === 'success' && (
          <>
            <div className="pcm-checkout-success">
              <div className="pcm-checkout-success-icon">✓</div>
              <h2>Thank You!</h2>
              <p>Your order has been placed successfully.</p>
              <button className="pcm-checkout-button" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
