'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, CheckCircle2, XCircle } from 'lucide-react';
import { PracticeGameLayout } from '@/components/practice';
import { vaultApi, OddOneOutSet } from '@/lib/api/vault';
import { useWordVault } from '@/lib/hooks/useVault';

type Phase = 'loading' | 'playing' | 'wrong_1' | 'reveal' | 'done';

const TOTAL_ROUNDS = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function OddOneOutPage() {
  const router = useRouter();
  const { stats, recordEncounter } = useWordVault({ autoLoad: true });

  const [sets, setSets] = useState<OddOneOutSet[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [firstTryCount, setFirstTryCount] = useState(0);
  const [tappedWord, setTappedWord] = useState<string | null>(null);
  const [kidPickedOdd, setKidPickedOdd] = useState(false);
  const roundStartMs = useRef<number>(Date.now());

  const currentSet = sets[round] ?? null;

  useEffect(() => {
    vaultApi
      .getOddOneOutSets({ level: 1 })
      .then((res) => {
        const picked = shuffle(res.sets).slice(0, TOTAL_ROUNDS);
        if (picked.length === 0) {
          setLoadError('No sets available. Please try again later.');
          return;
        }
        setSets(picked);
        setPhase('playing');
        roundStartMs.current = Date.now();
      })
      .catch(() => setLoadError('Failed to load game data. Please go back and try again.'));
  }, []);

  useEffect(() => {
    if (phase === 'playing') {
      roundStartMs.current = Date.now();
      setTappedWord(null);
    }
  }, [phase, round]);

  function handleTap(word: string) {
    if (phase !== 'playing' && phase !== 'wrong_1') return;
    if (!currentSet) return;

    const correct = word === currentSet.odd;
    const elapsed = Date.now() - roundStartMs.current;
    setTappedWord(word);

    if (correct) {
      const isFirstTry = phase === 'playing';
      const timeBonus = elapsed < 5000 ? 5 : 0;
      const points = isFirstTry ? 10 + timeBonus : 5 + timeBonus;
      setScore((s) => s + points);
      if (isFirstTry) setFirstTryCount((c) => c + 1);
      setKidPickedOdd(true);
      for (const w of currentSet.words) {
        void recordEncounter({ word: w, game_id: 'odd_one_out', mode: 'network', correct: true, ms: elapsed });
      }
      setPhase('reveal');
    } else {
      if (phase === 'playing') {
        setPhase('wrong_1');
      } else {
        setScore((s) => s - 1);
        setKidPickedOdd(false);
        for (const w of currentSet.words) {
          void recordEncounter({ word: w, game_id: 'odd_one_out', mode: 'network', correct: false, ms: elapsed });
        }
        setPhase('reveal');
      }
    }
  }

  function handleNext() {
    const nextRound = round + 1;
    if (nextRound >= sets.length) {
      setPhase('done');
    } else {
      setRound(nextRound);
      setPhase('playing');
    }
  }

  function handleRestart() {
    const repicked = shuffle(sets).slice(0, TOTAL_ROUNDS);
    setSets(repicked);
    setRound(0);
    setScore(0);
    setFirstTryCount(0);
    setKidPickedOdd(false);
    setTappedWord(null);
    setPhase('playing');
  }

  function cardStyle(word: string): string {
    const base =
      'min-h-[100px] rounded-3xl border-2 bg-white font-display font-bold text-2xl md:text-3xl text-ink-800 flex items-center justify-center px-4 shadow-sm transition-all select-none';

    if (phase === 'reveal') {
      if (word === currentSet?.odd) return `${base} bg-sage-100 border-sage-400 scale-[1.03]`;
      return `${base} border-ink-200 opacity-60`;
    }
    if ((phase === 'wrong_1') && word === tappedWord) {
      return `${base} bg-coral-100 border-coral-400`;
    }
    return `${base} border-ink-200 hover:border-gold-400 active:scale-[0.98] cursor-pointer`;
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
        <XCircle className="w-12 h-12 text-coral-500" />
        <p className="text-ink-700 font-medium">{loadError}</p>
        <button
          onClick={() => router.push('/team/practice/vocabulary')}
          className="px-6 py-3 rounded-2xl bg-ink-100 text-ink-800 font-semibold hover:bg-ink-200 transition-colors"
        >
          Back
        </button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-4 border-gold-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center">
        <Trophy className="w-16 h-16 text-gold-500" />
        <h1 className="font-display font-bold text-3xl text-ink-900">All done!</h1>
        <div className="bg-cream-50 border-2 border-cream-200 rounded-3xl p-6 w-full max-w-sm flex flex-col gap-3">
          <p className="text-ink-600">
            Score: <span className="font-display font-bold text-2xl text-gold-600">{score}</span>
          </p>
          <p className="text-ink-600">
            First-try correct:{' '}
            <span className="font-bold text-sage-700">
              {firstTryCount} / {sets.length}
            </span>
          </p>
          <p className="text-ink-600">
            Words seen: <span className="font-bold">{sets.length * 4}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRestart}
            className="px-6 py-3 rounded-2xl bg-gold-500 text-white font-semibold hover:bg-gold-600 transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={() => router.push('/team/practice/vocabulary')}
            className="px-6 py-3 rounded-2xl bg-ink-100 text-ink-800 font-semibold hover:bg-ink-200 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <PracticeGameLayout
      title="Odd One Out"
      subtitle={`Round ${round + 1} of ${sets.length}`}
      onBack={() => router.push('/team/practice/vocabulary')}
      mastery={{ mastered: stats.mastered, sticky: stats.sticky }}
      rightBadge={
        <span className="font-display font-bold text-lg text-gold-600">{score}</span>
      }
    >
      <div className="flex flex-col gap-6 w-full max-w-md mx-auto pt-4">
        <p className="text-center text-ink-700 font-medium text-lg">
          Which word doesn&apos;t belong?
        </p>

        {currentSet && (
          <div className="grid grid-cols-2 gap-3">
            {currentSet.words.map((word) => (
              <motion.button
                key={word}
                className={cardStyle(word)}
                onClick={() => handleTap(word)}
                disabled={phase === 'reveal'}
                animate={
                  phase === 'wrong_1' && word === tappedWord
                    ? { x: [0, -8, 8, -6, 6, 0] }
                    : phase === 'reveal' && word === currentSet.odd
                    ? { scale: 1.03 }
                    : {}
                }
                transition={{ duration: 0.35 }}
              >
                {word}
              </motion.button>
            ))}
          </div>
        )}

        <AnimatePresence>
          {phase === 'wrong_1' && (
            <motion.p
              key="try-again"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-coral-600 font-medium"
            >
              Not quite — try again!
            </motion.p>
          )}

          {phase === 'reveal' && currentSet && (
            <motion.div
              key="reason"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 bg-sage-50 border-2 border-sage-200 rounded-2xl p-4"
            >
              <p className="font-medium text-sage-800">
                <span className="font-bold">{currentSet.odd}</span> is the odd one out —{' '}
                {currentSet.reason}.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'reveal' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gold-500 text-white font-semibold hover:bg-gold-600 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" />
              {round + 1 >= sets.length ? 'See Results' : 'Next Round'}
            </button>
          </motion.div>
        )}
      </div>
    </PracticeGameLayout>
  );
}
