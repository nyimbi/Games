'use client';

import clsx from 'clsx';
import { getAvatarById } from '@/lib/games/avatars';

export interface AvatarProps {
  /** Display name (used for initials fallback) */
  name: string;
  /** Custom background color */
  color?: string;
  /** Animal avatar ID (e.g., 'fox', 'panda') */
  animal?: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Image URL (optional) */
  src?: string;
  /** Additional classes */
  className?: string;
}

const emojiSizes = {
  xs: 'text-sm',
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export function Avatar({
  name,
  color,
  animal,
  size = 'md',
  src,
  className,
}: AvatarProps) {
  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const sizeClasses = {
    xs: 'avatar-xs',
    sm: 'avatar-sm',
    md: '',
    lg: 'avatar-lg',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx(
          'avatar rounded-full object-cover',
          sizeClasses[size],
          className
        )}
        style={{ backgroundColor: color }}
      />
    );
  }

  // Animal emoji avatar
  if (animal) {
    const avatarData = getAvatarById(animal);
    return (
      <div
        className={clsx('avatar', sizeClasses[size], className)}
        style={{ backgroundColor: avatarData.color }}
        title={name}
      >
        <span className={emojiSizes[size]}>{avatarData.emoji}</span>
      </div>
    );
  }

  return (
    <div
      className={clsx('avatar', sizeClasses[size], className)}
      style={{ backgroundColor: color }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

// Avatar Group for showing multiple players
export interface AvatarGroupProps {
  users: Array<{ name: string; color?: string; animal?: string; src?: string }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarGroup({
  users,
  max = 4,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const displayed = users.slice(0, max);
  const remaining = users.length - max;

  const overlapClasses = {
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-4',
  };

  return (
    <div className={clsx('flex items-center', className)}>
      {displayed.map((user, i) => (
        <Avatar
          key={i}
          name={user.name}
          color={user.color}
          animal={user.animal}
          src={user.src}
          size={size}
          className={clsx(
            i > 0 && overlapClasses[size],
            'ring-2 ring-white'
          )}
        />
      ))}
      {remaining > 0 && (
        <div
          className={clsx(
            'avatar bg-ink-200 text-ink-600 ring-2 ring-white',
            size === 'sm' && 'avatar-sm',
            size === 'lg' && 'avatar-lg',
            overlapClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
