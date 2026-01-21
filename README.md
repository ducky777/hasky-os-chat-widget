# @ducky777/chat-widget

Phone-style chat modal component with WhatsApp and iMessage themes. Fully configurable and framework-agnostic (works with Next.js, React, etc.).

## Installation

```bash
# From GitHub (private repo)
npm install github:ducky777/hasky-os-chat-widget

# Or with npm link for local development
cd /path/to/hasky-os-chat-widget
npm link

cd /path/to/your-project
npm link @ducky777/chat-widget
```

## Quick Start

```tsx
import { ChatModal, ChatModalProvider, FeaturedProductsCarousel } from '@ducky777/chat-widget';
import '@ducky777/chat-widget/styles';

function App() {
  return (
    <ChatModalProvider>
      <ChatModal
        apiEndpoint="/api/chat"
        theme="imessage"
        storeName="My App"
        welcomeMessage="Hello! How can I help you today?"
        placeholder="Type a message..."
        quickReplies={[
          { text: "Tell me more", subtext: "about your service" },
          { text: "Pricing info", subtext: "what does it cost?" },
        ]}
      />
      {/* Your app content */}
    </ChatModalProvider>
  );
}
```

## Components

### `<ChatModal />`

The main phone-style chat modal component.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | **required** | API endpoint for chat requests |
| `theme` | `'whatsapp' \| 'imessage'` | `'imessage'` | Chat UI theme |
| `storeName` | `string` | `'Chat'` | Display name in header |
| `requestParams` | `object` | `{}` | Additional params sent with each request (e.g., `vertical`, `intent`) |
| `headers` | `Record<string, string>` | `{}` | Custom headers to send with each request (e.g., `Authorization`, `X-API-Key`) |
| `welcomeMessage` | `string` | `'Hello! How can I help you today?'` | Initial welcome message |
| `placeholder` | `string` | `'Type a message...'` | Input placeholder text |
| `quickReplies` | `QuickReply[]` | `[]` | Quick reply buttons shown before conversation |
| `reopenButtonText` | `string` | `'Chat with us'` | Text for the floating reopen button |
| `hintText` | `string` | `''` | Hint text below input |
| `hiddenPaths` | `string[]` | `[]` | Paths where modal is completely hidden |
| `minimizedByDefaultPaths` | `string[]` | `[]` | Paths where modal starts minimized |
| `hideReopenButtonPaths` | `string[]` | `[]` | Paths where reopen button is hidden |
| `pathname` | `string` | `''` | Current pathname (from router) |
| `analytics` | `AnalyticsCallbacks` | `undefined` | Analytics event callbacks |
| `persistence` | `PersistenceCallbacks` | `undefined` | Persistence callbacks |
| `onCTAClick` | `() => void` | `undefined` | CTA button click handler |
| `showCTA` | `boolean` | `false` | Show floating CTA button |
| `ctaText` | `string` | `'Get Started'` | CTA button text |
| `storageKeyPrefix` | `string` | `'hocw'` | localStorage key prefix |
| `booking` | `BookingConfig` | `undefined` | Calendar booking feature configuration |
| `productSuggestions` | `ProductSuggestionsConfig` | `undefined` | Featured product suggestions configuration |

### `<FeaturedProductsCarousel />`

A carousel component for displaying featured product suggestions within the chat. Can be used standalone or integrated via the `productSuggestions` prop on ChatModal.

```tsx
import { FeaturedProductsCarousel } from '@ducky777/chat-widget';
import type { ProductSuggestionsConfig } from '@ducky777/chat-widget';

const config: ProductSuggestionsConfig = {
  enabled: true,
  headerText: 'Featured Products',
  products: [
    {
      id: '1',
      name: 'Baby Sleep Guide',
      price: 29.99,
      originalPrice: 49.99,
      image: '/images/sleep-guide.jpg',
      slug: 'baby-sleep-guide',
    },
    // more products...
  ],
  onAddToCart: (product) => console.log('Added to cart:', product),
  onProductClick: (product) => router.push(`/products/${product.slug}`),
};

<FeaturedProductsCarousel config={config} />
```

### `<FloatingPromptRibbon />`

A floating prompt ribbon component (like on success-stories page).

```tsx
import { FloatingPromptRibbon, useChatModal } from '@ducky777/chat-widget';

function MyPage() {
  const { openChat } = useChatModal();

  return (
    <FloatingPromptRibbon
      prompts={[
        { icon: "🌙", shortLabel: "Night Help", prompt: "Help me with night wakings" },
        { icon: "😴", shortLabel: "Nap Tips", prompt: "My baby won't nap" },
      ]}
      onPromptClick={(prompt) => openChat(prompt)}
      headerTitle="Quick Questions"
      headerSubtitle="Tap to ask"
    />
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `prompts` | `FloatingPrompt[]` | **required** | Array of prompts to display |
| `onPromptClick` | `(prompt: string) => void` | **required** | Click handler |
| `autoRotateInterval` | `number` | `4000` | Auto-rotate interval in ms |
| `headerTitle` | `string` | `'Quick prompts'` | Header title |
| `headerSubtitle` | `string` | `undefined` | Header subtitle |
| `className` | `string` | `''` | Additional CSS class |

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

Low-level hook for chat state management (used internally by ChatModal).

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
      hideReopenButtonPaths={['/success-stories']}
      requestParams={{
        vertical: 'MY_VERTICAL',
        intent: 'NONE',
      }}
      analytics={{
        onChatOpened: () => track('chat_opened'),
        onChatMessageSent: (msg, count) => track('message_sent', { msg, count }),
      }}
    />
  );
}
```

### With API Key Authentication

```tsx
// Option 1: Direct API key (for backend-to-backend or secure environments)
<ChatModal
  apiEndpoint="https://api.example.com/chat"
  headers={{
    'X-API-Key': process.env.NEXT_PUBLIC_CHAT_API_KEY!,
  }}
/>

// Option 2: Bearer token authentication
<ChatModal
  apiEndpoint="https://api.example.com/chat"
  headers={{
    'Authorization': `Bearer ${accessToken}`,
  }}
/>

// Option 3: Proxy through your own API (recommended for client-side apps)
// This way the API key stays on your server, not exposed to the client
<ChatModal
  apiEndpoint="/api/chat"  // Your Next.js/Express API route
  requestParams={{
    vertical: 'MY_VERTICAL',
  }}
/>
// Then in your /api/chat route, add the API key server-side:
// headers: { 'X-API-Key': process.env.CHAT_API_KEY }
```

### With Custom Persistence (Supabase)

```tsx
<ChatModal
  apiEndpoint="/api/chat"
  persistence={{
    onSaveMessage: async (message, sessionId) => {
      await supabase.from('messages').insert({
        session_id: sessionId,
        role: message.role,
        content: message.content,
      });
    },
    onSessionCreated: async (sessionId) => {
      await supabase.from('sessions').insert({ id: sessionId });
    },
  }}
/>
```

### With Full Analytics (PostHog Example)

The widget provides comprehensive analytics callbacks for tracking user engagement, conversion funnels, and session intelligence.

```tsx
<ChatModal
  apiEndpoint="/api/chat"
  analytics={{
    // Core chat events
    onChatOpened: () => posthog.capture('chat_opened'),
    onChatMinimized: () => posthog.capture('chat_minimized'),
    onChatFirstMessage: (message) => posthog.capture('chat_first_message', { message }),
    onChatMessageSent: (message, count, sessionId, chatSessionId) =>
      posthog.capture('chat_message_sent', { message, count, sessionId, chatSessionId }),
    onQuickReplyClicked: (text) => posthog.capture('quick_reply_clicked', { text }),
    onSuggestedResponseClicked: (text) => posthog.capture('suggested_response_clicked', { text }),
    onNewChatStarted: (sessionId) => posthog.capture('new_chat_started', { sessionId }),
    onCTAClicked: () => posthog.capture('cta_clicked'),

    // Engagement & UX metrics
    onMessageReceived: ({ responseTimeMs, messageLength, sessionId, chatSessionId }) =>
      posthog.capture('message_received', { responseTimeMs, messageLength, sessionId, chatSessionId }),
    onStreamingStarted: (sessionId, chatSessionId) =>
      posthog.capture('streaming_started', { sessionId, chatSessionId }),
    onStreamingEnded: ({ durationMs, messageLength, sessionId, chatSessionId }) =>
      posthog.capture('streaming_ended', { durationMs, messageLength, sessionId, chatSessionId }),
    onErrorOccurred: ({ error, errorType, sessionId, chatSessionId }) =>
      posthog.capture('chat_error', { error, errorType, sessionId, chatSessionId }),
    onTypingStarted: (sessionId, chatSessionId) =>
      posthog.capture('typing_started', { sessionId, chatSessionId }),
    onTypingAbandoned: ({ partialMessage, typingDurationMs, sessionId, chatSessionId }) =>
      posthog.capture('typing_abandoned', { partialMessage, typingDurationMs, sessionId, chatSessionId }),

    // Conversion & funnel
    onConversationCompleted: ({ messageCount, sessionDurationMs, sessionId, chatSessionId }) =>
      posthog.capture('conversation_completed', { messageCount, sessionDurationMs, sessionId, chatSessionId }),

    // Session intelligence
    onSessionResumed: ({ previousMessageCount, sessionId, chatSessionId }) =>
      posthog.capture('session_resumed', { previousMessageCount, sessionId, chatSessionId }),
    onChatCleared: ({ previousMessageCount, sessionId, chatSessionId }) =>
      posthog.capture('chat_cleared', { previousMessageCount, sessionId, chatSessionId }),
    onMessageCopied: ({ messageRole, messageLength, sessionId, chatSessionId }) =>
      posthog.capture('message_copied', { messageRole, messageLength, sessionId, chatSessionId }),

    // Mobile-specific
    onFullScreenEntered: (sessionId, chatSessionId) =>
      posthog.capture('fullscreen_entered', { sessionId, chatSessionId }),
    onFullScreenExited: (sessionId, chatSessionId) =>
      posthog.capture('fullscreen_exited', { sessionId, chatSessionId }),
    onSwipeMinimized: (sessionId, chatSessionId) =>
      posthog.capture('swipe_minimized', { sessionId, chatSessionId }),

    // Response quality
    onLinkClicked: ({ url, linkText, sessionId, chatSessionId }) =>
      posthog.capture('link_clicked', { url, linkText, sessionId, chatSessionId }),
  }}
/>
```

#### AnalyticsCallbacks Reference

| Callback | Parameters | Description |
|----------|------------|-------------|
| **Core Events** | | |
| `onChatOpened` | `()` | Chat modal opened |
| `onChatMinimized` | `()` | Chat modal minimized |
| `onChatFirstMessage` | `(message)` | First message sent in session |
| `onChatMessageSent` | `(message, count, sessionId?, chatSessionId?)` | Any message sent |
| `onQuickReplyClicked` | `(text)` | Quick reply button clicked |
| `onSuggestedResponseClicked` | `(text)` | AI-suggested response clicked |
| `onNewChatStarted` | `(sessionId)` | New chat session started |
| `onCTAClicked` | `()` | CTA button clicked |
| **Engagement & UX** | | |
| `onMessageReceived` | `({ responseTimeMs, messageLength, sessionId?, chatSessionId? })` | AI response received |
| `onStreamingStarted` | `(sessionId?, chatSessionId?)` | Streaming response started |
| `onStreamingEnded` | `({ durationMs, messageLength, sessionId?, chatSessionId? })` | Streaming completed |
| `onErrorOccurred` | `({ error, errorType, sessionId?, chatSessionId? })` | Error occurred (network/api/timeout/unknown) |
| `onTypingStarted` | `(sessionId?, chatSessionId?)` | User started typing |
| `onTypingAbandoned` | `({ partialMessage, typingDurationMs, sessionId?, chatSessionId? })` | User typed but didn't send |
| **Conversion** | | |
| `onConversationCompleted` | `({ messageCount, sessionDurationMs, sessionId?, chatSessionId? })` | 3+ message exchanges completed |
| **Session Intelligence** | | |
| `onSessionResumed` | `({ previousMessageCount, sessionId?, chatSessionId? })` | Returning user resumed chat |
| `onChatCleared` | `({ previousMessageCount, sessionId?, chatSessionId? })` | User cleared/started new chat |
| `onMessageCopied` | `({ messageRole, messageLength, sessionId?, chatSessionId? })` | User copied a message |
| **Mobile** | | |
| `onFullScreenEntered` | `(sessionId?, chatSessionId?)` | Chat expanded to fullscreen |
| `onFullScreenExited` | `(sessionId?, chatSessionId?)` | Chat exited fullscreen |
| `onSwipeMinimized` | `(sessionId?, chatSessionId?)` | User swiped to minimize |
| **Response Quality** | | |
| `onLinkClicked` | `({ url, linkText?, sessionId?, chatSessionId? })` | User clicked link in AI response |

### With Calendar Booking

Enable an in-chat calendar booking feature that allows users to schedule appointments directly from the chat modal. A calendar icon appears in the header when enabled.

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
      // Submit to your booking API
      await fetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          date: date.toISOString(),
          time,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          notes: formData.notes,
        }),
      });
    },
    onBookingOpened: () => track('booking_opened'),
    onDateSelected: (date) => track('booking_date_selected', { date }),
    onTimeSelected: (time) => track('booking_time_selected', { time }),
    onBookingSubmitted: ({ date, time }) => track('booking_submitted', { date, time }),
  }}
/>
```

#### BookingConfig Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable/disable the booking feature |
| `title` | `string` | `'Book an Appointment'` | Modal title |
| `subtitle` | `string` | `'Select a date for your appointment'` | Modal subtitle |
| `hintText` | `string` | `'Available Monday - Saturday, 9 AM - 5 PM'` | Hint text shown below calendar |
| `timeSlots` | `string[]` | Default slots (9 AM - 5 PM) | Available time slots to display |
| `monthsAhead` | `number` | `2` | How many months ahead users can book |
| `onBookingSubmit` | `(data) => void \| Promise<void>` | `undefined` | Called when form is submitted (for API integration) |
| `onBookingOpened` | `() => void` | `undefined` | Analytics: booking modal opened |
| `onDateSelected` | `(date: Date) => void` | `undefined` | Analytics: date selected |
| `onTimeSelected` | `(time: string) => void` | `undefined` | Analytics: time selected |
| `onBookingSubmitted` | `(data) => void` | `undefined` | Analytics: booking form submitted |
| `onBookingCompleted` | `({ date, time, bookingDurationMs }) => void` | `undefined` | Analytics: booking flow completed successfully |
| `onBookingAbandoned` | `({ abandonedAtStep, hadDateSelected, hadTimeSelected, durationMs }) => void` | `undefined` | Analytics: user closed booking without completing |

#### BookingFormData

The form collects the following user data:

```typescript
interface BookingFormData {
  name: string;   // Required
  phone: string;  // Required
  email: string;  // Optional
  notes: string;  // Optional
}
```

### With Product Suggestions

Display featured products within the chat widget. Products can be provided statically or fetched from an API endpoint. Useful for e-commerce applications to showcase relevant products during conversations.

```tsx
<ChatModal
  apiEndpoint="/api/chat"
  productSuggestions={{
    enabled: true,
    headerText: 'Recommended for You',
    products: [
      {
        id: 'prod-1',
        name: 'Baby Sleep Training eBook',
        price: 19.99,
        originalPrice: 29.99,  // Shows discount badge
        image: '/images/ebook-cover.jpg',
        slug: 'sleep-training-ebook',
      },
      {
        id: 'prod-2',
        name: 'White Noise Machine',
        price: 49.99,
        image: '/images/white-noise.jpg',
        slug: 'white-noise-machine',
      },
    ],
    onAddToCart: (product) => {
      // Add product to your cart system
      addToCart(product.id);
      toast.success(`${product.name} added to cart!`);
    },
    onProductClick: (product) => {
      // Navigate to product detail page
      router.push(`/products/${product.slug}`);
    },
  }}
/>
```

#### Fetching Products from API

Instead of providing static products, you can fetch them from an API endpoint:

```tsx
<ChatModal
  apiEndpoint="/api/chat"
  productSuggestions={{
    enabled: true,
    apiEndpoint: '/api/featured-products',  // Returns { products: Product[] }
    headerText: 'Featured Products',
    onAddToCart: (product) => addToCart(product.id),
    onProductClick: (product) => router.push(`/products/${product.slug}`),
  }}
/>
```

#### ProductSuggestionsConfig Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable/disable product suggestions |
| `products` | `Product[]` | `[]` | Static list of products to display |
| `apiEndpoint` | `string` | `undefined` | API endpoint to fetch products (alternative to static list) |
| `headerText` | `string` | `'Featured Products'` | Header text above the carousel |
| `onAddToCart` | `(product: Product) => void` | `undefined` | Callback when add to cart button is clicked |
| `onProductClick` | `(product: Product) => void` | `undefined` | Callback when product image is clicked |

#### Product Type

```typescript
interface Product {
  id: string;           // Unique product identifier
  name: string;         // Product display name
  price: number;        // Current price
  originalPrice?: number; // Original price (shows discount badge if higher than price)
  image: string;        // Product image URL
  slug?: string;        // URL-friendly identifier for routing
}
```

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

## Theming

The component uses CSS custom properties that you can override:

```css
:root {
  /* WhatsApp Theme */
  --pcm-wa-primary: #008069;
  --pcm-wa-primary-light: #00a884;
  /* ... */

  /* iMessage Theme */
  --pcm-im-primary: #007AFF;
  --pcm-im-primary-light: #409CFF;
  /* ... */

  /* Floating Prompt Ribbon */
  --hocw-ribbon-accent: #d4c5a3;
  --hocw-ribbon-bg: rgba(30, 30, 35, 0.8);
  /* ... */
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Type check
npm run typecheck
```

## License

Private - All rights reserved
