'use client';

import { useCallback, useState } from 'react';
import clsx from 'clsx';

export interface BuzzerProps {
  /** Whether the buzzer can be pressed */
  enabled?: boolean;
  /** Whether this player has already buzzed */
  hasBuzzed?: boolean;
  /** Who buzzed first (if anyone) */
  winner?: { name: string; isCurrentUser: boolean } | null;
  /** Callback when buzzer is pressed */
  onBuzz?: () => void;
  /** Size */
  size?: 'md' | 'lg';
  /** Additional classes */
  className?: string;
}

export function Buzzer({
  enabled = true,
  hasBuzzed = false,
  winner = null,
  onBuzz,
  size = 'lg',
  className,
}: BuzzerProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = useCallback(() => {
    if (!enabled || hasBuzzed || winner) return;

    setIsPressed(true);
    onBuzz?.();

    // Visual feedback reset
    setTimeout(() => setIsPressed(false), 150);
  }, [enabled, hasBuzzed, winner, onBuzz]);

  const isDisabled = !enabled || hasBuzzed || !!winner;

  const sizeClasses = {
    md: 'w-32 h-32 text-xl',
    lg: 'w-40 h-40 text-2xl',
  };

  return (
    <div className={clsx('flex flex-col items-center gap-4', className)}>
      <button
        type="button"
        onClick={handlePress}
        disabled={isDisabled}
        className={clsx(
          'btn-buzzer',
          sizeClasses[size],
          isDisabled && 'disabled',
          isPressed && 'scale-95'
        )}
        style={{
          transform: isPressed ? 'translateY(4px) scale(0.98)' : undefined,
        }}
      >
        {winner ? (
          winner.isCurrentUser ? '🎉' : '❌'
        ) : (
          'BUZZ!'
        )}
      </button>

      {/* Status text */}
      <div className="h-6 text-center">
        {winner && (
          <p
            className={clsx(
              'font-display font-semibold animate-fade-in',
              winner.isCurrentUser ? 'text-gold-500' : 'text-ink-500'
            )}
          >
            {winner.isCurrentUser ? 'You buzzed first!' : `${winner.name} buzzed first`}
          </p>
        )}
        {!winner && !enabled && (
          <p className="text-ink-400">Wait for the question...</p>
        )}
        {!winner && enabled && hasBuzzed && (
          <p className="text-ink-400">Waiting for others...</p>
        )}
      </div>
    </div>
  );
}

// Buzzer with sound effect (client-side only)
export interface BuzzerWithSoundProps extends BuzzerProps {
  /** Play sound on buzz */
  soundEnabled?: boolean;
}

export function BuzzerWithSound({
  soundEnabled = true,
  onBuzz,
  ...props
}: BuzzerWithSoundProps) {
  const handleBuzz = useCallback(() => {
    if (soundEnabled && typeof window !== 'undefined') {
      // Create a simple buzz sound using Web Audio API
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 440; // A4 note
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (e) {
        // Audio API not available, continue silently
      }
    }
    onBuzz?.();
  }, [soundEnabled, onBuzz]);

  return <Buzzer {...props} onBuzz={handleBuzz} />;
}
