'use client';

import clsx from 'clsx';

export interface AvatarProps {
  /** Display name (used for initials) */
  name: string;
  /** Custom background color */
  color?: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Image URL (optional) */
  src?: string;
  /** Additional classes */
  className?: string;
}

export function Avatar({
  name,
  color,
  size = 'md',
  src,
  className,
}: AvatarProps) {
  // Get initials from name
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
  users: Array<{ name: string; color?: string; src?: string }>;
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
