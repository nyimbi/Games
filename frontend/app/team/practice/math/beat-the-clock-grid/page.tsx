'use client';

import { PracticeGameLayout } from '@/components/practice';
import { useFactVault } from '@/lib/hooks/useVault';
import { AnimatePresence, motion } from 'motion/react';
import { Grid3x3, Target, Timer, Trophy, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

type RoundType = 1 | 2 | 3;

interface Round {
  type: RoundType;
  prompt: string;
  correctCells: Set<string>;
  totalNeeded: number;
  seconds: number;
  meta: { n?: number; p?: number; a?: number; b?: number };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRound(type: RoundType): Round {
  if (type === 1) {
    const n = pickRandom([3, 4, 6, 7, 8, 9, 11, 12]);
    const cells = new Set<string>();
    for (let c = 1; c <= 12; c++) cells.add(`${n},${c}`);
    for (let r = 1; r <= 12; r++) cells.add(`${r},${n}`);
    return {
      type,
      prompt: `Tap all products of ${n}`,
      correctCells: cells,
      totalNeeded: cells.size,
      seconds: 30,
      meta: { n },
    };
  }

  if (type === 2) {
    const candidates = [12, 18, 20, 24, 30, 36, 40, 48, 60, 72];
    const p = pickRandom(candidates);
    const cells = new Set<string>();
    for (let r = 1; r <= 12; r++) {
      for (let c = 1; c <= 12; c++) {
        if (r * c === p) cells.add(`${r},${c}`);
      }
    }
    return {
      type,
      prompt: `Tap all cells equal to ${p}`,
      correctCells: cells,
      totalNeeded: cells.size,
      seconds: 30,
      meta: { p },
    };
  }

  const a = pickRandom([6, 7, 8, 9, 10, 11, 12]);
  const b = pickRandom([6, 7, 8, 9, 10, 11, 12]);
  const cells = new Set<string>();
  cells.add(`${a},${b}`);
  if (a !== b) cells.add(`${b},${a}`);
  return {
    type,
    prompt: `Tap ${a} × ${b}`,
    correctCells: cells,
    totalNeeded: cells.size,
    seconds: 30,
    meta: { a, b },
  };
}

function generateRounds(): Round[] {
  const types: RoundType[] = shuffle([1, 1, 2, 2, 3]);
  return types.map(buildRound);
}

type Phase = 'intro' | 'playing' | 'round_end' | 'done';

interface CellState {
  correct: boolean;
  wrong: boolean;
}

export default function BeatTheClockGrid() {
  const router = useRouter();
  const { stats, recordAttempt } = useFactVault({ factType: 'mult', autoLoad: true });

  const [phase, setPhase] = useState<Phase>('intro');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [cellStates, setCellStates] = useState<Record<string, CellState>>({});
  const [tappedCorrect, setTappedCorrect] = useState<Set<string>>(new Set());
  const [roundScore, setRoundScore] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [bestRound, setBestRound] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundStartMs = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const endRound = useCallback(
    (found: number, timeBonus: number, roundPts: number) => {
      clearTimer();
      const finalRoundScore = Math.max(0, roundPts + timeBonus);
      setRoundScore(finalRoundScore);
      setFoundCount(found);
      setBestRound((prev) => Math.max(prev, finalRoundScore));
      setRoundScores((prev) => [...prev, finalRoundScore]);
      setPhase('round_end');
    },
    [clearTimer]
  );

  const startRound = useCallback(
    (idx: number, roundList: Round[]) => {
      const round = roundList[idx];
      setTimeLeft(round.seconds);
      setCellStates({});
      setTappedCorrect(new Set());
      setRoundScore(0);
      setFoundCount(0);
      roundStartMs.current = Date.now();
      setPhase('playing');

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            setPhase((ph) => {
              if (ph === 'playing') {
                setFoundCount((fc) => {
                  setRoundScore((rs) => {
                    const finalScore = Math.max(0, rs);
                    setBestRound((br) => Math.max(br, finalScore));
                    setRoundScores((rss) => [...rss, finalScore]);
                    return finalScore;
                  });
                  return fc;
                });
                return 'round_end';
              }
              return ph;
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer]
  );

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const handleStart = useCallback(() => {
    const newRounds = generateRounds();
    setRounds(newRounds);
    setRoundIdx(0);
    setScore(0);
    setBestRound(0);
    setRoundScores([]);
    startRound(0, newRounds);
  }, [startRound]);

  const handleCellTap = useCallback(
    (r: number, c: number) => {
      if (phase !== 'playing') return;
      const key = `${r},${c}`;
      const round = rounds[roundIdx];
      if (!round) return;

      const isCorrect = round.correctCells.has(key);
      const alreadyTapped = tappedCorrect.has(key);

      if (isCorrect && alreadyTapped) return;

      const tapMs = Date.now() - roundStartMs.current;

      if (isCorrect) {
        const newTapped = new Set(tappedCorrect).add(key);
        setTappedCorrect(newTapped);
        setCellStates((prev) => ({ ...prev, [key]: { correct: true, wrong: false } }));
        setScore((s) => s + 5);
        setRoundScore((rs) => rs + 5);
        setFoundCount((fc) => fc + 1);

        void recordAttempt({
          fact_id: `mult_${r}x${c}`,
          fact_type: 'mult',
          operands: [r, c],
          answer: String(r * c),
          game_id: 'clock_grid',
          correct: true,
          ms: tapMs,
        });

        if (newTapped.size === round.correctCells.size) {
          const secsLeft = timeLeft;
          const timeBonus = secsLeft * 2;
          setScore((s) => s + timeBonus);
          endRound(newTapped.size, timeBonus, 5 * newTapped.size);
        }
      } else {
        setCellStates((prev) => ({ ...prev, [key]: { correct: false, wrong: true } }));
        setScore((s) => Math.max(0, s - 2));
        setRoundScore((rs) => Math.max(0, rs - 2));
        setTimeout(() => {
          setCellStates((prev) => {
            const next = { ...prev };
            if (next[key]?.wrong && !next[key]?.correct) delete next[key];
            return next;
          });
        }, 400);
      }
    },
    [phase, rounds, roundIdx, tappedCorrect, timeLeft, endRound, recordAttempt]
  );

  useEffect(() => {
    if (phase !== 'round_end') return;
    const t = setTimeout(() => {
      const nextIdx = roundIdx + 1;
      if (nextIdx >= rounds.length) {
        setPhase('done');
      } else {
        setRoundIdx(nextIdx);
        startRound(nextIdx, rounds);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [phase, roundIdx, rounds, startRound]);

  const round = rounds[roundIdx];
  const found = tappedCorrect.size;
  const needed = round?.totalNeeded ?? 0;
  const timerUrgent = timeLeft <= 5 && phase === 'playing';

  return (
    <PracticeGameLayout
      title="Beat-the-Clock Grid"
      subtitle={
        phase === 'playing' && round
          ? `Round ${roundIdx + 1} of ${rounds.length}`
          : undefined
      }
      onBack={() => router.push('/team/practice/math')}
      mastery={{ sticky: stats.sticky, learning: stats.learning, mastered: stats.mastered }}
      rightBadge={
        phase !== 'intro' && phase !== 'done' ? (
          <span className="font-display font-bold text-lg text-gold-600">{score}</span>
        ) : undefined
      }
    >
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            <Grid3x3 className="w-16 h-16 text-gold-500" />
            <h2 className="font-display font-bold text-3xl text-ink-800 text-center">
              Beat-the-Clock Grid
            </h2>
            <div className="bg-white rounded-2xl border border-ink-100 p-5 max-w-sm w-full space-y-3 text-ink-700">
              <p className="flex gap-2"><Target className="w-5 h-5 text-coral-500 shrink-0 mt-0.5" /><span>Tap all cells matching the target on the times-table grid.</span></p>
              <p className="flex gap-2"><Zap className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" /><span>+5 each correct tap. Finish early for a time bonus!</span></p>
              <p className="flex gap-2"><Timer className="w-5 h-5 text-coral-500 shrink-0 mt-0.5" /><span>Wrong taps cost 2 points. 30 seconds per round.</span></p>
            </div>
            <button
              onClick={handleStart}
              className="bg-gold-400 hover:bg-gold-500 active:scale-95 text-ink-900 font-display font-bold text-xl px-10 py-4 rounded-2xl shadow-md transition-all"
            >
              Start!
            </button>
          </motion.div>
        )}

        {(phase === 'playing' || phase === 'round_end') && round && (
          <motion.div
            key={`playing-${roundIdx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            {/* Timer + prompt row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 bg-white rounded-xl border border-ink-100 px-4 py-2">
                <p className="font-display font-bold text-lg text-ink-800 leading-tight">
                  {round.prompt}
                </p>
              </div>
              <div className={`flex items-center gap-1 font-display font-bold text-2xl px-3 py-2 rounded-xl border transition-all ${timerUrgent ? 'text-coral-600 border-coral-300 bg-coral-50 animate-pulse' : 'text-ink-700 border-ink-100 bg-white'}`}>
                <Timer className="w-5 h-5" />
                {timeLeft}
              </div>
            </div>

            {/* Progress pill */}
            <div className="flex justify-end">
              <span className="bg-sage-100 text-sage-800 font-display font-bold text-sm px-3 py-1 rounded-full border border-sage-300">
                {found} / {needed}
              </span>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto">
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(13, minmax(24px, 1fr))', gap: '2px' }}
                className="min-w-[340px]"
              >
                {/* Top-left corner */}
                <div className="w-full aspect-square" />
                {/* Column headers */}
                {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
                  <div
                    key={`ch-${c}`}
                    className="bg-ink-100 text-ink-700 font-display font-bold text-[10px] flex items-center justify-center aspect-square rounded-sm"
                  >
                    {c}
                  </div>
                ))}

                {Array.from({ length: 12 }, (_, ri) => ri + 1).map((r) => (
                  <>
                    {/* Row header */}
                    <div
                      key={`rh-${r}`}
                      className="bg-ink-100 text-ink-700 font-display font-bold text-[10px] flex items-center justify-center aspect-square rounded-sm"
                    >
                      {r}
                    </div>
                    {/* Body cells */}
                    {Array.from({ length: 12 }, (_, ci) => ci + 1).map((c) => {
                      const key = `${r},${c}`;
                      const cs = cellStates[key];
                      const product = r * c;
                      return (
                        <button
                          key={key}
                          onClick={() => handleCellTap(r, c)}
                          disabled={phase === 'round_end'}
                          className={`
                            aspect-square font-display text-[10px] flex items-center justify-center rounded-sm border transition-all active:scale-90
                            ${cs?.correct
                              ? 'bg-sage-200 border-sage-500 text-sage-900'
                              : cs?.wrong
                                ? 'bg-coral-200 border-coral-500 text-coral-900 animate-pulse'
                                : 'bg-white border-ink-100 text-ink-700 hover:border-gold-400 hover:bg-gold-50'
                            }
                          `}
                        >
                          {product}
                        </button>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>

            {/* Round end overlay */}
            <AnimatePresence>
              {phase === 'round_end' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 flex items-center justify-center z-50 bg-ink-900/30"
                >
                  <div className="bg-white rounded-3xl border border-ink-100 shadow-xl px-8 py-6 text-center">
                    {timeLeft === 0 ? (
                      <>
                        <p className="font-display font-bold text-2xl text-ink-800">Time&apos;s up!</p>
                        <p className="text-ink-600 mt-1">Found {found} of {needed}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-display font-bold text-4xl text-gold-600">+{roundScore}</p>
                        <p className="text-ink-600 mt-1">All found!</p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            <Trophy className="w-16 h-16 text-gold-500" />
            <h2 className="font-display font-bold text-3xl text-ink-800">Done!</h2>
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-xs w-full space-y-3">
              <div className="flex justify-between text-ink-700">
                <span>Total score</span>
                <span className="font-display font-bold text-gold-600 text-xl">{score}</span>
              </div>
              <div className="flex justify-between text-ink-700">
                <span>Best round</span>
                <span className="font-display font-bold text-sage-700">{bestRound}</span>
              </div>
              <div className="border-t border-ink-100 pt-3 space-y-1">
                {roundScores.map((rs, i) => (
                  <div key={i} className="flex justify-between text-sm text-ink-500">
                    <span>Round {i + 1}</span>
                    <span>{rs} pts</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={handleStart}
                className="bg-gold-400 hover:bg-gold-500 active:scale-95 text-ink-900 font-display font-bold text-lg px-8 py-3 rounded-2xl shadow transition-all"
              >
                Play Again
              </button>
              <button
                onClick={() => router.push('/team/practice/math')}
                className="bg-white border border-ink-200 hover:bg-ink-50 active:scale-95 text-ink-700 font-display font-bold text-lg px-8 py-3 rounded-2xl shadow transition-all"
              >
                Back to Math
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PracticeGameLayout>
  );
}
