'use client';

import clsx from 'clsx';
import { Avatar } from './Avatar';

export interface PlayerInfo {
  id: string;
  name: string;
  role: 'coach' | 'player';
  color?: string;
  isOnline?: boolean;
  isCurrentUser?: boolean;
  score?: number;
  status?: 'waiting' | 'ready' | 'playing' | 'answered' | 'thinking';
}

export interface PlayerListProps {
  players: PlayerInfo[];
  title?: string;
  showStatus?: boolean;
  showScore?: boolean;
  compact?: boolean;
  className?: string;
}

export function PlayerList({
  players,
  title,
  showStatus = false,
  showScore = false,
  compact = false,
  className,
}: PlayerListProps) {
  const statusLabels = {
    waiting: 'Waiting',
    ready: 'Ready',
    playing: 'Playing',
    answered: 'Answered',
    thinking: 'Thinking...',
  };

  const statusColors = {
    waiting: 'bg-ink-200',
    ready: 'bg-sage-400',
    playing: 'bg-gold-400',
    answered: 'bg-sage-400',
    thinking: 'bg-gold-400 animate-pulse',
  };

  return (
    <div className={className}>
      {title && (
        <h4 className="font-display text-sm font-semibold text-ink-500 uppercase tracking-wide mb-3">
          {title}
        </h4>
      )}
      <div className={clsx('space-y-2', compact && 'space-y-1')}>
        {players.map((player) => (
          <div
            key={player.id}
            className={clsx(
              'flex items-center gap-3',
              compact ? 'py-1' : 'py-2 px-3 rounded-button',
              !compact && 'hover:bg-cream-200 transition-colors',
              player.isCurrentUser && !compact && 'bg-cream-100'
            )}
          >
            {/* Avatar with online indicator */}
            <div className="relative">
              <Avatar
                name={player.name}
                color={player.color}
                size={compact ? 'sm' : 'md'}
              />
              {player.isOnline !== undefined && (
                <span
                  className={clsx(
                    'absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white',
                    player.isOnline ? 'bg-sage-400' : 'bg-ink-300'
                  )}
                />
              )}
            </div>

            {/* Name and role */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    'font-medium truncate',
                    compact ? 'text-sm' : 'text-base'
                  )}
                >
                  {player.name}
                </span>
                {player.role === 'coach' && (
                  <span className="px-2 py-0.5 bg-ink-100 text-ink-600 text-xs font-semibold rounded-full">
                    Coach
                  </span>
                )}
                {player.isCurrentUser && (
                  <span className="text-ink-400 text-sm">(You)</span>
                )}
              </div>

              {/* Status */}
              {showStatus && player.status && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={clsx(
                      'w-2 h-2 rounded-full',
                      statusColors[player.status]
                    )}
                  />
                  <span className="text-xs text-ink-400">
                    {statusLabels[player.status]}
                  </span>
                </div>
              )}
            </div>

            {/* Score */}
            {showScore && player.score !== undefined && (
              <div className="score">
                <span className="score-value text-lg">{player.score}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact player pills for header displays
export interface PlayerPillsProps {
  players: PlayerInfo[];
  maxVisible?: number;
  className?: string;
}

export function PlayerPills({
  players,
  maxVisible = 5,
  className,
}: PlayerPillsProps) {
  const visible = players.slice(0, maxVisible);
  const remaining = players.length - maxVisible;

  return (
    <div className={clsx('flex items-center gap-2 flex-wrap', className)}>
      {visible.map((player) => (
        <div
          key={player.id}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-full',
            'bg-white border border-ink-100',
            player.isCurrentUser && 'ring-2 ring-gold-300'
          )}
        >
          <Avatar name={player.name} color={player.color} size="sm" />
          <span className="text-sm font-medium">{player.name}</span>
          {player.role === 'coach' && (
            <span className="text-xs text-ink-400">👑</span>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div className="px-3 py-1.5 rounded-full bg-ink-100 text-ink-600 text-sm font-medium">
          +{remaining} more
        </div>
      )}
    </div>
  );
}
