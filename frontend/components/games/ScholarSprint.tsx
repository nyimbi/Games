'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Heart, Zap, Trophy, ArrowRight, Snowflake, Flame, RotateCcw, LogOut, Share2, Copy, Check } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { useSounds } from '@/lib/hooks/useSounds';
import { updatePlayerStats, checkAchievements, getPlayerStats } from '@/lib/games/achievements';
import { useAchievementToast } from '@/components/ui/AchievementToast';
import { getMixedQuestions } from '@/lib/games/questions';
import { recordWrongAnswer } from '@/lib/games/wrongAnswerJournal';
import { getStorage, setStorage, STORAGE_KEYS } from '@/lib/storage';
import type { Question } from '@/lib/games/types';
import {
  type PowerUpType,
  type SprintBest,
  POWER_UPS,
  getTimeLimit,
  getMultiplier,
  getDistancePerQuestion,
  getRandomPowerUpPair,
} from '@/lib/games/scholarSprint';

interface ScholarSprintProps {
  onExit?: () => void;
}

type Phase = 'ready' | 'playing' | 'power_up_select' | 'game_over';

const MILESTONE_BADGES = [
  { distance: 100, icon: '🏃', label: '100m' },
  { distance: 500, icon: '🏃‍♂️', label: '500m' },
  { distance: 1000, icon: '🏅', label: '1000m' },
];

const DEFAULT_BEST: SprintBest = { distance: 0, questionsAnswered: 0, longestStreak: 0, date: '' };

export function ScholarSprint({ onExit }: ScholarSprintProps) {
  const sounds = useSounds();
  const { showAchievements } = useAchievementToast();

  const [phase, setPhase] = useState<Phase>('ready');
  const [lives, setLives] = useState(3);
  const [distance, setDistance] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [powerUpsUsed, setPowerUpsUsed] = useState(0);
  const [inventory, setInventory] = useState<PowerUpType[]>([]);
  const [powerUpChoices, setPowerUpChoices] = useState<[PowerUpType, PowerUpType]>(['skip', 'fifty_fifty']);
  const [eliminatedIndices, setEliminatedIndices] = useState<number[]>([]);
  const [isNewBest, setIsNewBest] = useState(false);
  const [best, setBest] = useState<SprintBest>(DEFAULT_BEST);
  const [showExplanation, setShowExplanation] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Question state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(15);
  const [timeLimit, setTimeLimitVal] = useState(15);
  const [timeFrozen, setTimeFrozen] = useState(false);
  const timeFreezeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const correctSinceLastPowerUp = useRef(0);

  const currentQuestion = questions[questionIndex] ?? null;
  const multiplier = getMultiplier(streak);

  // Load personal best on mount
  useEffect(() => {
    setBest(getStorage<SprintBest>(STORAGE_KEYS.SCHOLAR_SPRINT_BEST, DEFAULT_BEST));
  }, []);

  // Load questions batch
  const loadQuestions = useCallback(() => {
    const batch = getMixedQuestions(undefined, 50);
    setQuestions(batch);
    setQuestionIndex(0);
  }, []);

  // Timer tick
  useEffect(() => {
    if (phase !== 'playing' || revealed || timeFrozen) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 0.1), 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft, revealed, timeFrozen]);

  const advanceQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setRevealed(false);
    setEliminatedIndices([]);
    setShowExplanation(null);
    const nextIdx = questionIndex + 1;
    if (nextIdx >= questions.length) {
      const batch = getMixedQuestions(undefined, 50);
      setQuestions(batch);
      setQuestionIndex(0);
    } else {
      setQuestionIndex(nextIdx);
    }
    const limit = getTimeLimit(distance);
    setTimeLimitVal(limit);
    setTimeLeft(limit);
  }, [questionIndex, questions.length, distance]);

  const handleTimeout = useCallback(() => {
    if (!currentQuestion) return;
    setRevealed(true);
    sounds.play('wrong');
    setLives((l) => l - 1);
    setStreak(0);
    correctSinceLastPowerUp.current = 0;
    recordWrongAnswer(
      currentQuestion.id,
      currentQuestion.text,
      currentQuestion.subject,
      'Time expired',
      currentQuestion.options[currentQuestion.correct_index],
      currentQuestion.explanation,
      currentQuestion.deep_explanation
    );
    setQuestionsAnswered((q) => q + 1);
    if (currentQuestion.explanation) {
      setShowExplanation(currentQuestion.explanation);
    }
    setTimeout(() => {
      if (lives - 1 <= 0) {
        endGame();
      } else {
        advanceQuestion();
      }
    }, currentQuestion.explanation ? 2500 : 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, lives, advanceQuestion, sounds]);

  const handleAnswer = useCallback(
    (idx: number) => {
      if (revealed || !currentQuestion || selectedAnswer !== null) return;
      setSelectedAnswer(idx);
      setRevealed(true);
      setQuestionsAnswered((q) => q + 1);

      if (idx === currentQuestion.correct_index) {
        sounds.play('correct');
        const newStreak = streak + 1;
        setStreak(newStreak);
        setLongestStreak((ls) => Math.max(ls, newStreak));
        setCorrectCount((c) => c + 1);
        const mult = getMultiplier(newStreak);
        setDistance((d) => d + getDistancePerQuestion(mult.value));
        correctSinceLastPowerUp.current += 1;

        setTimeout(() => {
          if (correctSinceLastPowerUp.current >= 10) {
            correctSinceLastPowerUp.current = 0;
            setPowerUpChoices(getRandomPowerUpPair());
            setPhase('power_up_select');
          } else {
            advanceQuestion();
          }
        }, 600);
      } else {
        sounds.play('wrong');
        setStreak(0);
        correctSinceLastPowerUp.current = 0;
        setLives((l) => l - 1);
        recordWrongAnswer(
          currentQuestion.id,
          currentQuestion.text,
          currentQuestion.subject,
          currentQuestion.options[idx],
          currentQuestion.options[currentQuestion.correct_index],
          currentQuestion.explanation,
          currentQuestion.deep_explanation
        );
        if (currentQuestion.explanation) {
          setShowExplanation(currentQuestion.explanation);
        }
        setTimeout(() => {
          if (lives - 1 <= 0) {
            endGame();
          } else {
            advanceQuestion();
          }
        }, currentQuestion.explanation ? 2500 : 800);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revealed, currentQuestion, selectedAnswer, streak, lives, advanceQuestion, sounds]
  );

  const startSprint = useCallback(() => {
    setPhase('playing');
    setLives(3);
    setDistance(0);
    setStreak(0);
    setLongestStreak(0);
    setQuestionsAnswered(0);
    setCorrectCount(0);
    setPowerUpsUsed(0);
    setInventory([]);
    setEliminatedIndices([]);
    setIsNewBest(false);
    setSelectedAnswer(null);
    setRevealed(false);
    correctSinceLastPowerUp.current = 0;
    loadQuestions();
    const limit = getTimeLimit(0);
    setTimeLimitVal(limit);
    setTimeLeft(limit);
  }, [loadQuestions]);

  const endGame = useCallback(() => {
    setPhase('game_over');
    if (timeFreezeTimeout.current) clearTimeout(timeFreezeTimeout.current);
    setTimeFrozen(false);

    const currentBest = getStorage<SprintBest>(STORAGE_KEYS.SCHOLAR_SPRINT_BEST, DEFAULT_BEST);
    if (distance > currentBest.distance) {
      const newBest: SprintBest = {
        distance,
        questionsAnswered,
        longestStreak,
        date: new Date().toISOString(),
      };
      setStorage(STORAGE_KEYS.SCHOLAR_SPRINT_BEST, newBest);
      setBest(newBest);
      setIsNewBest(true);
    }

    const updated = updatePlayerStats((s) => ({
      ...s,
      gamesPlayed: s.gamesPlayed + 1,
      totalQuestionsAnswered: s.totalQuestionsAnswered + questionsAnswered,
      correctAnswers: s.correctAnswers + correctCount,
      longestStreak: Math.max(s.longestStreak, longestStreak),
    }));
    const newAchievements = checkAchievements(updated);
    if (newAchievements.length > 0) {
      sounds.play('achievement');
      showAchievements(newAchievements);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distance, questionsAnswered, correctCount, longestStreak, sounds, showAchievements]);

  const selectPowerUp = useCallback(
    (type: PowerUpType) => {
      sounds.play('powerup');
      setInventory((inv) => [...inv, type]);
      setPhase('playing');
      advanceQuestion();
    },
    [sounds, advanceQuestion]
  );

  const usePowerUp = useCallback(
    (type: PowerUpType) => {
      const idx = inventory.indexOf(type);
      if (idx === -1) return;
      setInventory((inv) => {
        const next = [...inv];
        next.splice(idx, 1);
        return next;
      });
      setPowerUpsUsed((p) => p + 1);

      switch (type) {
        case 'skip':
          advanceQuestion();
          break;
        case 'fifty_fifty': {
          if (!currentQuestion) break;
          const wrong = currentQuestion.options
            .map((_, i) => i)
            .filter((i) => i !== currentQuestion.correct_index && !eliminatedIndices.includes(i));
          const shuffled = [...wrong].sort(() => Math.random() - 0.5);
          setEliminatedIndices((prev) => [...prev, shuffled[0], shuffled[1]]);
          break;
        }
        case 'extra_life':
          setLives((l) => Math.min(5, l + 1));
          break;
        case 'time_freeze':
          setTimeFrozen(true);
          if (timeFreezeTimeout.current) clearTimeout(timeFreezeTimeout.current);
          timeFreezeTimeout.current = setTimeout(() => setTimeFrozen(false), 10000);
          break;
      }
    },
    [inventory, advanceQuestion, currentQuestion, eliminatedIndices]
  );

  // Cleanup time freeze on unmount
  useEffect(() => {
    return () => {
      if (timeFreezeTimeout.current) clearTimeout(timeFreezeTimeout.current);
    };
  }, []);

  const timerPct = timeLimit > 0 ? (timeLeft / timeLimit) * 100 : 0;
  const timerColor = timerPct > 50 ? 'bg-sage-500' : timerPct > 25 ? 'bg-gold-500' : 'bg-coral-500';
  const accuracy = questionsAnswered > 0 ? Math.round((correctCount / questionsAnswered) * 100) : 0;
  const earnedMilestones = MILESTONE_BADGES.filter((m) => distance >= m.distance);

  const shareText = `\u{1F3C3} Scholar Sprint\n\u{1F4CF} ${distance}m\n\u{1F3AF} ${accuracy}% accuracy\n\u{1F525} ${longestStreak} best streak\n${earnedMilestones.map(m => m.icon).join('')}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // ── READY PHASE ──
  if (phase === 'ready') {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="space-y-2">
            <div className="text-6xl">🏃</div>
            <h1 className="font-display text-3xl font-bold text-ink-900">Scholar Sprint</h1>
            <p className="text-ink-600">Answer fast, run far. How far can you go?</p>
          </div>

          {best.distance > 0 && (
            <Card className="border-gold-200 bg-gold-50">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-gold-700 uppercase tracking-wider">Personal Best</p>
                <p className="text-3xl font-display font-bold text-gold-600">{best.distance}m</p>
                <div className="flex justify-center gap-4 mt-2 text-sm text-ink-500">
                  <span>{best.questionsAnswered} questions</span>
                  <span>{best.longestStreak} streak</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <Button onClick={startSprint} className="w-full bg-ink-900 hover:bg-ink-800 text-cream-50 text-lg py-6">
              <Play className="w-5 h-5 mr-2" /> Start Sprint
            </Button>
            {onExit && (
              <Button variant="secondary" onClick={onExit} className="w-full">
                <LogOut className="w-4 h-4 mr-2" /> Exit
              </Button>
            )}
          </div>

          <div className="text-xs text-ink-400 space-y-1">
            <p>3 lives. Timer gets faster as you go.</p>
            <p>Every 10 correct answers earns a power-up!</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── POWER-UP SELECT PHASE ──
  if (phase === 'power_up_select') {
    return (
      <div className="fixed inset-0 z-50 bg-ink-900/80 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="max-w-lg w-full text-center space-y-6"
        >
          <div>
            <p className="text-gold-400 font-semibold text-sm uppercase tracking-wider">Power-Up!</p>
            <h2 className="font-display text-2xl font-bold text-cream-50">Choose your reward</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {powerUpChoices.map((type) => {
              const pu = POWER_UPS[type];
              return (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectPowerUp(type)}
                  className="bg-cream-50 rounded-xl p-6 text-center space-y-3 shadow-lg hover:ring-2 hover:ring-gold-400 transition-shadow"
                >
                  <div className="text-4xl">{pu.icon}</div>
                  <p className="font-display font-bold text-ink-900">{pu.name}</p>
                  <p className="text-sm text-ink-500">{pu.description}</p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── GAME OVER PHASE ──
  if (phase === 'game_over') {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="space-y-2">
            <Trophy className="w-12 h-12 mx-auto text-gold-500" />
            <h2 className="font-display text-3xl font-bold text-ink-900">Sprint Over!</h2>
          </div>

          <div className="space-y-1">
            <p className="text-5xl font-display font-bold text-ink-900">{distance}m</p>
            {isNewBest && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Badge className="bg-gold-100 text-gold-700 border-gold-300 text-sm px-3 py-1">
                  NEW BEST!
                </Badge>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-ink-900">{questionsAnswered}</p>
                <p className="text-xs text-ink-500">Questions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-ink-900">{accuracy}%</p>
                <p className="text-xs text-ink-500">Accuracy</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-ink-900">{longestStreak}</p>
                <p className="text-xs text-ink-500">Best Streak</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-ink-900">{powerUpsUsed}</p>
                <p className="text-xs text-ink-500">Power-Ups Used</p>
              </CardContent>
            </Card>
          </div>

          {earnedMilestones.length > 0 && (
            <div className="flex justify-center gap-3">
              {earnedMilestones.map((m) => (
                <div key={m.distance} className="flex flex-col items-center gap-1">
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-xs text-ink-500 font-medium">{m.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Button
              variant="secondary"
              onClick={handleCopy}
              className="w-full"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Share Results'}
            </Button>
            <Button onClick={startSprint} className="w-full bg-ink-900 hover:bg-ink-800 text-cream-50">
              <RotateCcw className="w-4 h-4 mr-2" /> Sprint Again
            </Button>
            {onExit && (
              <Button variant="secondary" onClick={onExit} className="w-full">
                <LogOut className="w-4 h-4 mr-2" /> Exit
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── PLAYING PHASE ──
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Top bar */}
      <div className="p-3 space-y-2 border-b border-cream-200">
        {/* Distance bar */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-ink-700 min-w-[60px]">{distance}m</span>
          <div className="flex-1 h-3 bg-cream-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gold-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (distance % 1000) / 10)}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            />
          </div>
        </div>

        {/* Lives + streak */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-lg">{i < lives ? '❤️' : '🤍'}</span>
            ))}
          </div>

          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1"
            >
              <motion.span
                animate={streak >= 10 ? { rotate: [0, -5, 5, 0], scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-lg"
              >
                <Flame
                  className={`w-5 h-5 ${
                    multiplier.tier === 'rainbow'
                      ? 'text-purple-500'
                      : multiplier.tier === 'flame'
                        ? 'text-coral-500'
                        : multiplier.tier === 'gold'
                          ? 'text-gold-500'
                          : 'text-ink-400'
                  }`}
                />
              </motion.span>
              <span className="text-sm font-bold text-ink-700">{streak}</span>
              {multiplier.value > 1 && (
                <Badge
                  className={`text-xs px-1.5 py-0 ${
                    multiplier.tier === 'rainbow'
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300'
                      : multiplier.tier === 'flame'
                        ? 'bg-coral-100 text-coral-700 border-coral-300'
                        : 'bg-gold-100 text-gold-700 border-gold-300'
                  }`}
                >
                  x{multiplier.value}
                </Badge>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Timer bar */}
      <div className="relative h-2">
        <motion.div
          className={`h-full ${timeFrozen ? 'bg-blue-400' : timerColor} transition-colors`}
          style={{ width: `${Math.max(0, timerPct)}%` }}
        />
        {timeFrozen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute right-2 -top-1"
          >
            <Snowflake className="w-4 h-4 text-blue-500" />
          </motion.div>
        )}
      </div>

      {/* Question area */}
      <div className="flex-1 flex flex-col justify-center p-4 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs">
                  {currentQuestion.subject}
                </Badge>
                <p className="text-lg font-semibold text-ink-900 leading-snug">
                  {currentQuestion.text}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options.map((option, i) => {
                  const isEliminated = eliminatedIndices.includes(i);
                  const isSelected = selectedAnswer === i;
                  const isCorrect = i === currentQuestion.correct_index;
                  let btnClass = 'bg-white border-cream-300 text-ink-800 hover:border-ink-400';
                  if (revealed) {
                    if (isCorrect) btnClass = 'bg-sage-100 border-sage-400 text-sage-800';
                    else if (isSelected) btnClass = 'bg-coral-100 border-coral-400 text-coral-800';
                  }
                  if (isEliminated) btnClass = 'bg-cream-100 border-cream-200 text-cream-400 cursor-not-allowed';

                  return (
                    <motion.button
                      key={i}
                      whileTap={!revealed && !isEliminated ? { scale: 0.95 } : {}}
                      onClick={() => !isEliminated && handleAnswer(i)}
                      disabled={revealed || isEliminated}
                      className={`p-3 rounded-xl border-2 text-sm font-medium text-left transition-colors ${btnClass}`}
                    >
                      {option}
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="p-3 bg-coral-50 rounded-xl border border-coral-200">
                      <p className="text-xs font-semibold text-coral-600 mb-1">Why?</p>
                      <p className="text-sm text-ink-700">{showExplanation}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Power-up inventory */}
      {inventory.length > 0 && (
        <div className="p-3 border-t border-cream-200">
          <div className="flex gap-2 justify-center">
            {inventory.map((type, i) => {
              const pu = POWER_UPS[type];
              return (
                <motion.button
                  key={`${type}-${i}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => usePowerUp(type)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-cream-300 shadow-sm hover:shadow-md transition-shadow"
                  title={pu.description}
                >
                  <span className="text-lg">{pu.icon}</span>
                  <span className="text-xs font-medium text-ink-600">{pu.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
