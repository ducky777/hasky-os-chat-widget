// Components
export { ChatModal } from './components/ChatModal';
export { FloatingPromptRibbon } from './components/FloatingPromptRibbon';
export { AppointmentBookingModal, CalendarHeaderIcon } from './components/AppointmentBookingModal';
export { FeaturedProductsCarousel } from './components/FeaturedProductsCarousel';
export { ProductSuggestionsCarousel } from './components/ProductSuggestionsCarousel';

// Embed wrapper component (loads CDN widget)
export { ChatWidgetEmbed } from './components/ChatWidgetEmbed';
export type {
  ChatWidgetEmbedProps,
  PaymentConfig,
  EmbedBookingConfig,
  EmbedProductsConfig,
  CheckoutResult,
  CartState,
} from './components/ChatWidgetEmbed';

// Context & Provider
export { ChatModalProvider, useChatModal, ChatModalContext } from './context/ChatModalContext';

// Hooks
export { useChat } from './hooks/use-chat';
export { useMobileModal, isMobileDevice } from './hooks/use-mobile-modal';

// Types
export type {
  ChatMessage,
  ChatStyle,
  QuickReply,
  FloatingPrompt,
  ChatRequestParams,
  AnalyticsCallbacks,
  PersistenceCallbacks,
  ChatModalProps,
  ChatModalContextValue,
  FloatingPromptRibbonProps,
  UseChatOptions,
  UseChatReturn,
  BookingFormData,
  BookingConfig,
  CartConfig,
  Product,
  ProductSuggestion,
  ProductSuggestionsConfig,
  DynamicProductSuggestionsConfig,
} from './types';
