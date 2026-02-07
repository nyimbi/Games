/**
 * Adaptive difficulty engine.
 * Uses a rolling window of recent answers to adjust question difficulty.
 * >80% accuracy → harder questions, <50% → easier questions.
 */

const WINDOW_SIZE = 10;

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AdaptiveState {
  history: boolean[];
  currentDifficulty: Difficulty;
}

export function createAdaptiveState(): AdaptiveState {
  return { history: [], currentDifficulty: 'medium' };
}

export function recordAnswer(state: AdaptiveState, correct: boolean): AdaptiveState {
  const history = [...state.history, correct].slice(-WINDOW_SIZE);
  const currentDifficulty = computeDifficulty(history, state.currentDifficulty);
  return { history, currentDifficulty };
}

function computeDifficulty(history: boolean[], current: Difficulty): Difficulty {
  if (history.length < 3) return current;

  const accuracy = history.reduce((sum, v) => sum + (v ? 1 : 0), 0) / history.length;

  if (accuracy > 0.8) {
    return current === 'easy' ? 'medium' : 'hard';
  }
  if (accuracy < 0.5) {
    return current === 'hard' ? 'medium' : 'easy';
  }
  return current;
}

export function getAdaptiveDifficulty(state: AdaptiveState): Difficulty {
  return state.currentDifficulty;
}

export function getAccuracy(state: AdaptiveState): number {
  if (state.history.length === 0) return 0;
  return state.history.reduce((sum, v) => sum + (v ? 1 : 0), 0) / state.history.length;
}

/**
 * Filter questions by difficulty, with fallback to adjacent levels.
 * If not enough questions at the target difficulty, includes adjacent levels.
 */
export function filterByDifficulty<T extends { difficulty: Difficulty }>(
  questions: T[],
  target: Difficulty,
  count: number
): T[] {
  const exact = questions.filter((q) => q.difficulty === target);
  if (exact.length >= count) return exact;

  const order: Record<Difficulty, Difficulty[]> = {
    easy: ['easy', 'medium', 'hard'],
    medium: ['medium', 'easy', 'hard'],
    hard: ['hard', 'medium', 'easy'],
  };

  const pool: T[] = [];
  for (const d of order[target]) {
    pool.push(...questions.filter((q) => q.difficulty === d && !pool.includes(q)));
    if (pool.length >= count) break;
  }
  return pool.slice(0, count);
}
