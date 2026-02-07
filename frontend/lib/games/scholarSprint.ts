/**
 * Scholar Sprint — endless speed quiz scoring, power-ups, and utilities.
 */

export type PowerUpType = 'skip' | 'fifty_fifty' | 'extra_life' | 'time_freeze';

export interface PowerUp {
  type: PowerUpType;
  name: string;
  icon: string;
  description: string;
}

export const POWER_UPS: Record<PowerUpType, PowerUp> = {
  skip: { type: 'skip', name: 'Skip', icon: '⏭️', description: 'Skip this question' },
  fifty_fifty: { type: 'fifty_fifty', name: '50/50', icon: '✂️', description: 'Remove 2 wrong answers' },
  extra_life: { type: 'extra_life', name: 'Extra Life', icon: '❤️', description: '+1 life (max 5)' },
  time_freeze: { type: 'time_freeze', name: 'Time Freeze', icon: '❄️', description: 'Pause timer for 10s' },
};

export function getTimeLimit(distance: number): number {
  return Math.max(5, 15 - Math.floor(distance / 200));
}

export function getMultiplier(streak: number): { value: number; tier: string } {
  if (streak >= 10) return { value: 5, tier: 'rainbow' };
  if (streak >= 6) return { value: 3, tier: 'flame' };
  if (streak >= 3) return { value: 2, tier: 'gold' };
  return { value: 1, tier: 'normal' };
}

export function getDistancePerQuestion(multiplier: number): number {
  return 10 * multiplier;
}

export function getRandomPowerUpPair(): [PowerUpType, PowerUpType] {
  const types: PowerUpType[] = ['skip', 'fifty_fifty', 'extra_life', 'time_freeze'];
  const shuffled = [...types].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

export interface SprintBest {
  distance: number;
  questionsAnswered: number;
  longestStreak: number;
  date: string;
}
