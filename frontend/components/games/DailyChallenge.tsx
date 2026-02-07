'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, HelpCircle, Calendar, Flame, Trophy, Star } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { useSounds } from '@/lib/hooks/useSounds';
import { checkAchievements, updatePlayerStats } from '@/lib/games/achievements';
import {
  getDailyQuestions,
  getDailyStreakData,
  completeDailyChallenge,
  getTodayDateString,
} from '@/lib/games/dailyChallenge';
import { recordWrongAnswer } from '@/lib/games/wrongAnswerJournal';
import { AIExplanation } from './AIExplanation';
import type { Question, DailyStreakData } from '@/lib/games/types';

interface DailyChallengeProps {
  onExit?: () => void;
}

type Phase = 'intro' | 'playing' | 'revealing' | 'complete' | 'already_done';

const MILESTONE_STREAKS = [3, 7, 14, 30];

function getMilestoneMessage(streak: number): string | null {
  if (streak >= 30) return 'Monthly Master! 30 days strong!';
  if (streak >= 14) return 'Fortnight Champion! 14 days!';
  if (streak >= 7) return 'Weekly Warrior! 7 days in a row!';
  if (streak >= 3) return 'Hot Streak! 3 days running!';
  return null;
}

function StreakCalendar({ streakData }: { streakData: DailyStreakData }) {
  const today = new Date();
  const days: { date: string; completed: boolean; isToday: boolean }[] = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      completed: streakData.completedDates.includes(dateStr),
      isToday: dateStr === getTodayDateString(),
    });
  }

  return (
    <div className="flex gap-1.5 justify-center flex-wrap">
      {days.map((day) => (
        <div
          key={day.date}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
            day.completed
              ? 'bg-sage-500 text-white'
              : day.isToday
              ? 'bg-gold-200 text-gold-800 ring-2 ring-gold-400'
              : 'bg-ink-100 text-ink-400'
          }`}
          title={day.date}
        >
          {new Date(day.date).getDate()}
        </div>
      ))}
    </div>
  );
}

export function DailyChallenge({ onExit }: DailyChallengeProps) {
  const { play } = useSounds();

  const [questions] = useState<Question[]>(() => getDailyQuestions());
  const [streakData, setStreakData] = useState<DailyStreakData>(() => getDailyStreakData());
  const [phase, setPhase] = useState<Phase>(() => {
    const data = getDailyStreakData();
    return data.todayCompleted ? 'already_done' : 'intro';
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (phase !== 'playing' || !currentQuestion) return;

      const isCorrect = answerIndex === currentQuestion.correct_index;
      const points = isCorrect ? 20 : 0;

      setSelectedAnswer(answerIndex);
      setScore((prev) => prev + points);
      setPhase('revealing');

      if (isCorrect) {
        play('correct');
        setCorrectCount((prev) => prev + 1);
      } else {
        play('wrong');
        setShowExplanation(true);
        recordWrongAnswer(
          currentQuestion.id,
          currentQuestion.text,
          currentQuestion.subject,
          currentQuestion.options[answerIndex],
          currentQuestion.options[currentQuestion.correct_index],
          currentQuestion.explanation,
          currentQuestion.deep_explanation
        );
      }

      setTimeout(() => {
        if (currentIndex + 1 >= totalQuestions) {
          const finalScore = score + points;
          const updatedStreak = completeDailyChallenge(finalScore);
          setStreakData(updatedStreak);

          updatePlayerStats((stats) => ({
            ...stats,
            totalQuestionsAnswered: stats.totalQuestionsAnswered + 1,
            correctAnswers: stats.correctAnswers + (isCorrect ? 1 : 0),
            gamesPlayed: stats.gamesPlayed + 1,
            dailyStreak: updatedStreak.currentStreak,
          }));
          checkAchievements();

          const milestone = getMilestoneMessage(updatedStreak.currentStreak);
          if (milestone && MILESTONE_STREAKS.includes(updatedStreak.currentStreak)) {
            setMilestoneMessage(milestone);
            play('achievement');
          }

          play('complete');
          setPhase('complete');
        } else {
          setCurrentIndex((prev) => prev + 1);
          setSelectedAnswer(null);
          setShowExplanation(false);
          setPhase('playing');
        }
      }, 2500);
    },
    [phase, currentQuestion, currentIndex, totalQuestions, score, play]
  );

  const handleStart = () => {
    setPhase('playing');
  };

  const handleExit = () => {
    onExit?.();
  };

  const displayPlayers = [
    {
      id: 'daily',
      display_name: 'You',
      avatar_color: '#F59E0B',
      score,
      is_ready: true,
      is_connected: true,
    },
  ];

  const renderContent = () => {
    switch (phase) {
      case 'already_done':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-sage-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
                Today&apos;s Challenge Complete!
              </h2>
              <p className="text-ink-600 mb-4">
                You scored{' '}
                <span className="font-bold text-gold-600">{streakData.todayScore ?? 0}</span>{' '}
                points today.
              </p>

              {streakData.currentStreak > 0 && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Flame className="w-5 h-5 text-coral-500" />
                  <span className="font-semibold text-ink-700">
                    {streakData.currentStreak} day streak
                  </span>
                </div>
              )}

              <div className="bg-white rounded-2xl p-5 mb-6 shadow-md">
                <p className="text-sm text-ink-500 mb-3">Last 14 days</p>
                <StreakCalendar streakData={streakData} />
              </div>

              <p className="text-sm text-ink-500 mb-6">Come back tomorrow for new questions!</p>

              <Button variant="secondary" size="lg" onClick={handleExit} className="w-full">
                Back to Games
              </Button>
            </motion.div>
          </div>
        );

      case 'intro':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              <div className="w-20 h-20 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-gold-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
                Daily Challenge
              </h2>
              <p className="text-ink-600 mb-6">
                5 questions across all subjects. Same questions for everyone today!
              </p>

              {streakData.currentStreak > 0 && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Flame className="w-5 h-5 text-coral-500" />
                  <span className="font-semibold text-ink-700">
                    {streakData.currentStreak} day streak
                  </span>
                </div>
              )}

              <div className="bg-white rounded-2xl p-5 mb-6 shadow-md">
                <p className="text-sm text-ink-500 mb-3">Last 14 days</p>
                <StreakCalendar streakData={streakData} />
              </div>

              <div className="text-sm text-ink-500 mb-6 space-y-1">
                <p>Best streak: {streakData.longestStreak} days</p>
                <p>Total completions: {streakData.completedDates.length}</p>
              </div>

              <Button variant="gold" size="lg" onClick={handleStart} className="w-full">
                Start Today&apos;s Challenge
              </Button>
            </motion.div>
          </div>
        );

      case 'playing':
      case 'revealing':
        return (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-ink-500 mb-2">
                  <span>
                    Question {currentIndex + 1} of {totalQuestions}
                  </span>
                  <span>{score} points</span>
                </div>
                <Progress value={currentIndex + 1} max={totalQuestions} variant="gold" />
              </div>

              {/* Question */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion?.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="mb-6"
                >
                  <Card className="bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline">{currentQuestion?.subject || 'Mixed'}</Badge>
                        {streakData.currentStreak > 0 && (
                          <div className="flex items-center gap-1 text-sm text-coral-500">
                            <Flame className="w-4 h-4" />
                            <span>{streakData.currentStreak}</span>
                          </div>
                        )}
                      </div>
                      <h2 className="font-display text-xl md:text-2xl font-semibold text-ink-800 leading-relaxed">
                        {currentQuestion?.text}
                      </h2>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {/* Options */}
              {currentQuestion && (
                <div className="space-y-3 mb-6">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isRevealed = phase === 'revealing';
                    const isCorrect = isRevealed && currentQuestion.correct_index === index;
                    const isWrong = isRevealed && isSelected && !isCorrect;

                    return (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          if (!isRevealed) handleAnswer(index);
                        }}
                        disabled={isRevealed}
                        className={`w-full p-4 rounded-xl text-left transition-all ${
                          isCorrect
                            ? 'bg-sage-100 border-2 border-sage-500 ring-2 ring-sage-200'
                            : isWrong
                            ? 'bg-coral-100 border-2 border-coral-500 ring-2 ring-coral-200'
                            : isSelected
                            ? 'bg-gold-100 border-2 border-gold-500'
                            : 'bg-cream-100 border-2 border-transparent hover:border-gold-300 active:scale-[0.98]'
                        } ${isRevealed ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                              isCorrect
                                ? 'bg-sage-500 text-white'
                                : isWrong
                                ? 'bg-coral-500 text-white'
                                : isSelected
                                ? 'bg-gold-500 text-white'
                                : 'bg-ink-200 text-ink-600'
                            }`}
                          >
                            {isCorrect ? (
                              <Check className="w-6 h-6" />
                            ) : isWrong ? (
                              <X className="w-6 h-6" />
                            ) : (
                              String.fromCharCode(65 + index)
                            )}
                          </span>
                          <span
                            className={`flex-1 font-medium text-lg ${
                              isCorrect
                                ? 'text-sage-800'
                                : isWrong
                                ? 'text-coral-800'
                                : 'text-ink-800'
                            }`}
                          >
                            {option}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Explanation */}
              {phase === 'revealing' && currentQuestion?.explanation && showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-sage-50 border border-sage-200 rounded-xl"
                >
                  <div className="flex items-center gap-2 text-sage-700 font-medium mb-2">
                    <HelpCircle className="w-5 h-5" />
                    <span>
                      Correct Answer:{' '}
                      {currentQuestion.options[currentQuestion.correct_index]}
                    </span>
                  </div>
                  <p className="text-ink-700">{currentQuestion.explanation}</p>
                </motion.div>
              )}

              {/* AI Explanation for wrong answers */}
              {phase === 'revealing' && currentQuestion && selectedAnswer !== null && (
                <AIExplanation
                  question={currentQuestion}
                  userAnswer={selectedAnswer}
                  wasCorrect={selectedAnswer === currentQuestion.correct_index}
                />
              )}
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              <div className="w-24 h-24 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">
                Challenge Complete!
              </h2>
              <p className="text-xl text-ink-600 mb-4">
                You scored <span className="font-bold text-gold-600">{score}</span> points
              </p>

              {/* Streak info */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <Flame className="w-6 h-6 text-coral-500" />
                <span className="text-xl font-bold text-ink-800">
                  {streakData.currentStreak} day streak
                </span>
              </div>

              {/* Milestone */}
              {milestoneMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gold-100 border border-gold-300 rounded-2xl p-4 mb-6"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-5 h-5 text-gold-600" />
                    <span className="font-semibold text-gold-800">{milestoneMessage}</span>
                    <Star className="w-5 h-5 text-gold-600" />
                  </div>
                </motion.div>
              )}

              {/* Stats */}
              <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <p className="text-3xl font-bold text-sage-600">{correctCount}</p>
                    <p className="text-sm text-ink-500">Correct</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-coral-600">
                      {totalQuestions - correctCount}
                    </p>
                    <p className="text-sm text-ink-500">Wrong</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-ink-700">
                      {totalQuestions > 0
                        ? Math.round((correctCount / totalQuestions) * 100)
                        : 0}
                      %
                    </p>
                    <p className="text-sm text-ink-500">Accuracy</p>
                  </div>
                </div>

                <div className="border-t border-ink-100 pt-4">
                  <p className="text-sm text-ink-500 mb-3">Last 14 days</p>
                  <StreakCalendar streakData={streakData} />
                </div>
              </div>

              <p className="text-sm text-ink-500 mb-6">Come back tomorrow for new questions!</p>

              <Button variant="secondary" size="lg" onClick={handleExit} className="w-full">
                Back to Games
              </Button>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <GameLayout
      title="Daily Challenge"
      subtitle={`${getTodayDateString()}`}
      players={displayPlayers}
      currentRound={phase === 'playing' || phase === 'revealing' ? currentIndex + 1 : undefined}
      totalRounds={totalQuestions}
      showTimer={false}
      showRound={phase === 'playing' || phase === 'revealing'}
      onBack={handleExit}
    >
      {renderContent()}
    </GameLayout>
  );
}
