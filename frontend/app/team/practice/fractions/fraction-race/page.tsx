'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, MoveHorizontal, Trophy, Bot } from 'lucide-react';
import { PracticeGameLayout } from '@/components/practice';
import { useFactVault } from '@/lib/hooks/useVault';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface Fraction { n: number; d: number }

const POOL: Fraction[] = [
  { n: 1, d: 2 }, { n: 1, d: 4 }, { n: 3, d: 4 },
  { n: 1, d: 3 }, { n: 2, d: 3 },
  { n: 1, d: 5 }, { n: 2, d: 5 }, { n: 3, d: 5 }, { n: 4, d: 5 },
  { n: 3, d: 8 }, { n: 5, d: 8 }, { n: 7, d: 8 },
  { n: 1, d: 6 }, { n: 5, d: 6 },
  { n: 1, d: 10 }, { n: 7, d: 10 },
];

const TOTAL_ROUNDS = 10;
const BOT_ACCURACY = 0.6;
const TOLERANCE = 0.03;
const SLOW_MS = 15_000;
const REVEAL_MS = 1200;
// SVG coord math: track spans x 2..98 in a 100-wide viewBox
const TRACK_LEFT = 2;
const TRACK_WIDTH = 96;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickCards(): Fraction[] {
  return shuffle(POOL).slice(0, TOTAL_ROUNDS);
}

function toX(pos: number) {
  return TRACK_LEFT + pos * TRACK_WIDTH;
}

type Phase = 'intro' | 'playing' | 'reveal' | 'done';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FractionRacePage() {
  const router = useRouter();
  const { stats, recordAttempt } = useFactVault({ factType: 'frac_eq', autoLoad: true });

  const [cards] = useState<Fraction[]>(pickCards);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');

  const [kidPos, setKidPos] = useState(0);
  const [botPos, setBotPos] = useState(0);
  const [draft, setDraft] = useState<number | null>(null);
  const [revealCorrect, setRevealCorrect] = useState<number | null>(null);

  const roundStartMs = useRef<number>(0);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const card = cards[round] ?? cards[0];

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  // Start slow timer when a new playing round begins
  useEffect(() => {
    if (phase !== 'playing') return;
    roundStartMs.current = Date.now();
    setDraft(null);
    setRevealCorrect(null);

    slowTimerRef.current = setTimeout(() => {
      // Kid was too slow — bot advances, kid stays
      setBotPos(p => Math.min(1, p + (Math.random() < BOT_ACCURACY ? 0.1 : 0)));
      // Don't record attempt — just advance to reveal without judging kid
      const correct = card.n / card.d;
      setRevealCorrect(correct);
      setPhase('reveal');
    }, SLOW_MS);

    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round]);

  // Auto-advance after reveal
  useEffect(() => {
    if (phase !== 'reveal') return;
    revealTimerRef.current = setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= TOTAL_ROUNDS || kidPos >= 1 || botPos >= 1) {
        setPhase('done');
      } else {
        setRound(nextRound);
        setPhase('playing');
      }
    }, REVEAL_MS);
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, [phase, round, kidPos, botPos]);

  // Handle tap on SVG
  const handleTap = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (phase !== 'playing') return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / rect.width; // 0..1 of element width
    // Map to SVG coords then normalize to 0..1 of the track
    const svgX = rawX * 100;
    const pos = Math.max(0, Math.min(1, (svgX - TRACK_LEFT) / TRACK_WIDTH));
    setDraft(pos);
  }, [phase]);

  const handleTouchTap = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (phase !== 'playing') return;
    const touch = e.changedTouches[0];
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const rawX = (touch.clientX - rect.left) / rect.width;
    const svgX = rawX * 100;
    const pos = Math.max(0, Math.min(1, (svgX - TRACK_LEFT) / TRACK_WIDTH));
    setDraft(pos);
  }, [phase]);

  const handleLockIn = useCallback(() => {
    if (draft === null || phase !== 'playing') return;
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);

    const ms = Date.now() - roundStartMs.current;
    const correct = card.n / card.d;
    const withinTolerance = Math.abs(draft - correct) <= TOLERANCE;

    // Kid advances if correct
    if (withinTolerance) setKidPos(p => Math.min(1, p + 0.1));
    // Bot rolls independently
    const botAdvances = Math.random() < BOT_ACCURACY;
    if (botAdvances) setBotPos(p => Math.min(1, p + 0.1));

    void recordAttempt({
      fact_id: `frac_pos_${card.n}/${card.d}`,
      fact_type: 'frac_eq',
      operands: [`${card.n}/${card.d}`, `${card.n}/${card.d}`],
      answer: 'true',
      game_id: 'fraction_race',
      correct: withinTolerance,
      ms,
    });

    setRevealCorrect(correct);
    setPhase('reveal');
  }, [draft, phase, card, recordAttempt]);

  const handleRestart = useCallback(() => {
    setRound(0);
    setKidPos(0);
    setBotPos(0);
    setDraft(null);
    setRevealCorrect(null);
    setPhase('intro');
  }, []);

  const winner =
    kidPos >= 1 && botPos >= 1 ? 'tie'
    : kidPos >= 1 ? 'kid'
    : botPos >= 1 ? 'bot'
    : kidPos > botPos ? 'kid'
    : botPos > kidPos ? 'bot'
    : 'tie';

  return (
    <PracticeGameLayout
      title="Fraction Race"
      subtitle={phase === 'playing' || phase === 'reveal' ? `Round ${round + 1} of ${TOTAL_ROUNDS}` : undefined}
      onBack={() => router.push('/team/practice/fractions')}
      mastery={{ sticky: stats.sticky, learning: stats.learning, mastered: stats.mastered }}
      rightBadge={
        <div className="flex items-center gap-2 font-display font-bold text-sm">
          <span className="text-gold-600">You {Math.round(kidPos * 100)}%</span>
          <span className="text-ink-400">·</span>
          <span className="text-ink-600">Bot {Math.round(botPos * 100)}%</span>
        </div>
      }
    >
      <AnimatePresence mode="wait">

        {/* ---------------------------------------------------------------- */}
        {/* INTRO                                                             */}
        {/* ---------------------------------------------------------------- */}
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center gap-8 pt-8"
          >
            <div className="text-6xl">🦊</div>
            <div className="bg-white rounded-3xl shadow-sm border border-ink-100 p-6 max-w-sm text-center space-y-3">
              <h2 className="font-display font-bold text-2xl text-ink-800">How to play</h2>
              <p className="text-ink-600 text-base leading-relaxed">
                A fraction appears. Tap the number line where you think it goes, then hit{' '}
                <strong>Lock In</strong>.
              </p>
              <p className="text-ink-500 text-sm">
                Beat the bot to the finish line. First to 100% wins!
              </p>
              <div className="flex justify-center gap-6 pt-2 text-sm text-ink-500">
                <span>🦊 You</span>
                <span>🤖 Bot</span>
              </div>
            </div>
            <button
              onClick={() => setPhase('playing')}
              className="min-h-14 px-10 py-4 bg-gold-500 hover:bg-gold-600 active:scale-95 text-white font-display font-bold text-xl rounded-2xl shadow-md transition-all"
            >
              Start Race
            </button>
          </motion.div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* PLAYING + REVEAL                                                  */}
        {/* ---------------------------------------------------------------- */}
        {(phase === 'playing' || phase === 'reveal') && (
          <motion.div
            key={`round-${round}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Prompt card */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-ink-500 text-sm font-medium uppercase tracking-wide">Where does this go?</p>
              <div className="bg-white rounded-3xl shadow border border-ink-100 px-10 py-6 flex flex-col items-center">
                <span className="font-display font-bold text-5xl text-ink-800 leading-none">
                  {card.n}
                </span>
                <div className="w-10 h-0.5 bg-ink-700 my-1" />
                <span className="font-display font-bold text-5xl text-ink-800 leading-none">
                  {card.d}
                </span>
              </div>
              {phase === 'reveal' && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm font-semibold ${
                    revealCorrect !== null && draft !== null && Math.abs(draft - revealCorrect) <= TOLERANCE
                      ? 'text-sage-600'
                      : 'text-coral-600'
                  }`}
                >
                  {revealCorrect !== null && draft !== null && Math.abs(draft - revealCorrect) <= TOLERANCE
                    ? '✓ Correct!'
                    : `Correct position: ${card.n}/${card.d} = ${(card.n / card.d).toFixed(2)}`}
                </motion.p>
              )}
            </div>

            {/* Number line */}
            <div className="bg-white rounded-3xl border border-ink-100 shadow-sm p-4">
              <svg
                viewBox="0 0 100 20"
                className="w-full h-24 cursor-crosshair select-none touch-none"
                onClick={handleTap}
                onTouchEnd={handleTouchTap}
              >
                {/* Main track line */}
                <line x1={2} y1={10} x2={98} y2={10} stroke="#334e68" strokeWidth={0.8} strokeLinecap="round" />
                {/* End ticks */}
                <line x1={2} y1={7} x2={2} y2={13} stroke="#334e68" strokeWidth={0.8} />
                <line x1={98} y1={7} x2={98} y2={13} stroke="#334e68" strokeWidth={0.8} />
                {/* Labels */}
                <text x={2} y={19} fontSize={2.5} textAnchor="middle" fill="#486581">0</text>
                <text x={98} y={19} fontSize={2.5} textAnchor="middle" fill="#486581">1</text>
                {/* Faint anchor ticks */}
                {[0.25, 0.5, 0.75].map(p => (
                  <line
                    key={p}
                    x1={toX(p)} y1={9} x2={toX(p)} y2={11}
                    stroke="#bcccdc" strokeWidth={0.4}
                  />
                ))}
                {/* Kid racer (top lane) */}
                <motion.g animate={{ x: toX(kidPos) - 2 }}>
                  <text x={0} y={5.5} fontSize={4} textAnchor="middle">🦊</text>
                </motion.g>
                {/* Bot racer (bottom lane) */}
                <motion.g animate={{ x: toX(botPos) - 2 }}>
                  <text x={0} y={17.5} fontSize={4} textAnchor="middle">🤖</text>
                </motion.g>
                {/* Draft marker */}
                {draft !== null && (
                  <line
                    x1={toX(draft)} y1={4} x2={toX(draft)} y2={16}
                    stroke="#d4a547" strokeWidth={0.6} strokeDasharray="1,1"
                  />
                )}
                {/* Reveal correct pin */}
                {revealCorrect !== null && (
                  <motion.circle
                    initial={{ r: 0 }}
                    animate={{ r: 1.5 }}
                    cx={toX(revealCorrect)} cy={10} r={1.5} fill="#6b9080"
                  />
                )}
              </svg>
              <div className="flex justify-between text-xs text-ink-400 mt-1 px-1">
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-gold-400" /> You</span>
                <span className="flex items-center gap-1 flex-row-reverse"><span className="inline-block w-2 h-2 rounded-full bg-ink-400" /> Bot</span>
              </div>
            </div>

            {/* Lock In button */}
            {phase === 'playing' && (
              <div className="flex flex-col items-center gap-3">
                {draft === null ? (
                  <p className="flex items-center gap-2 text-ink-500 text-sm">
                    <MoveHorizontal className="w-4 h-4" />
                    Tap the line to place your marker
                  </p>
                ) : (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={handleLockIn}
                    className="min-h-14 px-12 py-4 bg-gold-500 hover:bg-gold-600 active:scale-95 text-white font-display font-bold text-xl rounded-2xl shadow-md transition-all w-full max-w-xs"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Lock In
                    </span>
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* DONE                                                              */}
        {/* ---------------------------------------------------------------- */}
        {phase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 pt-6"
          >
            <div className="text-6xl">
              {winner === 'kid' ? '🏆' : winner === 'bot' ? '🤖' : '🤝'}
            </div>
            <div className="bg-white rounded-3xl shadow border border-ink-100 px-8 py-6 text-center space-y-2 w-full max-w-sm">
              <h2 className="font-display font-bold text-2xl text-ink-800 flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-gold-500" />
                {winner === 'kid' ? 'You won!' : winner === 'bot' ? 'Bot wins' : "It's a tie!"}
              </h2>
              <div className="flex justify-around pt-3">
                <div className="text-center">
                  <p className="text-3xl font-display font-bold text-gold-600">{Math.round(kidPos * 100)}%</p>
                  <p className="text-xs text-ink-500 mt-0.5">🦊 You</p>
                </div>
                <div className="w-px bg-ink-100" />
                <div className="text-center">
                  <p className="text-3xl font-display font-bold text-ink-500">{Math.round(botPos * 100)}%</p>
                  <p className="text-xs text-ink-500 mt-0.5 flex items-center gap-1">
                    <Bot className="w-3 h-3" /> Bot
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={handleRestart}
                className="min-h-14 px-8 py-4 bg-gold-500 hover:bg-gold-600 active:scale-95 text-white font-display font-bold text-lg rounded-2xl shadow-md transition-all"
              >
                Play Again
              </button>
              <button
                onClick={() => router.push('/team/practice/fractions')}
                className="min-h-14 px-8 py-4 bg-white border-2 border-ink-200 hover:border-ink-300 active:scale-95 text-ink-700 font-display font-bold text-lg rounded-2xl transition-all"
              >
                Back
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </PracticeGameLayout>
  );
}
