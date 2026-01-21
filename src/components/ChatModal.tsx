'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/use-chat';
import { useMobileModal, isMobileDevice } from '../hooks/use-mobile-modal';
import { useChatModal } from '../context/ChatModalContext';
import type { ChatModalProps, ChatMessage, ChatStyle, QuickReply } from '../types';
import { AppointmentBookingModal, CalendarHeaderIcon } from './AppointmentBookingModal';
import { FeaturedProductsCarousel } from './FeaturedProductsCarousel';
import { ProductSuggestionsCarousel } from './ProductSuggestionsCarousel';

// Default values
const DEFAULT_WELCOME_MESSAGE = "Hello! How can I help you today?";
const DEFAULT_QUICK_REPLIES: QuickReply[] = [];
const DEFAULT_PLACEHOLDER = "Type a message...";
const DEFAULT_REOPEN_TEXT = "Chat with us";
const DEFAULT_HINT_TEXT = "";
const DEFAULT_STORE_NAME = "Chat";
const DEFAULT_THEME: ChatStyle = 'imessage';

const STORAGE_KEY_SUFFIX = '-minimized';

interface MessageBubbleProps {
  message: ChatMessage;
  chatStyle: ChatStyle;
  onLinkClick?: (url: string, linkText?: string) => void;
}

function MessageBubble({ message, chatStyle, onLinkClick }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const time = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Custom link renderer to track clicks
  const linkRenderer = useCallback(({ href, children }: { href?: string; children?: React.ReactNode }) => {
    const handleClick = () => {
      if (href && onLinkClick) {
        onLinkClick(href, typeof children === 'string' ? children : undefined);
      }
    };
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
        {children}
      </a>
    );
  }, [onLinkClick]);

  const markdownComponents = {
    a: linkRenderer,
  };

  if (!isUser && message.content.includes('\n\n')) {
    const parts = message.content.split('\n\n').filter(part => part.trim());
    return (
      <>
        {parts.map((part, index) => (
          <div key={`${message.id}-${index}`} className="pcm-msg pcm-msg--received">
            <div className="pcm-msg-bubble pcm-msg-bubble--received">
              <div className="pcm-msg-text pcm-msg-text--markdown">
                <ReactMarkdown components={markdownComponents}>{part.trim()}</ReactMarkdown>
              </div>
              {index === parts.length - 1 && (
                <span className="pcm-msg-meta">
                  <span className="pcm-msg-time">{time}</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <div className={`pcm-msg ${isUser ? 'pcm-msg--sent' : 'pcm-msg--received'}`}>
      <div className={`pcm-msg-bubble ${isUser ? 'pcm-msg-bubble--sent' : 'pcm-msg-bubble--received'}`}>
        {isUser ? (
          <p className="pcm-msg-text">{message.content}</p>
        ) : (
          <div className="pcm-msg-text pcm-msg-text--markdown">
            <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
          </div>
        )}
        <span className="pcm-msg-meta">
          <span className="pcm-msg-time">{time}</span>
          {isUser && chatStyle === 'imessage' && (
            <span className="pcm-msg-status pcm-msg-status--delivered">Delivered</span>
          )}
          {isUser && chatStyle === 'whatsapp' && (
            <span className="pcm-msg-status">
              <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                <path d="M11.071 0.653a.457.457 0 0 0-.304.115l-6.082 5.96-1.949-1.91a.457.457 0 0 0-.638 0 .457.457 0 0 0 0 .639l2.267 2.222a.457.457 0 0 0 .64 0l6.4-6.272a.457.457 0 0 0 0-.638.457.457 0 0 0-.334-.116z" fill="currentColor" />
                <path d="M15.071 0.653a.457.457 0 0 0-.304.115l-6.082 5.96-1.267-1.241.638-.626 1.909 1.872 6.082-5.96a.457.457 0 0 0-.304-.115.457.457 0 0 0-.334-.005h-.338z" fill="currentColor" />
              </svg>
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="pcm-msg pcm-msg--received">
      <div className="pcm-msg-bubble pcm-msg-bubble--received pcm-msg-bubble--typing">
        <div className="pcm-typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

function StreamingBubbles({ content }: { content: string }) {
  const parts = content.split('\n\n');
  const completedParts = parts.slice(0, -1);
  const currentPart = parts[parts.length - 1];

  return (
    <>
      {completedParts.map((part, index) => (
        <div key={index} className="pcm-msg pcm-msg--received">
          <div className="pcm-msg-bubble pcm-msg-bubble--received">
            <div className="pcm-msg-text pcm-msg-text--markdown">
              <ReactMarkdown>{part.trim()}</ReactMarkdown>
            </div>
          </div>
        </div>
      ))}
      {currentPart && (
        <div className="pcm-msg pcm-msg--received">
          <div className="pcm-msg-bubble pcm-msg-bubble--received">
            <div className="pcm-msg-text pcm-msg-text--markdown pcm-msg-text--streaming">
              <ReactMarkdown>{currentPart.trim()}</ReactMarkdown>
              <span className="pcm-typing-cursor"></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MinimizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function ChatModal({
  // Required
  apiEndpoint,

  // Theming
  theme = DEFAULT_THEME,
  storeName = DEFAULT_STORE_NAME,

  // Request configuration
  requestParams = {},
  headers = {},

  // Content
  welcomeMessage = DEFAULT_WELCOME_MESSAGE,
  placeholder = DEFAULT_PLACEHOLDER,
  quickReplies = DEFAULT_QUICK_REPLIES,
  reopenButtonText = DEFAULT_REOPEN_TEXT,
  hintText = DEFAULT_HINT_TEXT,

  // Path-based behavior
  hiddenPaths = [],
  minimizedByDefaultPaths = [],
  hideReopenButtonPaths = [],
  pathname = '',

  // Callbacks
  analytics,
  persistence,
  onCTAClick,

  // CTA configuration
  showCTA = false,
  ctaText = 'Get Started',

  // Session configuration
  storageKeyPrefix = 'hocw',

  // Booking configuration
  booking,

  // Cart configuration
  cart,

  // Product suggestions configuration
  productSuggestions,

  // Dynamic AI product suggestions configuration
  dynamicProductSuggestions,
}: ChatModalProps) {
  const storageKey = `${storageKeyPrefix}${STORAGE_KEY_SUFFIX}`;
  const { pendingMessage, clearPendingMessage } = useChatModal();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isMinimizing, setIsMinimizing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  // Mobile swipe and fullscreen state
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const messageCountRef = useRef(0);
  const hasTrackedFirstMessageRef = useRef(false);
  // Typing analytics tracking
  const typingStartTimeRef = useRef<number | null>(null);
  const hasTrackedTypingStartRef = useRef(false);
  // Conversation timing
  const conversationStartTimeRef = useRef<number | null>(null);
  const hasTrackedConversationCompletedRef = useRef(false);

  const {
    messages,
    isLoading,
    isStreaming,
    streamingMessage,
    suggestedResponses,
    productSuggestions: aiProductSuggestions,
    sendMessage,
    startNewChat,
  } = useChat({
    apiEndpoint,
    requestParams,
    headers,
    storageKeyPrefix,
    persistence,
    analytics,
  });

  // Mobile modal behavior (scroll locking, fullscreen expansion)
  const { expandToFullScreen } = useMobileModal({
    isOpen: isModalOpen,
    isHydrated,
    isFullScreen,
    setIsFullScreen,
  });

  // Check if we should hide on this path
  const shouldHide = hiddenPaths.some((path) => pathname.startsWith(path));
  const shouldHideReopenButton = hideReopenButtonPaths.some((path) => pathname.startsWith(path));

  // Listen for storage changes (when openChat is called from other components)
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(storageKey);
      if (stored !== 'true' && !isModalOpen && isHydrated) {
        setIsModalOpen(true);
        analytics?.onChatOpened?.();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isModalOpen, isHydrated, storageKey, analytics]);

  // Handle pending message from context - send it when modal opens
  useEffect(() => {
    if (pendingMessage && isModalOpen && isHydrated && !isLoading && !isStreaming) {
      // Send the pending message
      setUserHasInteracted(true);

      const sessionId = localStorage.getItem(`${storageKeyPrefix}_session_id`) || '';
      const chatSessionId = sessionStorage.getItem(`${storageKeyPrefix}_chat_session_id`) || '';

      if (!hasTrackedFirstMessageRef.current) {
        hasTrackedFirstMessageRef.current = true;
        analytics?.onChatFirstMessage?.(pendingMessage);
      }

      messageCountRef.current += 1;
      analytics?.onChatMessageSent?.(pendingMessage, messageCountRef.current, sessionId, chatSessionId);

      sendMessage(pendingMessage);
      clearPendingMessage();
      expandToFullScreen();
    }
  }, [pendingMessage, isModalOpen, isHydrated, isLoading, isStreaming, sendMessage, clearPendingMessage, expandToFullScreen, storageKeyPrefix, analytics]);

  // Hydrate from localStorage on mount and track initial chat view
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    const shouldStartMinimized = minimizedByDefaultPaths.some((path) => pathname.startsWith(path));

    if (stored === 'true') {
      // User explicitly minimized - stay minimized
      setIsModalOpen(false);
    } else if (stored === 'false') {
      // User explicitly opened - stay open
      setIsModalOpen(true);
      analytics?.onChatOpened?.();
    } else if (shouldStartMinimized) {
      // No preference stored and on a minimized-by-default path - start minimized
      setIsModalOpen(false);
    } else {
      // No preference stored and on normal path - start open (default behavior)
      analytics?.onChatOpened?.();
    }
    setIsHydrated(true);
  }, [pathname, storageKey, minimizedByDefaultPaths, analytics]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track conversation completion (6+ messages = 3+ exchanges)
  useEffect(() => {
    // Start timing when first message is sent
    if (messages.length === 1 && !conversationStartTimeRef.current) {
      conversationStartTimeRef.current = Date.now();
    }

    // Track conversation completed when 6+ messages (3 user + 3 assistant)
    if (messages.length >= 6 && !hasTrackedConversationCompletedRef.current) {
      hasTrackedConversationCompletedRef.current = true;
      const sessionId = localStorage.getItem(`${storageKeyPrefix}_session_id`) || '';
      const chatSessionId = sessionStorage.getItem(`${storageKeyPrefix}_chat_session_id`) || '';
      const sessionDurationMs = conversationStartTimeRef.current
        ? Date.now() - conversationStartTimeRef.current
        : 0;

      analytics?.onConversationCompleted?.({
        messageCount: messages.length,
        sessionDurationMs,
        sessionId,
        chatSessionId,
      });
    }
  }, [messages.length, storageKeyPrefix, analytics]);

  // Track typing abandoned when modal closes with unsent text
  useEffect(() => {
    if (!isModalOpen && inputValue.trim() && typingStartTimeRef.current) {
      const sessionId = localStorage.getItem(`${storageKeyPrefix}_session_id`) || '';
      const chatSessionId = sessionStorage.getItem(`${storageKeyPrefix}_chat_session_id`) || '';
      const typingDurationMs = Date.now() - typingStartTimeRef.current;

      analytics?.onTypingAbandoned?.({
        partialMessage: inputValue.trim(),
        typingDurationMs,
        sessionId,
        chatSessionId,
      });

      // Reset typing state
      typingStartTimeRef.current = null;
      hasTrackedTypingStartRef.current = false;
    }
  }, [isModalOpen, inputValue, storageKeyPrefix, analytics]);

  const handleNewChat = useCallback(() => {
    setMenuOpen(false);
    startNewChat();
    setUserHasInteracted(false);
    messageCountRef.current = 0;
    hasTrackedFirstMessageRef.current = false;
    // Reset conversation tracking
    conversationStartTimeRef.current = null;
    hasTrackedConversationCompletedRef.current = false;
    // Track new chat session
    const newSessionId = sessionStorage.getItem(`${storageKeyPrefix}_chat_session_id`) || '';
    analytics?.onNewChatStarted?.(newSessionId);
  }, [startNewChat, storageKeyPrefix, analytics]);

  const hasStarted = userHasInteracted || messages.length > 0;

  useEffect(() => {
    if (hasStarted && !isLoading && !isStreaming && isModalOpen) {
      inputRef.current?.focus();
    }
  }, [hasStarted, isLoading, isStreaming, isModalOpen]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;

    const messageContent = inputValue.trim();
    const sessionId = localStorage.getItem(`${storageKeyPrefix}_session_id`) || '';
    const chatSessionId = sessionStorage.getItem(`${storageKeyPrefix}_chat_session_id`) || '';

    // Track first message
    if (!hasTrackedFirstMessageRef.current) {
      hasTrackedFirstMessageRef.current = true;
      analytics?.onChatFirstMessage?.(messageContent);
    }

    // Track message sent
    messageCountRef.current += 1;
    analytics?.onChatMessageSent?.(messageContent, messageCountRef.current, sessionId, chatSessionId);

    // Reset typing tracking (message was sent, not abandoned)
    typingStartTimeRef.current = null;
    hasTrackedTypingStartRef.current = false;

    if (!userHasInteracted) setUserHasInteracted(true);
    sendMessage(messageContent);
    setInputValue('');
    // Expand to fullscreen on mobile when user sends a message
    expandToFullScreen();
  }, [inputValue, userHasInteracted, sendMessage, expandToFullScreen, storageKeyPrefix, analytics]);

  // Handle input change with typing tracking
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.slice(0, 500);
    setInputValue(newValue);

    // Track typing started (only once per typing session)
    if (newValue.trim() && !hasTrackedTypingStartRef.current) {
      hasTrackedTypingStartRef.current = true;
      typingStartTimeRef.current = Date.now();
      const sessionId = localStorage.getItem(`${storageKeyPrefix}_session_id`) || '';
      const chatSessionId = sessionStorage.getItem(`${storageKeyPrefix}_chat_session_id`) || '';
      analytics?.onTypingStarted?.(sessionId, chatSessionId);
    }

    // Reset tracking if input is cleared
    if (!newValue.trim() && typingStartTimeRef.current) {
      // Track typing abandoned if user clears input after typing
      const sessionId = localStorage.getItem(`${storageKeyPrefix}_session_id`) || '';
      const chatSessionId = sessionStorage.getItem(`${storageKeyPrefix}_chat_session_id`) || '';
      const typingDurationMs = Date.now() - typingStartTimeRef.current;

      if (typingDurationMs > 1000) { // Only track if they typed for more than 1 second
        analytics?.onTypingAbandoned?.({
          partialMessage: inputValue.trim(), // Use previous value before clear
          typingDurationMs,
          sessionId,
          chatSessionId,
        });
      }

      typingStartTimeRef.current = null;
      hasTrackedTypingStartRef.current = false;
    }
  }, [storageKeyPrefix, analytics, inputValue]);

  const handleQuickReply = useCallback((text: string) => {
    const sessionId = localStorage.getItem(`${storageKeyPrefix}_session_id`) || '';
    const chatSessionId = sessionStorage.getItem(`${storageKeyPrefix}_chat_session_id`) || '';

    // Track quick reply click
    analytics?.onQuickReplyClicked?.(text);

    // Track first message
    if (!hasTrackedFirstMessageRef.current) {
      hasTrackedFirstMessageRef.current = true;
      analytics?.onChatFirstMessage?.(text);
    }

    // Track message sent
    messageCountRef.current += 1;
    analytics?.onChatMessageSent?.(text, messageCountRef.current, sessionId, chatSessionId);

    setUserHasInteracted(true);
    sendMessage(text);
    // Expand to fullscreen on mobile when user sends a message
    expandToFullScreen();
  }, [sendMessage, expandToFullScreen, storageKeyPrefix, analytics]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle suggested response click (different from quick replies - these are AI-suggested)
  const handleSuggestedResponseClick = useCallback((text: string) => {
    const sessionId = localStorage.getItem(`${storageKeyPrefix}_session_id`) || '';
    const chatSessionId = sessionStorage.getItem(`${storageKeyPrefix}_chat_session_id`) || '';

    // Track suggested response click
    analytics?.onSuggestedResponseClicked?.(text);

    // Track message sent
    messageCountRef.current += 1;
    analytics?.onChatMessageSent?.(text, messageCountRef.current, sessionId, chatSessionId);

    sendMessage(text);
    expandToFullScreen();
  }, [sendMessage, expandToFullScreen, storageKeyPrefix, analytics]);

  const handleMinimize = useCallback(() => {
    if (isMinimizing) return; // Prevent multiple triggers
    setIsMinimizing(true);
    // Track minimize event
    analytics?.onChatMinimized?.();
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsModalOpen(false);
      setIsMinimizing(false);
      localStorage.setItem(storageKey, 'true');
    }, 300); // Match the CSS animation duration
  }, [isMinimizing, storageKey, analytics]);

  const handleReopen = () => {
    setIsModalOpen(true);
    // Store 'false' to indicate user explicitly opened the chat
    localStorage.setItem(storageKey, 'false');
    // Track reopen event
    analytics?.onChatOpened?.();
  };

  // Handle CTA click from within chat
  const handleCTAClick = useCallback(() => {
    analytics?.onCTAClicked?.();
    handleMinimize();
    onCTAClick?.();
  }, [handleMinimize, onCTAClick, analytics]);

  // Handle booking click
  const handleBookingClick = useCallback(() => {
    setShowBookingModal(true);
    booking?.onBookingOpened?.();
  }, [booking]);

  // Handle link click in messages
  const handleLinkClick = useCallback((url: string, linkText?: string) => {
    const sessionId = localStorage.getItem(`${storageKeyPrefix}_session_id`) || '';
    const chatSessionId = sessionStorage.getItem(`${storageKeyPrefix}_chat_session_id`) || '';
    analytics?.onLinkClicked?.({
      url,
      linkText,
      sessionId,
      chatSessionId,
    });
  }, [storageKeyPrefix, analytics]);

  // Touch handlers for swipe gestures on mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobileDevice()) return;
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobileDevice() || !isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartY.current;
    // Only allow dragging down when not fullscreen, or up when not at minimum
    if (isFullScreen && diff > 0) {
      // Dragging down from fullscreen
      setDragOffset(Math.min(diff, 200));
    } else if (!isFullScreen && diff < 0) {
      // Dragging up to fullscreen
      setDragOffset(Math.max(diff, -200));
    } else if (!isFullScreen && diff > 0) {
      // Dragging down to minimize
      setDragOffset(Math.min(diff, 300));
    }
  }, [isDragging, isFullScreen]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobileDevice() || !isDragging) return;
    setIsDragging(false);

    const threshold = 80;
    const sessionId = localStorage.getItem(`${storageKeyPrefix}_session_id`) || '';
    const chatSessionId = sessionStorage.getItem(`${storageKeyPrefix}_chat_session_id`) || '';

    if (isFullScreen && dragOffset > threshold) {
      // Exit fullscreen
      setIsFullScreen(false);
      analytics?.onFullScreenExited?.(sessionId, chatSessionId);
    } else if (!isFullScreen && dragOffset < -threshold) {
      // Enter fullscreen
      setIsFullScreen(true);
      analytics?.onFullScreenEntered?.(sessionId, chatSessionId);
    } else if (!isFullScreen && dragOffset > threshold) {
      // Minimize via swipe
      analytics?.onSwipeMinimized?.(sessionId, chatSessionId);
      handleMinimize();
    }

    setDragOffset(0);
  }, [isDragging, dragOffset, isFullScreen, handleMinimize, storageKeyPrefix, analytics]);

  // Don't render on hidden paths or before hydration
  if (shouldHide || !isHydrated) {
    return null;
  }

  const themeClass = `pcm-theme--${theme}`;

  return (
    <>
      {/* Phone Modal with dimmed background */}
      {isModalOpen && (
        <div
          className={`pcm-overlay ${themeClass} ${isMinimizing ? 'pcm-overlay--minimizing' : ''} ${isFullScreen ? 'pcm-overlay--fullscreen' : ''}`}
          onClick={handleMinimize}
        >
          <div
            className={`pcm-modal-content ${isMinimizing ? 'pcm-modal-content--minimizing' : ''} ${isFullScreen ? 'pcm-modal-content--fullscreen' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={isDragging ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : undefined}
          >
            {/* Minimize button */}
            <button
              className="pcm-minimize-btn"
              onClick={handleMinimize}
              aria-label="Minimize chat"
            >
              <MinimizeIcon />
            </button>

            {/* Phone frame */}
            <div className={`pcm-phone-frame ${isFullScreen ? 'pcm-phone-frame--fullscreen' : ''}`}>
              <div className="pcm-phone-notch" />

              {/* Chat embed */}
              <div className={`pcm-embed ${isFullScreen ? 'pcm-embed--fullscreen' : ''}`}>
                {/* Draggable Header */}
                <div
                  className="pcm-header"
                  ref={headerRef}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <button className="pcm-header-back" onClick={handleMinimize} aria-label="Close chat">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className="pcm-header-info">
                    <span className="pcm-header-name">{storeName}</span>
                    <span className="pcm-header-status">
                      <span className="pcm-online-dot" />
                      {theme === 'imessage' ? 'Active now' : 'online now'}
                    </span>
                  </div>
                  <div className="pcm-header-actions">
                    {cart?.enabled && cart.renderButton && (
                      <div className="pcm-header-cart-wrapper">
                        {cart.renderButton}
                      </div>
                    )}
                    {booking?.enabled && (
                      <button
                        className="pcm-header-action pcm-header-action--booking"
                        onClick={handleBookingClick}
                        aria-label="Book appointment"
                        title="Book an appointment"
                      >
                        <CalendarHeaderIcon size={20} />
                      </button>
                    )}
                    <div className="pcm-menu-container" ref={menuRef}>
                      <button
                        className="pcm-header-action"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Menu"
                        aria-expanded={menuOpen}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                          <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                        </svg>
                      </button>
                      {menuOpen && (
                        <div className="pcm-dropdown">
                          <button className="pcm-dropdown-item" onClick={handleNewChat}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M12 8v6M9 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            New chat
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="pcm-messages" ref={messagesContainerRef}>
                  {!hasStarted && (
                    <>
                      <div className="pcm-msg pcm-msg--received pcm-msg--welcome">
                        <div className="pcm-msg-bubble pcm-msg-bubble--received">
                          <p className="pcm-msg-text">{welcomeMessage}</p>
                          <span className="pcm-msg-meta">
                            <span className="pcm-msg-time">just now</span>
                          </span>
                        </div>
                      </div>

                      {quickReplies.length > 0 && (
                        <div className="pcm-quick-grid">
                          {quickReplies.map((reply, i) => (
                            <button
                              key={i}
                              className="pcm-quick-card"
                              onClick={() => handleQuickReply(reply.text)}
                              style={{ animationDelay: `${0.3 + i * 0.08}s` }}
                            >
                              <span className="pcm-quick-card-text">{reply.text}</span>
                              {reply.subtext && (
                                <span className="pcm-quick-card-subtext">{reply.subtext}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Product suggestions carousel */}
                      {productSuggestions?.enabled && (
                        <FeaturedProductsCarousel config={productSuggestions} />
                      )}
                    </>
                  )}

                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} chatStyle={theme} onLinkClick={handleLinkClick} />
                  ))}

                  {isStreaming && streamingMessage && (
                    <StreamingBubbles content={streamingMessage} />
                  )}

                  {isLoading && !isStreaming && <TypingBubble />}

                  {hasStarted && !isLoading && !isStreaming && suggestedResponses.length > 0 && (
                    <div className="pcm-suggestions">
                      {suggestedResponses.map((response, i) => (
                        <button
                          key={i}
                          className="pcm-suggestion"
                          onClick={() => handleSuggestedResponseClick(response)}
                        >
                          {response}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* AI Product Suggestions */}
                  {hasStarted && !isLoading && !isStreaming && dynamicProductSuggestions?.enabled && aiProductSuggestions.length > 0 && (
                    <ProductSuggestionsCarousel
                      suggestions={aiProductSuggestions}
                      config={dynamicProductSuggestions}
                    />
                  )}

                  <div ref={messagesEndRef} />

                  {/* Floating CTA - inside messages */}
                  {showCTA && (
                    <button
                      className="pcm-floating-cta"
                      onClick={handleCTAClick}
                    >
                      <span>{ctaText}</span>
                      <span className="pcm-floating-cta-arrow">→</span>
                    </button>
                  )}
                </div>

                {/* Input Area */}
                <div className="pcm-input-area">
                  <div className="pcm-input-container">
                    <input
                      ref={inputRef}
                      type="text"
                      className="pcm-input"
                      placeholder={placeholder}
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading || isStreaming}
                      maxLength={500}
                    />
                  </div>
                  <button
                    className="pcm-send-btn"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading || isStreaming}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {!hasStarted && hintText && (
                  <div className="pcm-hint">{hintText}</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating button to reopen chat when minimized */}
      {!isModalOpen && !shouldHideReopenButton && (
        <button
          className={`pcm-reopen-btn ${themeClass}`}
          onClick={handleReopen}
          aria-label="Open chat"
        >
          <ChatBubbleIcon />
          <span className="pcm-reopen-text">{reopenButtonText}</span>
        </button>
      )}

      {/* Appointment Booking Modal - Outside overlay to avoid backdrop-filter issues */}
      {booking?.enabled && (
        <AppointmentBookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          config={booking}
        />
      )}
    </>
  );
}
