'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Pizza, CheckCircle2, XCircle, Trophy, Loader2 } from 'lucide-react';
import { useFactVault } from '@/lib/hooks/useVault';
import { vaultApi, FactCatalogItem } from '@/lib/api/vault';
import { PracticeGameLayout, PracticeAnswerButton } from '@/components/practice';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type Phase = 'loading' | 'playing' | 'reveal' | 'done';
type CmpAnswer = '<' | '=' | '>';

interface SliceRound {
  kind: 'slice';
  num: number;
  den: number;
}

interface CmpRound {
  kind: 'cmp';
  aNum: number;
  aDen: number;
  bNum: number;
  bDen: number;
  answer: CmpAnswer;
}

type Round = SliceRound | CmpRound;

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

const SLICE_DENS = [2, 3, 4, 5, 6, 8];
const TOTAL_ROUNDS = 6;

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function makeSliceRound(): SliceRound {
  const den = SLICE_DENS[randInt(0, SLICE_DENS.length - 1)];
  const num = randInt(1, den - 1);
  return { kind: 'slice', num, den };
}

function parseFraction(s: string): [number, number] {
  const [n, d] = s.split('/').map(Number);
  return [n, d];
}

function buildRounds(cmpPool: FactCatalogItem[]): Round[] {
  const rounds: Round[] = [];
  // Pattern: SSS CCC SSS CCC — but we only have 6, so SSS then CCC
  // Spec: 3 rounds A then 3 rounds B
  for (let i = 0; i < 3; i++) rounds.push(makeSliceRound());
  if (cmpPool.length >= 3) {
    const shuffled = [...cmpPool].sort(() => Math.random() - 0.5).slice(0, 3);
    for (const item of shuffled) {
      const ops = item.operands as string[];
      const [aNum, aDen] = parseFraction(ops[0]);
      const [bNum, bDen] = parseFraction(ops[1]);
      rounds.push({ kind: 'cmp', aNum, aDen, bNum, bDen, answer: item.answer as CmpAnswer });
    }
  } else {
    // fallback: all slice
    for (let i = 0; i < 3; i++) rounds.push(makeSliceRound());
  }
  return rounds;
}

// --------------------------------------------------------------------------
// Pie SVG
// --------------------------------------------------------------------------

function Pie({
  num,
  den,
  size = 200,
  interactive = false,
  selected,
  onToggle,
}: {
  num: number;
  den: number;
  size?: number;
  interactive?: boolean;
  selected?: Set<number>;
  onToggle?: (i: number) => void;
}) {
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="touch-none select-none">
      {Array.from({ length: den }, (_, i) => {
        const a0 = (i / den) * 2 * Math.PI - Math.PI / 2;
        const a1 = ((i + 1) / den) * 2 * Math.PI - Math.PI / 2;
        const x0 = cx + r * Math.cos(a0);
        const y0 = cy + r * Math.sin(a0);
        const x1 = cx + r * Math.cos(a1);
        const y1 = cy + r * Math.sin(a1);
        const largeArc = a1 - a0 > Math.PI ? 1 : 0;
        const filled = interactive ? (selected?.has(i) ?? false) : i < num;
        return (
          <path
            key={i}
            d={`M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1} Z`}
            fill={filled ? '#d4a547' : '#fefcf6'}
            stroke="#334e68"
            strokeWidth={2}
            className={interactive ? 'cursor-pointer' : ''}
            onClick={interactive && onToggle ? () => onToggle(i) : undefined}
          />
        );
      })}
    </svg>
  );
}

// --------------------------------------------------------------------------
// Slice round UI
// --------------------------------------------------------------------------

function SliceRoundView({
  round,
  onResult,
}: {
  round: SliceRound;
  onResult: (correct: boolean, ms: number) => void;
}) {
  const [den, setDen] = useState(round.den);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const startRef = useRef(Date.now());

  // Reset when round changes
  useEffect(() => {
    setDen(round.den);
    setSelected(new Set());
    startRef.current = Date.now();
  }, [round]);

  const toggleSlice = useCallback((i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }, []);

  const handleCheck = () => {
    const ms = Date.now() - startRef.current;
    const correct = den === round.den && selected.size === round.num;
    onResult(correct, ms);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="font-display font-bold text-3xl text-ink-800">
        Make{' '}
        <span className="text-gold-600">
          {round.num}/{round.den}
        </span>
      </p>

      <Pie
        num={0}
        den={den}
        size={280}
        interactive
        selected={selected}
        onToggle={toggleSlice}
      />

      {/* Denominator picker */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => { setDen(d => Math.max(2, d - 1)); setSelected(new Set()); }}
          className="min-w-14 min-h-14 rounded-2xl bg-cream-200 hover:bg-cream-300 active:scale-95 font-display font-bold text-2xl text-ink-700 transition-all"
          aria-label="fewer slices"
        >
          −
        </button>
        <span className="font-display font-bold text-2xl text-ink-700 w-8 text-center">{den}</span>
        <button
          onClick={() => { setDen(d => Math.min(12, d + 1)); setSelected(new Set()); }}
          className="min-w-14 min-h-14 rounded-2xl bg-cream-200 hover:bg-cream-300 active:scale-95 font-display font-bold text-2xl text-ink-700 transition-all"
          aria-label="more slices"
        >
          +
        </button>
      </div>
      <p className="text-sm text-ink-500">Tap slices to color them</p>

      <button
        onClick={handleCheck}
        className="min-h-14 px-10 rounded-2xl bg-sage-500 hover:bg-sage-600 active:scale-95 font-display font-bold text-xl text-white shadow-md transition-all"
      >
        Check ✓
      </button>
    </div>
  );
}

// --------------------------------------------------------------------------
// Compare round UI
// --------------------------------------------------------------------------

function CmpRoundView({
  round,
  onResult,
}: {
  round: CmpRound;
  onResult: (correct: boolean, ms: number, chosen: CmpAnswer) => void;
}) {
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
  }, [round]);

  const handle = (chosen: CmpAnswer) => {
    const ms = Date.now() - startRef.current;
    onResult(chosen === round.answer, ms, chosen);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="font-display font-bold text-2xl text-ink-700">Which is bigger?</p>
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <div className="flex flex-col items-center gap-1">
          <Pie num={round.aNum} den={round.aDen} size={200} />
          <span className="font-display font-bold text-xl text-ink-700">
            {round.aNum}/{round.aDen}
          </span>
        </div>
        <span className="font-display font-bold text-3xl text-ink-400">vs</span>
        <div className="flex flex-col items-center gap-1">
          <Pie num={round.bNum} den={round.bDen} size={200} />
          <span className="font-display font-bold text-xl text-ink-700">
            {round.bNum}/{round.bDen}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        {(['<', '=', '>'] as CmpAnswer[]).map(op => (
          <PracticeAnswerButton key={op} onClick={() => handle(op)} className="w-20">
            {op}
          </PracticeAnswerButton>
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Main page
// --------------------------------------------------------------------------

export default function PizzaCutterPage() {
  const router = useRouter();
  const eq = useFactVault({ factType: 'frac_eq', autoLoad: true });

  const [phase, setPhase] = useState<Phase>('loading');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [revealSlice, setRevealSlice] = useState<{ num: number; den: number } | null>(null);
  const [revealCmpAnswer, setRevealCmpAnswer] = useState<CmpAnswer | null>(null);

  // Load comparison catalog once
  useEffect(() => {
    vaultApi.getFactCatalog({ fact_type: 'frac_cmp' })
      .then(r => {
        setRounds(buildRounds(r.facts));
        setPhase('playing');
      })
      .catch(() => {
        // fallback: all slice rounds
        setRounds(Array.from({ length: TOTAL_ROUNDS }, makeSliceRound));
        setPhase('playing');
      });
  }, []);

  const advance = useCallback(() => {
    setRevealSlice(null);
    setRevealCmpAnswer(null);
    if (roundIdx + 1 >= TOTAL_ROUNDS) {
      setPhase('done');
    } else {
      setRoundIdx(i => i + 1);
      setPhase('playing');
    }
  }, [roundIdx]);

  const handleSliceResult = useCallback((correct: boolean, ms: number) => {
    const r = rounds[roundIdx] as SliceRound;
    setLastCorrect(correct);
    if (correct) {
      setScore(s => s + 1);
    } else {
      setRevealSlice({ num: r.num, den: r.den });
    }
    void eq.recordAttempt({
      fact_id: `frac_eq_${r.num}/${r.den}=${r.num}/${r.den}`,
      fact_type: 'frac_eq',
      operands: [`${r.num}/${r.den}`, `${r.num}/${r.den}`],
      answer: 'true',
      game_id: 'pizza_cutter',
      correct,
      ms,
    });
    setPhase('reveal');
    setTimeout(advance, 1200);
  }, [rounds, roundIdx, eq, advance]);

  const handleCmpResult = useCallback((correct: boolean, ms: number, chosen: CmpAnswer) => {
    const r = rounds[roundIdx] as CmpRound;
    setLastCorrect(correct);
    if (!correct) setRevealCmpAnswer(r.answer);
    if (correct) setScore(s => s + 1);
    void eq.recordAttempt({
      fact_id: `frac_cmp_${r.aNum}/${r.aDen}${chosen}${r.bNum}/${r.bDen}`,
      fact_type: 'frac_cmp',
      operands: [`${r.aNum}/${r.aDen}`, `${r.bNum}/${r.bDen}`],
      answer: chosen,
      game_id: 'pizza_cutter',
      correct,
      ms,
    });
    setPhase('reveal');
    setTimeout(advance, 1200);
  }, [rounds, roundIdx, eq, advance]);

  const restart = () => {
    setRoundIdx(0);
    setScore(0);
    setPhase('loading');
    setRevealSlice(null);
    setRevealCmpAnswer(null);
    vaultApi.getFactCatalog({ fact_type: 'frac_cmp' })
      .then(r => { setRounds(buildRounds(r.facts)); setPhase('playing'); })
      .catch(() => { setRounds(Array.from({ length: TOTAL_ROUNDS }, makeSliceRound)); setPhase('playing'); });
  };

  const currentRound = rounds[roundIdx];

  return (
    <PracticeGameLayout
      title="Pizza Cutter"
      subtitle={phase === 'done' ? 'Done!' : `Round ${roundIdx + 1} of ${TOTAL_ROUNDS}`}
      onBack={() => router.push('/team/practice/fractions')}
      mastery={{
        sticky: eq.stats.sticky,
        learning: eq.stats.learning,
        mastered: eq.stats.mastered,
      }}
      rightBadge={
        <span className="font-display font-bold text-lg text-gold-600">{score}</span>
      }
    >
      <div className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {/* Loading */}
          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-20"
            >
              <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
              <p className="font-display text-ink-500">Loading pizza…</p>
            </motion.div>
          )}

          {/* Playing */}
          {phase === 'playing' && currentRound && (
            <motion.div
              key={`playing-${roundIdx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              {currentRound.kind === 'slice' ? (
                <SliceRoundView round={currentRound} onResult={handleSliceResult} />
              ) : (
                <CmpRoundView round={currentRound} onResult={handleCmpResult} />
              )}
            </motion.div>
          )}

          {/* Reveal */}
          {phase === 'reveal' && (
            <motion.div
              key={`reveal-${roundIdx}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`flex flex-col items-center gap-6 py-10 rounded-3xl ${lastCorrect ? 'bg-sage-50' : 'bg-coral-50'}`}
            >
              {lastCorrect ? (
                <CheckCircle2 className="w-16 h-16 text-sage-500" />
              ) : (
                <XCircle className="w-16 h-16 text-coral-500" />
              )}
              <p className={`font-display font-bold text-2xl ${lastCorrect ? 'text-sage-700' : 'text-coral-700'}`}>
                {lastCorrect ? 'Nice slice!' : 'Not quite…'}
              </p>
              {/* Show correct answer for wrong responses */}
              {!lastCorrect && revealSlice && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-ink-500 text-sm">Correct answer:</p>
                  <Pie num={revealSlice.num} den={revealSlice.den} size={160} />
                  <span className="font-display font-bold text-xl text-ink-700">
                    {revealSlice.num}/{revealSlice.den}
                  </span>
                </div>
              )}
              {!lastCorrect && revealCmpAnswer && currentRound?.kind === 'cmp' && (
                <p className="font-display font-bold text-2xl text-ink-700">
                  {(currentRound as CmpRound).aNum}/{(currentRound as CmpRound).aDen}
                  {' '}<span className="text-gold-600">{revealCmpAnswer}</span>{' '}
                  {(currentRound as CmpRound).bNum}/{(currentRound as CmpRound).bDen}
                </p>
              )}
            </motion.div>
          )}

          {/* Done */}
          {phase === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-8 py-12"
            >
              <Trophy className="w-20 h-20 text-gold-500" />
              <p className="font-display font-bold text-4xl text-ink-800">
                {score} / {TOTAL_ROUNDS}
              </p>
              <p className="font-display text-xl text-ink-500">
                {score === TOTAL_ROUNDS
                  ? 'Perfect! Pizza master!'
                  : score >= TOTAL_ROUNDS / 2
                  ? 'Great slicing!'
                  : 'Keep practising!'}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={restart}
                  className="min-h-14 px-8 rounded-2xl bg-gold-400 hover:bg-gold-500 active:scale-95 font-display font-bold text-xl text-white shadow-md transition-all"
                >
                  Play Again
                </button>
                <button
                  onClick={() => router.push('/team/practice/fractions')}
                  className="min-h-14 px-8 rounded-2xl bg-cream-200 hover:bg-cream-300 active:scale-95 font-display font-bold text-xl text-ink-700 transition-all"
                >
                  Back
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </PracticeGameLayout>
  );
}
