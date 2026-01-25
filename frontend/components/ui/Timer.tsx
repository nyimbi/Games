'use client';

import { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';

export interface TimerProps {
  /** Duration in seconds */
  duration: number;
  /** Whether the timer is running */
  isRunning?: boolean;
  /** Callback when timer reaches zero */
  onComplete?: () => void;
  /** Callback on each tick with remaining seconds */
  onTick?: (remaining: number) => void;
  /** Warning threshold in seconds (default: 10) */
  warningThreshold?: number;
  /** Danger threshold in seconds (default: 5) */
  dangerThreshold?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional classes */
  className?: string;
}

export function Timer({
  duration,
  isRunning = true,
  onComplete,
  onTick,
  warningThreshold = 10,
  dangerThreshold = 5,
  size = 'md',
  className,
}: TimerProps) {
  const [remaining, setRemaining] = useState(duration);

  // Reset when duration changes
  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  // Timer logic
  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        onTick?.(next);
        if (next <= 0) {
          clearInterval(interval);
          onComplete?.();
        }
        return Math.max(0, next);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, remaining, onComplete, onTick]);

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}`;
  }, []);

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <div
      className={clsx(
        'timer',
        sizeClasses[size],
        remaining <= dangerThreshold && 'timer-danger',
        remaining > dangerThreshold &&
          remaining <= warningThreshold &&
          'timer-warning',
        className
      )}
      role="timer"
      aria-live="polite"
      aria-label={`${remaining} seconds remaining`}
    >
      {formatTime(remaining)}
    </div>
  );
}

// Circular Timer variant for more visual impact
export interface CircularTimerProps extends TimerProps {
  /** Stroke width */
  strokeWidth?: number;
}

export function CircularTimer({
  duration,
  isRunning = true,
  onComplete,
  onTick,
  warningThreshold = 10,
  dangerThreshold = 5,
  strokeWidth = 8,
  className,
}: CircularTimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const size = 120;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = remaining / duration;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        onTick?.(next);
        if (next <= 0) {
          clearInterval(interval);
          onComplete?.();
        }
        return Math.max(0, next);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, remaining, onComplete, onTick]);

  const getColor = () => {
    if (remaining <= dangerThreshold) return 'var(--color-coral)';
    if (remaining <= warningThreshold) return 'var(--color-gold)';
    return 'var(--color-sage)';
  };

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-light)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
        />
      </svg>
      {/* Time display in center */}
      <span
        className={clsx(
          'absolute font-display font-bold text-2xl',
          remaining <= dangerThreshold && 'text-coral-400 animate-pulse',
          remaining > dangerThreshold &&
            remaining <= warningThreshold &&
            'text-gold-400',
          remaining > warningThreshold && 'text-ink-900'
        )}
      >
        {remaining}
      </span>
    </div>
  );
}

// Display-only timer for external state management
export interface TimerDisplayProps {
  /** Current time remaining */
  time: number;
  /** Maximum time (for progress calculation) */
  maxTime: number;
  /** Size of the timer */
  size?: number;
  /** Warning threshold in seconds (default: 10) */
  warningThreshold?: number;
  /** Danger threshold in seconds (default: 5) */
  dangerThreshold?: number;
  /** Additional classes */
  className?: string;
}

export function TimerDisplay({
  time,
  maxTime,
  size = 80,
  warningThreshold = 10,
  dangerThreshold = 5,
  className,
}: TimerDisplayProps) {
  const strokeWidth = Math.max(4, size / 15);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = maxTime > 0 ? time / maxTime : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const getColor = () => {
    if (time <= dangerThreshold) return 'var(--color-coral)';
    if (time <= warningThreshold) return 'var(--color-gold)';
    return 'var(--color-sage)';
  };

  const fontSize = Math.max(12, size / 4);

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-light)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
        />
      </svg>
      {/* Time display in center */}
      <span
        className={clsx(
          'absolute font-display font-bold',
          time <= dangerThreshold && 'text-coral-400 animate-pulse',
          time > dangerThreshold && time <= warningThreshold && 'text-gold-400',
          time > warningThreshold && 'text-ink-900'
        )}
        style={{ fontSize }}
      >
        {time}
      </span>
    </div>
  );
}
