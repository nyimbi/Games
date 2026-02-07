'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  ArrowLeft,
  BookOpen,
  Users,
  AlertCircle,
  KeyRound,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button, Card, CardContent, Input, AvatarPicker, ScholarCodeCard, Avatar } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';
import { ApiError } from '@/lib/api/client';

type Step = 'entry' | 'recover' | 'role' | 'name' | 'avatar' | 'reveal' | 'team';
type Role = 'coach' | 'player';

const STEP_ORDER: Step[] = ['role', 'name', 'avatar', 'reveal', 'team'];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { join, recover, joinTeam, createTeam, isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [step, setStep] = useState<Step>('entry');
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('fox');
  const [scholarCode, setScholarCode] = useState('');
  const [revealedCode, setRevealedCode] = useState('');

  // Team step state
  const [teamAction, setTeamAction] = useState<'join' | 'create' | null>(null);
  const [teamInput, setTeamInput] = useState('');

  // Handle URL params
  useEffect(() => {
    const mode = searchParams.get('mode');
    const roleParam = searchParams.get('role');
    if (mode === 'recover') {
      setStep('recover');
    } else if (roleParam === 'coach' || roleParam === 'player') {
      setRole(roleParam);
      setStep('name');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (step !== 'reveal' && step !== 'team') {
        router.push(user.role === 'coach' ? '/coach' : '/team');
      }
    }
  }, [isAuthenticated, authLoading, user, router, step]);

  const formatScholarCode = (input: string) => {
    const cleaned = input.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
    // Auto-insert hyphen after letters if user types continuously
    if (cleaned.length > 0 && !cleaned.includes('-')) {
      const letters = cleaned.replace(/[0-9]/g, '');
      const digits = cleaned.replace(/[^0-9]/g, '');
      if (letters && digits) {
        return `${letters}-${digits}`;
      }
    }
    return cleaned;
  };

  const handleRecover = async () => {
    if (!scholarCode.trim()) {
      setError('Please enter your Scholar Code');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await recover(scholarCode.trim());
      // useEffect redirect will handle navigation
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.detail || 'Scholar Code not found. Check and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinPlatform = async () => {
    if (!displayName.trim() || !role) return;
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await join({
        display_name: displayName.trim(),
        role,
        avatar: selectedAvatar,
      });
      setRevealedCode(newUser.scholar_code || '');
      setStep('reveal');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.detail || 'Failed to join. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamAction = async () => {
    if (!teamInput.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      if (teamAction === 'join') {
        await joinTeam(teamInput.trim().toUpperCase());
      } else if (teamAction === 'create') {
        await createTeam(teamInput.trim());
      }
      router.push(role === 'coach' ? '/coach' : '/team');
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.data?.detail || '';
        if (err.status === 409) {
          setError('This team is full (max 5 scholars + 1 coach)');
        } else {
          setError(detail || 'Failed. Please try again.');
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === 'recover') { setStep('entry'); return; }
    if (step === 'role') { setStep('entry'); return; }
    if (step === 'name') { setStep('role'); setRole(null); return; }
    if (step === 'avatar') { setStep('name'); return; }
    if (step === 'team') {
      if (teamAction) { setTeamAction(null); setTeamInput(''); return; }
      setStep('reveal');
      return;
    }
    setStep('entry');
  };

  const stepIndex = STEP_ORDER.indexOf(step);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-ink-200 border-t-gold-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream-100 flex items-center justify-center px-6 py-12">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sage-200 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center w-16 h-16 bg-ink-800 rounded-2xl shadow-xl mb-4 hover:bg-ink-700 transition-colors"
          >
            <GraduationCap className="w-8 h-8 text-gold-400" />
          </button>
          <h1 className="font-display text-3xl font-bold text-ink-800">
            WSC Scholar Games
          </h1>
        </motion.div>

        {/* Progress Dots (for new user steps) */}
        {stepIndex >= 0 && step !== 'entry' && step !== 'recover' && (
          <div className="flex justify-center gap-2 mb-6">
            {STEP_ORDER.map((s, i) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  i <= stepIndex
                    ? 'w-6 bg-gold-500'
                    : 'w-2 bg-ink-200'
                }`}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Entry Step */}
          {step === 'entry' && (
            <motion.div
              key="entry"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-8">
                  <h2 className="font-display text-2xl font-semibold text-ink-800 text-center mb-6">
                    Welcome!
                  </h2>

                  <div className="space-y-4">
                    <button
                      onClick={() => setStep('role')}
                      className="w-full p-6 rounded-xl border-2 border-gold-200 bg-gold-50 hover:border-gold-400 hover:bg-gold-100 transition-all group text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gold-200 flex items-center justify-center group-hover:bg-gold-300 transition-colors">
                          <Sparkles className="w-7 h-7 text-gold-700" />
                        </div>
                        <div>
                          <h3 className="font-display text-xl font-semibold text-ink-800">
                            I'm New Here
                          </h3>
                          <p className="text-ink-600">
                            Create your scholar identity
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setStep('recover')}
                      className="w-full p-6 rounded-xl border-2 border-ink-200 bg-white hover:border-ink-400 hover:bg-ink-50 transition-all group text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-ink-200 flex items-center justify-center group-hover:bg-ink-300 transition-colors">
                          <KeyRound className="w-7 h-7 text-ink-700" />
                        </div>
                        <div>
                          <h3 className="font-display text-xl font-semibold text-ink-800">
                            Welcome Back
                          </h3>
                          <p className="text-ink-600">
                            Sign in with your Scholar Code
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Recover Step */}
          {step === 'recover' && (
            <motion.div
              key="recover"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-8">
                  <button
                    onClick={handleBack}
                    className="flex items-center text-ink-500 hover:text-ink-700 mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    <span className="text-sm">Back</span>
                  </button>

                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-ink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <KeyRound className="w-8 h-8 text-ink-600" />
                    </div>
                    <h2 className="font-display text-2xl font-semibold text-ink-800 mb-2">
                      Welcome Back!
                    </h2>
                    <p className="text-ink-600">
                      Enter your Scholar Code to sign in
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-lg bg-coral-100 text-coral-700 flex items-center gap-2"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={scholarCode}
                      onChange={(e) => setScholarCode(formatScholarCode(e.target.value))}
                      placeholder="FOX-1234"
                      className="w-full px-4 py-4 rounded-xl border border-ink-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none font-mono text-2xl text-center tracking-wider uppercase"
                      maxLength={15}
                      autoFocus
                    />
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={handleRecover}
                      disabled={!scholarCode.trim() || isLoading}
                    >
                      {isLoading ? 'Finding you...' : 'Sign In'}
                    </Button>
                  </div>

                  <p className="text-center text-sm text-ink-400 mt-4">
                    Example: PANDA-0291, OWL-7382
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Role Selection */}
          {step === 'role' && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-8">
                  <button
                    onClick={handleBack}
                    className="flex items-center text-ink-500 hover:text-ink-700 mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    <span className="text-sm">Back</span>
                  </button>

                  <h2 className="font-display text-2xl font-semibold text-ink-800 text-center mb-6">
                    Who are you?
                  </h2>

                  <div className="space-y-4">
                    <button
                      onClick={() => { setRole('coach'); setStep('name'); }}
                      className="w-full p-6 rounded-xl border-2 border-gold-200 bg-gold-50 hover:border-gold-400 hover:bg-gold-100 transition-all group text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gold-200 flex items-center justify-center group-hover:bg-gold-300 transition-colors">
                          <BookOpen className="w-7 h-7 text-gold-700" />
                        </div>
                        <div>
                          <h3 className="font-display text-xl font-semibold text-ink-800">
                            I'm a Coach
                          </h3>
                          <p className="text-ink-600">
                            Schedule sessions and track team progress
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setRole('player'); setStep('name'); }}
                      className="w-full p-6 rounded-xl border-2 border-ink-200 bg-white hover:border-ink-400 hover:bg-ink-50 transition-all group text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-ink-200 flex items-center justify-center group-hover:bg-ink-300 transition-colors">
                          <Users className="w-7 h-7 text-ink-700" />
                        </div>
                        <div>
                          <h3 className="font-display text-xl font-semibold text-ink-800">
                            I'm a Scholar
                          </h3>
                          <p className="text-ink-600">
                            Join games and practice with your team
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Name Step */}
          {step === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-8">
                  <button
                    onClick={handleBack}
                    className="flex items-center text-ink-500 hover:text-ink-700 mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    <span className="text-sm">Back</span>
                  </button>

                  <h2 className="font-display text-2xl font-semibold text-ink-800 mb-2">
                    What should we call you?
                  </h2>
                  <p className="text-ink-600 mb-6">
                    This is how you'll appear to your team
                  </p>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-lg bg-coral-100 text-coral-700 flex items-center gap-2"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </motion.div>
                  )}

                  <div className="space-y-5">
                    <Input
                      label="Your Name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                      required
                      autoFocus
                    />
                    <Button
                      variant={role === 'coach' ? 'gold' : 'primary'}
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        if (!displayName.trim()) {
                          setError('Please enter your name');
                          return;
                        }
                        setError(null);
                        setStep('avatar');
                      }}
                    >
                      Next
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Avatar Step */}
          {step === 'avatar' && (
            <motion.div
              key="avatar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-8">
                  <button
                    onClick={handleBack}
                    className="flex items-center text-ink-500 hover:text-ink-700 mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    <span className="text-sm">Back</span>
                  </button>

                  <div className="text-center mb-6">
                    <Avatar
                      name={displayName}
                      animal={selectedAvatar}
                      size="lg"
                      className="mx-auto mb-3"
                    />
                    <h2 className="font-display text-2xl font-semibold text-ink-800 mb-1">
                      Choose your avatar
                    </h2>
                    <p className="text-ink-600">
                      Pick an animal to represent you
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-lg bg-coral-100 text-coral-700 flex items-center gap-2"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </motion.div>
                  )}

                  <div className="mb-6">
                    <AvatarPicker
                      selected={selectedAvatar}
                      onSelect={setSelectedAvatar}
                    />
                  </div>

                  <Button
                    variant={role === 'coach' ? 'gold' : 'primary'}
                    size="lg"
                    className="w-full"
                    onClick={handleJoinPlatform}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating your identity...' : 'Create My Identity'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Reveal Step */}
          {step === 'reveal' && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
                    >
                      <Avatar
                        name={displayName}
                        animal={selectedAvatar}
                        size="lg"
                        className="mx-auto mb-4"
                      />
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="font-display text-2xl font-bold text-ink-800 mb-1"
                    >
                      Welcome, {displayName}!
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-ink-600"
                    >
                      Here's your Scholar Code — keep it safe!
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-6"
                  >
                    <ScholarCodeCard code={revealedCode} variant="full" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Button
                      variant={role === 'coach' ? 'gold' : 'primary'}
                      size="lg"
                      className="w-full"
                      onClick={() => setStep('team')}
                    >
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Team Step */}
          {step === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-8">
                  <button
                    onClick={handleBack}
                    className="flex items-center text-ink-500 hover:text-ink-700 mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    <span className="text-sm">Back</span>
                  </button>

                  <h2 className="font-display text-2xl font-semibold text-ink-800 text-center mb-6">
                    {role === 'coach' ? 'Set Up Your Team' : 'Join a Team'}
                  </h2>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-lg bg-coral-100 text-coral-700 flex items-center gap-2"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </motion.div>
                  )}

                  {!teamAction ? (
                    <div className="space-y-4">
                      {role === 'coach' ? (
                        <>
                          <button
                            onClick={() => setTeamAction('create')}
                            className="w-full p-5 rounded-xl border-2 border-gold-200 bg-gold-50 hover:border-gold-400 hover:bg-gold-100 transition-all text-left"
                          >
                            <h3 className="font-semibold text-ink-800">Create a Team</h3>
                            <p className="text-sm text-ink-600">
                              Get a join code to share with your scholars
                            </p>
                          </button>
                          <button
                            onClick={() => {
                              router.push('/coach');
                            }}
                            className="w-full p-4 text-center text-ink-500 hover:text-ink-700 transition-colors"
                          >
                            Skip for now
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setTeamAction('join')}
                            className="w-full p-5 rounded-xl border-2 border-ink-200 bg-white hover:border-gold-300 hover:bg-gold-50 transition-all text-left"
                          >
                            <h3 className="font-semibold text-ink-800">Join a Team</h3>
                            <p className="text-sm text-ink-600">
                              Enter the code your coach gave you
                            </p>
                          </button>
                          <button
                            onClick={() => {
                              router.push('/team');
                            }}
                            className="w-full p-4 text-center text-ink-500 hover:text-ink-700 transition-colors"
                          >
                            Skip for now
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teamAction === 'join' ? (
                        <>
                          <label className="block text-sm font-medium text-ink-700 mb-2">
                            Team Code
                          </label>
                          <input
                            type="text"
                            value={teamInput}
                            onChange={(e) => setTeamInput(e.target.value.toUpperCase())}
                            placeholder="Enter code"
                            className="w-full px-4 py-4 rounded-xl border border-ink-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none font-mono text-2xl text-center tracking-[0.3em] uppercase"
                            maxLength={8}
                            autoFocus
                          />
                        </>
                      ) : (
                        <>
                          <Input
                            label="Team Name"
                            type="text"
                            value={teamInput}
                            onChange={(e) => setTeamInput(e.target.value)}
                            placeholder="Enter team name"
                            autoFocus
                          />
                        </>
                      )}
                      <Button
                        variant="gold"
                        size="lg"
                        className="w-full"
                        onClick={handleTeamAction}
                        disabled={!teamInput.trim() || isLoading}
                      >
                        {isLoading
                          ? teamAction === 'join' ? 'Joining...' : 'Creating...'
                          : teamAction === 'join' ? 'Join Team' : 'Create Team'
                        }
                      </Button>
                    </div>
                  )}
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
