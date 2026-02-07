'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Plus,
  Users,
  Clock,
  Star,
  Filter,
} from 'lucide-react';
import { Button, Card, CardHeader, CardContent, Badge } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface GameInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  minPlayers: number;
  maxPlayers: number;
  duration: number;
  difficulty: number;
}

const ALL_GAMES: GameInfo[] = [
  // Scholar's Bowl
  { id: 'buzzer_battle', name: 'Buzzer Battle', description: 'Race to buzz in first with the correct answer. Speed and knowledge combine in this classic quiz format.', category: 'scholars_bowl', minPlayers: 2, maxPlayers: 6, duration: 10, difficulty: 2 },
  { id: 'category_challenge', name: 'Category Challenge', description: 'Name items within a category before time runs out. Tests breadth of knowledge across subjects.', category: 'scholars_bowl', minPlayers: 2, maxPlayers: 6, duration: 8, difficulty: 2 },
  { id: 'team_trivia', name: 'Team Trivia', description: 'Collaborate with teammates to answer trivia questions. Communication and teamwork are key.', category: 'scholars_bowl', minPlayers: 4, maxPlayers: 6, duration: 15, difficulty: 2 },
  { id: 'scavenger_bowl', name: 'Scavenger Bowl', description: 'Find answers hidden across different subjects and categories in a timed scavenger hunt format.', category: 'scholars_bowl', minPlayers: 2, maxPlayers: 6, duration: 12, difficulty: 3 },

  // Writing
  { id: 'story_chain', name: 'Story Chain', description: 'Build a collaborative story one sentence at a time. Creativity and narrative skills shine here.', category: 'writing', minPlayers: 2, maxPlayers: 6, duration: 10, difficulty: 1 },
  { id: 'essay_sprint', name: 'Essay Sprint', description: 'Write a focused essay response under time pressure. Practice structure, argumentation, and clarity.', category: 'writing', minPlayers: 1, maxPlayers: 6, duration: 15, difficulty: 3 },
  { id: 'role_writing', name: 'Role Writing', description: 'Write from the perspective of a historical figure or character. Builds empathy and research skills.', category: 'writing', minPlayers: 1, maxPlayers: 6, duration: 12, difficulty: 2 },
  { id: 'argument_tennis', name: 'Argument Tennis', description: 'Exchange written arguments back and forth on a topic. Sharpens persuasive writing in real time.', category: 'writing', minPlayers: 2, maxPlayers: 4, duration: 10, difficulty: 3 },

  // Challenge
  { id: 'flashcard_frenzy', name: 'Flashcard Frenzy', description: 'Speed through flashcards to test recall and recognition. Great for vocabulary and fact review.', category: 'challenge', minPlayers: 1, maxPlayers: 6, duration: 5, difficulty: 1 },
  { id: 'pattern_puzzles', name: 'Pattern Puzzles', description: 'Identify patterns in sequences of numbers, shapes, or words. Develops logical thinking skills.', category: 'challenge', minPlayers: 1, maxPlayers: 6, duration: 8, difficulty: 2 },
  { id: 'quickfire_quiz', name: 'Quickfire Quiz', description: 'Rapid-fire questions with short time limits. Tests quick recall across all subjects.', category: 'challenge', minPlayers: 1, maxPlayers: 6, duration: 5, difficulty: 2 },
  { id: 'elimination_olympics', name: 'Elimination Olympics', description: 'Multi-round elimination tournament. Each wrong answer risks elimination until one scholar remains.', category: 'challenge', minPlayers: 3, maxPlayers: 6, duration: 15, difficulty: 3 },

  // Debate
  { id: 'mini_debate', name: 'Mini Debate', description: 'Quick structured debates on engaging topics. Practice taking and defending positions clearly.', category: 'debate', minPlayers: 2, maxPlayers: 4, duration: 10, difficulty: 2 },
  { id: 'role_play_debates', name: 'Role Play Debates', description: 'Debate from the perspective of assigned characters or historical figures. Builds perspective-taking.', category: 'debate', minPlayers: 2, maxPlayers: 6, duration: 12, difficulty: 3 },
  { id: 'argument_builder', name: 'Argument Builder', description: 'Construct arguments step by step with evidence and reasoning. Scaffolded approach to persuasion.', category: 'debate', minPlayers: 1, maxPlayers: 4, duration: 10, difficulty: 2 },
  { id: 'impromptu_challenge', name: 'Impromptu Challenge', description: 'Speak on a random topic with minimal preparation. Builds confidence and thinking on your feet.', category: 'debate', minPlayers: 1, maxPlayers: 6, duration: 8, difficulty: 3 },

  // Solo
  { id: 'scholars_challenge', name: "Scholar's Challenge", description: 'Comprehensive solo quiz covering all subjects. Track personal bests and improvement over time.', category: 'solo', minPlayers: 1, maxPlayers: 1, duration: 10, difficulty: 2 },
  { id: 'battle_mode', name: 'Battle Mode', description: 'Head-to-head competition against another scholar. Answer faster and more accurately to win.', category: 'solo', minPlayers: 2, maxPlayers: 2, duration: 8, difficulty: 2 },
  { id: 'connection_quest', name: 'Connection Quest', description: 'Find hidden connections between seemingly unrelated clues. Tests lateral thinking and knowledge links.', category: 'solo', minPlayers: 1, maxPlayers: 4, duration: 10, difficulty: 2 },
  { id: 'scholar_sprint', name: 'Scholar Sprint', description: 'Timed sprint through as many questions as possible. Speed and accuracy both count toward your score.', category: 'solo', minPlayers: 1, maxPlayers: 6, duration: 5, difficulty: 1 },
  { id: 'treasure_hunt', name: 'Treasure Hunt', description: 'Follow clues through a series of knowledge challenges to find the treasure. Each answer unlocks the next.', category: 'solo', minPlayers: 1, maxPlayers: 6, duration: 12, difficulty: 2 },
  { id: 'memory_mosaic', name: 'Memory Mosaic', description: 'Match pairs and remember positions in this knowledge-based memory game. Tests recall and pattern memory.', category: 'solo', minPlayers: 1, maxPlayers: 4, duration: 8, difficulty: 1 },
];

const CATEGORIES: Record<string, { label: string; emoji: string; color: string }> = {
  scholars_bowl: { label: "Scholar's Bowl", emoji: '🎯', color: 'bg-gold-100 text-gold-700' },
  writing: { label: 'Writing', emoji: '✍️', color: 'bg-sage-100 text-sage-700' },
  challenge: { label: 'Challenge', emoji: '⚡', color: 'bg-coral-100 text-coral-700' },
  debate: { label: 'Debate', emoji: '🗣️', color: 'bg-ink-100 text-ink-600' },
  solo: { label: 'Solo', emoji: '🎮', color: 'bg-cream-200 text-ink-700' },
};

function DifficultyStars({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Difficulty: ${level} out of 3`}>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= level ? 'fill-gold-400 text-gold-400' : 'text-ink-200'
          }`}
        />
      ))}
    </div>
  );
}

export default function GamesBrowser() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredGames = activeCategory
    ? ALL_GAMES.filter((g) => g.category === activeCategory)
    : ALL_GAMES;

  const categoryOrder = Object.keys(CATEGORIES);

  const addToSession = (gameId: string) => {
    router.push(`/coach/schedule/new?games=${gameId}`);
  };

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/coach')}
              className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-ink-600" />
            </button>
            <div>
              <h1 className="font-display text-3xl font-bold text-ink-800">Games</h1>
              <p className="text-ink-600 mt-1">
                {ALL_GAMES.length} games across {categoryOrder.length} categories
              </p>
            </div>
          </div>
        </motion.div>

        {/* Category Filters */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeCategory === null
                ? 'bg-ink-800 text-white'
                : 'bg-white border border-ink-200 text-ink-600 hover:border-ink-300'
            }`}
          >
            All Games
          </button>
          {categoryOrder.map((cat) => {
            const info = CATEGORIES[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? info.color + ' ring-2 ring-offset-1 ring-current'
                    : 'bg-white border border-ink-200 text-ink-600 hover:border-ink-300'
                }`}
              >
                {info.emoji} {info.label}
              </button>
            );
          })}
        </motion.div>

        {/* Games Grid */}
        {activeCategory ? (
          /* Flat grid when filtering */
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} onAdd={addToSession} />
            ))}
          </motion.div>
        ) : (
          /* Grouped by category when showing all */
          <div className="space-y-8">
            {categoryOrder.map((cat) => {
              const info = CATEGORIES[cat];
              const games = ALL_GAMES.filter((g) => g.category === cat);
              return (
                <motion.div key={cat} variants={itemVariants}>
                  <h2 className="font-display text-xl font-semibold text-ink-800 mb-4 flex items-center gap-2">
                    <span className="text-2xl">{info.emoji}</span>
                    {info.label}
                    <Badge className={info.color}>{games.length}</Badge>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {games.map((game) => (
                      <GameCard key={game.id} game={game} onAdd={addToSession} />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function GameCard({ game, onAdd }: { game: GameInfo; onAdd: (id: string) => void }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex-1">
            <h3 className="font-semibold text-ink-800 text-lg mb-2">{game.name}</h3>
            <p className="text-sm text-ink-500 mb-4 line-clamp-2">{game.description}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-ink-500">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {game.minPlayers === game.maxPlayers
                  ? `${game.minPlayers} player${game.minPlayers !== 1 ? 's' : ''}`
                  : `${game.minPlayers}-${game.maxPlayers} players`}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {game.duration} min
              </span>
              <DifficultyStars level={game.difficulty} />
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => onAdd(game.id)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add to Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
