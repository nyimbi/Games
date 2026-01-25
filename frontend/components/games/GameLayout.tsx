'use client';

import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Users, Clock, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button, Avatar, Badge, TimerDisplay } from '@/components/ui';
import { type GamePlayer } from '@/lib/games/types';

interface GameLayoutProps {
  title: string;
  subtitle?: string;
  players: GamePlayer[];
  currentRound?: number;
  totalRounds?: number;
  timeRemaining?: number;
  onBack?: () => void;
  children: ReactNode;
  showTimer?: boolean;
  showRound?: boolean;
  headerAction?: ReactNode;
  footer?: ReactNode;
}

export function GameLayout({
  title,
  subtitle,
  players,
  currentRound,
  totalRounds,
  timeRemaining,
  onBack,
  children,
  showTimer = true,
  showRound = true,
  headerAction,
  footer,
}: GameLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-ink-200 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-ink-600" />
            </button>
            <div>
              <h1 className="font-display font-semibold text-ink-800">{title}</h1>
              {subtitle && (
                <p className="text-sm text-ink-500">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {showRound && currentRound !== undefined && totalRounds !== undefined && (
              <div className="text-sm text-ink-500">
                <span className="font-semibold text-ink-700">{currentRound}</span>
                <span className="mx-1">/</span>
                <span>{totalRounds}</span>
              </div>
            )}

            {showTimer && timeRemaining !== undefined && (
              <TimerDisplay
                time={timeRemaining}
                maxTime={30}
                size={40}
              />
            )}

            {headerAction}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Player Scores Bar */}
      <div className="bg-white border-t border-ink-200 px-4 py-3 sticky bottom-0 z-40">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 overflow-x-auto pb-1 -mb-1">
            {sortedPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                layout
                className={`flex items-center gap-2 px-3 py-2 rounded-xl flex-shrink-0 ${
                  index === 0 && player.score > 0
                    ? 'bg-gold-100'
                    : 'bg-cream-100'
                }`}
              >
                {index === 0 && player.score > 0 && (
                  <Trophy className="w-4 h-4 text-gold-600" />
                )}
                <Avatar
                  name={player.display_name}
                  color={player.avatar_color}
                  size="xs"
                />
                <span className="font-medium text-ink-700 text-sm whitespace-nowrap">
                  {player.display_name}
                </span>
                <Badge
                  variant={index === 0 && player.score > 0 ? 'gold' : 'outline'}
                  size="sm"
                >
                  {player.score}
                </Badge>
                {!player.is_connected && (
                  <span className="w-2 h-2 bg-coral-400 rounded-full" title="Disconnected" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Optional Footer */}
      {footer && (
        <div className="bg-ink-800 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}

// Waiting Room Component
interface WaitingRoomProps {
  players: GamePlayer[];
  minPlayers?: number;
  onStart?: () => void;
  isHost?: boolean;
  gameName: string;
}

export function WaitingRoom({
  players,
  minPlayers = 2,
  onStart,
  isHost = false,
  gameName,
}: WaitingRoomProps) {
  const canStart = players.length >= minPlayers && players.every((p) => p.is_ready || !p.is_connected);
  const readyCount = players.filter((p) => p.is_ready).length;

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10 text-gold-600" />
        </div>

        <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
          Waiting for Players
        </h2>
        <p className="text-ink-600 mb-8">
          {readyCount} of {players.length} ready
        </p>

        {/* Player List */}
        <div className="space-y-3 mb-8">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-4 rounded-xl ${
                player.is_ready ? 'bg-sage-100' : 'bg-cream-100'
              }`}
            >
              <Avatar
                name={player.display_name}
                color={player.avatar_color}
                size="md"
              />
              <span className="flex-1 font-medium text-ink-800 text-left">
                {player.display_name}
              </span>
              {player.is_ready ? (
                <Badge variant="sage">Ready</Badge>
              ) : (
                <Badge variant="outline">Waiting</Badge>
              )}
            </div>
          ))}
        </div>

        {players.length < minPlayers && (
          <p className="text-ink-500 mb-4">
            Need at least {minPlayers} players to start
          </p>
        )}

        {isHost && (
          <Button
            variant="gold"
            size="lg"
            onClick={onStart}
            disabled={!canStart}
            className="w-full"
          >
            Start {gameName}
          </Button>
        )}
      </motion.div>
    </div>
  );
}

// Countdown Component
interface CountdownProps {
  count: number;
  gameName: string;
}

export function Countdown({ count, gameName }: CountdownProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <motion.div
          key={count}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-32 h-32 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
        >
          <span className="font-display text-6xl font-bold text-white">
            {count}
          </span>
        </motion.div>
        <h2 className="font-display text-2xl font-bold text-ink-800">
          {gameName} starting...
        </h2>
      </motion.div>
    </div>
  );
}

// Game Over Component
interface GameOverProps {
  players: GamePlayer[];
  winnerId?: string | null;
  onPlayAgain?: () => void;
  onExit?: () => void;
}

export function GameOver({ players, winnerId, onPlayAgain, onExit }: GameOverProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md w-full"
      >
        {/* Winner Celebration */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">
            Game Over!
          </h2>
          {winner && (
            <p className="text-xl text-ink-600">
              <span className="font-semibold text-gold-600">{winner.display_name}</span> wins!
            </p>
          )}
        </motion.div>

        {/* Final Standings */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
          <h3 className="font-display text-lg font-semibold text-ink-800 mb-4">
            Final Standings
          </h3>
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  index === 0 ? 'bg-gold-100' : 'bg-cream-50'
                }`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-gold-500 text-white' :
                  index === 1 ? 'bg-ink-300 text-white' :
                  index === 2 ? 'bg-coral-400 text-white' :
                  'bg-ink-200 text-ink-600'
                }`}>
                  {index + 1}
                </span>
                <Avatar
                  name={player.display_name}
                  color={player.avatar_color}
                  size="sm"
                />
                <span className="flex-1 font-medium text-ink-800 text-left">
                  {player.display_name}
                </span>
                <span className="font-bold text-ink-800">{player.score} pts</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {onPlayAgain && (
            <Button variant="gold" size="lg" onClick={onPlayAgain} className="flex-1">
              Play Again
            </Button>
          )}
          <Button variant="secondary" size="lg" onClick={onExit} className="flex-1">
            Exit
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
