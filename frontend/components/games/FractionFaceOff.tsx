'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { generateFractionSet, type FractionItem } from '@/lib/games/mathGenerators';

const TOTAL_ROUNDS = 10;

function newRound() {
  const s = generateFractionSet();
  return { set: s, order: [...s.items] as FractionItem[] };
}

interface FractionFaceOffProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function FractionFaceOff({ onExit }: FractionFaceOffProps) {
  const [qNum, setQNum] = useState(0);
  const [round, setRound] = useState(newRound);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');

  const { set, order } = round;
  const setOrder = (o: FractionItem[]) => setRound(r => ({ ...r, order: o }));
  const correct = [...set.items].sort((a, b) => a.value - b.value);

  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...order];
    [next[i-1], next[i]] = [next[i], next[i-1]];
    setOrder(next);
  };
  const moveDown = (i: number) => {
    if (i === order.length - 1) return;
    const next = [...order];
    [next[i], next[i+1]] = [next[i+1], next[i]];
    setOrder(next);
  };

  const handleSubmit = () => {
    const matches = order.filter((item, i) => Math.abs(item.value - correct[i].value) < 0.0001).length;
    const pts = set.difficulty === 'hard' ? (matches === order.length ? 20 : matches >= 3 ? 12 : 5)
               : set.difficulty === 'medium' ? (matches === order.length ? 15 : matches >= 3 ? 8 : 3)
               : (matches === order.length ? 10 : matches >= 3 ? 5 : 2);
    setScore(s => s + pts);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (qNum + 1 >= TOTAL_ROUNDS) { setPhase('ended'); return; }
    setQNum(n => n + 1);
    setRound(newRound());
    setSubmitted(false);
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Fraction Face-Off" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Done!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{score}<span className="text-xl text-ink-400">/{TOTAL_ROUNDS * 20}</span></p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Fraction Face-Off" subtitle="Sort from SMALLEST to LARGEST — use arrows" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between mb-5">
          <Badge variant={set.difficulty === 'hard' ? 'coral' : set.difficulty === 'medium' ? 'gold' : 'outline'}>
            {set.difficulty}
          </Badge>
          <span className="text-sm text-ink-500">{qNum + 1}/{TOTAL_ROUNDS} · Score: <strong>{score}</strong></span>
        </div>

        <p className="text-xs text-ink-400 text-center mb-3 uppercase tracking-wide">
          ← smallest · · · · · largest →
        </p>

        <AnimatePresence mode="wait">
          <motion.div key={qNum} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div className="space-y-2 mb-6">
              {order.map((item, i) => {
                const isCorrect = submitted && Math.abs(item.value - correct[i].value) < 0.0001;
                const isWrong = submitted && !isCorrect;
                return (
                  <motion.div key={item.display + i} layout
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                      isCorrect ? 'bg-sage-100 border-sage-400'
                      : isWrong ? 'bg-coral-50 border-coral-300'
                      : 'bg-white border-ink-200'
                    }`}>
                    <span className="w-7 h-7 rounded-full bg-ink-100 text-ink-500 text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 font-display text-2xl font-bold text-ink-800 text-center">{item.display}</span>
                    {!submitted && (
                      <div className="flex flex-col gap-1">
                        <button onClick={() => moveUp(i)} disabled={i === 0} className="text-ink-400 hover:text-ink-700 disabled:opacity-20">▲</button>
                        <button onClick={() => moveDown(i)} disabled={i === order.length - 1} className="text-ink-400 hover:text-ink-700 disabled:opacity-20">▼</button>
                      </div>
                    )}
                    {submitted && isCorrect && <Check className="w-5 h-5 text-sage-600 flex-shrink-0" />}
                    {submitted && isWrong && (
                      <span className="text-xs text-ink-400 flex-shrink-0">({correct[i].display})</span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {!submitted ? (
              <Button variant="gold" className="w-full" onClick={handleSubmit}>Submit Order</Button>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <p className="text-center text-ink-600 text-sm">
                  Correct: {correct.map(c => c.display).join(' &lt; ')}
                </p>
                <Button variant="primary" className="w-full" onClick={handleNext}>
                  {qNum + 1 < TOTAL_ROUNDS ? 'Next Set' : 'See Results'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}
