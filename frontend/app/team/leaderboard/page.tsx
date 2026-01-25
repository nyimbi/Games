'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Medal,
  Star,
  Zap,
  TrendingUp,
  Flame,
  Crown,
} from 'lucide-react';
import { Card, CardContent, Avatar, Badge } from '@/components/ui';
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

type TimeFilter = 'week' | 'month' | 'allTime';

// Mock leaderboard data - would come from API
const MOCK_LEADERBOARD = [
  {
    id: 1,
    display_name: 'Abena',
    avatar_color: '#FF6B6B',
    points: 2450,
    gamesPlayed: 48,
    streak: 12,
    badges: ['🏆', '⚡', '🔥'],
  },
  {
    id: 2,
    display_name: 'Marcus',
    avatar_color: '#4ECDC4',
    points: 2280,
    gamesPlayed: 45,
    streak: 8,
    badges: ['🎯', '⭐'],
  },
  {
    id: 3,
    display_name: 'Sofia',
    avatar_color: '#9B59B6',
    points: 2150,
    gamesPlayed: 42,
    streak: 5,
    badges: ['📚', '🌟'],
  },
  {
    id: 4,
    display_name: 'James',
    avatar_color: '#F39C12',
    points: 1890,
    gamesPlayed: 38,
    streak: 3,
    badges: ['💪'],
  },
];

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="w-6 h-6 text-gold-500" />;
    case 2:
      return <Medal className="w-6 h-6 text-ink-400" />;
    case 3:
      return <Medal className="w-6 h-6 text-amber-600" />;
    default:
      return (
        <span className="w-6 h-6 flex items-center justify-center text-ink-400 font-bold">
          {rank}
        </span>
      );
  }
}

function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-gold-100 to-gold-50 border-gold-300';
    case 2:
      return 'bg-gradient-to-r from-ink-100 to-ink-50 border-ink-300';
    case 3:
      return 'bg-gradient-to-r from-amber-100 to-amber-50 border-amber-300';
    default:
      return 'bg-white border-ink-200';
  }
}

export default function LeaderboardPage() {
  const { user, team, teamMembers } = useAuth();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');

  // Use team members if available, otherwise use mock data
  const leaderboardData = team && teamMembers.length > 0
    ? teamMembers.map((member, index) => ({
        id: member.id,
        display_name: member.display_name,
        avatar_color: member.avatar_color,
        points: 1000 - index * 200 + Math.floor(Math.random() * 100),
        gamesPlayed: 20 + Math.floor(Math.random() * 30),
        streak: Math.floor(Math.random() * 10),
        badges: index === 0 ? ['🏆', '⚡'] : index === 1 ? ['🎯'] : [],
      }))
    : MOCK_LEADERBOARD;

  // Sort by points
  const sortedLeaderboard = [...leaderboardData].sort((a, b) => b.points - a.points);

  // Find current user's rank
  const userRank = sortedLeaderboard.findIndex((p) => p.id === user?.id) + 1;
  const userStats = sortedLeaderboard.find((p) => p.id === user?.id);

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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-gold-700" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-800">
                Leaderboard
              </h1>
              <p className="text-ink-500 text-sm">
                {team ? `Team ${team.name}` : 'See how you stack up!'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Time Filter */}
        <motion.div variants={itemVariants}>
          <div className="flex gap-2 bg-ink-100 p-1 rounded-xl">
            {[
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'allTime', label: 'All Time' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setTimeFilter(filter.value as TimeFilter)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  timeFilter === filter.value
                    ? 'bg-white text-ink-800 shadow-sm'
                    : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Your Rank Card (if authenticated) */}
        {user && userStats && (
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-ink-800 to-ink-900 text-white overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={user.display_name}
                    color={user.avatar_color}
                    size="lg"
                  />
                  <div className="flex-1">
                    <p className="text-ink-300 text-sm">Your Rank</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-3xl font-bold">
                        #{userRank}
                      </span>
                      <span className="text-ink-300">of {sortedLeaderboard.length}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gold-400">
                      <Star className="w-5 h-5 fill-gold-400" />
                      <span className="font-display text-2xl font-bold">
                        {userStats.points}
                      </span>
                    </div>
                    <p className="text-ink-400 text-sm">points</p>
                  </div>
                </div>

                <div className="flex gap-6 mt-4 pt-4 border-t border-ink-700">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-sage-400" />
                    <span className="text-sm">
                      <span className="text-white font-medium">{userStats.gamesPlayed}</span>
                      <span className="text-ink-400"> games</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-coral-400" />
                    <span className="text-sm">
                      <span className="text-white font-medium">{userStats.streak}</span>
                      <span className="text-ink-400"> day streak</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard List */}
        <motion.div variants={itemVariants} className="space-y-2">
          {sortedLeaderboard.map((player, index) => {
            const rank = index + 1;
            const isCurrentUser = player.id === user?.id;

            return (
              <Card
                key={player.id}
                className={`transition-all ${getRankStyle(rank)} ${
                  isCurrentUser ? 'ring-2 ring-gold-400' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-8 flex-shrink-0">
                      {getRankIcon(rank)}
                    </div>

                    {/* Avatar */}
                    <Avatar
                      name={player.display_name}
                      color={player.avatar_color}
                      size="md"
                    />

                    {/* Player info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink-800 truncate">
                          {player.display_name}
                          {isCurrentUser && (
                            <span className="text-ink-400 font-normal"> (you)</span>
                          )}
                        </span>
                        {player.badges.length > 0 && (
                          <div className="flex gap-0.5">
                            {player.badges.slice(0, 3).map((badge, i) => (
                              <span key={i} className="text-sm">{badge}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-ink-500">
                        <span>{player.gamesPlayed} games</span>
                        {player.streak > 0 && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-coral-500" />
                            {player.streak} streak
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                        <span className="font-display text-lg font-bold text-ink-800">
                          {player.points.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs text-ink-400">points</span>
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
              <CardContent className="p-4 text-center">
                <p className="text-ink-600">
                  Join a team to see your real rankings and compete with teammates!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
