'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, HelpCircle, Zap, ChevronDown, ChevronUp, Link2, Sparkles } from 'lucide-react';
import { Button, Card, CardContent, Badge, Avatar, TimerDisplay, Progress, Textarea } from '@/components/ui';
import { GameLayout, WaitingRoom, Countdown, GameOver } from './GameLayout';
import { useGameState } from '@/lib/hooks/useGameState';
import { type Question } from '@/lib/games/types';
import { useSounds } from '@/lib/hooks/useSounds';
import { createAdaptiveState, recordAnswer, getAdaptiveDifficulty } from '@/lib/games/adaptive';
import { recordWrongAnswer } from '@/lib/games/wrongAnswerJournal';
import { updatePlayerStats, checkAchievements, getPlayerStats } from '@/lib/games/achievements';
import { useAchievementToast } from '@/components/ui/AchievementToast';
import { AIExplanation } from './AIExplanation';

interface QuickfireQuizProps {
  sessionId: string;
  isHost?: boolean;
  onExit?: () => void;
  mode?: 'solo' | 'multiplayer';
  questions?: Question[];
}

/**
 * QuickfireQuiz - Timed multiple choice quiz
 * Can be used for both solo practice and multiplayer sessions
 */
export function QuickfireQuiz({
  sessionId,
  isHost = false,
  onExit,
  mode = 'multiplayer',
  questions: initialQuestions,
}: QuickfireQuizProps) {
  const gameState = useGameState();
  const {
    phase,
    players,
    currentQuestion,
    timeRemaining,
    currentRound,
    totalRounds,
    revealed,
    finalScores,
    winnerId,
    joinSession,
    leaveSession,
    submitAnswer,
  } = gameState;

  const sounds = useSounds();
  const { showAchievements } = useAchievementToast();
  const [adaptiveState, setAdaptiveState] = useState(createAdaptiveState());
  const [explainBackMode, setExplainBackMode] = useState(false);
  const [explainBackText, setExplainBackText] = useState('');
  const [showDeepExplanation, setShowDeepExplanation] = useState(false);
  const streakRef = useRef(0);

  // Solo mode state - supports continuous play up to 100 questions
  const MAX_QUESTIONS = 100;
  const CHECKPOINT_INTERVAL = 10; // Ask if player wants to continue every 10 questions

  const [soloState, setSoloState] = useState({
    questions: initialQuestions || [],
    currentIndex: 0,
    score: 0,
    answers: [] as { questionId: string; answerIndex: number; correct: boolean }[],
    timeLeft: 30,
    phase: 'waiting' as 'waiting' | 'playing' | 'revealing' | 'checkpoint' | 'ended',
  });

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);

  // Timer for solo mode
  useEffect(() => {
    if (mode === 'solo' && soloState.phase === 'playing' && soloState.timeLeft > 0) {
      const timer = setTimeout(() => {
        setSoloState((prev) => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (mode === 'solo' && soloState.timeLeft === 0 && soloState.phase === 'playing') {
      // Time's up - auto-submit wrong answer
      handleSoloAnswer(-1);
    }
  }, [mode, soloState.phase, soloState.timeLeft]);

  // Join session for multiplayer
  useEffect(() => {
    if (mode === 'multiplayer') {
      joinSession(sessionId);
      return () => leaveSession();
    }
  }, [sessionId, mode, joinSession, leaveSession]);

  // Countdown effect
  useEffect(() => {
    const currentPhase = mode === 'solo' ? soloState.phase : phase;
    if (currentPhase === 'countdown' && countdownValue > 0) {
      const timer = setTimeout(() => setCountdownValue(countdownValue - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [mode, phase, soloState.phase, countdownValue]);

  const handleSoloAnswer = useCallback((answerIndex: number) => {
    const currentQ = soloState.questions[soloState.currentIndex];
    const isCorrect = answerIndex === currentQ?.correct_index;
    const points = isCorrect ? Math.ceil(soloState.timeLeft * 10) : 0;

    // Sound effects
    if (isCorrect) {
      sounds.play('correct');
      streakRef.current += 1;
      if (streakRef.current >= 3) {
        sounds.play('streak');
      }
    } else {
      sounds.play('wrong');
      streakRef.current = 0;
    }

    // Adaptive difficulty
    setAdaptiveState((prev) => recordAnswer(prev, isCorrect));

    // Wrong answer journal
    if (!isCorrect && currentQ) {
      recordWrongAnswer(
        currentQ.id,
        currentQ.text,
        currentQ.subject,
        answerIndex >= 0 ? currentQ.options[answerIndex] : '(timed out)',
        currentQ.options[currentQ.correct_index],
        currentQ.explanation,
        currentQ.deep_explanation
      );
    }

    // Update player stats and check achievements
    const updatedStats = updatePlayerStats((stats) => {
      const newStreak = isCorrect ? stats.currentStreak + 1 : 0;
      const subjectAcc = { ...stats.subjectAccuracy };
      const subKey = currentQ?.subject || 'mixed';
      const prev = subjectAcc[subKey] || { correct: 0, total: 0 };
      subjectAcc[subKey] = {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      };

      return {
        ...stats,
        totalQuestionsAnswered: stats.totalQuestionsAnswered + 1,
        correctAnswers: stats.correctAnswers + (isCorrect ? 1 : 0),
        currentStreak: newStreak,
        longestStreak: Math.max(stats.longestStreak, newStreak),
        subjectAccuracy: subjectAcc,
      };
    });

    const newAchievements = checkAchievements(updatedStats);
    if (newAchievements.length > 0) {
      sounds.play('achievement');
      showAchievements(newAchievements);
    }

    setSoloState((prev) => ({
      ...prev,
      phase: 'revealing',
      score: prev.score + points,
      answers: [
        ...prev.answers,
        { questionId: currentQ.id, answerIndex, correct: isCorrect },
      ],
    }));
    setSelectedAnswer(answerIndex);

    // Auto-show explanation when answer is wrong
    if (!isCorrect) {
      setShowExplanation(true);
    }

    // ~20% chance of Explain It Back after correct answer
    if (isCorrect && Math.random() < 0.2) {
      setExplainBackMode(true);
      setExplainBackText('');
      return; // Don't auto-advance; wait for explain-back resolution
    }

    // Move to next question after delay
    advanceToNext();
  }, [soloState, sounds, showAchievements]);

  const advanceToNext = useCallback(() => {
    setTimeout(() => {
      const nextIndex = soloState.currentIndex + 1;
      const questionsAnswered = soloState.answers.length + 1;

      // End if we've reached max questions or ran out of questions
      if (questionsAnswered >= MAX_QUESTIONS || nextIndex >= soloState.questions.length) {
        setSoloState((prev) => ({ ...prev, phase: 'ended' }));
      }
      // Show checkpoint every 10 questions to let player continue or stop
      else if (questionsAnswered > 0 && questionsAnswered % CHECKPOINT_INTERVAL === 0) {
        setSoloState((prev) => ({
          ...prev,
          currentIndex: nextIndex,
          timeLeft: 30,
          phase: 'checkpoint',
        }));
        setSelectedAnswer(null);
        setShowExplanation(false);
        setShowDeepExplanation(false);
      }
      // Continue to next question
      else {
        setSoloState((prev) => ({
          ...prev,
          currentIndex: nextIndex,
          timeLeft: 30,
          phase: 'playing',
        }));
        setSelectedAnswer(null);
        setShowExplanation(false);
        setShowDeepExplanation(false);
      }
    }, 3000);
  }, [soloState]);

  const handleExplainBackDone = useCallback((wellExplained: boolean) => {
    setExplainBackMode(false);
    setExplainBackText('');
    if (!wellExplained && soloState.questions[soloState.currentIndex]) {
      const q = soloState.questions[soloState.currentIndex];
      recordWrongAnswer(
        q.id,
        q.text,
        q.subject,
        '(needs review - explain back)',
        q.options[q.correct_index],
        q.explanation,
        q.deep_explanation
      );
    }
    advanceToNext();
  }, [soloState, advanceToNext]);

  const handleMultiplayerAnswer = (index: number) => {
    setSelectedAnswer(index);
    submitAnswer(index);
  };

  const handleStartSolo = () => {
    setSoloState((prev) => ({ ...prev, phase: 'playing', timeLeft: 30 }));
  };

  const handleExit = () => {
    if (mode === 'multiplayer') {
      leaveSession();
    }
    onExit?.();
  };

  // Get current values based on mode
  const currentPhase = mode === 'solo' ? soloState.phase : phase;
  const currentQ = mode === 'solo'
    ? soloState.questions[soloState.currentIndex]
    : currentQuestion;
  const currentTime = mode === 'solo' ? soloState.timeLeft : timeRemaining;
  const currentScore = mode === 'solo' ? soloState.score : 0;
  const questionNumber = mode === 'solo' ? soloState.currentIndex + 1 : currentRound;
  const totalQuestions = mode === 'solo' ? soloState.questions.length : totalRounds;
  const isRevealed = mode === 'solo' ? soloState.phase === 'revealing' : revealed;

  const renderContent = () => {
    switch (currentPhase) {
      case 'waiting':
        if (mode === 'solo') {
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
                  Quickfire Quiz
                </h2>
                <p className="text-ink-600 mb-6">
                  Answer as many as you want! Faster = more points. We&apos;ll check in every 10 questions.
                </p>
                <div className="text-sm text-ink-500 mb-6 space-y-1">
                  <p>✓ Up to 100 questions available</p>
                  <p>✓ Stop anytime at checkpoints</p>
                  <p>✓ Wrong answers show explanations</p>
                </div>
                <Button variant="gold" size="lg" onClick={handleStartSolo}>
                  Start Quiz
                </Button>
              </motion.div>
            </div>
          );
        }
        return (
          <WaitingRoom
            players={players}
            minPlayers={1}
            isHost={isHost}
            gameName="Quickfire Quiz"
          />
        );

      case 'countdown':
        return <Countdown count={countdownValue} gameName="Quickfire Quiz" />;

      case 'playing':
      case 'revealing':
        return (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-ink-500 mb-2">
                  <span>Question {questionNumber} of {totalQuestions}</span>
                  {mode === 'solo' && <span>{currentScore} points</span>}
                </div>
                <Progress
                  value={questionNumber}
                  max={totalQuestions}
                  variant="gold"
                />
              </div>

              {/* Question Card */}
              <motion.div
                key={currentQ?.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6"
              >
                <Card className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline">{currentQ?.subject || 'Mixed'}</Badge>
                      <TimerDisplay
                        time={currentTime}
                        maxTime={30}
                        size={48}
                      />
                    </div>
                    <h2 className="font-display text-xl md:text-2xl font-semibold text-ink-800 leading-relaxed">
                      {currentQ?.text}
                    </h2>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Answer Options */}
              {currentQ && (
                <div className="space-y-3 mb-6">
                  {currentQ.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = isRevealed && currentQ.correct_index === index;
                    const isWrong = isRevealed && isSelected && !isCorrect;

                    return (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          if (!isRevealed) {
                            if (mode === 'solo') {
                              handleSoloAnswer(index);
                            } else {
                              handleMultiplayerAnswer(index);
                            }
                          }
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
                          <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                            isCorrect
                              ? 'bg-sage-500 text-white'
                              : isWrong
                              ? 'bg-coral-500 text-white'
                              : isSelected
                              ? 'bg-gold-500 text-white'
                              : 'bg-ink-200 text-ink-600'
                          }`}>
                            {isCorrect ? (
                              <Check className="w-6 h-6" />
                            ) : isWrong ? (
                              <X className="w-6 h-6" />
                            ) : (
                              String.fromCharCode(65 + index)
                            )}
                          </span>
                          <span className={`flex-1 font-medium text-lg ${
                            isCorrect ? 'text-sage-800' :
                            isWrong ? 'text-coral-800' :
                            'text-ink-800'
                          }`}>
                            {option}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Theme Connection Badge */}
              {isRevealed && currentQ?.theme_connection && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3"
                >
                  <Badge variant="outline" className="bg-gold-50 border-gold-300 text-gold-800">
                    <Link2 className="w-3 h-3 mr-1" />
                    {currentQ.theme_connection}
                  </Badge>
                </motion.div>
              )}

              {/* Explanation */}
              {isRevealed && currentQ?.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  {/* Always show explanation when wrong, otherwise show toggle button */}
                  {selectedAnswer !== currentQ.correct_index ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-sage-50 border border-sage-200 rounded-xl"
                    >
                      <div className="flex items-center gap-2 text-sage-700 font-medium mb-2">
                        <HelpCircle className="w-5 h-5" />
                        <span>Correct Answer: {currentQ.options[currentQ.correct_index]}</span>
                      </div>
                      <p className="text-ink-700">{currentQ.explanation}</p>
                    </motion.div>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="flex items-center gap-2 text-ink-600 hover:text-ink-800 mb-2"
                      >
                        <HelpCircle className="w-5 h-5" />
                        <span className="font-medium">
                          {showExplanation ? 'Hide' : 'Show'} explanation
                        </span>
                      </button>
                      <AnimatePresence>
                        {showExplanation && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 bg-ink-100 rounded-xl text-ink-700"
                          >
                            {currentQ.explanation}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </motion.div>
              )}

              {/* Deep Explanation - Learn More */}
              {isRevealed && currentQ?.deep_explanation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3"
                >
                  <button
                    onClick={() => setShowDeepExplanation(!showDeepExplanation)}
                    className="flex items-center gap-2 text-gold-700 hover:text-gold-800 text-sm font-medium"
                  >
                    {showDeepExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Learn More
                  </button>
                  <AnimatePresence>
                    {showDeepExplanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-4 bg-gold-50 border border-gold-200 rounded-xl text-ink-700 text-sm leading-relaxed"
                      >
                        {currentQ.deep_explanation}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* AI Explanation */}
              {isRevealed && currentQ && (
                <AIExplanation
                  question={currentQ}
                  userAnswer={selectedAnswer}
                  wasCorrect={selectedAnswer === currentQ.correct_index}
                />
              )}

              {/* Explain It Back Mode */}
              {isRevealed && explainBackMode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-cream-100 border-2 border-gold-300 rounded-xl"
                >
                  <h4 className="font-semibold text-ink-800 mb-2">
                    Explain It Back
                  </h4>
                  <p className="text-sm text-ink-600 mb-3">
                    In your own words, why is this the correct answer?
                  </p>
                  <Textarea
                    value={explainBackText}
                    onChange={(e) => setExplainBackText(e.target.value)}
                    placeholder="Type your explanation..."
                    className="mb-3 min-h-[80px] text-sm"
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleExplainBackDone(true)}
                      className="flex-1 bg-sage-600 hover:bg-sage-700"
                    >
                      I explained it well
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleExplainBackDone(false)}
                      className="flex-1"
                    >
                      I need to review this
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        );

      case 'checkpoint':
        if (mode === 'solo') {
          const checkpointCorrect = soloState.answers.filter((a) => a.correct).length;
          const checkpointTotal = soloState.answers.length;
          const questionsRemaining = Math.min(MAX_QUESTIONS - checkpointTotal, soloState.questions.length - soloState.currentIndex);

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
                  Great Progress!
                </h2>
                <p className="text-ink-600 mb-6">
                  You&apos;ve answered <span className="font-bold text-gold-600">{checkpointTotal}</span> questions
                </p>

                <div className="bg-white rounded-2xl p-5 mb-6 shadow-md">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gold-600">{soloState.score}</p>
                      <p className="text-xs text-ink-500">Points</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-sage-600">{checkpointCorrect}</p>
                      <p className="text-xs text-ink-500">Correct</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ink-700">
                        {checkpointTotal > 0 ? Math.round((checkpointCorrect / checkpointTotal) * 100) : 0}%
                      </p>
                      <p className="text-xs text-ink-500">Accuracy</p>
                    </div>
                  </div>
                </div>

                {questionsRemaining > 0 ? (
                  <>
                    <p className="text-sm text-ink-500 mb-4">
                      {questionsRemaining} more questions available
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="gold"
                        size="lg"
                        onClick={() => {
                          setSoloState((prev) => ({ ...prev, phase: 'playing' }));
                        }}
                        className="flex-1"
                      >
                        Keep Going! 🔥
                      </Button>
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => {
                          setSoloState((prev) => ({ ...prev, phase: 'ended' }));
                        }}
                        className="flex-1"
                      >
                        Finish
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    variant="gold"
                    size="lg"
                    onClick={() => {
                      setSoloState((prev) => ({ ...prev, phase: 'ended' }));
                    }}
                    className="w-full"
                  >
                    See Results
                  </Button>
                )}
              </motion.div>
            </div>
          );
        }
        return null;

      case 'ended':
        if (mode === 'solo') {
          const correctCount = soloState.answers.filter((a) => a.correct).length;
          const totalAnswered = soloState.answers.length;
          return (
            <div className="flex-1 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-md"
              >
                <div className="w-24 h-24 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-12 h-12 text-white" />
                </div>
                <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">
                  Quiz Complete!
                </h2>
                <p className="text-xl text-ink-600 mb-8">
                  You scored <span className="font-bold text-gold-600">{soloState.score}</span> points
                </p>

                <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold text-ink-700">{totalAnswered}</p>
                      <p className="text-sm text-ink-500">Questions</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-sage-600">{correctCount}</p>
                      <p className="text-sm text-ink-500">Correct</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-coral-600">
                        {totalAnswered - correctCount}
                      </p>
                      <p className="text-sm text-ink-500">Wrong</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-ink-100">
                    <p className="text-2xl font-bold text-ink-800">
                      {totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0}%
                    </p>
                    <p className="text-sm text-ink-500">Accuracy</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="gold" size="lg" onClick={() => {
                    setSoloState({
                      questions: initialQuestions || [],
                      currentIndex: 0,
                      score: 0,
                      answers: [],
                      timeLeft: 30,
                      phase: 'waiting',
                    });
                    setSelectedAnswer(null);
                    setAdaptiveState(createAdaptiveState());
                    setExplainBackMode(false);
                    setShowDeepExplanation(false);
                    streakRef.current = 0;
                  }} className="flex-1">
                    Play Again
                  </Button>
                  <Button variant="secondary" size="lg" onClick={handleExit} className="flex-1">
                    Exit
                  </Button>
                </div>
              </motion.div>
            </div>
          );
        }
        return (
          <GameOver
            players={players}
            winnerId={winnerId}
            onExit={handleExit}
          />
        );

      default:
        return null;
    }
  };

  // For solo mode, create a fake player
  const displayPlayers = mode === 'solo'
    ? [{ id: 'solo', display_name: 'You', avatar_color: '#3B82F6', score: soloState.score, is_ready: true, is_connected: true }]
    : players;

  return (
    <GameLayout
      title="Quickfire Quiz"
      subtitle={mode === 'solo' ? 'Solo Practice' : 'Answer fast, score high!'}
      players={displayPlayers}
      currentRound={questionNumber}
      totalRounds={totalQuestions}
      timeRemaining={currentPhase === 'playing' ? currentTime : undefined}
      showTimer={currentPhase === 'playing'}
      showRound={currentPhase === 'playing' || currentPhase === 'revealing'}
      onBack={handleExit}
    >
      {renderContent()}
    </GameLayout>
  );
}
