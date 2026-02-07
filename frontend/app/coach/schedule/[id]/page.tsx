'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Play,
  Square,
  Calendar,
  Clock,
  Signal,
  Gamepad2,
  ExternalLink,
  AlertCircle,
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

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-sage-100 text-sage-700' },
  scheduled: { label: 'Scheduled', color: 'bg-gold-100 text-gold-700' },
  completed: { label: 'Completed', color: 'bg-ink-100 text-ink-600' },
  paused: { label: 'Paused', color: 'bg-coral-100 text-coral-700' },
  cancelled: { label: 'Cancelled', color: 'bg-ink-100 text-ink-400' },
};

function formatGameName(id: string): string {
  return id
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function SessionDetail() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const sessionId = Number(params.id);

  const [session, setSession] = useState<Session | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await sessionsApi.get(sessionId);
        setSession(response.session);
        setPlayerCount(response.player_count);
      } catch (err) {
        console.error('Failed to load session:', err);
        setError('Session not found.');
      } finally {
        setIsLoading(false);
      }
    };
    if (sessionId) load();
  }, [sessionId]);

  const handleStart = async () => {
    if (!session) return;
    setActionLoading(true);
    setError('');
    try {
      const response = await sessionsApi.start(session.id);
      setSession(response.session);
    } catch (err) {
      console.error('Failed to start session:', err);
      setError('Failed to start session.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!session) return;
    setActionLoading(true);
    setError('');
    try {
      const response = await sessionsApi.end(session.id);
      setSession(response.session);
    } catch (err) {
      console.error('Failed to end session:', err);
      setError('Failed to end session.');
    } finally {
      setActionLoading(false);
    }
  };

  const config = session ? statusConfig[session.status] || statusConfig.scheduled : null;

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <button
            onClick={() => router.push('/coach/schedule')}
            className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
            aria-label="Back to schedule"
          >
            <ArrowLeft className="w-5 h-5 text-ink-600" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-ink-800 truncate">
                {isLoading ? 'Loading...' : session?.name || 'Session'}
              </h1>
              {config && <Badge className={config.color}>{config.label}</Badge>}
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <motion.div variants={itemVariants} className="text-center py-16">
            <div className="w-12 h-12 border-4 border-gold-200 border-t-gold-600 rounded-full animate-spin mx-auto" />
            <p className="text-ink-500 mt-4">Loading session...</p>
          </motion.div>
        ) : !session ? (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-coral-400 mx-auto mb-4" />
                <h2 className="font-display text-xl font-semibold text-ink-800 mb-2">
                  Session Not Found
                </h2>
                <p className="text-ink-500 mb-6">
                  This session may have been deleted or the link is invalid.
                </p>
                <Button variant="secondary" onClick={() => router.push('/coach/schedule')}>
                  Back to Schedule
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-coral-50 border border-coral-200 rounded-xl text-coral-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Session Info */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader title="Session Info" />
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-cream-100 rounded-xl">
                      <Signal className="w-5 h-5 text-ink-500 mb-2" />
                      <p className="text-sm text-ink-500">Difficulty</p>
                      <p className="font-semibold text-ink-800 capitalize">{session.difficulty}</p>
                    </div>
                    <div className="p-4 bg-cream-100 rounded-xl">
                      <Gamepad2 className="w-5 h-5 text-ink-500 mb-2" />
                      <p className="text-sm text-ink-500">Games</p>
                      <p className="font-semibold text-ink-800">{session.games.length}</p>
                    </div>
                    <div className="p-4 bg-cream-100 rounded-xl">
                      <Calendar className="w-5 h-5 text-ink-500 mb-2" />
                      <p className="text-sm text-ink-500">Scheduled</p>
                      <p className="font-semibold text-ink-800">
                        {session.scheduled_at
                          ? new Date(session.scheduled_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : 'Not set'}
                      </p>
                    </div>
                    <div className="p-4 bg-cream-100 rounded-xl">
                      <Clock className="w-5 h-5 text-ink-500 mb-2" />
                      <p className="text-sm text-ink-500">Mode</p>
                      <p className="font-semibold text-ink-800 capitalize">
                        {session.mode.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Time info for started/ended sessions */}
                  {(session.started_at || session.ended_at) && (
                    <div className="mt-4 p-4 bg-sage-50 rounded-xl">
                      <div className="flex flex-wrap gap-6 text-sm">
                        {session.started_at && (
                          <div>
                            <span className="text-ink-500">Started: </span>
                            <span className="font-medium text-ink-800">
                              {new Date(session.started_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}
                        {session.ended_at && (
                          <div>
                            <span className="text-ink-500">Ended: </span>
                            <span className="font-medium text-ink-800">
                              {new Date(session.ended_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Games List */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader title="Games in this Session" />
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {session.games.map((gameId) => (
                      <div
                        key={gameId}
                        className="p-3 bg-cream-100 rounded-xl text-sm font-medium text-ink-700 flex items-center gap-2"
                      >
                        <Gamepad2 className="w-4 h-4 text-ink-400 shrink-0" />
                        <span className="truncate">{formatGameName(gameId)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
              {session.status === 'scheduled' && (
                <Button
                  variant="gold"
                  onClick={handleStart}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  ) : (
                    <Play className="w-5 h-5 mr-2" />
                  )}
                  Start Session
                </Button>
              )}

              {session.status === 'active' && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/play/${session.id}`)}
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Join Session
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleEnd}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <div className="w-5 h-5 border-2 border-ink-300/30 border-t-ink-500 rounded-full animate-spin mr-2" />
                    ) : (
                      <Square className="w-5 h-5 mr-2" />
                    )}
                    End Session
                  </Button>
                </>
              )}

              {session.status === 'completed' && (
                <p className="text-ink-500 text-sm">
                  This session has been completed.
                </p>
              )}
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
