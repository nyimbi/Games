'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Gamepad2,
  Users,
  Clock,
  Zap,
  ArrowLeft,
  Play,
  Star,
  Lock,
} from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const GAME_CATEGORIES = [
  {
    id: 'scholars_bowl',
    name: "Scholar's Bowl",
    icon: '🎯',
    color: 'bg-coral-100 text-coral-700',
    borderColor: 'border-coral-300',
    description: 'Fast-paced trivia battles',
  },
  {
    id: 'writing',
    name: 'Writing',
    icon: '✍️',
    color: 'bg-sage-100 text-sage-700',
    borderColor: 'border-sage-300',
    description: 'Collaborative storytelling',
  },
  {
    id: 'challenge',
    name: 'Challenge',
    icon: '⚡',
    color: 'bg-gold-100 text-gold-700',
    borderColor: 'border-gold-300',
    description: 'Speed quizzes and puzzles',
  },
  {
    id: 'debate',
    name: 'Debate',
    icon: '🗣️',
    color: 'bg-ink-100 text-ink-700',
    borderColor: 'border-ink-300',
    description: 'Argument and discussion',
  },
];

const GAMES = [
  // Scholar's Bowl
  {
    id: 'buzzer-battle',
    name: 'Buzzer Battle',
    category: 'scholars_bowl',
    description: 'Race to buzz first and answer correctly!',
    players: '2-4',
    time: '5-10 min',
    difficulty: 2,
    syncType: 'real-time',
    available: true,
  },
  {
    id: 'category-challenge',
    name: 'Category Challenge',
    category: 'scholars_bowl',
    description: 'Draw cards and answer category questions',
    players: '2-4',
    time: '10-15 min',
    difficulty: 2,
    syncType: 'turn-based',
    available: true,
  },
  {
    id: 'team-trivia',
    name: 'Team Trivia Night',
    category: 'scholars_bowl',
    description: 'Work together to answer questions',
    players: '3-4',
    time: '15-20 min',
    difficulty: 1,
    syncType: 'synchronized',
    available: true,
  },
  {
    id: 'scavenger-bowl',
    name: 'Scavenger Bowl',
    category: 'scholars_bowl',
    description: 'Find hidden answers in a virtual room',
    players: '2-4',
    time: '10-15 min',
    difficulty: 3,
    syncType: 'real-time',
    available: true,
  },

  // Writing
  {
    id: 'story-chain',
    name: 'Story Chain',
    category: 'writing',
    description: 'Build a story together, one part at a time',
    players: '2-4',
    time: '15-20 min',
    difficulty: 2,
    syncType: 'turn-based',
    available: true,
  },
  {
    id: 'essay-sprint',
    name: 'Essay Sprint',
    category: 'writing',
    description: 'Collaborate on an essay in real-time',
    players: '2-3',
    time: '20-25 min',
    difficulty: 3,
    syncType: 'parallel',
    available: true,
  },
  {
    id: 'role-writing',
    name: 'Role-Based Writing',
    category: 'writing',
    description: 'Each player writes a different section',
    players: '3-4',
    time: '15-20 min',
    difficulty: 2,
    syncType: 'role-assigned',
    available: true,
  },
  {
    id: 'argument-tennis',
    name: 'Argument Tennis',
    category: 'writing',
    description: 'Take turns building arguments',
    players: '2',
    time: '10-15 min',
    difficulty: 3,
    syncType: 'turn-based',
    available: true,
  },

  // Challenge
  {
    id: 'flashcard-frenzy',
    name: 'Flashcard Frenzy',
    category: 'challenge',
    description: 'Speed through flashcards to earn points',
    players: '1-4',
    time: '5-10 min',
    difficulty: 1,
    syncType: 'individual',
    available: true,
  },
  {
    id: 'pattern-puzzles',
    name: 'Pattern Puzzles',
    category: 'challenge',
    description: 'Solve pattern recognition challenges',
    players: '1-4',
    time: '10-15 min',
    difficulty: 3,
    syncType: 'synchronized',
    available: true,
  },
  {
    id: 'quickfire-quiz',
    name: 'Quickfire Quiz',
    category: 'challenge',
    description: 'Answer as many questions as you can!',
    players: '1-4',
    time: '5-10 min',
    difficulty: 2,
    syncType: 'synchronized',
    available: true,
  },
  {
    id: 'elimination-olympics',
    name: 'Elimination Olympics',
    category: 'challenge',
    description: 'Strategic elimination-style practice',
    players: '2-4',
    time: '10-15 min',
    difficulty: 2,
    syncType: 'individual',
    available: true,
  },

  // Debate
  {
    id: 'mini-debate',
    name: 'Mini-Debate',
    category: 'debate',
    description: 'Structured mini-debates on topics',
    players: '2-4',
    time: '10-15 min',
    difficulty: 3,
    syncType: 'turn-based',
    available: true,
  },
  {
    id: 'role-play-debates',
    name: 'Role-Play Debates',
    category: 'debate',
    description: 'Take on roles and debate perspectives',
    players: '3-4',
    time: '15-20 min',
    difficulty: 3,
    syncType: 'role-assigned',
    available: true,
  },
  {
    id: 'argument-builder',
    name: 'Argument Builder',
    category: 'debate',
    description: 'Build arguments together step by step',
    players: '2-4',
    time: '15-20 min',
    difficulty: 2,
    syncType: 'collaborative',
    available: true,
  },
  {
    id: 'impromptu-challenge',
    name: 'Impromptu Challenge',
    category: 'debate',
    description: 'Draw a topic and present to the team',
    players: '2-4',
    time: '10-15 min',
    difficulty: 3,
    syncType: 'individual',
    available: true,
  },
];

function DifficultyStars({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= level ? 'fill-gold-400 text-gold-400' : 'text-ink-200'
          }`}
        />
      ))}
    </div>
  );
}

export default function GamesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { team } = useAuth();

  const initialCategory = searchParams.get('category') || null;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);

  const filteredGames = selectedCategory
    ? GAMES.filter((game) => game.category === selectedCategory)
    : GAMES;

  const selectedCategoryData = GAME_CATEGORIES.find((c) => c.id === selectedCategory);

  const handlePlayGame = (gameId: string) => {
    router.push(`/play/solo?game=${gameId.replace(/-/g, '_')}`);
  };

  return (
    <div className="p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-2">
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2 hover:bg-ink-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-ink-600" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-gold-700" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-ink-800">
                  {selectedCategoryData ? selectedCategoryData.name : 'Games'}
                </h1>
                <p className="text-ink-500 text-sm">
                  {selectedCategoryData
                    ? selectedCategoryData.description
                    : '16 games across 4 categories'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Filter (when no category selected) */}
        {!selectedCategory && (
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 gap-3">
              {GAME_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`${category.color} p-5 rounded-xl text-left hover:scale-[1.02] active:scale-[0.98] transition-transform`}
                >
                  <span className="text-2xl block mb-1">{category.icon}</span>
                  <span className="font-display text-lg font-semibold block">
                    {category.name}
                  </span>
                  <span className="text-sm opacity-75">{category.description}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Games List */}
        <motion.div variants={itemVariants} className="space-y-3">
          {filteredGames.map((game) => {
            const category = GAME_CATEGORIES.find((c) => c.id === game.category);

            return (
              <Card
                key={game.id}
                className={`overflow-hidden transition-all ${
                  game.available
                    ? 'hover:shadow-md cursor-pointer'
                    : 'opacity-60'
                }`}
                onClick={() => game.available && handlePlayGame(game.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Category indicator */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${category?.color}`}
                    >
                      <span className="text-xl">{category?.icon}</span>
                    </div>

                    {/* Game info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-semibold text-ink-800 truncate">
                          {game.name}
                        </h3>
                        {!game.available && (
                          <Lock className="w-4 h-4 text-ink-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-ink-500 mb-2 line-clamp-1">
                        {game.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-ink-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {game.players}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {game.time}
                        </span>
                        <DifficultyStars level={game.difficulty} />
                      </div>
                    </div>

                    {/* Play button */}
                    <div className="flex-shrink-0">
                      {game.available ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayGame(game.id);
                          }}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Play
                        </Button>
                      ) : (
                        <Badge variant="outline">Coming Soon</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* No team notice */}
        {!team && (
          <motion.div variants={itemVariants}>
            <Card className="bg-gold-50 border-gold-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold-200 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-gold-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-ink-800">
                      Join a team for multiplayer games!
                    </p>
                    <p className="text-sm text-ink-500">
                      Ask your coach for the team code
                    </p>
                  </div>
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => router.push('/team')}
                  >
                    Join Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
