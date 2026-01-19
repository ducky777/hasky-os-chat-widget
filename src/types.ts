/**
 * Chat message type
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

/**
 * Chat style theme
 */
export type ChatStyle = 'whatsapp' | 'imessage';

/**
 * Quick reply option shown before conversation starts
 */
export interface QuickReply {
  text: string;
  subtext?: string;
}

/**
 * Floating prompt for FloatingPromptRibbon
 */
export interface FloatingPrompt {
  icon: string;
  shortLabel: string;
  prompt: string;
}

/**
 * Request parameters sent to the chat API
 */
export interface ChatRequestParams {
  /** Vertical/product identifier */
  vertical?: string;
  /** Intent identifier */
  intent?: string;
  /** Any additional custom parameters */
  [key: string]: unknown;
}

/**
 * Analytics event callbacks
 */
export interface AnalyticsCallbacks {
  onChatOpened?: () => void;
  onChatMinimized?: () => void;
  onChatFirstMessage?: (message: string) => void;
  onChatMessageSent?: (message: string, messageCount: number, sessionId?: string, chatSessionId?: string) => void;
  onQuickReplyClicked?: (text: string) => void;
  onSuggestedResponseClicked?: (text: string) => void;
  onNewChatStarted?: (sessionId: string) => void;
  onCTAClicked?: () => void;
}

/**
 * Persistence callbacks for saving/loading chat history
 */
export interface PersistenceCallbacks {
  /** Called when a message should be saved */
  onSaveMessage?: (message: ChatMessage, sessionId: string) => void | Promise<void>;
  /** Called to load chat history on mount */
  onLoadHistory?: (sessionId: string) => Promise<ChatMessage[]> | ChatMessage[];
  /** Called when a new session is created */
  onSessionCreated?: (sessionId: string) => void | Promise<void>;
}

/**
 * Main ChatModal component props
 */
export interface ChatModalProps {
  // Required
  /** API endpoint for chat requests */
  apiEndpoint: string;

  // Theming
  /** Chat UI theme: 'whatsapp' or 'imessage' */
  theme?: ChatStyle;
  /** Display name shown in header */
  storeName?: string;
  /** Primary accent color (hex) */
  primaryColor?: string;

  // Request configuration
  /** Parameters to send with each chat request */
  requestParams?: ChatRequestParams;

  // Content
  /** Welcome message shown at start */
  welcomeMessage?: string;
  /** Input placeholder text */
  placeholder?: string;
  /** Quick reply options shown before conversation */
  quickReplies?: QuickReply[];
  /** Text for the reopen button */
  reopenButtonText?: string;
  /** Hint text shown below input */
  hintText?: string;

  // Path-based behavior (for Next.js/React Router)
  /** Paths where modal is completely hidden */
  hiddenPaths?: string[];
  /** Paths where modal starts minimized */
  minimizedByDefaultPaths?: string[];
  /** Paths where reopen button is hidden */
  hideReopenButtonPaths?: string[];
  /** Current pathname (pass from usePathname or useLocation) */
  pathname?: string;

  // Callbacks
  /** Analytics event callbacks */
  analytics?: AnalyticsCallbacks;
  /** Persistence callbacks for chat history */
  persistence?: PersistenceCallbacks;
  /** Called when CTA button is clicked */
  onCTAClick?: () => void;

  // CTA configuration
  /** Show floating CTA button in messages */
  showCTA?: boolean;
  /** CTA button text */
  ctaText?: string;

  // Session configuration
  /** Storage key prefix for localStorage */
  storageKeyPrefix?: string;
}

/**
 * ChatModalProvider context value
 */
export interface ChatModalContextValue {
  /** Pending message to send when modal opens */
  pendingMessage: string | null;
  /** Open the chat modal, optionally with a pre-loaded message */
  openChat: (message?: string) => void;
  /** Clear the pending message */
  clearPendingMessage: () => void;
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Set modal open state directly */
  setIsOpen: (open: boolean) => void;
}

/**
 * FloatingPromptRibbon component props
 */
export interface FloatingPromptRibbonProps {
  /** Array of prompts to display */
  prompts: FloatingPrompt[];
  /** Called when a prompt is clicked */
  onPromptClick: (prompt: string) => void;
  /** Auto-rotate interval in ms (default: 4000) */
  autoRotateInterval?: number;
  /** Header title (default: "Ask SAGE") */
  headerTitle?: string;
  /** Header subtitle */
  headerSubtitle?: string;
  /** Custom class name */
  className?: string;
}

/**
 * useChat hook options
 */
export interface UseChatOptions {
  /** API endpoint for chat requests */
  apiEndpoint: string;
  /** Request parameters to send with each message */
  requestParams?: ChatRequestParams;
  /** Storage key prefix */
  storageKeyPrefix?: string;
  /** Persistence callbacks */
  persistence?: PersistenceCallbacks;
}

/**
 * useChat hook return value
 */
export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessage: string;
  suggestedResponses: string[];
  sendMessage: (content: string) => Promise<void>;
  startNewChat: () => void;
  clearMessages: () => void;
  error: string | null;
}
