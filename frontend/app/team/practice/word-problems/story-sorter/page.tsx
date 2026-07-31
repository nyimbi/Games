'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { PracticeGameLayout, PracticeAnswerButton } from '@/components/practice';
import { vaultApi, WordProblemItem } from '@/lib/api/vault';
import { useFactVault } from '@/lib/hooks/useVault';

type Phase = 'loading' | 'op' | 'op_wrong' | 'num' | 'reveal' | 'done';
type Op = '+' | '-' | '×' | '÷';

interface RoundResult {
  opCorrect: boolean;
  numCorrect: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeDistractors(item: WordProblemItem): number[] {
  const { answer, numbers, operation } = item;
  const candidates = new Set<number>();

  candidates.add(answer + 2);
  candidates.add(answer - 2);
  candidates.add(answer + 5);
  candidates.add(answer - 5);

  const [a, b] = numbers;
  if (operation === '+') { candidates.add(a - b); candidates.add(a * b); }
  if (operation === '-') { candidates.add(a + b); candidates.add(a * b); }
  if (operation === '×') { candidates.add(a + b); candidates.add(b !== 0 ? Math.round(a / b) : a + 1); }
  if (operation === '÷') { candidates.add(a * b); candidates.add(a + b); }

  const pool = [...candidates]
    .filter(n => Number.isFinite(n) && n > 0 && n !== answer && Number.isInteger(n))
    .map(n => Math.abs(n));

  const unique = [...new Set(pool)].filter(n => n !== answer);
  const picked: number[] = [];
  for (const n of shuffle(unique)) {
    if (picked.length >= 3) break;
    if (!picked.includes(n)) picked.push(n);
  }

  while (picked.length < 3) {
    const fallback = answer + picked.length + 1;
    if (!picked.includes(fallback) && fallback !== answer) picked.push(fallback);
  }

  return shuffle([answer, ...picked.slice(0, 3)]);
}

const OP_STYLE: Record<Op, string> = {
  '+': 'bg-sage-100 border-sage-500 text-sage-800',
  '-': 'bg-gold-100 border-gold-500 text-gold-800',
  '×': 'bg-coral-100 border-coral-500 text-coral-800',
  '÷': 'bg-ink-100 border-ink-500 text-ink-800',
};

const OPS: Op[] = ['+', '-', '×', '÷'];

export default function StorySorterPage() {
  const router = useRouter();
  const { stats, recordAttempt } = useFactVault({ autoLoad: true });

  const [phase, setPhase] = useState<Phase>('loading');
  const [items, setItems] = useState<WordProblemItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);

  const [pickedOp, setPickedOp] = useState<Op | null>(null);
  const [pickedNum, setPickedNum] = useState<number | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const startMs = useRef<number>(Date.now());

  useEffect(() => {
    vaultApi.getWordProblems()
      .then(res => {
        const pool = shuffle(res.items).slice(0, 10);
        if (pool.length === 0) { setError('No problems available.'); return; }
        setItems(pool);
        setPhase('op');
        startMs.current = Date.now();
      })
      .catch(() => setError('Failed to load problems. Please go back and try again.'));
  }, []);

  const item = items[roundIdx];

  const advanceRound = useCallback((res: RoundResult) => {
    setResults(prev => {
      const next = [...prev, res];
      if (next.length >= items.length) {
        setPhase('done');
      } else {
        setRoundIdx(r => r + 1);
        setPickedOp(null);
        setPickedNum(null);
        setPhase('op');
        startMs.current = Date.now();
      }
      return next;
    });
  }, [items.length]);

  const handleOp = (op: Op) => {
    if (!item || phase !== 'op') return;
    setPickedOp(op);
    if (op === item.operation) {
      setOptions(makeDistractors(item));
      setTimeout(() => setPhase('num'), 600);
    } else {
      setScore(s => s - 3);
      setPhase('op_wrong');
      setTimeout(() => advanceRound({ opCorrect: false, numCorrect: false }), 1500);
    }
  };

  const handleNum = (n: number) => {
    if (!item || phase !== 'num') return;
    const correct = n === item.answer;
    setPickedNum(n);
    setScore(s => s + (correct ? 15 : 8));
    setPhase('reveal');

    const elapsed = Date.now() - startMs.current;
    const factType = item.operation === '+' ? 'add'
      : item.operation === '-' ? 'sub'
      : item.operation === '×' ? 'mult' : 'div';
    void recordAttempt({
      fact_id: `wp_${item.id}`,
      fact_type: factType,
      operands: item.numbers,
      answer: String(item.answer),
      game_id: 'story_sorter',
      correct,
      ms: elapsed,
    });

    setTimeout(() => advanceRound({ opCorrect: true, numCorrect: correct }), 1200);
  };

  const opCount = results.filter(r => r.opCorrect).length;
  const numCount = results.filter(r => r.opCorrect && r.numCorrect).length;

  if (phase === 'loading' && !error) {
    return (
      <PracticeGameLayout title="Story Sorter" onBack={() => router.push('/team/practice/word-problems')}>
        <div className="flex items-center justify-center min-h-64">
          <div className="w-10 h-10 rounded-full border-4 border-sage-300 border-t-sage-600 animate-spin" />
        </div>
      </PracticeGameLayout>
    );
  }

  if (error) {
    return (
      <PracticeGameLayout title="Story Sorter" onBack={() => router.push('/team/practice/word-problems')}>
        <div className="flex flex-col items-center justify-center min-h-64 gap-4 px-4 text-center">
          <p className="text-ink-600 text-lg">{error}</p>
          <button
            onClick={() => router.push('/team/practice/word-problems')}
            className="px-6 py-3 rounded-2xl bg-sage-100 border-2 border-sage-400 text-sage-800 font-display font-bold text-lg"
          >
            Go Back
          </button>
        </div>
      </PracticeGameLayout>
    );
  }

  if (phase === 'done') {
    return (
      <PracticeGameLayout
        title="Story Sorter"
        onBack={() => router.push('/team/practice/word-problems')}
        mastery={{ sticky: stats.sticky, learning: stats.learning, mastered: stats.mastered }}
      >
        <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
          <h2 className="font-display font-bold text-3xl text-ink-800 text-center">Done!</h2>

          <div className="bg-white rounded-3xl border-2 border-sage-200 p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-ink-600 text-lg">Score</span>
              <span className="font-display font-bold text-3xl text-gold-600">{score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-600">Operation accuracy</span>
              <span className="font-display font-bold text-xl text-sage-700">
                {opCount}/{results.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-600">Computation accuracy</span>
              <span className="font-display font-bold text-xl text-sage-700">
                {opCount > 0 ? `${numCount}/${opCount}` : '—'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setScore(0);
                setResults([]);
                setRoundIdx(0);
                setPickedOp(null);
                setPickedNum(null);
                setPhase('loading');
                vaultApi.getWordProblems()
                  .then(res => {
                    const pool = shuffle(res.items).slice(0, 10);
                    setItems(pool);
                    setPhase('op');
                    startMs.current = Date.now();
                  })
                  .catch(() => setError('Failed to load problems.'));
              }}
              className="w-full py-4 rounded-3xl bg-sage-500 text-white font-display font-bold text-xl active:scale-[0.98] transition-transform"
            >
              Play Again
            </button>
            <button
              onClick={() => router.push('/team/practice/word-problems')}
              className="w-full py-4 rounded-3xl bg-ink-100 text-ink-700 font-display font-bold text-xl active:scale-[0.98] transition-transform"
            >
              Back
            </button>
          </div>
        </div>
      </PracticeGameLayout>
    );
  }

  if (!item) return null;

  const subtitle = (phase === 'op' || phase === 'op_wrong')
    ? 'Pick the operation'
    : phase === 'num' || phase === 'reveal'
    ? 'Now find the answer'
    : undefined;

  return (
    <PracticeGameLayout
      title="Story Sorter"
      subtitle={subtitle}
      onBack={() => router.push('/team/practice/word-problems')}
      mastery={{ sticky: stats.sticky, learning: stats.learning, mastered: stats.mastered }}
      rightBadge={<span className="font-display font-bold text-lg text-gold-600">{score}</span>}
    >
      <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-6">
        <div className="text-sm text-ink-400 font-display text-right">
          {roundIdx + 1} / {items.length}
        </div>

        {/* Story card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl border-2 border-sage-200 p-6 shadow-sm"
          >
            <p className="text-lg md:text-xl leading-relaxed text-ink-800">{item.story}</p>
          </motion.div>
        </AnimatePresence>

        {/* Stage 1 — operator pick */}
        {(phase === 'op' || phase === 'op_wrong') && (
          <div className="grid grid-cols-2 gap-3">
            {OPS.map(op => {
              const isWrong = phase === 'op_wrong' && pickedOp === op;
              const isCorrect = phase === 'op_wrong' && op === item.operation;
              const base = OP_STYLE[op];
              const flash = isWrong
                ? 'bg-coral-200 border-coral-600 text-coral-900 scale-[0.97]'
                : isCorrect
                ? 'bg-sage-200 border-sage-600 text-sage-900'
                : base;

              return (
                <button
                  key={op}
                  onClick={() => handleOp(op)}
                  disabled={phase === 'op_wrong'}
                  className={`min-h-24 rounded-3xl border-2 font-display font-bold text-5xl transition-all active:scale-[0.96] disabled:cursor-default ${flash}`}
                  aria-label={`Operator ${op}`}
                >
                  {op}
                </button>
              );
            })}
          </div>
        )}

        {/* Stage 2 — answer pick */}
        {(phase === 'num' || phase === 'reveal') && (
          <>
            {phase === 'reveal' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center font-display font-bold text-2xl text-ink-700"
              >
                {item.numbers[0]} {item.operation} {item.numbers[1]} = {item.answer}
              </motion.div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {options.map(n => {
                const state: 'idle' | 'correct' | 'wrong' | 'muted' =
                  phase === 'reveal'
                    ? n === item.answer
                      ? 'correct'
                      : n === pickedNum
                      ? 'wrong'
                      : 'muted'
                    : 'idle';
                return (
                  <PracticeAnswerButton
                    key={n}
                    onClick={() => handleNum(n)}
                    disabled={phase === 'reveal'}
                    state={state}
                  >
                    {n}
                  </PracticeAnswerButton>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PracticeGameLayout>
  );
}
