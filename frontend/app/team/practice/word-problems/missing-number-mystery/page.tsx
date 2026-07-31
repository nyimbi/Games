'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, Search, Trophy } from 'lucide-react';
import { PracticeGameLayout, PracticeAnswerButton } from '@/components/practice';
import { vaultApi, MissingNumberItem } from '@/lib/api/vault';
import { useFactVault } from '@/lib/hooks/useVault';

type Phase = 'loading' | 'playing' | 'reveal' | 'done';

const ROUNDS = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function StoryBlank({ value, answered }: { value: number | null; answered: boolean }) {
  return (
    <span className="inline-block min-w-[3rem] px-2 border-b-4 border-gold-400 text-gold-600 font-display font-bold text-center">
      {answered && value !== null ? value : '?'}
    </span>
  );
}

function renderStory(story: string, value: number | null, answered: boolean) {
  const parts = story.split('___');
  return parts.flatMap((part, i) => {
    if (i === parts.length - 1) return [part];
    return [part, <StoryBlank key={i} value={value} answered={answered} />];
  });
}

export default function MissingNumberMysteryPage() {
  const router = useRouter();
  const { stats, recordAttempt } = useFactVault({ autoLoad: true });

  const [phase, setPhase] = useState<Phase>('loading');
  const [items, setItems] = useState<MissingNumberItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [firstTryCount, setFirstTryCount] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    vaultApi.getMissingNumberItems()
      .then(res => {
        const pool = shuffle(res.items).slice(0, ROUNDS);
        setItems(pool);
        setPhase('playing');
      })
      .catch(e => {
        setError(e instanceof Error ? e.message : 'Failed to load cases');
      });
  }, []);

  const item = items[round] ?? null;

  function handlePick(opt: number) {
    if (phase !== 'playing' || !item) return;
    const ms = Date.now() - startedAt.current;
    const correct = opt === item.answer;
    setPicked(opt);
    setIsCorrect(correct);

    const delta = correct ? (hintUsed ? 5 : 10) : -3;
    setScore(s => s + delta);

    if (correct && !hintUsed) setFirstTryCount(c => c + 1);
    if (hintUsed) setHintCount(c => c + 1);

    void recordAttempt({
      fact_id: `mystery_${item.id}`,
      fact_type: 'add',
      operands: [],
      answer: String(item.answer),
      game_id: 'missing_number_mystery',
      correct,
      ms,
    });

    setPhase('reveal');
    setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        setPhase('done');
      } else {
        setRound(r => r + 1);
        setPicked(null);
        setIsCorrect(null);
        setHintUsed(false);
        setHintVisible(false);
        startedAt.current = Date.now();
        setPhase('playing');
      }
    }, 1800);
  }

  function handleShowHint() {
    setHintUsed(true);
    setHintVisible(true);
  }

  function handlePlayAgain() {
    vaultApi.getMissingNumberItems()
      .then(res => {
        const pool = shuffle(res.items).slice(0, ROUNDS);
        setItems(pool);
        setRound(0);
        setScore(0);
        setPicked(null);
        setIsCorrect(null);
        setHintUsed(false);
        setHintVisible(false);
        setFirstTryCount(0);
        setHintCount(0);
        startedAt.current = Date.now();
        setPhase('playing');
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load cases'));
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-200 flex flex-col items-center justify-center gap-6 px-4">
        <p className="text-lg text-coral-700 font-medium text-center">{error}</p>
        <button
          onClick={() => router.push('/team/practice/word-problems')}
          className="px-6 py-3 rounded-2xl bg-ink-800 text-cream-50 font-display font-bold"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <PracticeGameLayout
      title="Missing Number Mystery"
      subtitle={phase === 'done' ? 'Case closed!' : `Case ${round + 1} of ${ROUNDS}`}
      onBack={() => router.push('/team/practice/word-problems')}
      mastery={{ sticky: stats.sticky, learning: stats.learning, mastered: stats.mastered }}
      rightBadge={
        <div className="flex items-center gap-1.5">
          <Search className="w-4 h-4 text-ink-400" />
          <span className="font-display font-bold text-lg text-gold-600">{score}</span>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <div className="w-10 h-10 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-ink-500 text-sm">Loading cases…</p>
          </motion.div>
        )}

        {(phase === 'playing' || phase === 'reveal') && item && (
          <motion.div
            key={`round-${round}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-5"
          >
            {/* Story card */}
            <div className="bg-white border-2 border-sage-200 rounded-3xl p-5 shadow-sm relative">
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gold-100 border-2 border-gold-300 flex items-center justify-center">
                <Search className="w-4 h-4 text-gold-600" />
              </div>
              <p className="text-lg md:text-xl leading-relaxed text-ink-800">
                {renderStory(item.story, picked, phase === 'reveal')}
              </p>

              {/* Reveal feedback */}
              <AnimatePresence>
                {phase === 'reveal' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 rounded-2xl px-4 py-2.5 text-sm font-medium ${
                      isCorrect
                        ? 'bg-sage-50 text-sage-800 border border-sage-200'
                        : 'bg-coral-50 text-coral-800 border border-coral-200'
                    }`}
                  >
                    {isCorrect
                      ? 'Great detective work!'
                      : `The answer is ${item.answer}. ${item.hint}`}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hint area */}
              <AnimatePresence>
                {hintVisible && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 rounded-xl bg-gold-50 border border-gold-200 px-4 py-2.5 text-sm text-ink-700"
                  >
                    <span className="font-medium text-gold-700">Hint: </span>{item.hint}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hint button */}
            {phase === 'playing' && !hintUsed && (
              <button
                onClick={handleShowHint}
                className="self-start flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-ink-600 hover:bg-gold-50 border border-ink-100 hover:border-gold-300 transition-colors"
              >
                <Lightbulb className="w-4 h-4 text-gold-500" />
                Show hint
                <span className="text-ink-400 text-xs">(+5 max)</span>
              </button>
            )}

            {/* Options 2×2 */}
            <div className="grid grid-cols-2 gap-3">
              {item.options.map(opt => {
                let btnState: 'idle' | 'correct' | 'wrong' | 'muted' = 'idle';
                if (phase === 'reveal') {
                  if (opt === item.answer) btnState = 'correct';
                  else if (opt === picked) btnState = 'wrong';
                  else btnState = 'muted';
                }
                return (
                  <PracticeAnswerButton
                    key={opt}
                    onClick={() => handlePick(opt)}
                    disabled={phase === 'reveal'}
                    state={btnState}
                    aria-label={String(opt)}
                    className="min-h-[72px] text-3xl"
                  >
                    {opt}
                  </PracticeAnswerButton>
                );
              })}
            </div>
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            <div className="w-20 h-20 rounded-full bg-gold-100 border-4 border-gold-300 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-gold-600" />
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-4xl text-ink-800">{score}</p>
              <p className="text-ink-500 mt-1">points earned</p>
            </div>

            <div className="w-full bg-white border border-sage-200 rounded-3xl p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-ink-600">Cases solved first try</span>
                <span className="font-display font-bold text-sage-700">{firstTryCount} / {ROUNDS}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-ink-600">Cases needing hints</span>
                <span className="font-display font-bold text-gold-600">{hintCount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-ink-600">Cases solved without hints</span>
                <span className="font-display font-bold text-ink-700">{ROUNDS - hintCount}</span>
              </div>
            </div>

            <div className="flex flex-col w-full gap-3">
              <button
                onClick={handlePlayAgain}
                className="w-full py-4 rounded-2xl bg-ink-800 text-cream-50 font-display font-bold text-lg"
              >
                Play Again
              </button>
              <button
                onClick={() => router.push('/team/practice/word-problems')}
                className="w-full py-3 rounded-2xl border-2 border-ink-200 text-ink-700 font-display font-bold"
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
