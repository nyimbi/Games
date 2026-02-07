'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Sparkles,
  Gamepad2,
} from 'lucide-react';
import { Button, Card, CardHeader, CardContent, Badge } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';
import { sessionsApi } from '@/lib/api/client';

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

const ALL_GAMES = [
  { id: 'buzzer_battle', name: 'Buzzer Battle', category: 'scholars_bowl' },
  { id: 'category_challenge', name: 'Category Challenge', category: 'scholars_bowl' },
  { id: 'team_trivia', name: 'Team Trivia', category: 'scholars_bowl' },
  { id: 'scavenger_bowl', name: 'Scavenger Bowl', category: 'scholars_bowl' },
  { id: 'story_chain', name: 'Story Chain', category: 'writing' },
  { id: 'essay_sprint', name: 'Essay Sprint', category: 'writing' },
  { id: 'role_writing', name: 'Role Writing', category: 'writing' },
  { id: 'argument_tennis', name: 'Argument Tennis', category: 'writing' },
  { id: 'flashcard_frenzy', name: 'Flashcard Frenzy', category: 'challenge' },
  { id: 'pattern_puzzles', name: 'Pattern Puzzles', category: 'challenge' },
  { id: 'quickfire_quiz', name: 'Quickfire Quiz', category: 'challenge' },
  { id: 'elimination_olympics', name: 'Elimination Olympics', category: 'challenge' },
  { id: 'mini_debate', name: 'Mini Debate', category: 'debate' },
  { id: 'role_play_debates', name: 'Role Play Debates', category: 'debate' },
  { id: 'argument_builder', name: 'Argument Builder', category: 'debate' },
  { id: 'impromptu_challenge', name: 'Impromptu Challenge', category: 'debate' },
  { id: 'scholars_challenge', name: "Scholar's Challenge", category: 'solo' },
  { id: 'battle_mode', name: 'Battle Mode', category: 'solo' },
  { id: 'connection_quest', name: 'Connection Quest', category: 'solo' },
  { id: 'scholar_sprint', name: 'Scholar Sprint', category: 'solo' },
  { id: 'treasure_hunt', name: 'Treasure Hunt', category: 'solo' },
  { id: 'memory_mosaic', name: 'Memory Mosaic', category: 'solo' },
];

const CATEGORIES: Record<string, { label: string; emoji: string }> = {
  scholars_bowl: { label: "Scholar's Bowl", emoji: '🎯' },
  writing: { label: 'Writing', emoji: '✍️' },
  challenge: { label: 'Challenge', emoji: '⚡' },
  debate: { label: 'Debate', emoji: '🗣️' },
  solo: { label: 'Solo', emoji: '🎮' },
};

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: 'bg-sage-100 text-sage-700 border-sage-300' },
  { value: 'medium', label: 'Medium', color: 'bg-gold-100 text-gold-700 border-gold-300' },
  { value: 'hard', label: 'Hard', color: 'bg-coral-100 text-coral-700 border-coral-300' },
] as const;

export default function NewSession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, team, teams } = useAuth();

  const preselectedGames = searchParams.get('games')?.split(',').filter(Boolean) || [];

  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set(preselectedGames));
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>(team?.id ?? undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleGame = (gameId: string) => {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
  };

  const selectCategory = (category: string) => {
    const categoryGames = ALL_GAMES.filter((g) => g.category === category);
    const allSelected = categoryGames.every((g) => selectedGames.has(g.id));

    setSelectedGames((prev) => {
      const next = new Set(prev);
      categoryGames.forEach((g) => {
        if (allSelected) {
          next.delete(g.id);
        } else {
          next.add(g.id);
        }
      });
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Session name is required.');
      return;
    }
    if (selectedGames.size === 0) {
      setError('Select at least one game.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sessionsApi.create({
        name: name.trim(),
        games: Array.from(selectedGames),
        difficulty,
        mode: 'team_practice',
        scheduled_at: scheduledAt || undefined,
        team_id: selectedTeamId,
      });
      router.push('/coach/schedule');
    } catch (err) {
      console.error('Failed to create session:', err);
      setError('Failed to create session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const gamesByCategory = Object.keys(CATEGORIES).map((cat) => ({
    key: cat,
    ...CATEGORIES[cat],
    games: ALL_GAMES.filter((g) => g.category === cat),
  }));

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
          <div>
            <h1 className="font-display text-3xl font-bold text-ink-800">New Session</h1>
            <p className="text-ink-600 mt-1">Configure a practice session for your team</p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session Details */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader title="Session Details" />
              <CardContent className="space-y-5">
                {/* Name */}
                <div>
                  <label htmlFor="session-name" className="block text-sm font-medium text-ink-700 mb-2">
                    Session Name
                  </label>
                  <input
                    id="session-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Monday Practice, Tournament Prep"
                    className="w-full px-4 py-3 rounded-xl border border-ink-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none text-ink-800 placeholder:text-ink-400"
                    autoFocus
                  />
                </div>

                {/* Team Selector (only if coach has multiple teams) */}
                {teams.length > 1 && (
                  <div>
                    <label htmlFor="session-team" className="block text-sm font-medium text-ink-700 mb-2">
                      Team
                    </label>
                    <select
                      id="session-team"
                      value={selectedTeamId ?? ''}
                      onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-4 py-3 rounded-xl border border-ink-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none text-ink-800 bg-white"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">Difficulty</label>
                  <div className="flex gap-3">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setDifficulty(d.value)}
                        className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                          difficulty === d.value
                            ? d.color + ' border-current'
                            : 'bg-white border-ink-200 text-ink-500 hover:border-ink-300'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scheduled Date */}
                <div>
                  <label htmlFor="session-date" className="block text-sm font-medium text-ink-700 mb-2">
                    Schedule Date & Time
                    <span className="text-ink-400 font-normal ml-1">(optional)</span>
                  </label>
                  <input
                    id="session-date"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-ink-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none text-ink-800"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Game Selection */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader
                title="Select Games"
                action={
                  <Badge className="bg-gold-100 text-gold-700">
                    {selectedGames.size} selected
                  </Badge>
                }
              />
              <CardContent className="space-y-6">
                {gamesByCategory.map((cat) => {
                  const allSelected = cat.games.every((g) => selectedGames.has(g.id));
                  const someSelected = cat.games.some((g) => selectedGames.has(g.id));

                  return (
                    <div key={cat.key}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-ink-700 flex items-center gap-2">
                          <span>{cat.emoji}</span>
                          {cat.label}
                        </h3>
                        <button
                          type="button"
                          onClick={() => selectCategory(cat.key)}
                          className="text-sm text-gold-600 hover:text-gold-700 font-medium"
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {cat.games.map((game) => {
                          const isSelected = selectedGames.has(game.id);
                          return (
                            <button
                              key={game.id}
                              type="button"
                              onClick={() => toggleGame(game.id)}
                              className={`p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-gold-50 border-gold-400 text-gold-800'
                                  : 'bg-white border-ink-200 text-ink-600 hover:border-ink-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected
                                      ? 'bg-gold-500 border-gold-500'
                                      : 'border-ink-300'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="truncate">{game.name}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>

          {/* Error & Submit */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-coral-50 border border-coral-200 rounded-xl text-coral-700 text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/coach/schedule')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Session
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
