'use client';

import { useState, useEffect, useRef } from 'react';
import type { FloatingPromptRibbonProps } from '../types';

const DEFAULT_AUTO_ROTATE_INTERVAL = 4000;
const DEFAULT_HEADER_TITLE = 'Quick prompts';

export function FloatingPromptRibbon({
  prompts,
  onPromptClick,
  autoRotateInterval = DEFAULT_AUTO_ROTATE_INTERVAL,
  headerTitle = DEFAULT_HEADER_TITLE,
  headerSubtitle,
  className = '',
}: FloatingPromptRibbonProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  // Auto-rotate through prompts on mobile
  useEffect(() => {
    if (isPaused || prompts.length <= 1) return;
    const interval = setInterval(() => {
      // Trigger exit animation to the left for auto-rotate
      setExitDirection('left');
      setIsExiting(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % prompts.length);
        setExitDirection(null);
        setIsExiting(false);
      }, 250);
    }, autoRotateInterval);
    return () => clearInterval(interval);
  }, [isPaused, prompts.length, autoRotateInterval]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isExiting) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsPaused(true);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isExiting) return;
    if (touchStartX.current === null || touchStartY.current === null) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX.current;
    const deltaY = currentY - touchStartY.current;

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
    }

    // Only apply drag offset for horizontal swipes
    if (isHorizontalSwipe.current) {
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isExiting) return;
    if (touchStartX.current === null || touchStartY.current === null) {
      setDragOffset(0);
      setIsDragging(false);
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;

    // Only register as swipe if it was a horizontal swipe and distance is significant enough (> 50px)
    if (isHorizontalSwipe.current && Math.abs(deltaX) > 50) {
      const direction = deltaX < 0 ? 'left' : 'right';
      setExitDirection(direction);
      setIsExiting(true);
      setIsDragging(false);

      // Animate out, then change index instantly (no entry animation)
      setTimeout(() => {
        if (deltaX < 0) {
          setActiveIndex((prev) => (prev + 1) % prompts.length);
        } else {
          setActiveIndex((prev) => (prev - 1 + prompts.length) % prompts.length);
        }
        setDragOffset(0);
        setExitDirection(null);
        setIsExiting(false);
        // Pause auto-rotation for a bit after manual swipe
        setTimeout(() => setIsPaused(false), 8000);
      }, 200);
    } else {
      setIsPaused(false);
      setDragOffset(0);
      setIsDragging(false);
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontalSwipe.current = null;
  };

  // Calculate card transform based on state
  const getCardTransform = () => {
    if (isExiting && exitDirection) {
      // Animate off screen in the exit direction
      const exitX = exitDirection === 'left' ? -400 : 400;
      return `translateX(${exitX}px) rotate(${exitDirection === 'left' ? -15 : 15}deg)`;
    }
    if (isDragging) {
      return `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`;
    }
    return 'translateX(0) rotate(0)';
  };

  const getCardOpacity = () => {
    if (isExiting && exitDirection) return 0;
    if (isDragging) return 1 - Math.abs(dragOffset) * 0.001;
    return 1;
  };

  // Get the next card index based on drag direction
  const getNextIndex = () => {
    if (dragOffset < 0) return (activeIndex + 1) % prompts.length;
    if (dragOffset > 0) return (activeIndex - 1 + prompts.length) % prompts.length;
    return (activeIndex + 1) % prompts.length;
  };

  // Only animate during drag or exit, not on new card appearing
  const shouldAnimate = isDragging || isExiting;

  if (prompts.length === 0) return null;

  return (
    <>
      {/* Desktop: Fixed vertical stack on right side - always visible */}
      <div className={`hocw-ribbon-desktop ${className}`}>
        {/* Header */}
        <div className="hocw-ribbon-header">
          <p className="hocw-ribbon-title">{headerTitle}</p>
          {headerSubtitle && <p className="hocw-ribbon-subtitle">{headerSubtitle}</p>}
        </div>

        {/* Prompt cards - always visible */}
        {prompts.map((item, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(item.prompt)}
            className="hocw-ribbon-card"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Glow effect on hover */}
            <div className="hocw-ribbon-card-glow" />

            <div className="hocw-ribbon-card-content">
              <span className="hocw-ribbon-card-icon">{item.icon}</span>
              <div className="hocw-ribbon-card-text">
                <div className="hocw-ribbon-card-label">{item.shortLabel}</div>
                <p className="hocw-ribbon-card-prompt">{item.prompt}</p>
              </div>
              <svg
                className="hocw-ribbon-card-arrow"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Mobile: Auto-rotating spotlight with full prompt visible */}
      <div
        className={`hocw-ribbon-mobile ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Gradient fade */}
        <div className="hocw-ribbon-mobile-gradient" />

        <div className="hocw-ribbon-mobile-content">
          {/* Header with dot indicators */}
          <div className="hocw-ribbon-mobile-header">
            <div className="hocw-ribbon-mobile-title">
              <span>{headerTitle}</span>
            </div>
            <div className="hocw-ribbon-mobile-dots">
              {prompts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`hocw-ribbon-dot ${index === activeIndex ? 'hocw-ribbon-dot--active' : ''}`}
                  aria-label={`View prompt ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Card stack */}
          <div className="hocw-ribbon-mobile-cards">
            {/* Background card (next card) - always visible behind */}
            <div
              className="hocw-ribbon-mobile-card hocw-ribbon-mobile-card--bg"
              style={{
                transform: `scale(${0.95 + Math.min(Math.abs(dragOffset) / 300, 0.05)})`,
                opacity: 0.5 + Math.min(Math.abs(dragOffset) / 200, 0.5),
                transition: shouldAnimate ? (isDragging ? 'none' : 'all 0.2s ease-out') : 'none',
              }}
            >
              <div className="hocw-ribbon-mobile-card-inner">
                <span className="hocw-ribbon-mobile-card-icon">{prompts[getNextIndex()].icon}</span>
                <div className="hocw-ribbon-mobile-card-text">
                  <p>{prompts[getNextIndex()].prompt}</p>
                </div>
              </div>
            </div>

            {/* Active card (front) */}
            <button
              onClick={() => !isDragging && !isExiting && onPromptClick(prompts[activeIndex].prompt)}
              className="hocw-ribbon-mobile-card hocw-ribbon-mobile-card--active"
              style={{
                transform: getCardTransform(),
                opacity: getCardOpacity(),
                transition: shouldAnimate ? (isDragging ? 'none' : 'all 0.2s ease-out') : 'none',
              }}
            >
              <div className="hocw-ribbon-mobile-card-inner">
                <span className="hocw-ribbon-mobile-card-icon">{prompts[activeIndex].icon}</span>
                <div className="hocw-ribbon-mobile-card-text">
                  <p>{prompts[activeIndex].prompt}</p>
                  <p className="hocw-ribbon-mobile-card-cta">Tap to ask →</p>
                </div>
              </div>
            </button>
          </div>

          {/* Quick access to other prompts */}
          <div className="hocw-ribbon-mobile-pills">
            {prompts.map((item, index) => (
              index !== activeIndex && (
                <button
                  key={index}
                  onClick={() => {
                    setActiveIndex(index);
                    setIsPaused(true);
                    setTimeout(() => setIsPaused(false), 8000);
                  }}
                  className="hocw-ribbon-pill"
                >
                  <span>{item.icon}</span>
                  <span>{item.shortLabel}</span>
                </button>
              )
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
