/**
 * Cross-game streak tracking -- encourages students to play 3+ different games per day.
 * Tracks which game types are played each day and maintains a daily variety streak.
 */

import { getStorage, setStorage, STORAGE_KEYS } from '@/lib/storage';

export interface CrossGameDaily {
  date: string;
  gamesPlayed: string[];
}

export interface CrossGameStreakData {
  currentStreak: number;
  longestStreak: number;
  today: CrossGameDaily;
  lastStreakDate: string;
}

const VARIETY_THRESHOLD = 3;

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

const DEFAULT_DATA: CrossGameStreakData = {
  currentStreak: 0,
  longestStreak: 0,
  today: { date: '', gamesPlayed: [] },
  lastStreakDate: '',
};

export function getCrossGameStreak(): CrossGameStreakData {
  return getStorage<CrossGameStreakData>(STORAGE_KEYS.CROSS_GAME_DAILY, DEFAULT_DATA);
}

/**
 * Record that a game type was played. Returns updated data
 * including whether variety threshold was just reached.
 */
export function recordGamePlayed(gameType: string): {
  data: CrossGameStreakData;
  varietyJustReached: boolean;
} {
  const today = getTodayStr();
  const data = getCrossGameStreak();

  // Reset if new day
  if (data.today.date !== today) {
    // Check if yesterday met the threshold for streak continuation
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (data.lastStreakDate === yesterdayStr) {
      // Streak continues from yesterday
    } else if (data.lastStreakDate !== today) {
      // Streak broken
      data.currentStreak = 0;
    }

    data.today = { date: today, gamesPlayed: [] };
  }

  const wasBelow = data.today.gamesPlayed.length < VARIETY_THRESHOLD;
  if (!data.today.gamesPlayed.includes(gameType)) {
    data.today.gamesPlayed.push(gameType);
  }
  const nowMet = data.today.gamesPlayed.length >= VARIETY_THRESHOLD;

  // If variety threshold just reached today, increment streak
  if (wasBelow && nowMet) {
    data.currentStreak += 1;
    data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
    data.lastStreakDate = today;
  }

  setStorage(STORAGE_KEYS.CROSS_GAME_DAILY, data);
  return { data, varietyJustReached: wasBelow && nowMet };
}

export function getTodayVarietyCount(): number {
  const data = getCrossGameStreak();
  const today = getTodayStr();
  if (data.today.date !== today) return 0;
  return data.today.gamesPlayed.length;
}
