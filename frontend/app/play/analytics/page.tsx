'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowLeft, Target, TrendingUp, Gamepad2, Flame,
  BookOpen, AlertTriangle, Clock, BarChart3,
} from 'lucide-react';
import { Card, CardContent, Badge, Progress } from '@/components/ui';
import { getPlayerStats } from '@/lib/games/achievements';
import {
  getAnalyticsData,
  getAccuracyBySubject,
  getStudyTimeByDay,
  getStrongestSubject,
  getWeakestSubject,
} from '@/lib/games/analytics';
import { getSubjectBreakdown, getWrongAnswerCount } from '@/lib/games/wrongAnswerJournal';
import type { PlayerStats } from '@/lib/games/types';

const SUBJECT_CONFIG: Record<string, { label: string; color: string; barColor: string }> = {
  science: { label: 'Science', color: 'text-sage-700 bg-sage-100', barColor: 'bg-sage-400' },
  social_studies: { label: 'Social Studies', color: 'text-coral-700 bg-coral-100', barColor: 'bg-coral-400' },
  arts: { label: 'Arts', color: 'text-gold-700 bg-gold-100', barColor: 'bg-gold-400' },
  literature: { label: 'Literature', color: 'text-ink-700 bg-ink-100', barColor: 'bg-ink-400' },
  special_area: { label: 'WSC Special', color: 'text-purple-700 bg-purple-100', barColor: 'bg-purple-400' },
};

const ALL_SUBJECTS = ['science', 'social_studies', 'arts', 'literature', 'special_area'];

function formatSubjectName(key: string): string {
  return SUBJECT_CONFIG[key]?.label ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMinutes(totalMs: number): string {
  const totalMins = Math.round(totalMs / 60000);
  if (totalMins < 60) return `${totalMins}m`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours}h ${mins}m`;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStats(getPlayerStats());
  }, []);

  const analyticsData = useMemo(() => (mounted ? getAnalyticsData() : null), [mounted]);
  const subjectAccuracy = useMemo(() => (mounted ? getAccuracyBySubject() : {}), [mounted]);
  const studyTime = useMemo(() => (mounted ? getStudyTimeByDay(7) : []), [mounted]);
  const strongest = useMemo(() => (mounted ? getStrongestSubject() : null), [mounted]);
  const weakest = useMemo(() => (mounted ? getWeakestSubject() : null), [mounted]);
  const wrongBreakdown = useMemo(() => (mounted ? getSubjectBreakdown() : {}), [mounted]);
  const wrongCount = useMemo(() => (mounted ? getWrongAnswerCount() : 0), [mounted]);

  if (!mounted || !stats || !analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="w-12 h-12 border-4 border-ink-200 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  const overallAccuracy = stats.totalQuestionsAnswered > 0
    ? Math.round((stats.correctAnswers / stats.totalQuestionsAnswered) * 100)
    : 0;

  const maxStudyMinutes = Math.max(1, ...studyTime.map((d) => d.minutes));

  return (
    <main className="min-h-screen bg-cream-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/play/solo')}
            className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
            aria-label="Back to Solo Practice"
          >
            <ArrowLeft className="w-6 h-6 text-ink-600" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-800">Learning Analytics</h1>
            <p className="text-ink-500 text-sm">Track your progress across all subjects</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Overview Cards */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            aria-label="Overview statistics"
          >
            <div className="grid grid-cols-2 gap-3">
              <OverviewCard
                icon={<Target className="w-5 h-5 text-sage-600" />}
                label="Questions Answered"
                value={stats.totalQuestionsAnswered.toLocaleString()}
                bg="bg-sage-50"
              />
              <OverviewCard
                icon={<TrendingUp className="w-5 h-5 text-gold-600" />}
                label="Overall Accuracy"
                value={`${overallAccuracy}%`}
                bg="bg-gold-50"
              />
              <OverviewCard
                icon={<Gamepad2 className="w-5 h-5 text-coral-600" />}
                label="Games Played"
                value={stats.gamesPlayed.toLocaleString()}
                bg="bg-coral-50"
              />
              <OverviewCard
                icon={<Flame className="w-5 h-5 text-ink-600" />}
                label="Daily Streak"
                value={`${stats.dailyStreak} day${stats.dailyStreak !== 1 ? 's' : ''}`}
                bg="bg-ink-50"
              />
            </div>
          </motion.section>

          {/* Subject Mastery */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-ink-600" />
                  <h2 className="font-display text-lg font-semibold text-ink-800">Subject Mastery</h2>
                </div>
                <div className="space-y-3">
                  {ALL_SUBJECTS.map((subject) => {
                    const data = subjectAccuracy[subject];
                    const accuracy = data?.accuracy ?? 0;
                    const total = data?.total ?? 0;
                    const config = SUBJECT_CONFIG[subject];
                    return (
                      <div key={subject}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-ink-700">{config.label}</span>
                          <span className="text-sm text-ink-500">
                            {total > 0 ? `${accuracy}% (${total} Q)` : 'No data'}
                          </span>
                        </div>
                        <div className="h-3 bg-ink-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${config.barColor}`}
                            style={{ width: `${accuracy}%` }}
                            role="progressbar"
                            aria-valuenow={accuracy}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${config.label} accuracy`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Accuracy Trend */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-ink-600" />
                  <h2 className="font-display text-lg font-semibold text-ink-800">Accuracy Trend</h2>
                  <span className="text-sm text-ink-400 ml-auto">Last {analyticsData.accuracyTrend.length} games</span>
                </div>
                {analyticsData.accuracyTrend.length === 0 ? (
                  <p className="text-ink-400 text-sm py-6 text-center">
                    Play some games to see your accuracy trend
                  </p>
                ) : (
                  <div className="flex items-end gap-1 h-32" role="img" aria-label="Accuracy trend chart">
                    {analyticsData.accuracyTrend.map((acc, i) => {
                      const barColor =
                        acc >= 80 ? 'bg-sage-400' : acc >= 60 ? 'bg-gold-400' : 'bg-coral-400';
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center justify-end group relative"
                        >
                          <div
                            className={`w-full rounded-t-sm ${barColor} transition-all duration-300 min-h-[2px]`}
                            style={{ height: `${Math.max(2, acc)}%` }}
                          />
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {acc}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-ink-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sage-400" /> 80%+
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gold-400" /> 60-79%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-coral-400" /> Under 60%
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Strongest & Weakest Subjects */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card>
                <CardContent>
                  <h3 className="text-sm font-semibold text-ink-500 mb-3">Strongest Subject</h3>
                  {strongest ? (
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="sage"
                        className={SUBJECT_CONFIG[strongest]?.color}
                      >
                        {formatSubjectName(strongest)}
                      </Badge>
                      <span className="text-lg font-bold text-sage-700">
                        {subjectAccuracy[strongest]?.accuracy ?? 0}%
                      </span>
                    </div>
                  ) : (
                    <p className="text-ink-400 text-sm">Answer 5+ questions in a subject</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <h3 className="text-sm font-semibold text-ink-500 mb-3">Needs Improvement</h3>
                  {weakest ? (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <Badge
                          variant="coral"
                          className={SUBJECT_CONFIG[weakest]?.color}
                        >
                          {formatSubjectName(weakest)}
                        </Badge>
                        <span className="text-lg font-bold text-coral-700">
                          {subjectAccuracy[weakest]?.accuracy ?? 0}%
                        </span>
                      </div>
                      <p className="text-sm text-ink-500">
                        Focus on <strong>{formatSubjectName(weakest)}</strong> to improve your overall score
                      </p>
                    </>
                  ) : (
                    <p className="text-ink-400 text-sm">Answer 5+ questions in a subject</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* Study Time */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-ink-600" />
                    <h2 className="font-display text-lg font-semibold text-ink-800">Study Time</h2>
                  </div>
                  <span className="text-sm text-ink-500">
                    Total: {formatMinutes(analyticsData.totalTimePlayed)}
                  </span>
                </div>
                <div className="flex items-end gap-2 h-24" role="img" aria-label="Study time by day chart">
                  {studyTime.map((day) => {
                    const heightPct = maxStudyMinutes > 0
                      ? Math.max(2, (day.minutes / maxStudyMinutes) * 100)
                      : 2;
                    const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          className="w-full bg-gold-300 rounded-t-sm transition-all duration-300 min-h-[2px]"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-xs text-ink-400">{dayLabel}</span>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {day.minutes}m
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Wrong Answer Patterns */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-coral-600" />
                    <h2 className="font-display text-lg font-semibold text-ink-800">Wrong Answer Patterns</h2>
                  </div>
                  <Badge variant="coral" size="sm">{wrongCount} active</Badge>
                </div>
                {wrongCount === 0 ? (
                  <p className="text-ink-400 text-sm py-4 text-center">
                    No wrong answers recorded yet. Keep practicing!
                  </p>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      {Object.entries(wrongBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([subject, count]) => {
                          const config = SUBJECT_CONFIG[subject];
                          const pct = Math.round((count / wrongCount) * 100);
                          return (
                            <div key={subject}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-ink-700">
                                  {config?.label ?? formatSubjectName(subject)}
                                </span>
                                <span className="text-sm text-ink-500">{count} wrong ({pct}%)</span>
                              </div>
                              <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${config?.barColor ?? 'bg-coral-400'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    <button
                      onClick={() => router.push('/play/solo')}
                      className="text-sm text-gold-600 hover:text-gold-700 font-semibold transition-colors"
                    >
                      <BookOpen className="w-4 h-4 inline mr-1" />
                      Review Wrong Answers
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.section>

          {/* Favorite Game */}
          {analyticsData.favoriteGame && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="text-center py-4">
                <p className="text-sm text-ink-400">
                  Most played game: <strong className="text-ink-600">{analyticsData.favoriteGame.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</strong>
                </p>
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </main>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <Card>
      <CardContent className={`${bg} rounded-xl p-4`}>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">{label}</span>
        </div>
        <p className="text-2xl font-display font-bold text-ink-800">{value}</p>
      </CardContent>
    </Card>
  );
}
