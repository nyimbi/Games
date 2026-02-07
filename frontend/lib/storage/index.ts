/**
 * LocalStorage persistence layer with typed access and JSON serialization.
 * All game progress, achievements, and settings are stored client-side.
 */

const STORAGE_PREFIX = 'wsc_games_';

export const STORAGE_KEYS = {
  WRONG_ANSWERS: `${STORAGE_PREFIX}wrong_answers`,
  FLASHCARD_PROGRESS: `${STORAGE_PREFIX}flashcard_progress`,
  DAILY_STREAK: `${STORAGE_PREFIX}daily_streak`,
  ACHIEVEMENTS: `${STORAGE_PREFIX}achievements`,
  ANALYTICS: `${STORAGE_PREFIX}analytics`,
  SETTINGS: `${STORAGE_PREFIX}settings`,
  PLAYER_STATS: `${STORAGE_PREFIX}player_stats`,
  SOUND_MUTED: `${STORAGE_PREFIX}sound_muted`,
  STUDENT_PROFILE: `${STORAGE_PREFIX}student_profile`,
  GENERATED_QUESTIONS: `${STORAGE_PREFIX}generated_questions`,
  SCHOLAR_CODE: `${STORAGE_PREFIX}scholar_code`,
  CONNECTION_QUEST_STATS: `${STORAGE_PREFIX}connection_quest_stats`,
  SCHOLAR_SPRINT_BEST: `${STORAGE_PREFIX}scholar_sprint_best`,
  TREASURE_HUNT_PROGRESS: `${STORAGE_PREFIX}treasure_hunt_progress`,
  MEMORY_MOSAIC_RECORDS: `${STORAGE_PREFIX}memory_mosaic_records`,
  CROSS_GAME_DAILY: `${STORAGE_PREFIX}cross_game_daily`,
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

export function getStorage<T>(key: StorageKey, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setStorage<T>(key: StorageKey, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function removeStorage(key: StorageKey): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

export function updateStorage<T>(key: StorageKey, fallback: T, updater: (current: T) => T): T {
  const current = getStorage(key, fallback);
  const updated = updater(current);
  setStorage(key, updated);
  return updated;
}
