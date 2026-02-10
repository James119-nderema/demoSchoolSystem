import React from 'react';
import { useScrollAnimation, useCountUp } from '../../hooks/useScrollAnimation';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Animation delay in ms */
  delay?: number;
  /** 0-1 — how much of the element must be visible */
  threshold?: number;
}

/**
 * Wraps children in a zoom-in animation that triggers every time
 * the element scrolls into view (and resets when scrolled away).
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  threshold = 0.15,
}) => {
  const { ref, isVisible } = useScrollAnimation(threshold);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: isVisible ? 'scale(1)' : 'scale(0.85)',
        opacity: isVisible ? 1 : 0,
        transition: `transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, opacity 0.7s ease ${delay}ms`,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
};

interface CountUpNumberProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
  threshold?: number;
}

/**
 * Displays a number that counts up from 0 to `end` when scrolled into view.
 * Resets and replays every time it re-enters the viewport.
 */
export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  end,
  suffix = '',
  prefix = '',
  duration = 2000,
  className = '',
  threshold = 0.3,
}) => {
  const { ref, count } = useCountUp(end, duration, threshold);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};
