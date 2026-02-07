/**
 * Wrong Answer Journal — tracks incorrect answers for spaced re-exposure.
 * Uses localStorage for persistence. Implements a simple spaced repetition
 * schedule for review: 1 day, 3 days, 7 days, 14 days.
 */

import type { WrongAnswerEntry } from './types';
import { getStorage, setStorage, STORAGE_KEYS } from '@/lib/storage';

const REVIEW_INTERVALS = [1, 3, 7, 14]; // days

function getNextReviewDate(reviewCount: number): string {
  const days = REVIEW_INTERVALS[Math.min(reviewCount, REVIEW_INTERVALS.length - 1)];
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function getWrongAnswers(subject?: string, limit?: number): WrongAnswerEntry[] {
  const all = getStorage<WrongAnswerEntry[]>(STORAGE_KEYS.WRONG_ANSWERS, []);
  let filtered = all.filter((e) => !e.learned);
  if (subject) {
    filtered = filtered.filter((e) => e.subject === subject);
  }
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (limit) return filtered.slice(0, limit);
  return filtered;
}

export function recordWrongAnswer(
  questionId: string,
  question: string,
  subject: string,
  userAnswer: string,
  correctAnswer: string,
  explanation?: string,
  deep_explanation?: string
): void {
  const all = getStorage<WrongAnswerEntry[]>(STORAGE_KEYS.WRONG_ANSWERS, []);
  const existing = all.findIndex((e) => e.questionId === questionId);

  if (existing >= 0) {
    // Already recorded — bump review count, reset schedule
    all[existing].reviewCount += 1;
    all[existing].nextReview = getNextReviewDate(0);
    all[existing].learned = false;
    all[existing].timestamp = new Date().toISOString();
  } else {
    all.push({
      questionId,
      question,
      subject,
      userAnswer,
      correctAnswer,
      explanation,
      deep_explanation,
      timestamp: new Date().toISOString(),
      reviewCount: 0,
      nextReview: getNextReviewDate(0),
      learned: false,
    });
  }

  setStorage(STORAGE_KEYS.WRONG_ANSWERS, all);
}

export function getDueForReview(): WrongAnswerEntry[] {
  const all = getStorage<WrongAnswerEntry[]>(STORAGE_KEYS.WRONG_ANSWERS, []);
  const now = new Date().toISOString();
  return all
    .filter((e) => !e.learned && e.nextReview <= now)
    .sort((a, b) => a.nextReview.localeCompare(b.nextReview));
}

export function markAsLearned(questionId: string): void {
  const all = getStorage<WrongAnswerEntry[]>(STORAGE_KEYS.WRONG_ANSWERS, []);
  const idx = all.findIndex((e) => e.questionId === questionId);
  if (idx >= 0) {
    all[idx].learned = true;
    setStorage(STORAGE_KEYS.WRONG_ANSWERS, all);
  }
}

export function markAsReviewed(questionId: string): void {
  const all = getStorage<WrongAnswerEntry[]>(STORAGE_KEYS.WRONG_ANSWERS, []);
  const idx = all.findIndex((e) => e.questionId === questionId);
  if (idx >= 0) {
    all[idx].reviewCount += 1;
    all[idx].nextReview = getNextReviewDate(all[idx].reviewCount);
    setStorage(STORAGE_KEYS.WRONG_ANSWERS, all);
  }
}

export function getWrongAnswerCount(): number {
  return getStorage<WrongAnswerEntry[]>(STORAGE_KEYS.WRONG_ANSWERS, []).filter(
    (e) => !e.learned
  ).length;
}

export function getSubjectBreakdown(): Record<string, number> {
  const all = getStorage<WrongAnswerEntry[]>(STORAGE_KEYS.WRONG_ANSWERS, []).filter(
    (e) => !e.learned
  );
  const breakdown: Record<string, number> = {};
  for (const entry of all) {
    breakdown[entry.subject] = (breakdown[entry.subject] || 0) + 1;
  }
  return breakdown;
}
