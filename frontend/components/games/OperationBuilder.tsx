'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Equal, Check, X, ChevronRight, RotateCcw } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { GameLayout } from './GameLayout';

interface Slot { type: 'number' | 'op'; value?: number; }

interface Puzzle {
  slots: Slot[];
  target: number;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

function evalSlots(slots: Slot[], ops: string[]): number {
  let expr = '';
  let opIdx = 0;
  for (const s of slots) {
    if (s.type === 'number') expr += s.value;
    else { expr += ops[opIdx++] ?? '?'; }
  }
  try { return Function('"use strict"; return (' + expr + ')')(); } catch { return NaN; }
}

function countOps(slots: Slot[]): number {
  return slots.filter(s => s.type === 'op').length;
}

const PUZZLES: Puzzle[] = [
  // easy
  { difficulty: 'easy', target: 10, hint: "5 _ 5 = 10", slots: [{type:'number',value:5},{type:'op'},{type:'number',value:5}] },
  { difficulty: 'easy', target: 20, hint: "4 _ 5 = 20", slots: [{type:'number',value:4},{type:'op'},{type:'number',value:5}] },
  { difficulty: 'easy', target: 3, hint: "12 _ 4 = 3", slots: [{type:'number',value:12},{type:'op'},{type:'number',value:4}] },
  { difficulty: 'easy', target: 7, hint: "15 _ 8 = 7", slots: [{type:'number',value:15},{type:'op'},{type:'number',value:8}] },
  // medium
  { difficulty: 'medium', target: 14, hint: "3 _ 4 _ 2 = 14", slots: [{type:'number',value:3},{type:'op'},{type:'number',value:4},{type:'op'},{type:'number',value:2}] },
  { difficulty: 'medium', target: 8, hint: "10 _ 2 _ 3 = 8", slots: [{type:'number',value:10},{type:'op'},{type:'number',value:2},{type:'op'},{type:'number',value:3}] },
  { difficulty: 'medium', target: 25, hint: "5 _ 3 _ 10 = 25", slots: [{type:'number',value:5},{type:'op'},{type:'number',value:3},{type:'op'},{type:'number',value:10}] },
  { difficulty: 'medium', target: 100, hint: "4 _ 5 _ 5 _ 20 = 100", slots: [{type:'number',value:4},{type:'op'},{type:'number',value:5},{type:'op'},{type:'number',value:5},{type:'op'},{type:'number',value:20}] },
  { difficulty: 'medium', target: 1, hint: "9 _ 9 _ 9 = 1 (use ÷ and −)", slots: [{type:'number',value:9},{type:'op'},{type:'number',value:9},{type:'op'},{type:'number',value:9}] },
  // hard
  { difficulty: 'hard', target: 32, hint: "(5 _ 3) _ 4 = 32", slots: [{type:'number',value:5},{type:'op'},{type:'number',value:3},{type:'op'},{type:'number',value:4}] },
  { difficulty: 'hard', target: 7, hint: "2 _ 3 _ 5 _ 4 = 7 (mixed)", slots: [{type:'number',value:2},{type:'op'},{type:'number',value:3},{type:'op'},{type:'number',value:5},{type:'op'},{type:'number',value:4}] },
  { difficulty: 'hard', target: 12, hint: "36 _ 4 _ 3 _ 3 = 12", slots: [{type:'number',value:36},{type:'op'},{type:'number',value:4},{type:'op'},{type:'number',value:3},{type:'op'},{type:'number',value:3}] },
];

const OPS = ['+', '−', '×', '÷'];
const OP_MAP: Record<string, string> = { '+': '+', '−': '-', '×': '*', '÷': '/' };

const SOLUTIONS: Record<number, string[][]> = {
  10: [['+']],
  20: [['×']],
  3: [['÷']],
  7: [['−']],
  14: [['×', '+']],
  8: [['÷', '+']],
  25: [['×', '+']],
  100: [['×', '×', '+']],
  1: [['÷', '−']],
  32: [['+', '×']],
  15: [['×', '+', '−']],
  12: [['÷', '÷', '+']],
};

interface OperationBuilderProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function OperationBuilder({ onExit }: OperationBuilderProps) {
  const [queue] = useState(() => [...PUZZLES].sort(() => Math.random() - 0.5).slice(0, 8));
  const [index, setIndex] = useState(0);
  const [ops, setOps] = useState<string[]>(() => Array(countOps(PUZZLES[0].slots)).fill('+'));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');

  const q = queue[index];
  const numOps = countOps(q.slots);
  const result = evalSlots(q.slots, ops.map(o => OP_MAP[o]));
  const isCorrect = Math.abs(result - q.target) < 0.0001;

  const cycleOp = (i: number) => {
    if (submitted) return;
    setOps(prev => {
      const next = [...prev];
      const idx = OPS.indexOf(next[i]);
      next[i] = OPS[(idx + 1) % OPS.length];
      return next;
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (isCorrect) {
      const pts = q.difficulty === 'hard' ? 20 : q.difficulty === 'medium' ? 15 : 10;
      setScore(s => s + pts);
    }
  };

  const handleNext = () => {
    if (index + 1 >= queue.length) { setPhase('ended'); return; }
    const next = index + 1;
    setIndex(next);
    setOps(Array(countOps(queue[next].slots)).fill('+'));
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

  let opIdx = -1;
  return (
    <GameLayout title="Operation Builder" subtitle="Click operators to cycle through +, −, ×, ÷" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between mb-5">
          <Badge variant={q.difficulty === 'hard' ? 'coral' : q.difficulty === 'medium' ? 'gold' : 'outline'}>
            {q.difficulty}
          </Badge>
          <span className="text-sm text-ink-500">{index + 1}/{queue.length} · Score: <strong>{score}</strong></span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6"><CardContent className="p-8">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {q.slots.map((slot, i) => {
                  if (slot.type === 'number') {
                    return (
                      <span key={i} className="font-display text-3xl font-bold text-ink-800">{slot.value}</span>
                    );
                  } else {
                    opIdx++;
                    const oi = opIdx;
                    return (
                      <motion.button key={i} onClick={() => cycleOp(oi)} whileTap={{ scale: 0.9 }}
                        className={`w-12 h-12 rounded-xl font-bold text-xl border-2 transition-all ${
                          submitted ? (isCorrect ? 'bg-sage-200 border-sage-400 text-sage-800' : 'bg-coral-200 border-coral-400 text-coral-800')
                          : 'bg-gold-100 border-gold-400 text-gold-800 hover:bg-gold-200 cursor-pointer'
                        }`}>
                        {ops[oi]}
                      </motion.button>
                    );
                  }
                })}
                <span className="font-display text-3xl font-bold text-ink-400">=</span>
                <span className={`font-display text-3xl font-bold ${
                  !isNaN(result) && Math.abs(result - q.target) < 0.0001 ? 'text-sage-600'
                  : !isNaN(result) ? 'text-coral-600' : 'text-ink-400'
                }`}>
                  {isNaN(result) ? '?' : Number.isInteger(result) ? result : result.toFixed(2)}
                </span>
                <span className="font-display text-3xl font-bold text-ink-400">
                  (target: <span className="text-gold-600">{q.target}</span>)
                </span>
              </div>
              {q.hint && !submitted && (
                <p className="text-xs text-ink-400 text-center mt-4">Hint: {q.hint}</p>
              )}
            </CardContent></Card>

            {!submitted ? (
              <Button variant="gold" className="w-full" onClick={handleSubmit} disabled={!isCorrect}>
                {isCorrect ? '✓ Submit' : 'Keep adjusting…'}
              </Button>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className={`p-4 rounded-xl border-2 text-center ${isCorrect ? 'bg-sage-100 border-sage-400' : 'bg-coral-100 border-coral-400'}`}>
                  {isCorrect
                    ? <p className="font-semibold text-sage-800">✓ Correct! +{q.difficulty === 'hard' ? 20 : q.difficulty === 'medium' ? 15 : 10}pts</p>
                    : <p className="font-semibold text-coral-800">Not quite — the target was {q.target}</p>
                  }
                </div>
                <Button variant="primary" className="w-full" onClick={handleNext}>
                  {index + 1 < queue.length ? 'Next Puzzle' : 'See Results'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}
