# CDN Installation Guide

Add a chat widget to any website with a single script tag. No build tools required.

## Quick Start

```html
<script src="https://widget.haskyos.com/v1/chat-widget.min.js"></script>
<script>
  ChatWidget.init({
    clientId: 'your-client-id'
  });
</script>
```

That's it! The widget appears in the bottom-right corner of your page.

---

## Full Configuration

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

    // Content customization
    welcomeMessage: 'Hi there! How can we help?',
    placeholder: 'Ask us anything...',
    reopenButtonText: 'Need help?',

    // Initial state
    startMinimized: false,
    minimizedByDefaultPaths: ['/checkout', '/cart'],

    // Enable product catalog
    products: {
      enabled: true
    },

    // Provide products from your backend
    getProducts: async function() {
      const response = await fetch('/api/products');
      return response.json();
    },

    // Enable booking calendar
    booking: {
      enabled: true
    },

    // Payment configuration
    payment: {
      provider: 'stripe',
      publicKey: 'pk_live_xxx'
    }
  });
</script>
```

---

## Configuration Options

### Required

| Option | Type | Description |
|--------|------|-------------|
| `clientId` | `string` | Your unique client identifier (provided by Hasky) |

### Optional

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `'whatsapp'` \| `'imessage'` | `'whatsapp'` | Chat UI theme |
| `storeName` | `string` | `'Store'` | Name displayed in chat header |
| `apiEndpoint` | `string` | `'https://api.haskyos.com/v1/chat'` | Chat API endpoint |
| `welcomeMessage` | `string` | `'Hello! How can I help you today?'` | Initial welcome message |
| `placeholder` | `string` | `'Type a message...'` | Input placeholder text |
| `reopenButtonText` | `string` | `'Chat with us'` | Text on floating button when minimized |
| `startMinimized` | `boolean` | `false` | Start widget minimized (showing only floating button) |
| `minimizedByDefaultPaths` | `string[]` | `[]` | Paths where widget starts minimized by default |
| `products.enabled` | `boolean` | `false` | Enable product catalog |
| `booking.enabled` | `boolean` | `false` | Enable booking calendar |
| `payment.provider` | `'stripe'` \| `'hitpay'` | - | Payment provider |
| `payment.publicKey` | `string` | - | Payment provider public key |
| `getProducts` | `function` | - | Async function returning product array |

### Product Object

```javascript
{
  id: 'prod-123',
  name: 'T-Shirt',
  price: 29.99,
  image: 'https://example.com/shirt.jpg',  // optional
  description: 'Cotton t-shirt',            // optional
  sizes: ['S', 'M', 'L', 'XL'],             // optional
  category: 'Clothing'                      // optional
}
```

---

## Events

Listen for user actions:

```javascript
// Checkout completed
ChatWidget.on('checkoutComplete', function(result) {
  console.log('Order ID:', result.orderId);
  console.log('Total:', result.total);
});

// Booking submitted
ChatWidget.on('bookingComplete', function(data) {
  console.log('Booking:', data);
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

### Event Reference

| Event | Payload | Description |
|-------|---------|-------------|
| `checkoutComplete` | `{ orderId, total, items }` | Checkout completed |
| `bookingComplete` | `BookingFormData` | Booking submitted |
| `cartUpdated` | `{ items, total }` | Cart changed |
| `messageSent` | `{ content, role }` | Message sent |
| `chatOpened` | - | Chat opened |
| `chatClosed` | - | Chat closed |

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

// Get current cart
const cart = ChatWidget.getCart();

// Clear the cart
ChatWidget.clearCart();

// Destroy the widget
ChatWidget.destroy();

// Check if initialized
ChatWidget.isInitialized();

// Get version
ChatWidget.version;
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
| `https://widget.haskyos.com/v1/chat-widget.min.js` | Stable (cached 1 year) |
| `https://widget.haskyos.com/latest/chat-widget.min.js` | Latest (cached 1 hour) |

Use `/v1/` in production. Use `/latest/` for testing.

---

## Troubleshooting

**Widget not appearing**
1. Check browser console for errors
2. Verify `clientId` is correct
3. Ensure script loads before `ChatWidget.init()`

**Styles look broken**
- The widget uses Shadow DOM for isolation
- Check for `!important` rules targeting `*` in your CSS

**CORS errors**
- Ensure your `/api/products` endpoint returns proper CORS headers

**Payment not working**
1. Verify `payment.publicKey` is correct
2. Check Stripe/HitPay dashboard for errors
3. Use correct key (live vs test)

---

## Support

- GitHub: https://github.com/ducky777/hasky-os-chat-widget/issues
- Email: support@haskyos.com
