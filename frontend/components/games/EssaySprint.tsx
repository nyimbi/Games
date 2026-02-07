'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Clock, Users, Target, CheckCircle, Sparkles, Trophy, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Button, Card, CardContent, Badge, Avatar, Textarea, Progress } from '@/components/ui';
import { GameLayout, WaitingRoom, Countdown, GameOver } from './GameLayout';
import { useGameState } from '@/lib/hooks/useGameState';

interface EssaySprintProps {
  sessionId?: string;
  isHost?: boolean;
  onExit?: () => void;
  mode?: 'solo' | 'multiplayer';
}

// Word count target range
const WORD_TARGET_MIN = 500;
const WORD_TARGET_MAX = 800;

// Essay prompts for solo mode
const ESSAY_PROMPTS = [
  {
    id: 'essay-1',
    title: 'Technology and Society',
    prompt: 'How has technology changed the way we communicate with each other?',
    wordGoal: WORD_TARGET_MIN,
    timeLimit: 1200, // 20 minutes for longer essays
  },
  {
    id: 'essay-2',
    title: 'Environmental Responsibility',
    prompt: 'What can young people do to help protect the environment?',
    wordGoal: WORD_TARGET_MIN,
    timeLimit: 1200,
  },
  {
    id: 'essay-3',
    title: 'The Power of Reading',
    prompt: 'Why is reading important, and what is your favorite book?',
    wordGoal: WORD_TARGET_MIN,
    timeLimit: 1200,
  },
  {
    id: 'essay-4',
    title: 'Future Careers',
    prompt: 'What job would you like to have when you grow up, and why?',
    wordGoal: WORD_TARGET_MIN,
    timeLimit: 1200,
  },
  {
    id: 'essay-5',
    title: 'Cultural Traditions',
    prompt: 'Describe a tradition from your culture that you think is important.',
    wordGoal: WORD_TARGET_MIN,
    timeLimit: 1200,
  },
  // WSC 2026 "Are We There Yet?" Collaborative Writing prompts
  {
    id: 'essay-wsc-1',
    title: 'The Journey vs. The Destination',
    prompt: 'Some argue that the journey matters more than the destination. Using examples from history, science, or literature, discuss whether the process of discovery is more valuable than what is ultimately discovered.',
    wordGoal: WORD_TARGET_MIN,
    timeLimit: 1200,
  },
  {
    id: 'essay-wsc-2',
    title: 'Progress at What Cost?',
    prompt: 'Humanity has made remarkable progress in technology, medicine, and connectivity. But have we left something important behind? Write about what we may have lost in our rush to move forward.',
    wordGoal: WORD_TARGET_MIN,
    timeLimit: 1200,
  },
  {
    id: 'essay-wsc-3',
    title: 'Maps and Uncharted Territory',
    prompt: 'Maps once showed "Here be dragons" at the edges of the known world. What are the uncharted territories of our time, and why do they matter? Consider physical, intellectual, or social frontiers.',
    wordGoal: WORD_TARGET_MIN,
    timeLimit: 1200,
  },
  {
    id: 'essay-wsc-4',
    title: 'The Detour That Changed Everything',
    prompt: 'Many of the greatest discoveries were accidents or detours from the original plan. Write about a time when getting lost -- literally or figuratively -- led to something better than the original destination.',
    wordGoal: WORD_TARGET_MIN,
    timeLimit: 1200,
  },
  {
    id: 'essay-wsc-5',
    title: 'Are We There Yet?',
    prompt: 'The question "Are we there yet?" implies impatience with the present and fixation on the future. Is this restlessness a strength or a weakness of human nature? Argue your position with evidence from multiple disciplines.',
    wordGoal: WORD_TARGET_MIN,
    timeLimit: 1200,
  },
];

// Essay structure guide sections
const ESSAY_STRUCTURE = [
  { section: 'Introduction', detail: 'Hook + thesis statement', icon: '1' },
  { section: 'Body 1', detail: 'Point + evidence + analysis', icon: '2' },
  { section: 'Body 2', detail: 'Point + evidence + analysis', icon: '3' },
  { section: 'Body 3', detail: 'Point + evidence + analysis', icon: '4' },
  { section: 'Conclusion', detail: 'Restate thesis + final thought', icon: '5' },
];

function getWordCountColor(count: number): { text: string; bg: string; label: string } {
  if (count < 200) return { text: 'text-coral-600', bg: 'bg-coral-500', label: 'Keep writing!' };
  if (count < WORD_TARGET_MIN) return { text: 'text-gold-600', bg: 'bg-gold-500', label: 'Getting there...' };
  if (count <= WORD_TARGET_MAX) return { text: 'text-sage-600', bg: 'bg-sage-500', label: 'In the target range!' };
  return { text: 'text-orange-600', bg: 'bg-orange-500', label: 'Consider wrapping up' };
}

// Writing tips shown during essay
const WRITING_TIPS = [
  'Start with a strong opening sentence that grabs attention!',
  'Use specific examples to support your points.',
  'Try to include at least 3 main ideas.',
  'Remember to write a conclusion that summarizes your thoughts.',
  'Vary your sentence length to make your writing more interesting.',
  'Use transition words like "however", "therefore", and "additionally".',
];

/**
 * EssaySprint - Timed essay writing challenge
 * Write a short essay on a prompt within the time limit
 */
export function EssaySprint({ sessionId, isHost = false, onExit, mode = 'solo' }: EssaySprintProps) {
  const [state, setState] = useState({
    phase: 'waiting' as 'waiting' | 'playing' | 'ended',
    currentPrompt: ESSAY_PROMPTS[0],
    essay: '',
    timeLeft: 300,
    wordCount: 0,
    currentTip: 0,
  });

  const [showStructureGuide, setShowStructureGuide] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Timer
  useEffect(() => {
    if (state.phase === 'playing' && state.timeLeft > 0) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (state.phase === 'playing' && state.timeLeft === 0) {
      setState((prev) => ({ ...prev, phase: 'ended' }));
    }
  }, [state.phase, state.timeLeft]);

  // Rotate writing tips
  useEffect(() => {
    if (state.phase === 'playing') {
      const tipTimer = setInterval(() => {
        setState((prev) => ({
          ...prev,
          currentTip: (prev.currentTip + 1) % WRITING_TIPS.length,
        }));
      }, 15000); // Change tip every 15 seconds
      return () => clearInterval(tipTimer);
    }
  }, [state.phase]);

  // Focus textarea when playing starts
  useEffect(() => {
    if (state.phase === 'playing' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [state.phase]);

  const handleStart = () => {
    const randomPrompt = ESSAY_PROMPTS[Math.floor(Math.random() * ESSAY_PROMPTS.length)];
    setState((prev) => ({
      ...prev,
      phase: 'playing',
      currentPrompt: randomPrompt,
      essay: '',
      timeLeft: randomPrompt.timeLimit,
      wordCount: 0,
      currentTip: 0,
    }));
  };

  const handleEssayChange = (text: string) => {
    const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
    setState((prev) => ({
      ...prev,
      essay: text,
      wordCount: words.length,
    }));
  };

  const handleSubmit = () => {
    setState((prev) => ({ ...prev, phase: 'ended' }));
  };

  const handleRestart = () => {
    setState((prev) => ({
      ...prev,
      phase: 'waiting',
      essay: '',
      wordCount: 0,
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

  const progressPercent = (state.wordCount / state.currentPrompt.wordGoal) * 100;
  const timePercent = (state.timeLeft / state.currentPrompt.timeLimit) * 100;
  const wordsPerMinute = state.currentPrompt.timeLimit > state.timeLeft
    ? Math.round((state.wordCount / ((state.currentPrompt.timeLimit - state.timeLeft) / 60)) || 0)
    : 0;

  // Calculate score based on word count and goal achievement
  const calculateScore = () => {
    const goalBonus = state.wordCount >= state.currentPrompt.wordGoal ? 50 : 0;
    const wordPoints = Math.min(state.wordCount, state.currentPrompt.wordGoal * 1.5) * 2;
    return Math.round(wordPoints + goalBonus);
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
              <div className="w-20 h-20 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-coral-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
                Essay Sprint
              </h2>
              <p className="text-ink-600 mb-4">
                Write a structured essay on a random topic
              </p>
              <div className="bg-paper-100 rounded-xl p-4 mb-8 text-left">
                <h4 className="font-semibold text-ink-700 mb-2">How it works:</h4>
                <ul className="text-sm text-ink-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-coral-500 mt-0.5 shrink-0" />
                    <span>You&apos;ll get a prompt and 20 minutes to write</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-coral-500 mt-0.5 shrink-0" />
                    <span>Target: <strong>500-800 words</strong> (WSC Collaborative Writing length)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-coral-500 mt-0.5 shrink-0" />
                    <span>Use the essay structure guide for best results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-coral-500 mt-0.5 shrink-0" />
                    <span>Includes WSC 2026 &quot;Are We There Yet?&quot; themed prompts</span>
                  </li>
                </ul>
              </div>
              <Button variant="gold" size="lg" onClick={handleStart}>
                Start Writing
              </Button>
            </motion.div>
          </div>
        );

      case 'playing': {
        const wcColor = getWordCountColor(state.wordCount);
        return (
          <div className="flex-1 flex flex-col p-4 md:p-6">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
              {/* Header Stats */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock className={`w-4 h-4 ${state.timeLeft < 120 ? 'text-coral-500 animate-pulse' : 'text-ink-400'}`} />
                    <span className={`text-xl font-bold ${state.timeLeft < 120 ? 'text-coral-600' : 'text-ink-700'}`}>
                      {formatTime(state.timeLeft)}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500">Time Left</p>
                </div>
                {/* Prominent Word Count with color coding */}
                <div className={`bg-white rounded-xl p-3 text-center shadow-sm border-2 ${
                  state.wordCount < 200 ? 'border-coral-300' :
                  state.wordCount < WORD_TARGET_MIN ? 'border-gold-300' :
                  state.wordCount <= WORD_TARGET_MAX ? 'border-sage-300' :
                  'border-orange-300'
                }`}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className={`text-2xl font-bold ${wcColor.text}`}>
                      {state.wordCount}
                    </span>
                  </div>
                  <p className={`text-xs font-medium ${wcColor.text}`}>{wcColor.label}</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-sm text-ink-400">{WORD_TARGET_MIN}-{WORD_TARGET_MAX}</span>
                  </div>
                  <p className="text-xs text-ink-500">Target Words</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <span className="text-xl font-bold text-gold-600">{wordsPerMinute}</span>
                  <p className="text-xs text-ink-500">WPM</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <Progress
                  value={Math.min((state.wordCount / WORD_TARGET_MIN) * 100, 100)}
                  max={100}
                  variant={state.wordCount >= WORD_TARGET_MIN ? 'sage' : state.wordCount >= 200 ? 'gold' : 'coral'}
                />
              </div>

              {/* Prompt Card */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <Badge variant="outline" className="mb-2">{state.currentPrompt.title}</Badge>
                  <p className="text-lg text-ink-800 font-medium">
                    {state.currentPrompt.prompt}
                  </p>
                </CardContent>
              </Card>

              {/* Essay Structure Guide (collapsible) */}
              <div className="mb-4">
                <button
                  onClick={() => setShowStructureGuide(!showStructureGuide)}
                  className="flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-ink-800 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Essay Structure Guide
                  {showStructureGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <AnimatePresence>
                  {showStructureGuide && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 p-4 bg-cream-100 border border-cream-200 rounded-xl">
                        <div className="space-y-2">
                          {ESSAY_STRUCTURE.map((item) => (
                            <div key={item.section} className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-gold-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {item.icon}
                              </span>
                              <div>
                                <span className="font-medium text-ink-700 text-sm">{item.section}</span>
                                <span className="text-ink-500 text-sm"> -- {item.detail}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Writing Area */}
              <div className="flex-1 flex flex-col">
                <Textarea
                  ref={textareaRef}
                  value={state.essay}
                  onChange={(e) => handleEssayChange(e.target.value)}
                  placeholder="Start writing your essay here..."
                  className="flex-1 resize-none text-lg leading-relaxed min-h-[200px]"
                />
              </div>

              {/* Writing Tip */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={state.currentTip}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 flex items-center gap-2 text-sm text-ink-500 bg-gold-50 rounded-lg p-3"
                >
                  <Sparkles className="w-4 h-4 text-gold-500 shrink-0" />
                  <span>{WRITING_TIPS[state.currentTip]}</span>
                </motion.div>
              </AnimatePresence>

              {/* Submit Button */}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="gold"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={state.wordCount < 50}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Submit Essay
                </Button>
              </div>
            </div>
          </div>
        );
      }

      case 'ended':
        const score = calculateScore();
        const goalReached = state.wordCount >= state.currentPrompt.wordGoal;

        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-2xl w-full"
            >
              {/* Celebration */}
              <div className={`w-24 h-24 ${goalReached ? 'bg-gold-500' : 'bg-sage-500'} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">
                {goalReached ? 'Goal Reached!' : 'Essay Complete!'}
              </h2>
              <p className="text-ink-600 mb-8">
                {goalReached
                  ? 'Excellent work! You met your word goal.'
                  : 'Good effort! Keep practicing to hit your word goals.'}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-2xl font-bold text-ink-700">{state.wordCount}</p>
                  <p className="text-sm text-ink-500">Words</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-2xl font-bold text-ink-700">
                    {formatTime(state.currentPrompt.timeLimit - state.timeLeft)}
                  </p>
                  <p className="text-sm text-ink-500">Time Used</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-2xl font-bold text-gold-600">{wordsPerMinute}</p>
                  <p className="text-sm text-ink-500">WPM</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-2xl font-bold text-sage-600">{score}</p>
                  <p className="text-sm text-ink-500">Points</p>
                </div>
              </div>

              {/* Essay Preview */}
              <Card className="mb-8 text-left">
                <CardContent className="p-6">
                  <h3 className="font-display font-semibold text-ink-800 mb-2">
                    {state.currentPrompt.title}
                  </h3>
                  <p className="text-sm text-ink-500 mb-4 italic">
                    {state.currentPrompt.prompt}
                  </p>
                  <div className="prose prose-ink max-w-none text-ink-700 whitespace-pre-wrap">
                    {state.essay || <span className="text-ink-400">No essay written</span>}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4 justify-center">
                <Button variant="gold" size="lg" onClick={handleRestart}>
                  Write Another
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
      title="Essay Sprint"
      subtitle="Timed writing challenge"
      players={[{ id: 'solo', display_name: 'You', avatar_color: '#F97316', score: state.wordCount * 2, is_ready: true, is_connected: true }]}
      currentRound={1}
      totalRounds={1}
      timeRemaining={state.phase === 'playing' ? state.timeLeft : undefined}
      showTimer={state.phase === 'playing'}
      showRound={false}
      onBack={handleExit}
    >
      {renderContent()}
    </GameLayout>
  );
}
