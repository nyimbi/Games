'use client';

import { useState, useEffect, ReactElement, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Zap, BookOpen, Beaker, Palette, Globe, Sparkles, ArrowLeft,
  MessageSquare, PenTool, FileText, Puzzle, Mic, RotateCcw, Play, Settings2,
  Swords, BookOpenCheck, GraduationCap, Flame, BarChart3, Award,
  Volume2, VolumeX, ClipboardList, ChevronDown, ChevronUp, Loader2,
  Link2, Map, Grid3X3,
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
  DailyChallenge,
  ScholarRead,
  ScholarsChallenge,
  BattleMode,
  WrongAnswerJournal,
  ConnectionQuest,
  ScholarSprint,
  MemoryMosaic,
  ArgumentArena,
  TreasureHunt,
  ScavengerBowl,
  RoleWriting,
  ArgumentTennis,
  EliminationOlympics,
  RolePlayDebates,
  ArgumentBuilder,
} from '@/components/games';
import type { Question } from '@/lib/games/types';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSounds } from '@/lib/hooks/useSounds';
import { GameProvider } from '@/lib/hooks/useGameState';
import { getQuestionsBySubject, getMixedQuestions } from '@/lib/games/questions';
import { getDailyStreakData } from '@/lib/games/dailyChallenge';
import { getWrongAnswerCount } from '@/lib/games/wrongAnswerJournal';
import { getEffectiveLevel } from '@/lib/games/studentLevel';
import { getCrossGameStreak, type CrossGameStreakData } from '@/lib/games/crossGameStreak';
import { getStorage, setStorage, STORAGE_KEYS } from '@/lib/storage';

interface CachedGeneratedQuestions {
  questions: Question[];
  timestamp: number;
  subject: string;
  difficulty: string;
}

const AI_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
  { id: 'flashcard_frenzy', name: 'Flashcard Frenzy', icon: RotateCcw, color: 'bg-gold-100 text-gold-700', description: 'Spaced repetition flashcards', needsQuestions: true },
  { id: 'pattern_puzzles', name: 'Pattern Puzzles', icon: Puzzle, color: 'bg-sky-100 text-sky-700', description: 'Find the pattern', needsQuestions: false },
  { id: 'story_chain', name: 'Story Chain', icon: PenTool, color: 'bg-sage-100 text-sage-700', description: 'Build stories', needsQuestions: false },
  { id: 'essay_sprint', name: 'Essay Sprint', icon: FileText, color: 'bg-coral-100 text-coral-700', description: 'Timed writing', needsQuestions: false },
  { id: 'mini_debate', name: 'Mini-Debate', icon: MessageSquare, color: 'bg-purple-100 text-purple-700', description: 'Practice debate', needsQuestions: false },
  { id: 'impromptu_challenge', name: 'Impromptu', icon: Mic, color: 'bg-purple-100 text-purple-700', description: 'Quick speaking', needsQuestions: false },
  { id: 'scholar_read', name: 'Scholar Read', icon: BookOpenCheck, color: 'bg-sage-100 text-sage-700', description: 'Reading comprehension', needsQuestions: false },
  { id: 'scholars_challenge', name: "Scholar's Challenge", icon: GraduationCap, color: 'bg-gold-100 text-gold-700', description: 'Full WSC simulation', needsQuestions: false },
  { id: 'battle_mode', name: 'Battle vs AI', icon: Swords, color: 'bg-coral-100 text-coral-700', description: 'Race against AI', needsQuestions: false },
  { id: 'wrong_answer_review', name: 'Review Mistakes', icon: ClipboardList, color: 'bg-ink-100 text-ink-700', description: 'Learn from errors', needsQuestions: false },
  { id: 'connection_quest', name: 'Connection Quest', icon: Link2, color: 'bg-gold-100 text-gold-700', description: 'Find hidden groups', needsQuestions: false },
  { id: 'scholar_sprint', name: 'Scholar Sprint', icon: Zap, color: 'bg-coral-100 text-coral-700', description: 'Endless speed quiz', needsQuestions: false },
  { id: 'treasure_hunt', name: 'Treasure Hunt', icon: Map, color: 'bg-sage-100 text-sage-700', description: 'Explore & conquer', needsQuestions: false },
  { id: 'argument_arena', name: 'Argument Arena', icon: Swords, color: 'bg-purple-100 text-purple-700', description: 'Card debate battle', needsQuestions: false },
  { id: 'memory_mosaic', name: 'Memory Mosaic', icon: Grid3X3, color: 'bg-sky-100 text-sky-700', description: 'Match connections', needsQuestions: false },
  { id: 'scavenger_bowl', name: 'Scavenger Bowl', icon: Map, color: 'bg-coral-100 text-coral-700', description: 'Clue-based quiz', needsQuestions: false },
  { id: 'role_writing', name: 'Role Writing', icon: PenTool, color: 'bg-sage-100 text-sage-700', description: 'Write in character', needsQuestions: false },
  { id: 'argument_tennis', name: 'Argument Tennis', icon: MessageSquare, color: 'bg-purple-100 text-purple-700', description: 'Debate vs AI', needsQuestions: false },
  { id: 'elimination_olympics', name: 'Elimination Olympics', icon: Swords, color: 'bg-coral-100 text-coral-700', description: 'Survive the rounds', needsQuestions: false },
  { id: 'role_play_debates', name: 'Role-Play Debates', icon: Mic, color: 'bg-ink-100 text-ink-700', description: 'Debate in character', needsQuestions: false },
  { id: 'argument_builder', name: 'Argument Builder', icon: FileText, color: 'bg-gold-100 text-gold-700', description: 'Build arguments step-by-step', needsQuestions: false },
];

type GameId = 'quickfire_quiz' | 'flashcard_frenzy' | 'pattern_puzzles' | 'story_chain' | 'essay_sprint' | 'mini_debate' | 'impromptu_challenge' | 'daily_challenge' | 'scholar_read' | 'scholars_challenge' | 'battle_mode' | 'wrong_answer_review' | 'connection_quest' | 'scholar_sprint' | 'treasure_hunt' | 'argument_arena' | 'memory_mosaic' | 'scavenger_bowl' | 'role_writing' | 'argument_tennis' | 'elimination_olympics' | 'role_play_debates' | 'argument_builder';

export default function SoloPracticePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="w-12 h-12 border-4 border-ink-200 border-t-gold-500 rounded-full animate-spin" />
      </div>
    }>
      <SoloPracticePage />
    </Suspense>
  );
}

function SoloPracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { muted, toggleMute } = useSounds();

  const [selectedGame, setSelectedGame] = useState<GameId | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('mixed');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [wrongAnswerCount, setWrongAnswerCount] = useState(0);
  const [crossGameStreak, setCrossGameStreak] = useState<CrossGameStreakData | null>(null);

  // AI Questions state
  const [aiQuestionsEnabled, setAiQuestionsEnabled] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiSubject, setAiSubject] = useState<string>('mixed');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<Question[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  // Load cached AI questions on mount
  useEffect(() => {
    const cached = getStorage<CachedGeneratedQuestions | null>(STORAGE_KEYS.GENERATED_QUESTIONS, null);
    if (cached && Date.now() - cached.timestamp < AI_CACHE_TTL_MS) {
      setAiQuestions(cached.questions);
      setAiQuestionsEnabled(true);
      setAiSubject(cached.subject);
    }
  }, []);

  const handleGenerateAiQuestions = async () => {
    setAiGenerating(true);
    setAiError(null);
    try {
      const level = getEffectiveLevel();
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: aiSubject,
          difficulty: selectedDifficulty,
          count: 10,
          studentLevel: { grade: null, level },
          excludeIds: aiQuestions.map(q => q.id),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Failed to generate questions' }));
        throw new Error(errData.error || 'Failed to generate questions');
      }
      const data = await res.json();
      const generated: Question[] = data.questions.map((q: any) => ({
        id: q.id,
        subject: aiSubject === 'mixed' ? (q.tags?.[0] || 'mixed') : aiSubject,
        difficulty: selectedDifficulty as 'easy' | 'medium' | 'hard',
        text: q.text,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation,
        time_limit_seconds: selectedDifficulty === 'easy' ? 30 : selectedDifficulty === 'hard' ? 15 : 20,
        theme_connection: q.theme_connection,
        deep_explanation: q.deep_explanation,
        tags: q.tags,
      }));
      const merged = [...aiQuestions, ...generated];
      setAiQuestions(merged);
      setAiQuestionsEnabled(true);
      setStorage(STORAGE_KEYS.GENERATED_QUESTIONS, {
        questions: merged,
        timestamp: Date.now(),
        subject: aiSubject,
        difficulty: selectedDifficulty,
      } as CachedGeneratedQuestions);
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate questions');
    } finally {
      setAiGenerating(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?role=player');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    setDailyStreak(getDailyStreakData().currentStreak);
    setWrongAnswerCount(getWrongAnswerCount());
    setCrossGameStreak(getCrossGameStreak());
  }, [isPlaying]);

  // Auto-launch game from URL param (e.g., from team games page)
  useEffect(() => {
    const gameParam = searchParams.get('game');
    if (gameParam && !isPlaying && !authLoading && isAuthenticated) {
      const validGame = SOLO_GAMES.find(g => g.id === gameParam);
      if (validGame) {
        handleQuickPlay(gameParam as GameId);
      }
    }
  }, [searchParams, authLoading, isAuthenticated]);

  // Quick play - start immediately with current settings
  const handleQuickPlay = (gameId: GameId) => {
    setSelectedGame(gameId);
    const game = SOLO_GAMES.find(g => g.id === gameId);

    if (game?.needsQuestions) {
      const localQuestions = selectedSubject === 'mixed'
        ? getMixedQuestions(selectedDifficulty as 'easy' | 'medium' | 'hard', 500)
        : getQuestionsBySubject(selectedSubject, selectedDifficulty as 'easy' | 'medium' | 'hard', 500);
      // Merge AI-generated questions when enabled
      if (aiQuestionsEnabled && aiQuestions.length > 0) {
        const combined = [...aiQuestions, ...localQuestions];
        // Shuffle combined pool
        for (let i = combined.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [combined[i], combined[j]] = [combined[j], combined[i]];
        }
        setQuestions(combined);
      } else {
        setQuestions(localQuestions);
      }
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
      if (aiQuestionsEnabled && aiQuestions.length > 0) {
        const combined = [...aiQuestions, ...localQuestions];
        for (let i = combined.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [combined[i], combined[j]] = [combined[j], combined[i]];
        }
        setQuestions(combined);
      } else {
        setQuestions(localQuestions);
      }
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
      daily_challenge: <DailyChallenge onExit={handleExit} />,
      scholar_read: <ScholarRead onExit={handleExit} />,
      scholars_challenge: <ScholarsChallenge onExit={handleExit} />,
      battle_mode: <BattleMode onExit={handleExit} />,
      wrong_answer_review: <WrongAnswerJournal onExit={handleExit} />,
      connection_quest: <ConnectionQuest onExit={handleExit} />,
      scholar_sprint: <ScholarSprint onExit={handleExit} />,
      treasure_hunt: <TreasureHunt onExit={handleExit} />,
      argument_arena: <ArgumentArena onExit={handleExit} />,
      memory_mosaic: <MemoryMosaic onExit={handleExit} />,
      scavenger_bowl: <ScavengerBowl onExit={handleExit} />,
      role_writing: <RoleWriting onExit={handleExit} />,
      argument_tennis: <ArgumentTennis onExit={handleExit} />,
      elimination_olympics: <EliminationOlympics onExit={handleExit} />,
      role_play_debates: <RolePlayDebates onExit={handleExit} />,
      argument_builder: <ArgumentBuilder onExit={handleExit} />,
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
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-ink-800">Solo Practice</h1>
            <p className="text-ink-500 text-sm">Tap to play instantly, or customize settings</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/play/analytics')}
              className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
              title="View Analytics"
            >
              <BarChart3 className="w-5 h-5 text-ink-500" />
            </button>
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
              title={muted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {muted ? <VolumeX className="w-5 h-5 text-ink-400" /> : <Volume2 className="w-5 h-5 text-ink-500" />}
            </button>
          </div>
        </div>

        {/* Daily Challenge Card */}
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => handleQuickPlay('daily_challenge' as GameId)}
          className="w-full mb-6 p-4 bg-gradient-to-r from-gold-400 to-gold-500 rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Flame className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-lg">Daily Challenge</h2>
              <p className="text-white/80 text-sm">5 questions across all subjects</p>
            </div>
            <div className="text-right">
              {dailyStreak > 0 && (
                <div className="text-2xl font-bold">{dailyStreak}</div>
              )}
              <div className="text-xs text-white/70 uppercase tracking-wider">
                {dailyStreak > 0 ? 'day streak' : 'Start today'}
              </div>
            </div>
          </div>
        </motion.button>

        {/* Cross-Game Variety Streak */}
        {crossGameStreak && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-4 py-3 bg-gradient-to-r from-purple-50 to-sky-50 rounded-xl border border-purple-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        i < (crossGameStreak.today.gamesPlayed.length) ? 'bg-purple-500' : 'bg-purple-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-purple-800">
                  {crossGameStreak.today.gamesPlayed.length >= 3
                    ? 'Variety goal reached!'
                    : `${crossGameStreak.today.gamesPlayed.length}/3 different games today`}
                </span>
              </div>
              {crossGameStreak.currentStreak > 0 && (
                <Badge className="bg-purple-500 text-white text-xs">
                  {crossGameStreak.currentStreak} day streak
                </Badge>
              )}
            </div>
          </motion.div>
        )}

        {/* Current Settings Preview */}
        <div className="mb-4 px-4 py-3 bg-white rounded-xl border border-ink-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-500">Quick play:</span>
            <Badge variant="outline" className="capitalize">{selectedSubject === 'mixed' ? 'All Subjects' : selectedSubject.replace('_', ' ')}</Badge>
            <Badge className={`${DIFFICULTIES.find(d => d.value === selectedDifficulty)?.color} text-white`}>
              {selectedDifficulty}
            </Badge>
          </div>
          {wrongAnswerCount > 0 && (
            <button
              onClick={() => handleQuickPlay('wrong_answer_review' as GameId)}
              className="flex items-center gap-1.5 text-sm text-coral-600 hover:text-coral-700 font-medium"
            >
              <ClipboardList className="w-4 h-4" />
              {wrongAnswerCount} to review
            </button>
          )}
        </div>

        {/* AI Questions Section */}
        <div className="mb-4">
          <button
            onClick={() => setAiExpanded(!aiExpanded)}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 flex items-center justify-between hover:border-purple-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-sm text-purple-800">AI-Generated Questions</span>
              {aiQuestionsEnabled && aiQuestions.length > 0 && (
                <Badge className="bg-purple-500 text-white text-xs">{aiQuestions.length} ready</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {aiQuestionsEnabled && (
                <Badge className="bg-green-500 text-white text-xs">ON</Badge>
              )}
              {aiExpanded ? (
                <ChevronUp className="w-4 h-4 text-purple-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-purple-500" />
              )}
            </div>
          </button>

          {aiExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 p-4 bg-white rounded-xl border border-purple-100 space-y-3"
            >
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-ink-600">Include AI questions in games</label>
                <button
                  onClick={() => setAiQuestionsEnabled(!aiQuestionsEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    aiQuestionsEnabled ? 'bg-purple-500' : 'bg-ink-200'
                  }`}
                  role="switch"
                  aria-checked={aiQuestionsEnabled}
                  aria-label="Toggle AI-generated questions"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      aiQuestionsEnabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Subject selector */}
              <div>
                <label className="text-xs text-ink-500 mb-1 block">Subject</label>
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setAiSubject(s.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        aiSubject === s.value
                          ? 'bg-purple-500 text-white'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button + status */}
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateAiQuestions}
                  disabled={aiGenerating}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Generate 10 Questions
                    </>
                  )}
                </Button>
                {aiQuestions.length > 0 && !aiGenerating && (
                  <span className="text-xs text-ink-400">
                    {aiQuestions.length} AI question{aiQuestions.length !== 1 ? 's' : ''} cached
                  </span>
                )}
              </div>

              {/* Error display */}
              {aiError && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">{aiError}</p>
              )}

              {/* Clear cache */}
              {aiQuestions.length > 0 && (
                <button
                  onClick={() => {
                    setAiQuestions([]);
                    setAiQuestionsEnabled(false);
                    setStorage(STORAGE_KEYS.GENERATED_QUESTIONS, null);
                  }}
                  className="text-xs text-ink-400 hover:text-red-500 transition-colors"
                >
                  Clear cached questions
                </button>
              )}
            </motion.div>
          )}
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

        {/* Footer Links */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <button
            onClick={() => router.push('/play/analytics')}
            className="flex items-center gap-2 text-ink-400 hover:text-ink-600 text-sm transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <span className="text-ink-200">|</span>
          <button
            onClick={() => handleQuickPlay('wrong_answer_review' as GameId)}
            className="flex items-center gap-2 text-ink-400 hover:text-ink-600 text-sm transition-colors"
          >
            <Award className="w-4 h-4" />
            Achievements
          </button>
        </div>
      </div>
    </main>
  );
}
