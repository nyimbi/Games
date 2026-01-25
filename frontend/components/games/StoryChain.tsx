'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PenTool, Send, Clock, Users, BookOpen, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent, Badge, Avatar, Textarea, Progress } from '@/components/ui';
import { GameLayout, WaitingRoom, Countdown, GameOver } from './GameLayout';
import { useGameState } from '@/lib/hooks/useGameState';
import { type GamePlayer } from '@/lib/games/types';

interface StoryChainProps {
  sessionId: string;
  isHost?: boolean;
  onExit?: () => void;
  mode?: 'solo' | 'multiplayer';
}

// Story prompts for solo mode
const STORY_PROMPTS = [
  {
    id: 'prompt-1',
    title: 'The Mysterious Door',
    opening: 'When Maya pushed open the ancient wooden door, she never expected to find...',
  },
  {
    id: 'prompt-2',
    title: 'The Last Robot',
    opening: 'In the year 2150, the last robot on Earth woke up to discover...',
  },
  {
    id: 'prompt-3',
    title: 'The Talking Animal',
    opening: 'It was just an ordinary Tuesday until the cat looked up and said...',
  },
  {
    id: 'prompt-4',
    title: 'The Time Capsule',
    opening: 'Buried beneath the old oak tree, the time capsule contained something no one expected...',
  },
  {
    id: 'prompt-5',
    title: 'The Secret Map',
    opening: 'The faded map showed a path through the forest that didn\'t exist on any other map...',
  },
];

/**
 * StoryChain - Turn-based collaborative story writing
 * Each player adds to the story in sequence
 */
export function StoryChain({ sessionId, isHost = false, onExit, mode = 'multiplayer' }: StoryChainProps) {
  const gameState = useGameState();
  const {
    phase,
    players,
    timeRemaining,
    currentRound,
    totalRounds,
    joinSession,
    leaveSession,
  } = gameState;

  // Solo mode state
  const [soloState, setSoloState] = useState({
    phase: 'waiting' as 'waiting' | 'playing' | 'ended',
    currentPrompt: STORY_PROMPTS[0],
    storyParts: [] as { author: string; text: string }[],
    currentRound: 0,
    totalRounds: 5,
    timeLeft: 60,
  });

  const [currentText, setCurrentText] = useState('');
  const [countdownValue, setCountdownValue] = useState(3);

  // Timer for solo mode
  useEffect(() => {
    if (mode === 'solo' && soloState.phase === 'playing' && soloState.timeLeft > 0) {
      const timer = setTimeout(() => {
        setSoloState((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mode, soloState.phase, soloState.timeLeft]);

  // Join session for multiplayer
  useEffect(() => {
    if (mode === 'multiplayer') {
      joinSession(sessionId);
      return () => leaveSession();
    }
  }, [sessionId, mode, joinSession, leaveSession]);

  const handleStartSolo = () => {
    const randomPrompt = STORY_PROMPTS[Math.floor(Math.random() * STORY_PROMPTS.length)];
    setSoloState((prev) => ({
      ...prev,
      phase: 'playing',
      currentPrompt: randomPrompt,
      storyParts: [{ author: 'Narrator', text: randomPrompt.opening }],
      currentRound: 1,
      timeLeft: 60,
    }));
  };

  const handleSubmitPart = () => {
    if (!currentText.trim()) return;

    setSoloState((prev) => {
      const newParts = [...prev.storyParts, { author: 'You', text: currentText.trim() }];
      const isLastRound = prev.currentRound >= prev.totalRounds;

      if (isLastRound) {
        return { ...prev, storyParts: newParts, phase: 'ended' };
      }

      return {
        ...prev,
        storyParts: newParts,
        currentRound: prev.currentRound + 1,
        timeLeft: 60,
      };
    });

    setCurrentText('');
  };

  const handleExit = () => {
    if (mode === 'multiplayer') {
      leaveSession();
    }
    onExit?.();
  };

  const currentPhase = mode === 'solo' ? soloState.phase : phase;
  const currentTime = mode === 'solo' ? soloState.timeLeft : timeRemaining;
  const roundNumber = mode === 'solo' ? soloState.currentRound : currentRound;
  const maxRounds = mode === 'solo' ? soloState.totalRounds : totalRounds;

  const renderContent = () => {
    switch (currentPhase) {
      case 'waiting':
        if (mode === 'solo') {
          return (
            <div className="flex-1 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-md"
              >
                <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PenTool className="w-10 h-10 text-sage-600" />
                </div>
                <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
                  Story Chain
                </h2>
                <p className="text-ink-600 mb-8">
                  Build a creative story one paragraph at a time. You'll have 60 seconds for each part.
                </p>
                <Button variant="gold" size="lg" onClick={handleStartSolo}>
                  Start Writing
                </Button>
              </motion.div>
            </div>
          );
        }
        return (
          <WaitingRoom
            players={players}
            minPlayers={2}
            isHost={isHost}
            gameName="Story Chain"
          />
        );

      case 'countdown':
        return <Countdown count={countdownValue} gameName="Story Chain" />;

      case 'playing':
        return (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-ink-500 mb-2">
                  <span>Part {roundNumber} of {maxRounds}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {currentTime}s
                  </span>
                </div>
                <Progress value={roundNumber} max={maxRounds} variant="sage" />
              </div>

              {/* Story So Far */}
              <Card className="mb-6 flex-1 overflow-auto">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-sage-600" />
                    <h3 className="font-display font-semibold text-ink-800">
                      {mode === 'solo' ? soloState.currentPrompt.title : 'Our Story'}
                    </h3>
                  </div>

                  <div className="space-y-4 prose prose-ink max-w-none">
                    {(mode === 'solo' ? soloState.storyParts : []).map((part, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`${
                          part.author === 'Narrator'
                            ? 'text-ink-500 italic'
                            : 'text-ink-800'
                        }`}
                      >
                        {part.author !== 'Narrator' && (
                          <span className="text-xs text-sage-600 font-medium block mb-1">
                            — {part.author}
                          </span>
                        )}
                        <p className="leading-relaxed">{part.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Writing Area */}
              <div className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={currentText}
                    onChange={(e) => setCurrentText(e.target.value)}
                    placeholder="Continue the story..."
                    rows={4}
                    maxLength={500}
                    className="resize-none"
                  />
                  <span className="absolute bottom-3 right-3 text-xs text-ink-400">
                    {currentText.length}/500
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-ink-500">
                    Add to the story with 1-3 sentences
                  </p>
                  <Button
                    variant="gold"
                    onClick={handleSubmitPart}
                    disabled={!currentText.trim() || currentText.length < 10}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {roundNumber >= maxRounds ? 'Finish Story' : 'Add Part'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ended':
        return (
          <div className="flex-1 flex flex-col p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto w-full"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-gold-600" />
                </div>
                <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">
                  Story Complete!
                </h2>
                <p className="text-ink-600">
                  Here's your creative story
                </p>
              </div>

              {/* Final Story */}
              <Card className="mb-8">
                <CardContent className="p-8">
                  <h3 className="font-display text-2xl font-bold text-ink-800 mb-6 text-center">
                    {mode === 'solo' ? soloState.currentPrompt.title : 'Our Story'}
                  </h3>

                  <div className="prose prose-lg prose-ink max-w-none">
                    {(mode === 'solo' ? soloState.storyParts : []).map((part, index) => (
                      <span key={index} className={part.author === 'Narrator' ? 'italic' : ''}>
                        {part.text}{' '}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-sage-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-sage-700">
                    {(mode === 'solo' ? soloState.storyParts : []).length}
                  </p>
                  <p className="text-sm text-ink-500">Parts Written</p>
                </div>
                <div className="bg-gold-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gold-700">
                    {(mode === 'solo' ? soloState.storyParts : [])
                      .reduce((acc, p) => acc + p.text.split(' ').length, 0)}
                  </p>
                  <p className="text-sm text-ink-500">Words Total</p>
                </div>
                <div className="bg-coral-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-coral-700">100</p>
                  <p className="text-sm text-ink-500">Points Earned</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  variant="gold"
                  size="lg"
                  onClick={() => {
                    setSoloState({
                      phase: 'waiting',
                      currentPrompt: STORY_PROMPTS[0],
                      storyParts: [],
                      currentRound: 0,
                      totalRounds: 5,
                      timeLeft: 60,
                    });
                    setCurrentText('');
                  }}
                  className="flex-1"
                >
                  Write Another
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

  const displayPlayers = mode === 'solo'
    ? [{ id: 'solo', display_name: 'You', avatar_color: '#22C55E', score: 0, is_ready: true, is_connected: true }]
    : players;

  return (
    <GameLayout
      title="Story Chain"
      subtitle={mode === 'solo' ? 'Solo Writing' : 'Build a story together'}
      players={displayPlayers}
      currentRound={roundNumber}
      totalRounds={maxRounds}
      timeRemaining={currentPhase === 'playing' ? currentTime : undefined}
      showTimer={currentPhase === 'playing'}
      showRound={currentPhase === 'playing'}
      onBack={handleExit}
    >
      {renderContent()}
    </GameLayout>
  );
}
