# @ducky777/chat-widget

Phone-style chat modal component with WhatsApp and iMessage themes. Supports CDN embedding with full checkout flow for easy client integration.

## Installation Options

### Option 1: CDN Embed (Recommended for Clients)

Add a single script tag to embed the widget on any website:

```html
<script src="https://widget.haskyos.com/v1/chat-widget.min.js"></script>
<script>
  ChatWidget.init({
    clientId: 'your-client-id',
    theme: 'whatsapp',
    storeName: 'My Store',

    // Products - provide a function to fetch your products
    products: { enabled: true },
    getProducts: async () => {
      const res = await fetch('/api/my-products');
      return res.json();
    },

    // Payment (optional)
    payment: {
      provider: 'stripe',  // or 'hitpay'
      publicKey: 'pk_live_xxx'
    },

    // Booking calendar (optional)
    booking: { enabled: true }
  });

  // Listen for events
  ChatWidget.on('checkoutComplete', (result) => {
    console.log('Order placed:', result.orderId);
  });

  ChatWidget.on('bookingComplete', (data) => {
    console.log('Booking confirmed:', data);
  });
</script>
```

### Option 2: npm Package (React Wrapper)

For React/Next.js apps that want the CDN widget with a React-friendly API:

```bash
npm install github:ducky777/hasky-os-chat-widget
```

```tsx
import { ChatWidgetEmbed } from '@ducky777/chat-widget';

function App() {
  return (
    <ChatWidgetEmbed
      clientId="your-client-id"
      theme="whatsapp"
      storeName="My Store"
      getProducts={async () => fetchProducts()}
      payment={{ provider: 'stripe', publicKey: 'pk_live_xxx' }}
      booking={{ enabled: true }}
      onCheckoutComplete={(result) => {
        router.push(`/order/${result.orderId}`);
      }}
    />
  );
}
```

### Option 3: Full React Component (Direct Integration)

For apps that need full control over the chat modal:

```bash
npm install github:ducky777/hasky-os-chat-widget
```

```tsx
import { ChatModal, ChatModalProvider } from '@ducky777/chat-widget';
import '@ducky777/chat-widget/styles';

function App() {
  return (
    <ChatModalProvider>
      <ChatModal
        apiEndpoint="/api/chat"
        theme="imessage"
        storeName="My App"
        welcomeMessage="Hello! How can I help you today?"
      />
    </ChatModalProvider>
  );
}
```

---

## CDN Widget API Reference

### `ChatWidget.init(config)`

Initialize the widget with configuration.

```typescript
interface ChatWidgetConfig {
  // Required
  clientId: string;              // Your client ID for authentication

  // Optional
  apiEndpoint?: string;          // Custom API endpoint (default: haskyos API)
  theme?: 'whatsapp' | 'imessage';  // UI theme (default: 'imessage')
  storeName?: string;            // Brand name in header (default: 'Chat')
  primaryColor?: string;         // Accent color (hex)
  welcomeMessage?: string;       // Initial welcome message
  placeholder?: string;          // Input placeholder
  quickReplies?: QuickReply[];   // Quick reply buttons
  reopenButtonText?: string;     // Text on minimized button

  // Features
  booking?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    hintText?: string;
    timeSlots?: string[];
    monthsAhead?: number;
  };

  products?: {
    enabled?: boolean;
    headerText?: string;
    enableAISuggestions?: boolean;
  };

  payment?: {
    provider: 'stripe' | 'hitpay';
    publicKey: string;
  };

  // Callbacks
  getProducts?: () => Promise<Product[]> | Product[];
}
```

### `ChatWidget.on(event, handler)`

Register event listeners.

| Event | Data | Description |
|-------|------|-------------|
| `ready` | `void` | Widget initialized |
| `open` | `void` | Chat modal opened |
| `close` | `void` | Chat modal closed |
| `minimize` | `void` | Chat modal minimized |
| `cartUpdated` | `CartState` | Cart contents changed |
| `checkoutStarted` | `{ items }` | Checkout flow started |
| `checkoutComplete` | `CheckoutResult` | Payment successful |
| `checkoutFailed` | `{ error, code? }` | Payment failed |
| `bookingSubmitted` | `{ date, time, formData }` | Booking form submitted |
| `bookingComplete` | `{ date, time, formData, bookingId? }` | Booking confirmed |
| `messageSent` | `{ message, messageCount }` | User sent a message |
| `error` | `{ message, code? }` | Error occurred |

### `ChatWidget.open(message?)`

Open the chat modal, optionally with a pre-loaded message.

### `ChatWidget.close()`

Close/minimize the chat modal.

### `ChatWidget.getCart()`

Get current cart state.

### `ChatWidget.addToCart(product, quantity?, size?)`

Add item to cart programmatically.

### `ChatWidget.clearCart()`

Clear all items from cart.

### `ChatWidget.destroy()`

Remove the widget and clean up.

---

## ChatWidgetEmbed Props (React Wrapper)

```tsx
interface ChatWidgetEmbedProps {
  clientId: string;              // Required

  // Config (same as CDN)
  apiEndpoint?: string;
  theme?: 'whatsapp' | 'imessage';
  storeName?: string;
  primaryColor?: string;
  welcomeMessage?: string;
  placeholder?: string;
  quickReplies?: QuickReply[];
  reopenButtonText?: string;
  booking?: EmbedBookingConfig;
  products?: EmbedProductsConfig;
  payment?: PaymentConfig;
  getProducts?: () => Promise<Product[]> | Product[];

  // Event callbacks
  onReady?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
  onCartUpdated?: (cart: CartState) => void;
  onCheckoutStarted?: (data: { items }) => void;
  onCheckoutComplete?: (result: CheckoutResult) => void;
  onCheckoutFailed?: (error: { error, code? }) => void;
  onBookingSubmitted?: (data: { date, time, formData }) => void;
  onBookingComplete?: (data: { date, time, formData, bookingId? }) => void;
  onMessageSent?: (data: { message, messageCount }) => void;
  onError?: (error: { message, code? }) => void;

  // Custom CDN URL (optional)
  cdnUrl?: string;
}
```

---

## Full React Component Reference

### `<ChatModal />`

The main phone-style chat modal component for direct integration.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | **required** | API endpoint for chat requests |
| `theme` | `'whatsapp' \| 'imessage'` | `'imessage'` | Chat UI theme |
| `storeName` | `string` | `'Chat'` | Display name in header |
| `requestParams` | `object` | `{}` | Additional params sent with each request |
| `headers` | `Record<string, string>` | `{}` | Custom headers for requests |
| `welcomeMessage` | `string` | `'Hello! How can I help you today?'` | Initial welcome message |
| `placeholder` | `string` | `'Type a message...'` | Input placeholder text |
| `quickReplies` | `QuickReply[]` | `[]` | Quick reply buttons |
| `reopenButtonText` | `string` | `'Chat with us'` | Text for reopen button |
| `hintText` | `string` | `''` | Hint text below input |
| `hiddenPaths` | `string[]` | `[]` | Paths where modal is hidden |
| `minimizedByDefaultPaths` | `string[]` | `[]` | Paths where modal starts minimized |
| `hideReopenButtonPaths` | `string[]` | `[]` | Paths where reopen button is hidden |
| `pathname` | `string` | `''` | Current pathname (from router) |
| `analytics` | `AnalyticsCallbacks` | `undefined` | Analytics event callbacks |
| `persistence` | `PersistenceCallbacks` | `undefined` | Persistence callbacks |
| `onCTAClick` | `() => void` | `undefined` | CTA button click handler |
| `showCTA` | `boolean` | `false` | Show floating CTA button |
| `ctaText` | `string` | `'Get Started'` | CTA button text |
| `storageKeyPrefix` | `string` | `'hocw'` | localStorage key prefix |
| `booking` | `BookingConfig` | `undefined` | Calendar booking configuration |
| `cart` | `CartConfig` | `undefined` | Cart button configuration |
| `productSuggestions` | `ProductSuggestionsConfig` | `undefined` | Product suggestions configuration |
| `dynamicProductSuggestions` | `DynamicProductSuggestionsConfig` | `undefined` | AI product suggestions configuration |

### `<FeaturedProductsCarousel />`

A carousel component for displaying featured products.

```tsx
import { FeaturedProductsCarousel } from '@ducky777/chat-widget';

<FeaturedProductsCarousel
  config={{
    enabled: true,
    headerText: 'Featured Products',
    products: [
      {
        id: '1',
        name: 'Product Name',
        price: 29.99,
        originalPrice: 49.99,
        image: '/images/product.jpg',
        slug: 'product-slug',
      },
    ],
    onAddToCart: (product) => console.log('Add to cart:', product),
    onProductClick: (product) => router.push(`/products/${product.slug}`),
  }}
/>
```

### `<FloatingPromptRibbon />`

A floating prompt ribbon component.

```tsx
import { FloatingPromptRibbon, useChatModal } from '@ducky777/chat-widget';

function MyPage() {
  const { openChat } = useChatModal();

  return (
    <FloatingPromptRibbon
      prompts={[
        { icon: "🌙", shortLabel: "Night Help", prompt: "Help with night wakings" },
        { icon: "😴", shortLabel: "Nap Tips", prompt: "My baby won't nap" },
      ]}
      onPromptClick={(prompt) => openChat(prompt)}
      headerTitle="Quick Questions"
    />
  );
}
```

---

## Hooks

### `useChatModal()`

Access the chat modal context.

```tsx
const { openChat, pendingMessage, clearPendingMessage, isOpen, setIsOpen } = useChatModal();

// Open chat with a pre-loaded message
openChat("I need help with sleep training");

// Open chat without a message
openChat();
```

### `useChat(options)`

Low-level hook for chat state management.

```tsx
const {
  messages,
  isLoading,
  isStreaming,
  streamingMessage,
  suggestedResponses,
  sendMessage,
  startNewChat,
  clearMessages,
  error,
} = useChat({
  apiEndpoint: '/api/chat',
  requestParams: { vertical: 'SAGE' },
});
```

---

## Configuration Examples

### With Next.js App Router

```tsx
// app/layout.tsx
import { ChatModalProvider } from '@ducky777/chat-widget';
import '@ducky777/chat-widget/styles';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ChatModalProvider>
          {children}
        </ChatModalProvider>
      </body>
    </html>
  );
}

// app/components/Chat.tsx
'use client';

import { usePathname } from 'next/navigation';
import { ChatModal } from '@ducky777/chat-widget';

export function Chat() {
  const pathname = usePathname();

  return (
    <ChatModal
      apiEndpoint="/api/chat"
      theme="imessage"
      storeName="My App"
      pathname={pathname}
      hiddenPaths={['/checkout', '/onboarding']}
      minimizedByDefaultPaths={['/guides']}
    />
  );
}
```

### With Calendar Booking

```tsx
<ChatModal
  apiEndpoint="/api/chat"
  booking={{
    enabled: true,
    title: 'Book a Consultation',
    subtitle: 'Select a date for your appointment',
    hintText: 'Available Monday - Friday, 9 AM - 5 PM',
    timeSlots: [
      '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
      '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM',
    ],
    monthsAhead: 2,
    onBookingSubmit: async ({ date, time, formData }) => {
      await fetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({ date, time, ...formData }),
      });
    },
  }}
/>
```

### With Full Analytics

```tsx
<ChatModal
  apiEndpoint="/api/chat"
  analytics={{
    onChatOpened: () => posthog.capture('chat_opened'),
    onChatMinimized: () => posthog.capture('chat_minimized'),
    onChatMessageSent: (message, count, sessionId, chatSessionId) =>
      posthog.capture('chat_message_sent', { message, count, sessionId, chatSessionId }),
    onMessageReceived: ({ responseTimeMs, messageLength }) =>
      posthog.capture('message_received', { responseTimeMs, messageLength }),
    onErrorOccurred: ({ error, errorType }) =>
      posthog.capture('chat_error', { error, errorType }),
    onConversationCompleted: ({ messageCount, sessionDurationMs }) =>
      posthog.capture('conversation_completed', { messageCount, sessionDurationMs }),
  }}
/>
```

---

## API Contract

The chat endpoint should accept POST requests with:

```typescript
{
  session_id: string;
  chat_session_id: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  // ...plus any requestParams you pass
}
```

And return SSE (Server-Sent Events) in one of these formats:

```
// FastAPI format
data: {"chunk": "Hello"}
data: {"chunk": " there"}
data: {"done": true}

// Vercel AI SDK format
0:"Hello"
0:" there"
d:{"finishReason":"stop"}
```

---

## Theming

The component uses CSS custom properties that you can override:

```css
:root {
  /* WhatsApp Theme */
  --pcm-wa-primary: #008069;
  --pcm-wa-primary-light: #00a884;

  /* iMessage Theme */
  --pcm-im-primary: #007AFF;
  --pcm-im-primary-light: #409CFF;

  /* Floating Prompt Ribbon */
  --hocw-ribbon-accent: #d4c5a3;
  --hocw-ribbon-bg: rgba(30, 30, 35, 0.8);
}
```

---

## Development

```bash
# Install dependencies
npm install

# Build library + CDN bundle
npm run build

# Build with PostHog key (for production CDN)
POSTHOG_API_KEY=your_key npm run build:embed

# Watch mode
npm run dev

# Type check
npm run typecheck
```

## CDN Hosting

The CDN bundle is output to `dist/embed/v1/`:
- `chat-widget.min.js` - Main bundle (~400KB, includes React)
- `styles.css` - Widget styles

Deploy to Vercel with subdomain `widget.haskyos.com`. The `vercel.json` configures:
- CORS headers for cross-origin loading
- Cache headers (1 year for versioned, 1 hour for `/latest/`)
- Rewrites from `/v1/*` to the embed bundle

---

## License

Private - All rights reserved
