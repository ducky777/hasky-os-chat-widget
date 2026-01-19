'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ChatModalContextValue } from '../types';

const STORAGE_KEY_DEFAULT = 'hocw-minimized';

const ChatModalContext = createContext<ChatModalContextValue | null>(null);

export interface ChatModalProviderProps {
  children: ReactNode;
  /** Storage key for minimized state (default: 'hocw-minimized') */
  storageKey?: string;
}

export function ChatModalProvider({ children, storageKey = STORAGE_KEY_DEFAULT }: ChatModalProviderProps) {
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const openChat = useCallback((message?: string) => {
    if (message) {
      setPendingMessage(message);
    }
    setIsOpen(true);
    // Also update localStorage and dispatch storage event for cross-component sync
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'false');
      window.dispatchEvent(new Event('storage'));
    }
  }, [storageKey]);

  const clearPendingMessage = useCallback(() => {
    setPendingMessage(null);
  }, []);

  return (
    <ChatModalContext.Provider
      value={{
        pendingMessage,
        openChat,
        clearPendingMessage,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </ChatModalContext.Provider>
  );
}

export function useChatModal(): ChatModalContextValue {
  const context = useContext(ChatModalContext);
  if (!context) {
    throw new Error('useChatModal must be used within a ChatModalProvider');
  }
  return context;
}

export { ChatModalContext };
