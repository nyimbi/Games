'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ArrowLeft, BookOpen, Users, AlertCircle } from 'lucide-react';
import { Button, Card, CardContent, Input } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';
import { ApiError } from '@/lib/api/client';

type AuthMode = 'select' | 'join';
type Role = 'coach' | 'player';

const AVATAR_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#A855F7',
  '#EC4899', '#F43F5E',
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { join, isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [mode, setMode] = useState<AuthMode>('select');
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state - simplified, just name and color
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  // Handle role from URL param
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'coach' || roleParam === 'player') {
      setRole(roleParam);
      setMode('join');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'coach') {
        router.push('/coach');
      } else {
        router.push('/team');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    setMode('join');
    setError(null);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!role) {
      setError('Please select a role');
      return;
    }

    setIsLoading(true);

    try {
      await join({
        display_name: displayName.trim(),
        role,
        avatar_color: avatarColor,
      });
      // Redirect happens in useEffect
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.detail || 'Failed to join. Please try again.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setMode('select');
    setRole(null);
    setError(null);
  };

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

        <AnimatePresence mode="wait">
          {/* Role Selection */}
          {mode === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-8">
                  <h2 className="font-display text-2xl font-semibold text-ink-800 text-center mb-6">
                    Who are you?
                  </h2>

                  <div className="space-y-4">
                    <button
                      onClick={() => handleRoleSelect('coach')}
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
                      onClick={() => handleRoleSelect('player')}
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

          {/* Join Form */}
          {mode === 'join' && (
            <motion.div
              key="join"
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
                    Welcome, {role === 'coach' ? 'Coach' : 'Scholar'}!
                  </h2>
                  <p className="text-ink-600 mb-6">
                    Enter your name to get started
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

                  <form onSubmit={handleJoin} className="space-y-5">
                    <Input
                      label="Your Name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                      required
                      autoFocus
                    />

                    {/* Avatar Color Picker */}
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-2">
                        Choose your color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {AVATAR_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setAvatarColor(color)}
                            className={`w-9 h-9 rounded-full transition-transform ${
                              avatarColor === color
                                ? 'ring-2 ring-offset-2 ring-ink-800 scale-110'
                                : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant={role === 'coach' ? 'gold' : 'primary'}
                      size="lg"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Joining...' : 'Join'}
                    </Button>
                  </form>
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
