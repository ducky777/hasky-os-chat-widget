'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, UseChatOptions, UseChatReturn, AnalyticsCallbacks, ProductSuggestion } from '../types';

interface SuggestedResponsesPayload {
  type: 'suggested_responses';
  suggested_responses: string[];
}

interface ProductSuggestionsPayload {
  type: 'product_suggestions';
  products: ProductSuggestion[];
}

interface StoredChatData {
  chatSessionId: string;
  messages: ChatMessage[];
  suggestedResponses: string[];
  productSuggestions: ProductSuggestion[];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function getStorageKeys(prefix: string) {
  return {
    sessionId: `${prefix}_session_id`,
    chatSessionId: `${prefix}_chat_session_id`,
    messages: `${prefix}_chat_messages`,
  };
}

function getOrCreateSessionId(storageKey: string): string {
  if (typeof window === 'undefined') return generateId();

  let sessionId = localStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = `session_${generateId()}`;
    localStorage.setItem(storageKey, sessionId);
  }
  return sessionId;
}

function getOrCreateChatSessionId(storageKey: string): string {
  if (typeof window === 'undefined') return generateId();

  let chatSessionId = sessionStorage.getItem(storageKey);
  if (!chatSessionId) {
    chatSessionId = `chat_${generateId()}`;
    sessionStorage.setItem(storageKey, chatSessionId);
  }
  return chatSessionId;
}

function createNewChatSessionId(storageKey: string): string {
  const chatSessionId = `chat_${generateId()}`;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(storageKey, chatSessionId);
  }
  return chatSessionId;
}

function loadCachedChat(storageKey: string): StoredChatData | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;

    const data = JSON.parse(stored) as StoredChatData;
    // Convert timestamp strings back to Date objects
    data.messages = data.messages.map((m) => ({
      ...m,
      timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
    }));
    return data;
  } catch {
    return null;
  }
}

function saveChatToStorage(
  storageKey: string,
  chatSessionId: string,
  messages: ChatMessage[],
  suggestedResponses: string[],
  productSuggestions: ProductSuggestion[]
): void {
  if (typeof window === 'undefined') return;

  const data: StoredChatData = {
    chatSessionId,
    messages,
    suggestedResponses,
    productSuggestions,
  };
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function clearChatStorage(storageKey: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(storageKey);
}

/**
 * Parse suggested responses from message content.
 * Looks for JSON blocks with format: {"type": "suggested_responses", "suggested_responses": [...]}
 */
function parseSuggestedResponses(content: string): {
  cleanContent: string;
  suggestedResponses: string[];
} {
  const suggestedResponses: string[] = [];
  let cleanContent = content;

  // Pattern to match JSON blocks with suggested_responses
  const jsonPattern = /```json\s*(\{[\s\S]*?"type"\s*:\s*"suggested_responses"[\s\S]*?\})\s*```/g;
  const plainJsonPattern = /(\{[\s\S]*?"type"\s*:\s*"suggested_responses"[\s\S]*?\})/g;

  // Try to find JSON in code blocks first
  const match = jsonPattern.exec(content);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]) as SuggestedResponsesPayload;
      if (parsed.type === 'suggested_responses' && Array.isArray(parsed.suggested_responses)) {
        suggestedResponses.push(...parsed.suggested_responses);
        cleanContent = content.replace(match[0], '').trim();
      }
    } catch {
      // Ignore parse errors
    }
  }

  // If no code block found, try plain JSON (at end of message)
  if (suggestedResponses.length === 0) {
    const matches = content.match(plainJsonPattern);
    if (matches) {
      for (const jsonStr of matches) {
        try {
          const parsed = JSON.parse(jsonStr) as SuggestedResponsesPayload;
          if (parsed.type === 'suggested_responses' && Array.isArray(parsed.suggested_responses)) {
            suggestedResponses.push(...parsed.suggested_responses);
            cleanContent = content.replace(jsonStr, '').trim();
            break; // Only use first valid match
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  return { cleanContent, suggestedResponses };
}

/**
 * Parse product suggestions from message content.
 * Looks for JSON blocks with format: {"type": "product_suggestions", "products": [...]}
 */
function parseProductSuggestions(content: string): {
  cleanContent: string;
  productSuggestions: ProductSuggestion[];
} {
  const productSuggestions: ProductSuggestion[] = [];
  let cleanContent = content;

  // Pattern to match JSON blocks with product_suggestions
  const jsonPattern = /```json\s*(\{[\s\S]*?"type"\s*:\s*"product_suggestions"[\s\S]*?\})\s*```/g;
  const plainJsonPattern = /(\{[\s\S]*?"type"\s*:\s*"product_suggestions"[\s\S]*?\})/g;

  // Try to find JSON in code blocks first
  const match = jsonPattern.exec(content);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]) as ProductSuggestionsPayload;
      if (parsed.type === 'product_suggestions' && Array.isArray(parsed.products)) {
        productSuggestions.push(...parsed.products);
        cleanContent = content.replace(match[0], '').trim();
      }
    } catch {
      // Ignore parse errors
    }
  }

  // If no code block found, try plain JSON (at end of message)
  if (productSuggestions.length === 0) {
    const matches = content.match(plainJsonPattern);
    if (matches) {
      for (const jsonStr of matches) {
        try {
          const parsed = JSON.parse(jsonStr) as ProductSuggestionsPayload;
          if (parsed.type === 'product_suggestions' && Array.isArray(parsed.products)) {
            productSuggestions.push(...parsed.products);
            cleanContent = content.replace(jsonStr, '').trim();
            break; // Only use first valid match
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  return { cleanContent, productSuggestions };
}

/**
 * Parse SSE data from the chat API response.
 * Handles both "data: {...}" format (FastAPI) and "0:..." format (Vercel AI SDK)
 */
function parseSSELine(
  line: string
): { chunk?: string; done?: boolean; error?: string; suggestedResponses?: string[]; productSuggestions?: ProductSuggestion[] } | null {
  // Handle FastAPI SSE format: "data: {...}"
  if (line.startsWith('data: ')) {
    try {
      const data = JSON.parse(line.slice(6));
      // Handle suggested_responses event
      if (data.type === 'suggested_responses' && Array.isArray(data.suggested_responses)) {
        return { suggestedResponses: data.suggested_responses };
      }
      // Handle product_suggestions event
      if (data.type === 'product_suggestions' && Array.isArray(data.products)) {
        return { productSuggestions: data.products };
      }
      return data;
    } catch {
      // If JSON parse fails, might be raw data
      return { chunk: line.slice(6) };
    }
  }

  // Handle Vercel AI SDK format: "0:..." for text chunks
  if (line.startsWith('0:')) {
    try {
      // The format is typically 0:"text content"
      const content = JSON.parse(line.slice(2));
      return { chunk: content };
    } catch {
      // Raw text after 0:
      return { chunk: line.slice(2) };
    }
  }

  // Handle other Vercel AI SDK message types
  if (line.startsWith('e:') || line.startsWith('d:')) {
    // Metadata/done events
    try {
      const data = JSON.parse(line.slice(2));
      if (data.finishReason || line.startsWith('d:')) {
        return { done: true };
      }
    } catch {
      // Ignore parse errors for metadata
    }
    return null;
  }

  return null;
}

/**
 * Hook for managing chat state and SSE streaming
 */
export function useChat(options: UseChatOptions): UseChatReturn {
  const {
    apiEndpoint,
    requestParams = {},
    headers: customHeaders = {},
    storageKeyPrefix = 'hocw',
    persistence,
    analytics,
  } = options;

  const storageKeys = getStorageKeys(storageKeyPrefix);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([]);
  const [productSuggestions, setProductSuggestions] = useState<ProductSuggestion[]>([]);

  const sessionIdRef = useRef<string>('');
  const chatSessionIdRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestStartTimeRef = useRef<number>(0);
  const streamingStartTimeRef = useRef<number>(0);
  const analyticsRef = useRef<AnalyticsCallbacks | undefined>(analytics);

  // Keep analytics ref updated
  useEffect(() => {
    analyticsRef.current = analytics;
  }, [analytics]);

  // Initialize session IDs and load cached chat on mount
  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId(storageKeys.sessionId);
    chatSessionIdRef.current = getOrCreateChatSessionId(storageKeys.chatSessionId);

    // Load cached chat if it matches the current chat session
    const cached = loadCachedChat(storageKeys.messages);
    if (cached && cached.chatSessionId === chatSessionIdRef.current) {
      setMessages(cached.messages);
      setSuggestedResponses(cached.suggestedResponses);
      setProductSuggestions(cached.productSuggestions || []);

      // Track session resumption if there were previous messages
      if (cached.messages.length > 0) {
        analyticsRef.current?.onSessionResumed?.({
          previousMessageCount: cached.messages.length,
          sessionId: sessionIdRef.current,
          chatSessionId: chatSessionIdRef.current,
        });
      }
    }

    // Notify persistence of session
    persistence?.onSessionCreated?.(chatSessionIdRef.current);
  }, [storageKeys.sessionId, storageKeys.chatSessionId, storageKeys.messages, persistence]);

  // Save chat to localStorage whenever messages or responses change
  useEffect(() => {
    if (chatSessionIdRef.current && messages.length > 0) {
      saveChatToStorage(storageKeys.messages, chatSessionIdRef.current, messages, suggestedResponses, productSuggestions);
    }
  }, [messages, suggestedResponses, productSuggestions, storageKeys.messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading || isStreaming) return;

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);
      setStreamingMessage('');
      setSuggestedResponses([]); // Clear previous suggested responses
      setProductSuggestions([]); // Clear previous product suggestions

      // Track request start time for response time analytics
      requestStartTimeRef.current = Date.now();

      // Call persistence callback for user message
      persistence?.onSaveMessage?.(userMessage, chatSessionIdRef.current);

      // Prepare messages for API (convert to API format)
      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: content.trim() },
      ];

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...customHeaders,
          },
          body: JSON.stringify({
            session_id: sessionIdRef.current,
            chat_session_id: chatSessionIdRef.current,
            messages: apiMessages,
            ...requestParams,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.detail || `HTTP ${response.status}`;
          // Track API error
          analyticsRef.current?.onErrorOccurred?.({
            error: errorMessage,
            errorType: 'api',
            sessionId: sessionIdRef.current,
            chatSessionId: chatSessionIdRef.current,
          });
          throw new Error(errorMessage);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        setIsLoading(false);
        setIsStreaming(true);

        // Track streaming start
        streamingStartTimeRef.current = Date.now();
        analyticsRef.current?.onStreamingStarted?.(sessionIdRef.current, chatSessionIdRef.current);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let buffer = '';
        let receivedSuggestedResponses: string[] = [];
        let receivedProductSuggestions: ProductSuggestion[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          // Keep the last potentially incomplete line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            const parsed = parseSSELine(trimmedLine);
            if (!parsed) continue;

            if (parsed.error) {
              // Track streaming error
              analyticsRef.current?.onErrorOccurred?.({
                error: parsed.error,
                errorType: 'api',
                sessionId: sessionIdRef.current,
                chatSessionId: chatSessionIdRef.current,
              });
              throw new Error(parsed.error);
            }

            if (parsed.chunk) {
              fullResponse += parsed.chunk;
              setStreamingMessage(fullResponse);
            }

            // Handle suggested responses from SSE event
            if (parsed.suggestedResponses) {
              receivedSuggestedResponses = parsed.suggestedResponses;
            }

            // Handle product suggestions from SSE event
            if (parsed.productSuggestions) {
              receivedProductSuggestions = parsed.productSuggestions;
            }

            if (parsed.done) {
              break;
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          const parsed = parseSSELine(buffer.trim());
          if (parsed?.chunk) {
            fullResponse += parsed.chunk;
          }
          if (parsed?.suggestedResponses) {
            receivedSuggestedResponses = parsed.suggestedResponses;
          }
          if (parsed?.productSuggestions) {
            receivedProductSuggestions = parsed.productSuggestions;
          }
        }

        // Track streaming end
        const streamingDurationMs = Date.now() - streamingStartTimeRef.current;
        analyticsRef.current?.onStreamingEnded?.({
          durationMs: streamingDurationMs,
          messageLength: fullResponse.length,
          sessionId: sessionIdRef.current,
          chatSessionId: chatSessionIdRef.current,
        });

        // Create the assistant message and extract suggestions
        if (fullResponse) {
          // Use SSE-received suggestions first, fall back to parsing from content
          let finalSuggestions = receivedSuggestedResponses;
          let finalProductSuggestions = receivedProductSuggestions;
          let cleanContent = fullResponse;

          // If no SSE suggestions, try parsing from content (legacy support)
          if (finalSuggestions.length === 0) {
            const parsed = parseSuggestedResponses(cleanContent);
            cleanContent = parsed.cleanContent;
            finalSuggestions = parsed.suggestedResponses;
          }

          // If no SSE product suggestions, try parsing from content (legacy support)
          if (finalProductSuggestions.length === 0) {
            const parsed = parseProductSuggestions(cleanContent);
            cleanContent = parsed.cleanContent;
            finalProductSuggestions = parsed.productSuggestions;
          }

          const assistantMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: cleanContent,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);

          // Track message received
          const responseTimeMs = Date.now() - requestStartTimeRef.current;
          analyticsRef.current?.onMessageReceived?.({
            responseTimeMs,
            messageLength: cleanContent.length,
            sessionId: sessionIdRef.current,
            chatSessionId: chatSessionIdRef.current,
          });

          // Call persistence callback for assistant message
          persistence?.onSaveMessage?.(assistantMessage, chatSessionIdRef.current);

          // Set suggested responses if any were found
          if (finalSuggestions.length > 0) {
            setSuggestedResponses(finalSuggestions);
          }

          // Set product suggestions if any were found
          if (finalProductSuggestions.length > 0) {
            setProductSuggestions(finalProductSuggestions);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was cancelled, don't show error
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);

        // Track error if not already tracked (network errors)
        if (!(err instanceof Error && (err.message.includes('HTTP') || err.message.includes('No response body')))) {
          analyticsRef.current?.onErrorOccurred?.({
            error: errorMessage,
            errorType: err instanceof TypeError ? 'network' : 'unknown',
            sessionId: sessionIdRef.current,
            chatSessionId: chatSessionIdRef.current,
          });
        }
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setStreamingMessage('');
        abortControllerRef.current = null;
      }
    },
    [messages, isLoading, isStreaming, apiEndpoint, requestParams, customHeaders, persistence]
  );

  const clearMessages = useCallback((trackAnalytics = true) => {
    const previousMessageCount = messages.length;

    setMessages([]);
    setError(null);
    setStreamingMessage('');
    setSuggestedResponses([]);
    setProductSuggestions([]);
    clearChatStorage(storageKeys.messages);

    // Track chat cleared (only if there were messages and tracking is enabled)
    if (trackAnalytics && previousMessageCount > 0) {
      analyticsRef.current?.onChatCleared?.({
        previousMessageCount,
        sessionId: sessionIdRef.current,
        chatSessionId: chatSessionIdRef.current,
      });
    }
  }, [storageKeys.messages, messages.length]);

  const startNewChat = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear messages but don't double-track (onNewChatStarted will be called separately)
    clearMessages(false);
    chatSessionIdRef.current = createNewChatSessionId(storageKeys.chatSessionId);

    // Notify persistence of new session
    persistence?.onSessionCreated?.(chatSessionIdRef.current);
  }, [clearMessages, storageKeys.chatSessionId, persistence]);

  return {
    messages,
    isLoading,
    isStreaming,
    streamingMessage,
    error,
    suggestedResponses,
    productSuggestions,
    sendMessage,
    clearMessages,
    startNewChat,
  };
}
