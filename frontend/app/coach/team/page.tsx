'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  Shield,
  UserCircle,
  Calendar,
  Plus,
} from 'lucide-react';
import { Button, Card, CardHeader, CardContent, Avatar, Badge } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Team } from '@/lib/api/client';

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

export default function TeamManagement() {
  const router = useRouter();
  const { user, team, teams, teamMembers, createTeam, switchTeam } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [switchingTo, setSwitchingTo] = useState<number | null>(null);

  const copyJoinCode = () => {
    if (team?.join_code) {
      navigator.clipboard.writeText(team.join_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setIsCreating(true);
    setCreateError('');
    try {
      await createTeam(teamName.trim(), teamCode.trim() || undefined);
      setShowCreateTeam(false);
      setTeamName('');
      setTeamCode('');
    } catch (err: any) {
      const msg = err?.data?.detail || 'Failed to create team';
      setCreateError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchTeam = async (targetTeam: Team) => {
    if (targetTeam.id === team?.id) return;
    setSwitchingTo(targetTeam.id);
    try {
      await switchTeam(targetTeam.id);
    } catch (err) {
      console.error('Failed to switch team:', err);
    } finally {
      setSwitchingTo(null);
    }
  };

  const roleBadge = (role: string) => {
    if (role === 'coach') {
      return <Badge className="bg-gold-100 text-gold-700">Coach</Badge>;
    }
    return <Badge className="bg-sage-100 text-sage-700">Scholar</Badge>;
  };

  const scholarCount = teamMembers.filter(m => m.role === 'player').length;

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
            onClick={() => router.push('/coach')}
            className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-ink-600" />
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold text-ink-800">Teams</h1>
            <p className="text-ink-600 mt-1">
              {team
                ? `${team.name} — ${scholarCount}/5 scholars${teams.length > 1 ? ` · ${teams.length} teams total` : ''}`
                : 'Create a team to get started'}
            </p>
          </div>
        </motion.div>

        {/* Team Tabs (only if multiple teams) */}
        {teams.length > 1 && (
          <motion.div variants={itemVariants}>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSwitchTeam(t)}
                  disabled={switchingTo !== null}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    t.id === team?.id
                      ? 'bg-gold-500 text-ink-800 shadow-sm'
                      : 'bg-cream-100 text-ink-600 hover:bg-cream-200'
                  }`}
                >
                  {t.name}
                  {switchingTo === t.id && (
                    <span className="inline-block w-4 h-4 border-2 border-ink-300 border-t-ink-600 rounded-full animate-spin ml-2 align-middle" />
                  )}
                </button>
              ))}
              <button
                onClick={() => setShowCreateTeam(true)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap bg-white border-2 border-dashed border-ink-300 text-ink-500 hover:border-gold-400 hover:text-gold-700 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                New Team
              </button>
            </div>
          </motion.div>
        )}

        {!team && teams.length === 0 ? (
          /* No Team State */
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-gold-50 to-cream-100 border-gold-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gold-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gold-700" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-ink-800 mb-2">
                  Create Your First Team
                </h2>
                <p className="text-ink-600 mb-6 max-w-md mx-auto">
                  Create a team to invite your scholars and start scheduling practice sessions together.
                </p>

                {showCreateTeam ? (
                  <form onSubmit={handleCreateTeam} className="max-w-sm mx-auto">
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Team name"
                      className="w-full px-4 py-3 rounded-xl border border-ink-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none mb-3"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={teamCode}
                      onChange={(e) => setTeamCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 12))}
                      placeholder="Custom team code (optional, e.g. LIONS)"
                      className="w-full px-4 py-3 rounded-xl border border-ink-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none mb-1 font-mono uppercase"
                    />
                    <p className="text-xs text-ink-400 mb-4">4-12 characters. Leave blank for auto-generated.</p>
                    {createError && (
                      <p className="text-sm text-coral-600 mb-3">{createError}</p>
                    )}
                    <div className="flex gap-3 justify-center">
                      <Button type="button" variant="ghost" onClick={() => { setShowCreateTeam(false); setCreateError(''); }}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="gold" disabled={!teamName.trim() || isCreating}>
                        {isCreating ? 'Creating...' : 'Create Team'}
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
        ) : (
          <>
            {/* Create Team Inline Form (for additional teams) */}
            {showCreateTeam && (
              <motion.div variants={itemVariants}>
                <Card className="border-gold-200 bg-gold-50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-ink-800 mb-4">Create Another Team</h3>
                    <form onSubmit={handleCreateTeam} className="space-y-3">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="Team name"
                          className="flex-1 px-4 py-3 rounded-xl border border-ink-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={teamCode}
                          onChange={(e) => setTeamCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 12))}
                          placeholder="Code (optional)"
                          className="w-40 px-4 py-3 rounded-xl border border-ink-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none font-mono uppercase"
                        />
                      </div>
                      {createError && (
                        <p className="text-sm text-coral-600">{createError}</p>
                      )}
                      <div className="flex gap-3 justify-end">
                        <Button type="button" variant="ghost" onClick={() => { setShowCreateTeam(false); setTeamName(''); setTeamCode(''); setCreateError(''); }}>
                          Cancel
                        </Button>
                        <Button type="submit" variant="gold" disabled={!teamName.trim() || isCreating}>
                          {isCreating ? 'Creating...' : 'Create'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Team Info Card */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader title="Team Info" />
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Team Name */}
                    <div className="flex-1 p-5 bg-cream-100 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-gold-600" />
                        <p className="text-sm font-medium text-ink-500">Team Name</p>
                      </div>
                      <p className="text-2xl font-bold text-ink-800">{team?.name}</p>
                      <p className="text-xs text-ink-400 mt-1">
                        Created {team && new Date(team.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    {/* Join Code */}
                    <div className="flex-1 p-5 bg-gold-50 rounded-xl border border-gold-200">
                      <p className="text-sm font-medium text-ink-500 mb-2">Join Code</p>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-3xl font-bold text-ink-800 tracking-wider">
                          {team?.join_code}
                        </span>
                        <button
                          onClick={copyJoinCode}
                          className="p-2.5 hover:bg-gold-100 rounded-lg transition-colors"
                          aria-label="Copy join code"
                        >
                          {copiedCode ? (
                            <Check className="w-5 h-5 text-sage-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-ink-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-ink-400 mt-2">
                        Share this code with scholars to join your team
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Members */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader
                  title={`Members (${scholarCount}/5 scholars)`}
                  action={
                    scholarCount >= 5 ? (
                      <Badge className="bg-coral-100 text-coral-700">Team Full</Badge>
                    ) : (
                      <Badge className="bg-sage-100 text-sage-700">
                        {5 - scholarCount} spot{5 - scholarCount !== 1 ? 's' : ''} open
                      </Badge>
                    )
                  }
                />
                <CardContent>
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <UserCircle className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                      <p className="text-ink-500">No members yet. Share the join code to invite scholars.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <motion.div
                          key={member.id}
                          variants={itemVariants}
                          className="flex items-center justify-between p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar
                              name={member.display_name}
                              animal={member.avatar}
                              color={member.avatar_color}
                              size="md"
                            />
                            <div>
                              <h3 className="font-semibold text-ink-800">{member.display_name}</h3>
                              <div className="flex items-center gap-3 mt-1">
                                {member.scholar_code && (
                                  <span className="text-xs font-mono text-ink-400">
                                    {member.scholar_code}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-xs text-ink-400">
                                  <Calendar className="w-3 h-3" />
                                  Joined {new Date(member.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          {roleBadge(member.role)}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Create Another Team (bottom CTA when no tabs) */}
            {teams.length <= 1 && !showCreateTeam && (
              <motion.div variants={itemVariants}>
                <button
                  onClick={() => setShowCreateTeam(true)}
                  className="w-full p-6 bg-white rounded-xl border-2 border-dashed border-ink-200 hover:border-gold-400 hover:bg-gold-50 transition-all text-center group"
                >
                  <Plus className="w-8 h-8 text-ink-300 group-hover:text-gold-600 mx-auto mb-2 transition-colors" />
                  <p className="font-semibold text-ink-600 group-hover:text-gold-700 transition-colors">
                    Create Another Team
                  </p>
                  <p className="text-sm text-ink-400 mt-1">
                    Manage multiple teams from a single coach account
                  </p>
                </button>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
