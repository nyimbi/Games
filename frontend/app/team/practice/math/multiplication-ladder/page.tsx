'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Layers, RotateCcw } from 'lucide-react';
import { useFactVault } from '@/lib/hooks/useVault';
import { vaultApi, FactCatalogItem, FactVaultItem } from '@/lib/api/vault';
import { PracticeGameLayout, PracticeAnswerButton } from '@/components/practice';

// --------------------------------------------------------------------------
// Types & helpers
// --------------------------------------------------------------------------

type AnyFact = FactVaultItem | FactCatalogItem;

interface SessionFact {
  fact: AnyFact;
  options: number[];
}

type Phase = 'loading' | 'playing' | 'reveal' | 'done';

function parseAnswer(fact: AnyFact): number {
  return parseInt(fact.answer, 10);
}

function makeOptions(correct: number): number[] {
  const chosen = new Set<number>([correct]);
  const pool: number[] = [];
  for (let d = 1; d <= 5; d++) {
    if (correct - d > 0) pool.push(correct - d);
    pool.push(correct + d);
  }
  // Fisher-Yates on pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  for (const p of pool) {
    if (chosen.size >= 4) break;
    chosen.add(p);
  }
  const arr = Array.from(chosen);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function toSessionFact(f: AnyFact): SessionFact {
  return { fact: f, options: makeOptions(parseAnswer(f)) };
}

// --------------------------------------------------------------------------
// Tower visualization
// --------------------------------------------------------------------------

function Tower({
  total,
  retired,
  stickyCount,
}: {
  total: number;
  retired: number;
  stickyCount: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2 pt-1 select-none">
      {/* Sticky pile badge — shows only when pile is non-empty */}
      <div className="h-8 flex items-center justify-center">
        {stickyCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative"
          >
            <Layers className="w-5 h-5 text-coral-500" />
            <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-coral-500 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {stickyCount}
            </span>
          </motion.div>
        )}
      </div>

      {/* Rungs rendered bottom-to-top via flex-col-reverse */}
      <div className="flex flex-col-reverse gap-[3px]">
        {Array.from({ length: total }, (_, i) => {
          const isRetired = i < retired;
          const isCurrent = i === retired;
          return (
            <motion.div
              key={i}
              className={`h-2.5 w-8 rounded-sm ${
                isRetired
                  ? 'bg-sage-500'
                  : isCurrent
                  ? 'bg-gold-400'
                  : 'bg-ink-200'
              }`}
              animate={isCurrent ? { opacity: [1, 0.45, 1] } : {}}
              transition={
                isCurrent
                  ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' }
                  : {}
              }
            />
          );
        })}
      </div>

      <span className="text-[10px] font-medium text-ink-400 tabular-nums">
        {retired}/{total}
      </span>
    </div>
  );
}

// --------------------------------------------------------------------------
// Page
// --------------------------------------------------------------------------

export default function MultiplicationLadderPage() {
  const router = useRouter();

  const { dueItems, stats, loading, recordAttempt } = useFactVault({
    factType: 'mult',
    limit: 15,
    autoLoad: true,
  });

  const [phase, setPhase] = useState<Phase>('loading');
  const [queue, setQueue] = useState<SessionFact[]>([]);
  const [stickyPile, setStickyPile] = useState<AnyFact[]>([]);
  const [missCount, setMissCount] = useState<Record<string, number>>({});
  const [retiredCount, setRetiredCount] = useState(0);
  const [totalInitial, setTotalInitial] = useState(10);
  // Tracks fact_ids that ever needed a sticky-pile rep (for end-screen stat)
  const [stickyRepFacts, setStickyRepFacts] = useState<Set<string>>(new Set());
  const [isEmpty, setIsEmpty] = useState(false);

  // Reveal state
  const [chosenOption, setChosenOption] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const questionStartRef = useRef(0);

  // End-screen stats
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  const [sessionStart] = useState(() => Date.now());
  const [sessionEnd, setSessionEnd] = useState(0);

  // Re-init trigger for "Play Again"
  const [initTrigger, setInitTrigger] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (loading || initialized.current) return;
    initialized.current = true;

    const init = async () => {
      let facts: AnyFact[] = [...dueItems];

      if (facts.length < 10) {
        try {
          const res = await vaultApi.getFactCatalog({ fact_type: 'mult', tier: 1 });
          const existing = new Set(facts.map(f => f.fact_id));
          const extras = res.facts
            .filter(f => !existing.has(f.fact_id))
            .sort(() => Math.random() - 0.5)
            .slice(0, 10 - facts.length);
          facts = [...facts, ...extras];
        } catch {
          // proceed with whatever we have
        }
      }

      if (facts.length === 0) {
        setIsEmpty(true);
        setPhase('done');
        return;
      }

      const take = facts.slice(0, 10).sort(() => Math.random() - 0.5);
      const sessionFacts = take.map(toSessionFact);
      setQueue(sessionFacts);
      setTotalInitial(sessionFacts.length);
      questionStartRef.current = Date.now();
      setPhase('playing');
    };

    void init();
  }, [loading, dueItems, initTrigger]);

  const handleAnswer = useCallback((chosen: number) => {
    if (phase !== 'playing' || queue.length === 0) return;

    const ms = Date.now() - questionStartRef.current;
    const current = queue[0];
    const correct = parseAnswer(current.fact);
    const isCorrect = chosen === correct;
    const factId = current.fact.fact_id;
    const ops = current.fact.operands as number[];

    void recordAttempt({
      fact_id: factId,
      fact_type: 'mult',
      operands: ops,
      answer: String(correct),
      game_id: 'mult_ladder',
      correct: isCorrect,
      ms,
    });

    setTotalAnswered(n => n + 1);
    if (isCorrect) {
      setCorrectCount(n => n + 1);
      setScore(s => s + (ms <= 3000 ? 10 : 5));
    }

    // Compute next state eagerly so the setTimeout closure is stable
    const newMissCount = { ...missCount };
    if (!isCorrect) {
      newMissCount[factId] = (newMissCount[factId] ?? 0) + 1;
    }

    const rest = queue.slice(1);
    const goesSticky = !isCorrect && (newMissCount[factId] ?? 0) >= 2;
    const isRetired = isCorrect && ms <= 3000;
    const newSticky = goesSticky ? [...stickyPile, current.fact] : [...stickyPile];
    const newRetiredCount = isRetired ? retiredCount + 1 : retiredCount;

    setMissCount(newMissCount);
    if (isRetired) setRetiredCount(newRetiredCount);
    if (goesSticky) setStickyRepFacts(prev => new Set([...prev, factId]));
    setChosenOption(chosen);
    setWasCorrect(isCorrect);
    setCorrectAnswer(correct);
    setPhase('reveal');

    setTimeout(() => {
      if (rest.length === 0 && newSticky.length > 0) {
        // Ladder exhausted — replay sticky pile
        setQueue(newSticky.map(toSessionFact));
        setStickyPile([]);
        questionStartRef.current = Date.now();
        setPhase('playing');
      } else if (rest.length === 0 && newSticky.length === 0) {
        setSessionEnd(Date.now());
        setPhase('done');
      } else {
        setQueue(rest);
        setStickyPile(newSticky);
        questionStartRef.current = Date.now();
        setPhase('playing');
      }
    }, 700);
  }, [phase, queue, missCount, stickyPile, retiredCount, recordAttempt]);

  const handlePlayAgain = useCallback(() => {
    initialized.current = false;
    setPhase('loading');
    setQueue([]);
    setStickyPile([]);
    setMissCount({});
    setRetiredCount(0);
    setStickyRepFacts(new Set());
    setChosenOption(null);
    setTotalAnswered(0);
    setCorrectCount(0);
    setScore(0);
    setIsEmpty(false);
    setSessionEnd(0);
    setInitTrigger(t => t + 1);
  }, []);

  // --------------------------------------------------------------------------
  // Loading
  // --------------------------------------------------------------------------

  if (phase === 'loading') {
    return (
      <PracticeGameLayout
        title="Multiplication Ladder"
        onBack={() => router.push('/team/practice/math')}
        mastery={stats}
      >
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
          <p className="text-ink-500">Loading your facts…</p>
        </div>
      </PracticeGameLayout>
    );
  }

  // --------------------------------------------------------------------------
  // Done
  // --------------------------------------------------------------------------

  if (phase === 'done') {
    if (isEmpty) {
      return (
        <PracticeGameLayout
          title="Multiplication Ladder"
          onBack={() => router.push('/team/practice/math')}
          mastery={stats}
        >
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
            <p className="text-ink-600 text-lg">No multiplication facts are available right now.</p>
            <p className="text-ink-400 text-sm">Come back after your teacher assigns some!</p>
            <button
              onClick={() => router.push('/team/practice/math')}
              className="mt-2 px-6 py-3 rounded-2xl bg-gold-400 text-white font-bold hover:bg-gold-500 transition-colors min-h-14"
            >
              Back to Math
            </button>
          </div>
        </PracticeGameLayout>
      );
    }

    const elapsedSec = Math.round((sessionEnd - sessionStart) / 1000);
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return (
      <PracticeGameLayout
        title="Multiplication Ladder"
        onBack={() => router.push('/team/practice/math')}
        mastery={stats}
        rightBadge={
          <span className="font-display font-bold text-lg text-ink-800">{score}</span>
        }
      >
        <div className="flex flex-col items-center gap-6 pt-4">
          <motion.h2
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-display font-bold text-3xl text-ink-800"
          >
            Ladder Complete!
          </motion.h2>

          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-sm bg-white rounded-3xl shadow-sm p-6 grid grid-cols-2 gap-5"
          >
            <div className="text-center">
              <p className="font-display font-bold text-4xl text-ink-800">{correctCount}</p>
              <p className="text-sm text-ink-500 mt-1">correct</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-4xl text-ink-800">{accuracy}%</p>
              <p className="text-sm text-ink-500 mt-1">accuracy</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-4xl text-ink-800">{timeStr}</p>
              <p className="text-sm text-ink-500 mt-1">total time</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-4xl text-coral-600">
                {stickyRepFacts.size}
              </p>
              <p className="text-sm text-ink-500 mt-1">needed extra reps</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-3 w-full max-w-sm"
          >
            <button
              onClick={handlePlayAgain}
              className="flex-1 flex items-center justify-center gap-2 min-h-14 rounded-2xl border-2 border-ink-200 bg-white font-bold text-ink-700 hover:border-gold-400 hover:bg-gold-50 transition-all active:scale-[0.97]"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
            <button
              onClick={() => router.push('/team/practice/math')}
              className="flex-1 min-h-14 rounded-2xl bg-gold-400 font-bold text-white hover:bg-gold-500 transition-colors active:scale-[0.97]"
            >
              Back to Math
            </button>
          </motion.div>
        </div>
      </PracticeGameLayout>
    );
  }

  // --------------------------------------------------------------------------
  // Playing / Reveal
  // --------------------------------------------------------------------------

  const current = queue[0];
  const ops = current.fact.operands as number[];
  const [a, b] = ops;
  const currentRung = retiredCount + 1;

  return (
    <PracticeGameLayout
      title="Multiplication Ladder"
      subtitle={`Rung ${currentRung} of ${totalInitial}`}
      onBack={() => router.push('/team/practice/math')}
      mastery={stats}
      rightBadge={
        <span className="font-display font-bold text-lg text-ink-800">{score}</span>
      }
    >
      <div className="flex gap-4 items-start">
        {/* Tower sidebar */}
        <div className="shrink-0">
          <Tower
            total={totalInitial}
            retired={retiredCount}
            stickyCount={stickyPile.length}
          />
        </div>

        {/* Question + options */}
        <div className="flex-1 flex flex-col gap-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.fact.fact_id + phase}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={`rounded-3xl p-8 text-center transition-colors duration-150 ${
                phase === 'reveal' && wasCorrect
                  ? 'bg-sage-100'
                  : phase === 'reveal' && !wasCorrect
                  ? 'bg-coral-100'
                  : 'bg-white shadow-md'
              }`}
            >
              <p className="font-display font-bold text-5xl text-ink-800 leading-relaxed">
                {a} &times; {b} ={' '}
                <span className="text-gold-500">?</span>
              </p>
              {phase === 'reveal' && !wasCorrect && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-lg font-bold text-sage-700"
                >
                  Answer: {correctAnswer}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-3">
            {current.options.map((opt) => {
              let btnState: 'idle' | 'correct' | 'wrong' | 'muted' = 'idle';
              if (phase === 'reveal') {
                if (opt === correctAnswer) btnState = 'correct';
                else if (opt === chosenOption) btnState = 'wrong';
                else btnState = 'muted';
              }
              return (
                <PracticeAnswerButton
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  disabled={phase === 'reveal'}
                  state={btnState}
                >
                  {opt}
                </PracticeAnswerButton>
              );
            })}
          </div>
        </div>
      </div>
    </PracticeGameLayout>
  );
}
