'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  X,
  Flag,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Trophy,
  BarChart3,
} from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { useSounds } from '@/lib/hooks/useSounds';
import { allQuestions } from '@/lib/games/questions';
import {
  calculateSCScore,
  formatSCScore,
  type SCQuestion,
  type SCScore,
} from '@/lib/games/scholarsChallengeScoring';
import { recordWrongAnswer } from '@/lib/games/wrongAnswerJournal';
import { updatePlayerStats, checkAchievements } from '@/lib/games/achievements';
import type { Question } from '@/lib/games/types';
import { AIExplanation } from './AIExplanation';

interface ScholarsChallengeProps {
  onExit?: () => void;
}

type Phase = 'intro' | 'playing' | 'review' | 'results';

interface QuestionState {
  answer: number | null;
  flagged: boolean;
  timeSpent: number;
}

const SUBJECTS = ['science', 'social_studies', 'arts', 'literature'] as const;
const SUBJECT_LABELS: Record<string, string> = {
  science: 'Science',
  social_studies: 'Social Studies',
  arts: 'Arts & Culture',
  literature: 'Literature',
};
const SUBJECT_COLORS: Record<string, string> = {
  science: 'bg-sage-500',
  social_studies: 'bg-gold-500',
  arts: 'bg-coral-500',
  literature: 'bg-ink-500',
};
const EXAM_DURATION_SECONDS = 60 * 60; // 60 minutes

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function ScholarsChallenge({ onExit }: ScholarsChallengeProps) {
  const { play } = useSounds();

  // Build exam questions: up to 30 per subject, shuffled
  const [examQuestions] = useState<Question[]>(() => {
    const bySubject: Record<string, Question[]> = {};
    for (const q of allQuestions) {
      const subjectKey = SUBJECTS.includes(q.subject as (typeof SUBJECTS)[number])
        ? q.subject
        : null;
      if (!subjectKey) continue;
      if (!bySubject[subjectKey]) bySubject[subjectKey] = [];
      bySubject[subjectKey].push(q);
    }
    const selected: Question[] = [];
    for (const subject of SUBJECTS) {
      const pool = shuffleArray(bySubject[subject] || []);
      selected.push(...pool.slice(0, 30));
    }
    return selected;
  });

  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [questionStates, setQuestionStates] = useState<Record<number, QuestionState>>({});
  const [timeRemaining, setTimeRemaining] = useState(EXAM_DURATION_SECONDS);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [scScore, setScScore] = useState<SCScore | null>(null);

  const totalQuestions = examQuestions.length;
  const currentQuestion = examQuestions[currentIndex];

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || timeRemaining <= 0) return;
    const timer = setTimeout(() => setTimeRemaining((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, timeRemaining]);

  // Auto-submit when time expires
  useEffect(() => {
    if (phase === 'playing' && timeRemaining <= 0) {
      finishExam();
    }
  }, [phase, timeRemaining]);

  // Track time on each question
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  const getQuestionState = (idx: number): QuestionState =>
    questionStates[idx] || { answer: null, flagged: false, timeSpent: 0 };

  const updateQuestionTime = useCallback(() => {
    const elapsed = Math.round((Date.now() - questionStartTime) / 1000);
    setQuestionStates((prev) => ({
      ...prev,
      [currentIndex]: {
        ...getQuestionState(currentIndex),
        ...prev[currentIndex],
        timeSpent: (prev[currentIndex]?.timeSpent || 0) + elapsed,
      },
    }));
  }, [currentIndex, questionStartTime]);

  const handleSelectAnswer = (answerIndex: number) => {
    if (phase !== 'playing') return;
    const state = getQuestionState(currentIndex);

    // If selecting the same answer, deselect
    if (state.answer === answerIndex) {
      setQuestionStates((prev) => ({
        ...prev,
        [currentIndex]: { ...state, answer: null },
      }));
      return;
    }

    setQuestionStates((prev) => ({
      ...prev,
      [currentIndex]: { ...state, answer: answerIndex },
    }));
  };

  const handleSkip = () => {
    updateQuestionTime();
    setQuestionStates((prev) => ({
      ...prev,
      [currentIndex]: { ...getQuestionState(currentIndex), answer: null },
    }));
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleFlag = () => {
    const state = getQuestionState(currentIndex);
    setQuestionStates((prev) => ({
      ...prev,
      [currentIndex]: { ...state, flagged: !state.flagged },
    }));
  };

  const handleNavigate = (idx: number) => {
    updateQuestionTime();
    setCurrentIndex(idx);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      updateQuestionTime();
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      updateQuestionTime();
      setCurrentIndex((i) => i + 1);
    }
  };

  const finishExam = useCallback(() => {
    updateQuestionTime();
    const scAnswers: SCQuestion[] = examQuestions.map((q, idx) => {
      const state = getQuestionState(idx);
      return {
        questionId: q.id,
        answer: state.answer,
        correct: state.answer === q.correct_index,
        subject: q.subject,
        timeSpent: state.timeSpent,
      };
    });

    const result = calculateSCScore(scAnswers);
    setScScore(result);

    // Record wrong answers
    for (const q of examQuestions) {
      const state = getQuestionState(examQuestions.indexOf(q));
      if (state.answer !== null && state.answer !== q.correct_index) {
        recordWrongAnswer(
          q.id,
          q.text,
          q.subject,
          q.options[state.answer],
          q.options[q.correct_index],
          q.explanation,
          q.deep_explanation
        );
      }
    }

    updatePlayerStats((stats) => ({
      ...stats,
      totalQuestionsAnswered: stats.totalQuestionsAnswered + totalQuestions,
      correctAnswers: stats.correctAnswers + result.questionsAnswered - result.questionsWrong,
      gamesPlayed: stats.gamesPlayed + 1,
    }));
    checkAchievements();

    play('complete');
    setPhase('results');
  }, [examQuestions, questionStates, totalQuestions, play, updateQuestionTime]);

  // Compute live score
  const liveScore = useMemo(() => {
    let total = 0;
    for (let i = 0; i < totalQuestions; i++) {
      const state = getQuestionState(i);
      if (state.answer === null) continue;
      if (state.answer === examQuestions[i].correct_index) {
        total += 1;
      } else {
        total -= 0.5;
      }
    }
    return total;
  }, [questionStates, examQuestions, totalQuestions]);

  // Stats
  const answeredCount = Object.values(questionStates).filter((s) => s.answer !== null).length;
  const flaggedCount = Object.values(questionStates).filter((s) => s.flagged).length;

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getFilteredIndices = (): number[] => {
    if (activeTab === 'all') return examQuestions.map((_, i) => i);
    if (activeTab === 'flagged')
      return examQuestions
        .map((_, i) => i)
        .filter((i) => getQuestionState(i).flagged);
    return examQuestions
      .map((_, i) => i)
      .filter((i) => examQuestions[i].subject === activeTab);
  };

  const getSubjectCount = (subject: string): number =>
    examQuestions.filter((q) => q.subject === subject).length;

  const displayPlayers = [
    {
      id: 'scholar',
      display_name: 'You',
      avatar_color: '#EF4444',
      score: Math.round(liveScore * 10) / 10,
      is_ready: true,
      is_connected: true,
    },
  ];

  const renderContent = () => {
    switch (phase) {
      case 'intro':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              <div className="w-20 h-20 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-coral-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
                Scholar&apos;s Challenge
              </h2>
              <p className="text-ink-600 mb-6">
                Full WSC-style exam simulation across all subjects.
              </p>

              <div className="bg-white rounded-2xl p-5 mb-6 shadow-md text-left">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-500">Questions</span>
                    <span className="font-semibold text-ink-800">{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-500">Time Limit</span>
                    <span className="font-semibold text-ink-800">60 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-500">Scoring</span>
                    <span className="font-semibold text-ink-800">
                      +1 correct, 0 skip, -0.5 wrong
                    </span>
                  </div>
                  <div className="border-t border-ink-100 pt-3">
                    <p className="text-ink-500 mb-2">Questions per subject:</p>
                    {SUBJECTS.map((s) => (
                      <div key={s} className="flex justify-between">
                        <span className="text-ink-600">{SUBJECT_LABELS[s]}</span>
                        <span className="font-medium text-ink-700">{getSubjectCount(s)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gold-50 border border-gold-200 rounded-xl p-3 mb-6 text-sm text-gold-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Wrong answers lose 0.5 points. Skip if unsure!</span>
                </div>
              </div>

              <Button variant="gold" size="lg" onClick={() => setPhase('playing')} className="w-full">
                Begin Exam
              </Button>
            </motion.div>
          </div>
        );

      case 'playing':
        if (!currentQuestion) return null;
        const currentState = getQuestionState(currentIndex);
        const filteredIndices = getFilteredIndices();
        return (
          <div className="flex-1 flex flex-col">
            {/* Subject tabs + timer bar */}
            <div className="bg-white border-b border-ink-200 px-4 py-2">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === 'all'
                        ? 'bg-ink-800 text-white'
                        : 'text-ink-600 hover:bg-ink-100'
                    }`}
                  >
                    All ({totalQuestions})
                  </button>
                  {SUBJECTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setActiveTab(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        activeTab === s
                          ? 'bg-ink-800 text-white'
                          : 'text-ink-600 hover:bg-ink-100'
                      }`}
                    >
                      {SUBJECT_LABELS[s]} ({getSubjectCount(s)})
                    </button>
                  ))}
                  <button
                    onClick={() => setActiveTab('flagged')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === 'flagged'
                        ? 'bg-gold-500 text-white'
                        : 'text-ink-600 hover:bg-ink-100'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5 inline mr-1" />
                    {flaggedCount}
                  </button>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className={`text-sm font-mono font-medium ${timeRemaining <= 300 ? 'text-coral-600' : 'text-ink-700'}`}>
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-sm text-ink-500">
                    Score: <span className="font-semibold text-ink-700">{formatSCScore(liveScore)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row">
              {/* Question navigator grid */}
              <div className="lg:w-64 bg-cream-50 border-b lg:border-b-0 lg:border-r border-ink-200 p-3 overflow-y-auto max-h-32 lg:max-h-none">
                <div className="grid grid-cols-10 lg:grid-cols-5 gap-1.5">
                  {filteredIndices.map((idx) => {
                    const state = getQuestionState(idx);
                    const isCurrent = idx === currentIndex;
                    let bg = 'bg-ink-100 text-ink-500'; // unanswered
                    if (state.answer !== null) bg = 'bg-sage-400 text-white'; // answered
                    if (state.flagged) bg = 'bg-gold-400 text-white'; // flagged
                    if (isCurrent) bg = 'bg-gold-500 text-white ring-2 ring-gold-300'; // current

                    return (
                      <button
                        key={idx}
                        onClick={() => handleNavigate(idx)}
                        className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${bg}`}
                        title={`Question ${idx + 1}${state.flagged ? ' (flagged)' : ''}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 text-xs text-ink-500 space-y-1">
                  <p>{answeredCount}/{totalQuestions} answered</p>
                  <p>{flaggedCount} flagged</p>
                </div>
              </div>

              {/* Question content */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                  {/* Question header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{SUBJECT_LABELS[currentQuestion.subject] || currentQuestion.subject}</Badge>
                      <span className="text-sm text-ink-500">
                        Q{currentIndex + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleFlag}
                        className={`p-2 rounded-lg transition-colors ${
                          currentState.flagged
                            ? 'bg-gold-100 text-gold-600'
                            : 'text-ink-400 hover:bg-ink-100'
                        }`}
                        title="Flag for review"
                      >
                        <Flag className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Question text */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQuestion.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <h2 className="font-display text-xl font-semibold text-ink-800 leading-relaxed mb-6">
                        {currentQuestion.text}
                      </h2>

                      {/* Options */}
                      <div className="space-y-3 mb-6">
                        {currentQuestion.options.map((option, index) => {
                          const isSelected = currentState.answer === index;
                          return (
                            <button
                              key={index}
                              onClick={() => handleSelectAnswer(index)}
                              className={`w-full p-4 rounded-xl text-left transition-all ${
                                isSelected
                                  ? 'bg-gold-100 border-2 border-gold-500'
                                  : 'bg-cream-100 border-2 border-transparent hover:border-gold-300 active:scale-[0.98]'
                              } cursor-pointer`}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                                    isSelected
                                      ? 'bg-gold-500 text-white'
                                      : 'bg-ink-200 text-ink-600'
                                  }`}
                                >
                                  {String.fromCharCode(65 + index)}
                                </span>
                                <span
                                  className={`flex-1 font-medium text-lg ${
                                    isSelected ? 'text-gold-800' : 'text-ink-800'
                                  }`}
                                >
                                  {option}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Confidence warning */}
                      {currentState.answer !== null && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-gold-50 border border-gold-200 rounded-xl p-3 mb-4 text-sm text-gold-800"
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span>
                              Wrong answers lose 0.5 points. Click your answer again to deselect and skip instead.
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {/* Navigation */}
                      <div className="flex items-center justify-between gap-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handlePrev}
                          disabled={currentIndex === 0}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Previous
                        </Button>

                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={handleSkip}>
                            <SkipForward className="w-4 h-4 mr-1" />
                            Skip
                          </Button>
                          {!showConfirmation ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setShowConfirmation(true)}
                            >
                              Finish Exam
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                variant="gold"
                                size="sm"
                                onClick={() => finishExam()}
                              >
                                Confirm Submit
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowConfirmation(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleNext}
                          disabled={currentIndex === totalQuestions - 1}
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        );

      case 'results':
        if (!scScore) return null;
        const maxPossible = totalQuestions;
        const timeUsed = EXAM_DURATION_SECONDS - timeRemaining;
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <div className="w-24 h-24 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <BarChart3 className="w-12 h-12 text-white" />
                </div>
                <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">
                  Exam Results
                </h2>
                <p className="text-4xl font-bold text-gold-600 mb-1">
                  {formatSCScore(scScore.total)} / {maxPossible}
                </p>
                <p className="text-ink-500">Time used: {formatTime(timeUsed)}</p>
              </motion.div>

              {/* Overall stats */}
              <Card className="bg-white mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold text-sage-600">
                        {scScore.questionsAnswered - scScore.questionsWrong}
                      </p>
                      <p className="text-sm text-ink-500">Correct</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-coral-600">{scScore.questionsWrong}</p>
                      <p className="text-sm text-ink-500">Wrong (-{formatSCScore(scScore.questionsWrong * 0.5)})</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-ink-400">{scScore.questionsSkipped}</p>
                      <p className="text-sm text-ink-500">Skipped</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Score by subject */}
              <Card className="bg-white mb-6">
                <CardContent className="p-6">
                  <h3 className="font-display text-lg font-semibold text-ink-800 mb-4">
                    Score by Subject
                  </h3>
                  <div className="space-y-4">
                    {SUBJECTS.map((subject) => {
                      const subScore = scScore.bySubject[subject];
                      if (!subScore) return null;
                      const subTotal = subScore.correct + subScore.wrong + subScore.skipped;
                      const barWidth =
                        subTotal > 0 ? Math.max(0, (subScore.score / subTotal) * 100) : 0;
                      return (
                        <div key={subject}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-ink-700">
                              {SUBJECT_LABELS[subject]}
                            </span>
                            <span className="text-ink-500">
                              {formatSCScore(subScore.score)} / {subTotal}
                            </span>
                          </div>
                          <div className="h-6 bg-ink-100 rounded-full overflow-hidden flex">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(0, barWidth)}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className={`${SUBJECT_COLORS[subject]} rounded-full`}
                            />
                          </div>
                          <div className="flex gap-3 text-xs text-ink-500 mt-1">
                            <span className="text-sage-600">{subScore.correct} correct</span>
                            <span className="text-coral-600">{subScore.wrong} wrong</span>
                            <span>{subScore.skipped} skipped</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Time by subject */}
              <Card className="bg-white mb-8">
                <CardContent className="p-6">
                  <h3 className="font-display text-lg font-semibold text-ink-800 mb-4">
                    Time per Subject
                  </h3>
                  <div className="space-y-3">
                    {SUBJECTS.map((subject) => {
                      const subjectIndices = examQuestions
                        .map((q, i) => (q.subject === subject ? i : -1))
                        .filter((i) => i >= 0);
                      const totalTime = subjectIndices.reduce(
                        (sum, i) => sum + (questionStates[i]?.timeSpent || 0),
                        0
                      );
                      return (
                        <div key={subject} className="flex justify-between text-sm">
                          <span className="text-ink-600">{SUBJECT_LABELS[subject]}</span>
                          <span className="font-medium text-ink-700">{formatTime(totalTime)}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Review wrong answers with AI */}
              <Card className="bg-white mb-8">
                <CardContent className="p-6">
                  <h3 className="font-display text-lg font-semibold text-ink-800 mb-4">
                    Review Wrong Answers
                  </h3>
                  <div className="space-y-4">
                    {examQuestions.map((q, idx) => {
                      const state = getQuestionState(idx);
                      if (state.answer === null || state.answer === q.correct_index) return null;
                      return (
                        <div key={q.id} className="p-4 bg-coral-50 rounded-xl border border-coral-200">
                          <p className="font-medium text-ink-800 text-sm mb-2">{q.text}</p>
                          <div className="text-sm space-y-1 mb-2">
                            <p className="text-coral-600">Your answer: {q.options[state.answer]}</p>
                            <p className="text-sage-600">Correct: {q.options[q.correct_index]}</p>
                            {q.explanation && (
                              <p className="text-ink-500">{q.explanation}</p>
                            )}
                          </div>
                          <AIExplanation question={q} userAnswer={state.answer} wasCorrect={false} />
                        </div>
                      );
                    })}
                    {scScore.questionsWrong === 0 && (
                      <p className="text-sage-600 text-center py-4">Perfect score! No wrong answers to review.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  variant="gold"
                  size="lg"
                  onClick={() => {
                    setPhase('intro');
                    setCurrentIndex(0);
                    setQuestionStates({});
                    setTimeRemaining(EXAM_DURATION_SECONDS);
                    setShowConfirmation(false);
                    setScScore(null);
                    setActiveTab('all');
                  }}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button variant="secondary" size="lg" onClick={onExit} className="flex-1">
                  Exit
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <GameLayout
      title="Scholar's Challenge"
      subtitle={phase === 'playing' ? `${answeredCount}/${totalQuestions} answered` : 'WSC Exam Simulation'}
      players={displayPlayers}
      currentRound={phase === 'playing' ? currentIndex + 1 : undefined}
      totalRounds={totalQuestions}
      timeRemaining={phase === 'playing' ? timeRemaining : undefined}
      showTimer={phase === 'playing'}
      showRound={phase === 'playing'}
      onBack={onExit}
    >
      {renderContent()}
    </GameLayout>
  );
}
