'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Clock, Play, Pause, RotateCcw, Trophy, Lightbulb, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';

interface ImpromptuChallengeProps {
  sessionId?: string;
  isHost?: boolean;
  onExit?: () => void;
}

interface Topic {
  id: string;
  category: string;
  topic: string;
  hints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

// Speaking topics organized by category
const TOPICS: Topic[] = [
  // Personal/Opinion
  {
    id: 'topic-1',
    category: 'Opinion',
    topic: 'What superpower would you want and why?',
    hints: ['Think about how you would use it', 'Consider both benefits and challenges', 'Give a specific example'],
    difficulty: 'easy',
  },
  {
    id: 'topic-2',
    category: 'Opinion',
    topic: 'Should students have homework on weekends?',
    hints: ['Consider both sides of the argument', 'Think about balance and free time', 'What would you prefer and why?'],
    difficulty: 'easy',
  },
  {
    id: 'topic-3',
    category: 'Opinion',
    topic: 'What makes a good friend?',
    hints: ['Think of qualities you value', 'Give examples from your experience', 'What do you offer as a friend?'],
    difficulty: 'easy',
  },
  // Explain
  {
    id: 'topic-4',
    category: 'Explain',
    topic: 'How do you make your favorite food?',
    hints: ['Start with ingredients', 'Explain step by step', 'Share why you like it'],
    difficulty: 'easy',
  },
  {
    id: 'topic-5',
    category: 'Explain',
    topic: 'How does the water cycle work?',
    hints: ['Evaporation, condensation, precipitation', 'Use simple language', 'Give real-world examples'],
    difficulty: 'medium',
  },
  {
    id: 'topic-6',
    category: 'Explain',
    topic: 'Why is recycling important?',
    hints: ['Environmental impact', 'Resources and waste', 'What individuals can do'],
    difficulty: 'medium',
  },
  // Persuade
  {
    id: 'topic-7',
    category: 'Persuade',
    topic: 'Convince someone to try your favorite hobby',
    hints: ['What makes it fun?', 'Why should they care?', 'How can they start?'],
    difficulty: 'medium',
  },
  {
    id: 'topic-8',
    category: 'Persuade',
    topic: 'Why should people read more books?',
    hints: ['Benefits of reading', 'Types of books available', 'Personal stories'],
    difficulty: 'medium',
  },
  {
    id: 'topic-9',
    category: 'Persuade',
    topic: 'Why is learning a second language valuable?',
    hints: ['Career benefits', 'Cultural understanding', 'Brain development'],
    difficulty: 'hard',
  },
  // Hypothetical
  {
    id: 'topic-10',
    category: 'Hypothetical',
    topic: 'If you could travel anywhere in time, where would you go?',
    hints: ['Pick a specific time period', 'What would you want to see?', 'What would you learn?'],
    difficulty: 'medium',
  },
  {
    id: 'topic-11',
    category: 'Hypothetical',
    topic: 'If you could invent anything, what would it be?',
    hints: ['What problem does it solve?', 'How would it work?', 'Who would benefit?'],
    difficulty: 'medium',
  },
  {
    id: 'topic-12',
    category: 'Hypothetical',
    topic: 'What would you do if you were principal for a day?',
    hints: ['What changes would you make?', 'How would students benefit?', 'Why these changes?'],
    difficulty: 'easy',
  },
  // WSC-Style
  {
    id: 'topic-13',
    category: 'WSC',
    topic: 'Technology does more harm than good.',
    hints: ['Consider multiple perspectives', 'Use specific examples', 'Acknowledge counterarguments'],
    difficulty: 'hard',
  },
  {
    id: 'topic-14',
    category: 'WSC',
    topic: 'Art is essential for human civilization.',
    hints: ['Define what art means', 'Historical examples', 'Modern relevance'],
    difficulty: 'hard',
  },
  {
    id: 'topic-15',
    category: 'WSC',
    topic: 'Space exploration should be a global priority.',
    hints: ['Scientific benefits', 'Resource considerations', 'Future of humanity'],
    difficulty: 'hard',
  },
];

const PHASES = ['prep', 'speaking', 'reflection'] as const;
type Phase = typeof PHASES[number];

/**
 * ImpromptuChallenge - Quick speaking practice
 * Draw a topic and speak on it for a set time
 */
export function ImpromptuChallenge({ sessionId, isHost = false, onExit }: ImpromptuChallengeProps) {
  const [state, setState] = useState({
    gamePhase: 'waiting' as 'waiting' | 'playing' | 'ended',
    phase: 'prep' as Phase,
    currentTopic: null as Topic | null,
    prepTime: 30,
    speakTime: 60,
    timeLeft: 30,
    isPaused: false,
    completedTopics: 0,
    showHints: false,
    totalScore: 0,
    selfRating: 0,
  });

  // Timer
  useEffect(() => {
    if (state.gamePhase === 'playing' && !state.isPaused && state.timeLeft > 0) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (state.gamePhase === 'playing' && state.timeLeft === 0) {
      // Move to next phase
      if (state.phase === 'prep') {
        setState((prev) => ({
          ...prev,
          phase: 'speaking',
          timeLeft: prev.speakTime,
          showHints: false,
        }));
      } else if (state.phase === 'speaking') {
        setState((prev) => ({
          ...prev,
          phase: 'reflection',
        }));
      }
    }
  }, [state.gamePhase, state.isPaused, state.timeLeft, state.phase]);

  const handleStart = () => {
    const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    setState((prev) => ({
      ...prev,
      gamePhase: 'playing',
      phase: 'prep',
      currentTopic: randomTopic,
      timeLeft: prev.prepTime,
      isPaused: false,
      showHints: false,
      selfRating: 0,
    }));
  };

  const handleTogglePause = () => {
    setState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleSkipPrep = () => {
    setState((prev) => ({
      ...prev,
      phase: 'speaking',
      timeLeft: prev.speakTime,
      showHints: false,
    }));
  };

  const handleToggleHints = () => {
    setState((prev) => ({ ...prev, showHints: !prev.showHints }));
  };

  const handleFinishEarly = () => {
    if (state.phase === 'speaking') {
      setState((prev) => ({
        ...prev,
        phase: 'reflection',
      }));
    }
  };

  const handleSelfRate = (rating: number) => {
    setState((prev) => ({ ...prev, selfRating: rating }));
  };

  const handleNextTopic = () => {
    const points = state.selfRating * 20; // 20-100 points based on self-rating
    const newTotal = state.totalScore + points;
    const newCompleted = state.completedTopics + 1;

    if (newCompleted >= 3) {
      // End after 3 topics
      setState((prev) => ({
        ...prev,
        gamePhase: 'ended',
        totalScore: newTotal,
        completedTopics: newCompleted,
      }));
    } else {
      const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      setState((prev) => ({
        ...prev,
        phase: 'prep',
        currentTopic: randomTopic,
        timeLeft: prev.prepTime,
        isPaused: false,
        showHints: false,
        selfRating: 0,
        totalScore: newTotal,
        completedTopics: newCompleted,
      }));
    }
  };

  const handleRestart = () => {
    setState((prev) => ({
      ...prev,
      gamePhase: 'waiting',
      phase: 'prep',
      currentTopic: null,
      completedTopics: 0,
      totalScore: 0,
      selfRating: 0,
    }));
  };

  const handleExit = () => {
    onExit?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-sage-100 text-sage-700';
      case 'medium': return 'bg-gold-100 text-gold-700';
      case 'hard': return 'bg-coral-100 text-coral-700';
      default: return 'bg-ink-100 text-ink-700';
    }
  };

  const renderContent = () => {
    switch (state.gamePhase) {
      case 'waiting':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mic className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
                Impromptu Challenge
              </h2>
              <p className="text-ink-600 mb-4">
                Practice quick thinking and speaking skills
              </p>
              <div className="bg-paper-100 rounded-xl p-4 mb-8 text-left">
                <h4 className="font-semibold text-ink-700 mb-2">How it works:</h4>
                <ul className="text-sm text-ink-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    <span><strong>30 seconds</strong> to prepare your thoughts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    <span><strong>60 seconds</strong> to speak on the topic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    <span>Rate yourself and get <strong>3 topics</strong> total</span>
                  </li>
                </ul>
              </div>
              <Button variant="gold" size="lg" onClick={handleStart}>
                Draw First Topic
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
                  <span>Topic {state.completedTopics + 1} of 3</span>
                  <span>Score: <strong className="text-gold-600">{state.totalScore}</strong></span>
                </div>
                <Progress value={state.completedTopics + 1} max={3} variant="coral" />
              </div>

              {/* Phase indicator */}
              <div className="flex justify-center gap-2 mb-6">
                {PHASES.slice(0, 2).map((phase, index) => (
                  <div
                    key={phase}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                      state.phase === phase
                        ? 'bg-purple-500 text-white'
                        : index < PHASES.indexOf(state.phase)
                        ? 'bg-sage-100 text-sage-700'
                        : 'bg-ink-100 text-ink-500'
                    }`}
                  >
                    {phase === 'prep' ? '📝 Prep' : '🎤 Speak'}
                  </div>
                ))}
              </div>

              {/* Topic Card */}
              <Card className="mb-6 flex-1">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={getDifficultyColor(state.currentTopic?.difficulty || 'medium')}>
                      {state.currentTopic?.difficulty?.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">{state.currentTopic?.category}</Badge>
                  </div>

                  {/* Topic */}
                  <div className="flex-1 flex items-center justify-center">
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-display text-xl md:text-2xl text-ink-800 text-center leading-relaxed"
                    >
                      {state.currentTopic?.topic}
                    </motion.p>
                  </div>

                  {/* Hints */}
                  <AnimatePresence>
                    {state.showHints && state.phase === 'prep' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                      >
                        <div className="bg-gold-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-gold-500" />
                            <span className="font-medium text-gold-800 text-sm">Helpful Hints</span>
                          </div>
                          <ul className="text-sm text-gold-700 space-y-1">
                            {state.currentTopic?.hints.map((hint, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-gold-400">•</span>
                                <span>{hint}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Timer & Actions */}
              {state.phase !== 'reflection' && (
                <div className="space-y-4">
                  {/* Big Timer */}
                  <div className="text-center">
                    <div
                      className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${
                        state.timeLeft < 10 ? 'bg-coral-100' : 'bg-purple-100'
                      }`}
                    >
                      <span
                        className={`text-4xl font-bold font-mono ${
                          state.timeLeft < 10 ? 'text-coral-600 animate-pulse' : 'text-purple-600'
                        }`}
                      >
                        {formatTime(state.timeLeft)}
                      </span>
                    </div>
                    <p className="text-ink-500 mt-2">
                      {state.phase === 'prep' ? 'Preparation Time' : 'Speaking Time'}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex justify-center gap-4">
                    {state.phase === 'prep' && (
                      <>
                        <Button variant="ghost" onClick={handleToggleHints}>
                          <Lightbulb className="w-4 h-4 mr-2" />
                          {state.showHints ? 'Hide Hints' : 'Show Hints'}
                        </Button>
                        <Button variant="gold" onClick={handleSkipPrep}>
                          Start Speaking
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </>
                    )}
                    {state.phase === 'speaking' && (
                      <>
                        <Button variant="ghost" onClick={handleTogglePause}>
                          {state.isPaused ? (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </>
                          )}
                        </Button>
                        <Button variant="gold" onClick={handleFinishEarly}>
                          Finish Early
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Reflection Phase */}
              {state.phase === 'reflection' && (
                <div className="text-center space-y-6">
                  <h3 className="font-display text-xl font-semibold text-ink-800">
                    How did you do?
                  </h3>
                  <p className="text-ink-600">Rate your performance honestly</p>

                  {/* Rating Stars */}
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <motion.button
                        key={rating}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelfRate(rating)}
                        className={`w-12 h-12 rounded-full text-2xl ${
                          state.selfRating >= rating
                            ? 'bg-gold-500 text-white'
                            : 'bg-ink-100 text-ink-400'
                        }`}
                      >
                        {rating <= state.selfRating ? '⭐' : '☆'}
                      </motion.button>
                    ))}
                  </div>

                  <div className="text-sm text-ink-500">
                    {state.selfRating === 0 && 'Select 1-5 stars'}
                    {state.selfRating === 1 && 'Needs more practice'}
                    {state.selfRating === 2 && 'Getting there'}
                    {state.selfRating === 3 && 'Good effort!'}
                    {state.selfRating === 4 && 'Great job!'}
                    {state.selfRating === 5 && 'Excellent!'}
                  </div>

                  {state.selfRating > 0 && (
                    <Button variant="gold" size="lg" onClick={handleNextTopic}>
                      {state.completedTopics + 1 >= 3 ? 'See Results' : 'Next Topic'}
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </div>
              )}
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
                Challenge Complete!
              </h2>
              <p className="text-ink-600 mb-8">
                Great speaking practice!
              </p>

              {/* Stats */}
              <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-gold-600">{state.totalScore}</p>
                    <p className="text-sm text-ink-500">Total Points</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-purple-600">{state.completedTopics}</p>
                    <p className="text-sm text-ink-500">Topics Covered</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-ink-100">
                  <p className="text-ink-500 text-sm">
                    Average rating: <span className="font-semibold text-ink-700">
                      {(state.totalScore / state.completedTopics / 20).toFixed(1)} ⭐
                    </span>
                  </p>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-purple-50 rounded-xl p-4 mb-8 text-left">
                <h4 className="font-semibold text-purple-800 mb-2">Speaking Tips:</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Structure: Introduction → Main Points → Conclusion</li>
                  <li>• Use specific examples to support your ideas</li>
                  <li>• Speak clearly and at a steady pace</li>
                  <li>• Make eye contact (imagine your audience)</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button variant="gold" size="lg" onClick={handleRestart} className="flex-1">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Try Again
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
      title="Impromptu Challenge"
      subtitle="Quick speaking practice"
      players={[{ id: 'solo', display_name: 'You', avatar_color: '#9333EA', score: state.totalScore, is_ready: true, is_connected: true }]}
      currentRound={state.completedTopics + 1}
      totalRounds={3}
      showTimer={false}
      showRound={state.gamePhase === 'playing'}
      onBack={handleExit}
    >
      {renderContent()}
    </GameLayout>
  );
}
