'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, GraduationCap, BarChart3, Brain } from 'lucide-react';
import { Button, Card, CardContent, Badge, Avatar } from '@/components/ui';
import { ScholarCodeCard } from '@/components/ui/ScholarCodeCard';
import { useAuth } from '@/lib/hooks/useAuth';
import { getStudentProfile, setGradeLevel, getEffectiveLevel, updateInferredLevel } from '@/lib/games/studentLevel';
import { getPlayerStats } from '@/lib/games/achievements';
import type { StudentProfile, PlayerStats } from '@/lib/games/types';

const GRADE_OPTIONS = Array.from({ length: 9 }, (_, i) => i + 4); // 4-12

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-sage-100 text-sage-700',
  intermediate: 'bg-gold-100 text-gold-700',
  advanced: 'bg-purple-100 text-purple-700',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [effectiveLevel, setEffectiveLevel] = useState<string>('intermediate');

  useEffect(() => {
    const p = getStudentProfile();
    const s = getPlayerStats();
    setProfile(p);
    setStats(s);
    updateInferredLevel(s);
    setEffectiveLevel(getEffectiveLevel());
  }, []);

  const handleGradeChange = (grade: number | null) => {
    const updated = setGradeLevel(grade);
    setProfile(updated);
    setEffectiveLevel(getEffectiveLevel());
  };

  if (!profile || !stats) return null;

  const accuracy = stats.totalQuestionsAnswered > 0
    ? Math.round((stats.correctAnswers / stats.totalQuestionsAnswered) * 100)
    : 0;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-cream-200 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6 text-ink-600" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-800">Profile</h1>
          <p className="text-ink-500 text-sm">Customize your learning experience</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* User Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar
                name={user?.display_name || ''}
                animal={user?.avatar}
                color={user?.avatar_color}
                size="lg"
              />
              <div>
                <h2 className="font-display text-xl font-bold text-ink-800">{user?.display_name}</h2>
                <Badge className={LEVEL_COLORS[effectiveLevel]}>
                  {effectiveLevel.charAt(0).toUpperCase() + effectiveLevel.slice(1)} Level
                </Badge>
              </div>
            </div>
            {user?.scholar_code && (
              <div className="mt-4">
                <ScholarCodeCard code={user.scholar_code} variant="full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grade Level Picker */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-ink-800 mb-1 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-gold-600" />
              Grade Level
            </h3>
            <p className="text-sm text-ink-500 mb-4">
              Set your grade for age-appropriate AI explanations.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleGradeChange(null)}
                className={`p-3 rounded-xl text-sm font-medium transition-all ${
                  profile.gradeLevel === null
                    ? 'bg-ink-800 text-white ring-2 ring-gold-400'
                    : 'bg-cream-100 text-ink-600 hover:bg-cream-200'
                }`}
              >
                Auto-detect
              </button>
              {GRADE_OPTIONS.map((grade) => (
                <button
                  key={grade}
                  onClick={() => handleGradeChange(grade)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    profile.gradeLevel === grade
                      ? 'bg-gold-500 text-white ring-2 ring-gold-300 shadow-md'
                      : 'bg-cream-100 text-ink-600 hover:bg-cream-200'
                  }`}
                >
                  Grade {grade}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Level Info */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-ink-800 mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Explanation Level
            </h3>
            <div className="space-y-3">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <div
                  key={level}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    effectiveLevel === level
                      ? 'border-gold-400 bg-gold-50'
                      : 'border-transparent bg-cream-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-ink-800 capitalize">{level}</span>
                    {effectiveLevel === level && (
                      <Badge variant="gold" size="sm">Active</Badge>
                    )}
                  </div>
                  <p className="text-xs text-ink-500">
                    {level === 'beginner' && 'Simple words, analogies, 2-3 sentences'}
                    {level === 'intermediate' && 'Academic vocabulary, examples, 3-4 sentences'}
                    {level === 'advanced' && 'Technical terms, broader connections, 4-6 sentences'}
                  </p>
                </div>
              ))}
            </div>
            {profile.inferredLevel && (
              <p className="text-xs text-ink-400 mt-3">
                Auto-detected level: <span className="font-medium capitalize">{profile.inferredLevel}</span>
                {profile.gradeLevel !== null && ' (overridden by grade setting)'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-ink-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sage-600" />
              Stats Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-cream-50 rounded-xl">
                <p className="text-2xl font-bold text-ink-800">{stats.totalQuestionsAnswered}</p>
                <p className="text-xs text-ink-500">Questions Answered</p>
              </div>
              <div className="text-center p-3 bg-cream-50 rounded-xl">
                <p className="text-2xl font-bold text-sage-600">{accuracy}%</p>
                <p className="text-xs text-ink-500">Accuracy</p>
              </div>
              <div className="text-center p-3 bg-cream-50 rounded-xl">
                <p className="text-2xl font-bold text-gold-600">{stats.longestStreak}</p>
                <p className="text-xs text-ink-500">Longest Streak</p>
              </div>
              <div className="text-center p-3 bg-cream-50 rounded-xl">
                <p className="text-2xl font-bold text-ink-700">{stats.gamesPlayed}</p>
                <p className="text-xs text-ink-500">Games Played</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
