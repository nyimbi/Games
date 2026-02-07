'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Trophy,
  Gamepad2,
  Users,
  Clock,
  Calendar,
  TrendingUp,
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

function StatCard({
  icon: Icon,
  label,
  value,
  bgColor,
  iconColor,
}: {
  icon: typeof Trophy;
  label: string;
  value: string | number;
  bgColor: string;
  iconColor: string;
}) {
  return (
    <motion.div variants={itemVariants} className={`p-5 ${bgColor} rounded-xl`}>
      <Icon className={`w-6 h-6 ${iconColor} mb-3`} />
      <p className="text-2xl font-bold text-ink-800">{value}</p>
      <p className="text-sm text-ink-500 mt-1">{label}</p>
    </motion.div>
  );
}

function BarChart({ data, maxValue }: { data: { label: string; value: number }[]; maxValue: number }) {
  if (maxValue === 0) maxValue = 1;

  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((item, i) => {
        const height = Math.max((item.value / maxValue) * 100, 4);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-xs font-medium text-ink-600">{item.value}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="w-full bg-gradient-to-t from-gold-500 to-gold-300 rounded-t-lg min-h-[4px]"
            />
            <span className="text-xs text-ink-400 truncate max-w-full">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const router = useRouter();
  const { user, team, teamMembers } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await sessionsApi.list();
        setSessions(response.sessions);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const completed = sessions.filter((s) => s.status === 'completed');
    const active = sessions.filter((s) => s.status === 'active');
    const totalGames = sessions.reduce((sum, s) => sum + (s.games?.length || 0), 0);
    const practiceMinutes = sessions.reduce((sum, s) => sum + (s.games?.length || 0) * 5, 0);

    return {
      totalSessions: sessions.length,
      completedSessions: completed.length,
      activeSessions: active.length,
      totalGames,
      activeMembers: teamMembers.length,
      practiceHours: Math.round(practiceMinutes / 60 * 10) / 10,
    };
  }, [sessions, teamMembers]);

  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const dayCounts = days.map((label, dayIndex) => {
      const count = sessions.filter((s) => {
        const created = new Date(s.created_at);
        return created >= weekStart && created.getDay() === dayIndex;
      }).length;
      return { label, value: count };
    });

    return dayCounts;
  }, [sessions]);

  const weeklyMax = Math.max(...weeklyData.map((d) => d.value), 0);

  const difficultyBreakdown = useMemo(() => {
    const counts = { easy: 0, medium: 0, hard: 0 };
    sessions.forEach((s) => {
      counts[s.difficulty] = (counts[s.difficulty] || 0) + 1;
    });
    return [
      { label: 'Easy', value: counts.easy },
      { label: 'Medium', value: counts.medium },
      { label: 'Hard', value: counts.hard },
    ];
  }, [sessions]);

  const difficultyMax = Math.max(...difficultyBreakdown.map((d) => d.value), 0);

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <button
            onClick={() => router.push('/coach')}
            className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-ink-600" />
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold text-ink-800">Analytics</h1>
            <p className="text-ink-600 mt-1">
              {team ? `${team.name} performance overview` : 'Team performance overview'}
            </p>
          </div>
        </motion.div>

        {isLoading ? (
          <motion.div variants={itemVariants} className="text-center py-16">
            <div className="w-12 h-12 border-4 border-gold-200 border-t-gold-600 rounded-full animate-spin mx-auto" />
            <p className="text-ink-500 mt-4">Loading analytics...</p>
          </motion.div>
        ) : (
          <>
            {/* Stats Grid */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={Trophy}
                  label="Total Sessions"
                  value={stats.totalSessions}
                  bgColor="bg-gold-50"
                  iconColor="text-gold-600"
                />
                <StatCard
                  icon={Gamepad2}
                  label="Games Played"
                  value={stats.totalGames}
                  bgColor="bg-sage-50"
                  iconColor="text-sage-600"
                />
                <StatCard
                  icon={Users}
                  label="Active Members"
                  value={stats.activeMembers}
                  bgColor="bg-coral-50"
                  iconColor="text-coral-600"
                />
                <StatCard
                  icon={Clock}
                  label="Practice Time"
                  value={`${stats.practiceHours}h`}
                  bgColor="bg-ink-100"
                  iconColor="text-ink-600"
                />
              </div>
            </motion.div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Activity */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader
                    title="This Week"
                    action={
                      <div className="flex items-center gap-1 text-sm text-ink-400">
                        <TrendingUp className="w-4 h-4" />
                        Sessions
                      </div>
                    }
                  />
                  <CardContent>
                    <BarChart data={weeklyData} maxValue={weeklyMax} />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Difficulty Distribution */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader title="Difficulty Distribution" />
                  <CardContent>
                    <BarChart data={difficultyBreakdown} maxValue={difficultyMax} />
                    <div className="flex justify-center gap-6 mt-4">
                      {difficultyBreakdown.map((d) => (
                        <div key={d.label} className="text-center">
                          <p className="text-lg font-bold text-ink-800">{d.value}</p>
                          <p className="text-xs text-ink-400">{d.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Team Member Activity */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader
                  title="Team Members"
                  action={
                    <Badge className="bg-ink-100 text-ink-600">
                      {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                    </Badge>
                  }
                />
                <CardContent>
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                      <p className="text-ink-500">No team members yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamMembers.map((member) => (
                        <motion.div
                          key={member.id}
                          variants={itemVariants}
                          className="p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar
                              name={member.display_name}
                              animal={member.avatar}
                              color={member.avatar_color}
                              size="md"
                            />
                            <div className="min-w-0">
                              <h3 className="font-semibold text-ink-800 truncate">
                                {member.display_name}
                              </h3>
                              {member.scholar_code && (
                                <p className="text-xs font-mono text-ink-400">
                                  {member.scholar_code}
                                </p>
                              )}
                            </div>
                            <Badge
                              className={
                                member.role === 'coach'
                                  ? 'bg-gold-100 text-gold-700 ml-auto'
                                  : 'bg-sage-100 text-sage-700 ml-auto'
                              }
                            >
                              {member.role === 'coach' ? 'Coach' : 'Scholar'}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-ink-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Joined {new Date(member.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Session History */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader
                  title="Recent Sessions"
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/coach/schedule')}
                    >
                      View All
                    </Button>
                  }
                />
                <CardContent>
                  {sessions.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                      <p className="text-ink-500">No sessions recorded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.slice(0, 8).map((session) => {
                        const statusColor =
                          session.status === 'active'
                            ? 'bg-sage-100 text-sage-700'
                            : session.status === 'completed'
                              ? 'bg-ink-100 text-ink-600'
                              : 'bg-gold-100 text-gold-700';

                        return (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-3 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors cursor-pointer"
                            onClick={() => router.push(`/coach/schedule/${session.id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                router.push(`/coach/schedule/${session.id}`);
                              }
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 bg-cream-200 rounded-lg flex items-center justify-center shrink-0">
                                <Gamepad2 className="w-5 h-5 text-ink-500" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-medium text-ink-800 truncate">{session.name}</h4>
                                <p className="text-xs text-ink-400">
                                  {session.games.length} game{session.games.length !== 1 ? 's' : ''} &middot;{' '}
                                  {new Date(session.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>
                            <Badge className={statusColor}>
                              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
