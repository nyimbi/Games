'use client';

import { type ReactNode } from 'react';
import clsx from 'clsx';

export type BadgeVariant = 'default' | 'gold' | 'sage' | 'coral' | 'ink' | 'outline';

export interface BadgeProps {
  variant?: BadgeVariant;
  icon?: ReactNode;
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = 'default',
  icon,
  size = 'md',
  children,
  className,
}: BadgeProps) {
  const variantClasses: Record<BadgeVariant, string> = {
    default: 'badge',
    gold: 'badge badge-gold',
    sage: 'badge badge-sage',
    coral: 'bg-coral-100 text-coral-700',
    ink: 'bg-ink-100 text-ink-700',
    outline: 'bg-transparent border border-ink-300 text-ink-600',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// Achievement Badge - for earned badges
export interface AchievementBadgeProps {
  name: string;
  description?: string;
  icon: ReactNode;
  earned?: boolean;
  earnedAt?: Date;
  className?: string;
}

export function AchievementBadge({
  name,
  description,
  icon,
  earned = true,
  earnedAt,
  className,
}: AchievementBadgeProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-3 p-3 rounded-card',
        earned ? 'bg-gold-50' : 'bg-ink-50 opacity-50',
        className
      )}
    >
      <div
        className={clsx(
          'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
          earned ? 'bg-gold-400 text-white' : 'bg-ink-200 text-ink-400'
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-semibold text-ink-900 truncate">
          {name}
        </h4>
        {description && (
          <p className="text-sm text-ink-500 truncate">{description}</p>
        )}
        {earned && earnedAt && (
          <p className="text-xs text-gold-600 mt-0.5">
            Earned {earnedAt.toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

// Subject Badge - for WSC subjects
export interface SubjectBadgeProps {
  subject: 'science' | 'social_studies' | 'arts' | 'literature' | 'special_area';
  className?: string;
}

const subjectConfig = {
  science: { label: 'Science', color: 'sage' as const, emoji: '🔬' },
  social_studies: { label: 'Social Studies', color: 'coral' as const, emoji: '🌍' },
  arts: { label: 'Arts', color: 'gold' as const, emoji: '🎨' },
  literature: { label: 'Literature', color: 'ink' as const, emoji: '📚' },
  special_area: { label: 'Special Area', color: 'gold' as const, emoji: '⭐' },
};

export function SubjectBadge({ subject, className }: SubjectBadgeProps) {
  const config = subjectConfig[subject];
  return (
    <Badge variant={config.color} className={className}>
      <span>{config.emoji}</span>
      {config.label}
    </Badge>
  );
}

// Difficulty Badge
export interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard';
  className?: string;
}

const difficultyConfig = {
  easy: { label: 'Easy', color: 'sage' as const },
  medium: { label: 'Medium', color: 'gold' as const },
  hard: { label: 'Hard', color: 'coral' as const },
};

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const config = difficultyConfig[difficulty];
  return (
    <Badge variant={config.color} size="sm" className={className}>
      {config.label}
    </Badge>
  );
}
