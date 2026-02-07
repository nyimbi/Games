'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, RotateCcw, Check, X, ArrowRight, Star, Trophy, CalendarClock } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout, WaitingRoom, GameOver } from './GameLayout';
import { type Question, type FlashcardProgress } from '@/lib/games/types';
import { gamesApi } from '@/lib/api/client';
import { getStorage, setStorage, STORAGE_KEYS } from '@/lib/storage';
import { useSounds } from '@/lib/hooks/useSounds';

interface FlashcardFrenzyProps {
  sessionId?: string;
  isHost?: boolean;
  onExit?: () => void;
  questions?: Question[];
  subject?: string;
  difficulty?: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
}

// SM-2 spaced repetition algorithm
function calculateNextReview(progress: FlashcardProgress, quality: number): FlashcardProgress {
  let { easeFactor, interval, repetitions } = progress;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...progress,
    easeFactor,
    interval,
    repetitions,
    nextReview: nextReview.toISOString(),
  };
}

function getProgressMap(): Record<string, FlashcardProgress> {
  return getStorage<Record<string, FlashcardProgress>>(STORAGE_KEYS.FLASHCARD_PROGRESS, {});
}

function saveProgressMap(map: Record<string, FlashcardProgress>): void {
  setStorage(STORAGE_KEYS.FLASHCARD_PROGRESS, map);
}

function isDueForReview(progress: FlashcardProgress | undefined): boolean {
  if (!progress) return true; // new card
  return new Date(progress.nextReview) <= new Date();
}

function getDifficultyColor(easeFactor: number): string {
  if (easeFactor >= 2.3) return 'bg-sage-500';
  if (easeFactor >= 1.8) return 'bg-gold-500';
  return 'bg-coral-500';
}

/**
 * FlashcardFrenzy - Speed flashcard practice
 * Flip cards and mark them as known or need practice
 */
export function FlashcardFrenzy({
  sessionId,
  isHost = false,
  onExit,
  questions: initialQuestions,
  subject = 'mixed',
  difficulty = 'medium',
}: FlashcardFrenzyProps) {
  const sounds = useSounds();
  const [progressMap, setProgressMap] = useState<Record<string, FlashcardProgress>>({});
  const [dueCount, setDueCount] = useState(0);

  const [state, setState] = useState({
    phase: 'loading' as 'loading' | 'waiting' | 'playing' | 'ended',
    cards: [] as Flashcard[],
    currentIndex: 0,
    isFlipped: false,
    knownCards: [] as string[],
    practiceCards: [] as string[],
    startTime: 0,
    endTime: 0,
  });

  // Load flashcard progress from localStorage on mount
  useEffect(() => {
    const saved = getProgressMap();
    setProgressMap(saved);
  }, []);

  // Load questions and convert to flashcards
  useEffect(() => {
    loadCards();
  }, [subject, difficulty]);

  const loadCards = async () => {
    setState((prev) => ({ ...prev, phase: 'loading' }));

    try {
      let questions: Question[];

      if (initialQuestions) {
        questions = initialQuestions;
      } else {
        const response = subject === 'mixed'
          ? await gamesApi.getMixedQuestions({ difficulty, count: 20 })
          : await gamesApi.getQuestions({ subject, difficulty, count: 20 });
        questions = response.questions;
      }

      // Convert questions to flashcards (question = front, answer = back)
      const cards: Flashcard[] = questions.map((q) => ({
        id: q.id,
        front: q.text,
        back: q.options[q.correct_index],
        subject: q.subject,
      }));

      // Sort: cards due for review first, then new cards, then future reviews
      const saved = getProgressMap();
      const sorted = [...cards].sort((a, b) => {
        const pa = saved[a.id];
        const pb = saved[b.id];
        const aDue = isDueForReview(pa);
        const bDue = isDueForReview(pb);
        if (aDue && !bDue) return -1;
        if (!aDue && bDue) return 1;
        if (!pa && pb) return -1; // new cards before reviewed future cards
        if (pa && !pb) return 1;
        return 0;
      });

      const due = sorted.filter((c) => isDueForReview(saved[c.id]));
      setDueCount(due.length);

      setState((prev) => ({ ...prev, cards: sorted, phase: 'waiting' }));
    } catch (err) {
      console.error('Failed to load flashcards:', err);
      setState((prev) => ({
        ...prev,
        cards: FALLBACK_CARDS,
        phase: 'waiting',
      }));
    }
  };

  const handleStart = () => {
    setState((prev) => ({
      ...prev,
      phase: 'playing',
      startTime: Date.now(),
      currentIndex: 0,
      isFlipped: false,
      knownCards: [],
      practiceCards: [],
    }));
  };

  const handleFlip = () => {
    sounds.play('flip');
    setState((prev) => ({ ...prev, isFlipped: !prev.isFlipped }));
  };

  const updateCardProgress = useCallback((cardId: string, quality: number) => {
    setProgressMap((prev) => {
      const existing = prev[cardId] || {
        questionId: cardId,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: new Date().toISOString(),
      };
      const updated = calculateNextReview(existing, quality);
      const newMap = { ...prev, [cardId]: updated };
      saveProgressMap(newMap);
      return newMap;
    });
  }, []);

  const handleKnown = () => {
    const currentCard = state.cards[state.currentIndex];
    sounds.play('correct');
    updateCardProgress(currentCard.id, 5);

    setState((prev) => {
      const newKnown = [...prev.knownCards, currentCard.id];
      const isLastCard = prev.currentIndex >= prev.cards.length - 1;

      if (isLastCard) {
        return {
          ...prev,
          knownCards: newKnown,
          phase: 'ended',
          endTime: Date.now(),
        };
      }

      return {
        ...prev,
        knownCards: newKnown,
        currentIndex: prev.currentIndex + 1,
        isFlipped: false,
      };
    });
  };

  const handlePractice = () => {
    const currentCard = state.cards[state.currentIndex];
    updateCardProgress(currentCard.id, 1);

    setState((prev) => {
      const newPractice = [...prev.practiceCards, currentCard.id];
      const isLastCard = prev.currentIndex >= prev.cards.length - 1;

      if (isLastCard) {
        return {
          ...prev,
          practiceCards: newPractice,
          phase: 'ended',
          endTime: Date.now(),
        };
      }

      return {
        ...prev,
        practiceCards: newPractice,
        currentIndex: prev.currentIndex + 1,
        isFlipped: false,
      };
    });
  };

  const handleRestart = () => {
    setState((prev) => ({
      ...prev,
      phase: 'waiting',
      currentIndex: 0,
      isFlipped: false,
      knownCards: [],
      practiceCards: [],
    }));
  };

  const handleExit = () => {
    onExit?.();
  };

  const currentCard = state.cards[state.currentIndex];
  const progressPercent = state.cards.length > 0
    ? ((state.currentIndex + 1) / state.cards.length) * 100
    : 0;
  const timeTaken = state.endTime ? Math.round((state.endTime - state.startTime) / 1000) : 0;
  const accuracy = state.cards.length > 0
    ? Math.round((state.knownCards.length / state.cards.length) * 100)
    : 0;

  const renderContent = () => {
    switch (state.phase) {
      case 'loading':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-ink-200 border-t-gold-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-ink-600">Loading flashcards...</p>
            </div>
          </div>
        );

      case 'waiting':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              <div className="w-20 h-20 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-gold-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
                Flashcard Frenzy
              </h2>
              <p className="text-ink-600 mb-4">
                {state.cards.length} cards ready to review
              </p>

              {dueCount > 0 && (
                <div className="flex items-center justify-center gap-2 mb-4 text-coral-700 bg-coral-50 rounded-xl py-2 px-4">
                  <CalendarClock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {dueCount} card{dueCount !== 1 ? 's' : ''} due for review today
                  </span>
                </div>
              )}

              <p className="text-ink-500 text-sm mb-8">
                Tap to flip each card. Mark cards as &quot;Got it&quot; or &quot;Practice&quot; to track your progress.
              </p>
              <Button variant="gold" size="lg" onClick={handleStart}>
                Start Review
              </Button>
            </motion.div>
          </div>
        );

      case 'playing':
        return (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-xl mx-auto w-full flex-1 flex flex-col">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-ink-500 mb-2">
                  <span>Card {state.currentIndex + 1} of {state.cards.length}</span>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-sage-600" />
                      {state.knownCards.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <RotateCcw className="w-4 h-4 text-coral-600" />
                      {state.practiceCards.length}
                    </span>
                  </div>
                </div>
                <Progress value={state.currentIndex + 1} max={state.cards.length} variant="gold" />
              </div>

              {/* Flashcard */}
              <div className="flex-1 flex items-center justify-center">
                <motion.div
                  className="w-full perspective-1000"
                  style={{ perspective: 1000 }}
                >
                  <motion.button
                    onClick={handleFlip}
                    className="w-full aspect-[4/3] relative"
                    animate={{ rotateY: state.isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Front */}
                    <div
                      className="absolute inset-0 bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center backface-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline">
                          {currentCard?.subject?.replace('_', ' ').toUpperCase() || 'MIXED'}
                        </Badge>
                        {currentCard && (
                          <span
                            className={`w-3 h-3 rounded-full ${getDifficultyColor(
                              progressMap[currentCard.id]?.easeFactor ?? 2.5
                            )}`}
                            title={`Ease: ${(progressMap[currentCard.id]?.easeFactor ?? 2.5).toFixed(1)}`}
                          />
                        )}
                      </div>
                      <p className="font-display text-xl md:text-2xl text-ink-800 text-center leading-relaxed">
                        {currentCard?.front}
                      </p>
                      <p className="text-ink-400 text-sm mt-6">Tap to reveal answer</p>
                    </div>

                    {/* Back */}
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <Star className="w-8 h-8 text-gold-200 mb-4" />
                      <p className="font-display text-xl md:text-2xl text-white text-center leading-relaxed font-semibold">
                        {currentCard?.back}
                      </p>
                    </div>
                  </motion.button>
                </motion.div>
              </div>

              {/* Actions */}
              <AnimatePresence>
                {state.isFlipped && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex gap-4 mt-6"
                  >
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handlePractice}
                      className="flex-1 bg-coral-100 hover:bg-coral-200 text-coral-700 border-coral-200"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Practice More
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleKnown}
                      className="flex-1 bg-sage-600 hover:bg-sage-700"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Got It!
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );

      case 'ended':
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
                Review Complete!
              </h2>
              <p className="text-ink-600 mb-8">
                You reviewed all {state.cards.length} cards
              </p>

              {/* Stats */}
              <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-sage-600">{state.knownCards.length}</p>
                    <p className="text-sm text-ink-500">Knew It</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-coral-600">{state.practiceCards.length}</p>
                    <p className="text-sm text-ink-500">Need Practice</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gold-600">{accuracy}%</p>
                    <p className="text-sm text-ink-500">Accuracy</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-ink-100">
                  <p className="text-ink-500 text-sm">
                    Completed in <span className="font-semibold text-ink-700">{timeTaken} seconds</span>
                  </p>
                </div>
              </div>

              {/* Points Earned */}
              <div className="bg-gold-100 rounded-xl p-4 mb-8">
                <p className="text-gold-800">
                  <span className="font-bold text-2xl">{state.knownCards.length * 10}</span>
                  <span className="text-sm ml-2">points earned</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                {state.practiceCards.length > 0 && (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => {
                      // Review only practice cards
                      const practiceOnly = state.cards.filter((c) => state.practiceCards.includes(c.id));
                      setState((prev) => ({
                        ...prev,
                        cards: practiceOnly,
                        phase: 'waiting',
                        currentIndex: 0,
                        isFlipped: false,
                        knownCards: [],
                        practiceCards: [],
                      }));
                    }}
                    className="flex-1"
                  >
                    Review Missed
                  </Button>
                )}
                <Button variant="gold" size="lg" onClick={handleRestart} className="flex-1">
                  Start Over
                </Button>
                <Button variant="ghost" size="lg" onClick={handleExit}>
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
      title="Flashcard Frenzy"
      subtitle="Speed review practice"
      players={[{ id: 'solo', display_name: 'You', avatar_color: '#F59E0B', score: state.knownCards.length * 10, is_ready: true, is_connected: true }]}
      currentRound={state.currentIndex + 1}
      totalRounds={state.cards.length}
      showTimer={false}
      showRound={state.phase === 'playing'}
      onBack={handleExit}
    >
      {renderContent()}
    </GameLayout>
  );
}

// Fallback flashcards
const FALLBACK_CARDS: Flashcard[] = [
  { id: 'f1', front: 'What is the chemical symbol for gold?', back: 'Au', subject: 'science' },
  { id: 'f2', front: 'Who wrote "1984"?', back: 'George Orwell', subject: 'literature' },
  { id: 'f3', front: 'What is the capital of Japan?', back: 'Tokyo', subject: 'social_studies' },
  { id: 'f4', front: 'Who painted the Sistine Chapel ceiling?', back: 'Michelangelo', subject: 'arts' },
  { id: 'f5', front: 'What is the largest planet in our solar system?', back: 'Jupiter', subject: 'science' },
];
