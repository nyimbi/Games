'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Equal, Check, X, ChevronRight, RotateCcw } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { generateOperationPuzzle } from '@/lib/games/mathGenerators';

const TOTAL_ROUNDS = 10;
const OP_CYCLE = ['+', '−', '×', '÷'];
const OP_JS: Record<string, string> = { '+': '+', '−': '-', '×': '*', '÷': '/' };

function evalOps(nums: number[], ops: string[]): number {
  let expr = String(nums[0]);
  for (let i = 0; i < ops.length; i++) {
    expr += (OP_JS[ops[i]] ?? '+') + String(nums[i + 1]);
  }
  try { return Function('"use strict"; return (' + expr + ')')(); } catch { return NaN; }
}

function cycleOp(op: string): string {
  const idx = OP_CYCLE.indexOf(op);
  return OP_CYCLE[(idx + 1) % OP_CYCLE.length];
}

function newQ() {
  const p = generateOperationPuzzle();
  return { puzzle: p, ops: new Array(p.numbers.length - 1).fill('+') as string[] };
}

interface OperationBuilderProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function OperationBuilder({ onExit }: OperationBuilderProps) {
  const [qNum, setQNum] = useState(0);
  const [{ puzzle: q, ops }, setQState] = useState(newQ);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');

  const setOps = (o: string[]) => setQState(s => ({ ...s, ops: o }));

  const currentResult = evalOps(q.numbers, ops);
  const isMatch = Math.abs(currentResult - q.target) < 0.0001;
  const isCorrect = submitted && isMatch;

  const handleToggleOp = (i: number) => {
    if (submitted) return;
    const next = [...ops];
    next[i] = cycleOp(next[i]);
    setOps(next);
  };

  const handleSubmit = () => {
    if (!isMatch) return;
    setSubmitted(true);
    setScore(s => s + q.points);
  };

  const handleSkip = () => {
    setSubmitted(true); // reveal without points
  };

  const handleNext = () => {
    if (qNum + 1 >= TOTAL_ROUNDS) { setPhase('ended'); return; }
    setQNum(n => n + 1);
    setQState(newQ());
    setSubmitted(false);
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Operation Builder" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <Equal className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Done!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{score}</p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Operation Builder" subtitle="Click operators to cycle +  −  ×  ÷ until the expression equals the target" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between mb-5">
          <Badge variant={q.difficulty === 'hard' ? 'coral' : q.difficulty === 'medium' ? 'gold' : 'outline'}>
            {q.difficulty}
          </Badge>
          <span className="text-sm text-ink-500">{qNum + 1}/{TOTAL_ROUNDS} · Score: <strong>{score}</strong></span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={qNum} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            {/* Target */}
            <Card className="mb-6 bg-gold-50 border-gold-200"><CardContent className="p-5 text-center">
              <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">Target</p>
              <p className="font-display text-5xl font-bold text-gold-700">{q.target}</p>
            </CardContent></Card>

            {/* Expression builder */}
            <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
              {q.numbers.map((n, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white border-2 border-ink-200 flex items-center justify-center">
                    <span className="font-display text-2xl font-bold text-ink-800">{n}</span>
                  </div>
                  {i < ops.length && (
                    <button onClick={() => handleToggleOp(i)}
                      className={`w-12 h-12 rounded-xl border-2 font-bold text-xl transition-all ${
                        submitted ? 'cursor-default border-ink-100 bg-cream-100 text-ink-400'
                        : 'border-gold-300 bg-gold-100 text-gold-800 hover:bg-gold-200 active:scale-95'
                      }`}>
                      {ops[i]}
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-bold text-ink-400">=</span>
                <div className={`w-16 h-14 rounded-xl border-2 flex items-center justify-center transition-colors ${
                  isMatch ? 'bg-sage-100 border-sage-400' : 'bg-white border-ink-200'
                }`}>
                  <span className={`font-display text-2xl font-bold ${isMatch ? 'text-sage-700' : 'text-ink-400'}`}>
                    {Number.isFinite(currentResult) ? currentResult : '?'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-ink-400 mb-4">
              Tap an operator to cycle through +  −  ×  ÷
            </p>

            {!submitted ? (
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={handleSkip}>
                  Give up (reveal)
                </Button>
                <Button variant="gold" className="flex-1" onClick={handleSubmit} disabled={!isMatch}>
                  <Check className="w-4 h-4 mr-1" /> Submit!
                </Button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className={`p-4 rounded-xl border-2 text-center ${isCorrect ? 'bg-sage-100 border-sage-400' : 'bg-coral-50 border-coral-300'}`}>
                  <p className="font-semibold">
                    {isCorrect ? `✓ Correct! +${q.points}pts` : 'Solution:'}
                  </p>
                  <p className="font-display text-lg font-bold mt-1">
                    {q.numbers.map((n, i) => i < q.correctOps.length ? `${n} ${q.correctOps[i]} ` : n).join('')} = {q.target}
                  </p>
                </div>
                <Button variant="primary" className="w-full" onClick={handleNext}>
                  {qNum + 1 < TOTAL_ROUNDS ? 'Next Puzzle' : 'See Results'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}
