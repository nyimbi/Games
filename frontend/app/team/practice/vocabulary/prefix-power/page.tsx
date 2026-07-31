'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { PracticeGameLayout, PracticeAnswerButton } from '@/components/practice';
import { vaultApi, PrefixPowerItem } from '@/lib/api/vault';
import { useWordVault } from '@/lib/hooks/useVault';

type Phase = 'loading' | 'playing' | 'reveal' | 'done';

interface RoundResult {
  item: PrefixPowerItem;
  chosen: string;
  correct: boolean;
  ms: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PrefixPowerPage() {
  const router = useRouter();
  const { stats, recordEncounter } = useWordVault({ autoLoad: true });

  const [phase, setPhase] = useState<Phase>('loading');
  const [items, setItems] = useState<PrefixPowerItem[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const roundStartRef = useRef<number>(Date.now());

  const loadGame = useCallback(() => {
    setPhase('loading');
    setRound(0);
    setScore(0);
    setChosen(null);
    setResults([]);
    vaultApi
      .getPrefixItems()
      .then((res) => {
        const picked = shuffle(res.items).slice(0, 10);
        setItems(picked);
        setPhase('playing');
        roundStartRef.current = Date.now();
      })
      .catch((e) => setApiError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  const item = items[round] ?? null;

  function handleAnswer(prefix: string) {
    if (phase !== 'playing' || !item) return;
    const ms = Date.now() - roundStartRef.current;
    const isRight = prefix === item.correct;
    setChosen(prefix);
    setScore((s) => s + (isRight ? 10 : -3));
    setResults((r) => [...r, { item, chosen: prefix, correct: isRight, ms }]);
    setPhase('reveal');

    void recordEncounter({
      word: item.correct + item.root,
      pos: 'verb',
      game_id: 'prefix_power',
      mode: 'morph',
      correct: isRight,
      ms,
    });

    setTimeout(() => {
      const next = round + 1;
      if (next >= items.length) {
        setPhase('done');
      } else {
        setRound(next);
        setChosen(null);
        setPhase('playing');
        roundStartRef.current = Date.now();
      }
    }, 1600);
  }

  if (apiError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-200 flex flex-col items-center justify-center gap-6 p-6">
        <p className="text-ink-600 text-lg text-center">{apiError}</p>
        <button
          onClick={() => router.push('/team/practice/vocabulary')}
          className="px-6 py-3 rounded-2xl bg-gold-400 font-display font-bold text-ink-800 text-lg min-h-14"
        >
          Back
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    const correctCount = results.filter((r) => r.correct).length;
    const prefixCounts: Record<string, number> = {};
    for (const r of results) {
      prefixCounts[r.item.correct] = (prefixCounts[r.item.correct] ?? 0) + 1;
    }

    return (
      <PracticeGameLayout
        title="Prefix Power"
        subtitle="Game over!"
        onBack={() => router.push('/team/practice/vocabulary')}
        mastery={{ mastered: stats.mastered, sticky: stats.sticky }}
        rightBadge={
          <span className="font-display font-bold text-lg text-gold-600">{score}</span>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
            <div className="font-display font-bold text-5xl text-gold-600 mb-1">{score}</div>
            <div className="text-ink-500 text-base">
              {correctCount} of {results.length} correct
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <h2 className="font-display font-bold text-ink-700 mb-3 text-base">
              Prefixes you practiced
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(prefixCounts).map(([prefix, count]) => (
                <span
                  key={prefix}
                  className="px-3 py-1 rounded-full bg-gold-100 text-gold-800 font-display font-bold text-sm"
                >
                  {prefix} × {count}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium ${
                  r.correct ? 'bg-sage-50 text-sage-800' : 'bg-coral-50 text-coral-800'
                }`}
              >
                <span className="font-display font-bold text-base">
                  {r.item.correct + r.item.root}
                </span>
                {!r.correct && (
                  <span className="text-xs opacity-70 ml-auto">
                    you chose: {r.chosen + r.item.root}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/team/practice/vocabulary')}
              className="flex-1 min-h-14 rounded-2xl border-2 border-ink-200 font-display font-bold text-ink-700 text-lg"
            >
              Back
            </button>
            <button
              onClick={loadGame}
              className="flex-1 min-h-14 rounded-2xl bg-gold-400 font-display font-bold text-ink-800 text-lg"
            >
              Play Again
            </button>
          </div>
        </div>
      </PracticeGameLayout>
    );
  }

  const parts = item ? item.sentence.split('___') : ['', ''];
  const isRight = chosen === item?.correct;

  return (
    <PracticeGameLayout
      title="Prefix Power"
      subtitle={
        phase === 'loading' ? 'Loading…' : `Question ${round + 1} of ${items.length || 10}`
      }
      onBack={() => router.push('/team/practice/vocabulary')}
      mastery={{ mastered: stats.mastered, sticky: stats.sticky }}
      rightBadge={
        <span className="font-display font-bold text-lg text-gold-600">{score}</span>
      }
    >
      {phase === 'loading' ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 rounded-full border-4 border-gold-400 border-t-transparent animate-spin" />
        </div>
      ) : item ? (
        <div className="flex flex-col gap-5">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-sm"
          >
            <p className="text-xl md:text-2xl leading-relaxed text-ink-800 font-medium">
              {parts[0]}
              <span className="inline-block min-w-[4rem] border-b-4 border-gold-400 mx-1 text-gold-600 font-display font-bold">
                {chosen ?? '____'}
              </span>
              {item.root}
              {parts[1]}
            </p>
          </motion.div>

          <AnimatePresence>
            {phase === 'reveal' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`overflow-hidden rounded-2xl px-5 py-3 font-medium text-base ${
                  isRight ? 'bg-sage-100 text-sage-800' : 'bg-coral-100 text-coral-800'
                }`}
              >
                {item.meaning}
                {!isRight && (
                  <span className="block text-sm mt-1 opacity-80">
                    Correct: <strong>{item.correct}</strong>
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-3">
            {item.options.map((opt) => {
              let state: 'idle' | 'correct' | 'wrong' | 'muted' = 'idle';
              if (phase === 'reveal') {
                if (opt === item.correct) state = 'correct';
                else if (opt === chosen) state = 'wrong';
                else state = 'muted';
              }
              return (
                <PracticeAnswerButton
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  disabled={phase === 'reveal'}
                  state={state}
                >
                  {opt}
                </PracticeAnswerButton>
              );
            })}
          </div>
        </div>
      ) : null}
    </PracticeGameLayout>
  );
}
