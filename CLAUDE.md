# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React chat widget library (`@ducky777/chat-widget`) that provides phone-style chat modals with WhatsApp and iMessage themes. It's designed to be embedded in Next.js or React applications and connects to a backend chat API via SSE streaming.

## Commands

```bash
# Install dependencies
npm install

# Build the library (outputs to dist/)
npm run build

# Watch mode for development
npm run dev

# Type checking
npm run typecheck
```

## Architecture

### Build System
- Uses **tsup** for bundling (outputs CJS, ESM, and TypeScript declarations)
- Entry point: `src/index.ts`
- CSS is copied separately to `dist/styles.css` (not bundled with JS)
- React and React DOM are peer dependencies (externalized)

### Core Components

**ChatModal** (`src/components/ChatModal.tsx`)
- Main component that renders the phone-frame chat interface
- Manages modal open/close/minimize state with localStorage persistence
- Handles mobile swipe gestures for fullscreen/minimize
- Path-based visibility control (`hiddenPaths`, `minimizedByDefaultPaths`)
- Integrates booking modal, analytics, and persistence callbacks

**ChatModalProvider** (`src/context/ChatModalContext.tsx`)
- React context for controlling the chat modal from anywhere in the app
- `openChat(message?)` - opens modal with optional pre-loaded message
- Uses localStorage and storage events for cross-component sync

**useChat** (`src/hooks/use-chat.ts`)
- Core hook for chat state and SSE streaming
- Manages session IDs (persistent `session_id` in localStorage, per-tab `chat_session_id` in sessionStorage)
- Parses two SSE formats: FastAPI (`data: {...}`) and Vercel AI SDK (`0:"text"`)
- Extracts suggested responses from API response (via SSE event or JSON in content)
- Handles message persistence to localStorage for session resume

### API Contract

The widget expects POST requests to `apiEndpoint` with:
```json
{
  "session_id": "string",
  "chat_session_id": "string",
  "messages": [{"role": "user|assistant", "content": "string"}],
  ...requestParams
}
```

Response is SSE stream with chunks. Supports FastAPI format (`data: {"chunk": "..."}`) and Vercel AI SDK format (`0:"..."`).

### Styling
- All styles in `src/styles/styles.css`
- CSS custom properties for theming (prefixed `--pcm-` for phone chat modal, `--hocw-` for ribbon)
- Two themes: `whatsapp` and `imessage` (controlled via `theme` prop)

### Storage Keys
Default prefix is `hocw`. Keys used:
- `{prefix}_session_id` - persistent user session (localStorage)
- `{prefix}_chat_session_id` - current chat session (sessionStorage)
- `{prefix}_chat_messages` - cached messages (localStorage)
- `{prefix}-minimized` - modal open/close state (localStorage)

## Key Patterns

1. **SSR Safety**: All components use `'use client'` directive and check `typeof window` before accessing browser APIs
2. **Analytics**: Comprehensive callbacks (`analytics` prop) for tracking user engagement - implemented throughout ChatModal and useChat
3. **Hydration**: Components wait for hydration (`isHydrated` state) before rendering to prevent SSR/client mismatch
