'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Users, ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';
import { ApiError } from '@/lib/api/client';

function JoinTeamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { joinTeam, team, isAuthenticated, isLoading: authLoading } = useAuth();

  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setJoinCode(code.toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    // If already has team, redirect
    if (!authLoading && team) {
      router.push('/team');
    }
  }, [team, authLoading, router]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    setError(null);

    try {
      await joinTeam(joinCode.trim());
      setSuccess(true);
      setTimeout(() => {
        router.push('/team');
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.detail || 'Invalid team code');
      } else {
        setError('Failed to join team. Please try again.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-ink-200 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-sage-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
            You're in!
          </h2>
          <p className="text-ink-600">Taking you to your team hub...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center text-ink-500 hover:text-ink-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="text-sm">Back</span>
          </button>

          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gold-600" />
                </div>
                <h1 className="font-display text-2xl font-bold text-ink-800 mb-2">
                  Join a Team
                </h1>
                <p className="text-ink-600">
                  Enter the code your coach gave you
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

              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Team Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="w-full px-4 py-4 rounded-xl border border-ink-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none font-mono text-2xl text-center tracking-[0.3em] uppercase"
                    maxLength={8}
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  className="w-full"
                  disabled={!joinCode.trim() || isJoining}
                >
                  {isJoining ? 'Joining...' : 'Join Team'}
                </Button>
              </form>

              <p className="text-center text-sm text-ink-500 mt-6">
                Don't have a code? Ask your coach or parent for the team join code.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function JoinTeamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-ink-200 border-t-gold-500 rounded-full animate-spin" />
      </div>
    }>
      <JoinTeamContent />
    </Suspense>
  );
}
