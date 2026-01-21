/**
 * Product type for featured products
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  slug?: string;
  /** Currency code (default: 'SGD') */
  currency?: string;
  /** Whether the product is in stock (default: true) */
  inStock?: boolean;
  /** Quantity/pack size (e.g., "12-pack", "Box of 36") */
  quantity?: string;
  /** Product variant (e.g., "Large", "Ultra Thin") */
  variant?: string;
  /** Available sizes for the product */
  sizes?: string[];
}

/**
 * Product suggestion from AI (received via SSE)
 */
export interface ProductSuggestion {
  productId: string;
  suggestedSize?: string;
}

/**
 * Product suggestions configuration for static/featured products
 */
export interface ProductSuggestionsConfig {
  /** Enable product suggestions feature */
  enabled?: boolean;
  /** API endpoint to fetch featured products */
  apiEndpoint?: string;
  /** Static list of products (alternative to API) */
  products?: Product[];
  /** Header text for the product suggestions section */
  headerText?: string;
  /** Called when a product is added to cart */
  onAddToCart?: (product: Product, size?: string) => void;
  /** Called when a product image is clicked */
  onProductClick?: (product: Product) => void;
}

/**
 * Dynamic product suggestions configuration (AI-suggested products)
 */
export interface DynamicProductSuggestionsConfig {
  /** Enable dynamic AI product suggestions */
  enabled?: boolean;
  /** API endpoint to fetch all products (for resolving productIds) */
  productsApiEndpoint: string;
  /** Header text for the AI suggestions section */
  headerText?: string;
  /** Called when a product is added to cart */
  onAddToCart?: (product: Product, size?: string) => void;
  /** Called when a product image is clicked */
  onProductClick?: (product: Product) => void;
}

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
  // Core chat events
  onChatOpened?: () => void;
  onChatMinimized?: () => void;
  onChatFirstMessage?: (message: string) => void;
  onChatMessageSent?: (message: string, messageCount: number, sessionId?: string, chatSessionId?: string) => void;
  onQuickReplyClicked?: (text: string) => void;
  onSuggestedResponseClicked?: (text: string) => void;
  onNewChatStarted?: (sessionId: string) => void;
  onCTAClicked?: () => void;

  // Engagement & UX metrics
  /** Called when an AI response is received */
  onMessageReceived?: (data: {
    responseTimeMs: number;
    messageLength: number;
    sessionId?: string;
    chatSessionId?: string;
  }) => void;
  /** Called when streaming starts */
  onStreamingStarted?: (sessionId?: string, chatSessionId?: string) => void;
  /** Called when streaming ends */
  onStreamingEnded?: (data: {
    durationMs: number;
    messageLength: number;
    sessionId?: string;
    chatSessionId?: string;
  }) => void;
  /** Called when an error occurs */
  onErrorOccurred?: (data: {
    error: string;
    errorType: 'network' | 'api' | 'timeout' | 'unknown';
    sessionId?: string;
    chatSessionId?: string;
  }) => void;
  /** Called when user starts typing */
  onTypingStarted?: (sessionId?: string, chatSessionId?: string) => void;
  /** Called when user typed but didn't send (input cleared or modal closed) */
  onTypingAbandoned?: (data: {
    partialMessage: string;
    typingDurationMs: number;
    sessionId?: string;
    chatSessionId?: string;
  }) => void;

  // Conversion & funnel
  /** Called when a meaningful conversation is completed (3+ message exchanges) */
  onConversationCompleted?: (data: {
    messageCount: number;
    sessionDurationMs: number;
    sessionId?: string;
    chatSessionId?: string;
  }) => void;

  // Session intelligence
  /** Called when a returning user resumes a previous chat */
  onSessionResumed?: (data: {
    previousMessageCount: number;
    sessionId?: string;
    chatSessionId?: string;
  }) => void;
  /** Called when user clears/starts new chat */
  onChatCleared?: (data: {
    previousMessageCount: number;
    sessionId?: string;
    chatSessionId?: string;
  }) => void;
  /** Called when user copies a message */
  onMessageCopied?: (data: {
    messageRole: 'user' | 'assistant';
    messageLength: number;
    sessionId?: string;
    chatSessionId?: string;
  }) => void;

  // Mobile-specific
  /** Called when chat expands to fullscreen (mobile) */
  onFullScreenEntered?: (sessionId?: string, chatSessionId?: string) => void;
  /** Called when chat exits fullscreen (mobile) */
  onFullScreenExited?: (sessionId?: string, chatSessionId?: string) => void;
  /** Called when user swipes to minimize (mobile) */
  onSwipeMinimized?: (sessionId?: string, chatSessionId?: string) => void;

  // Response quality
  /** Called when user clicks a link in AI response */
  onLinkClicked?: (data: {
    url: string;
    linkText?: string;
    sessionId?: string;
    chatSessionId?: string;
  }) => void;
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
  /** Custom headers to send with each request (e.g., Authorization, X-API-Key) */
  headers?: Record<string, string>;

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

  // Booking configuration
  /** Calendar booking feature configuration */
  booking?: BookingConfig;

  // Product suggestions configuration
  /** Featured product suggestions configuration (static) */
  productSuggestions?: ProductSuggestionsConfig;

  // Dynamic AI product suggestions
  /** Dynamic AI-suggested products configuration */
  dynamicProductSuggestions?: DynamicProductSuggestionsConfig;
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
  /** Custom headers to send with each request */
  headers?: Record<string, string>;
  /** Storage key prefix */
  storageKeyPrefix?: string;
  /** Persistence callbacks */
  persistence?: PersistenceCallbacks;
  /** Analytics callbacks */
  analytics?: AnalyticsCallbacks;
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
  productSuggestions: ProductSuggestion[];
  sendMessage: (content: string) => Promise<void>;
  startNewChat: () => void;
  clearMessages: () => void;
  error: string | null;
}

/**
 * Booking form data
 */
export interface BookingFormData {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

/**
 * Booking configuration for the calendar feature
 */
export interface BookingConfig {
  /** Enable the booking calendar feature */
  enabled?: boolean;
  /** Available time slots (e.g., ['9:00 AM', '10:00 AM']) */
  timeSlots?: string[];
  /** Title shown in booking modal */
  title?: string;
  /** Subtitle shown in booking modal */
  subtitle?: string;
  /** Hint text shown below calendar (e.g., "Available Monday - Saturday") */
  hintText?: string;
  /** Number of months ahead users can book (default: 2) */
  monthsAhead?: number;
  /** Called when a booking is submitted */
  onBookingSubmit?: (data: {
    date: Date;
    time: string;
    formData: BookingFormData;
  }) => void | Promise<void>;
  /** Analytics callback when booking modal is opened */
  onBookingOpened?: () => void;
  /** Analytics callback when date is selected */
  onDateSelected?: (date: Date) => void;
  /** Analytics callback when time is selected */
  onTimeSelected?: (time: string) => void;
  /** Analytics callback when booking is submitted */
  onBookingSubmitted?: (data: {
    date: Date;
    time: string;
    hasEmail: boolean;
    hasNotes: boolean;
  }) => void;
  /** Analytics callback when booking flow is completed successfully */
  onBookingCompleted?: (data: {
    date: Date;
    time: string;
    bookingDurationMs: number;
  }) => void;
  /** Analytics callback when user abandons booking (opened but closed without submitting) */
  onBookingAbandoned?: (data: {
    abandonedAtStep: 'date_selection' | 'time_selection' | 'form_entry';
    hadDateSelected: boolean;
    hadTimeSelected: boolean;
    durationMs: number;
  }) => void;
}
