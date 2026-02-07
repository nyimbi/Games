'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, HelpCircle, Swords, Zap, Trophy, Shield } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { useSounds } from '@/lib/hooks/useSounds';
import { getMixedQuestions } from '@/lib/games/questions';
import { AI_OPPONENTS, simulateAIAnswer, type AIOpponent } from '@/lib/games/aiOpponent';
import { recordWrongAnswer } from '@/lib/games/wrongAnswerJournal';
import { updatePlayerStats, checkAchievements } from '@/lib/games/achievements';
import { AIExplanation } from './AIExplanation';
import type { Question } from '@/lib/games/types';

interface BattleModeProps {
  onExit?: () => void;
}

type Phase = 'select_opponent' | 'countdown' | 'playing' | 'ai_thinking' | 'revealing' | 'results';

const QUESTIONS_PER_BATTLE = 10;
const ANSWER_TIME_LIMIT = 20; // seconds per question

interface BattleAnswer {
  playerAnswer: number | null;
  aiAnswer: number | null;
  playerCorrect: boolean;
  aiCorrect: boolean;
  playerTimeMs: number;
  aiTimeMs: number;
}

export function BattleMode({ onExit }: BattleModeProps) {
  const { play } = useSounds();

  const [phase, setPhase] = useState<Phase>('select_opponent');
  const [opponent, setOpponent] = useState<AIOpponent | null>(null);
  const [questions] = useState<Question[]>(() => getMixedQuestions(undefined, QUESTIONS_PER_BATTLE));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [aiAnswer, setAiAnswer] = useState<number | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [battleAnswers, setBattleAnswers] = useState<BattleAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME_LIMIT);
  const [countdownValue, setCountdownValue] = useState(3);
  const [streak, setStreak] = useState(0);
  const questionStartRef = useRef(Date.now());
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuestion = questions[currentIndex];

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdownValue <= 0) {
      setPhase('playing');
      setTimeLeft(ANSWER_TIME_LIMIT);
      questionStartRef.current = Date.now();
      startAIThinking();
      return;
    }
    const timer = setTimeout(() => setCountdownValue((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdownValue]);

  // Question timer
  useEffect(() => {
    if (phase !== 'playing' || timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  // Auto-submit on timeout
  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) {
      handlePlayerAnswer(-1);
    }
  }, [phase, timeLeft]);

  const startAIThinking = useCallback(() => {
    if (!currentQuestion || !opponent) return;
    setAiThinking(true);
    const { answer, timeMs } = simulateAIAnswer(
      opponent,
      currentQuestion.correct_index,
      currentQuestion.options.length
    );
    aiTimerRef.current = setTimeout(() => {
      setAiAnswer(answer);
      setAiThinking(false);
    }, Math.min(timeMs, ANSWER_TIME_LIMIT * 1000));
  }, [currentQuestion, opponent]);

  // Cleanup AI timer
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, []);

  const handleSelectOpponent = (opp: AIOpponent) => {
    setOpponent(opp);
    setCountdownValue(3);
    setPhase('countdown');
  };

  const handlePlayerAnswer = useCallback(
    (answerIndex: number) => {
      if (phase !== 'playing' || !currentQuestion || !opponent) return;

      const playerTimeMs = Date.now() - questionStartRef.current;
      const playerCorrect = answerIndex === currentQuestion.correct_index;
      setSelectedAnswer(answerIndex);
      setPhase('revealing');

      // Wait for AI if still thinking
      const resolveRound = (finalAiAnswer: number | null) => {
        const aiCorrect =
          finalAiAnswer !== null && finalAiAnswer === currentQuestion.correct_index;

        // Score: correct answer + speed bonus
        let playerPoints = 0;
        let aiPoints = 0;
        if (playerCorrect) {
          playerPoints = 10 + Math.max(0, Math.ceil((ANSWER_TIME_LIMIT - playerTimeMs / 1000) * 0.5));
          setStreak((s) => s + 1);
          play('correct');
        } else {
          setStreak(0);
          play('wrong');
          if (answerIndex >= 0) {
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
        }
        if (aiCorrect) {
          aiPoints = 10;
        }

        setPlayerScore((s) => s + playerPoints);
        setAiScore((s) => s + aiPoints);
        setBattleAnswers((prev) => [
          ...prev,
          {
            playerAnswer: answerIndex >= 0 ? answerIndex : null,
            aiAnswer: finalAiAnswer,
            playerCorrect,
            aiCorrect,
            playerTimeMs,
            aiTimeMs: 0,
          },
        ]);

        // Next question or results
        setTimeout(() => {
          if (currentIndex + 1 >= QUESTIONS_PER_BATTLE) {
            updatePlayerStats((stats) => ({
              ...stats,
              totalQuestionsAnswered: stats.totalQuestionsAnswered + QUESTIONS_PER_BATTLE,
              correctAnswers:
                stats.correctAnswers +
                [...battleAnswers, { playerCorrect }].filter((a) => a.playerCorrect).length,
              gamesPlayed: stats.gamesPlayed + 1,
            }));
            checkAchievements();
            play('complete');
            setPhase('results');
          } else {
            setCurrentIndex((i) => i + 1);
            setSelectedAnswer(null);
            setAiAnswer(null);
            setTimeLeft(ANSWER_TIME_LIMIT);
            questionStartRef.current = Date.now();
            setPhase('playing');
            startAIThinking();
          }
        }, 2500);
      };

      // If AI already answered, resolve immediately
      if (aiAnswer !== null || !aiThinking) {
        if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
        resolveRound(aiAnswer);
      } else {
        // Wait for AI to finish
        const waitForAI = () => {
          if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
          // Force AI answer now
          const { answer } = simulateAIAnswer(
            opponent,
            currentQuestion.correct_index,
            currentQuestion.options.length
          );
          setAiAnswer(answer);
          setAiThinking(false);
          resolveRound(answer);
        };
        waitForAI();
      }
    },
    [
      phase,
      currentQuestion,
      opponent,
      aiAnswer,
      aiThinking,
      currentIndex,
      battleAnswers,
      play,
      startAIThinking,
      streak,
    ]
  );

  const handleExit = () => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    onExit?.();
  };

  const displayPlayers = opponent
    ? [
        {
          id: 'player',
          display_name: 'You',
          avatar_color: '#3B82F6',
          score: playerScore,
          is_ready: true,
          is_connected: true,
        },
        {
          id: 'ai',
          display_name: opponent.name,
          avatar_color: '#EF4444',
          score: aiScore,
          is_ready: true,
          is_connected: true,
        },
      ]
    : [
        {
          id: 'player',
          display_name: 'You',
          avatar_color: '#3B82F6',
          score: 0,
          is_ready: true,
          is_connected: true,
        },
      ];

  const renderContent = () => {
    switch (phase) {
      case 'select_opponent':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md w-full"
            >
              <div className="w-20 h-20 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Swords className="w-10 h-10 text-coral-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">Battle Mode</h2>
              <p className="text-ink-600 mb-8">Choose your opponent!</p>

              <div className="space-y-4">
                {AI_OPPONENTS.map((opp) => (
                  <motion.div key={opp.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Card
                      className="bg-white hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <CardContent className="p-5">
                        <button
                          onClick={() => handleSelectOpponent(opp)}
                          className="w-full flex items-center gap-4 text-left"
                        >
                          <div className="w-14 h-14 bg-cream-100 rounded-full flex items-center justify-center text-3xl">
                            {opp.avatar}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-display text-lg font-semibold text-ink-800">
                              {opp.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  opp.difficulty === 'easy'
                                    ? 'sage'
                                    : opp.difficulty === 'medium'
                                    ? 'gold'
                                    : 'outline'
                                }
                                size="sm"
                              >
                                {opp.difficulty}
                              </Badge>
                              <span className="text-sm text-ink-500">
                                {Math.round(opp.accuracy * 100)}% accuracy
                              </span>
                            </div>
                          </div>
                          <Swords className="w-5 h-5 text-ink-400" />
                        </button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        );

      case 'countdown':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              {opponent && (
                <p className="text-lg text-ink-600 mb-4">
                  You vs <span className="font-bold">{opponent.avatar} {opponent.name}</span>
                </p>
              )}
              <motion.div
                key={countdownValue}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-32 h-32 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
              >
                <span className="font-display text-6xl font-bold text-white">
                  {countdownValue}
                </span>
              </motion.div>
              <h2 className="font-display text-2xl font-bold text-ink-800">
                Battle starting...
              </h2>
            </motion.div>
          </div>
        );

      case 'playing':
      case 'revealing':
        if (!currentQuestion || !opponent) return null;
        const isRevealed = phase === 'revealing';
        return (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
              {/* Split score header */}
              <div className="flex items-center justify-between mb-4 gap-4">
                <div className="flex-1 text-center p-3 rounded-xl bg-blue-50">
                  <p className="text-sm text-ink-500">You</p>
                  <p className="text-2xl font-bold text-blue-600">{playerScore}</p>
                  {streak >= 3 && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Zap className="w-3.5 h-3.5 text-gold-500" />
                      <span className="text-xs font-medium text-gold-600">{streak} streak</span>
                    </div>
                  )}
                </div>
                <div className="text-ink-300 font-bold text-lg">VS</div>
                <div className="flex-1 text-center p-3 rounded-xl bg-coral-50">
                  <p className="text-sm text-ink-500">{opponent.avatar} {opponent.name}</p>
                  <p className="text-2xl font-bold text-coral-600">{aiScore}</p>
                  {aiThinking && (
                    <motion.div
                      className="flex items-center justify-center gap-1 mt-1"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <span className="text-xs text-ink-400">thinking...</span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-ink-500 mb-2">
                  <span>
                    Question {currentIndex + 1} of {QUESTIONS_PER_BATTLE}
                  </span>
                  <span
                    className={`font-mono ${timeLeft <= 5 ? 'text-coral-600 font-bold' : ''}`}
                  >
                    {timeLeft}s
                  </span>
                </div>
                <Progress value={currentIndex + 1} max={QUESTIONS_PER_BATTLE} variant="gold" />
              </div>

              {/* Question */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="mb-4"
                >
                  <Card className="bg-white">
                    <CardContent className="p-5">
                      <Badge variant="outline" className="mb-3">
                        {currentQuestion.subject}
                      </Badge>
                      <h2 className="font-display text-xl font-semibold text-ink-800 leading-relaxed">
                        {currentQuestion.text}
                      </h2>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {/* Options */}
              <div className="space-y-3 mb-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = isRevealed && currentQuestion.correct_index === index;
                  const isPlayerWrong = isRevealed && isSelected && !isCorrect;
                  const isAiPick = isRevealed && aiAnswer === index;

                  return (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        if (!isRevealed) handlePlayerAnswer(index);
                      }}
                      disabled={isRevealed}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        isCorrect
                          ? 'bg-sage-100 border-2 border-sage-500 ring-2 ring-sage-200'
                          : isPlayerWrong
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
                              : isPlayerWrong
                              ? 'bg-coral-500 text-white'
                              : isSelected
                              ? 'bg-gold-500 text-white'
                              : 'bg-ink-200 text-ink-600'
                          }`}
                        >
                          {isCorrect ? (
                            <Check className="w-6 h-6" />
                          ) : isPlayerWrong ? (
                            <X className="w-6 h-6" />
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </span>
                        <span
                          className={`flex-1 font-medium text-lg ${
                            isCorrect
                              ? 'text-sage-800'
                              : isPlayerWrong
                              ? 'text-coral-800'
                              : 'text-ink-800'
                          }`}
                        >
                          {option}
                        </span>
                        {/* Show who picked what */}
                        {isRevealed && (
                          <div className="flex gap-1">
                            {isSelected && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                            {isAiPick && (
                              <span className="text-xs bg-coral-100 text-coral-700 px-2 py-0.5 rounded-full">
                                {opponent.avatar}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation on wrong */}
              {isRevealed &&
                selectedAnswer !== currentQuestion.correct_index &&
                currentQuestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-sage-50 border border-sage-200 rounded-xl"
                  >
                    <div className="flex items-center gap-2 text-sage-700 font-medium mb-2">
                      <HelpCircle className="w-5 h-5" />
                      <span>
                        Correct: {currentQuestion.options[currentQuestion.correct_index]}
                      </span>
                    </div>
                    <p className="text-ink-700">{currentQuestion.explanation}</p>
                  </motion.div>
                )}

              {/* AI Explanation */}
              {isRevealed && selectedAnswer !== null && (
                <AIExplanation
                  question={currentQuestion}
                  userAnswer={selectedAnswer}
                  wasCorrect={selectedAnswer === currentQuestion.correct_index}
                />
              )}
            </div>
          </div>
        );

      case 'results':
        if (!opponent) return null;
        const playerCorrectCount = battleAnswers.filter((a) => a.playerCorrect).length;
        const aiCorrectCount = battleAnswers.filter((a) => a.aiCorrect).length;
        const playerWon = playerScore > aiScore;
        const tied = playerScore === aiScore;
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md w-full"
            >
              <div
                className={`w-24 h-24 ${
                  playerWon ? 'bg-gold-500' : tied ? 'bg-ink-400' : 'bg-coral-500'
                } rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl`}
              >
                {playerWon ? (
                  <Trophy className="w-12 h-12 text-white" />
                ) : tied ? (
                  <Shield className="w-12 h-12 text-white" />
                ) : (
                  <X className="w-12 h-12 text-white" />
                )}
              </div>

              <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">
                {playerWon ? 'Victory!' : tied ? 'Draw!' : 'Defeat!'}
              </h2>
              <p className="text-lg text-ink-600 mb-6">
                vs {opponent.avatar} {opponent.name}
              </p>

              {/* Score comparison */}
              <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <p className="text-sm text-ink-500 mb-1">You</p>
                    <p className="text-3xl font-bold text-blue-600">{playerScore}</p>
                    <p className="text-xs text-ink-400">{playerCorrectCount}/{QUESTIONS_PER_BATTLE} correct</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-ink-300 font-bold text-xl">VS</span>
                  </div>
                  <div>
                    <p className="text-sm text-ink-500 mb-1">{opponent.name}</p>
                    <p className="text-3xl font-bold text-coral-600">{aiScore}</p>
                    <p className="text-xs text-ink-400">{aiCorrectCount}/{QUESTIONS_PER_BATTLE} correct</p>
                  </div>
                </div>

                {/* Round-by-round */}
                <div className="border-t border-ink-100 pt-4">
                  <p className="text-xs text-ink-400 mb-2">Round by round</p>
                  <div className="flex gap-1 justify-center">
                    {battleAnswers.map((a, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                          a.playerCorrect && !a.aiCorrect
                            ? 'bg-sage-400 text-white'
                            : !a.playerCorrect && a.aiCorrect
                            ? 'bg-coral-400 text-white'
                            : a.playerCorrect && a.aiCorrect
                            ? 'bg-gold-300 text-gold-800'
                            : 'bg-ink-200 text-ink-500'
                        }`}
                        title={`Q${i + 1}: ${a.playerCorrect ? 'You' : ''} ${a.aiCorrect ? 'AI' : ''} correct`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 justify-center mt-2 text-xs text-ink-400">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-sage-400 inline-block" /> You won
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-coral-400 inline-block" /> AI won
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-gold-300 inline-block" /> Both right
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="gold"
                  size="lg"
                  onClick={() => {
                    setPhase('select_opponent');
                    setOpponent(null);
                    setCurrentIndex(0);
                    setPlayerScore(0);
                    setAiScore(0);
                    setSelectedAnswer(null);
                    setAiAnswer(null);
                    setBattleAnswers([]);
                    setStreak(0);
                  }}
                  className="flex-1"
                >
                  Rematch
                </Button>
                <Button variant="secondary" size="lg" onClick={handleExit} className="flex-1">
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
      title="Battle Mode"
      subtitle={
        opponent
          ? `vs ${opponent.avatar} ${opponent.name}`
          : 'Challenge an AI opponent'
      }
      players={displayPlayers}
      currentRound={
        phase === 'playing' || phase === 'revealing' ? currentIndex + 1 : undefined
      }
      totalRounds={QUESTIONS_PER_BATTLE}
      timeRemaining={phase === 'playing' ? timeLeft : undefined}
      showTimer={phase === 'playing'}
      showRound={phase === 'playing' || phase === 'revealing'}
      onBack={handleExit}
    >
      {renderContent()}
    </GameLayout>
  );
}
