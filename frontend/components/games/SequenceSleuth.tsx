'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Check, X, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { generateSequence } from '@/lib/games/mathGenerators';

const TOTAL_ROUNDS = 10;

interface SequenceSleutProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function SequenceSleuth({ onExit }: SequenceSleutProps) {
  const [qNum, setQNum] = useState(0);
  const [q, setQ] = useState(() => generateSequence());
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');
  const inputRef = useRef<HTMLInputElement>(null);

  const userNum = parseFloat(input);
  const isCorrect = submitted && Math.abs(q.answer - userNum) < 0.001;

  const handleSubmit = () => {
    if (!input.trim()) return;
    setSubmitted(true);
    if (Math.abs(q.answer - parseFloat(input)) < 0.001) {
      const pts = q.difficulty === 'hard' ? 20 : q.difficulty === 'medium' ? 15 : 10;
      setScore(s => s + pts);
    }
  };

  const handleNext = () => {
    if (qNum + 1 >= TOTAL_ROUNDS) { setPhase('ended'); return; }
    setQNum(n => n + 1);
    setQ(generateSequence());
    setInput(''); setSubmitted(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Sequence Sleuth" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <TrendingUp className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Done!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{score}</p>
            <p className="text-ink-500 mb-6">Hard = 20pts · Medium = 15pts · Easy = 10pts</p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Sequence Sleuth" subtitle="Find the next term — then name the pattern" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between mb-5">
          <Badge variant={q.difficulty === 'hard' ? 'coral' : q.difficulty === 'medium' ? 'gold' : 'outline'}>
            {q.difficulty}
          </Badge>
          <span className="text-sm text-ink-500">{qNum + 1}/{TOTAL_ROUNDS}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={qNum} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6"><CardContent className="p-6 text-center">
              <p className="text-xs text-ink-400 uppercase tracking-wide mb-4">Complete the sequence:</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {q.terms.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && <span className="text-ink-300 font-bold">,</span>}
                    <span className="font-display text-2xl font-bold text-ink-800">{t}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="text-ink-300 font-bold">,</span>
                  <div className="w-14 h-10 border-b-4 border-gold-400 flex items-end justify-center">
                    <span className="font-display text-2xl font-bold text-gold-400">?</span>
                  </div>
                </div>
              </div>
            </CardContent></Card>

            {!submitted ? (
              <div className="space-y-4">
                <input ref={inputRef} type="number" value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="Type your answer…"
                  className="w-full p-4 border-2 border-ink-200 rounded-xl text-center font-display text-2xl font-bold text-ink-800 focus:border-gold-400 focus:outline-none" />
                <Button variant="gold" className="w-full" onClick={handleSubmit} disabled={!input.trim()}>
                  Submit Answer
                </Button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className={`p-4 rounded-xl border-2 ${isCorrect ? 'bg-sage-100 border-sage-400' : 'bg-coral-100 border-coral-400'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isCorrect ? <Check className="w-5 h-5 text-sage-600" /> : <X className="w-5 h-5 text-coral-600" />}
                    <span className="font-semibold">
                      {isCorrect ? 'Correct!' : `Answer: ${q.answer}`}
                    </span>
                    <span className="text-gold-600 ml-auto font-bold">
                      {isCorrect ? `+${q.difficulty === 'hard' ? 20 : q.difficulty === 'medium' ? 15 : 10}pts` : '+0pts'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-ink-700 mb-1">Pattern: {q.patternName}</p>
                  <p className="text-sm text-ink-600">{q.explanation}</p>
                </div>
                <Button variant="primary" className="w-full" onClick={handleNext}>
                  {qNum + 1 < TOTAL_ROUNDS ? 'Next Sequence' : 'See Results'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}
