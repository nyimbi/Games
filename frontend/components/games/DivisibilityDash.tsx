'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ChevronRight, Zap } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';

const DIVISORS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
type Divisor = typeof DIVISORS[number];

function getDivisors(n: number): Divisor[] {
  return DIVISORS.filter(d => n % d === 0);
}

function makeNumber(): number {
  // Weighted selection — more interesting numbers
  const pool = [
    12, 18, 24, 30, 36, 42, 45, 48, 54, 56, 60, 63, 66, 70, 72, 77, 84, 88,
    90, 96, 99, 100, 105, 110, 112, 120, 126, 132, 135, 140, 144, 150, 154,
    160, 168, 176, 180, 189, 198, 200, 210, 216, 220, 225, 231, 240, 252,
    264, 270, 280, 288, 300, 315, 330, 336, 360, 378, 396, 400, 420,
    // some tricky ones
    37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, // primes (no divisors from list except 1)
    14, 21, 28, 35, 49, 77, 91, 119, 133, // multiples of 7
    11, 22, 33, 44, 55, 66, 77, 88, 99, 110, 121, // multiples of 11
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

interface DivisibilityDashProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function DivisibilityDash({ onExit }: DivisibilityDashProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'ended'>('intro');
  const [current, setCurrent] = useState(makeNumber);
  const [selected, setSelected] = useState<Set<Divisor>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [questionsLeft, setQuestionsLeft] = useState(12);
  const [timeLeft, setTimeLeft] = useState(20);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const correct = getDivisors(current);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current!);
    setTimeLeft(20);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); autoSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
  }, []);

  const autoSubmit = useCallback(() => {
    clearInterval(timerRef.current!);
    setSubmitted(true);
    setStreak(0);
    setLastCorrect(false);
    setTimeout(advance, 1800);
  }, []);

  const advance = useCallback(() => {
    setQuestionsLeft(q => {
      if (q <= 1) { setPhase('ended'); return 0; }
      setCurrent(makeNumber());
      setSelected(new Set());
      setSubmitted(false);
      setLastCorrect(null);
      return q - 1;
    });
  }, []);

  useEffect(() => {
    if (phase === 'playing' && !submitted) startTimer();
    return () => clearInterval(timerRef.current!);
  }, [phase, current]);

  const toggle = (d: Divisor) => {
    if (submitted) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  };

  const handleSubmit = () => {
    clearInterval(timerRef.current!);
    const sel = [...selected].sort((a,b)=>a-b);
    const ans = [...correct].sort((a,b)=>a-b);
    const perfect = sel.length === ans.length && sel.every((v, i) => v === ans[i]);
    const partialScore = DIVISORS.reduce((acc, d) => {
      const shouldSelect = correct.includes(d);
      const didSelect = selected.has(d);
      if (shouldSelect && didSelect) return acc + 2;
      if (!shouldSelect && !didSelect) return acc + 1;
      return acc - 1;
    }, 0);
    const earnedBase = Math.max(partialScore, 0);
    const multiplier = perfect ? Math.min(streak + 1, 4) : 1;
    const earned = earnedBase * multiplier;
    setScore(s => s + earned);
    setStreak(perfect ? (streak + 1) : 0);
    setLastCorrect(perfect);
    setSubmitted(true);
    setTimeout(advance, 2200);
  };

  if (phase === 'intro') {
    return (
      <GameLayout title="Divisibility Dash" subtitle="How fast can you apply divisibility rules?" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8">
            <h2 className="font-display text-xl font-bold text-ink-800 mb-4">Quick rules reminder:</h2>
            <div className="space-y-1 text-sm text-ink-700 mb-6">
              <p><strong>÷2:</strong> Last digit is even (0,2,4,6,8)</p>
              <p><strong>÷3:</strong> Digit sum divisible by 3</p>
              <p><strong>÷4:</strong> Last 2 digits divisible by 4</p>
              <p><strong>÷5:</strong> Ends in 0 or 5</p>
              <p><strong>÷6:</strong> Divisible by both 2 and 3</p>
              <p><strong>÷7:</strong> No easy rule — just divide!</p>
              <p><strong>÷8:</strong> Last 3 digits divisible by 8</p>
              <p><strong>÷9:</strong> Digit sum divisible by 9</p>
              <p><strong>÷10:</strong> Ends in 0</p>
              <p><strong>÷11:</strong> Alternating digit sum divisible by 11</p>
            </div>
            <Button variant="gold" className="w-full" onClick={() => setPhase('playing')}>Start!</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  if (phase === 'ended') {
    return (
      <GameLayout title="Divisibility Dash" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <Zap className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Done!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{score}</p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Divisibility Dash" subtitle="Select ALL divisors that apply, then submit" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gold-500" />
            <span className="text-sm font-medium text-ink-700">{score} pts</span>
            {streak > 1 && <Badge variant="gold">×{Math.min(streak, 4)} streak</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-500">{questionsLeft} left</span>
            <span className={`font-mono font-bold text-xl ${timeLeft <= 5 ? 'text-coral-600' : 'text-ink-700'}`}>{timeLeft}s</span>
          </div>
        </div>
        <Progress value={(timeLeft / 20) * 100} className="mb-5 h-2" />

        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className={`mb-5 p-6 rounded-2xl text-center border-2 transition-colors ${
              submitted
                ? lastCorrect ? 'bg-sage-100 border-sage-400' : 'bg-coral-50 border-coral-300'
                : 'bg-white border-ink-200 shadow-md'
            }`}>
              <p className="font-display text-6xl font-bold text-ink-800">{current}</p>
            </div>

            <div className="grid grid-cols-5 gap-2 mb-4">
              {DIVISORS.map(d => {
                const isSelected = selected.has(d);
                const isCorrectDivisor = correct.includes(d);
                const revealCorrect = submitted && isCorrectDivisor;
                const revealWrong = submitted && isSelected && !isCorrectDivisor;
                return (
                  <button key={d} onClick={() => toggle(d)}
                    className={`h-14 rounded-xl font-bold text-lg border-2 transition-all ${
                      revealCorrect ? 'bg-sage-200 border-sage-500 text-sage-900'
                      : revealWrong ? 'bg-coral-200 border-coral-400 text-coral-800'
                      : isSelected ? 'bg-gold-200 border-gold-500 text-gold-900 scale-95'
                      : 'bg-white border-ink-200 hover:border-gold-300 text-ink-700'
                    }`}>
                    ÷{d}
                  </button>
                );
              })}
            </div>

            {submitted && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`p-3 rounded-xl text-sm text-center mb-3 ${lastCorrect ? 'bg-sage-50 text-sage-800' : 'bg-coral-50 text-coral-800'}`}>
                {correct.length === 0
                  ? `${current} is not divisible by any of the listed divisors.`
                  : `Divisors of ${current}: ${correct.map(d => `÷${d}`).join(', ')}`}
              </motion.div>
            )}

            {!submitted && (
              <Button variant="gold" className="w-full" onClick={handleSubmit}>
                Submit
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}
