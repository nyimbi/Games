'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Lock } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui';
import { ACHIEVEMENTS, getUnlockedAchievements, getPlayerStats } from '@/lib/games/achievements';
import type { Achievement, UnlockedAchievement, PlayerStats } from '@/lib/games/types';

type AchievementCategory = Achievement['category'];

const CATEGORY_CONFIG: Record<AchievementCategory, { label: string; color: string }> = {
  streak: { label: 'Streak', color: 'bg-coral-100 text-coral-700' },
  mastery: { label: 'Mastery', color: 'bg-sage-100 text-sage-700' },
  speed: { label: 'Speed', color: 'bg-gold-100 text-gold-700' },
  exploration: { label: 'Exploration', color: 'bg-ink-100 text-ink-700' },
  special: { label: 'Special', color: 'bg-purple-100 text-purple-700' },
};

const CATEGORIES: AchievementCategory[] = ['exploration', 'streak', 'mastery', 'speed', 'special'];

interface ProgressHint {
  current: number;
  target: number;
  label: string;
}

function getProgressHint(achievement: Achievement, stats: PlayerStats): ProgressHint | null {
  switch (achievement.id) {
    case 'first_game':
      return { current: Math.min(stats.gamesPlayed, 1), target: 1, label: 'games' };
    case 'five_games':
      return { current: Math.min(stats.gamesPlayed, 5), target: 5, label: 'games' };
    case 'twenty_five_games':
      return { current: Math.min(stats.gamesPlayed, 25), target: 25, label: 'games' };
    case 'hundred_questions':
      return { current: Math.min(stats.totalQuestionsAnswered, 100), target: 100, label: 'questions' };
    case 'five_hundred_questions':
      return { current: Math.min(stats.totalQuestionsAnswered, 500), target: 500, label: 'questions' };
    case 'streak_3':
      return { current: Math.min(stats.longestStreak, 3), target: 3, label: 'streak' };
    case 'streak_7':
      return { current: Math.min(stats.longestStreak, 7), target: 7, label: 'streak' };
    case 'streak_15':
      return { current: Math.min(stats.longestStreak, 15), target: 15, label: 'streak' };
    case 'daily_3':
      return { current: Math.min(stats.dailyStreak, 3), target: 3, label: 'days' };
    case 'daily_7':
      return { current: Math.min(stats.dailyStreak, 7), target: 7, label: 'days' };
    case 'daily_14':
      return { current: Math.min(stats.dailyStreak, 14), target: 14, label: 'days' };
    case 'daily_30':
      return { current: Math.min(stats.dailyStreak, 30), target: 30, label: 'days' };
    case 'perfect_5':
      return { current: Math.min(stats.perfectRounds, 5), target: 5, label: 'rounds' };
    default:
      return null;
  }
}

export function AchievementDisplay() {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  const unlocked = useMemo(() => (mounted ? getUnlockedAchievements() : []), [mounted]);
  const stats = useMemo(() => (mounted ? getPlayerStats() : null), [mounted]);
  const unlockedMap = useMemo(() => {
    const map = new Map<string, UnlockedAchievement>();
    for (const u of unlocked) map.set(u.id, u);
    return map;
  }, [unlocked]);

  if (!mounted || !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-ink-200 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = activeCategory === 'all'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter((a) => a.category === activeCategory);

  const totalUnlocked = unlocked.length;
  const totalAchievements = ACHIEVEMENTS.length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-gold-500" />
          <h2 className="font-display text-xl font-bold text-ink-800">Achievements</h2>
        </div>
        <Badge variant="gold">
          {totalUnlocked} of {totalAchievements} unlocked
        </Badge>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Achievement categories">
        <button
          role="tab"
          aria-selected={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
            activeCategory === 'all'
              ? 'bg-ink-800 text-white'
              : 'bg-white text-ink-600 hover:bg-cream-100 border border-ink-200'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-ink-800 text-white'
                  : `${config.color} hover:opacity-80 border border-transparent`
              }`}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="tabpanel">
        <AnimatePresence mode="popLayout">
          {filtered.map((achievement, i) => {
            const isUnlocked = unlockedMap.has(achievement.id);
            const unlockedData = unlockedMap.get(achievement.id);
            const progress = !isUnlocked ? getProgressHint(achievement, stats) : null;

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                layout
              >
                <Card
                  className={`transition-all ${
                    isUnlocked
                      ? 'ring-1 ring-gold-200 bg-gold-50/50'
                      : 'opacity-70'
                  }`}
                  padding="sm"
                >
                  <CardContent>
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                          isUnlocked
                            ? 'bg-gold-100'
                            : 'bg-ink-100 grayscale'
                        }`}
                        aria-hidden="true"
                      >
                        {isUnlocked ? (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                          >
                            {achievement.icon}
                          </motion.span>
                        ) : (
                          <span className="opacity-40">{achievement.icon}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-display font-semibold text-sm truncate ${
                            isUnlocked ? 'text-ink-800' : 'text-ink-500'
                          }`}>
                            {achievement.name}
                          </h3>
                          {isUnlocked && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', delay: 0.1 }}
                            >
                              <Badge variant="gold" size="sm">Earned</Badge>
                            </motion.div>
                          )}
                        </div>

                        <p className={`text-xs mt-0.5 ${
                          isUnlocked ? 'text-ink-500' : 'text-ink-400'
                        }`}>
                          {isUnlocked ? achievement.description : '???'}
                        </p>

                        {/* Unlock date */}
                        {isUnlocked && unlockedData && (
                          <p className="text-xs text-gold-600 mt-1">
                            {new Date(unlockedData.unlockedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        )}

                        {/* Progress bar for locked achievements */}
                        {!isUnlocked && progress && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-ink-400 mb-1">
                              <span>{progress.current}/{progress.target} {progress.label}</span>
                              <span>{Math.round((progress.current / progress.target) * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gold-300 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (progress.current / progress.target) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Locked indicator for achievements without progress */}
                        {!isUnlocked && !progress && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-ink-400">
                            <Lock className="w-3 h-3" />
                            <span>Locked</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-ink-400 text-sm py-8">
          No achievements in this category yet
        </p>
      )}
    </div>
  );
}
