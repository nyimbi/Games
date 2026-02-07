/**
 * WSC Scholar's Challenge scoring system.
 * Correct = +1, Skip = 0, Wrong = -0.5
 */

export interface SCQuestion {
  questionId: string;
  answer: number | null; // null = skipped
  correct: boolean;
  subject: string;
  timeSpent: number;
}

export interface SCSubjectScore {
  correct: number;
  skipped: number;
  wrong: number;
  score: number;
}

export interface SCScore {
  total: number;
  bySubject: Record<string, SCSubjectScore>;
  questionsAnswered: number;
  questionsSkipped: number;
  questionsWrong: number;
}

const CORRECT_POINTS = 1;
const WRONG_PENALTY = -0.5;

export function calculateSCScore(answers: SCQuestion[]): SCScore {
  const bySubject: Record<string, SCSubjectScore> = {};
  let total = 0;
  let questionsAnswered = 0;
  let questionsSkipped = 0;
  let questionsWrong = 0;

  for (const a of answers) {
    if (!bySubject[a.subject]) {
      bySubject[a.subject] = { correct: 0, skipped: 0, wrong: 0, score: 0 };
    }
    const sub = bySubject[a.subject];

    if (a.answer === null) {
      sub.skipped += 1;
      questionsSkipped += 1;
    } else if (a.correct) {
      sub.correct += 1;
      sub.score += CORRECT_POINTS;
      total += CORRECT_POINTS;
      questionsAnswered += 1;
    } else {
      sub.wrong += 1;
      sub.score += WRONG_PENALTY;
      total += WRONG_PENALTY;
      questionsAnswered += 1;
      questionsWrong += 1;
    }
  }

  return {
    total,
    bySubject,
    questionsAnswered,
    questionsSkipped,
    questionsWrong,
  };
}

export function formatSCScore(score: number): string {
  if (score === 0) return '0';
  if (Number.isInteger(score)) return score.toString();
  // Show one decimal for negative half-point scores
  return score.toFixed(1);
}
