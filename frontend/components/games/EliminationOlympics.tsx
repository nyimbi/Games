'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Trophy, Heart, ChevronRight, RotateCcw,
  ArrowLeft, Zap, Medal, Flame, Star, Skull,
} from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { useSounds } from '@/lib/hooks/useSounds';
import { updatePlayerStats, checkAchievements } from '@/lib/games/achievements';
import { useAchievementToast } from '@/components/ui/AchievementToast';
import { getMixedQuestions } from '@/lib/games/questions';
import { type Question } from '@/lib/games/types';

interface EliminationOlympicsProps {
  onExit?: () => void;
}

type Phase = 'intro' | 'round_intro' | 'playing' | 'round_result' | 'eliminated' | 'result';

const QUESTIONS_PER_ROUND = 5;
const TOTAL_LIVES = 3;
const ROUND_CONFIGS = [
  { name: 'Qualifying Round', difficulty: 'easy' as const, timer: 20, color: 'sage' },
  { name: 'Semi-Finals', difficulty: 'medium' as const, timer: 15, color: 'gold' },
  { name: 'Grand Finals', difficulty: 'hard' as const, timer: 10, color: 'coral' },
];

interface RoundResult {
  correct: number;
  total: number;
  livesLost: number;
}

export function EliminationOlympics({ onExit }: EliminationOlympicsProps) {
  const { play } = useSounds();
  const { showAchievements } = useAchievementToast();

  const [phase, setPhase] = useState<Phase>('intro');
  const [currentRound, setCurrentRound] = useState(0);
  const [lives, setLives] = useState(TOTAL_LIVES);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [roundLivesLost, setRoundLivesLost] = useState(0);
  const [streak, setStreak] = useState(0);

  const config = ROUND_CONFIGS[currentRound] || ROUND_CONFIGS[0];

  useEffect(() => {
    if (phase === 'playing' && !isRevealed && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === 'playing' && !isRevealed && timeLeft === 0) {
      handleAnswer(-1);
    }
  }, [phase, isRevealed, timeLeft]);

  const startGame = useCallback(() => {
    setCurrentRound(0);
    setLives(TOTAL_LIVES);
    setScore(0);
    setRoundResults([]);
    setStreak(0);
    setPhase('round_intro');
    play('powerup');
  }, [play]);

  const startRound = useCallback(() => {
    const roundConfig = ROUND_CONFIGS[currentRound];
    const qs = getMixedQuestions(roundConfig.difficulty, QUESTIONS_PER_ROUND);
    setQuestions(qs);
    setQuestionIndex(0);
    setRoundCorrect(0);
    setRoundLivesLost(0);
    setTimeLeft(roundConfig.timer);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setPhase('playing');
    play('flip');
  }, [currentRound, play]);

  const handleAnswer = useCallback((index: number) => {
    if (isRevealed) return;
    const currentQ = questions[questionIndex];
    const correct = index === currentQ?.correct_index;
    const speedBonus = Math.round((timeLeft / config.timer) * 50);
    const roundMultiplier = currentRound + 1;
    const points = correct ? (100 + speedBonus) * roundMultiplier : 0;

    setSelectedAnswer(index);
    setIsRevealed(true);

    if (correct) {
      play('correct');
      setScore(s => s + points);
      setRoundCorrect(c => c + 1);
      setStreak(s => s + 1);
      if (streak + 1 >= 3) play('streak');
    } else {
      play('wrong');
      setStreak(0);
      const newLives = lives - 1;
      setLives(newLives);
      setRoundLivesLost(l => l + 1);

      if (newLives <= 0) {
        setTimeout(() => {
          setRoundResults(prev => [...prev, { correct: roundCorrect, total: questionIndex + 1, livesLost: roundLivesLost + 1 }]);
          updateStats();
          setPhase('eliminated');
        }, 1500);
        return;
      }
    }
  }, [isRevealed, questions, questionIndex, timeLeft, config.timer, currentRound, lives, play, roundCorrect, roundLivesLost, streak]);

  const nextQuestion = useCallback(() => {
    if (questionIndex + 1 >= QUESTIONS_PER_ROUND) {
      setRoundResults(prev => [...prev, { correct: roundCorrect, total: QUESTIONS_PER_ROUND, livesLost: roundLivesLost }]);
      play('complete');
      setPhase('round_result');
    } else {
      setQuestionIndex(q => q + 1);
      setTimeLeft(config.timer);
      setSelectedAnswer(null);
      setIsRevealed(false);
    }
  }, [questionIndex, roundCorrect, roundLivesLost, config.timer, play]);

  const nextRound = useCallback(() => {
    if (currentRound + 1 >= ROUND_CONFIGS.length) {
      updateStats();
      setPhase('result');
    } else {
      setCurrentRound(r => r + 1);
      setPhase('round_intro');
    }
  }, [currentRound]);

  const updateStats = () => {
    updatePlayerStats(stats => ({
      ...stats,
      gamesPlayed: stats.gamesPlayed + 1,
    }));
    const newAchievements = checkAchievements();
    if (newAchievements.length > 0) showAchievements(newAchievements);
  };

  const getMedal = () => {
    if (currentRound >= 2 && lives > 0) return { label: 'Gold Medal', emoji: '🥇', color: 'bg-gold-500' };
    if (currentRound >= 1) return { label: 'Silver Medal', emoji: '🥈', color: 'bg-ink-300' };
    if (roundResults.length > 0) return { label: 'Bronze Medal', emoji: '🥉', color: 'bg-orange-400' };
    return { label: 'Participant', emoji: '🏅', color: 'bg-ink-400' };
  };

  const currentQ = questions[questionIndex];

  const renderLives = () => (
    <div className="flex gap-1">
      {Array.from({ length: TOTAL_LIVES }).map((_, i) => (
        <motion.div
          key={i}
          animate={i >= lives ? { scale: [1, 0.8], opacity: 0.3 } : {}}
        >
          <Heart
            className={`w-6 h-6 ${i < lives ? 'text-coral-500 fill-coral-500' : 'text-ink-200'}`}
          />
        </motion.div>
      ))}
    </div>
  );

  const renderIntro = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Medal className="w-10 h-10 text-gold-600" />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">Elimination Olympics</h2>
        <p className="text-ink-600 mb-6">
          Survive three rounds of increasing difficulty. Wrong answers cost lives. Can you win the gold medal?
        </p>
        <div className="bg-cream-100 rounded-xl p-4 mb-6 text-left space-y-2 text-sm text-ink-600">
          <p className="flex items-center gap-2"><Shield className="w-4 h-4 text-sage-500" /> Round 1: Easy (20s timer)</p>
          <p className="flex items-center gap-2"><Flame className="w-4 h-4 text-gold-500" /> Round 2: Medium (15s timer)</p>
          <p className="flex items-center gap-2"><Skull className="w-4 h-4 text-coral-500" /> Round 3: Hard (10s timer)</p>
          <p className="flex items-center gap-2"><Heart className="w-4 h-4 text-coral-500 fill-coral-500" /> 3 lives total -- lose all and you are eliminated</p>
        </div>
        <Button variant="gold" size="lg" onClick={startGame} className="w-full">
          <Medal className="w-5 h-5 mr-2" />
          Enter the Arena
        </Button>
      </motion.div>
    </div>
  );

  const renderRoundIntro = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.6 }}
          className={`w-24 h-24 ${config.color === 'sage' ? 'bg-sage-100' : config.color === 'gold' ? 'bg-gold-100' : 'bg-coral-100'} rounded-full flex items-center justify-center mx-auto mb-4`}
        >
          {currentRound === 0 && <Shield className="w-12 h-12 text-sage-600" />}
          {currentRound === 1 && <Flame className="w-12 h-12 text-gold-600" />}
          {currentRound === 2 && <Star className="w-12 h-12 text-coral-600" />}
        </motion.div>
        <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">{config.name}</h2>
        <p className="text-ink-600 mb-2">{QUESTIONS_PER_ROUND} questions -- {config.timer} seconds each</p>
        <div className="mb-6">{renderLives()}</div>
        <Button variant="gold" size="lg" onClick={startRound}>
          <Zap className="w-5 h-5 mr-2" />
          Begin Round
        </Button>
      </motion.div>
    </div>
  );

  const renderPlaying = () => {
    if (!currentQ) return null;
    return (
      <div className="flex-1 flex flex-col p-4 md:p-6">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Badge variant={config.color === 'sage' ? 'sage' : config.color === 'gold' ? 'gold' : 'coral'}>
                {config.name}
              </Badge>
              <span className="text-xs text-ink-400">Q{questionIndex + 1}/{QUESTIONS_PER_ROUND}</span>
            </div>
            <div className="flex items-center gap-3">
              {renderLives()}
              <span className="text-sm font-bold text-gold-600">{score} pts</span>
            </div>
          </div>

          <div className="mb-4">
            <Progress value={questionIndex + 1} max={QUESTIONS_PER_ROUND} variant="gold" />
          </div>

          <Card className="mb-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">{currentQ.subject || 'Mixed'}</Badge>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                  timeLeft <= 5 ? 'bg-coral-100 text-coral-600 animate-pulse' : 'bg-ink-100 text-ink-600'
                }`}>
                  {timeLeft}
                </div>
              </div>
              <h2 className="font-display text-xl font-semibold text-ink-800 leading-relaxed">
                {currentQ.text}
              </h2>
            </CardContent>
          </Card>

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
                  onClick={() => !isRevealed && handleAnswer(index)}
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
                      isCorrect ? 'bg-sage-500 text-white'
                      : isWrong ? 'bg-coral-500 text-white'
                      : isSelected ? 'bg-gold-500 text-white'
                      : 'bg-ink-200 text-ink-600'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className={`flex-1 font-medium text-lg ${
                      isCorrect ? 'text-sage-800' : isWrong ? 'text-coral-800' : 'text-ink-800'
                    }`}>
                      {option}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {isRevealed && lives > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-auto"
            >
              {isRevealed && currentQ.explanation && selectedAnswer !== currentQ.correct_index && (
                <div className="p-3 bg-sage-50 border border-sage-200 rounded-xl mb-3 text-sm text-ink-700">
                  {currentQ.explanation}
                </div>
              )}
              <Button variant="gold" size="lg" onClick={nextQuestion} className="w-full">
                Next Question
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  const renderRoundResult = () => {
    const result = roundResults[roundResults.length - 1];
    if (!result) return null;

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-sage-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">{config.name} Complete!</h2>
          <p className="text-ink-600 mb-4">You survived this round!</p>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-sage-600">{result.correct}/{result.total}</p>
                  <p className="text-xs text-ink-400">Correct</p>
                </div>
                <div>{renderLives()}</div>
                <div>
                  <p className="text-2xl font-bold text-gold-600">{score}</p>
                  <p className="text-xs text-ink-400">Total Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="gold" size="lg" onClick={nextRound} className="w-full">
            {currentRound + 1 >= ROUND_CONFIGS.length ? 'Medal Ceremony' : 'Next Round'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  };

  const renderEliminated = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
          className="w-24 h-24 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Skull className="w-12 h-12 text-coral-500" />
        </motion.div>
        <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Eliminated!</h2>
        <p className="text-ink-600 mb-6">You ran out of lives in {config.name}</p>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-gold-600">{score}</p>
                <p className="text-xs text-ink-400">Final Score</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-ink-700">{getMedal().emoji}</p>
                <p className="text-xs text-ink-400">{getMedal().label}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button variant="gold" size="lg" onClick={startGame} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button variant="secondary" size="lg" onClick={onExit} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit
          </Button>
        </div>
      </motion.div>
    </div>
  );

  const renderResult = () => {
    const medal = getMedal();

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className={`w-28 h-28 ${medal.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl`}
          >
            <span className="text-5xl">{medal.emoji}</span>
          </motion.div>
          <h2 className="font-display text-3xl font-bold text-ink-800 mb-1">{medal.label}!</h2>
          <p className="text-ink-600 mb-6">You completed all rounds of the Elimination Olympics</p>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-3xl font-bold text-gold-600">{score}</p>
                  <p className="text-xs text-ink-400">Total Score</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-sage-600">{lives}/{TOTAL_LIVES}</p>
                  <p className="text-xs text-ink-400">Lives Left</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-ink-700">{roundResults.length}</p>
                  <p className="text-xs text-ink-400">Rounds Cleared</p>
                </div>
              </div>
              <div className="border-t border-ink-100 pt-4 space-y-2">
                {roundResults.map((result, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-ink-600">{ROUND_CONFIGS[i].name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sage-600 font-bold">{result.correct}/{result.total}</span>
                      {result.livesLost > 0 && (
                        <span className="text-coral-500 text-xs">-{result.livesLost} {result.livesLost === 1 ? 'life' : 'lives'}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="gold" size="lg" onClick={startGame} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
            <Button variant="secondary" size="lg" onClick={onExit} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderContent = () => {
    switch (phase) {
      case 'intro': return renderIntro();
      case 'round_intro': return renderRoundIntro();
      case 'playing': return renderPlaying();
      case 'round_result': return renderRoundResult();
      case 'eliminated': return renderEliminated();
      case 'result': return renderResult();
      default: return null;
    }
  };

  return (
    <GameLayout
      title="Elimination Olympics"
      subtitle={phase === 'playing' || phase === 'round_intro' ? config.name : 'Survival Quiz Challenge'}
      players={[{ id: 'player', display_name: 'You', avatar_color: '#7C3AED', score, is_ready: true, is_connected: true }]}
      currentRound={phase === 'playing' ? questionIndex + 1 : undefined}
      totalRounds={QUESTIONS_PER_ROUND}
      timeRemaining={phase === 'playing' && !isRevealed ? timeLeft : undefined}
      showTimer={phase === 'playing' && !isRevealed}
      showRound={phase === 'playing'}
      onBack={onExit}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={phase + currentRound + questionIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex flex-col"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </GameLayout>
  );
}
