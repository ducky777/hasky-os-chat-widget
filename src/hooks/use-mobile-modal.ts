'use client';

import { useEffect, useCallback } from 'react';

/**
 * Check if the current device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 600;
}

interface UseMobileModalOptions {
  isOpen: boolean;
  isHydrated: boolean;
  isFullScreen: boolean;
  setIsFullScreen: (fullScreen: boolean) => void;
}

interface UseMobileModalReturn {
  expandToFullScreen: () => void;
}

/**
 * Hook for mobile modal behavior including scroll locking and fullscreen expansion
 * Handles keyboard appearance without pushing content - only resizes the chat area
 */
export function useMobileModal({
  isOpen,
  isHydrated,
  isFullScreen,
  setIsFullScreen,
}: UseMobileModalOptions): UseMobileModalReturn {
  // Handle body scroll locking on mobile and keyboard handling
  useEffect(() => {
    if (!isHydrated) return;

    const isMobile = isMobileDevice();

    if (isOpen && isMobile) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;

      // Set viewport height CSS variable for mobile keyboards
      // This allows the chat area to resize without pushing header/input
      const setViewportHeight = () => {
        const visualViewport = window.visualViewport;
        const vh = visualViewport?.height || window.innerHeight;
        const fullHeight = window.innerHeight;

        // Set the visual viewport height (shrinks when keyboard opens)
        document.documentElement.style.setProperty('--visual-viewport-height', `${vh}px`);
        // Set the full viewport height (constant, doesn't change with keyboard)
        document.documentElement.style.setProperty('--app-height', `${fullHeight}px`);

        // Calculate keyboard height
        const keyboardHeight = fullHeight - vh;
        document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);

        // Track if keyboard is open
        document.documentElement.style.setProperty('--keyboard-open', keyboardHeight > 50 ? '1' : '0');

        // Calculate offset from top when keyboard opens (for iOS scroll adjustment)
        const offset = visualViewport?.offsetTop || 0;
        document.documentElement.style.setProperty('--viewport-offset', `${offset}px`);
      };

      setViewportHeight();

      // Listen to both resize and scroll events on visualViewport
      window.visualViewport?.addEventListener('resize', setViewportHeight);
      window.visualViewport?.addEventListener('scroll', setViewportHeight);

      return () => {
        // Restore body scroll
        const scrollY = document.body.style.top;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);

        window.visualViewport?.removeEventListener('resize', setViewportHeight);
        window.visualViewport?.removeEventListener('scroll', setViewportHeight);

        // Clean up CSS variables
        document.documentElement.style.removeProperty('--visual-viewport-height');
        document.documentElement.style.removeProperty('--keyboard-height');
        document.documentElement.style.removeProperty('--keyboard-open');
      };
    }
  }, [isOpen, isHydrated]);

  // Auto-expand to fullscreen when conversation starts on mobile
  const expandToFullScreen = useCallback(() => {
    if (isMobileDevice() && !isFullScreen) {
      setIsFullScreen(true);
    }
  }, [isFullScreen, setIsFullScreen]);

  return { expandToFullScreen };
}
