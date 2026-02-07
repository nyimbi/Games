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

  // Connection Quest
  {
    id: 'connection_first',
    name: 'Connected!',
    description: 'Complete 1 Connection Quest puzzle',
    icon: '🔗',
    category: 'exploration',
    condition: (s) => (s.connectionPuzzlesSolved ?? 0) >= 1,
  },
  {
    id: 'connection_perfect',
    name: 'Perfect Connection',
    description: 'Solve a puzzle with 0 mistakes',
    icon: '💎',
    category: 'special',
    condition: (s) => (s.connectionPerfects ?? 0) >= 1,
  },
  {
    id: 'connection_5',
    name: 'Link Master',
    description: 'Solve 5 Connection Quest puzzles',
    icon: '🧩',
    category: 'mastery',
    condition: (s) => (s.connectionPuzzlesSolved ?? 0) >= 5,
  },
  {
    id: 'connection_daily_7',
    name: 'Daily Connector',
    description: 'Complete 7 daily puzzles',
    icon: '📅',
    category: 'streak',
    condition: (s) => (s.connectionDailyCount ?? 0) >= 7,
  },

  // Scholar Sprint
  {
    id: 'sprint_100',
    name: 'Century Sprint',
    description: 'Reach 100m in Scholar Sprint',
    icon: '🏃',
    category: 'exploration',
    condition: (s) => (s.sprintBestDistance ?? 0) >= 100,
  },
  {
    id: 'sprint_500',
    name: 'Half Kilometer',
    description: 'Reach 500m in Scholar Sprint',
    icon: '🏃‍♂️',
    category: 'mastery',
    condition: (s) => (s.sprintBestDistance ?? 0) >= 500,
  },
  {
    id: 'sprint_1km',
    name: 'Kilometer Scholar',
    description: 'Reach 1000m in Scholar Sprint',
    icon: '🏅',
    category: 'mastery',
    condition: (s) => (s.sprintBestDistance ?? 0) >= 1000,
  },
  {
    id: 'sprint_5x',
    name: 'Maximum Velocity',
    description: 'Reach 5x multiplier in Scholar Sprint',
    icon: '🚀',
    category: 'speed',
    condition: (s) => (s.sprintMaxMultiplier ?? 0) >= 5,
  },
  {
    id: 'sprint_power',
    name: 'Power Scholar',
    description: 'Use all 4 power-up types in Scholar Sprint',
    icon: '⚡',
    category: 'special',
    condition: (s) => {
      const used = s.sprintPowerUpsUsed ?? [];
      const arr = Array.isArray(used) ? used : Array.from(used);
      return arr.length >= 4;
    },
  },

  // Memory Mosaic
  {
    id: 'mosaic_first',
    name: 'First Match',
    description: 'Complete a Memory Mosaic game',
    icon: '🧩',
    category: 'exploration',
    condition: (s) => (s.mosaicGridsCompleted ?? []).length >= 1,
  },
  {
    id: 'mosaic_perfect',
    name: 'Perfect Memory',
    description: 'Complete a mosaic with zero misses',
    icon: '🧠',
    category: 'special',
    condition: (s) => (s.mosaicPerfects ?? 0) >= 1,
  },
  {
    id: 'mosaic_combo_5',
    name: 'Combo Master',
    description: 'Get a 5+ combo in Memory Mosaic',
    icon: '🔥',
    category: 'streak',
    condition: (s) => (s.mosaicBestCombo ?? 0) >= 5,
  },
  {
    id: 'mosaic_6x6',
    name: 'Grand Mosaic',
    description: 'Complete a 6x6 Memory Mosaic',
    icon: '🖼️',
    category: 'mastery',
    condition: (s) => (s.mosaicGridsCompleted ?? []).includes('6x6'),
  },
  {
    id: 'mosaic_speed',
    name: 'Photographic',
    description: 'Complete 4x4 mosaic in under 30 seconds',
    icon: '📸',
    category: 'speed',
    condition: (s) => s.fastestCorrectMs > 0 && s.fastestCorrectMs < 30000,
  },

  // Argument Arena
  {
    id: 'arena_first',
    name: 'Opening Argument',
    description: 'Win your first Argument Arena match',
    icon: '⚖️',
    category: 'exploration',
    condition: (s) => (s.arenaWins ?? 0) >= 1,
  },
  {
    id: 'arena_perfect',
    name: 'Flawless Logic',
    description: 'Win all 5 rounds in an Argument Arena match',
    icon: '💎',
    category: 'special',
    condition: (s) => (s.arenaRoundsWon ?? 0) >= 5,
  },
  {
    id: 'arena_devil',
    name: "Devil's Defeat",
    description: "Beat The Devil's Advocate",
    icon: '😈',
    category: 'mastery',
    condition: (s) => s.arenaDevilBeaten === true,
  },
  {
    id: 'arena_rebuttal',
    name: 'Master Rebuttal',
    description: 'Win a round using a rebuttal card',
    icon: '🗡️',
    category: 'special',
    condition: (s) => (s.arenaRebuttalWins ?? 0) >= 1,
  },

  // Treasure Hunt
  {
    id: 'treasure_first',
    name: 'First Discovery',
    description: 'Earn your first Treasure Hunt star',
    icon: '⭐',
    category: 'exploration',
    condition: (s) => (s.treasureStars ?? 0) >= 1,
  },
  {
    id: 'treasure_region',
    name: 'Region Explorer',
    description: 'Complete 1 Treasure Hunt region',
    icon: '🗺️',
    category: 'mastery',
    condition: (s) => (s.treasureRegionsComplete ?? 0) >= 1,
  },
  {
    id: 'treasure_all',
    name: 'World Explorer',
    description: 'Complete all 5 Treasure Hunt regions',
    icon: '🌍',
    category: 'mastery',
    condition: (s) => (s.treasureRegionsComplete ?? 0) >= 5,
  },
  {
    id: 'treasure_30_stars',
    name: 'Star Collector',
    description: 'Earn 30 total Treasure Hunt stars',
    icon: '✨',
    category: 'exploration',
    condition: (s) => (s.treasureStars ?? 0) >= 30,
  },
  {
    id: 'treasure_bridge',
    name: 'Bridge Builder',
    description: 'Complete a bridge challenge',
    icon: '🌉',
    category: 'special',
    condition: (s) => (s.treasureBridgesComplete ?? 0) >= 1,
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
  connectionPuzzlesSolved: 0,
  connectionPerfects: 0,
  connectionDailyCount: 0,
  sprintBestDistance: 0,
  sprintMaxMultiplier: 0,
  sprintPowerUpsUsed: [],
  mosaicPerfects: 0,
  mosaicBestCombo: 0,
  mosaicGridsCompleted: [],
  arenaWins: 0,
  arenaRoundsWon: 0,
  arenaDevilBeaten: false,
  arenaRebuttalWins: 0,
  treasureStars: 0,
  treasureRegionsComplete: 0,
  treasureBridgesComplete: 0,
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
