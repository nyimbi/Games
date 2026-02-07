/**
 * Achievement system — defines unlockable achievements and checks conditions.
 * Achievements are checked after game events and persisted via localStorage.
 */

import type { Achievement, UnlockedAchievement, PlayerStats } from './types';
import { getStorage, setStorage, STORAGE_KEYS } from '@/lib/storage';

export const ACHIEVEMENTS: Achievement[] = [
  // Exploration
  {
    id: 'first_game',
    name: 'First Steps',
    description: 'Complete your first game',
    icon: '🎮',
    category: 'exploration',
    condition: (s) => s.gamesPlayed >= 1,
  },
  {
    id: 'five_games',
    name: 'Getting Started',
    description: 'Complete 5 games',
    icon: '🌟',
    category: 'exploration',
    condition: (s) => s.gamesPlayed >= 5,
  },
  {
    id: 'twenty_five_games',
    name: 'Dedicated Scholar',
    description: 'Complete 25 games',
    icon: '🎓',
    category: 'exploration',
    condition: (s) => s.gamesPlayed >= 25,
  },
  {
    id: 'hundred_questions',
    name: 'Century Club',
    description: 'Answer 100 questions',
    icon: '💯',
    category: 'exploration',
    condition: (s) => s.totalQuestionsAnswered >= 100,
  },
  {
    id: 'five_hundred_questions',
    name: 'Knowledge Seeker',
    description: 'Answer 500 questions',
    icon: '📖',
    category: 'exploration',
    condition: (s) => s.totalQuestionsAnswered >= 500,
  },

  // Streaks
  {
    id: 'streak_3',
    name: 'Hot Streak',
    description: 'Get 3 correct answers in a row',
    icon: '🔥',
    category: 'streak',
    condition: (s) => s.longestStreak >= 3,
  },
  {
    id: 'streak_7',
    name: 'On Fire',
    description: 'Get 7 correct answers in a row',
    icon: '⚡',
    category: 'streak',
    condition: (s) => s.longestStreak >= 7,
  },
  {
    id: 'streak_15',
    name: 'Unstoppable',
    description: 'Get 15 correct answers in a row',
    icon: '🌋',
    category: 'streak',
    condition: (s) => s.longestStreak >= 15,
  },
  {
    id: 'daily_3',
    name: 'Consistent',
    description: 'Play 3 days in a row',
    icon: '📅',
    category: 'streak',
    condition: (s) => s.dailyStreak >= 3,
  },
  {
    id: 'daily_7',
    name: 'Weekly Warrior',
    description: 'Play 7 days in a row',
    icon: '🗓️',
    category: 'streak',
    condition: (s) => s.dailyStreak >= 7,
  },
  {
    id: 'daily_14',
    name: 'Fortnight Champion',
    description: 'Play 14 days in a row',
    icon: '🏅',
    category: 'streak',
    condition: (s) => s.dailyStreak >= 14,
  },
  {
    id: 'daily_30',
    name: 'Monthly Master',
    description: 'Play 30 days in a row',
    icon: '👑',
    category: 'streak',
    condition: (s) => s.dailyStreak >= 30,
  },

  // Mastery
  {
    id: 'science_master',
    name: 'Science Whiz',
    description: 'Score 80%+ accuracy in Science (50+ questions)',
    icon: '🔬',
    category: 'mastery',
    condition: (s) => {
      const sci = s.subjectAccuracy['science'];
      return sci ? sci.total >= 50 && sci.correct / sci.total >= 0.8 : false;
    },
  },
  {
    id: 'literature_master',
    name: 'Bookworm',
    description: 'Score 80%+ accuracy in Literature (50+ questions)',
    icon: '📚',
    category: 'mastery',
    condition: (s) => {
      const lit = s.subjectAccuracy['literature'];
      return lit ? lit.total >= 50 && lit.correct / lit.total >= 0.8 : false;
    },
  },
  {
    id: 'arts_master',
    name: 'Art Connoisseur',
    description: 'Score 80%+ accuracy in Arts (50+ questions)',
    icon: '🎨',
    category: 'mastery',
    condition: (s) => {
      const arts = s.subjectAccuracy['arts'];
      return arts ? arts.total >= 50 && arts.correct / arts.total >= 0.8 : false;
    },
  },
  {
    id: 'social_studies_master',
    name: 'World Citizen',
    description: 'Score 80%+ accuracy in Social Studies (50+ questions)',
    icon: '🌍',
    category: 'mastery',
    condition: (s) => {
      const ss = s.subjectAccuracy['social_studies'];
      return ss ? ss.total >= 50 && ss.correct / ss.total >= 0.8 : false;
    },
  },
  {
    id: 'well_rounded',
    name: 'Renaissance Scholar',
    description: 'Answer questions in all 5 subjects',
    icon: '🌈',
    category: 'mastery',
    condition: (s) => {
      const subjects = ['science', 'literature', 'arts', 'social_studies', 'special_area'];
      return subjects.every((sub) => (s.subjectAccuracy[sub]?.total ?? 0) >= 1);
    },
  },

  // Speed
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Answer correctly in under 2 seconds',
    icon: '⏱️',
    category: 'speed',
    condition: (s) => s.fastestCorrectMs > 0 && s.fastestCorrectMs < 2000,
  },
  {
    id: 'lightning',
    name: 'Lightning Fast',
    description: 'Answer correctly in under 1 second',
    icon: '⚡',
    category: 'speed',
    condition: (s) => s.fastestCorrectMs > 0 && s.fastestCorrectMs < 1000,
  },

  // Special
  {
    id: 'perfect_10',
    name: 'Perfect 10',
    description: 'Get 10 questions right with no mistakes in a game',
    icon: '💎',
    category: 'special',
    condition: (s) => s.perfectRounds >= 1,
  },
  {
    id: 'perfect_5',
    name: 'Perfectionist',
    description: 'Complete 5 perfect rounds',
    icon: '✨',
    category: 'special',
    condition: (s) => s.perfectRounds >= 5,
  },
];

const DEFAULT_STATS: PlayerStats = {
  totalQuestionsAnswered: 0,
  correctAnswers: 0,
  currentStreak: 0,
  longestStreak: 0,
  gamesPlayed: 0,
  dailyStreak: 0,
  subjectAccuracy: {},
  fastestCorrectMs: 0,
  perfectRounds: 0,
  totalTimePlayed: 0,
};

export function getPlayerStats(): PlayerStats {
  return getStorage<PlayerStats>(STORAGE_KEYS.PLAYER_STATS, DEFAULT_STATS);
}

export function updatePlayerStats(updater: (stats: PlayerStats) => PlayerStats): PlayerStats {
  const current = getPlayerStats();
  const updated = updater(current);
  setStorage(STORAGE_KEYS.PLAYER_STATS, updated);
  return updated;
}

export function getUnlockedAchievements(): UnlockedAchievement[] {
  return getStorage<UnlockedAchievement[]>(STORAGE_KEYS.ACHIEVEMENTS, []);
}

/**
 * Check all achievements against current stats.
 * Returns array of newly unlocked achievement IDs.
 */
export function checkAchievements(stats?: PlayerStats): string[] {
  const currentStats = stats ?? getPlayerStats();
  const unlocked = getUnlockedAchievements();
  const unlockedIds = new Set(unlocked.map((a) => a.id));
  const newlyUnlocked: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.has(achievement.id)) continue;
    if (achievement.condition(currentStats)) {
      newlyUnlocked.push(achievement.id);
      unlocked.push({ id: achievement.id, unlockedAt: new Date().toISOString() });
    }
  }

  if (newlyUnlocked.length > 0) {
    setStorage(STORAGE_KEYS.ACHIEVEMENTS, unlocked);
  }

  return newlyUnlocked;
}

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
