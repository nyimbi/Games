'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { BuzzerBattle, QuickfireQuiz, GameProvider } from '@/components/games';
import { sessionsApi, type Session } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';

export default function PlaySessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionIdParam = params.sessionId as string;
  const sessionId = parseInt(sessionIdParam, 10);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (sessionIdParam && !isNaN(sessionId) && isAuthenticated) {
      loadSession();
    }
  }, [sessionIdParam, sessionId, isAuthenticated]);

  const loadSession = async () => {
    try {
      const response = await sessionsApi.get(sessionId);
      setSession(response.session);
    } catch (err) {
      console.error('Failed to load session:', err);
      setError('Session not found or you do not have access.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExit = () => {
    if (user?.role === 'coach') {
      router.push('/coach');
    } else {
      router.push('/team');
    }
  };

  const handleGameComplete = () => {
    if (session && currentGameIndex < session.games.length - 1) {
      setCurrentGameIndex(currentGameIndex + 1);
    } else {
      // All games complete
      handleExit();
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold-500 animate-spin mx-auto mb-4" />
          <p className="text-ink-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100 p-6">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="font-display text-2xl font-bold text-ink-800 mb-4">
              Session Not Found
            </h2>
            <p className="text-ink-600 mb-6">
              {error || 'This session does not exist or has ended.'}
            </p>
            <Button variant="primary" onClick={handleExit}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine which game component to render
  const currentGame = session.games[currentGameIndex];
  const isHost = user?.role === 'coach';

  const renderGame = () => {
    switch (currentGame) {
      case 'buzzer_battle':
        return (
          <BuzzerBattle
            sessionId={sessionIdParam}
            isHost={isHost}
            onExit={handleExit}
          />
        );

      case 'quickfire_quiz':
      case 'team_trivia_night':
      case 'category_challenge':
        return (
          <QuickfireQuiz
            sessionId={sessionIdParam}
            isHost={isHost}
            onExit={handleExit}
          />
        );

      // Add more game components as they're implemented
      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-cream-100 p-6">
            <Card className="max-w-md">
              <CardContent className="p-8 text-center">
                <h2 className="font-display text-2xl font-bold text-ink-800 mb-4">
                  Game Coming Soon
                </h2>
                <p className="text-ink-600 mb-6">
                  The game "{currentGame}" is not yet implemented.
                </p>
                <div className="flex gap-4">
                  {currentGameIndex < session.games.length - 1 && (
                    <Button
                      variant="gold"
                      onClick={() => setCurrentGameIndex(currentGameIndex + 1)}
                    >
                      Skip to Next
                    </Button>
                  )}
                  <Button variant="secondary" onClick={handleExit}>
                    Exit Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <GameProvider>
      {renderGame()}
    </GameProvider>
  );
}
