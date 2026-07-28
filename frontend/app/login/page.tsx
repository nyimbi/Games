'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ArrowLeft, BookOpen, Users, AlertCircle, KeyRound, Sparkles, ArrowRight } from 'lucide-react';
import { Button, Card, CardContent, AvatarPicker, ScholarCodeCard } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';
import { ApiError } from '@/lib/api/client';

// Streamlined steps — role selection is gone (inferred from which button was clicked)
type Step = 'landing' | 'name' | 'avatar' | 'reveal' | 'coach-team';
type Role = 'coach' | 'player';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { join, recover, joinTeam, createTeam, isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [step, setStep] = useState<Step>('landing');
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('fox');
  const [scholarCode, setScholarCode] = useState('');   // recovery input
  const [revealedCode, setRevealedCode] = useState('');
  const [teamCode, setTeamCode] = useState('');         // join code (from URL or typed)
  const [teamName, setTeamName] = useState('');         // coach: new team name

  // Pre-fill team code from URL (?code=ABC123) and skip straight to new-scholar flow
  const urlCode = searchParams.get('code')?.toUpperCase() ?? '';
  useEffect(() => {
    if (urlCode) setTeamCode(urlCode);
  }, [urlCode]);

  // Redirect once authenticated (but not mid-flow)
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && step !== 'reveal' && step !== 'coach-team') {
      router.push(user.role === 'coach' ? '/coach' : '/team');
    }
  }, [isAuthenticated, authLoading, user, step, router]);

  const formatCode = (v: string) => v.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleRecover = async () => {
    if (!scholarCode.trim()) return;
    setIsLoading(true); setError(null);
    try {
      await recover(scholarCode.trim());
      // useEffect redirect handles navigation
    } catch (err) {
      setError(err instanceof ApiError
        ? (err.data?.detail || 'Scholar Code not found — check and try again')
        : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNew = (r: Role) => {
    setRole(r); setError(null); setStep('name');
  };

  const handleNameNext = () => {
    if (!displayName.trim()) return;
    setError(null); setStep('avatar');
  };

  const handleJoinPlatform = async () => {
    if (!displayName.trim() || !role) return;
    setIsLoading(true); setError(null);
    try {
      const newUser = await join({ display_name: displayName.trim(), role, avatar: selectedAvatar });
      setRevealedCode(newUser.scholar_code || '');

      // Auto-join team if code available (scholars only)
      if (role === 'player' && teamCode.trim()) {
        try { await joinTeam(teamCode.trim()); } catch { /* non-fatal — they can join later */ }
      }

      setStep('reveal');
    } catch (err) {
      setError(err instanceof ApiError
        ? (err.data?.detail || 'Failed to create account. Please try again.')
        : err instanceof TypeError
        ? 'Cannot reach the server. Check your connection.'
        : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevealDone = () => {
    if (role === 'coach') { setStep('coach-team'); return; }
    router.push('/team');
  };

  const handleCoachTeam = async () => {
    const input = teamCode.trim() || teamName.trim();
    if (!input) return;
    setIsLoading(true); setError(null);
    try {
      if (teamCode.trim()) {
        await joinTeam(teamCode.trim().toUpperCase());
      } else {
        await createTeam(teamName.trim());
      }
      router.push('/coach');
    } catch (err) {
      setError(err instanceof ApiError
        ? (err.status === 409 ? 'Team is full' : err.data?.detail || 'Failed. Please try again.')
        : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Loading state ──────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-ink-200 border-t-gold-500 rounded-full" />
      </div>
    );
  }

  // ─── Step progress (name → avatar → reveal) ─────────────────────────────────
  const PROGRESS_STEPS: Step[] = ['name', 'avatar', 'reveal'];
  const progressIdx = PROGRESS_STEPS.indexOf(step);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-cream-100 flex items-center justify-center px-6 py-12">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sage-200 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <button onClick={() => router.push('/')}
            className="inline-flex items-center justify-center w-16 h-16 bg-ink-800 rounded-2xl shadow-xl mb-4 hover:bg-ink-700 transition-colors">
            <GraduationCap className="w-8 h-8 text-gold-400" />
          </button>
          <h1 className="font-display text-3xl font-bold text-ink-800">WSC Scholar Games</h1>
        </motion.div>

        {/* Step dots */}
        {progressIdx >= 0 && (
          <div className="flex justify-center gap-2 mb-6">
            {PROGRESS_STEPS.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all ${i <= progressIdx ? 'w-6 bg-gold-500' : 'w-2 bg-ink-200'}`} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── LANDING ──────────────────────────────────────────────────────── */}
          {step === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <Card className="overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  {/* Returning scholar — primary action */}
                  <div>
                    <p className="text-sm font-semibold text-ink-600 mb-2">Returning scholar? Sign in with your code:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={scholarCode}
                        onChange={e => setScholarCode(formatCode(e.target.value))}
                        onKeyDown={e => e.key === 'Enter' && handleRecover()}
                        placeholder="e.g. OWL-SIPHO"
                        autoFocus={!urlCode}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-ink-200 focus:border-gold-400 focus:outline-none font-mono text-lg text-center tracking-wider uppercase"
                        maxLength={30}
                      />
                      <Button variant="primary" onClick={handleRecover} disabled={!scholarCode.trim() || isLoading}>
                        {isLoading ? '…' : <ArrowRight className="w-5 h-5" />}
                      </Button>
                    </div>
                    {error && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mt-2 text-sm text-coral-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />{error}
                      </motion.p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-ink-200" />
                    <span className="text-sm text-ink-400">new here?</span>
                    <div className="flex-1 h-px bg-ink-200" />
                  </div>

                  {/* New user buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleStartNew('player')}
                      className="p-5 rounded-xl border-2 border-gold-200 bg-gold-50 hover:border-gold-400 hover:bg-gold-100 transition-all text-left group">
                      <Users className="w-7 h-7 text-gold-600 mb-3 group-hover:scale-110 transition-transform" />
                      <p className="font-display font-semibold text-ink-800 text-sm">I'm a Scholar</p>
                      <p className="text-xs text-ink-500 mt-0.5">Join and play!</p>
                    </button>
                    <button onClick={() => handleStartNew('coach')}
                      className="p-5 rounded-xl border-2 border-ink-200 bg-white hover:border-ink-400 transition-all text-left group">
                      <BookOpen className="w-7 h-7 text-ink-600 mb-3 group-hover:scale-110 transition-transform" />
                      <p className="font-display font-semibold text-ink-800 text-sm">I'm a Coach</p>
                      <p className="text-xs text-ink-500 mt-0.5">Manage a team</p>
                    </button>
                  </div>

                  {/* Play solo — zero friction */}
                  <button onClick={() => router.push('/play/solo')}
                    className="w-full text-center text-sm text-ink-400 hover:text-gold-600 transition-colors py-1">
                    <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                    Just play solo — no account needed
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── NAME ─────────────────────────────────────────────────────────── */}
          {step === 'name' && (
            <motion.div key="name" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <Card className="overflow-hidden">
                <CardContent className="p-8">
                  <button onClick={() => { setStep('landing'); setError(null); }}
                    className="flex items-center text-ink-500 hover:text-ink-700 mb-6 transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4 mr-1" />Back
                  </button>

                  <h2 className="font-display text-2xl font-semibold text-ink-800 mb-1">
                    {role === 'coach' ? 'Your name' : 'What\'s your name?'}
                  </h2>
                  <p className="text-ink-500 text-sm mb-6">
                    {role === 'coach' ? 'This is how scholars will see you.' : 'This is how your team will see you.'}
                  </p>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mb-4 p-3 rounded-lg bg-coral-100 text-coral-700 flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleNameNext()}
                      placeholder={role === 'coach' ? 'Coach name' : 'Your first name'}
                      autoFocus
                      className="w-full px-4 py-4 rounded-xl border-2 border-ink-200 focus:border-gold-400 focus:outline-none font-display text-xl"
                      maxLength={40}
                    />

                    {/* Team code inline for scholars — pre-filled from URL or typeable */}
                    {role === 'player' && (
                      <div>
                        <label className="block text-xs font-semibold text-ink-500 mb-1 uppercase tracking-wide">
                          Team code {urlCode ? '(pre-filled from your link)' : '(optional — ask your coach)'}
                        </label>
                        <input
                          type="text"
                          value={teamCode}
                          onChange={e => setTeamCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                          placeholder="e.g. TEAM123"
                          readOnly={!!urlCode}
                          className={`w-full px-4 py-3 rounded-xl border-2 font-mono text-lg text-center tracking-widest uppercase ${
                            urlCode
                              ? 'bg-gold-50 border-gold-300 text-gold-800 cursor-default'
                              : 'border-ink-200 focus:border-gold-400 focus:outline-none'
                          }`}
                          maxLength={12}
                        />
                      </div>
                    )}

                    <Button variant="gold" size="lg" className="w-full" onClick={handleNameNext} disabled={!displayName.trim()}>
                      Next — Pick your avatar <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── AVATAR ───────────────────────────────────────────────────────── */}
          {step === 'avatar' && (
            <motion.div key="avatar" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <Card className="overflow-hidden">
                <CardContent className="p-8">
                  <button onClick={() => { setStep('name'); setError(null); }}
                    className="flex items-center text-ink-500 hover:text-ink-700 mb-6 transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4 mr-1" />Back
                  </button>

                  <h2 className="font-display text-2xl font-semibold text-ink-800 mb-1">Choose your avatar</h2>
                  <p className="text-ink-500 text-sm mb-6">Pick the animal that represents you best.</p>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mb-4 p-3 rounded-lg bg-coral-100 text-coral-700 flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                    </motion.div>
                  )}

                  <div className="mb-6"><AvatarPicker selected={selectedAvatar} onSelect={setSelectedAvatar} /></div>

                  <Button variant="gold" size="lg" className="w-full" onClick={handleJoinPlatform} disabled={isLoading}>
                    {isLoading
                      ? (teamCode ? 'Creating account & joining team…' : 'Creating your account…')
                      : "Let's go!"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── REVEAL ───────────────────────────────────────────────────────── */}
          {step === 'reveal' && (
            <motion.div key="reveal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="overflow-hidden">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-8 h-8 text-gold-600" />
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-ink-800 mb-2">Your Scholar Code</h2>
                  <p className="text-ink-500 text-sm mb-6">
                    This is how you sign back in. Screenshot it or write it down!
                  </p>

                  {revealedCode && <div className="mb-6"><ScholarCodeCard code={revealedCode} /></div>}

                  <Button variant="gold" size="lg" className="w-full" onClick={handleRevealDone}>
                    {role === 'coach' ? 'Next — Set up your team' : "I've saved it — let's play!"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── COACH TEAM ───────────────────────────────────────────────────── */}
          {step === 'coach-team' && (
            <motion.div key="coach-team" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="overflow-hidden">
                <CardContent className="p-8">
                  <h2 className="font-display text-2xl font-semibold text-ink-800 mb-1">Set up your team</h2>
                  <p className="text-ink-500 text-sm mb-6">Create a new team or join an existing one with a code.</p>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mb-4 p-3 rounded-lg bg-coral-100 text-coral-700 flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">Create a new team</label>
                      <input
                        type="text"
                        value={teamName}
                        onChange={e => { setTeamName(e.target.value); setTeamCode(''); }}
                        placeholder="Team name"
                        className="w-full px-4 py-3 rounded-xl border-2 border-ink-200 focus:border-gold-400 focus:outline-none"
                        maxLength={50}
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-ink-200" />
                      <span className="text-sm text-ink-400">or join with code</span>
                      <div className="flex-1 h-px bg-ink-200" />
                    </div>

                    <input
                      type="text"
                      value={teamCode}
                      onChange={e => { setTeamCode(e.target.value.toUpperCase()); setTeamName(''); }}
                      placeholder="Join code"
                      className="w-full px-4 py-3 rounded-xl border-2 border-ink-200 focus:border-gold-400 focus:outline-none font-mono text-lg text-center tracking-widest uppercase"
                      maxLength={12}
                    />

                    <Button variant="gold" size="lg" className="w-full"
                      onClick={handleCoachTeam} disabled={(!teamName.trim() && !teamCode.trim()) || isLoading}>
                      {isLoading ? 'Setting up…' : 'Continue'}
                    </Button>

                    <button onClick={() => router.push('/coach')}
                      className="w-full text-center text-sm text-ink-400 hover:text-ink-600 transition-colors">
                      Skip — I'll set up a team later
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="w-12 h-12 border-4 border-ink-200 border-t-gold-500 rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
