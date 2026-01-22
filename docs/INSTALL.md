# Chat Widget Installation Guide

## CDN Embed (Recommended)

Add a single script tag to your website. The widget loads in an isolated Shadow DOM, so it won't conflict with your existing styles.

### Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <!-- Your website content -->

  <!-- Chat Widget -->
  <script src="https://widget.haskyos.com/v1/chat-widget.min.js"></script>
  <script>
    ChatWidget.init({
      clientId: 'your-client-id',
      theme: 'whatsapp'
    });
  </script>
</body>
</html>
```

### Full Configuration

```html
<script src="https://widget.haskyos.com/v1/chat-widget.min.js"></script>
<script>
  ChatWidget.init({
    // Required
    clientId: 'your-client-id',

    // Theme: 'whatsapp' or 'imessage'
    theme: 'whatsapp',

    // Store name displayed in chat header
    storeName: 'My Store',

    // Chat API endpoint (provided by Hasky)
    apiEndpoint: 'https://api.haskyos.com/v1/chat',

    // Enable product catalog
    products: {
      enabled: true
    },

    // Provide products from your backend
    getProducts: async function() {
      const response = await fetch('/api/products');
      return response.json();
      // Must return: [{ id, name, price, image?, description?, sizes? }]
    },

    // Enable booking calendar
    booking: {
      enabled: true
    },

    // Payment configuration
    payment: {
      provider: 'stripe',      // 'stripe' or 'hitpay'
      publicKey: 'pk_live_xxx' // Your Stripe publishable key
    }
  });
</script>
```

---

## Configuration Reference

### Required Options

| Option | Type | Description |
|--------|------|-------------|
| `clientId` | `string` | Your unique client identifier (provided by Hasky) |

### Optional Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `'whatsapp'` \| `'imessage'` | `'whatsapp'` | Chat UI theme |
| `storeName` | `string` | `'Store'` | Name displayed in chat header |
| `apiEndpoint` | `string` | `'https://api.haskyos.com/v1/chat'` | Chat API endpoint |
| `products.enabled` | `boolean` | `false` | Enable product catalog |
| `booking.enabled` | `boolean` | `false` | Enable booking calendar |
| `payment.provider` | `'stripe'` \| `'hitpay'` | - | Payment provider |
| `payment.publicKey` | `string` | - | Payment provider public key |
| `getProducts` | `function` | - | Async function returning product array |

### Product Object Structure

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  sizes?: string[];       // e.g., ['S', 'M', 'L', 'XL']
  category?: string;
}
```

---

## Events

Listen for events to respond to user actions:

```javascript
// Checkout completed
ChatWidget.on('checkoutComplete', function(result) {
  console.log('Order ID:', result.orderId);
  console.log('Total:', result.total);
  // Redirect to order confirmation, update inventory, etc.
});

// Booking submitted
ChatWidget.on('bookingComplete', function(data) {
  console.log('Booking:', data);
  // Send confirmation email, update calendar, etc.
});

// Cart updated
ChatWidget.on('cartUpdated', function(cart) {
  console.log('Cart items:', cart.items);
  console.log('Cart total:', cart.total);
});

// Chat message sent
ChatWidget.on('messageSent', function(message) {
  console.log('User sent:', message.content);
});

// Chat opened/closed
ChatWidget.on('chatOpened', function() {
  console.log('Chat opened');
});

ChatWidget.on('chatClosed', function() {
  console.log('Chat closed');
});
```

### Available Events

| Event | Payload | Description |
|-------|---------|-------------|
| `checkoutComplete` | `{ orderId, total, items }` | Checkout completed successfully |
| `bookingComplete` | `BookingFormData` | Booking form submitted |
| `cartUpdated` | `{ items, total }` | Cart contents changed |
| `messageSent` | `{ content, role }` | User sent a message |
| `chatOpened` | - | Chat modal opened |
| `chatClosed` | - | Chat modal closed |

---

## API Methods

Control the widget programmatically:

```javascript
// Open the chat
ChatWidget.open();

// Open with a pre-loaded message
ChatWidget.open('I want to place an order');

// Close the chat
ChatWidget.close();

// Add item to cart
ChatWidget.addToCart(product, quantity, size);

// Get current cart state
const cart = ChatWidget.getCart();
console.log(cart.items, cart.total);

// Clear the cart
ChatWidget.clearCart();

// Remove all event listeners and unmount
ChatWidget.destroy();

// Check if initialized
if (ChatWidget.isInitialized()) {
  ChatWidget.open();
}

// Get widget version
console.log(ChatWidget.version);
```

---

## Examples

### E-commerce Store

```html
<script src="https://widget.haskyos.com/v1/chat-widget.min.js"></script>
<script>
  ChatWidget.init({
    clientId: 'store-123',
    theme: 'whatsapp',
    storeName: 'Fashion Store',
    products: { enabled: true },
    getProducts: async () => {
      const res = await fetch('/api/products');
      return res.json();
    },
    payment: {
      provider: 'stripe',
      publicKey: 'pk_live_xxxxxxxxxxxx'
    }
  });

  ChatWidget.on('checkoutComplete', (result) => {
    // Track conversion
    gtag('event', 'purchase', {
      transaction_id: result.orderId,
      value: result.total
    });
  });
</script>
```

### Service Booking

```html
<script src="https://widget.haskyos.com/v1/chat-widget.min.js"></script>
<script>
  ChatWidget.init({
    clientId: 'salon-456',
    theme: 'imessage',
    storeName: 'Beauty Salon',
    booking: { enabled: true }
  });

  ChatWidget.on('bookingComplete', (data) => {
    // Send to your booking system
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  });
</script>
```

### Custom Button Trigger

```html
<button id="chat-btn">Chat with us</button>

<script src="https://widget.haskyos.com/v1/chat-widget.min.js"></script>
<script>
  ChatWidget.init({
    clientId: 'my-client-id',
    theme: 'whatsapp',
    storeName: 'Support'
  });

  document.getElementById('chat-btn').addEventListener('click', () => {
    ChatWidget.open('Hi, I need help');
  });
</script>
```

---

## Versioning

| URL | Description |
|-----|-------------|
| `https://widget.haskyos.com/v1/chat-widget.min.js` | Version 1 (stable, cached 1 year) |
| `https://widget.haskyos.com/latest/chat-widget.min.js` | Latest version (cached 1 hour) |

**Recommendation**: Use `/v1/` in production for stability. Use `/latest/` only for testing new features.

---

## Troubleshooting

### Widget not appearing

1. Check browser console for errors
2. Verify `clientId` is correct
3. Ensure script is loaded before calling `ChatWidget.init()`

### Styles look broken

The widget uses Shadow DOM for style isolation. If styles still leak:
1. Check for `!important` rules in your global CSS targeting `*`
2. Verify no CSS resets targeting all elements

### CORS errors

If you see CORS errors when fetching products:
1. Ensure your `/api/products` endpoint returns proper CORS headers
2. Or use a server-side proxy

### Payment not working

1. Verify `payment.publicKey` is correct
2. Check Stripe/HitPay dashboard for errors
3. Ensure you're using the correct key (live vs test)

---

## Support

- GitHub Issues: https://github.com/ducky777/hasky-os-chat-widget/issues
- Email: support@haskyos.com
