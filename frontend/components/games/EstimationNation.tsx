'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { GameLayout } from './GameLayout';

interface EstimationQ {
  question: string;
  answer: number;
  unit: string;
  context: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const QUESTIONS: EstimationQ[] = [
  { difficulty: 'easy', question: "How many seconds are in one hour?", answer: 3600, unit: "seconds", context: "60 minutes × 60 seconds = 3,600 seconds." },
  { difficulty: 'easy', question: "How many centimetres in one metre?", answer: 100, unit: "cm", context: "1 m = 100 cm — a fundamental metric conversion." },
  { difficulty: 'easy', question: "What is 15% of 200?", answer: 30, unit: "", context: "15% × 200 = 0.15 × 200 = 30." },
  { difficulty: 'easy', question: "Approximately, what is √144?", answer: 12, unit: "", context: "12 × 12 = 144." },
  { difficulty: 'easy', question: "How many days in a non-leap year?", answer: 365, unit: "days", context: "365 days in a standard year; 366 in a leap year." },
  { difficulty: 'medium', question: "How many seconds are in a day?", answer: 86400, unit: "seconds", context: "24 × 60 × 60 = 86,400 seconds." },
  { difficulty: 'medium', question: "What is 17% of 850?", answer: 144.5, unit: "", context: "0.17 × 850 = 144.5" },
  { difficulty: 'medium', question: "Approximately how many times does a healthy human heart beat per day?", answer: 100000, unit: "beats", context: "~70 beats/min × 1440 min/day ≈ 100,800. Accept 80,000–120,000." },
  { difficulty: 'medium', question: "Approximately what is √2 to two decimal places?", answer: 1.41, unit: "", context: "√2 ≈ 1.4142… — often approximated as 1.41." },
  { difficulty: 'medium', question: "How many millimetres in one kilometre?", answer: 1000000, unit: "mm", context: "1 km = 1000 m = 1,000,000 mm." },
  { difficulty: 'medium', question: "What is the approximate value of π to 5 decimal places?", answer: 3.14159, unit: "", context: "π ≈ 3.14159265…" },
  { difficulty: 'hard', question: "Approximately how many litres of blood does the human heart pump per day?", answer: 7200, unit: "litres", context: "~5 litres/min × 1440 min = 7,200 litres per day." },
  { difficulty: 'hard', question: "Approximately how many times does Earth orbit the Sun in 100 years?", answer: 100, unit: "orbits", context: "Earth completes one orbit per year, so 100 orbits in 100 years." },
  { difficulty: 'hard', question: "If a stack of 500 sheets of paper is 5 cm thick, how thick is one sheet in mm?", answer: 0.1, unit: "mm", context: "5 cm ÷ 500 = 0.01 cm = 0.1 mm per sheet." },
  { difficulty: 'hard', question: "What is 2^10 (2 to the power of 10)?", answer: 1024, unit: "", context: "2^10 = 1024 — the origin of the 'kilo' in computing." },
  { difficulty: 'hard', question: "Approximately what percentage of the Earth's surface is covered by water?", answer: 71, unit: "%", context: "About 71% of Earth's surface is water (mostly oceans)." },
];

function score(guess: number, answer: number): { pts: number; pct: number } {
  if (answer === 0) return { pts: guess === 0 ? 20 : 0, pct: guess === 0 ? 100 : 0 };
  const ratio = Math.abs(guess - answer) / Math.abs(answer);
  if (ratio <= 0.01) return { pts: 20, pct: 100 };
  if (ratio <= 0.05) return { pts: 17, pct: 85 };
  if (ratio <= 0.10) return { pts: 14, pct: 70 };
  if (ratio <= 0.20) return { pts: 10, pct: 50 };
  if (ratio <= 0.50) return { pts: 5, pct: 25 };
  return { pts: 0, pct: 0 };
}

interface EstimationNationProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function EstimationNation({ onExit }: EstimationNationProps) {
  const [queue] = useState(() => [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10));
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [lastResult, setLastResult] = useState<{ pts: number; pct: number } | null>(null);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');
  const inputRef = useRef<HTMLInputElement>(null);

  const q = queue[index];

  const handleSubmit = () => {
    const val = parseFloat(input);
    if (isNaN(val)) return;
    const result = score(val, q.answer);
    setLastResult(result);
    setTotalScore(s => s + result.pts);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (index + 1 >= queue.length) { setPhase('ended'); return; }
    setIndex(i => i + 1);
    setInput(''); setSubmitted(false); setLastResult(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Estimation Nation" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Done!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{totalScore}<span className="text-xl text-ink-400">/{queue.length * 20}</span></p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Estimation Nation" subtitle="No need to be exact — scored by how close you are" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between mb-5">
          <Badge variant={q.difficulty === 'hard' ? 'coral' : q.difficulty === 'medium' ? 'gold' : 'outline'}>
            {q.difficulty}
          </Badge>
          <span className="text-sm text-ink-500">{index + 1}/{queue.length} · Score: <strong>{totalScore}</strong></span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6"><CardContent className="p-6 text-center">
              <p className="font-display text-xl font-semibold text-ink-800 leading-relaxed">{q.question}</p>
              {q.unit && <p className="text-sm text-ink-400 mt-2">Answer in: <strong>{q.unit}</strong></p>}
            </CardContent></Card>

            <div className="mb-4 text-xs text-ink-400 text-center">
              ≤1% off: 20pts · ≤5%: 17 · ≤10%: 14 · ≤20%: 10 · ≤50%: 5 · Further: 0
            </div>

            {!submitted ? (
              <div className="space-y-4">
                <input ref={inputRef} type="number" step="any" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="Your estimate…"
                  className="w-full p-4 border-2 border-ink-200 rounded-xl text-center font-display text-2xl font-bold text-ink-800 focus:border-gold-400 focus:outline-none" />
                <Button variant="gold" className="w-full" onClick={handleSubmit} disabled={!input.trim()}>
                  Submit Estimate
                </Button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {/* Score bar */}
                <div className={`p-4 rounded-xl border-2 ${lastResult!.pct >= 70 ? 'bg-sage-100 border-sage-400' : lastResult!.pct >= 40 ? 'bg-gold-100 border-gold-400' : 'bg-coral-100 border-coral-400'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Your guess: {parseFloat(input).toLocaleString()} {q.unit}</span>
                    <span className="font-bold text-gold-600">+{lastResult!.pts}pts</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">Exact answer: {q.answer.toLocaleString()} {q.unit}</span>
                    <span className="text-sm text-ink-500">{lastResult!.pct}% score</span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-gold-400 rounded-full transition-all" style={{ width: `${lastResult!.pct}%` }} />
                  </div>
                </div>
                <p className="text-sm text-ink-600 p-3 bg-cream-100 rounded-xl">{q.context}</p>
                <Button variant="primary" className="w-full" onClick={handleNext}>
                  {index + 1 < queue.length ? 'Next Question' : 'See Results'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}
