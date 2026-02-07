'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Clock, ThumbsUp, ThumbsDown, Mic, MicOff, Square,
  Lightbulb, Loader2, Star, TrendingUp, AlertCircle, Sparkles, Volume2,
  ChevronDown, ChevronUp, CheckCircle2,
} from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress, Textarea } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { useSpeechToText } from '@/lib/hooks/useSpeechToText';
import { getEffectiveLevel, getStudentProfile } from '@/lib/games/studentLevel';

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
  {
    id: 'topic-9',
    topic: 'Should we measure success by how fast we arrive, or how well we travel?',
    proPosition: 'The quality of the journey builds character, resilience, and deeper understanding than speed ever could.',
    conPosition: 'In a competitive world, speed matters. Getting there first means more resources, more opportunities, and more impact.',
    background: 'The WSC 2026 theme "Are We There Yet?" asks whether outcomes or processes matter more in measuring progress.',
  },
  {
    id: 'topic-10',
    topic: 'Is it ethical to genetically modify humans to survive space travel?',
    proPosition: 'If humanity is to become interplanetary, we must adapt our biology to hostile environments. Evolution is too slow.',
    conPosition: 'Genetic modification risks creating inequality, unforeseen consequences, and crosses fundamental ethical lines.',
    background: 'NASA research shows long-term space travel causes bone loss, radiation damage, and psychological effects that current biology cannot withstand.',
  },
  {
    id: 'topic-11',
    topic: 'Should countries be required to accept climate refugees?',
    proPosition: 'Climate change is caused by industrialized nations; those who created the crisis have a moral duty to shelter its victims.',
    conPosition: 'Nations have sovereignty over immigration policy, and forced acceptance could create economic and social instability.',
    background: 'By 2050, an estimated 200 million people may be displaced by rising seas, droughts, and extreme weather events.',
  },
  {
    id: 'topic-12',
    topic: 'Is social media connecting us or making us lonelier?',
    proPosition: 'Social media connects people across continents, enables movements, and provides community for the isolated.',
    conPosition: 'Studies show increased social media use correlates with depression, anxiety, and a decline in meaningful relationships.',
    background: 'The UK appointed a Minister of Loneliness in 2018. Average screen time has tripled since 2010.',
  },
  {
    id: 'topic-13',
    topic: 'Should we invest in underwater cities before Mars colonies?',
    proPosition: 'Earth\'s oceans are closer, resource-rich, and we know far more about surviving underwater than on Mars.',
    conPosition: 'Mars colonization ensures humanity\'s survival beyond Earth and drives technological leaps that ocean habitats cannot.',
    background: 'We have explored less than 5% of the ocean floor. A Mars mission would take 7-9 months one way.',
  },
  {
    id: 'topic-14',
    topic: 'Are standardized tests a fair measure of a student\'s potential?',
    proPosition: 'Standardized tests provide an objective, comparable benchmark that transcends school quality and teacher variation.',
    conPosition: 'Tests favor rote memorization over creativity, penalize different learning styles, and reflect socioeconomic status more than ability.',
    background: 'Countries like Finland have minimal standardized testing yet consistently rank among top education systems worldwide.',
  },
  {
    id: 'topic-15',
    topic: 'Should AI be given legal personhood?',
    proPosition: 'As AI becomes more autonomous, legal frameworks must evolve to assign responsibility and rights to AI entities.',
    conPosition: 'AI lacks consciousness and moral agency. Granting personhood would dilute human rights and create legal chaos.',
    background: 'Saudi Arabia granted citizenship to robot Sophia in 2017. The EU has debated "electronic personhood" for AI systems.',
  },
  {
    id: 'topic-16',
    topic: 'Is preserving every endangered language worth the effort?',
    proPosition: 'Each language encodes unique knowledge, worldviews, and cultural heritage that enriches all of humanity.',
    conPosition: 'Resources are limited. Focusing on widely-spoken languages improves communication and economic opportunity for more people.',
    background: 'A language dies approximately every two weeks. Of 7,000 languages, nearly half are endangered.',
  },
  {
    id: 'topic-17',
    topic: 'Should there be a global minimum wage?',
    proPosition: 'A global minimum wage would reduce exploitation, narrow inequality, and ensure basic dignity for all workers.',
    conPosition: 'Cost of living varies enormously. A global wage ignores local economic realities and could destroy jobs in poorer nations.',
    background: 'The wealthiest 1% own more than the bottom 50%. Wages vary from $1/day to $200/day across countries.',
  },
  {
    id: 'topic-18',
    topic: 'Has globalization done more harm than good?',
    proPosition: 'Globalization has lifted billions from poverty, spread technology, and connected cultures in unprecedented ways.',
    conPosition: 'Globalization has widened inequality, destroyed local industries, homogenized cultures, and accelerated environmental damage.',
    background: 'Global trade has grown 40x since 1950. Meanwhile, cultural diversity and local manufacturing have declined sharply.',
  },
];

type DebateFormat = 'standard' | 'wsc';

type DebatePhase =
  | 'waiting'
  | 'prep'
  | 'opening'
  | 'rebuttal'
  | 'closing'
  | 'evaluating'
  | 'feedback'
  | 'ended'
  // WSC-specific phases
  | 'constructive'
  | 'cross_exam'
  | 'wsc_rebuttal'
  | 'summary';

const WSC_SCORING_RUBRIC = {
  content: { label: 'Content', weight: 40, description: 'Quality of arguments and evidence' },
  strategy: { label: 'Strategy', weight: 30, description: 'Structure and tactical approach' },
  style: { label: 'Style', weight: 30, description: 'Delivery, language, and persuasion' },
};

const WSC_PHASES: { phase: DebatePhase; name: string; minutes: number }[] = [
  { phase: 'constructive', name: 'Constructive Speech', minutes: 4 },
  { phase: 'cross_exam', name: 'Cross-Examination', minutes: 2 },
  { phase: 'wsc_rebuttal', name: 'Rebuttal', minutes: 4 },
  { phase: 'summary', name: 'Summary', minutes: 2 },
];

const STANDARD_PHASES: { phase: DebatePhase; name: string; minutes: number }[] = [
  { phase: 'opening', name: 'Opening Statement', minutes: 1.5 },
  { phase: 'rebuttal', name: 'Rebuttal', minutes: 1 },
  { phase: 'closing', name: 'Closing Statement', minutes: 1 },
];

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
  const [debateFormat, setDebateFormat] = useState<DebateFormat>('standard');

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

  const currentFormatPhases = debateFormat === 'wsc' ? WSC_PHASES : STANDARD_PHASES;

  // Speech-to-text hook
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: sttSupported,
    error: sttError,
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

  // AI Debate Hints
  const [hints, setHints] = useState<{
    talkingPoints: Array<{ point: string; evidence?: string; tip?: string }>;
    counterarguments: string[];
    vocabularyTips: string[];
  } | null>(null);
  const [isLoadingHints, setIsLoadingHints] = useState(false);
  const [hintsError, setHintsError] = useState<string | null>(null);
  const [coveredPoints, setCoveredPoints] = useState<Set<number>>(new Set());
  const [showHints, setShowHints] = useState(true);

  const fetchHints = useCallback(async () => {
    if (isLoadingHints || hints) return;
    setIsLoadingHints(true);
    setHintsError(null);

    try {
      const profile = getStudentProfile();
      const level = getEffectiveLevel();

      const res = await fetch('/api/debate-hints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: state.topic.topic,
          position: state.position,
          phase: state.phase,
          studentLevel: { grade: profile.gradeLevel, level },
        }),
      });

      if (!res.ok) throw new Error('Failed to get hints');

      const data = await res.json();
      setHints(data);
    } catch {
      setHintsError('Could not load hints. Try again.');
    } finally {
      setIsLoadingHints(false);
    }
  }, [isLoadingHints, hints, state.topic, state.position, state.phase]);

  const toggleCoveredPoint = (index: number) => {
    setCoveredPoints((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Track if we're requesting permission
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Handle microphone permission request
  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    await requestPermission();
    setIsRequestingPermission(false);
  };

  // Sync speech transcript to current speech
  useEffect(() => {
    if (transcript) {
      setState((prev) => ({ ...prev, currentSpeech: transcript }));
    }
  }, [transcript]);

  const activePhases = ['prep', 'opening', 'rebuttal', 'closing', 'constructive', 'cross_exam', 'wsc_rebuttal', 'summary'];
  const nonTimerPhases = ['waiting', 'evaluating', 'feedback', 'ended'];

  // Timer
  useEffect(() => {
    if (activePhases.includes(state.phase) && state.timeRemaining > 0) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, timeRemaining: prev.timeRemaining - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (state.timeRemaining === 0 && !nonTimerPhases.includes(state.phase)) {
      handleTimeUp();
    }
  }, [state.phase, state.timeRemaining]);

  const handleStart = () => {
    const randomTopic = DEBATE_TOPICS[Math.floor(Math.random() * DEBATE_TOPICS.length)];
    const randomPosition = Math.random() > 0.5 ? 'pro' : 'con';

    clearTranscript();
    setHints(null);
    setHintsError(null);
    setCoveredPoints(new Set());
    setShowHints(true);
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
    const { phase, currentSpeaker, speeches, position } = state;

    let newSpeeches = { ...speeches };
    let newPhase: DebatePhase = phase;
    let newSpeaker = currentSpeaker;
    let newTime = 60;

    const formatPhases = currentFormatPhases.map((p) => p.phase);
    const getPhaseTime = (p: DebatePhase) => {
      const found = currentFormatPhases.find((fp) => fp.phase === p);
      return found ? found.minutes * 60 : 60;
    };

    if (phase === 'prep') {
      // From prep, go to first phase with pro speaking first
      newPhase = formatPhases[0];
      newSpeaker = 'pro';
      newTime = getPhaseTime(formatPhases[0]);
    } else if (phase === 'feedback') {
      // After feedback, advance based on who just spoke
      const lastPhase = getLastPhase();
      const lastPhaseIndex = formatPhases.indexOf(lastPhase as DebatePhase);

      if (currentSpeaker === 'pro') {
        newSpeaker = 'con';
        newTime = getPhaseTime(lastPhase as DebatePhase);
      } else {
        if (lastPhaseIndex < formatPhases.length - 1) {
          newPhase = formatPhases[lastPhaseIndex + 1];
          newSpeaker = 'pro';
          newTime = getPhaseTime(formatPhases[lastPhaseIndex + 1]);
        } else {
          newPhase = 'ended';
        }
      }
    } else if (formatPhases.includes(phase)) {
      // During a speech phase - opponent just finished, switch to player
      if (currentSpeaker === 'pro') {
        newSpeaker = 'con';
        newTime = getPhaseTime(phase);
      } else {
        newSpeaker = 'pro';
        newTime = getPhaseTime(phase);
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
  }, [state, clearTranscript, currentFormatPhases]);

  const getLastPhase = (): string => {
    // Determine what phase we were in before evaluation/feedback
    const formatPhases = currentFormatPhases.map((p) => p.phase);
    const { speeches, position } = state;
    // Check from end of phases backward
    for (let i = formatPhases.length - 1; i >= 0; i--) {
      const phaseName = formatPhases[i];
      const key = `${position}${phaseName.charAt(0).toUpperCase() + phaseName.slice(1)}`;
      if (speeches[key as keyof typeof speeches]) return phaseName;
    }
    return formatPhases[0];
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
    constructive: 'Constructive Speech',
    cross_exam: 'Cross-Examination',
    wsc_rebuttal: 'Rebuttal',
    summary: 'Summary',
  };

  const renderSpeechInput = () => (
    <div className="flex-1 flex flex-col">
      {/* Microphone Permission Request */}
      {sttSupported && (permissionState === 'prompt' || permissionState === 'unknown') && !isListening && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-gradient-to-r from-gold-50 to-cream-100 rounded-xl border-2 border-gold-200"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gold-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-ink-800 mb-1">Enable Voice Input?</h4>
              <p className="text-sm text-ink-600 mb-3">
                Speak your debate arguments instead of typing! Click the button below to allow microphone access.
              </p>
              <Button
                variant="gold"
                size="sm"
                onClick={handleRequestPermission}
                disabled={isRequestingPermission}
              >
                {isRequestingPermission ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Allow Microphone
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Permission Denied Message */}
      {sttSupported && permissionState === 'denied' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-coral-50 rounded-xl border border-coral-200"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-coral-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-coral-800 mb-1">Microphone Access Blocked</h4>
              <p className="text-sm text-coral-700 mb-2">
                To use voice input, please enable microphone access in your browser settings:
              </p>
              <ol className="text-sm text-coral-700 list-decimal list-inside space-y-1 mb-3">
                <li>Click the lock/info icon in your browser's address bar</li>
                <li>Find "Microphone" in the permissions</li>
                <li>Change it to "Allow"</li>
                <li>Refresh this page</li>
              </ol>
              <p className="text-xs text-coral-600">
                You can still type your arguments below.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Speech-to-text controls */}
      {sttSupported && permissionState === 'granted' && (
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
                {debateFormat === 'wsc' && (
                  <Badge variant="outline" className="ml-2 text-xs">WSC Criteria</Badge>
                )}
              </h3>
              <div className="space-y-4">
                {Object.entries(evaluation.scores).map(([key, score]) => {
                  const wscLabel = debateFormat === 'wsc'
                    ? key === 'clarity' || key === 'relevance' ? 'Content (40%)'
                    : key === 'logic' || key === 'evidence' ? 'Strategy (30%)'
                    : 'Style (30%)'
                    : undefined;

                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-ink-600 capitalize">{key}</span>
                          {wscLabel && (
                            <span className="text-xs text-ink-400">{wscLabel}</span>
                          )}
                        </div>
                        <span className={`font-semibold ${scoreColor(score)}`}>{score}/100</span>
                      </div>
                      <Progress value={score} max={100} variant={progressColor(score) as 'sage' | 'gold' | 'coral'} />
                    </div>
                  );
                })}
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
              className="text-center max-w-lg"
            >
              <div className="w-20 h-20 bg-ink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-ink-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
                Mini Debate
              </h2>
              <p className="text-ink-600 mb-6">
                Practice your argumentation skills with AI-powered feedback!
              </p>

              {/* Format Selector */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setDebateFormat('standard')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    debateFormat === 'standard'
                      ? 'border-gold-500 bg-gold-50 ring-2 ring-gold-200'
                      : 'border-ink-200 bg-white hover:border-ink-300'
                  }`}
                >
                  <h4 className="font-semibold text-ink-800 text-sm mb-1">Standard</h4>
                  <p className="text-xs text-ink-500">Opening, Rebuttal, Closing</p>
                  <p className="text-xs text-ink-400 mt-1">~3.5 min per side</p>
                </button>
                <button
                  onClick={() => setDebateFormat('wsc')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    debateFormat === 'wsc'
                      ? 'border-gold-500 bg-gold-50 ring-2 ring-gold-200'
                      : 'border-ink-200 bg-white hover:border-ink-300'
                  }`}
                >
                  <h4 className="font-semibold text-ink-800 text-sm mb-1">WSC Format</h4>
                  <p className="text-xs text-ink-500">Constructive, Cross-Exam, Rebuttal, Summary</p>
                  <p className="text-xs text-ink-400 mt-1">~12 min per side</p>
                </button>
              </div>

              {/* WSC Scoring Rubric */}
              {debateFormat === 'wsc' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-ink-50 rounded-xl text-left"
                >
                  <h4 className="font-semibold text-ink-700 text-sm mb-3">WSC Scoring Rubric</h4>
                  <div className="space-y-2">
                    {Object.values(WSC_SCORING_RUBRIC).map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <span className="text-sm font-medium text-ink-700">{item.label}</span>
                          <Badge variant="outline" className="text-xs">{item.weight}%</Badge>
                        </div>
                        <span className="text-xs text-ink-500">{item.description}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

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

                  {/* AI Debate Hints */}
                  <div className="mt-6">
                    {!hints && !isLoadingHints && (
                      <Button
                        variant="secondary"
                        onClick={fetchHints}
                        className="gap-2 w-full"
                      >
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        Get AI Hints
                      </Button>
                    )}

                    {isLoadingHints && (
                      <div className="flex items-center justify-center gap-2 text-sm text-ink-500 py-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AI is preparing your hints...
                      </div>
                    )}

                    {hintsError && (
                      <p className="text-sm text-coral-600 mt-2">{hintsError}</p>
                    )}

                    {hints && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {/* Talking Points as Checklist */}
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-semibold text-purple-800">Talking Points</span>
                          </div>
                          <div className="space-y-3">
                            {hints.talkingPoints.map((tp, i) => (
                              <button
                                key={i}
                                onClick={() => toggleCoveredPoint(i)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                  coveredPoints.has(i)
                                    ? 'bg-sage-50 border-sage-300'
                                    : 'bg-white border-purple-100 hover:border-purple-300'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <CheckCircle2
                                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                                      coveredPoints.has(i)
                                        ? 'text-sage-600'
                                        : 'text-ink-300'
                                    }`}
                                  />
                                  <div>
                                    <p className={`text-sm font-medium ${
                                      coveredPoints.has(i) ? 'text-sage-700 line-through' : 'text-ink-700'
                                    }`}>
                                      {tp.point}
                                    </p>
                                    {tp.evidence && (
                                      <p className="text-xs text-ink-500 mt-1">
                                        Evidence: {tp.evidence}
                                      </p>
                                    )}
                                    {tp.tip && (
                                      <p className="text-xs text-purple-600 mt-1">
                                        Tip: {tp.tip}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Counter-arguments to prepare for */}
                        {hints.counterarguments.length > 0 && (
                          <div className="p-3 bg-coral-50 border border-coral-200 rounded-xl">
                            <p className="text-xs font-semibold text-coral-700 mb-2">They might argue:</p>
                            <ul className="space-y-1">
                              {hints.counterarguments.map((ca, i) => (
                                <li key={i} className="text-xs text-coral-600 flex items-start gap-1">
                                  <span>-</span> {ca}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Vocabulary */}
                        {hints.vocabularyTips.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {hints.vocabularyTips.map((v, i) => (
                              <Badge key={i} variant="outline" size="sm">{v}</Badge>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  <Button
                    variant="gold"
                    onClick={() => {
                      const firstPhase = currentFormatPhases[0];
                      setState((prev) => ({
                        ...prev,
                        phase: firstPhase.phase,
                        timeRemaining: firstPhase.minutes * 60,
                      }));
                    }}
                    className="mt-6"
                  >
                    I&apos;m Ready to Debate!
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'opening':
      case 'rebuttal':
      case 'closing':
      case 'constructive':
      case 'cross_exam':
      case 'wsc_rebuttal':
      case 'summary':
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

              {/* Collapsible Hints Sidebar */}
              {hints && isMyTurn && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4"
                >
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 mb-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="font-medium">AI Hints</span>
                    {showHints ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                    <span className="text-xs text-ink-400">
                      ({coveredPoints.size}/{hints.talkingPoints.length} covered)
                    </span>
                  </button>
                  <AnimatePresence>
                    {showHints && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                          {hints.talkingPoints.map((tp, i) => (
                            <button
                              key={i}
                              onClick={() => toggleCoveredPoint(i)}
                              className="w-full flex items-start gap-2 text-left"
                            >
                              <CheckCircle2
                                className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                  coveredPoints.has(i) ? 'text-sage-600' : 'text-ink-300'
                                }`}
                              />
                              <span className={`text-xs ${
                                coveredPoints.has(i)
                                  ? 'text-sage-600 line-through'
                                  : 'text-ink-600'
                              }`}>
                                {tp.point}
                              </span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

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
      timeRemaining={activePhases.includes(state.phase) ? state.timeRemaining : undefined}
      showTimer={activePhases.includes(state.phase)}
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
    // WSC format phases
    constructive: {
      pro: `I firmly believe that ${topic.proPosition.toLowerCase()} Let me present my constructive case with three key arguments. First, the evidence from recent studies demonstrates clear benefits. Second, historical precedent supports this position. Third, the stakeholders most affected stand to gain significantly. The data is compelling and the logic is sound.`,
      con: `I stand against the proposition. ${topic.conPosition} My constructive case rests on three pillars. First, the proposed change carries unacceptable risks. Second, current frameworks already address the core issues. Third, the opportunity cost of this approach diverts resources from proven solutions.`,
    },
    cross_exam: {
      pro: `I would ask my opponent: how do you account for the growing body of evidence that supports our position? Can you explain why your alternative has failed in similar contexts? What specific harm do you foresee that outweighs the documented benefits?`,
      con: `I challenge my opponent to explain: what safeguards prevent the risks I outlined? How do you address the cases where this approach has failed? Can you quantify the actual benefits beyond theoretical projections?`,
    },
    wsc_rebuttal: {
      pro: `My opponent's cross-examination reveals gaps in their analysis. They cannot adequately explain away the evidence I presented. Their concerns, while understandable, are mitigated by the safeguards built into this approach. The benefits remain clear and compelling.`,
      con: `The cross-examination exposed fundamental weaknesses in the proposition. My opponent relies on optimistic projections rather than proven outcomes. The risks I identified remain unaddressed. We must proceed with caution rather than optimism.`,
    },
    summary: {
      pro: `In summary, the weight of evidence, precedent, and logic all support our position. We have demonstrated clear benefits, addressed concerns, and shown that this path forward serves the greatest good. I urge you to vote in favor.`,
      con: `To conclude, the proposition has not met its burden of proof. The risks are real, the evidence is contested, and better alternatives exist. Prudence demands we reject this approach and pursue more measured solutions.`,
    },
  };

  return speeches[phase]?.[position] || 'The opponent presents their argument.';
}
