'use client';

import clsx from 'clsx';
import { Avatar } from './Avatar';

export interface Player {
  id: string;
  name: string;
  score: number;
  color?: string;
  isCurrentUser?: boolean;
}

export interface ScoreBoardProps {
  players: Player[];
  title?: string;
  showRank?: boolean;
  highlightLeader?: boolean;
  className?: string;
}

export function ScoreBoard({
  players,
  title = 'Scores',
  showRank = true,
  highlightLeader = true,
  className,
}: ScoreBoardProps) {
  // Sort by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const highestScore = sortedPlayers[0]?.score ?? 0;

  return (
    <div className={clsx('card', className)}>
      <h3 className="font-display text-lg font-semibold text-ink-900 mb-4">
        {title}
      </h3>
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => {
          const isLeader = highlightLeader && player.score === highestScore && player.score > 0;

          return (
            <div
              key={player.id}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-button transition-colors',
                player.isCurrentUser && 'bg-cream-200',
                isLeader && 'bg-gold-50 ring-2 ring-gold-300'
              )}
            >
              {showRank && (
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                    index === 0 && 'bg-gold-400 text-white',
                    index === 1 && 'bg-ink-300 text-white',
                    index === 2 && 'bg-coral-300 text-white',
                    index > 2 && 'bg-ink-100 text-ink-600'
                  )}
                >
                  {index + 1}
                </div>
              )}
              <Avatar name={player.name} color={player.color} size="sm" />
              <div className="flex-1 min-w-0">
                <span
                  className={clsx(
                    'font-medium truncate block',
                    player.isCurrentUser && 'text-ink-900'
                  )}
                >
                  {player.name}
                  {player.isCurrentUser && (
                    <span className="text-ink-400 text-sm ml-1">(You)</span>
                  )}
                </span>
              </div>
              <div className="score">
                <span className="score-value text-lg">{player.score}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Mini Scoreboard - compact version for during games
export interface MiniScoreBoardProps {
  players: Player[];
  className?: string;
}

export function MiniScoreBoard({ players, className }: MiniScoreBoardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className={clsx('flex items-center gap-4', className)}>
      {sortedPlayers.slice(0, 4).map((player, index) => (
        <div key={player.id} className="flex items-center gap-2">
          <Avatar name={player.name} color={player.color} size="sm" />
          <span
            className={clsx(
              'font-display font-bold',
              index === 0 ? 'text-gold-400' : 'text-ink-600'
            )}
          >
            {player.score}
          </span>
        </div>
      ))}
    </div>
  );
}

// Score Popup - for showing score changes
export interface ScorePopupProps {
  points: number;
  isVisible: boolean;
  position?: 'center' | 'top';
  onComplete?: () => void;
}

export function ScorePopup({
  points,
  isVisible,
  position = 'center',
}: ScorePopupProps) {
  if (!isVisible) return null;

  const isPositive = points > 0;

  return (
    <div
      className={clsx(
        'fixed pointer-events-none z-50',
        position === 'center' && 'inset-0 flex items-center justify-center',
        position === 'top' && 'top-24 left-1/2 -translate-x-1/2'
      )}
    >
      <div
        className={clsx(
          'font-display font-bold text-5xl animate-bounce-subtle',
          isPositive ? 'text-gold-400' : 'text-coral-400'
        )}
        style={{
          textShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
      >
        {isPositive ? '+' : ''}{points}
      </div>
    </div>
  );
}
