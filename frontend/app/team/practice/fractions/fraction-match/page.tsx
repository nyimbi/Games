'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { RotateCcw, Trophy, Layers } from 'lucide-react';
import { PracticeGameLayout } from '@/components/practice';
import { useFactVault } from '@/lib/hooks/useVault';
import { FactCatalogItem } from '@/lib/api/vault';

type Rep = 'symbol' | 'pie' | 'bar';
type Phase = 'loading' | 'error' | 'playing' | 'done';

interface Frac { num: number; den: number; str: string }
interface Card {
  id: number;
  pairId: number;
  frac: Frac;
  rep: Rep;
  flipped: boolean;
  matched: boolean;
  pairA: string;
  pairB: string;
}

function parseFrac(s: string): Frac {
  const [n, d] = s.split('/').map(Number);
  return { num: n, den: d, str: s };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const REPS: Rep[] = ['symbol', 'pie', 'bar'];

function buildCards(pairs: [string, string][]): Card[] {
  const cards: Card[] = [];
  let id = 0;
  pairs.forEach(([a, b], pairId) => {
    const r = shuffle(REPS);
    const repA = r[0];
    const repB = r[1] !== repA ? r[1] : r[2];
    cards.push({ id: id++, pairId, frac: parseFrac(a), rep: repA, flipped: false, matched: false, pairA: a, pairB: b });
    cards.push({ id: id++, pairId, frac: parseFrac(b), rep: repB, flipped: false, matched: false, pairA: a, pairB: b });
  });
  return shuffle(cards);
}

function pickPairs(catalog: FactCatalogItem[]): [string, string][] {
  const pool = shuffle(catalog.filter(c => c.tier === 1)).slice(0, 6);
  return pool.map(c => c.operands as [string, string]);
}

function Pie({ num, den, size = 64 }: { num: number; den: number; size?: number }) {
  const r = size / 2 - 4, cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: den }, (_, i) => {
        const a0 = (i / den) * 2 * Math.PI - Math.PI / 2;
        const a1 = ((i + 1) / den) * 2 * Math.PI - Math.PI / 2;
        const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        const largeArc = a1 - a0 > Math.PI ? 1 : 0;
        return (
          <path key={i}
            d={`M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1} Z`}
            fill={i < num ? '#d4a547' : '#fefcf6'} stroke="#334e68" strokeWidth={1.5} />
        );
      })}
    </svg>
  );
}

function Bar({ num, den, width = 88, height = 20 }: { num: number; den: number; width?: number; height?: number }) {
  const cellW = width / den;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {Array.from({ length: den }, (_, i) => (
        <rect key={i} x={i * cellW} y={0} width={cellW} height={height}
          fill={i < num ? '#d4a547' : '#fefcf6'} stroke="#334e68" strokeWidth={1} />
      ))}
    </svg>
  );
}

function CardFace({ frac, rep }: { frac: Frac; rep: Rep }) {
  if (rep === 'symbol') {
    return (
      <div className="flex flex-col items-center justify-center">
        <span className="font-display font-bold text-3xl text-ink-800 leading-none">{frac.num}</span>
        <div className="w-7 h-0.5 bg-ink-700 my-1" />
        <span className="font-display font-bold text-3xl text-ink-800 leading-none">{frac.den}</span>
      </div>
    );
  }
  if (rep === 'pie') return <Pie num={frac.num} den={frac.den} />;
  return (
    <div className="flex flex-col items-center gap-1 px-2">
      <Bar num={frac.num} den={frac.den} />
      <span className="text-xs font-display text-ink-500">{frac.num}/{frac.den}</span>
    </div>
  );
}

export default function FractionMatchPage() {
  const router = useRouter();
  const { stats, recordAttempt, loadCatalog, catalog, loading: vaultLoading, error: vaultError } =
    useFactVault({ factType: 'frac_eq', autoLoad: true });

  const [phase, setPhase] = useState<Phase>('loading');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { void loadCatalog({ tier: 1 }); }, [loadCatalog]);

  useEffect(() => {
    if (vaultLoading || phase !== 'loading') return;
    if (vaultError && catalog.length === 0) { setPhase('error'); return; }
    if (catalog.length === 0) return;
    const pairs = pickPairs(catalog);
    if (pairs.length < 6) { setPhase('error'); return; }
    setCards(buildCards(pairs));
    setPhase('playing');
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, [vaultLoading, catalog, vaultError, phase]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const resetGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const pairs = pickPairs(catalog);
    if (pairs.length < 6) return;
    setCards(buildCards(pairs));
    setFlippedIds([]);
    setMoves(0);
    setScore(0);
    setMatchedCount(0);
    setElapsed(0);
    setIsChecking(false);
    setPhase('playing');
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, [catalog]);

  const flipCard = useCallback((cardId: number) => {
    if (isChecking || flippedIds.length >= 2) return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return;

    const newCards = cards.map(c => c.id === cardId ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newFlipped = [...flippedIds, cardId];
    setFlippedIds(newFlipped);

    if (newFlipped.length < 2) return;

    const [idA, idB] = newFlipped;
    const cardA = newCards.find(c => c.id === idA)!;
    const cardB = newCards.find(c => c.id === idB)!;
    const didMatch = cardA.pairId === cardB.pairId;
    const ms = Date.now() - startTimeRef.current;

    setMoves(m => m + 1);
    setIsChecking(true);

    void recordAttempt({
      fact_id: `frac_eq_${cardA.pairA}=${cardA.pairB}`,
      fact_type: 'frac_eq',
      operands: [cardA.pairA, cardA.pairB],
      answer: 'true',
      game_id: 'fraction_match',
      correct: didMatch,
      ms,
    });

    if (didMatch) {
      setScore(s => s + 10);
      const next = matchedCount + 1;
      setMatchedCount(next);
      setCards(cs => cs.map(c => c.id === idA || c.id === idB ? { ...c, matched: true } : c));
      setFlippedIds([]);
      setIsChecking(false);
      if (next === 6) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => setPhase('done'), 600);
      }
    } else {
      setScore(s => Math.max(0, s - 1));
      setTimeout(() => {
        setCards(cs => cs.map(c => c.id === idA || c.id === idB ? { ...c, flipped: false } : c));
        setFlippedIds([]);
        setIsChecking(false);
      }, 1200);
    }
  }, [cards, flippedIds, isChecking, matchedCount, recordAttempt]);

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-200 flex flex-col items-center justify-center gap-6 px-6">
        <Layers className="w-12 h-12 text-ink-400" />
        <p className="text-ink-600 text-center text-lg font-display">
          {vaultError ?? 'Not enough fraction pairs to start the game.'}
        </p>
        <button
          onClick={() => router.push('/team/practice/fractions')}
          className="min-h-14 px-6 rounded-2xl bg-gold-400 text-white font-display font-bold text-lg"
        >
          Back to Fractions
        </button>
      </div>
    );
  }

  return (
    <PracticeGameLayout
      title="Fraction Match"
      subtitle={
        phase === 'playing'
          ? `${matchedCount}/6 pairs · ${moves} moves · ${elapsed}s`
          : undefined
      }
      onBack={() => router.push('/team/practice/fractions')}
      mastery={{ sticky: stats.sticky, learning: stats.learning, mastered: stats.mastered }}
      rightBadge={
        phase !== 'loading' ? (
          <span className="font-display font-bold text-lg text-gold-600">{score}</span>
        ) : undefined
      }
    >
      {phase === 'loading' && (
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-4 border-gold-300 border-t-gold-600 rounded-full"
          />
        </div>
      )}

      {phase === 'playing' && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {cards.map((card, idx) => (
            <motion.button
              key={card.id}
              onClick={() => flipCard(card.id)}
              disabled={card.flipped || card.matched || isChecking}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.04, duration: 0.2 }}
              whileTap={{ scale: 0.95 }}
              className={[
                'aspect-square rounded-2xl border-2 flex items-center justify-center transition-all min-h-[60px]',
                card.matched
                  ? 'bg-sage-50 border-sage-500 shadow-[0_0_0_3px_rgba(var(--color-sage-300)/0.4)]'
                  : card.flipped
                    ? 'bg-white border-gold-400'
                    : 'bg-gold-100 border-gold-300 hover:border-gold-500 active:scale-95',
              ].join(' ')}
            >
              {card.flipped || card.matched
                ? <CardFace frac={card.frac} rep={card.rep} />
                : <span className="text-3xl font-display font-bold text-gold-500">?</span>
              }
            </motion.button>
          ))}
        </div>
      )}

      {phase === 'done' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 py-8"
        >
          <Trophy className="w-16 h-16 text-gold-500" />
          <div className="text-center">
            <p className="font-display font-bold text-4xl text-ink-800">{score}</p>
            <p className="text-ink-500 mt-1">points</p>
          </div>
          <div className="bg-white rounded-2xl border border-ink-100 p-5 w-full max-w-xs flex flex-col gap-3 text-center">
            <div className="flex justify-between text-ink-600 font-display">
              <span>Time</span>
              <span className="font-bold text-ink-800">{elapsed}s</span>
            </div>
            <div className="flex justify-between text-ink-600 font-display">
              <span>Moves</span>
              <span className="font-bold text-ink-800">{moves}</span>
            </div>
            <div className="flex justify-between text-ink-600 font-display">
              <span>Accuracy</span>
              <span className="font-bold text-ink-800">
                {moves > 0 ? Math.round((6 / moves) * 100) : 100}%
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={resetGame}
              className="min-h-14 flex items-center justify-center gap-2 rounded-2xl bg-gold-400 text-white font-display font-bold text-lg"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
            <button
              onClick={() => router.push('/team/practice/fractions')}
              className="min-h-14 rounded-2xl border-2 border-ink-200 text-ink-700 font-display font-bold text-lg"
            >
              Back to Fractions
            </button>
          </div>
        </motion.div>
      )}
    </PracticeGameLayout>
  );
}
