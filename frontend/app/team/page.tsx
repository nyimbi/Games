'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Play,
  Users,
  Trophy,
  Target,
  Zap,
  Gamepad2,
  Calendar,
  Star,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button, Card, CardHeader, CardContent, Avatar, Badge, Progress } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';
import { sessionsApi, type Session } from '@/lib/api/client';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const GAME_CATEGORIES = [
  { id: 'scholars_bowl', name: "Scholar's Bowl", icon: '🎯', color: 'bg-coral-100 text-coral-700' },
  { id: 'writing', name: 'Writing', icon: '✍️', color: 'bg-sage-100 text-sage-700' },
  { id: 'challenge', name: 'Challenge', icon: '⚡', color: 'bg-gold-100 text-gold-700' },
  { id: 'debate', name: 'Debate', icon: '🗣️', color: 'bg-ink-100 text-ink-700' },
];

export default function PlayerHub() {
  const router = useRouter();
  const { user, team, teamMembers, refreshTeam } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await sessionsApi.list();
      setSessions(response.sessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    setJoinError(null);

    try {
      const { joinTeam } = useAuth();
      // Note: This should use the auth context properly
      // For now, we'll redirect to a join page
      router.push(`/team/join?code=${joinCode.trim()}`);
    } catch (err) {
      setJoinError('Invalid team code');
    } finally {
      setIsJoining(false);
    }
  };

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const scheduledSessions = sessions.filter((s) => s.status === 'scheduled');

  // Mock progress data (would come from API in real implementation)
  const playerProgress = {
    totalGames: 42,
    totalPoints: 1250,
    streak: 5,
    level: 3,
    xpToNextLevel: 250,
    xpCurrent: 180,
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
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="font-display text-3xl font-bold text-ink-800">
            Hey, {user?.display_name}! 👋
          </h1>
          <p className="text-ink-600 mt-1">
            {team ? `Team ${team.name}` : 'Ready to learn and play?'}
          </p>
        </motion.div>

        {/* No Team State */}
        {!team && (
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-gold-50 to-cream-100 border-gold-200">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gold-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gold-700" />
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-ink-800 mb-2">
                    Join Your Team
                  </h2>
                  <p className="text-ink-600 max-w-md mx-auto">
                    Ask your coach for the team code and enter it below to join.
                  </p>
                </div>

                <form onSubmit={handleJoinTeam} className="max-w-sm mx-auto">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Enter team code"
                      className="flex-1 px-4 py-3 rounded-xl border border-ink-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none font-mono text-center text-lg tracking-wider uppercase"
                      maxLength={8}
                    />
                    <Button type="submit" variant="gold" disabled={!joinCode.trim() || isJoining}>
                      {isJoining ? '...' : 'Join'}
                    </Button>
                  </div>
                  {joinError && (
                    <p className="text-coral-600 text-sm text-center mt-2">{joinError}</p>
                  )}
                </form>

                <div className="mt-8 pt-6 border-t border-gold-200">
                  <p className="text-center text-ink-500 mb-4">Or practice on your own</p>
                  <div className="flex justify-center">
                    <Button
                      variant="secondary"
                      onClick={() => router.push('/team/games')}
                    >
                      <Gamepad2 className="w-5 h-5 mr-2" />
                      Solo Practice
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active Session Alert */}
        {activeSessions.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="border-sage-400 bg-sage-50 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="flex-1 p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-sage-500 rounded-full animate-pulse" />
                      <span className="text-sage-700 font-semibold">LIVE NOW</span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-ink-800 mb-1">
                      {activeSessions[0].name}
                    </h2>
                    <p className="text-ink-600">
                      Your coach started a session! Tap to join.
                    </p>
                  </div>
                  <div className="p-6 flex items-center">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => router.push(`/play/${activeSessions[0].id}`)}
                      className="w-full sm:w-auto"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Join Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Progress Overview */}
        {team && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={user?.display_name || ''}
                      color={user?.avatar_color}
                      size="lg"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-semibold text-ink-800">
                          Level {playerProgress.level}
                        </span>
                        <Badge variant="gold">Scholar</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-ink-500">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-gold-500" />
                          {playerProgress.totalPoints} pts
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-coral-500" />
                          {playerProgress.streak} day streak
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink-500">Progress to Level {playerProgress.level + 1}</span>
                    <span className="text-ink-700 font-medium">
                      {playerProgress.xpCurrent}/{playerProgress.xpToNextLevel} XP
                    </span>
                  </div>
                  <Progress
                    value={playerProgress.xpCurrent}
                    max={playerProgress.xpToNextLevel}
                    variant="gold"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Game Categories */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-ink-800">
              Practice Games
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/team/games')}
            >
              See All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {GAME_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => router.push(`/team/games?category=${category.id}`)}
                className={`${category.color} p-6 rounded-xl text-left hover:scale-[1.02] active:scale-[0.98] transition-transform`}
              >
                <span className="text-3xl block mb-2">{category.icon}</span>
                <span className="font-display text-lg font-semibold">{category.name}</span>
                <span className="block text-sm opacity-75 mt-1">4 games</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Quick Solo Practice */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-ink-800 to-ink-900 text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gold-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-7 h-7 text-ink-800" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold mb-1">
                    Quick Practice
                  </h3>
                  <p className="text-ink-300 text-sm">
                    Jump into a quick solo session with mixed questions
                  </p>
                </div>
                <Button
                  variant="gold"
                  onClick={() => router.push('/play/solo')}
                  className="flex-shrink-0"
                >
                  Start
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Sessions */}
        {scheduledSessions.length > 0 && (
          <motion.div variants={itemVariants}>
            <h2 className="font-display text-xl font-semibold text-ink-800 mb-4">
              Upcoming Sessions
            </h2>
            <div className="space-y-3">
              {scheduledSessions.slice(0, 3).map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-gold-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-ink-800">{session.name}</h3>
                        <p className="text-sm text-ink-500">
                          {session.scheduled_at
                            ? new Date(session.scheduled_at).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : 'Time TBD'}
                        </p>
                      </div>
                      <Badge variant="outline">{session.games.length} games</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Team Members */}
        {team && teamMembers.length > 1 && (
          <motion.div variants={itemVariants}>
            <h2 className="font-display text-xl font-semibold text-ink-800 mb-4">
              Team Members
            </h2>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 px-3 py-2 bg-cream-100 rounded-xl"
                    >
                      <Avatar
                        name={member.display_name}
                        color={member.avatar_color}
                        size="sm"
                      />
                      <span className="font-medium text-ink-700">
                        {member.display_name}
                        {member.id === user?.id && ' (you)'}
                      </span>
                      {member.role === 'coach' && (
                        <Badge variant="gold" size="sm">Coach</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
