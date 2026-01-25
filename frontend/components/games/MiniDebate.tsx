'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Clock, ThumbsUp, ThumbsDown, Mic, MicOff, Users, Lightbulb } from 'lucide-react';
import { Button, Card, CardContent, Badge, Avatar, Progress, Textarea } from '@/components/ui';
import { GameLayout, WaitingRoom, Countdown, GameOver } from './GameLayout';
import { type GamePlayer } from '@/lib/games/types';

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

const DEBATE_TOPICS: DebateTopic[] = [
  {
    id: 'topic-1',
    topic: 'Should homework be abolished?',
    proPosition: 'Homework should be abolished because it causes stress and takes away from family time.',
    conPosition: 'Homework is essential for reinforcing learning and developing good study habits.',
    background: 'Studies show mixed results on homework effectiveness, especially for younger students.',
  },
  {
    id: 'topic-2',
    topic: 'Should school start later in the morning?',
    proPosition: 'Later start times align with teen sleep patterns and improve academic performance.',
    conPosition: 'Earlier start times teach discipline and allow for afternoon activities.',
    background: 'Research indicates teenagers natural sleep cycle shifts, making early mornings difficult.',
  },
  {
    id: 'topic-3',
    topic: 'Should social media have age restrictions?',
    proPosition: 'Age restrictions protect young people from harmful content and cyberbullying.',
    conPosition: 'Age restrictions limit educational opportunities and social connection.',
    background: 'Social media use among young people has grown significantly in recent years.',
  },
  {
    id: 'topic-4',
    topic: 'Should animals be kept in zoos?',
    proPosition: 'Zoos protect endangered species and educate the public about wildlife.',
    conPosition: 'Zoos restrict animals\' freedom and cannot replicate natural habitats.',
    background: 'Modern zoos focus on conservation, but debate continues about animal welfare.',
  },
  {
    id: 'topic-5',
    topic: 'Should coding be a required school subject?',
    proPosition: 'Coding teaches logical thinking and prepares students for future jobs.',
    conPosition: 'Not all students need coding skills, and it takes time from other subjects.',
    background: 'Technology jobs are growing, but so is the importance of many other skills.',
  },
];

type DebatePhase = 'waiting' | 'prep' | 'opening' | 'rebuttal' | 'closing' | 'voting' | 'ended';

/**
 * MiniDebate - Structured debate practice
 * Practice argumentation and persuasion skills
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
    score: { pro: 0, con: 0 },
  });

  const [countdownValue, setCountdownValue] = useState(3);

  // Timer
  useEffect(() => {
    if (['prep', 'opening', 'rebuttal', 'closing'].includes(state.phase) && state.timeRemaining > 0) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, timeRemaining: prev.timeRemaining - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (state.timeRemaining === 0 && state.phase !== 'waiting' && state.phase !== 'voting' && state.phase !== 'ended') {
      handleTimeUp();
    }
  }, [state.phase, state.timeRemaining]);

  const handleStart = () => {
    const randomTopic = DEBATE_TOPICS[Math.floor(Math.random() * DEBATE_TOPICS.length)];
    const randomPosition = Math.random() > 0.5 ? 'pro' : 'con';

    setState((prev) => ({
      ...prev,
      topic: randomTopic,
      position: randomPosition,
      phase: 'prep',
      timeRemaining: 60, // 1 minute prep
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
    }));
  };

  const handleTimeUp = () => {
    // Save current speech and move to next phase
    const { phase, currentSpeaker, currentSpeech, speeches, position } = state;

    let newSpeeches = { ...speeches };
    let newPhase: DebatePhase = phase;
    let newSpeaker = currentSpeaker;
    let newTime = 60;

    if (phase === 'prep') {
      newPhase = 'opening';
      newTime = 90; // 1.5 minutes for opening
    } else if (phase === 'opening') {
      if (currentSpeaker === position) {
        // Save player's speech
        newSpeeches = {
          ...speeches,
          [`${position}Opening`]: currentSpeech,
        };
      }
      // Generate AI opponent speech if applicable
      if (currentSpeaker === 'pro' && position === 'con') {
        newSpeeches.proOpening = generateAISpeech('opening', 'pro', state.topic);
      } else if (currentSpeaker === 'con' && position === 'pro') {
        newSpeeches.conOpening = generateAISpeech('opening', 'con', state.topic);
      }

      if (currentSpeaker === 'pro') {
        newSpeaker = 'con';
        newTime = 90;
      } else {
        newPhase = 'rebuttal';
        newSpeaker = 'pro';
        newTime = 60;
      }
    } else if (phase === 'rebuttal') {
      if (currentSpeaker === position) {
        newSpeeches = {
          ...speeches,
          [`${position}Rebuttal`]: currentSpeech,
        };
      }

      if (currentSpeaker === 'pro') {
        newSpeaker = 'con';
        newTime = 60;
      } else {
        newPhase = 'closing';
        newSpeaker = 'pro';
        newTime = 60;
      }
    } else if (phase === 'closing') {
      if (currentSpeaker === position) {
        newSpeeches = {
          ...speeches,
          [`${position}Closing`]: currentSpeech,
        };
      }

      if (currentSpeaker === 'pro') {
        newSpeaker = 'con';
        newTime = 60;
      } else {
        newPhase = 'voting';
      }
    }

    setState((prev) => ({
      ...prev,
      phase: newPhase,
      speeches: newSpeeches,
      currentSpeaker: newSpeaker,
      timeRemaining: newTime,
      currentSpeech: '',
    }));
  };

  const handleSubmitSpeech = () => {
    handleTimeUp();
  };

  const handleVote = (winner: 'pro' | 'con') => {
    const score = winner === state.position ? 100 : 50;
    setState((prev) => ({
      ...prev,
      phase: 'ended',
      score: { ...prev.score, [winner]: prev.score[winner] + 1 },
    }));
  };

  const handleExit = () => {
    onExit?.();
  };

  const isMyTurn = state.currentSpeaker === state.position;
  const phaseNames: Record<DebatePhase, string> = {
    waiting: 'Waiting',
    prep: 'Preparation',
    opening: 'Opening Statement',
    rebuttal: 'Rebuttal',
    closing: 'Closing Statement',
    voting: 'Voting',
    ended: 'Complete',
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
              <p className="text-ink-600 mb-8">
                Practice your argumentation skills! You'll be assigned a random topic and position to argue.
              </p>
              <Button variant="gold" size="lg" onClick={handleStart}>
                Start Debate
              </Button>
            </motion.div>
          </div>
        );

      case 'prep':
      case 'opening':
      case 'rebuttal':
      case 'closing':
        return (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
              {/* Topic Card */}
              <Card className="mb-6 bg-ink-800 text-white">
                <CardContent className="p-6">
                  <Badge variant="gold" className="mb-3">
                    {state.position === 'pro' ? 'FOR' : 'AGAINST'}
                  </Badge>
                  <h2 className="font-display text-2xl font-bold mb-3">
                    {state.topic.topic}
                  </h2>
                  <p className="text-cream-200 text-sm">
                    Your position: {state.position === 'pro' ? state.topic.proPosition : state.topic.conPosition}
                  </p>
                </CardContent>
              </Card>

              {/* Phase & Timer */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge variant={isMyTurn ? 'gold' : 'outline'}>
                    {phaseNames[state.phase]}
                  </Badge>
                  {!isMyTurn && state.phase !== 'prep' && (
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
              {state.phase === 'prep' ? (
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
                  </CardContent>
                </Card>
              ) : isMyTurn ? (
                <div className="flex-1 flex flex-col">
                  <Textarea
                    value={state.currentSpeech}
                    onChange={(e) => setState((prev) => ({ ...prev, currentSpeech: e.target.value }))}
                    placeholder={`Write your ${phaseNames[state.phase].toLowerCase()}...`}
                    className="flex-1 resize-none"
                    rows={8}
                  />
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-ink-500">
                      {state.currentSpeech.length} characters
                    </span>
                    <Button
                      variant="gold"
                      onClick={handleSubmitSpeech}
                      disabled={state.currentSpeech.length < 20}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Submit Speech
                    </Button>
                  </div>
                </div>
              ) : (
                <Card className="flex-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MicOff className="w-5 h-5 text-coral-600" />
                      <h3 className="font-semibold text-ink-800">Opponent Speaking</h3>
                    </div>
                    <p className="text-ink-500 italic">
                      {generateAISpeech(state.phase, state.currentSpeaker, state.topic)}
                    </p>
                    <Button
                      variant="secondary"
                      onClick={handleTimeUp}
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

      case 'voting':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md"
            >
              <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
                Who Won?
              </h2>
              <p className="text-ink-600 mb-8">
                Based on the arguments presented, who made a more convincing case?
              </p>

              <div className="flex gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleVote('pro')}
                  className="flex-1 bg-sage-600 hover:bg-sage-700"
                >
                  <ThumbsUp className="w-5 h-5 mr-2" />
                  FOR wins
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => handleVote('con')}
                  className="flex-1 bg-coral-100 hover:bg-coral-200 text-coral-700 border-coral-200"
                >
                  <ThumbsDown className="w-5 h-5 mr-2" />
                  AGAINST wins
                </Button>
              </div>
            </motion.div>
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
                      <p className="text-3xl font-bold text-gold-600">100</p>
                      <p className="text-sm text-ink-500">Points</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-ink-800">
                        {state.position === 'pro' ? 'FOR' : 'AGAINST'}
                      </p>
                      <p className="text-sm text-ink-500">Your Side</p>
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
      subtitle={state.phase !== 'waiting' ? state.topic.topic : 'Practice argumentation'}
      players={[{ id: 'solo', display_name: 'You', avatar_color: '#6366F1', score: 0, is_ready: true, is_connected: true }]}
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
      pro: `I firmly believe that ${topic.proPosition.toLowerCase()} This is an important issue that affects many people, and we must consider the positive outcomes that could result from supporting this position.`,
      con: `I respectfully disagree with my opponent. ${topic.conPosition} We need to think carefully about the consequences and consider alternative approaches.`,
    },
    rebuttal: {
      pro: `While my opponent makes some valid points, they fail to address the core benefits. The evidence clearly shows that the advantages outweigh any potential drawbacks.`,
      con: `My opponent's arguments, while passionate, overlook several key issues. We must consider the practical implications and long-term effects.`,
    },
    closing: {
      pro: `In conclusion, supporting this position leads to better outcomes for everyone. I urge you to consider the evidence and vote in favor.`,
      con: `To summarize, we must be cautious about making changes without fully understanding the consequences. The current approach has merits we shouldn't dismiss.`,
    },
  };

  return speeches[phase]?.[position] || 'The opponent presents their argument.';
}
