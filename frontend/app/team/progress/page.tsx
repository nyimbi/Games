'use client';

import { motion } from 'motion/react';
import {
  User,
  Star,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  Award,
  BookOpen,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, Avatar, Badge, Progress } from '@/components/ui';
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

// Mock progress data - would come from API
const MOCK_PROGRESS = {
  level: 4,
  xp: 320,
  xpToNext: 500,
  totalPoints: 2450,
  gamesPlayed: 48,
  streak: 12,
  longestStreak: 15,
  accuracy: 78,
  avgResponseTime: 4.2,
  favoriteCategory: 'scholars_bowl',
};

const MOCK_SUBJECT_PROGRESS = [
  { name: 'Science', mastery: 82, questions: 156, icon: '🔬' },
  { name: 'Social Studies', mastery: 75, questions: 142, icon: '🌍' },
  { name: 'Arts', mastery: 68, questions: 98, icon: '🎨' },
  { name: 'Literature', mastery: 71, questions: 124, icon: '📚' },
  { name: 'Special Area', mastery: 65, questions: 87, icon: '⭐' },
];

const MOCK_RECENT_GAMES = [
  { name: 'Buzzer Battle', date: '2 hours ago', score: 450, maxScore: 500, result: 'win' },
  { name: 'Quickfire Quiz', date: 'Yesterday', score: 380, maxScore: 400, result: 'win' },
  { name: 'Team Trivia', date: 'Yesterday', score: 280, maxScore: 350, result: 'loss' },
  { name: 'Buzzer Battle', date: '2 days ago', score: 420, maxScore: 500, result: 'win' },
];

const MOCK_BADGES = [
  { id: 1, name: 'First Steps', icon: '🌟', description: 'Play your first game', earned: true },
  { id: 2, name: 'On Fire', icon: '🔥', description: '5 day streak', earned: true },
  { id: 3, name: 'Quick Thinker', icon: '⚡', description: 'Answer under 2 seconds', earned: true },
  { id: 4, name: 'Science Star', icon: '🔬', description: '80% accuracy in Science', earned: true },
  { id: 5, name: 'Team Player', icon: '🤝', description: 'Win 10 team games', earned: false },
  { id: 6, name: 'Perfect Game', icon: '💯', description: '100% accuracy in a game', earned: false },
];

function getMasteryColor(mastery: number) {
  if (mastery >= 80) return 'text-sage-600 bg-sage-100';
  if (mastery >= 60) return 'text-gold-600 bg-gold-100';
  return 'text-coral-600 bg-coral-100';
}

export default function ProgressPage() {
  const { user, team } = useAuth();

  const progress = MOCK_PROGRESS;

  return (
    <div className="p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-4">
            <Avatar
              name={user?.display_name || 'Player'}
              color={user?.avatar_color}
              size="lg"
            />
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-800">
                {user?.display_name || 'Your Progress'}
              </h1>
              <p className="text-ink-500">
                {team ? `Team ${team.name}` : 'Scholar in training'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Level Progress */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-ink-800 to-ink-900 text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-ink-300 text-sm">Current Level</p>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-4xl font-bold">
                      {progress.level}
                    </span>
                    <Badge variant="gold" className="text-sm">Scholar</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-gold-400">
                    <Star className="w-5 h-5 fill-gold-400" />
                    <span className="font-display text-2xl font-bold">
                      {progress.totalPoints.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-ink-400 text-sm">total points</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-ink-300">Progress to Level {progress.level + 1}</span>
                  <span className="text-white font-medium">
                    {progress.xp}/{progress.xpToNext} XP
                  </span>
                </div>
                <div className="h-3 bg-ink-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(progress.xp / progress.xpToNext) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-gold-400 to-gold-500 rounded-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-sage-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 text-sage-600" />
                </div>
                <p className="font-display text-2xl font-bold text-ink-800">
                  {progress.accuracy}%
                </p>
                <p className="text-sm text-ink-500">Accuracy</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-coral-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Flame className="w-5 h-5 text-coral-600" />
                </div>
                <p className="font-display text-2xl font-bold text-ink-800">
                  {progress.streak}
                </p>
                <p className="text-sm text-ink-500">Day Streak</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-gold-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-5 h-5 text-gold-600" />
                </div>
                <p className="font-display text-2xl font-bold text-ink-800">
                  {progress.avgResponseTime}s
                </p>
                <p className="text-sm text-ink-500">Avg Response</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-ink-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-5 h-5 text-ink-600" />
                </div>
                <p className="font-display text-2xl font-bold text-ink-800">
                  {progress.gamesPlayed}
                </p>
                <p className="text-sm text-ink-500">Games Played</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Subject Mastery */}
        <motion.div variants={itemVariants}>
          <h2 className="font-display text-lg font-semibold text-ink-800 mb-3">
            Subject Mastery
          </h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              {MOCK_SUBJECT_PROGRESS.map((subject) => (
                <div key={subject.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{subject.icon}</span>
                      <span className="font-medium text-ink-700">{subject.name}</span>
                    </div>
                    <span
                      className={`text-sm font-semibold px-2 py-0.5 rounded-full ${getMasteryColor(
                        subject.mastery
                      )}`}
                    >
                      {subject.mastery}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Progress value={subject.mastery} max={100} variant="sage" />
                    </div>
                    <span className="text-xs text-ink-400 w-20 text-right">
                      {subject.questions} questions
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Badges */}
        <motion.div variants={itemVariants}>
          <h2 className="font-display text-lg font-semibold text-ink-800 mb-3">
            Badges
          </h2>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-3">
                {MOCK_BADGES.map((badge) => (
                  <div
                    key={badge.id}
                    className={`text-center p-3 rounded-xl transition-all ${
                      badge.earned
                        ? 'bg-gold-50 border border-gold-200'
                        : 'bg-ink-50 border border-ink-200 opacity-50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{badge.icon}</span>
                    <p className="font-medium text-xs text-ink-700 truncate">
                      {badge.name}
                    </p>
                    {badge.earned && (
                      <CheckCircle className="w-4 h-4 text-sage-500 mx-auto mt-1" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Games */}
        <motion.div variants={itemVariants}>
          <h2 className="font-display text-lg font-semibold text-ink-800 mb-3">
            Recent Games
          </h2>
          <div className="space-y-2">
            {MOCK_RECENT_GAMES.map((game, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        game.result === 'win' ? 'bg-sage-100' : 'bg-coral-100'
                      }`}
                    >
                      {game.result === 'win' ? (
                        <Award className="w-5 h-5 text-sage-600" />
                      ) : (
                        <Target className="w-5 h-5 text-coral-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-800 truncate">{game.name}</p>
                      <p className="text-sm text-ink-500">{game.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-ink-800">
                        {game.score}/{game.maxScore}
                      </p>
                      <p
                        className={`text-xs ${
                          game.result === 'win' ? 'text-sage-600' : 'text-coral-600'
                        }`}
                      >
                        {Math.round((game.score / game.maxScore) * 100)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
