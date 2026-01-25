'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Clock, Play, Pause, RotateCcw, Trophy, Lightbulb, ChevronRight, Loader2, AlertCircle, Coffee, Star } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { useSpeechToText } from '@/lib/hooks';

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

interface SpeakingEvaluation {
  overallScore: number;
  scores: {
    structure: number;
    clarity: number;
    relevance: number;
    engagement: number;
    confidence: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    tips: string[];
  };
  summary: string;
  encouragement: string;
}

// Checkpoint interval (every 20 points)
const CHECKPOINT_INTERVAL = 20;

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

const PHASES = ['prep', 'speaking', 'evaluating', 'feedback', 'checkpoint'] as const;
type Phase = typeof PHASES[number];

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * ImpromptuChallenge - Quick speaking practice with STT and AI evaluation
 * Draw a topic, speak on it, and get AI feedback
 */
export function ImpromptuChallenge({ sessionId, isHost = false, onExit }: ImpromptuChallengeProps) {
  const [state, setState] = useState({
    gamePhase: 'waiting' as 'waiting' | 'playing' | 'ended',
    phase: 'prep' as Phase,
    currentTopic: null as Topic | null,
    prepTime: 30,
    speakTime: 60,
    timeLeft: 30,
    speakingTimeUsed: 0,
    isPaused: false,
    completedTopics: 0,
    showHints: false,
    totalScore: 0,
    lastCheckpoint: 0,
    currentEvaluation: null as SpeakingEvaluation | null,
    isEvaluating: false,
    evaluationError: null as string | null,
    manualTranscript: '',
  });

  // Topic pool for endless mode
  const topicPoolRef = useRef<Topic[]>([]);

  // Speech-to-text hook
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: sttSupported,
    permissionState,
    startListening,
    stopListening,
    clearTranscript,
    setTranscript,
    requestPermission,
  } = useSpeechToText({
    continuous: true,
    interimResults: true,
    language: 'en-US',
  });

  // Track if we're requesting permission
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Get next topic from pool
  const getNextTopic = useCallback((): Topic => {
    if (topicPoolRef.current.length === 0) {
      topicPoolRef.current = shuffleArray(TOPICS);
    }
    return topicPoolRef.current.pop()!;
  }, []);

  // Handle microphone permission request
  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    await requestPermission();
    setIsRequestingPermission(false);
  };

  // Timer
  useEffect(() => {
    if (state.gamePhase === 'playing' && !state.isPaused && state.timeLeft > 0 && (state.phase === 'prep' || state.phase === 'speaking')) {
      const timer = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
          speakingTimeUsed: prev.phase === 'speaking' ? prev.speakingTimeUsed + 1 : prev.speakingTimeUsed,
        }));
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
          speakingTimeUsed: 0,
        }));
        // Auto-start listening if permission granted
        if (sttSupported && permissionState === 'granted') {
          clearTranscript();
          startListening();
        }
      } else if (state.phase === 'speaking') {
        // Stop listening and go to evaluation
        if (isListening) {
          stopListening();
        }
        handleFinishSpeaking();
      }
    }
  }, [state.gamePhase, state.isPaused, state.timeLeft, state.phase, sttSupported, permissionState, isListening]);

  const handleStart = () => {
    // Initialize topic pool
    topicPoolRef.current = shuffleArray(TOPICS);
    const firstTopic = topicPoolRef.current.pop()!;

    clearTranscript();
    setState((prev) => ({
      ...prev,
      gamePhase: 'playing',
      phase: 'prep',
      currentTopic: firstTopic,
      timeLeft: prev.prepTime,
      speakingTimeUsed: 0,
      isPaused: false,
      showHints: false,
      totalScore: 0,
      lastCheckpoint: 0,
      completedTopics: 0,
      currentEvaluation: null,
      isEvaluating: false,
      evaluationError: null,
      manualTranscript: '',
    }));
  };

  const handleTogglePause = () => {
    setState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleSkipPrep = () => {
    clearTranscript();
    setState((prev) => ({
      ...prev,
      phase: 'speaking',
      timeLeft: prev.speakTime,
      showHints: false,
      speakingTimeUsed: 0,
      manualTranscript: '',
    }));
    // Start listening if permission granted
    if (sttSupported && permissionState === 'granted') {
      startListening();
    }
  };

  const handleToggleHints = () => {
    setState((prev) => ({ ...prev, showHints: !prev.showHints }));
  };

  // Evaluate the speech with AI
  const evaluateSpeech = async (speechText: string) => {
    if (!state.currentTopic) return;

    setState((prev) => ({ ...prev, isEvaluating: true, evaluationError: null }));

    try {
      const response = await fetch('/api/evaluate-speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speech: speechText,
          topic: state.currentTopic.topic,
          category: state.currentTopic.category,
          hints: state.currentTopic.hints,
          speakingTimeUsed: state.speakingTimeUsed,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to evaluate speech');
      }

      const evaluation: SpeakingEvaluation = await response.json();

      setState((prev) => ({
        ...prev,
        phase: 'feedback',
        isEvaluating: false,
        currentEvaluation: evaluation,
      }));
    } catch (error) {
      console.error('Evaluation error:', error);
      setState((prev) => ({
        ...prev,
        isEvaluating: false,
        evaluationError: error instanceof Error ? error.message : 'Failed to evaluate speech',
        phase: 'feedback',
      }));
    }
  };

  const handleFinishSpeaking = () => {
    // Stop listening
    if (isListening) {
      stopListening();
    }

    // Get the speech text (from STT or manual input)
    const speechText = transcript || state.manualTranscript;

    if (!speechText || speechText.trim().length < 5) {
      // Not enough speech - show error but allow to continue
      setState((prev) => ({
        ...prev,
        phase: 'feedback',
        evaluationError: 'No speech detected. Try using the microphone or typing your response.',
        currentEvaluation: null,
      }));
      return;
    }

    // Go to evaluating phase
    setState((prev) => ({
      ...prev,
      phase: 'evaluating',
    }));

    // Evaluate the speech
    evaluateSpeech(speechText);
  };

  const handleNextTopic = () => {
    // Calculate points from evaluation
    const points = state.currentEvaluation ? Math.round(state.currentEvaluation.overallScore / 2) : 10;
    const newTotal = state.totalScore + points;
    const newCompleted = state.completedTopics + 1;

    // Check for checkpoint
    const currentCheckpointLevel = Math.floor(newTotal / CHECKPOINT_INTERVAL);
    const reachedNewCheckpoint = currentCheckpointLevel > state.lastCheckpoint && newTotal > 0;

    if (reachedNewCheckpoint) {
      setState((prev) => ({
        ...prev,
        phase: 'checkpoint',
        totalScore: newTotal,
        completedTopics: newCompleted,
        lastCheckpoint: currentCheckpointLevel,
        currentEvaluation: null,
      }));
    } else {
      // Continue with next topic
      const nextTopic = getNextTopic();
      clearTranscript();
      setState((prev) => ({
        ...prev,
        phase: 'prep',
        currentTopic: nextTopic,
        timeLeft: prev.prepTime,
        speakingTimeUsed: 0,
        isPaused: false,
        showHints: false,
        totalScore: newTotal,
        completedTopics: newCompleted,
        currentEvaluation: null,
        evaluationError: null,
        manualTranscript: '',
      }));
    }
  };

  const handleContinueFromCheckpoint = () => {
    const nextTopic = getNextTopic();
    clearTranscript();
    setState((prev) => ({
      ...prev,
      phase: 'prep',
      currentTopic: nextTopic,
      timeLeft: prev.prepTime,
      speakingTimeUsed: 0,
      isPaused: false,
      showHints: false,
      currentEvaluation: null,
      evaluationError: null,
      manualTranscript: '',
    }));
  };

  const handleTakeBreak = () => {
    if (isListening) {
      stopListening();
    }
    setState((prev) => ({ ...prev, gamePhase: 'ended' }));
  };

  const handleManualTranscriptChange = (text: string) => {
    setState((prev) => ({ ...prev, manualTranscript: text }));
  };

  const handleRestart = () => {
    topicPoolRef.current = [];
    clearTranscript();
    setState((prev) => ({
      ...prev,
      gamePhase: 'waiting',
      phase: 'prep',
      currentTopic: null,
      completedTopics: 0,
      totalScore: 0,
      lastCheckpoint: 0,
      currentEvaluation: null,
      evaluationError: null,
      manualTranscript: '',
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
                    <Mic className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    <span><strong>60 seconds</strong> to speak (voice or type)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-gold-500 mt-0.5 shrink-0" />
                    <span>Get <strong>AI feedback</strong> on your speaking!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Coffee className="w-4 h-4 text-coral-500 mt-0.5 shrink-0" />
                    <span>Practice until you&apos;re tired, take breaks anytime</span>
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
        const pointsToNextCheckpoint = CHECKPOINT_INTERVAL - (state.totalScore % CHECKPOINT_INTERVAL);
        const currentSpeech = transcript || state.manualTranscript;

        return (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-xl mx-auto w-full flex-1 flex flex-col">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-ink-500 mb-2">
                  <span>Topic #{state.completedTopics + 1}</span>
                  <span>Score: <strong className="text-gold-600">{state.totalScore}</strong></span>
                </div>
                <div className="relative">
                  <Progress value={state.totalScore % CHECKPOINT_INTERVAL} max={CHECKPOINT_INTERVAL} variant="gold" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-gold-600 font-medium">
                    {pointsToNextCheckpoint} pts to ⭐
                  </div>
                </div>
              </div>

              {/* Phase indicator */}
              <div className="flex justify-center gap-2 mb-6">
                {['prep', 'speaking'].map((phase, index) => (
                  <div
                    key={phase}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                      state.phase === phase
                        ? 'bg-purple-500 text-white'
                        : (phase === 'prep' && state.phase !== 'prep')
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
              {(state.phase === 'prep' || state.phase === 'speaking') && (
                <div className="space-y-4">
                  {/* Big Timer */}
                  <div className="text-center">
                    <div
                      className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${
                        state.timeLeft < 10 ? 'bg-coral-100' : 'bg-purple-100'
                      } ${state.isPaused ? 'opacity-50' : ''}`}
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
                      {state.isPaused && ' (Paused)'}
                    </p>
                  </div>

                  {/* Speaking Phase: Microphone permission and transcript */}
                  {state.phase === 'speaking' && (
                    <div className="space-y-4">
                      {/* Permission Request UI */}
                      {sttSupported && (permissionState === 'prompt' || permissionState === 'unknown') && !isListening && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-gradient-to-r from-purple-50 to-gold-50 rounded-xl border-2 border-purple-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shrink-0">
                              <Mic className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-ink-800 mb-1">Enable Voice Input?</h4>
                              <p className="text-sm text-ink-600 mb-3">Speak your response and see it transcribed!</p>
                              <Button
                                variant="gold"
                                size="sm"
                                onClick={handleRequestPermission}
                                disabled={isRequestingPermission}
                              >
                                {isRequestingPermission ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Mic className="w-4 h-4 mr-2" />
                                )}
                                Allow Microphone
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Permission Denied UI */}
                      {sttSupported && permissionState === 'denied' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-coral-50 rounded-xl border border-coral-200"
                        >
                          <div className="flex items-start gap-2">
                            <MicOff className="w-5 h-5 text-coral-500 shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-coral-800">Microphone blocked</p>
                              <p className="text-coral-600">You can type your response below instead.</p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Listening indicator */}
                      {isListening && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center justify-center gap-2 p-3 bg-sage-100 rounded-xl"
                        >
                          <div className="w-3 h-3 bg-coral-500 rounded-full animate-pulse" />
                          <span className="text-sage-700 font-medium">Listening...</span>
                        </motion.div>
                      )}

                      {/* Transcript Display */}
                      <div className="bg-white rounded-xl border-2 border-ink-200 p-4 min-h-[120px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-ink-400 uppercase tracking-wide">Your Speech</span>
                          {sttSupported && permissionState === 'granted' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={isListening ? stopListening : startListening}
                              className="h-8"
                            >
                              {isListening ? (
                                <>
                                  <MicOff className="w-4 h-4 mr-1 text-coral-500" />
                                  Stop
                                </>
                              ) : (
                                <>
                                  <Mic className="w-4 h-4 mr-1 text-sage-600" />
                                  Start
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        {sttSupported && (permissionState === 'granted' || permissionState === 'unknown') ? (
                          <p className="text-ink-700 whitespace-pre-wrap">
                            {transcript}
                            {interimTranscript && (
                              <span className="text-ink-400 italic">{interimTranscript}</span>
                            )}
                            {!transcript && !interimTranscript && (
                              <span className="text-ink-400 italic">
                                {isListening ? 'Start speaking...' : 'Click Start to begin recording'}
                              </span>
                            )}
                          </p>
                        ) : (
                          <textarea
                            className="w-full h-24 text-ink-700 bg-transparent resize-none focus:outline-none"
                            placeholder="Type your response here..."
                            value={state.manualTranscript}
                            onChange={(e) => handleManualTranscriptChange(e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="flex justify-center gap-4 flex-wrap">
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
                        <Button variant="ghost" onClick={handleTakeBreak}>
                          <Coffee className="w-4 h-4 mr-2" />
                          Take a Break
                        </Button>
                        <Button
                          variant="gold"
                          onClick={handleFinishSpeaking}
                          disabled={!currentSpeech || currentSpeech.trim().length < 5}
                        >
                          Get Feedback
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Evaluating Phase */}
              {state.phase === 'evaluating' && (
                <div className="text-center space-y-6 py-8">
                  <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto" />
                  <h3 className="font-display text-xl font-semibold text-ink-800">
                    Analyzing your speech...
                  </h3>
                  <p className="text-ink-600">Our AI coach is listening to your response</p>
                </div>
              )}

              {/* Feedback Phase */}
              {state.phase === 'feedback' && (
                <div className="space-y-6">
                  {state.evaluationError ? (
                    <div className="text-center space-y-4">
                      <AlertCircle className="w-12 h-12 text-coral-500 mx-auto" />
                      <p className="text-coral-600">{state.evaluationError}</p>
                      <div className="flex justify-center gap-4">
                        <Button variant="ghost" onClick={handleTakeBreak}>
                          <Coffee className="w-4 h-4 mr-2" />
                          Take a Break
                        </Button>
                        <Button variant="gold" onClick={handleNextTopic}>
                          Try Another Topic
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  ) : state.currentEvaluation && (
                    <>
                      {/* Overall Score */}
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-gold-500 rounded-full mb-4 shadow-lg">
                          <span className="text-3xl font-bold text-white">{state.currentEvaluation.overallScore}</span>
                        </div>
                        <h3 className="font-display text-xl font-semibold text-ink-800 mb-2">
                          {state.currentEvaluation.overallScore >= 80 ? 'Excellent!' :
                           state.currentEvaluation.overallScore >= 60 ? 'Great Job!' :
                           state.currentEvaluation.overallScore >= 40 ? 'Good Effort!' : 'Keep Practicing!'}
                        </h3>
                      </div>

                      {/* Score Breakdown */}
                      <Card className="bg-paper-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-ink-700 mb-3">Score Breakdown</h4>
                          <div className="space-y-2">
                            {Object.entries(state.currentEvaluation.scores).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-3">
                                <span className="text-sm text-ink-600 capitalize w-24">{key}</span>
                                <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${value}%` }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className="h-full bg-gradient-to-r from-purple-500 to-gold-500 rounded-full"
                                  />
                                </div>
                                <span className="text-sm font-medium text-ink-700 w-8">{value}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Feedback */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Strengths */}
                        <Card className="bg-sage-50 border-sage-200">
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-sage-700 mb-2 flex items-center gap-2">
                              <span className="text-lg">💪</span> Strengths
                            </h4>
                            <ul className="space-y-1">
                              {state.currentEvaluation.feedback.strengths.map((strength, i) => (
                                <li key={i} className="text-sm text-sage-700 flex items-start gap-2">
                                  <span className="text-sage-400">•</span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        {/* Tips */}
                        <Card className="bg-gold-50 border-gold-200">
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-gold-700 mb-2 flex items-center gap-2">
                              <span className="text-lg">💡</span> Tips for Next Time
                            </h4>
                            <ul className="space-y-1">
                              {state.currentEvaluation.feedback.tips.map((tip, i) => (
                                <li key={i} className="text-sm text-gold-700 flex items-start gap-2">
                                  <span className="text-gold-400">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                              {state.currentEvaluation.feedback.improvements.map((imp, i) => (
                                <li key={`imp-${i}`} className="text-sm text-gold-700 flex items-start gap-2">
                                  <span className="text-gold-400">•</span>
                                  <span>{imp}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Encouragement */}
                      <div className="bg-purple-50 rounded-xl p-4 text-center">
                        <p className="text-purple-700 italic">&ldquo;{state.currentEvaluation.encouragement}&rdquo;</p>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-center gap-4">
                        <Button variant="ghost" onClick={handleTakeBreak}>
                          <Coffee className="w-4 h-4 mr-2" />
                          Take a Break
                        </Button>
                        <Button variant="gold" size="lg" onClick={handleNextTopic}>
                          Next Topic
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Checkpoint Phase */}
              {state.phase === 'checkpoint' && (
                <div className="text-center space-y-6 py-4">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-24 h-24 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center mx-auto shadow-lg"
                  >
                    <Star className="w-12 h-12 text-white" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">
                      🎉 Checkpoint!
                    </h2>
                    <p className="text-ink-600 mb-4">
                      You&apos;ve earned <strong className="text-gold-600">{state.totalScore}</strong> points!
                    </p>
                    <p className="text-ink-500 mb-6">
                      {state.completedTopics} topics completed
                    </p>
                  </motion.div>

                  <div className="flex justify-center gap-4">
                    <Button variant="gold" size="lg" onClick={handleContinueFromCheckpoint}>
                      Keep Going!
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button variant="secondary" size="lg" onClick={handleTakeBreak}>
                      <Coffee className="w-4 h-4 mr-2" />
                      Break
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'ended':
        const checkpointsReached = Math.floor(state.totalScore / CHECKPOINT_INTERVAL);

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
                Great Practice Session!
              </h2>
              <p className="text-ink-600 mb-2">
                You spoke on <strong>{state.completedTopics}</strong> topic{state.completedTopics !== 1 ? 's' : ''}
              </p>
              {checkpointsReached > 0 && (
                <p className="text-gold-600 font-medium mb-6">
                  ⭐ {checkpointsReached} checkpoint{checkpointsReached > 1 ? 's' : ''} reached!
                </p>
              )}

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
                {state.completedTopics > 0 && (
                  <div className="mt-4 pt-4 border-t border-ink-100">
                    <p className="text-ink-500 text-sm">
                      Average score: <span className="font-semibold text-ink-700">
                        {Math.round(state.totalScore / state.completedTopics)} pts/topic
                      </span>
                    </p>
                  </div>
                )}
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
      totalRounds={0} // Endless mode
      showTimer={false}
      showRound={state.gamePhase === 'playing' && (state.phase === 'prep' || state.phase === 'speaking')}
      onBack={handleExit}
    >
      {renderContent()}
    </GameLayout>
  );
}
