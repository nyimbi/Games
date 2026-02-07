'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Play,
  CheckCircle,
  Clock,
  Gamepad2,
  Signal,
} from 'lucide-react';
import { Button, Card, CardHeader, CardContent, Badge } from '@/components/ui';
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

const statusConfig: Record<string, { label: string; color: string; icon: typeof Play }> = {
  active: { label: 'Active', color: 'bg-sage-100 text-sage-700', icon: Play },
  scheduled: { label: 'Scheduled', color: 'bg-gold-100 text-gold-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-ink-100 text-ink-600', icon: CheckCircle },
  paused: { label: 'Paused', color: 'bg-coral-100 text-coral-700', icon: Clock },
  cancelled: { label: 'Cancelled', color: 'bg-ink-100 text-ink-400', icon: Clock },
};

const difficultyStars: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

function SessionCard({ session, onClick }: { session: Session; onClick: () => void }) {
  const config = statusConfig[session.status] || statusConfig.scheduled;
  const StatusIcon = config.icon;

  return (
    <motion.button
      variants={itemVariants}
      onClick={onClick}
      className="w-full text-left p-4 bg-white rounded-xl border border-ink-200 hover:border-gold-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-cream-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-gold-100 transition-colors">
            <StatusIcon className="w-6 h-6 text-ink-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-ink-800 truncate">{session.name}</h3>
            <div className="flex items-center gap-3 text-sm text-ink-500 mt-1">
              <span className="flex items-center gap-1">
                <Gamepad2 className="w-3.5 h-3.5" />
                {session.games.length} game{session.games.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Signal className="w-3.5 h-3.5" />
                {difficultyStars[session.difficulty]}
              </span>
              {session.scheduled_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(session.scheduled_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
        <Badge className={config.color}>{config.label}</Badge>
      </div>
    </motion.button>
  );
}

export default function ScheduleList() {
  const router = useRouter();
  const { user } = useAuth();
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

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const scheduledSessions = sessions.filter((s) => s.status === 'scheduled');
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto space-y-8"
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
              <h1 className="font-display text-3xl font-bold text-ink-800">Schedule</h1>
              <p className="text-ink-600 mt-1">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} total
              </p>
            </div>
          </div>
          <Button variant="gold" onClick={() => router.push('/coach/schedule/new')}>
            <Plus className="w-5 h-5 mr-2" />
            New Session
          </Button>
        </motion.div>

        {isLoading ? (
          <motion.div variants={itemVariants} className="text-center py-16">
            <div className="w-12 h-12 border-4 border-gold-200 border-t-gold-600 rounded-full animate-spin mx-auto" />
            <p className="text-ink-500 mt-4">Loading sessions...</p>
          </motion.div>
        ) : sessions.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-ink-300 mx-auto mb-4" />
                <h2 className="font-display text-xl font-semibold text-ink-800 mb-2">
                  No sessions yet
                </h2>
                <p className="text-ink-500 mb-6 max-w-md mx-auto">
                  Create your first practice session to get your team started.
                </p>
                <Button variant="gold" onClick={() => router.push('/coach/schedule/new')}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Session
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Active Sessions */}
            {activeSessions.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card className="border-sage-300 bg-sage-50">
                  <CardHeader
                    title={`Active (${activeSessions.length})`}
                    action={<div className="w-3 h-3 bg-sage-500 rounded-full animate-pulse" />}
                  />
                  <CardContent>
                    <div className="space-y-3">
                      {activeSessions.map((session) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          onClick={() => router.push(`/coach/schedule/${session.id}`)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Scheduled Sessions */}
            {scheduledSessions.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader title={`Scheduled (${scheduledSessions.length})`} />
                  <CardContent>
                    <div className="space-y-3">
                      {scheduledSessions.map((session) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          onClick={() => router.push(`/coach/schedule/${session.id}`)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Completed Sessions */}
            {completedSessions.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader title={`Completed (${completedSessions.length})`} />
                  <CardContent>
                    <div className="space-y-3">
                      {completedSessions.map((session) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          onClick={() => router.push(`/coach/schedule/${session.id}`)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
