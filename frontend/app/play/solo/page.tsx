'use client';

import { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Zap, BookOpen, Beaker, Palette, Globe, Sparkles, ArrowLeft,
  MessageSquare, PenTool, FileText, Puzzle, Mic, RotateCcw, Play, Settings2
} from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import {
  QuickfireQuiz,
  FlashcardFrenzy,
  PatternPuzzles,
  StoryChain,
  EssaySprint,
  MiniDebate,
  ImpromptuChallenge,
} from '@/components/games';
import type { Question } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { GameProvider } from '@/lib/hooks/useGameState';
import { getQuestionsBySubject, getMixedQuestions } from '@/lib/games/questions';

const SUBJECTS = [
  { value: 'mixed', name: 'All Subjects', icon: Zap, color: 'bg-gradient-to-r from-gold-100 to-coral-100 text-ink-700' },
  { value: 'science', name: 'Science', icon: Beaker, color: 'bg-sage-100 text-sage-700' },
  { value: 'social_studies', name: 'Social Studies', icon: Globe, color: 'bg-coral-100 text-coral-700' },
  { value: 'arts', name: 'Arts', icon: Palette, color: 'bg-gold-100 text-gold-700' },
  { value: 'literature', name: 'Literature', icon: BookOpen, color: 'bg-ink-100 text-ink-700' },
  { value: 'special_area', name: 'WSC Special', icon: Sparkles, color: 'bg-purple-100 text-purple-700' },
];

const DIFFICULTIES = [
  { value: 'easy', name: 'Easy', color: 'bg-sage-500' },
  { value: 'medium', name: 'Medium', color: 'bg-gold-500' },
  { value: 'hard', name: 'Hard', color: 'bg-coral-500' },
];

// Available solo games - simplified flat structure
const SOLO_GAMES = [
  { id: 'quickfire_quiz', name: 'Quickfire Quiz', icon: Zap, color: 'bg-gold-100 text-gold-700', description: 'Timed multiple choice', needsQuestions: true },
  { id: 'flashcard_frenzy', name: 'Flashcard Frenzy', icon: RotateCcw, color: 'bg-gold-100 text-gold-700', description: 'Speed flashcard review', needsQuestions: true },
  { id: 'pattern_puzzles', name: 'Pattern Puzzles', icon: Puzzle, color: 'bg-sky-100 text-sky-700', description: 'Find the pattern', needsQuestions: false },
  { id: 'story_chain', name: 'Story Chain', icon: PenTool, color: 'bg-sage-100 text-sage-700', description: 'Build stories', needsQuestions: false },
  { id: 'essay_sprint', name: 'Essay Sprint', icon: FileText, color: 'bg-coral-100 text-coral-700', description: 'Timed writing', needsQuestions: false },
  { id: 'mini_debate', name: 'Mini-Debate', icon: MessageSquare, color: 'bg-purple-100 text-purple-700', description: 'Practice debate', needsQuestions: false },
  { id: 'impromptu_challenge', name: 'Impromptu', icon: Mic, color: 'bg-purple-100 text-purple-700', description: 'Quick speaking', needsQuestions: false },
];

type GameId = 'quickfire_quiz' | 'flashcard_frenzy' | 'pattern_puzzles' | 'story_chain' | 'essay_sprint' | 'mini_debate' | 'impromptu_challenge';

export default function SoloPracticePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [selectedGame, setSelectedGame] = useState<GameId | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('mixed');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?role=player');
    }
  }, [isAuthenticated, authLoading, router]);

  // Quick play - start immediately with current settings
  const handleQuickPlay = (gameId: GameId) => {
    setSelectedGame(gameId);
    const game = SOLO_GAMES.find(g => g.id === gameId);

    if (game?.needsQuestions) {
      // Load questions with current settings
      const localQuestions = selectedSubject === 'mixed'
        ? getMixedQuestions(selectedDifficulty as 'easy' | 'medium' | 'hard', 500)
        : getQuestionsBySubject(selectedSubject, selectedDifficulty as 'easy' | 'medium' | 'hard', 500);
      setQuestions(localQuestions);
    }

    setIsPlaying(true);
  };

  // Open settings panel for a game
  const handleSettings = (gameId: GameId) => {
    setSelectedGame(gameId);
    setShowSettings(true);
  };

  // Start game from settings panel
  const handleStartFromSettings = () => {
    if (!selectedGame) return;

    const game = SOLO_GAMES.find(g => g.id === selectedGame);
    if (game?.needsQuestions) {
      const localQuestions = selectedSubject === 'mixed'
        ? getMixedQuestions(selectedDifficulty as 'easy' | 'medium' | 'hard', 500)
        : getQuestionsBySubject(selectedSubject, selectedDifficulty as 'easy' | 'medium' | 'hard', 500);
      setQuestions(localQuestions);
    }

    setShowSettings(false);
    setIsPlaying(true);
  };

  const handleExit = () => {
    setIsPlaying(false);
    setSelectedGame(null);
    setQuestions([]);
  };

  const handleBack = () => {
    if (showSettings) {
      setShowSettings(false);
      setSelectedGame(null);
    } else {
      router.push('/team');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="w-12 h-12 border-4 border-ink-200 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Playing a game
  if (isPlaying && selectedGame) {
    const gameComponents: Record<GameId, ReactElement> = {
      quickfire_quiz: <QuickfireQuiz sessionId="solo" mode="solo" questions={questions} onExit={handleExit} />,
      flashcard_frenzy: <FlashcardFrenzy sessionId="solo" questions={questions} subject={selectedSubject} difficulty={selectedDifficulty} onExit={handleExit} />,
      pattern_puzzles: <PatternPuzzles sessionId="solo" onExit={handleExit} />,
      story_chain: <StoryChain sessionId="solo" mode="solo" onExit={handleExit} />,
      essay_sprint: <EssaySprint sessionId="solo" mode="solo" onExit={handleExit} />,
      mini_debate: <MiniDebate sessionId="solo" mode="solo" onExit={handleExit} />,
      impromptu_challenge: <ImpromptuChallenge sessionId="solo" onExit={handleExit} />,
    };

    return (
      <GameProvider>
        {gameComponents[selectedGame]}
      </GameProvider>
    );
  }

  // Settings panel for customizing subject/difficulty
  if (showSettings && selectedGame) {
    const game = SOLO_GAMES.find(g => g.id === selectedGame);

    return (
      <main className="min-h-screen bg-cream-100 p-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={handleBack} className="p-2 hover:bg-cream-200 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6 text-ink-600" />
            </button>
            <div>
              <h1 className="font-display text-xl font-bold text-ink-800">{game?.name}</h1>
              <p className="text-ink-500 text-sm">Customize your session</p>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Subject Selection */}
            {game?.needsQuestions && (
              <div>
                <h2 className="font-semibold text-ink-700 mb-3">Subject</h2>
                <div className="grid grid-cols-2 gap-2">
                  {SUBJECTS.map((subject) => (
                    <button
                      key={subject.value}
                      onClick={() => setSelectedSubject(subject.value)}
                      className={`p-3 rounded-xl text-left transition-all flex items-center gap-2 ${
                        selectedSubject === subject.value
                          ? `${subject.color} ring-2 ring-gold-400 shadow-md`
                          : 'bg-white hover:bg-cream-50 border border-ink-100'
                      }`}
                    >
                      <subject.icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{subject.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty Selection */}
            {game?.needsQuestions && (
              <div>
                <h2 className="font-semibold text-ink-700 mb-3">Difficulty</h2>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((diff) => (
                    <button
                      key={diff.value}
                      onClick={() => setSelectedDifficulty(diff.value)}
                      className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                        selectedDifficulty === diff.value
                          ? `${diff.color} text-white shadow-md`
                          : 'bg-white text-ink-600 hover:bg-cream-50 border border-ink-100'
                      }`}
                    >
                      {diff.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start Button */}
            <Button
              variant="gold"
              size="lg"
              onClick={handleStartFromSettings}
              className="w-full mt-4"
            >
              <Play className="w-5 h-5 mr-2" />
              Start {game?.name}
            </Button>
          </motion.div>
        </div>
      </main>
    );
  }

  // Main game selection (1-click to play, or customize)
  return (
    <main className="min-h-screen bg-cream-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={handleBack} className="p-2 hover:bg-cream-200 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-ink-600" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-800">Solo Practice</h1>
            <p className="text-ink-500 text-sm">Tap to play instantly, or customize settings</p>
          </div>
        </div>

        {/* Current Settings Preview */}
        <div className="mb-6 px-4 py-3 bg-white rounded-xl border border-ink-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-500">Quick play:</span>
            <Badge variant="outline" className="capitalize">{selectedSubject === 'mixed' ? 'All Subjects' : selectedSubject.replace('_', ' ')}</Badge>
            <Badge className={`${DIFFICULTIES.find(d => d.value === selectedDifficulty)?.color} text-white`}>
              {selectedDifficulty}
            </Badge>
          </div>
        </div>

        {/* Game Grid - 1 click to play */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {SOLO_GAMES.map((game) => (
            <div
              key={game.id}
              className={`relative rounded-xl overflow-hidden ${game.color} transition-all hover:shadow-lg group`}
            >
              {/* Main clickable area - Quick Play */}
              <button
                onClick={() => handleQuickPlay(game.id as GameId)}
                className="w-full p-4 text-left flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-white/60 rounded-xl flex items-center justify-center flex-shrink-0">
                  <game.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-lg">{game.name}</h3>
                  <p className="text-sm opacity-75">{game.description}</p>
                </div>
                <Play className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Settings button (only for games that need questions) */}
              {game.needsQuestions && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSettings(game.id as GameId);
                  }}
                  className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Customize settings"
                >
                  <Settings2 className="w-4 h-4 text-ink-600" />
                </button>
              )}
            </div>
          ))}
        </motion.div>

        {/* Help text */}
        <p className="text-center text-ink-400 text-sm mt-6">
          Tap any game to start instantly • Hover and tap ⚙️ to customize
        </p>
      </div>
    </main>
  );
}
