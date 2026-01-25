'use client';

import clsx from 'clsx';

export interface ProgressProps {
  /** Current value (0-100) */
  value: number;
  /** Maximum value */
  max?: number;
  /** Color variant */
  variant?: 'sage' | 'gold' | 'coral' | 'ink';
  /** Show percentage label */
  showLabel?: boolean;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Animated */
  animated?: boolean;
  /** Additional classes */
  className?: string;
}

export function Progress({
  value,
  max = 100,
  variant = 'sage',
  showLabel = false,
  size = 'md',
  animated = true,
  className,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const variantClasses = {
    sage: 'bg-gradient-to-r from-sage-400 to-sage-300',
    gold: 'bg-gradient-to-r from-gold-400 to-gold-300',
    coral: 'bg-gradient-to-r from-coral-400 to-coral-300',
    ink: 'bg-gradient-to-r from-ink-900 to-ink-700',
  };

  return (
    <div className={clsx('w-full', className)}>
      <div
        className={clsx(
          'progress',
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={clsx(
            'h-full rounded-full',
            variantClasses[variant],
            animated && 'transition-all duration-500 ease-out'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-right text-sm text-ink-500">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}

// Score Progress - specialized for showing points
export interface ScoreProgressProps {
  current: number;
  target: number;
  label?: string;
  className?: string;
}

export function ScoreProgress({
  current,
  target,
  label,
  className,
}: ScoreProgressProps) {
  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        {label && (
          <span className="text-sm font-medium text-ink-600">{label}</span>
        )}
        <div className="score">
          <span className="score-value text-xl">{current}</span>
          <span className="score-label">/ {target}</span>
        </div>
      </div>
      <Progress
        value={current}
        max={target}
        variant="gold"
        size="md"
      />
    </div>
  );
}

// XP/Level Progress
export interface LevelProgressProps {
  level: number;
  currentXP: number;
  requiredXP: number;
  className?: string;
}

export function LevelProgress({
  level,
  currentXP,
  requiredXP,
  className,
}: LevelProgressProps) {
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-ink-900 text-white flex items-center justify-center font-display font-bold text-lg">
          {level}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-ink-500">Level {level}</span>
          <span className="text-ink-400">{currentXP} / {requiredXP} XP</span>
        </div>
        <Progress
          value={currentXP}
          max={requiredXP}
          variant="gold"
          size="sm"
        />
      </div>
    </div>
  );
}
