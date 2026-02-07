/**
 * AI opponent system for Battle Mode.
 * Simulates opponents with different accuracy levels and response times.
 */

export interface AIOpponent {
  name: string;
  avatar: string;
  difficulty: 'easy' | 'medium' | 'hard';
  accuracy: number; // 0-1
  avgResponseMs: number;
}

export const AI_OPPONENTS: AIOpponent[] = [
  {
    name: 'Rookie Bot',
    avatar: '\u{1F916}',
    difficulty: 'easy',
    accuracy: 0.6,
    avgResponseMs: 8000,
  },
  {
    name: 'Scholar Bot',
    avatar: '\u{1F9E0}',
    difficulty: 'medium',
    accuracy: 0.75,
    avgResponseMs: 5000,
  },
  {
    name: 'Champion Bot',
    avatar: '\u{1F451}',
    difficulty: 'hard',
    accuracy: 0.9,
    avgResponseMs: 3000,
  },
];

/**
 * Simulate an AI answer with some variance in timing and accuracy.
 */
export function simulateAIAnswer(
  opponent: AIOpponent,
  correctIndex: number,
  numOptions: number
): { answer: number; timeMs: number } {
  const isCorrect = Math.random() < opponent.accuracy;

  // Gaussian-ish variance on response time: +/- 40% of avg
  const variance = (Math.random() - 0.5) * 2 * 0.4;
  const timeMs = Math.max(1000, Math.round(opponent.avgResponseMs * (1 + variance)));

  if (isCorrect) {
    return { answer: correctIndex, timeMs };
  }

  // Pick a random wrong answer
  let wrong: number;
  do {
    wrong = Math.floor(Math.random() * numOptions);
  } while (wrong === correctIndex);

  return { answer: wrong, timeMs };
}
