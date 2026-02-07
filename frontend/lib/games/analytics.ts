/**
 * Analytics tracking module — records game results and computes aggregate stats.
 * All data persisted to localStorage via the storage layer.
 */

import type { PlayerStats } from './types';
import { getStorage, setStorage, STORAGE_KEYS, updateStorage } from '@/lib/storage';
import { getPlayerStats } from './achievements';

export interface GameResult {
  gameType: string;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  timeSpentMs: number;
  subjects: string[];
  timestamp: string;
}

export interface AnalyticsData {
  gameHistory: GameResult[];
  totalTimePlayed: number;
  favoriteGame: string | null;
  accuracyTrend: number[];
}

const DEFAULT_ANALYTICS: AnalyticsData = {
  gameHistory: [],
  totalTimePlayed: 0,
  favoriteGame: null,
  accuracyTrend: [],
};

export function recordGameResult(result: Omit<GameResult, 'timestamp'>): void {
  const entry: GameResult = {
    ...result,
    timestamp: new Date().toISOString(),
  };

  updateStorage<AnalyticsData>(STORAGE_KEYS.ANALYTICS, DEFAULT_ANALYTICS, (data) => {
    const history = [...data.gameHistory, entry];

    const totalTime = history.reduce((sum, g) => sum + g.timeSpentMs, 0);

    // Compute favorite game by play count
    const gameCounts: Record<string, number> = {};
    for (const g of history) {
      gameCounts[g.gameType] = (gameCounts[g.gameType] || 0) + 1;
    }
    let favoriteGame: string | null = null;
    let maxCount = 0;
    for (const [game, count] of Object.entries(gameCounts)) {
      if (count > maxCount) {
        maxCount = count;
        favoriteGame = game;
      }
    }

    // Accuracy trend: last 20 games that had questions
    const gamesWithQuestions = history.filter((g) => g.questionsAnswered > 0);
    const accuracyTrend = gamesWithQuestions
      .slice(-20)
      .map((g) => Math.round((g.correctAnswers / g.questionsAnswered) * 100));

    return {
      gameHistory: history,
      totalTimePlayed: totalTime,
      favoriteGame,
      accuracyTrend,
    };
  });
}

export function getAnalyticsData(): AnalyticsData {
  return getStorage<AnalyticsData>(STORAGE_KEYS.ANALYTICS, DEFAULT_ANALYTICS);
}

export function getAccuracyBySubject(): Record<string, { correct: number; total: number; accuracy: number }> {
  const stats = getPlayerStats();
  const result: Record<string, { correct: number; total: number; accuracy: number }> = {};

  for (const [subject, data] of Object.entries(stats.subjectAccuracy)) {
    result[subject] = {
      correct: data.correct,
      total: data.total,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    };
  }

  return result;
}

export function getGameHistory(limit?: number): GameResult[] {
  const data = getAnalyticsData();
  const sorted = [...data.gameHistory].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export function getStudyTimeByDay(days: number = 7): Array<{ date: string; minutes: number }> {
  const data = getAnalyticsData();
  const now = new Date();
  const result: Array<{ date: string; minutes: number }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayMs = data.gameHistory
      .filter((g) => g.timestamp.startsWith(dateStr))
      .reduce((sum, g) => sum + g.timeSpentMs, 0);

    result.push({
      date: dateStr,
      minutes: Math.round(dayMs / 60000),
    });
  }

  return result;
}

export function getStrongestSubject(): string | null {
  const accuracy = getAccuracyBySubject();
  let best: string | null = null;
  let bestAcc = -1;

  for (const [subject, data] of Object.entries(accuracy)) {
    if (data.total >= 5 && data.accuracy > bestAcc) {
      bestAcc = data.accuracy;
      best = subject;
    }
  }

  return best;
}

export function getWeakestSubject(): string | null {
  const accuracy = getAccuracyBySubject();
  let worst: string | null = null;
  let worstAcc = 101;

  for (const [subject, data] of Object.entries(accuracy)) {
    if (data.total >= 5 && data.accuracy < worstAcc) {
      worstAcc = data.accuracy;
      worst = subject;
    }
  }

  return worst;
}
