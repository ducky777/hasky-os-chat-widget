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
 */
export function useMobileModal({
  isOpen,
  isHydrated,
  isFullScreen,
  setIsFullScreen,
}: UseMobileModalOptions): UseMobileModalReturn {
  // Handle body scroll locking on mobile
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
      const setViewportHeight = () => {
        const vh = window.visualViewport?.height || window.innerHeight;
        document.documentElement.style.setProperty('--app-height', `${vh}px`);

        // Calculate offset from top when keyboard opens
        const offset = window.visualViewport?.offsetTop || 0;
        document.documentElement.style.setProperty('--viewport-offset', `${offset}px`);
      };

      setViewportHeight();
      window.visualViewport?.addEventListener('resize', setViewportHeight);

      return () => {
        // Restore body scroll
        const scrollY = document.body.style.top;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);

        window.visualViewport?.removeEventListener('resize', setViewportHeight);
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
