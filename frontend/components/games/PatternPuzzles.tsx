'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Puzzle, ArrowRight, Check, X, Lightbulb, Trophy, RotateCcw } from 'lucide-react';
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
  difficulty: 'easy' | 'medium' | 'hard';
}

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
    difficulty: 'easy',
  },
  {
    id: 'num-2',
    type: 'number',
    sequence: ['1', '2', '4', '8', '?'],
    options: ['10', '12', '16', '14'],
    correctIndex: 2,
    hint: 'Each number is multiplied by the same value',
    difficulty: 'easy',
  },
  {
    id: 'num-3',
    type: 'number',
    sequence: ['5', '10', '15', '20', '?'],
    options: ['22', '25', '30', '24'],
    correctIndex: 1,
    hint: 'Count by fives',
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
    difficulty: 'medium',
  },
  {
    id: 'num-5',
    type: 'number',
    sequence: ['1', '4', '9', '16', '?'],
    options: ['20', '25', '24', '36'],
    correctIndex: 1,
    hint: 'Think about multiplication with the same number',
    difficulty: 'medium',
  },
  {
    id: 'num-6',
    type: 'number',
    sequence: ['3', '6', '12', '24', '?'],
    options: ['36', '48', '30', '42'],
    correctIndex: 1,
    hint: 'Each number is doubled',
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
    difficulty: 'easy',
  },
  {
    id: 'let-2',
    type: 'letter',
    sequence: ['Z', 'Y', 'X', 'W', '?'],
    options: ['U', 'V', 'T', 'S'],
    correctIndex: 1,
    hint: 'The alphabet backwards',
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
    difficulty: 'easy',
  },
  {
    id: 'shape-2',
    type: 'shape',
    sequence: ['⭐', '⭐', '🌙', '⭐', '⭐', '?'],
    options: ['⭐', '🌙', '☀️', '🌟'],
    correctIndex: 1,
    hint: 'Every third item is different',
    difficulty: 'medium',
  },
  {
    id: 'shape-3',
    type: 'shape',
    sequence: ['🔺', '🔻', '🔺', '🔻', '🔺', '?'],
    options: ['🔺', '🔻', '⬛', '⬜'],
    correctIndex: 1,
    hint: 'Up, down, up, down...',
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
    difficulty: 'hard',
  },
  {
    id: 'num-8',
    type: 'number',
    sequence: ['1', '3', '6', '10', '15', '?'],
    options: ['18', '20', '21', '25'],
    correctIndex: 2,
    hint: 'Triangular numbers: add 2, then 3, then 4...',
    difficulty: 'hard',
  },
];

/**
 * PatternPuzzles - Pattern recognition game
 * Identify the pattern and select the next item in the sequence
 */
export function PatternPuzzles({ sessionId, isHost = false, onExit }: PatternPuzzlesProps) {
  const [state, setState] = useState({
    phase: 'waiting' as 'waiting' | 'playing' | 'revealing' | 'ended',
    patterns: [] as Pattern[],
    currentIndex: 0,
    selectedAnswer: null as number | null,
    isCorrect: false,
    score: 0,
    streak: 0,
    bestStreak: 0,
    showHint: false,
    timePerPattern: 20,
    timeLeft: 20,
  });

  // Timer for each pattern
  useEffect(() => {
    if (state.phase === 'playing' && state.timeLeft > 0) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (state.phase === 'playing' && state.timeLeft === 0) {
      // Time's up - mark as wrong
      handleAnswer(-1);
    }
  }, [state.phase, state.timeLeft]);

  const handleStart = () => {
    // Shuffle patterns and pick 10
    const shuffled = [...PATTERNS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);

    setState((prev) => ({
      ...prev,
      phase: 'playing',
      patterns: selected,
      currentIndex: 0,
      selectedAnswer: null,
      score: 0,
      streak: 0,
      bestStreak: 0,
      showHint: false,
      timeLeft: prev.timePerPattern,
    }));
  };

  const handleAnswer = (answerIndex: number) => {
    const currentPattern = state.patterns[state.currentIndex];
    const isCorrect = answerIndex === currentPattern.correctIndex;

    // Calculate points: base points + time bonus + streak bonus
    const basePoints = isCorrect ? 10 : 0;
    const timeBonus = isCorrect ? Math.floor(state.timeLeft / 2) : 0;
    const streakBonus = isCorrect && state.streak >= 2 ? state.streak * 2 : 0;
    const hintPenalty = state.showHint && isCorrect ? -3 : 0;
    const totalPoints = basePoints + timeBonus + streakBonus + hintPenalty;

    const newStreak = isCorrect ? state.streak + 1 : 0;
    const newBestStreak = Math.max(state.bestStreak, newStreak);

    setState((prev) => ({
      ...prev,
      phase: 'revealing',
      selectedAnswer: answerIndex,
      isCorrect,
      score: prev.score + totalPoints,
      streak: newStreak,
      bestStreak: newBestStreak,
    }));
  };

  const handleNext = () => {
    const isLastPattern = state.currentIndex >= state.patterns.length - 1;

    if (isLastPattern) {
      setState((prev) => ({ ...prev, phase: 'ended' }));
    } else {
      setState((prev) => ({
        ...prev,
        phase: 'playing',
        currentIndex: prev.currentIndex + 1,
        selectedAnswer: null,
        showHint: false,
        timeLeft: prev.timePerPattern,
      }));
    }
  };

  const handleShowHint = () => {
    setState((prev) => ({ ...prev, showHint: true }));
  };

  const handleRestart = () => {
    setState((prev) => ({
      ...prev,
      phase: 'waiting',
      patterns: [],
      currentIndex: 0,
      selectedAnswer: null,
      score: 0,
      streak: 0,
      bestStreak: 0,
      showHint: false,
    }));
  };

  const handleExit = () => {
    onExit?.();
  };

  const currentPattern = state.patterns[state.currentIndex];
  const progressPercent = state.patterns.length > 0
    ? ((state.currentIndex + 1) / state.patterns.length) * 100
    : 0;

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
                  <span>Pattern {state.currentIndex + 1} of {state.patterns.length}</span>
                  <div className="flex gap-4">
                    <span>Score: <strong className="text-gold-600">{state.score}</strong></span>
                    {state.streak > 1 && (
                      <span className="text-coral-600">🔥 {state.streak} streak</span>
                    )}
                  </div>
                </div>
                <Progress value={state.currentIndex + 1} max={state.patterns.length} variant="sage" />
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
                      <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${state.timeLeft < 5 ? 'bg-coral-500' : 'bg-sky-500'}`}
                          initial={{ width: '100%' }}
                          animate={{ width: `${(state.timeLeft / state.timePerPattern) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
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
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4">
                {state.phase === 'playing' && !state.showHint && (
                  <Button variant="ghost" onClick={handleShowHint}>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Hint (-3 pts)
                  </Button>
                )}
                {state.phase === 'revealing' && (
                  <Button variant="gold" size="lg" onClick={handleNext} className="flex-1">
                    {state.currentIndex >= state.patterns.length - 1 ? 'See Results' : 'Next Pattern'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );

      case 'ended':
        const correctCount = Math.floor(state.score / 10); // Rough estimate
        const accuracy = state.patterns.length > 0
          ? Math.round((correctCount / state.patterns.length) * 100)
          : 0;

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
                Puzzles Complete!
              </h2>
              <p className="text-ink-600 mb-8">
                Great pattern recognition skills!
              </p>

              {/* Stats */}
              <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-gold-600">{state.score}</p>
                    <p className="text-sm text-ink-500">Total Points</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-sky-600">{state.bestStreak}</p>
                    <p className="text-sm text-ink-500">Best Streak</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-sage-600">{state.patterns.length}</p>
                    <p className="text-sm text-ink-500">Patterns</p>
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
      currentRound={state.currentIndex + 1}
      totalRounds={state.patterns.length || 10}
      showTimer={false}
      showRound={state.phase === 'playing' || state.phase === 'revealing'}
      onBack={handleExit}
    >
      {renderContent()}
    </GameLayout>
  );
}
