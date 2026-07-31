'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { PracticeGameLayout } from '@/components/practice';
import { vaultApi } from '@/lib/api/vault';
import { aiApi } from '@/lib/api/ai';
import type { GradeStoryProblemResponse } from '@/lib/api/ai';
import { useFactVault } from '@/lib/hooks/useVault';

type Op = '+' | '-' | '×' | '÷';
type Phase = 'loading' | 'writing' | 'grading' | 'reveal' | 'done';

interface Equation {
  op: Op;
  a: number;
  b: number;
  ans: number;
}

function fmtEq(op: Op, a: number, b: number, ans: number): string {
  return `${a} ${op} ${b} = ${ans}`;
}

const ADD_SUB: Equation[] = [
  { op: '+', a: 14, b: 8, ans: 22 },
  { op: '+', a: 26, b: 17, ans: 43 },
  { op: '-', a: 20, b: 12, ans: 8 },
  { op: '-', a: 40, b: 15, ans: 25 },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function buildEquations(): Promise<Equation[]> {
  const [multRes, divRes] = await Promise.allSettled([
    vaultApi.getFactCatalog({ fact_type: 'mult', tier: 1 }),
    vaultApi.getFactCatalog({ fact_type: 'div', tier: 2 }),
  ]);

  const mults: Equation[] = [];
  const divs: Equation[] = [];

  if (multRes.status === 'fulfilled') {
    for (const f of shuffle(multRes.value.facts).slice(0, 2)) {
      const [a, b] = f.operands as number[];
      mults.push({ op: '×', a, b, ans: Number(f.answer) });
    }
  }
  if (divRes.status === 'fulfilled') {
    for (const f of shuffle(divRes.value.facts).slice(0, 2)) {
      const [a, b] = f.operands as number[];
      divs.push({ op: '÷', a, b, ans: Number(f.answer) });
    }
  }

  const addSubPick = shuffle(ADD_SUB).slice(0, 5 - mults.length - divs.length);
  return shuffle([...mults, ...divs, ...addSubPick]).slice(0, 5);
}

export default function BuildAProblemPage() {
  const router = useRouter();
  const { stats, recordAttempt } = useFactVault({ autoLoad: true });

  const [phase, setPhase] = useState<Phase>('loading');
  const [equations, setEquations] = useState<Equation[]>([]);
  const [round, setRound] = useState(0);
  const [story, setStory] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [result, setResult] = useState<GradeStoryProblemResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const startMs = useRef<number>(0);

  useEffect(() => {
    buildEquations()
      .then((eqs) => {
        setEquations(eqs);
        setPhase('writing');
      })
      .catch(() => {
        setEquations(shuffle(ADD_SUB).slice(0, 5));
        setPhase('writing');
      });
  }, []);

  const eq = equations[round];
  const eqString = eq ? fmtEq(eq.op, eq.a, eq.b, eq.ans) : '';
  const wordCount = story.trim().split(/\s+/).filter(Boolean).length;
  const tooShort = wordCount < 10;

  useEffect(() => {
    if (phase === 'writing') {
      setStory('');
      setResult(null);
      setAiError(null);
      setHintOpen(false);
      startMs.current = Date.now();
    }
  }, [phase, round]);

  const submitStory = useCallback(async () => {
    if (!eq || tooShort) return;
    setPhase('grading');
    setAiError(null);
    try {
      const res = await aiApi.gradeStoryProblem({ kid_story: story.trim(), equation: eqString });
      const elapsed = Date.now() - startMs.current;
      setResult(res);
      setTotalScore((s) => s + res.score);
      setScores((prev) => [...prev, res.score]);
      setPhase('reveal');

      const factType = eq.op === '+' ? 'add' : eq.op === '-' ? 'sub' : eq.op === '×' ? 'mult' : 'div';
      void recordAttempt({
        fact_id: `story_${eq.op}_${eq.a}_${eq.b}`,
        fact_type: factType,
        operands: [eq.a, eq.b],
        answer: String(eq.ans),
        game_id: 'build_a_problem',
        correct: res.matches_equation && res.score >= 6,
        ms: elapsed,
      });
    } catch {
      setAiError('The math tutor had a hiccup. Please try again.');
      setPhase('writing');
    }
  }, [eq, eqString, story, tooShort, recordAttempt]);

  const nextRound = useCallback(() => {
    if (round + 1 >= 5) {
      setPhase('done');
    } else {
      setRound((r) => r + 1);
      setPhase('writing');
    }
  }, [round]);

  if (phase === 'loading') {
    return (
      <PracticeGameLayout
        title="Build-a-Problem"
        subtitle="Loading equations..."
        onBack={() => router.push('/team/practice/word-problems')}
        mastery={stats}
      >
        <div className="flex justify-center items-center min-h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-sage-300 border-t-sage-700 rounded-full"
          />
        </div>
      </PracticeGameLayout>
    );
  }

  if (phase === 'done') {
    const avg = scores.length ? Math.round(totalScore / scores.length) : 0;
    return (
      <PracticeGameLayout
        title="Build-a-Problem"
        subtitle="Game complete!"
        onBack={() => router.push('/team/practice/word-problems')}
        mastery={stats}
        rightBadge={<span className="font-display font-bold text-lg text-gold-600">{totalScore}</span>}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-cream-50 border-2 border-gold-300 rounded-3xl p-8 text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="font-display text-3xl font-bold text-ink-900">Well done!</h2>
            <p className="text-ink-600 text-lg">
              You wrote stories for <span className="font-bold text-sage-700">5 equations</span>
            </p>
            <div className="flex justify-center gap-8 mt-4">
              <div className="text-center">
                <div className="font-display text-4xl font-bold text-gold-600">{totalScore}</div>
                <div className="text-sm text-ink-500">total points</div>
              </div>
              <div className="text-center">
                <div className="font-display text-4xl font-bold text-sage-700">{avg}/10</div>
                <div className="text-sm text-ink-500">average score</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-ink-700 text-sm uppercase tracking-wide">Equations you told stories for</h3>
            {equations.map((e, i) => (
              <div key={i} className="flex items-center justify-between bg-cream-50 rounded-xl px-4 py-3 border border-ink-100">
                <span className="font-display font-semibold text-sage-800">{fmtEq(e.op, e.a, e.b, e.ans)}</span>
                <span className="font-bold text-gold-600">{scores[i] ?? '—'}/10</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setRound(0);
                setTotalScore(0);
                setScores([]);
                setPhase('loading');
                buildEquations()
                  .then((eqs) => { setEquations(eqs); setPhase('writing'); })
                  .catch(() => { setEquations(shuffle(ADD_SUB).slice(0, 5)); setPhase('writing'); });
              }}
              className="flex-1 min-h-14 bg-sage-700 hover:bg-sage-800 text-cream-50 font-bold text-lg rounded-2xl transition-colors"
            >
              Play Again
            </button>
            <button
              onClick={() => router.push('/team/practice/word-problems')}
              className="flex-1 min-h-14 border-2 border-ink-200 hover:border-ink-400 text-ink-700 font-semibold text-lg rounded-2xl transition-colors"
            >
              Back
            </button>
          </div>
        </motion.div>
      </PracticeGameLayout>
    );
  }

  return (
    <PracticeGameLayout
      title="Build-a-Problem"
      subtitle={`Round ${round + 1} of 5`}
      onBack={() => router.push('/team/practice/word-problems')}
      mastery={stats}
      rightBadge={<span className="font-display font-bold text-lg text-gold-600">{totalScore}</span>}
    >
      <AnimatePresence mode="wait">
        {(phase === 'writing' || phase === 'grading') && (
          <motion.div
            key={`writing-${round}`}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            className="space-y-6"
          >
            <div className="bg-cream-50 border-2 border-sage-200 rounded-3xl p-6 space-y-6">
              <p className="text-ink-500 font-medium text-base">Write a story for:</p>
              <div className="text-center">
                <span className="text-5xl md:text-6xl font-display font-bold text-sage-800 leading-none">
                  {eqString}
                </span>
              </div>

              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                disabled={phase === 'grading'}
                placeholder="Write your story here... (3–4 sentences)"
                rows={5}
                className="w-full rounded-2xl border-2 border-ink-200 focus:border-gold-400 focus:outline-none p-4 text-lg leading-relaxed min-h-32 bg-white text-ink-900 placeholder-ink-300 disabled:opacity-60 transition-colors resize-none"
              />

              {tooShort && story.trim().length > 0 && (
                <p className="text-coral-600 text-sm font-medium">
                  Add more detail — try to write at least 10 words ({wordCount} so far).
                </p>
              )}

              <div>
                <button
                  onClick={() => setHintOpen((o) => !o)}
                  className="text-sm font-medium text-sage-700 underline underline-offset-2"
                >
                  {hintOpen ? 'Hide ideas' : 'Need ideas?'}
                </button>
                <AnimatePresence>
                  {hintOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-2 text-ink-500 text-sm leading-relaxed bg-cream-100 rounded-xl p-3">
                        Think about: sharing equally, making groups, how many times something happens,
                        taking away, adding more items together, splitting a collection...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {aiError && (
                <div className="bg-coral-50 border border-coral-300 rounded-xl p-3 flex items-center justify-between gap-3">
                  <p className="text-coral-700 text-sm">{aiError}</p>
                  <button
                    onClick={submitStory}
                    className="text-sm font-bold text-coral-700 underline underline-offset-2 shrink-0"
                  >
                    Retry
                  </button>
                </div>
              )}

              <button
                onClick={submitStory}
                disabled={tooShort || phase === 'grading'}
                className="w-full min-h-14 bg-sage-700 hover:bg-sage-800 disabled:bg-ink-200 disabled:text-ink-400 text-cream-50 font-bold text-lg rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                {phase === 'grading' ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block w-5 h-5 border-2 border-cream-300 border-t-cream-50 rounded-full"
                    />
                    The math tutor is reading your story...
                  </>
                ) : (
                  'Submit for grading'
                )}
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'reveal' && result && (
          <motion.div
            key={`reveal-${round}`}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            className="space-y-5"
          >
            <div className="text-center">
              <span className="text-5xl md:text-6xl font-display font-bold text-sage-800">{eqString}</span>
            </div>

            <div className={`rounded-3xl border-2 p-6 space-y-4 ${result.score >= 7 ? 'border-gold-300 bg-gold-50' : 'border-ink-200 bg-cream-50'}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-ink-800">Your story</h3>
                <div className="flex items-center gap-1">
                  <span className="font-display font-bold text-3xl text-gold-600">{result.score}</span>
                  <span className="text-ink-400 font-medium">/10</span>
                </div>
              </div>

              <p className="text-ink-700 leading-relaxed italic">"{story.trim()}"</p>

              {result.score >= 7 && (
                <div className="text-2xl text-center">🌟</div>
              )}

              <p className="text-ink-600 text-sm leading-relaxed">{result.feedback}</p>
            </div>

            <div className="rounded-3xl border-2 border-sage-200 bg-cream-50 p-6 space-y-3">
              <h3 className="font-display font-bold text-base text-sage-800">
                {result.score >= 7 ? 'Another way to tell it:' : 'Here\'s one way to tell it:'}
              </h3>
              <p className="text-ink-600 leading-relaxed italic">"{result.example_story}"</p>
            </div>

            <button
              onClick={nextRound}
              className="w-full min-h-14 bg-sage-700 hover:bg-sage-800 text-cream-50 font-bold text-lg rounded-2xl transition-colors"
            >
              {round + 1 >= 5 ? 'See my results' : 'Next equation →'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </PracticeGameLayout>
  );
}
