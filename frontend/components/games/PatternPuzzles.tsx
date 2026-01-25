'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Puzzle, ArrowRight, Check, X, Lightbulb, Trophy, RotateCcw, Coffee, Star, Pause, Play } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';

interface PatternPuzzlesProps {
  sessionId?: string;
  isHost?: boolean;
  onExit?: () => void;
}

interface Pattern {
  id: string;
  type: 'number' | 'letter' | 'shape' | 'color';
  sequence: string[];
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string; // Explanation shown when wrong
  difficulty: 'easy' | 'medium' | 'hard';
}

// Checkpoint interval (every 20 points)
const CHECKPOINT_INTERVAL = 20;

// Pattern puzzles organized by type and difficulty
const PATTERNS: Pattern[] = [
  // Number patterns - Easy
  {
    id: 'num-1',
    type: 'number',
    sequence: ['2', '4', '6', '8', '?'],
    options: ['9', '10', '12', '11'],
    correctIndex: 1,
    hint: 'Add the same number each time',
    explanation: 'This is adding 2 each time: 2→4→6→8→10. The pattern is +2.',
    difficulty: 'easy',
  },
  {
    id: 'num-2',
    type: 'number',
    sequence: ['1', '2', '4', '8', '?'],
    options: ['10', '12', '16', '14'],
    correctIndex: 2,
    hint: 'Each number is multiplied by the same value',
    explanation: 'Each number doubles: 1×2=2, 2×2=4, 4×2=8, 8×2=16. The pattern is ×2.',
    difficulty: 'easy',
  },
  {
    id: 'num-3',
    type: 'number',
    sequence: ['5', '10', '15', '20', '?'],
    options: ['22', '25', '30', '24'],
    correctIndex: 1,
    hint: 'Count by fives',
    explanation: 'Counting by 5s: 5, 10, 15, 20, 25. Each number increases by 5.',
    difficulty: 'easy',
  },
  // Number patterns - Medium
  {
    id: 'num-4',
    type: 'number',
    sequence: ['1', '1', '2', '3', '5', '?'],
    options: ['6', '7', '8', '9'],
    correctIndex: 2,
    hint: 'Add the two previous numbers',
    explanation: 'Fibonacci sequence: add the two previous numbers. 3+5=8. Each number is the sum of the two before it.',
    difficulty: 'medium',
  },
  {
    id: 'num-5',
    type: 'number',
    sequence: ['1', '4', '9', '16', '?'],
    options: ['20', '25', '24', '36'],
    correctIndex: 1,
    hint: 'Think about multiplication with the same number',
    explanation: 'Square numbers: 1²=1, 2²=4, 3²=9, 4²=16, 5²=25. Each number is multiplied by itself.',
    difficulty: 'medium',
  },
  {
    id: 'num-6',
    type: 'number',
    sequence: ['3', '6', '12', '24', '?'],
    options: ['36', '48', '30', '42'],
    correctIndex: 1,
    hint: 'Each number is doubled',
    explanation: 'Each number is multiplied by 2: 3×2=6, 6×2=12, 12×2=24, 24×2=48.',
    difficulty: 'medium',
  },
  // Letter patterns - Easy
  {
    id: 'let-1',
    type: 'letter',
    sequence: ['A', 'C', 'E', 'G', '?'],
    options: ['H', 'I', 'J', 'K'],
    correctIndex: 1,
    hint: 'Skip one letter each time',
    explanation: 'Skipping every other letter: A, (B), C, (D), E, (F), G, (H), I. We skip one letter each time.',
    difficulty: 'easy',
  },
  {
    id: 'let-2',
    type: 'letter',
    sequence: ['Z', 'Y', 'X', 'W', '?'],
    options: ['U', 'V', 'T', 'S'],
    correctIndex: 1,
    hint: 'The alphabet backwards',
    explanation: 'The alphabet in reverse: Z, Y, X, W, V. Going backwards one letter at a time.',
    difficulty: 'easy',
  },
  // Letter patterns - Medium
  {
    id: 'let-3',
    type: 'letter',
    sequence: ['A', 'B', 'D', 'G', '?'],
    options: ['H', 'I', 'J', 'K'],
    correctIndex: 3,
    hint: 'The gap increases by one each time',
    explanation: 'The gap grows: A→B (+1), B→D (+2), D→G (+3), G→K (+4). Each jump is one more than the last.',
    difficulty: 'medium',
  },
  // Shape patterns (using emoji representations)
  {
    id: 'shape-1',
    type: 'shape',
    sequence: ['🔴', '🔵', '🔴', '🔵', '?'],
    options: ['🟢', '🔴', '🟡', '🔵'],
    correctIndex: 1,
    hint: 'Alternating pattern',
    explanation: 'Red and blue alternate: 🔴🔵🔴🔵🔴. Odd positions are red, even positions are blue.',
    difficulty: 'easy',
  },
  {
    id: 'shape-2',
    type: 'shape',
    sequence: ['⭐', '⭐', '🌙', '⭐', '⭐', '?'],
    options: ['⭐', '🌙', '☀️', '🌟'],
    correctIndex: 1,
    hint: 'Every third item is different',
    explanation: 'Two stars, then a moon: ⭐⭐🌙⭐⭐🌙. Every third position (3rd, 6th) is a moon.',
    difficulty: 'medium',
  },
  {
    id: 'shape-3',
    type: 'shape',
    sequence: ['🔺', '🔻', '🔺', '🔻', '🔺', '?'],
    options: ['🔺', '🔻', '⬛', '⬜'],
    correctIndex: 1,
    hint: 'Up, down, up, down...',
    explanation: 'Triangles alternate direction: up, down, up, down, up, down. Position 6 should point down.',
    difficulty: 'easy',
  },
  // Number patterns - Hard
  {
    id: 'num-7',
    type: 'number',
    sequence: ['2', '6', '12', '20', '?'],
    options: ['28', '30', '32', '26'],
    correctIndex: 1,
    hint: 'Look at the differences between numbers',
    explanation: 'Differences increase by 2: 6-2=4, 12-6=6, 20-12=8, so next diff is 10. 20+10=30.',
    difficulty: 'hard',
  },
  {
    id: 'num-8',
    type: 'number',
    sequence: ['1', '3', '6', '10', '15', '?'],
    options: ['18', '20', '21', '25'],
    correctIndex: 2,
    hint: 'Triangular numbers: add 2, then 3, then 4...',
    explanation: 'Add increasing numbers: +2, +3, +4, +5, +6. So 15+6=21. These are triangular numbers!',
    difficulty: 'hard',
  },
  // Additional Number patterns - Easy
  {
    id: 'num-9',
    type: 'number',
    sequence: ['10', '20', '30', '40', '?'],
    options: ['45', '50', '55', '60'],
    correctIndex: 1,
    hint: 'Count by tens',
    explanation: 'Adding 10 each time: 10, 20, 30, 40, 50. The pattern is +10.',
    difficulty: 'easy',
  },
  {
    id: 'num-10',
    type: 'number',
    sequence: ['100', '90', '80', '70', '?'],
    options: ['50', '60', '65', '55'],
    correctIndex: 1,
    hint: 'Subtract the same number each time',
    explanation: 'Subtracting 10 each time: 100, 90, 80, 70, 60. The pattern is -10.',
    difficulty: 'easy',
  },
  {
    id: 'num-11',
    type: 'number',
    sequence: ['1', '3', '5', '7', '?'],
    options: ['8', '9', '10', '11'],
    correctIndex: 1,
    hint: 'Add the same number each time',
    explanation: 'Odd numbers! Adding 2 each time: 1, 3, 5, 7, 9. The pattern is +2.',
    difficulty: 'easy',
  },
  {
    id: 'num-12',
    type: 'number',
    sequence: ['2', '4', '8', '16', '?'],
    options: ['24', '30', '32', '20'],
    correctIndex: 2,
    hint: 'Each number is multiplied by the same value',
    explanation: 'Each number doubles: 2×2=4, 4×2=8, 8×2=16, 16×2=32. The pattern is ×2.',
    difficulty: 'easy',
  },
  {
    id: 'num-13',
    type: 'number',
    sequence: ['0', '5', '10', '15', '?'],
    options: ['18', '20', '25', '22'],
    correctIndex: 1,
    hint: 'Count by fives',
    explanation: 'Counting by 5s starting from 0: 0, 5, 10, 15, 20.',
    difficulty: 'easy',
  },
  // Additional Number patterns - Medium
  {
    id: 'num-14',
    type: 'number',
    sequence: ['2', '5', '10', '17', '?'],
    options: ['24', '26', '28', '30'],
    correctIndex: 1,
    hint: 'The gap between numbers increases',
    explanation: 'Adding increasing amounts: +3, +5, +7, +9. 17+9=26. Each gap grows by 2.',
    difficulty: 'medium',
  },
  {
    id: 'num-15',
    type: 'number',
    sequence: ['1', '2', '6', '24', '?'],
    options: ['48', '72', '96', '120'],
    correctIndex: 3,
    hint: 'Multiply by an increasing number',
    explanation: 'Factorial pattern: 1×1=1, 1×2=2, 2×3=6, 6×4=24, 24×5=120. Multiply by 1, 2, 3, 4, 5...',
    difficulty: 'medium',
  },
  {
    id: 'num-16',
    type: 'number',
    sequence: ['64', '32', '16', '8', '?'],
    options: ['2', '4', '6', '0'],
    correctIndex: 1,
    hint: 'Each number is divided by the same value',
    explanation: 'Each number is halved: 64÷2=32, 32÷2=16, 16÷2=8, 8÷2=4. The pattern is ÷2.',
    difficulty: 'medium',
  },
  {
    id: 'num-17',
    type: 'number',
    sequence: ['1', '8', '27', '64', '?'],
    options: ['100', '125', '150', '81'],
    correctIndex: 1,
    hint: 'Think about cubes',
    explanation: 'Cube numbers: 1³=1, 2³=8, 3³=27, 4³=64, 5³=125. Each number cubed!',
    difficulty: 'medium',
  },
  {
    id: 'num-18',
    type: 'number',
    sequence: ['2', '3', '5', '7', '11', '?'],
    options: ['12', '13', '14', '15'],
    correctIndex: 1,
    hint: 'These are special numbers in math',
    explanation: 'Prime numbers! Numbers only divisible by 1 and themselves: 2, 3, 5, 7, 11, 13.',
    difficulty: 'medium',
  },
  // Additional Letter patterns - Easy
  {
    id: 'let-4',
    type: 'letter',
    sequence: ['A', 'B', 'C', 'D', '?'],
    options: ['F', 'E', 'G', 'H'],
    correctIndex: 1,
    hint: 'Just the alphabet in order',
    explanation: 'Simple alphabet sequence: A, B, C, D, E. Going forward one letter at a time.',
    difficulty: 'easy',
  },
  {
    id: 'let-5',
    type: 'letter',
    sequence: ['B', 'D', 'F', 'H', '?'],
    options: ['I', 'J', 'K', 'L'],
    correctIndex: 1,
    hint: 'Skip one letter each time',
    explanation: 'Every other letter: B, (C), D, (E), F, (G), H, (I), J. Skip one letter each time.',
    difficulty: 'easy',
  },
  {
    id: 'let-6',
    type: 'letter',
    sequence: ['M', 'N', 'O', 'P', '?'],
    options: ['R', 'S', 'Q', 'T'],
    correctIndex: 2,
    hint: 'Middle of the alphabet, in order',
    explanation: 'Sequential letters from the middle: M, N, O, P, Q.',
    difficulty: 'easy',
  },
  // Additional Letter patterns - Medium
  {
    id: 'let-7',
    type: 'letter',
    sequence: ['A', 'D', 'G', 'J', '?'],
    options: ['K', 'L', 'M', 'N'],
    correctIndex: 2,
    hint: 'Skip two letters each time',
    explanation: 'Skip 2 letters: A, (BC), D, (EF), G, (HI), J, (KL), M. Jump by 3 each time.',
    difficulty: 'medium',
  },
  {
    id: 'let-8',
    type: 'letter',
    sequence: ['Z', 'X', 'V', 'T', '?'],
    options: ['S', 'R', 'Q', 'P'],
    correctIndex: 1,
    hint: 'Backwards, skipping one',
    explanation: 'Backwards, skip one: Z, (Y), X, (W), V, (U), T, (S), R. Reverse alphabet, skip 1.',
    difficulty: 'medium',
  },
  {
    id: 'let-9',
    type: 'letter',
    sequence: ['A', 'C', 'F', 'J', '?'],
    options: ['N', 'O', 'P', 'M'],
    correctIndex: 1,
    hint: 'The gap increases: +2, +3, +4...',
    explanation: 'Increasing gaps: A→C (+2), C→F (+3), F→J (+4), J→O (+5). Gap grows by 1 each time.',
    difficulty: 'medium',
  },
  // Additional Shape patterns - Easy
  {
    id: 'shape-4',
    type: 'shape',
    sequence: ['🟢', '🟢', '🔴', '🟢', '🟢', '?'],
    options: ['🟢', '🔴', '🟡', '🔵'],
    correctIndex: 1,
    hint: 'Every third is different',
    explanation: 'Two greens, then red: 🟢🟢🔴🟢🟢🔴. Every 3rd position is red.',
    difficulty: 'easy',
  },
  {
    id: 'shape-5',
    type: 'shape',
    sequence: ['⬜', '⬛', '⬜', '⬛', '?'],
    options: ['⬛', '⬜', '🟥', '🟦'],
    correctIndex: 1,
    hint: 'Like a checkerboard',
    explanation: 'Alternating colors: ⬜⬛⬜⬛⬜. White, black, white, black...',
    difficulty: 'easy',
  },
  {
    id: 'shape-6',
    type: 'shape',
    sequence: ['🌟', '🌟', '🌟', '🌙', '?'],
    options: ['🌟', '🌙', '☀️', '⭐'],
    correctIndex: 0,
    hint: 'How many stars before the moon?',
    explanation: 'Three stars then moon: 🌟🌟🌟🌙🌟🌟🌟🌙... Pattern repeats every 4.',
    difficulty: 'easy',
  },
  {
    id: 'shape-7',
    type: 'shape',
    sequence: ['🔵', '🔵', '🔴', '🔴', '?'],
    options: ['🔴', '🔵', '🟢', '🟡'],
    correctIndex: 1,
    hint: 'Two of each, then repeat',
    explanation: 'Two blue, two red, repeat: 🔵🔵🔴🔴🔵🔵... The pattern is AABB.',
    difficulty: 'easy',
  },
  // Additional Shape patterns - Medium
  {
    id: 'shape-8',
    type: 'shape',
    sequence: ['🔴', '🟡', '🟢', '🔴', '🟡', '?'],
    options: ['🔴', '🟡', '🟢', '🔵'],
    correctIndex: 2,
    hint: 'Traffic light colors repeat',
    explanation: 'Traffic light cycle: 🔴🟡🟢🔴🟡🟢... Red, yellow, green, repeat!',
    difficulty: 'medium',
  },
  {
    id: 'shape-9',
    type: 'shape',
    sequence: ['◯', '◯', '△', '◯', '◯', '◯', '△', '?'],
    options: ['◯', '△', '□', '◇'],
    correctIndex: 0,
    hint: 'Count circles between triangles',
    explanation: 'Circles increase: 2 circles, triangle, 3 circles, triangle, 4 circles... So next is ◯.',
    difficulty: 'medium',
  },
  {
    id: 'shape-10',
    type: 'shape',
    sequence: ['🟦', '🟩', '🟨', '🟦', '🟩', '?'],
    options: ['🟦', '🟩', '🟨', '🟥'],
    correctIndex: 2,
    hint: 'Three colors repeating',
    explanation: 'Blue, green, yellow cycle: 🟦🟩🟨🟦🟩🟨... Pattern of 3 repeats.',
    difficulty: 'medium',
  },
  // Color patterns - Easy
  {
    id: 'color-1',
    type: 'color',
    sequence: ['🟥', '🟧', '🟨', '🟩', '?'],
    options: ['🟥', '🟦', '🟪', '⬛'],
    correctIndex: 1,
    hint: 'Rainbow colors',
    explanation: 'Rainbow order: Red, Orange, Yellow, Green, Blue. ROYGBIV!',
    difficulty: 'easy',
  },
  {
    id: 'color-2',
    type: 'color',
    sequence: ['🟥', '🟥', '🟦', '🟦', '?'],
    options: ['🟥', '🟦', '🟩', '🟨'],
    correctIndex: 2,
    hint: 'Two reds, two blues, then what?',
    explanation: 'Two of each primary color: 🟥🟥🟦🟦🟩🟩... Red, blue, green (primaries).',
    difficulty: 'easy',
  },
  {
    id: 'color-3',
    type: 'color',
    sequence: ['⬛', '⬜', '⬛', '⬜', '⬛', '?'],
    options: ['⬛', '⬜', '🟫', '🟪'],
    correctIndex: 1,
    hint: 'Piano keys pattern',
    explanation: 'Alternating black and white: ⬛⬜⬛⬜⬛⬜. Like piano keys!',
    difficulty: 'easy',
  },
  // Color patterns - Medium
  {
    id: 'color-4',
    type: 'color',
    sequence: ['🟥', '🟧', '🟥', '🟧', '🟥', '?'],
    options: ['🟥', '🟧', '🟨', '🟩'],
    correctIndex: 1,
    hint: 'Two warm colors alternate',
    explanation: 'Red and orange alternate: 🟥🟧🟥🟧🟥🟧. Warm color flip-flop!',
    difficulty: 'medium',
  },
  {
    id: 'color-5',
    type: 'color',
    sequence: ['🟦', '🟩', '🟦', '🟩', '🟦', '🟩', '?'],
    options: ['🟦', '🟩', '🟨', '🟥'],
    correctIndex: 0,
    hint: 'Cool colors alternate',
    explanation: 'Blue and green alternate: 🟦🟩🟦🟩🟦🟩🟦. Pattern continues with blue.',
    difficulty: 'medium',
  },
  // Additional Number patterns - Hard
  {
    id: 'num-19',
    type: 'number',
    sequence: ['0', '1', '1', '2', '3', '?'],
    options: ['4', '5', '6', '8'],
    correctIndex: 1,
    hint: 'Famous sequence: add previous two',
    explanation: 'Fibonacci starting from 0: 0+1=1, 1+1=2, 1+2=3, 2+3=5. Add the two before!',
    difficulty: 'hard',
  },
  {
    id: 'num-20',
    type: 'number',
    sequence: ['2', '4', '8', '16', '32', '?'],
    options: ['48', '56', '64', '128'],
    correctIndex: 2,
    hint: 'Powers of 2',
    explanation: 'Doubling: 2¹=2, 2²=4, 2³=8, 2⁴=16, 2⁵=32, 2⁶=64. Powers of 2!',
    difficulty: 'hard',
  },
  {
    id: 'num-21',
    type: 'number',
    sequence: ['1', '4', '27', '256', '?'],
    options: ['625', '1024', '3125', '512'],
    correctIndex: 2,
    hint: 'Each number raised to increasing powers',
    explanation: '1¹=1, 2²=4, 3³=27, 4⁴=256, 5⁵=3125. n to the power of n!',
    difficulty: 'hard',
  },
  // More Easy patterns for beginners
  {
    id: 'num-22',
    type: 'number',
    sequence: ['12', '10', '8', '6', '?'],
    options: ['5', '4', '3', '2'],
    correctIndex: 1,
    hint: 'Counting down by twos',
    explanation: 'Subtracting 2 each time: 12, 10, 8, 6, 4. The pattern is -2.',
    difficulty: 'easy',
  },
  {
    id: 'num-23',
    type: 'number',
    sequence: ['3', '6', '9', '12', '?'],
    options: ['13', '14', '15', '16'],
    correctIndex: 2,
    hint: 'Counting by threes',
    explanation: 'Adding 3 each time: 3, 6, 9, 12, 15. These are multiples of 3!',
    difficulty: 'easy',
  },
  {
    id: 'num-24',
    type: 'number',
    sequence: ['7', '14', '21', '28', '?'],
    options: ['32', '35', '42', '36'],
    correctIndex: 1,
    hint: 'Counting by sevens',
    explanation: 'Adding 7 each time: 7, 14, 21, 28, 35. Multiples of 7!',
    difficulty: 'easy',
  },
  // More Letter patterns
  {
    id: 'let-10',
    type: 'letter',
    sequence: ['T', 'S', 'R', 'Q', '?'],
    options: ['O', 'P', 'N', 'M'],
    correctIndex: 1,
    hint: 'Going backwards',
    explanation: 'Reverse alphabet: T, S, R, Q, P. Going back one letter at a time.',
    difficulty: 'easy',
  },
  {
    id: 'let-11',
    type: 'letter',
    sequence: ['A', 'Z', 'B', 'Y', 'C', '?'],
    options: ['D', 'X', 'W', 'V'],
    correctIndex: 1,
    hint: 'One from start, one from end',
    explanation: 'Alternating ends: A(1st), Z(last), B(2nd), Y(2nd last), C(3rd), X(3rd last).',
    difficulty: 'medium',
  },
  {
    id: 'let-12',
    type: 'letter',
    sequence: ['A', 'E', 'I', 'O', '?'],
    options: ['P', 'Q', 'U', 'S'],
    correctIndex: 2,
    hint: 'These letters have something special in common',
    explanation: 'Vowels! A, E, I, O, U are the five vowels in English.',
    difficulty: 'easy',
  },
  // More Shape patterns
  {
    id: 'shape-11',
    type: 'shape',
    sequence: ['❤️', '💛', '💚', '💙', '?'],
    options: ['💜', '🖤', '🤍', '🧡'],
    correctIndex: 0,
    hint: 'Rainbow hearts',
    explanation: 'Rainbow order in hearts: Red, Yellow, Green, Blue, Purple!',
    difficulty: 'easy',
  },
  {
    id: 'shape-12',
    type: 'shape',
    sequence: ['🌑', '🌒', '🌓', '🌔', '?'],
    options: ['🌑', '🌕', '🌖', '🌗'],
    correctIndex: 1,
    hint: 'Watch the moon grow',
    explanation: 'Moon phases: New, Waxing Crescent, First Quarter, Waxing Gibbous, Full!',
    difficulty: 'medium',
  },
  {
    id: 'shape-13',
    type: 'shape',
    sequence: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '?'],
    options: ['5️⃣', '6️⃣', '7️⃣', '8️⃣'],
    correctIndex: 0,
    hint: 'Count up',
    explanation: 'Simple counting: 1, 2, 3, 4, 5. Number emojis in order!',
    difficulty: 'easy',
  },
];

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * PatternPuzzles - Pattern recognition game
 * Identify the pattern and select the next item in the sequence
 * Continues until the learner decides to take a break
 */
export function PatternPuzzles({ sessionId, isHost = false, onExit }: PatternPuzzlesProps) {
  const [state, setState] = useState({
    phase: 'waiting' as 'waiting' | 'playing' | 'revealing' | 'checkpoint' | 'ended',
    currentPattern: null as Pattern | null,
    patternsCompleted: 0,
    selectedAnswer: null as number | null,
    isCorrect: false,
    score: 0,
    streak: 0,
    bestStreak: 0,
    showHint: false,
    isPaused: false,
    timePerPattern: 20,
    timeLeft: 20,
    lastCheckpoint: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
  });

  // Pool of remaining patterns to draw from (reshuffles when empty)
  const patternPoolRef = useRef<Pattern[]>([]);

  // Get the next pattern from the pool, reshuffling if needed
  const getNextPattern = useCallback((): Pattern => {
    if (patternPoolRef.current.length === 0) {
      // Reshuffle all patterns when pool is empty
      patternPoolRef.current = shuffleArray(PATTERNS);
    }
    return patternPoolRef.current.pop()!;
  }, []);

  // Timer for each pattern
  useEffect(() => {
    if (state.phase === 'playing' && !state.isPaused && state.timeLeft > 0) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (state.phase === 'playing' && state.timeLeft === 0) {
      // Time's up - mark as wrong
      handleAnswer(-1);
    }
  }, [state.phase, state.timeLeft, state.isPaused]);

  // Toggle pause
  const handleTogglePause = () => {
    setState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleStart = () => {
    // Initialize pattern pool with shuffled patterns
    patternPoolRef.current = shuffleArray(PATTERNS);
    const firstPattern = patternPoolRef.current.pop()!;

    setState((prev) => ({
      ...prev,
      phase: 'playing',
      currentPattern: firstPattern,
      patternsCompleted: 0,
      selectedAnswer: null,
      score: 0,
      streak: 0,
      bestStreak: 0,
      showHint: false,
      isPaused: false,
      timeLeft: prev.timePerPattern,
      lastCheckpoint: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
    }));
  };

  const handleAnswer = (answerIndex: number) => {
    const currentPattern = state.currentPattern;
    if (!currentPattern) return;

    const isCorrect = answerIndex === currentPattern.correctIndex;

    // Calculate points: base points + time bonus + streak bonus
    const basePoints = isCorrect ? 10 : 0;
    const timeBonus = isCorrect ? Math.floor(state.timeLeft / 2) : 0;
    const streakBonus = isCorrect && state.streak >= 2 ? state.streak * 2 : 0;
    const hintPenalty = state.showHint && isCorrect ? -3 : 0;
    const totalPoints = basePoints + timeBonus + streakBonus + hintPenalty;

    const newStreak = isCorrect ? state.streak + 1 : 0;
    const newBestStreak = Math.max(state.bestStreak, newStreak);
    const newScore = state.score + totalPoints;

    setState((prev) => ({
      ...prev,
      phase: 'revealing',
      selectedAnswer: answerIndex,
      isCorrect,
      score: newScore,
      streak: newStreak,
      bestStreak: newBestStreak,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      wrongAnswers: prev.wrongAnswers + (isCorrect ? 0 : 1),
    }));
  };

  const handleNext = () => {
    const newPatternsCompleted = state.patternsCompleted + 1;

    // Check if we've reached a new checkpoint (every 20 points)
    const currentCheckpointLevel = Math.floor(state.score / CHECKPOINT_INTERVAL);
    const reachedNewCheckpoint = currentCheckpointLevel > state.lastCheckpoint && state.score > 0;

    if (reachedNewCheckpoint) {
      // Show checkpoint celebration
      setState((prev) => ({
        ...prev,
        phase: 'checkpoint',
        patternsCompleted: newPatternsCompleted,
        lastCheckpoint: currentCheckpointLevel,
      }));
    } else {
      // Continue with next pattern
      const nextPattern = getNextPattern();
      setState((prev) => ({
        ...prev,
        phase: 'playing',
        currentPattern: nextPattern,
        patternsCompleted: newPatternsCompleted,
        selectedAnswer: null,
        showHint: false,
        timeLeft: prev.timePerPattern,
      }));
    }
  };

  const handleContinueFromCheckpoint = () => {
    const nextPattern = getNextPattern();
    setState((prev) => ({
      ...prev,
      phase: 'playing',
      currentPattern: nextPattern,
      selectedAnswer: null,
      showHint: false,
      timeLeft: prev.timePerPattern,
    }));
  };

  const handleTakeBreak = () => {
    setState((prev) => ({ ...prev, phase: 'ended' }));
  };

  const handleShowHint = () => {
    setState((prev) => ({ ...prev, showHint: true }));
  };

  const handleRestart = () => {
    patternPoolRef.current = [];
    setState((prev) => ({
      ...prev,
      phase: 'waiting',
      currentPattern: null,
      patternsCompleted: 0,
      selectedAnswer: null,
      score: 0,
      streak: 0,
      bestStreak: 0,
      showHint: false,
      lastCheckpoint: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
    }));
  };

  const handleExit = () => {
    onExit?.();
  };

  const currentPattern = state.currentPattern;
  // Progress toward next checkpoint (20 points)
  const pointsToNextCheckpoint = CHECKPOINT_INTERVAL - (state.score % CHECKPOINT_INTERVAL);
  const checkpointProgress = ((CHECKPOINT_INTERVAL - pointsToNextCheckpoint) / CHECKPOINT_INTERVAL) * 100;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-sage-100 text-sage-700';
      case 'medium': return 'bg-gold-100 text-gold-700';
      case 'hard': return 'bg-coral-100 text-coral-700';
      default: return 'bg-ink-100 text-ink-700';
    }
  };

  const renderContent = () => {
    switch (state.phase) {
      case 'waiting':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Puzzle className="w-10 h-10 text-sky-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
                Pattern Puzzles
              </h2>
              <p className="text-ink-600 mb-4">
                Find the pattern and complete the sequence
              </p>
              <div className="bg-paper-100 rounded-xl p-4 mb-8 text-left">
                <h4 className="font-semibold text-ink-700 mb-2">How it works:</h4>
                <ul className="text-sm text-ink-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                    <span>Look at the sequence and find the pattern</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                    <span>Select what comes next</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                    <span>Build a streak for bonus points!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-gold-500 mt-0.5 shrink-0" />
                    <span>Every 20 points = checkpoint celebration!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Coffee className="w-4 h-4 text-coral-500 mt-0.5 shrink-0" />
                    <span>Take a break whenever you want</span>
                  </li>
                </ul>
              </div>
              <Button variant="gold" size="lg" onClick={handleStart}>
                Start Puzzles
              </Button>
            </motion.div>
          </div>
        );

      case 'playing':
      case 'revealing':
        return (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-xl mx-auto w-full flex-1 flex flex-col">
              {/* Progress & Stats */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-ink-500 mb-2">
                  <span>Pattern #{state.patternsCompleted + 1}</span>
                  <div className="flex gap-4">
                    <span>Score: <strong className="text-gold-600">{state.score}</strong></span>
                    {state.streak > 1 && (
                      <span className="text-coral-600">🔥 {state.streak} streak</span>
                    )}
                  </div>
                </div>
                {/* Progress to next checkpoint */}
                <div className="relative">
                  <Progress value={state.score % CHECKPOINT_INTERVAL} max={CHECKPOINT_INTERVAL} variant="gold" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-gold-600 font-medium">
                    {pointsToNextCheckpoint} pts to ⭐
                  </div>
                </div>
              </div>

              {/* Pattern Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={getDifficultyColor(currentPattern?.difficulty || 'medium')}>
                      {currentPattern?.difficulty?.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {currentPattern?.type} Pattern
                    </Badge>
                  </div>

                  {/* Timer bar */}
                  {state.phase === 'playing' && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${state.isPaused ? 'bg-ink-300' : state.timeLeft < 5 ? 'bg-coral-500' : 'bg-sky-500'}`}
                            initial={{ width: '100%' }}
                            animate={{ width: `${(state.timeLeft / state.timePerPattern) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <span className={`text-sm font-mono ${state.timeLeft < 5 ? 'text-coral-600' : 'text-ink-500'}`}>
                          {state.timeLeft}s
                        </span>
                      </div>
                      {state.isPaused && (
                        <p className="text-center text-sm text-ink-500 italic">Timer paused</p>
                      )}
                    </div>
                  )}

                  {/* Sequence Display */}
                  <div className="flex items-center justify-center gap-2 md:gap-4 mb-6 flex-wrap">
                    {currentPattern?.sequence.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-xl md:text-2xl font-bold ${
                          item === '?'
                            ? 'bg-gold-100 text-gold-600 border-2 border-dashed border-gold-300'
                            : 'bg-white shadow-md text-ink-800'
                        }`}
                      >
                        {item}
                      </motion.div>
                    ))}
                  </div>

                  {/* Hint */}
                  <AnimatePresence>
                    {state.showHint && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-gold-50 rounded-lg p-3 mb-4 flex items-center gap-2"
                      >
                        <Lightbulb className="w-5 h-5 text-gold-500 shrink-0" />
                        <span className="text-sm text-gold-800">{currentPattern?.hint}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Answer Options */}
                  <div className="grid grid-cols-2 gap-3">
                    {currentPattern?.options.map((option, index) => {
                      const isSelected = state.selectedAnswer === index;
                      const isCorrectAnswer = index === currentPattern.correctIndex;
                      const isRevealing = state.phase === 'revealing';

                      let buttonClass = 'bg-white hover:bg-ink-50 border-2 border-ink-200';
                      if (isRevealing) {
                        if (isCorrectAnswer) {
                          buttonClass = 'bg-sage-100 border-2 border-sage-500 text-sage-800';
                        } else if (isSelected && !isCorrectAnswer) {
                          buttonClass = 'bg-coral-100 border-2 border-coral-500 text-coral-800';
                        }
                      }

                      return (
                        <motion.button
                          key={index}
                          whileHover={state.phase === 'playing' ? { scale: 1.02 } : {}}
                          whileTap={state.phase === 'playing' ? { scale: 0.98 } : {}}
                          onClick={() => state.phase === 'playing' && handleAnswer(index)}
                          disabled={state.phase !== 'playing'}
                          className={`p-4 rounded-xl text-2xl font-bold transition-all ${buttonClass}`}
                        >
                          <span className="flex items-center justify-center gap-2">
                            {option}
                            {isRevealing && isCorrectAnswer && (
                              <Check className="w-5 h-5 text-sage-600" />
                            )}
                            {isRevealing && isSelected && !isCorrectAnswer && (
                              <X className="w-5 h-5 text-coral-600" />
                            )}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Explanation when wrong */}
                  <AnimatePresence>
                    {state.phase === 'revealing' && !state.isCorrect && currentPattern && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-4 bg-sky-50 rounded-xl p-4 border border-sky-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center shrink-0">
                            <Lightbulb className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sky-800 mb-1">Here&apos;s how it works:</h4>
                            <p className="text-sm text-sky-700">{currentPattern.explanation}</p>
                            <p className="text-sm text-sky-600 mt-2">
                              The answer is <strong className="text-sky-800">{currentPattern.options[currentPattern.correctIndex]}</strong>
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4 flex-wrap">
                {state.phase === 'playing' && !state.showHint && (
                  <Button variant="ghost" onClick={handleShowHint}>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Hint (-3 pts)
                  </Button>
                )}
                {state.phase === 'playing' && (
                  <Button variant="ghost" onClick={handleTogglePause}>
                    {state.isPaused ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    )}
                  </Button>
                )}
                {state.phase === 'playing' && (
                  <Button variant="ghost" onClick={handleTakeBreak} className="ml-auto">
                    <Coffee className="w-4 h-4 mr-2" />
                    Take a Break
                  </Button>
                )}
                {state.phase === 'revealing' && (
                  <>
                    <Button variant="ghost" onClick={handleTakeBreak}>
                      <Coffee className="w-4 h-4 mr-2" />
                      Take a Break
                    </Button>
                    <Button variant="gold" size="lg" onClick={handleNext} className="flex-1">
                      Next Pattern
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        );

      case 'checkpoint':
        const checkpointNumber = Math.floor(state.score / CHECKPOINT_INTERVAL);
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              {/* Celebration animation */}
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-24 h-24 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <Star className="w-12 h-12 text-white" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">
                  🎉 Checkpoint {checkpointNumber}!
                </h2>
                <p className="text-ink-600 mb-6">
                  You&apos;ve earned <strong className="text-gold-600">{state.score}</strong> points!
                </p>

                {/* Mini stats */}
                <div className="bg-white rounded-2xl p-4 mb-6 shadow-md">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-sage-600">{state.correctAnswers}</p>
                      <p className="text-xs text-ink-500">Correct</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-coral-600">{state.wrongAnswers}</p>
                      <p className="text-xs text-ink-500">Wrong</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-sky-600">{state.bestStreak}</p>
                      <p className="text-xs text-ink-500">Best Streak</p>
                    </div>
                  </div>
                </div>

                <p className="text-ink-500 text-sm mb-6">
                  Keep going or take a well-deserved break!
                </p>

                <div className="flex gap-4">
                  <Button variant="gold" size="lg" onClick={handleContinueFromCheckpoint} className="flex-1">
                    Keep Going!
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button variant="secondary" size="lg" onClick={handleTakeBreak}>
                    <Coffee className="w-4 h-4 mr-2" />
                    Break
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        );

      case 'ended':
        const totalPatterns = state.patternsCompleted;
        const accuracy = totalPatterns > 0
          ? Math.round((state.correctAnswers / totalPatterns) * 100)
          : 0;
        const checkpointsReached = Math.floor(state.score / CHECKPOINT_INTERVAL);

        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              {/* Celebration */}
              <div className="w-24 h-24 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">
                Great Practice Session!
              </h2>
              <p className="text-ink-600 mb-2">
                You&apos;ve completed <strong>{totalPatterns}</strong> patterns
              </p>
              {checkpointsReached > 0 && (
                <p className="text-gold-600 font-medium mb-6">
                  ⭐ {checkpointsReached} checkpoint{checkpointsReached > 1 ? 's' : ''} reached!
                </p>
              )}

              {/* Stats */}
              <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
                <div className="grid grid-cols-2 gap-4 text-center mb-4">
                  <div>
                    <p className="text-3xl font-bold text-gold-600">{state.score}</p>
                    <p className="text-sm text-ink-500">Total Points</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-sky-600">{state.bestStreak}</p>
                    <p className="text-sm text-ink-500">Best Streak</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t border-ink-100">
                  <div>
                    <p className="text-2xl font-bold text-sage-600">{state.correctAnswers}</p>
                    <p className="text-xs text-ink-500">Correct</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-coral-600">{state.wrongAnswers}</p>
                    <p className="text-xs text-ink-500">Wrong</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-ink-600">{accuracy}%</p>
                    <p className="text-xs text-ink-500">Accuracy</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button variant="gold" size="lg" onClick={handleRestart} className="flex-1">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Play Again
                </Button>
                <Button variant="secondary" size="lg" onClick={handleExit}>
                  Exit
                </Button>
              </div>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <GameLayout
      title="Pattern Puzzles"
      subtitle="Find the pattern"
      players={[{ id: 'solo', display_name: 'You', avatar_color: '#0EA5E9', score: state.score, is_ready: true, is_connected: true }]}
      currentRound={state.patternsCompleted + 1}
      totalRounds={0} // Endless mode
      showTimer={false}
      showRound={state.phase === 'playing' || state.phase === 'revealing'}
      onBack={handleExit}
    >
      {renderContent()}
    </GameLayout>
  );
}
