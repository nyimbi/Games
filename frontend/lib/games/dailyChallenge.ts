/**
 * Daily Challenge system with deterministic seeding.
 * Everyone gets the same 5 questions each day. Streak tracking via localStorage.
 */

import type { Question, DailyStreakData } from './types';
import { getStorage, setStorage, STORAGE_KEYS } from '@/lib/storage';
import { allQuestions } from './questions';

const DAILY_QUESTION_COUNT = 5;

const DEFAULT_STREAK: DailyStreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: '',
  completedDates: [],
  todayCompleted: false,
};

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDailySeed(): number {
  const today = getTodayDateString();
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Returns 5 deterministic questions for today.
 * Spreads across subjects and targets medium difficulty.
 */
export function getDailyQuestions(): Question[] {
  const seed = getDailySeed();
  const rng = seededRandom(seed);

  // Pool of medium-difficulty questions, with easy/hard as fallback
  const mediumPool = allQuestions.filter((q) => q.difficulty === 'medium');
  const pool = mediumPool.length >= DAILY_QUESTION_COUNT ? mediumPool : [...allQuestions];

  // Deterministic shuffle using seeded rng
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Try to get one from each subject
  const subjects = ['science', 'social_studies', 'arts', 'literature', 'special_area'];
  const selected: Question[] = [];
  const usedIds = new Set<string>();

  for (const subject of subjects) {
    const match = shuffled.find((q) => q.subject === subject && !usedIds.has(q.id));
    if (match) {
      selected.push(match);
      usedIds.add(match.id);
    }
  }

  // Fill remaining slots if we couldn't get all subjects
  for (const q of shuffled) {
    if (selected.length >= DAILY_QUESTION_COUNT) break;
    if (!usedIds.has(q.id)) {
      selected.push(q);
      usedIds.add(q.id);
    }
  }

  return selected.slice(0, DAILY_QUESTION_COUNT);
}

export function getDailyStreakData(): DailyStreakData {
  const data = getStorage<DailyStreakData>(STORAGE_KEYS.DAILY_STREAK, DEFAULT_STREAK);
  const today = getTodayDateString();

  // If last played date is not today and not yesterday, streak is broken
  if (data.lastPlayedDate && data.lastPlayedDate !== today) {
    const lastDate = new Date(data.lastPlayedDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > 1) {
      // Streak broken - reset current but keep longest
      return {
        ...data,
        currentStreak: 0,
        todayCompleted: false,
      };
    }
  }

  return {
    ...data,
    todayCompleted: data.completedDates.includes(today),
    todayScore: data.completedDates.includes(today) ? data.todayScore : undefined,
  };
}

export function completeDailyChallenge(score: number): DailyStreakData {
  const today = getTodayDateString();
  const current = getDailyStreakData();

  // Already completed today
  if (current.completedDates.includes(today)) {
    return current;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const isConsecutive = current.lastPlayedDate === yesterdayStr || current.lastPlayedDate === today;
  const newStreak = isConsecutive ? current.currentStreak + 1 : 1;
  const newLongest = Math.max(current.longestStreak, newStreak);

  const updated: DailyStreakData = {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastPlayedDate: today,
    completedDates: [...current.completedDates, today].slice(-90), // keep last 90 days
    todayScore: score,
    todayCompleted: true,
  };

  setStorage(STORAGE_KEYS.DAILY_STREAK, updated);
  return updated;
}
