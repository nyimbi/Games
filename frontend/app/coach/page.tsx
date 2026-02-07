'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Calendar,
  Users,
  Play,
  Plus,
  ArrowRight,
  Clock,
  Trophy,
  Target,
  Zap,
  Copy,
  Check,
} from 'lucide-react';
import { Button, Card, CardHeader, CardContent, Avatar, Badge } from '@/components/ui';
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

export default function CoachDashboard() {
  const router = useRouter();
  const { user, team, teamMembers, createTeam, refreshTeam } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setIsCreatingTeam(true);
    try {
      await createTeam(teamName.trim());
      setShowCreateTeam(false);
      setTeamName('');
    } catch (err) {
      console.error('Failed to create team:', err);
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const copyJoinCode = () => {
    if (team?.join_code) {
      navigator.clipboard.writeText(team.join_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const scheduledSessions = sessions.filter((s) => s.status === 'scheduled');
  const recentSessions = sessions.filter((s) => s.status === 'completed').slice(0, 5);

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
          <div>
            <h1 className="font-display text-3xl font-bold text-ink-800">
              Welcome, {user?.display_name}!
            </h1>
            <p className="text-ink-600 mt-1">
              {team ? `Managing ${team.name}` : 'Set up your team to get started'}
            </p>
          </div>

          {team && (
            <Button
              variant="gold"
              onClick={() => router.push('/coach/schedule/new')}
            >
              <Plus className="w-5 h-5 mr-2" />
              New Session
            </Button>
          )}
        </motion.div>

        {/* No Team State */}
        {!team && (
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-gold-50 to-cream-100 border-gold-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gold-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gold-700" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-ink-800 mb-2">
                  Create Your Team
                </h2>
                <p className="text-ink-600 mb-6 max-w-md mx-auto">
                  Create a team to invite your scholars and start scheduling practice sessions.
                </p>

                {showCreateTeam ? (
                  <form onSubmit={handleCreateTeam} className="max-w-sm mx-auto">
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Team name"
                      className="w-full px-4 py-3 rounded-xl border border-ink-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none mb-4"
                      autoFocus
                    />
                    <div className="flex gap-3 justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowCreateTeam(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="gold"
                        disabled={!teamName.trim() || isCreatingTeam}
                      >
                        {isCreatingTeam ? 'Creating...' : 'Create Team'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button variant="gold" size="lg" onClick={() => setShowCreateTeam(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Create Team
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Team Overview */}
        {team && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader
                title="Team Overview"
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/coach/team')}
                  >
                    Manage
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                }
              />
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Join Code */}
                  <div className="flex-1 p-4 bg-cream-100 rounded-xl">
                    <p className="text-sm text-ink-500 mb-1">Team Join Code</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xl font-bold text-ink-800 tracking-wider">
                        {team.join_code}
                      </span>
                      <button
                        onClick={copyJoinCode}
                        className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
                      >
                        {copiedCode ? (
                          <Check className="w-5 h-5 text-sage-600" />
                        ) : (
                          <Copy className="w-5 h-5 text-ink-400" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-ink-400 mt-2">
                      Share this code with your scholars
                    </p>
                  </div>

                  {/* Team Members */}
                  <div className="flex-1 p-4 bg-cream-100 rounded-xl">
                    <p className="text-sm text-ink-500 mb-2">Team Members</p>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {teamMembers.slice(0, 5).map((member) => (
                          <Avatar
                            key={member.id}
                            name={member.display_name}
                            animal={member.avatar}
                            color={member.avatar_color}
                            size="sm"
                            className="ring-2 ring-cream-100"
                          />
                        ))}
                      </div>
                      <span className="text-ink-600 font-medium">
                        {teamMembers.length}/6 members
                      </span>
                      {teamMembers.length >= 6 && (
                        <Badge className="bg-coral-100 text-coral-700 ml-2">Full</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="border-sage-300 bg-sage-50">
              <CardHeader
                title="Live Sessions"
                action={<div className="w-3 h-3 bg-sage-500 rounded-full animate-pulse" />}
              />
              <CardContent>
                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-white rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-sage-200 rounded-xl flex items-center justify-center">
                          <Play className="w-6 h-6 text-sage-700" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-ink-800">{session.name}</h3>
                          <p className="text-sm text-ink-500">
                            {session.games.length} games • {session.difficulty} difficulty
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => router.push(`/play/${session.id}`)}
                      >
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Stats & Scheduled */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Stats */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader title="This Week" />
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gold-50 rounded-xl">
                    <Trophy className="w-6 h-6 text-gold-600 mb-2" />
                    <p className="text-2xl font-bold text-ink-800">
                      {sessions.filter((s) => s.status === 'completed').length}
                    </p>
                    <p className="text-sm text-ink-500">Sessions Completed</p>
                  </div>
                  <div className="p-4 bg-sage-50 rounded-xl">
                    <Target className="w-6 h-6 text-sage-600 mb-2" />
                    <p className="text-2xl font-bold text-ink-800">
                      {scheduledSessions.length}
                    </p>
                    <p className="text-sm text-ink-500">Upcoming</p>
                  </div>
                  <div className="p-4 bg-coral-50 rounded-xl">
                    <Zap className="w-6 h-6 text-coral-600 mb-2" />
                    <p className="text-2xl font-bold text-ink-800">
                      {teamMembers.length}
                    </p>
                    <p className="text-sm text-ink-500">Active Scholars</p>
                  </div>
                  <div className="p-4 bg-ink-100 rounded-xl">
                    <Clock className="w-6 h-6 text-ink-600 mb-2" />
                    <p className="text-2xl font-bold text-ink-800">
                      {Math.round(sessions.reduce((acc, s) => acc + (s.games?.length || 0) * 5, 0) / 60)}h
                    </p>
                    <p className="text-sm text-ink-500">Practice Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Scheduled Sessions */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader
                title="Upcoming Sessions"
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/coach/schedule')}
                  >
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                }
              />
              <CardContent>
                {scheduledSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                    <p className="text-ink-500 mb-4">No sessions scheduled</p>
                    {team && (
                      <Button
                        variant="secondary"
                        onClick={() => router.push('/coach/schedule/new')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule Session
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scheduledSessions.slice(0, 3).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-cream-100 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gold-200 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-gold-700" />
                          </div>
                          <div>
                            <h3 className="font-medium text-ink-800">{session.name}</h3>
                            <p className="text-xs text-ink-500">
                              {session.scheduled_at
                                ? new Date(session.scheduled_at).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })
                                : 'Not scheduled'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/coach/schedule/${session.id}`)}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        {team && (
          <motion.div variants={itemVariants}>
            <h2 className="font-display text-xl font-semibold text-ink-800 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/coach/schedule/new')}
                className="p-6 bg-white rounded-xl border border-ink-200 hover:border-gold-300 hover:shadow-md transition-all text-left group"
              >
                <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-gold-200 transition-colors">
                  <Plus className="w-6 h-6 text-gold-700" />
                </div>
                <h3 className="font-semibold text-ink-800">New Session</h3>
                <p className="text-sm text-ink-500">Schedule practice</p>
              </button>

              <button
                onClick={() => router.push('/coach/games')}
                className="p-6 bg-white rounded-xl border border-ink-200 hover:border-sage-300 hover:shadow-md transition-all text-left group"
              >
                <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-sage-200 transition-colors">
                  <Target className="w-6 h-6 text-sage-700" />
                </div>
                <h3 className="font-semibold text-ink-800">Browse Games</h3>
                <p className="text-sm text-ink-500">Explore all 16 games</p>
              </button>

              <button
                onClick={() => router.push('/coach/team')}
                className="p-6 bg-white rounded-xl border border-ink-200 hover:border-coral-300 hover:shadow-md transition-all text-left group"
              >
                <div className="w-12 h-12 bg-coral-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-coral-200 transition-colors">
                  <Users className="w-6 h-6 text-coral-700" />
                </div>
                <h3 className="font-semibold text-ink-800">Manage Team</h3>
                <p className="text-sm text-ink-500">View members</p>
              </button>

              <button
                onClick={() => router.push('/coach/analytics')}
                className="p-6 bg-white rounded-xl border border-ink-200 hover:border-ink-400 hover:shadow-md transition-all text-left group"
              >
                <div className="w-12 h-12 bg-ink-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-ink-200 transition-colors">
                  <Trophy className="w-6 h-6 text-ink-700" />
                </div>
                <h3 className="font-semibold text-ink-800">Analytics</h3>
                <p className="text-sm text-ink-500">Track progress</p>
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
