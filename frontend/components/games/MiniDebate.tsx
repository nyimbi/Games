'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Clock, ThumbsUp, ThumbsDown, Mic, MicOff, Square,
  Lightbulb, Loader2, Star, TrendingUp, AlertCircle, Sparkles, Volume2
} from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress, Textarea } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { useSpeechToText } from '@/lib/hooks/useSpeechToText';

interface MiniDebateProps {
  sessionId?: string;
  isHost?: boolean;
  onExit?: () => void;
  mode?: 'solo' | 'multiplayer';
}

interface DebateTopic {
  id: string;
  topic: string;
  proPosition: string;
  conPosition: string;
  background?: string;
}

interface AIEvaluation {
  overallScore: number;
  scores: {
    clarity: number;
    evidence: number;
    logic: number;
    persuasion: number;
    relevance: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
  summary: string;
  encouragement: string;
}

// WSC 2026 "Are We There Yet?" aligned debate topics
const DEBATE_TOPICS: DebateTopic[] = [
  {
    id: 'topic-1',
    topic: 'Should countries prioritize high-speed rail over expanding airports?',
    proPosition: 'High-speed rail is more sustainable, connects cities efficiently, and reduces carbon emissions.',
    conPosition: 'Airports serve global connectivity needs that rail cannot match, and are often more economical.',
    background: 'Many countries debate infrastructure investment between rail and air. China has 40,000km of high-speed rail, while the US has extensive domestic flights.',
  },
  {
    id: 'topic-2',
    topic: 'Should megaprojects like NEOM be built despite their massive costs?',
    proPosition: 'Megaprojects drive innovation, create jobs, and can transform regions for generations.',
    conPosition: 'Megaprojects often exceed budgets, harm environments, and money could solve existing problems.',
    background: 'NEOM in Saudi Arabia plans a 170km linear city. History shows 90% of megaprojects exceed budgets.',
  },
  {
    id: 'topic-3',
    topic: 'Is the journey more important than the destination?',
    proPosition: 'The journey teaches us, shapes us, and is where real growth happens.',
    conPosition: 'Destinations give us purpose and meaning; journeys without goals are just wandering.',
    background: 'This philosophical question underlies much of human ambition and life planning.',
  },
  {
    id: 'topic-4',
    topic: 'Should governments invest more in space exploration or solving Earth\'s problems?',
    proPosition: 'Space exploration drives technology, inspires youth, and ensures humanity\'s long-term survival.',
    conPosition: 'With climate change, poverty, and disease, we should fix Earth before reaching for the stars.',
    background: 'NASA\'s budget is 0.5% of US federal spending. Some argue space tech solves Earth problems too.',
  },
  {
    id: 'topic-5',
    topic: 'Should remote work become the default for office jobs?',
    proPosition: 'Remote work reduces commuting, improves work-life balance, and can increase productivity.',
    conPosition: 'In-person collaboration builds culture, mentorship, and spontaneous innovation.',
    background: 'Post-pandemic, many workers prefer flexibility while companies worry about connection.',
  },
  {
    id: 'topic-6',
    topic: 'Should social media have verified identity requirements?',
    proPosition: 'Verification reduces harassment, misinformation, and holds people accountable online.',
    conPosition: 'Anonymity protects whistleblowers, dissidents, and free speech from retaliation.',
    background: 'The rise of AI-generated content makes digital identity increasingly complex.',
  },
  {
    id: 'topic-7',
    topic: 'Should we prioritize curing diseases or extending healthy lifespans?',
    proPosition: 'Extending healthy years gives people more time to contribute and enjoy life.',
    conPosition: 'We should focus on helping those suffering now rather than theoretical life extension.',
    background: 'Medical science can now potentially slow aging, raising questions about priorities.',
  },
  {
    id: 'topic-8',
    topic: 'Is measuring progress with GDP outdated?',
    proPosition: 'GDP ignores wellbeing, environment, and inequality. We need better metrics.',
    conPosition: 'GDP provides a clear, comparable measure that guides sound economic policy.',
    background: 'Bhutan uses "Gross National Happiness." Some economists advocate for alternatives.',
  },
];

type DebatePhase = 'waiting' | 'prep' | 'opening' | 'rebuttal' | 'closing' | 'evaluating' | 'feedback' | 'ended';

/**
 * MiniDebate - AI-Powered Debate Practice with Speech-to-Text
 *
 * Features:
 * - Speech-to-text for verbal debate practice
 * - AI evaluation of arguments using Azure OpenAI
 * - Detailed feedback with scoring breakdown
 * - WSC 2026 theme-aligned topics
 */
export function MiniDebate({ sessionId, isHost = false, onExit, mode = 'solo' }: MiniDebateProps) {
  const [state, setState] = useState({
    phase: 'waiting' as DebatePhase,
    topic: DEBATE_TOPICS[0],
    position: 'pro' as 'pro' | 'con',
    timeRemaining: 60,
    currentSpeaker: 'pro' as 'pro' | 'con',
    speeches: {
      proOpening: '',
      conOpening: '',
      proRebuttal: '',
      conRebuttal: '',
      proClosing: '',
      conClosing: '',
    },
    currentSpeech: '',
    evaluations: [] as AIEvaluation[],
    currentEvaluation: null as AIEvaluation | null,
    isEvaluating: false,
    totalScore: 0,
  });

  // Speech-to-text hook
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: sttSupported,
    error: sttError,
    startListening,
    stopListening,
    clearTranscript,
    setTranscript,
  } = useSpeechToText({
    continuous: true,
    interimResults: true,
    language: 'en-US',
  });

  // Sync speech transcript to current speech
  useEffect(() => {
    if (transcript) {
      setState((prev) => ({ ...prev, currentSpeech: transcript }));
    }
  }, [transcript]);

  // Timer
  useEffect(() => {
    if (['prep', 'opening', 'rebuttal', 'closing'].includes(state.phase) && state.timeRemaining > 0) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, timeRemaining: prev.timeRemaining - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (state.timeRemaining === 0 && state.phase !== 'waiting' && state.phase !== 'evaluating' && state.phase !== 'feedback' && state.phase !== 'ended') {
      handleTimeUp();
    }
  }, [state.phase, state.timeRemaining]);

  const handleStart = () => {
    const randomTopic = DEBATE_TOPICS[Math.floor(Math.random() * DEBATE_TOPICS.length)];
    const randomPosition = Math.random() > 0.5 ? 'pro' : 'con';

    clearTranscript();
    setState((prev) => ({
      ...prev,
      topic: randomTopic,
      position: randomPosition,
      phase: 'prep',
      timeRemaining: 60,
      currentSpeaker: 'pro',
      speeches: {
        proOpening: '',
        conOpening: '',
        proRebuttal: '',
        conRebuttal: '',
        proClosing: '',
        conClosing: '',
      },
      currentSpeech: '',
      evaluations: [],
      currentEvaluation: null,
      totalScore: 0,
    }));
  };

  // Evaluate argument with AI
  const evaluateArgument = useCallback(async (argument: string, phase: string) => {
    setState((prev) => ({ ...prev, isEvaluating: true, phase: 'evaluating' }));

    try {
      const response = await fetch('/api/evaluate-debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          argument,
          topic: state.topic.topic,
          position: state.position === 'pro' ? 'for' : 'against',
          context: state.position === 'pro' ? state.topic.proPosition : state.topic.conPosition,
          previousArguments: Object.values(state.speeches).filter(Boolean),
        }),
      });

      if (response.ok) {
        const evaluation: AIEvaluation = await response.json();
        setState((prev) => ({
          ...prev,
          isEvaluating: false,
          currentEvaluation: evaluation,
          evaluations: [...prev.evaluations, evaluation],
          totalScore: prev.totalScore + evaluation.overallScore,
          phase: 'feedback',
        }));
      } else {
        // Fallback if API fails
        const fallbackEvaluation: AIEvaluation = {
          overallScore: 75,
          scores: { clarity: 75, evidence: 70, logic: 75, persuasion: 80, relevance: 75 },
          feedback: {
            strengths: ['You presented your argument clearly', 'Good use of language'],
            improvements: ['Consider adding more specific examples', 'Try to anticipate counterarguments'],
            suggestions: ['Use statistics or facts to strengthen your case'],
          },
          summary: 'A solid argument that makes good points. Keep practicing!',
          encouragement: 'Great effort! Every debate makes you better.',
        };
        setState((prev) => ({
          ...prev,
          isEvaluating: false,
          currentEvaluation: fallbackEvaluation,
          evaluations: [...prev.evaluations, fallbackEvaluation],
          totalScore: prev.totalScore + fallbackEvaluation.overallScore,
          phase: 'feedback',
        }));
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      setState((prev) => ({ ...prev, isEvaluating: false, phase: 'feedback' }));
    }
  }, [state.topic, state.position, state.speeches]);

  const handleTimeUp = () => {
    if (isListening) {
      stopListening();
    }

    const { phase, currentSpeaker, currentSpeech, speeches, position } = state;

    // If it's player's turn and they have a speech, evaluate it
    if (currentSpeaker === position && currentSpeech.length > 20) {
      evaluateArgument(currentSpeech, phase);
      return; // Wait for evaluation to complete
    }

    advancePhase();
  };

  const advancePhase = useCallback(() => {
    const { phase, currentSpeaker, currentSpeech, speeches, position } = state;

    let newSpeeches = { ...speeches };
    let newPhase: DebatePhase = phase;
    let newSpeaker = currentSpeaker;
    let newTime = 60;

    if (phase === 'prep' || phase === 'feedback') {
      const currentPhaseIndex = phase === 'prep' ? 0 : ['opening', 'rebuttal', 'closing'].indexOf(state.phase === 'feedback' ? getLastPhase() : phase);

      if (phase === 'prep') {
        newPhase = 'opening';
        newTime = 90;
      } else {
        // After feedback, move to next phase
        const phases: DebatePhase[] = ['opening', 'rebuttal', 'closing'];
        const lastPhase = getLastPhase();
        const lastPhaseIndex = phases.indexOf(lastPhase as DebatePhase);

        if (currentSpeaker === 'pro') {
          newSpeaker = 'con';
          newTime = lastPhase === 'opening' ? 90 : 60;
        } else {
          // Con finished, move to next phase
          if (lastPhaseIndex < phases.length - 1) {
            newPhase = phases[lastPhaseIndex + 1];
            newSpeaker = 'pro';
            newTime = newPhase === 'opening' ? 90 : 60;
          } else {
            newPhase = 'ended';
          }
        }
      }
    }

    clearTranscript();
    setState((prev) => ({
      ...prev,
      phase: newPhase,
      speeches: newSpeeches,
      currentSpeaker: newSpeaker,
      timeRemaining: newTime,
      currentSpeech: '',
      currentEvaluation: null,
    }));
  }, [state, clearTranscript]);

  const getLastPhase = (): string => {
    // Determine what phase we were in before evaluation/feedback
    const { speeches, position } = state;
    if (speeches[`${position}Closing`]) return 'closing';
    if (speeches[`${position}Rebuttal`]) return 'rebuttal';
    if (speeches[`${position}Opening`]) return 'opening';
    return 'opening';
  };

  const handleSubmitSpeech = () => {
    if (isListening) {
      stopListening();
    }

    // Save the speech
    const { phase, position, currentSpeech, speeches } = state;
    const speechKey = `${position}${phase.charAt(0).toUpperCase() + phase.slice(1)}` as keyof typeof speeches;

    setState((prev) => ({
      ...prev,
      speeches: { ...prev.speeches, [speechKey]: currentSpeech },
    }));

    // Evaluate the argument
    if (currentSpeech.length > 20) {
      evaluateArgument(currentSpeech, phase);
    } else {
      advancePhase();
    }
  };

  const handleContinueFromFeedback = () => {
    advancePhase();
  };

  const handleExit = () => {
    if (isListening) {
      stopListening();
    }
    onExit?.();
  };

  const isMyTurn = state.currentSpeaker === state.position;
  const phaseNames: Record<DebatePhase, string> = {
    waiting: 'Waiting',
    prep: 'Preparation',
    opening: 'Opening Statement',
    rebuttal: 'Rebuttal',
    closing: 'Closing Statement',
    evaluating: 'AI Evaluating...',
    feedback: 'Feedback',
    ended: 'Complete',
  };

  const renderSpeechInput = () => (
    <div className="flex-1 flex flex-col">
      {/* Speech-to-text status */}
      {sttSupported && (
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant={isListening ? 'primary' : 'secondary'}
            onClick={isListening ? stopListening : startListening}
            className={isListening ? 'bg-coral-600 hover:bg-coral-700 animate-pulse' : ''}
          >
            {isListening ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Start Speaking
              </>
            )}
          </Button>
          {isListening && (
            <span className="text-sm text-coral-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-coral-500 rounded-full animate-pulse" />
              Listening...
            </span>
          )}
          {sttError && (
            <span className="text-sm text-coral-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {sttError}
            </span>
          )}
        </div>
      )}

      {/* Text area for manual input or editing */}
      <Textarea
        value={state.currentSpeech}
        onChange={(e) => {
          setState((prev) => ({ ...prev, currentSpeech: e.target.value }));
          setTranscript(e.target.value);
        }}
        placeholder={sttSupported
          ? `Click "Start Speaking" or type your ${phaseNames[state.phase].toLowerCase()}...`
          : `Write your ${phaseNames[state.phase].toLowerCase()}...`
        }
        className="flex-1 resize-none"
        rows={8}
      />

      {/* Interim transcript preview */}
      {isListening && interimTranscript && (
        <p className="text-sm text-ink-400 italic mt-2">
          ...{interimTranscript}
        </p>
      )}

      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-ink-500">
          {state.currentSpeech.length} characters
          {state.currentSpeech.length < 20 && ' (minimum 20)'}
        </span>
        <Button
          variant="gold"
          onClick={handleSubmitSpeech}
          disabled={state.currentSpeech.length < 20}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Submit & Get Feedback
        </Button>
      </div>
    </div>
  );

  const renderEvaluationFeedback = () => {
    const evaluation = state.currentEvaluation;
    if (!evaluation) return null;

    const scoreColor = (score: number) => {
      if (score >= 80) return 'text-sage-600';
      if (score >= 60) return 'text-gold-600';
      return 'text-coral-600';
    };

    const progressColor = (score: number) => {
      if (score >= 80) return 'sage';
      if (score >= 60) return 'gold';
      return 'coral';
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 overflow-y-auto p-6"
      >
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Overall Score */}
          <Card className="bg-gradient-to-br from-ink-800 to-ink-900 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cream-300 text-sm">Your Score</p>
                  <p className="font-display text-5xl font-bold text-gold-400">
                    {evaluation.overallScore}
                  </p>
                </div>
                <div className="text-right">
                  <Star className="w-12 h-12 text-gold-400 fill-gold-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-ink-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold-600" />
                Score Breakdown
              </h3>
              <div className="space-y-4">
                {Object.entries(evaluation.scores).map(([key, score]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ink-600 capitalize">{key}</span>
                      <span className={`font-semibold ${scoreColor(score)}`}>{score}/100</span>
                    </div>
                    <Progress value={score} max={100} variant={progressColor(score) as 'sage' | 'gold' | 'coral'} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-ink-800 mb-4">AI Feedback</h3>

              {/* Summary */}
              <p className="text-ink-600 mb-4 p-3 bg-cream-100 rounded-lg">
                {evaluation.summary}
              </p>

              {/* Strengths */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-sage-700 mb-2 flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4" />
                  What You Did Well
                </h4>
                <ul className="space-y-1">
                  {evaluation.feedback.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-ink-600 flex items-start gap-2">
                      <span className="text-sage-500 mt-1">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas to Improve */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gold-700 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Areas to Grow
                </h4>
                <ul className="space-y-1">
                  {evaluation.feedback.improvements.map((s, i) => (
                    <li key={i} className="text-sm text-ink-600 flex items-start gap-2">
                      <span className="text-gold-500 mt-1">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggestions */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-ink-700 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Try This Next Time
                </h4>
                <ul className="space-y-1">
                  {evaluation.feedback.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-ink-600 flex items-start gap-2">
                      <span className="text-ink-400 mt-1">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Encouragement */}
              <div className="mt-4 p-4 bg-gold-50 rounded-xl border border-gold-200">
                <p className="text-gold-800 text-sm font-medium">
                  💪 {evaluation.encouragement}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <Button variant="gold" size="lg" onClick={handleContinueFromFeedback} className="w-full">
            Continue to Next Round
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderContent = () => {
    switch (state.phase) {
      case 'waiting':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              <div className="w-20 h-20 bg-ink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-ink-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
                Mini Debate
              </h2>
              <p className="text-ink-600 mb-4">
                Practice your argumentation skills with AI-powered feedback!
              </p>

              {sttSupported ? (
                <div className="flex items-center justify-center gap-2 text-sage-600 text-sm mb-6">
                  <Mic className="w-4 h-4" />
                  Speech-to-text enabled
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-ink-500 text-sm mb-6">
                  <MicOff className="w-4 h-4" />
                  Type your arguments (speech not supported in this browser)
                </div>
              )}

              <Button variant="gold" size="lg" onClick={handleStart}>
                Start Debate
              </Button>
            </motion.div>
          </div>
        );

      case 'prep':
        return (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
              {/* Topic Card */}
              <Card className="mb-6 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-800 text-white border-2 border-gold-500/30">
                <CardContent className="p-6">
                  <Badge variant="gold" className="mb-4">
                    {state.position === 'pro' ? 'FOR' : 'AGAINST'}
                  </Badge>
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-gold-300 leading-tight drop-shadow-sm">
                    {state.topic.topic}
                  </h2>
                  <p className="text-cream-200 text-base">
                    Your position: {state.position === 'pro' ? state.topic.proPosition : state.topic.conPosition}
                  </p>
                </CardContent>
              </Card>

              {/* Timer */}
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">{phaseNames[state.phase]}</Badge>
                <div className="flex items-center gap-2 text-ink-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-mono text-xl font-bold">
                    {Math.floor(state.timeRemaining / 60)}:{(state.timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Prep Tips */}
              <Card className="flex-1">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-gold-600" />
                    <h3 className="font-semibold text-ink-800">Preparation Tips</h3>
                  </div>
                  <ul className="space-y-3 text-ink-600">
                    <li className="flex items-start gap-2">
                      <span className="text-gold-600">•</span>
                      <span>Think of 2-3 strong points to support your position</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold-600">•</span>
                      <span>Consider what the other side might argue</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold-600">•</span>
                      <span>Prepare evidence or examples to support your claims</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold-600">•</span>
                      <span>Plan a strong opening and closing statement</span>
                    </li>
                  </ul>

                  {state.topic.background && (
                    <div className="mt-6 p-4 bg-cream-100 rounded-xl">
                      <p className="text-sm text-ink-600">
                        <span className="font-semibold">Background:</span> {state.topic.background}
                      </p>
                    </div>
                  )}

                  <Button
                    variant="gold"
                    onClick={() => {
                      setState((prev) => ({ ...prev, phase: 'opening', timeRemaining: 90 }));
                    }}
                    className="mt-6"
                  >
                    I'm Ready to Debate!
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'opening':
      case 'rebuttal':
      case 'closing':
        return (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
              {/* Topic Card */}
              <Card className="mb-6 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-800 text-white border-2 border-gold-500/30">
                <CardContent className="p-6">
                  <Badge variant="gold" className="mb-3">
                    {state.position === 'pro' ? 'FOR' : 'AGAINST'}
                  </Badge>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-gold-300 leading-tight drop-shadow-sm">
                    {state.topic.topic}
                  </h2>
                </CardContent>
              </Card>

              {/* Phase & Timer */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge variant={isMyTurn ? 'gold' : 'outline'}>
                    {phaseNames[state.phase]}
                  </Badge>
                  {!isMyTurn && (
                    <span className="text-ink-500 text-sm">
                      Opponent's turn
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-ink-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-mono text-xl font-bold">
                    {Math.floor(state.timeRemaining / 60)}:{(state.timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Speech Area */}
              {isMyTurn ? (
                renderSpeechInput()
              ) : (
                <Card className="flex-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Volume2 className="w-5 h-5 text-coral-600" />
                      <h3 className="font-semibold text-ink-800">Opponent Speaking</h3>
                    </div>
                    <p className="text-ink-500 italic">
                      {generateAISpeech(state.phase, state.currentSpeaker, state.topic)}
                    </p>
                    <Button
                      variant="secondary"
                      onClick={advancePhase}
                      className="mt-6"
                    >
                      Continue
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case 'evaluating':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              <Loader2 className="w-16 h-16 text-gold-500 animate-spin mx-auto mb-6" />
              <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
                AI is Evaluating...
              </h2>
              <p className="text-ink-600">
                Analyzing your argument for clarity, evidence, logic, and persuasion.
              </p>
            </motion.div>
          </div>
        );

      case 'feedback':
        return renderEvaluationFeedback();

      case 'ended':
        const avgScore = state.evaluations.length > 0
          ? Math.round(state.totalScore / state.evaluations.length)
          : 0;

        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              <div className="w-24 h-24 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageSquare className="w-12 h-12 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">
                Debate Complete!
              </h2>
              <p className="text-ink-600 mb-8">
                Great job practicing your argumentation skills!
              </p>

              <Card className="mb-8">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-ink-800 mb-4">Your Performance</h3>
                  <div className="flex justify-center gap-8">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gold-600">{avgScore}</p>
                      <p className="text-sm text-ink-500">Average Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-ink-800">{state.totalScore}</p>
                      <p className="text-sm text-ink-500">Total Points</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-ink-800">
                        {state.evaluations.length}
                      </p>
                      <p className="text-sm text-ink-500">Speeches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button variant="gold" size="lg" onClick={handleStart} className="flex-1">
                  New Topic
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
      title="Mini Debate"
      subtitle={state.phase !== 'waiting' ? state.topic.topic : 'AI-Powered Practice'}
      players={[{ id: 'solo', display_name: 'You', avatar_color: '#6366F1', score: state.totalScore, is_ready: true, is_connected: true }]}
      timeRemaining={['prep', 'opening', 'rebuttal', 'closing'].includes(state.phase) ? state.timeRemaining : undefined}
      showTimer={['prep', 'opening', 'rebuttal', 'closing'].includes(state.phase)}
      showRound={false}
      onBack={handleExit}
    >
      {renderContent()}
    </GameLayout>
  );
}

// Generate simple AI opponent speeches
function generateAISpeech(phase: string, position: 'pro' | 'con', topic: DebateTopic): string {
  const speeches: Record<string, Record<string, string>> = {
    opening: {
      pro: `I firmly believe that ${topic.proPosition.toLowerCase()} This is an important issue that affects many people, and we must consider the positive outcomes that could result from supporting this position. The evidence clearly supports taking this stance.`,
      con: `I respectfully disagree with my opponent. ${topic.conPosition} We need to think carefully about the consequences and consider alternative approaches that might serve us better in the long run.`,
    },
    rebuttal: {
      pro: `While my opponent makes some valid points, they fail to address the core benefits. The evidence clearly shows that the advantages outweigh any potential drawbacks. We must look at the bigger picture here.`,
      con: `My opponent's arguments, while passionate, overlook several key issues. We must consider the practical implications and long-term effects of such decisions on our society.`,
    },
    closing: {
      pro: `In conclusion, supporting this position leads to better outcomes for everyone. I urge you to consider the evidence and the positive impact this could have. Vote in favor of progress.`,
      con: `To summarize, we must be cautious about making changes without fully understanding the consequences. The current approach has merits we shouldn't dismiss lightly.`,
    },
  };

  return speeches[phase]?.[position] || 'The opponent presents their argument.';
}
