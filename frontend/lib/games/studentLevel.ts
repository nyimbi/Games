/**
 * Student level system — determines adaptive explanation depth.
 * Uses explicit grade level (if set) or infers from gameplay stats.
 */

import type { StudentProfile, StudentLevel, ExplanationConfig, PlayerStats } from './types';
import { getStorage, setStorage, STORAGE_KEYS } from '@/lib/storage';

const DEFAULT_PROFILE: StudentProfile = {
  gradeLevel: null,
  inferredLevel: null,
  profileSetAt: null,
  lastInferredAt: null,
};

export function getStudentProfile(): StudentProfile {
  return getStorage(STORAGE_KEYS.STUDENT_PROFILE, DEFAULT_PROFILE);
}

export function setGradeLevel(grade: number | null): StudentProfile {
  const profile = getStudentProfile();
  const updated: StudentProfile = {
    ...profile,
    gradeLevel: grade,
    profileSetAt: grade !== null ? new Date().toISOString() : null,
  };
  setStorage(STORAGE_KEYS.STUDENT_PROFILE, updated);
  return updated;
}

/** Infer level from gameplay stats (call after games). */
export function inferLevel(stats: PlayerStats): StudentLevel {
  const { totalQuestionsAnswered, correctAnswers, longestStreak } = stats;

  if (totalQuestionsAnswered < 50 || (totalQuestionsAnswered > 0 && correctAnswers / totalQuestionsAnswered < 0.4) || longestStreak < 3) {
    return 'beginner';
  }
  if (totalQuestionsAnswered > 200 && correctAnswers / totalQuestionsAnswered > 0.7 && longestStreak > 10) {
    return 'advanced';
  }
  return 'intermediate';
}

/** Update inferred level and persist. */
export function updateInferredLevel(stats: PlayerStats): StudentProfile {
  const profile = getStudentProfile();
  const level = inferLevel(stats);
  const updated: StudentProfile = {
    ...profile,
    inferredLevel: level,
    lastInferredAt: new Date().toISOString(),
  };
  setStorage(STORAGE_KEYS.STUDENT_PROFILE, updated);
  return updated;
}

/** Map grade to level. */
function gradeToLevel(grade: number): StudentLevel {
  if (grade <= 5) return 'beginner';
  if (grade <= 8) return 'intermediate';
  return 'advanced';
}

/** Returns effective level: grade-based if set, else inferred, else 'intermediate' default. */
export function getEffectiveLevel(): StudentLevel {
  const profile = getStudentProfile();
  if (profile.gradeLevel !== null) return gradeToLevel(profile.gradeLevel);
  if (profile.inferredLevel !== null) return profile.inferredLevel;
  return 'intermediate';
}

const EXPLANATION_CONFIGS: Record<StudentLevel, ExplanationConfig> = {
  beginner: {
    maxTokens: 200,
    complexity: 'simple',
    vocabulary: 'simple, analogies',
    sentences: '2-3',
  },
  intermediate: {
    maxTokens: 400,
    complexity: 'moderate',
    vocabulary: 'academic',
    sentences: '3-4',
  },
  advanced: {
    maxTokens: 600,
    complexity: 'detailed',
    vocabulary: 'technical',
    sentences: '4-6',
  },
};

export function getExplanationConfig(level?: StudentLevel): ExplanationConfig {
  return EXPLANATION_CONFIGS[level || getEffectiveLevel()];
}
