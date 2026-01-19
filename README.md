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
| `onBookingSubmitted` | `(data) => void` | `undefined` | Analytics: booking confirmed |

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
