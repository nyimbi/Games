'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Check, BookOpen, Filter, Clock, AlertCircle, Inbox, Sparkles } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { useSounds } from '@/lib/hooks/useSounds';
import {
  getWrongAnswers,
  getDueForReview,
  markAsLearned,
  markAsReviewed,
  getWrongAnswerCount,
  getSubjectBreakdown,
} from '@/lib/games/wrongAnswerJournal';
import type { WrongAnswerEntry, Question } from '@/lib/games/types';
import { AIExplanation } from './AIExplanation';

interface WrongAnswerJournalProps {
  onExit?: () => void;
}

type SortMode = 'recent' | 'most_missed' | 'due_for_review';
type ViewMode = 'list' | 'flashcard';

const SUBJECT_LABELS: Record<string, string> = {
  science: 'Science',
  social_studies: 'Social Studies',
  arts: 'Arts & Culture',
  literature: 'Literature',
  special_area: 'Special Area',
};

/** Convert a WrongAnswerEntry to a minimal Question for AIExplanation. */
function entryToQuestion(entry: WrongAnswerEntry): Question {
  return {
    id: entry.questionId,
    subject: entry.subject,
    difficulty: 'medium',
    text: entry.question,
    options: [entry.userAnswer, entry.correctAnswer],
    correct_index: 1,
    explanation: entry.explanation,
    time_limit_seconds: 30,
    deep_explanation: entry.deep_explanation,
  };
}

export function WrongAnswerJournal({ onExit }: WrongAnswerJournalProps) {
  const { play } = useSounds();

  const [entries, setEntries] = useState<WrongAnswerEntry[]>([]);
  const [dueEntries, setDueEntries] = useState<WrongAnswerEntry[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [subjectBreakdown, setSubjectBreakdown] = useState<Record<string, number>>({});

  const loadEntries = () => {
    const subject = subjectFilter === 'all' ? undefined : subjectFilter;
    setEntries(getWrongAnswers(subject));
    setDueEntries(getDueForReview());
    setSubjectBreakdown(getSubjectBreakdown());
  };

  useEffect(() => {
    loadEntries();
  }, [subjectFilter]);

  const sortedEntries = useMemo(() => {
    const sorted = [...entries];
    switch (sortMode) {
      case 'recent':
        return sorted.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      case 'most_missed':
        return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
      case 'due_for_review': {
        const now = new Date().toISOString();
        const due = sorted.filter((e) => e.nextReview <= now);
        const notDue = sorted.filter((e) => e.nextReview > now);
        return [...due.sort((a, b) => a.nextReview.localeCompare(b.nextReview)), ...notDue];
      }
      default:
        return sorted;
    }
  }, [entries, sortMode]);

  const flashcardEntries = sortMode === 'due_for_review'
    ? sortedEntries.filter((e) => e.nextReview <= new Date().toISOString())
    : sortedEntries;

  const currentFlashcard = flashcardEntries[flashcardIndex];
  const totalCount = getWrongAnswerCount();
  const dueCount = dueEntries.length;

  const handleMarkLearned = (questionId: string) => {
    markAsLearned(questionId);
    play('correct');
    loadEntries();
    // Adjust flashcard index if needed
    if (flashcardIndex >= flashcardEntries.length - 1 && flashcardIndex > 0) {
      setFlashcardIndex((i) => i - 1);
    }
  };

  const handleReviewAgain = (questionId: string) => {
    markAsReviewed(questionId);
    play('flip');
    loadEntries();
    // Move to next card
    if (flashcardIndex < flashcardEntries.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setFlashcardIndex((i) => i + 1), 200);
    } else {
      setIsFlipped(false);
      setFlashcardIndex(0);
    }
  };

  const handleFlip = () => {
    play('flip');
    setIsFlipped((f) => !f);
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((i) =>
        i < flashcardEntries.length - 1 ? i + 1 : 0
      );
    }, 150);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((i) => (i > 0 ? i - 1 : flashcardEntries.length - 1));
    }, 150);
  };

  const subjects = Object.keys(subjectBreakdown);

  const displayPlayers = [
    {
      id: 'reviewer',
      display_name: 'You',
      avatar_color: '#8B5CF6',
      score: totalCount,
      is_ready: true,
      is_connected: true,
    },
  ];

  const renderEmpty = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Inbox className="w-10 h-10 text-sage-600" />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
          No Wrong Answers Yet!
        </h2>
        <p className="text-ink-600 mb-6">
          Keep playing to build your review journal. Wrong answers from any game will appear here for you to study.
        </p>
        <Button variant="secondary" size="lg" onClick={onExit}>
          Back to Games
        </Button>
      </motion.div>
    </div>
  );

  const renderContent = () => {
    if (totalCount === 0 && entries.length === 0) {
      return renderEmpty();
    }

    return (
      <div className="flex-1 flex flex-col p-6">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
          {/* Header stats */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex gap-3 text-sm">
                <span className="text-ink-500">
                  <span className="font-semibold text-ink-700">{totalCount}</span> to review
                </span>
                {dueCount > 0 && (
                  <span className="text-coral-600 font-medium">
                    <Clock className="w-3.5 h-3.5 inline mr-0.5" />
                    {dueCount} due now
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'gold' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
              <Button
                variant={viewMode === 'flashcard' ? 'gold' : 'secondary'}
                size="sm"
                onClick={() => {
                  setViewMode('flashcard');
                  setFlashcardIndex(0);
                  setIsFlipped(false);
                }}
              >
                Flashcards
              </Button>
            </div>
          </div>

          {/* Subject filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            <button
              onClick={() => setSubjectFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                subjectFilter === 'all'
                  ? 'bg-ink-800 text-white'
                  : 'text-ink-600 hover:bg-ink-100'
              }`}
            >
              All ({totalCount})
            </button>
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setSubjectFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  subjectFilter === s
                    ? 'bg-ink-800 text-white'
                    : 'text-ink-600 hover:bg-ink-100'
                }`}
              >
                {SUBJECT_LABELS[s] || s} ({subjectBreakdown[s]})
              </button>
            ))}
          </div>

          {/* Sort controls (list view only) */}
          {viewMode === 'list' && (
            <div className="flex gap-2 mb-4">
              <Filter className="w-4 h-4 text-ink-400 mt-1.5" />
              {(['recent', 'most_missed', 'due_for_review'] as SortMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    sortMode === mode
                      ? 'bg-gold-200 text-gold-800'
                      : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
                  }`}
                >
                  {mode === 'recent'
                    ? 'Most Recent'
                    : mode === 'most_missed'
                    ? 'Most Missed'
                    : 'Due for Review'}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          {viewMode === 'list' ? (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {sortedEntries.length === 0 ? (
                <div className="text-center py-8 text-ink-500">
                  No entries match this filter.
                </div>
              ) : (
                sortedEntries.map((entry) => {
                  const isDue = entry.nextReview <= new Date().toISOString();
                  return (
                    <motion.div
                      key={entry.questionId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      layout
                    >
                      <Card className={`bg-white ${isDue ? 'ring-2 ring-coral-200' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" size="sm">
                                  {SUBJECT_LABELS[entry.subject] || entry.subject}
                                </Badge>
                                {isDue && (
                                  <Badge variant="outline" size="sm" className="text-coral-600 border-coral-300">
                                    Due for review
                                  </Badge>
                                )}
                                {entry.reviewCount > 0 && (
                                  <span className="text-xs text-ink-400">
                                    Reviewed {entry.reviewCount}x
                                  </span>
                                )}
                              </div>
                              <p className="font-medium text-ink-800 mb-2">{entry.question}</p>
                              <div className="text-sm space-y-1">
                                <p className="text-coral-600">
                                  Your answer: {entry.userAnswer}
                                </p>
                                <p className="text-sage-600">
                                  Correct answer: {entry.correctAnswer}
                                </p>
                                {entry.explanation && (
                                  <p className="text-ink-500 mt-2">{entry.explanation}</p>
                                )}
                                <AIExplanation
                                  question={entryToQuestion(entry)}
                                  userAnswer={null}
                                  wasCorrect={false}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3 pt-3 border-t border-ink-100">
                            <Button
                              variant="gold"
                              size="sm"
                              onClick={() => handleMarkLearned(entry.questionId)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              I Got It Now
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleReviewAgain(entry.questionId)}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Review Again
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          ) : (
            /* Flashcard view */
            <div className="flex-1 flex flex-col items-center justify-center">
              {flashcardEntries.length === 0 ? (
                <div className="text-center py-8 text-ink-500">
                  No entries to review.
                </div>
              ) : (
                <>
                  <p className="text-sm text-ink-500 mb-4">
                    Card {flashcardIndex + 1} of {flashcardEntries.length}
                  </p>

                  <div className="w-full max-w-md perspective-1000">
                    <motion.div
                      className="relative w-full cursor-pointer"
                      onClick={handleFlip}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <AnimatePresence mode="wait">
                        {!isFlipped ? (
                          <motion.div
                            key="front"
                            initial={{ opacity: 0, rotateY: -90 }}
                            animate={{ opacity: 1, rotateY: 0 }}
                            exit={{ opacity: 0, rotateY: 90 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card className="bg-white min-h-[250px]">
                              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[250px]">
                                <Badge variant="outline" className="mb-4">
                                  {SUBJECT_LABELS[currentFlashcard?.subject || ''] ||
                                    currentFlashcard?.subject}
                                </Badge>
                                <p className="font-display text-xl font-semibold text-ink-800 text-center leading-relaxed">
                                  {currentFlashcard?.question}
                                </p>
                                <p className="text-sm text-ink-400 mt-4">
                                  Tap to reveal answer
                                </p>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="back"
                            initial={{ opacity: 0, rotateY: 90 }}
                            animate={{ opacity: 1, rotateY: 0 }}
                            exit={{ opacity: 0, rotateY: -90 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card className="bg-sage-50 min-h-[250px]">
                              <CardContent className="p-6 flex flex-col justify-center min-h-[250px]">
                                <div className="text-center">
                                  <p className="text-sm text-coral-600 mb-2">
                                    You answered: {currentFlashcard?.userAnswer}
                                  </p>
                                  <p className="font-display text-xl font-bold text-sage-700 mb-4">
                                    {currentFlashcard?.correctAnswer}
                                  </p>
                                  {currentFlashcard?.explanation && (
                                    <p className="text-ink-600 text-sm">
                                      {currentFlashcard.explanation}
                                    </p>
                                  )}
                                  {currentFlashcard?.deep_explanation && (
                                    <p className="text-ink-500 text-sm mt-2 italic">
                                      {currentFlashcard.deep_explanation}
                                    </p>
                                  )}
                                  {currentFlashcard && (
                                    <div className="mt-3">
                                      <AIExplanation
                                        question={entryToQuestion(currentFlashcard)}
                                        userAnswer={null}
                                        wasCorrect={false}
                                      />
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>

                  {/* Flashcard controls */}
                  <div className="flex gap-3 mt-6">
                    <Button variant="secondary" size="sm" onClick={handlePrevCard}>
                      Previous
                    </Button>
                    {isFlipped && currentFlashcard && (
                      <>
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => handleMarkLearned(currentFlashcard.questionId)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          I Got It
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleReviewAgain(currentFlashcard.questionId)}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Review Again
                        </Button>
                      </>
                    )}
                    <Button variant="secondary" size="sm" onClick={handleNextCard}>
                      Next
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <GameLayout
      title="Wrong Answer Journal"
      subtitle={`${totalCount} entries${dueCount > 0 ? ` (${dueCount} due)` : ''}`}
      players={displayPlayers}
      showTimer={false}
      showRound={false}
      onBack={onExit}
    >
      {renderContent()}
    </GameLayout>
  );
}
