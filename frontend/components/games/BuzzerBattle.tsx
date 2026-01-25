'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Check, X, HelpCircle } from 'lucide-react';
import { Button, Buzzer, Card, CardContent, Badge, Avatar, TimerDisplay } from '@/components/ui';
import { GameLayout, WaitingRoom, Countdown, GameOver } from './GameLayout';
import { useGameState, useGameTimer } from '@/lib/hooks/useGameState';
import { type GamePlayer, type Question } from '@/lib/games/types';

interface BuzzerBattleProps {
  sessionId: string;
  isHost?: boolean;
  onExit?: () => void;
}

export function BuzzerBattle({ sessionId, isHost = false, onExit }: BuzzerBattleProps) {
  const {
    phase,
    players,
    currentQuestion,
    timeRemaining,
    currentRound,
    totalRounds,
    buzzedPlayerId,
    canBuzz,
    answersSubmitted,
    revealed,
    finalScores,
    winnerId,
    joinSession,
    leaveSession,
    buzz,
    submitAnswer,
    markReady,
  } = useGameState();

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);

  // Join session on mount
  useEffect(() => {
    joinSession(sessionId);
    return () => leaveSession();
  }, [sessionId, joinSession, leaveSession]);

  // Countdown effect
  useEffect(() => {
    if (phase === 'countdown' && countdownValue > 0) {
      const timer = setTimeout(() => setCountdownValue(countdownValue - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, countdownValue]);

  const handleBuzz = useCallback(() => {
    if (canBuzz) {
      buzz();
    }
  }, [canBuzz, buzz]);

  const handleAnswerSelect = (index: number) => {
    if (buzzedPlayerId && !revealed) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer !== null) {
      submitAnswer(selectedAnswer);
    }
  };

  const handleExit = () => {
    leaveSession();
    onExit?.();
  };

  // Get buzzed player info
  const buzzedPlayer = players.find((p) => p.id === buzzedPlayerId);

  // Render based on phase
  const renderContent = () => {
    switch (phase) {
      case 'waiting':
        return (
          <WaitingRoom
            players={players}
            minPlayers={2}
            isHost={isHost}
            gameName="Buzzer Battle"
          />
        );

      case 'countdown':
        return <Countdown count={countdownValue} gameName="Buzzer Battle" />;

      case 'playing':
      case 'answering':
      case 'revealing':
      case 'scoring':
        return (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
              {/* Question Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline">{currentQuestion?.subject || 'General'}</Badge>
                      <TimerDisplay
                        time={timeRemaining}
                        maxTime={currentQuestion?.time_limit_seconds || 30}
                        size={48}
                      />
                    </div>
                    <h2 className="font-display text-xl md:text-2xl font-semibold text-ink-800 leading-relaxed">
                      {currentQuestion?.text}
                    </h2>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Answer Options */}
              {currentQuestion && (
                <div className="space-y-3 mb-6">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = revealed && currentQuestion.correct_index === index;
                    const isWrong = revealed && isSelected && !isCorrect;
                    const isDisabled = phase === 'playing' || (phase !== 'answering' && !revealed);

                    return (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={isDisabled}
                        className={`w-full p-4 rounded-xl text-left transition-all ${
                          isCorrect
                            ? 'bg-sage-100 border-2 border-sage-500 ring-2 ring-sage-200'
                            : isWrong
                            ? 'bg-coral-100 border-2 border-coral-500 ring-2 ring-coral-200'
                            : isSelected
                            ? 'bg-gold-100 border-2 border-gold-500'
                            : 'bg-cream-100 border-2 border-transparent hover:border-ink-300'
                        } ${isDisabled && !revealed ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                            isCorrect
                              ? 'bg-sage-500 text-white'
                              : isWrong
                              ? 'bg-coral-500 text-white'
                              : isSelected
                              ? 'bg-gold-500 text-white'
                              : 'bg-ink-200 text-ink-600'
                          }`}>
                            {isCorrect ? (
                              <Check className="w-5 h-5" />
                            ) : isWrong ? (
                              <X className="w-5 h-5" />
                            ) : (
                              String.fromCharCode(65 + index)
                            )}
                          </span>
                          <span className={`flex-1 font-medium ${
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

              {/* Explanation (after reveal) */}
              {revealed && currentQuestion?.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6"
                >
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
                        {currentQuestion.explanation}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Buzzer Status / Submit Button */}
              <div className="mt-auto">
                {phase === 'playing' && (
                  <div className="text-center">
                    <p className="text-ink-600 mb-4">First to buzz gets to answer!</p>
                    <Buzzer
                      onBuzz={handleBuzz}
                      enabled={canBuzz}
                      size="lg"
                    />
                  </div>
                )}

                {phase === 'answering' && buzzedPlayer && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Avatar
                        name={buzzedPlayer.display_name}
                        color={buzzedPlayer.avatar_color}
                        size="sm"
                      />
                      <span className="font-semibold text-ink-800">
                        {buzzedPlayer.display_name}
                      </span>
                      <Badge variant="gold">buzzed!</Badge>
                    </div>

                    {buzzedPlayerId === players.find((p) => p.is_connected)?.id ? (
                      <Button
                        variant="gold"
                        size="lg"
                        onClick={handleSubmitAnswer}
                        disabled={selectedAnswer === null}
                        className="w-full max-w-xs"
                      >
                        Submit Answer
                      </Button>
                    ) : (
                      <p className="text-ink-500">Waiting for their answer...</p>
                    )}
                  </div>
                )}

                {phase === 'revealing' && (
                  <div className="text-center">
                    <p className="text-lg font-medium text-ink-700">
                      {answersSubmitted[buzzedPlayerId || ''] === currentQuestion?.correct_index
                        ? '✅ Correct!'
                        : '❌ Wrong answer'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'ended':
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

  return (
    <GameLayout
      title="Buzzer Battle"
      subtitle="First to buzz, first to answer!"
      players={players}
      currentRound={currentRound}
      totalRounds={totalRounds}
      timeRemaining={phase === 'playing' || phase === 'answering' ? timeRemaining : undefined}
      showTimer={phase === 'playing' || phase === 'answering'}
      showRound={phase !== 'waiting' && phase !== 'countdown' && phase !== 'ended'}
      onBack={handleExit}
    >
      {renderContent()}
    </GameLayout>
  );
}
