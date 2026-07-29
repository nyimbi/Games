'use client';
import { formatSubject } from '@/lib/utils/format';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, AlertCircle } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { FOF_STATEMENTS } from '@/lib/games/factOrFictionData';

const ROUND_SIZE = 20;

interface FactOrFictionProps {
  sessionId: string;
  isHost?: boolean;
  onExit?: () => void;
}

export function FactOrFiction({ onExit }: FactOrFictionProps) {
  const queue = useMemo(
    () => [...FOF_STATEMENTS].sort(() => Math.random() - 0.5).slice(0, ROUND_SIZE),
    []
  );
  const [index, setIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  const [correction, setCorrection] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [lastEarned, setLastEarned] = useState(0);

  const stmt = queue[index];
  const progress = (index / queue.length) * 100;

  const handleSubmit = () => {
    if (userAnswer === null) return;
    const answerCorrect = userAnswer === stmt.isTrue;
    const correctionGiven = !stmt.isTrue && correction.trim().length > 10;
    let earned = 0;
    if (answerCorrect) earned += 5;
    if (!stmt.isTrue && correctionGiven) earned += 5;
    setScore(s => s + earned);
    setLastEarned(earned);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (index + 1 >= queue.length) { setIndex(queue.length); return; }
    setIndex(i => i + 1);
    setUserAnswer(null); setCorrection(''); setSubmitted(false);
  };

  if (index >= queue.length) {
    const total = queue.length * 10;
    return (
      <GameLayout title="Fact or Fiction" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full"><CardContent className="p-8 text-center">
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Complete!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{score}<span className="text-xl text-ink-400">/{total}</span></p>
            <p className="text-ink-600 mb-6">{score >= total * 0.8 ? "Excellent WSC knowledge!" : score >= total * 0.5 ? "Good effort — keep studying!" : "Keep practising!"}</p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Fact or Fiction" subtitle={`True or false — and can you correct it? (${FOF_STATEMENTS.length} questions in the bank)`} players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline">{stmt.subject}</Badge>
          <span className="text-sm text-ink-500">{index + 1} / {queue.length}</span>
        </div>
        <Progress value={progress} className="mb-6" />

        <Card className="mb-6"><CardContent className="p-6">
          <p className="font-display text-xl text-ink-800 leading-relaxed">"{stmt.text}"</p>
        </CardContent></Card>

        {!submitted ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setUserAnswer(true)}
                className={`p-6 rounded-2xl border-2 font-bold text-xl transition-all ${userAnswer === true ? 'bg-sage-100 border-sage-500 text-sage-700' : 'bg-white border-ink-200 text-ink-600 hover:border-sage-300'}`}>
                <Check className="w-8 h-8 mx-auto mb-2" /> FACT
              </button>
              <button onClick={() => setUserAnswer(false)}
                className={`p-6 rounded-2xl border-2 font-bold text-xl transition-all ${userAnswer === false ? 'bg-coral-100 border-coral-500 text-coral-700' : 'bg-white border-ink-200 text-ink-600 hover:border-coral-300'}`}>
                <X className="w-8 h-8 mx-auto mb-2" /> FICTION
              </button>
            </div>

            <AnimatePresence>
              {userAnswer === false && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    <AlertCircle className="w-4 h-4 inline mr-1" />Correct it (+5 bonus pts if good):
                  </label>
                  <textarea value={correction} onChange={e => setCorrection(e.target.value)}
                    placeholder="Write the correct version…"
                    className="w-full p-3 border-2 border-ink-200 rounded-xl text-ink-800 focus:border-gold-400 focus:outline-none resize-none"
                    rows={3} />
                </motion.div>
              )}
            </AnimatePresence>

            <Button variant="gold" className="w-full" onClick={handleSubmit} disabled={userAnswer === null}>Submit Answer</Button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className={`p-4 rounded-xl ${userAnswer === stmt.isTrue ? 'bg-sage-100 border-2 border-sage-400' : 'bg-coral-100 border-2 border-coral-400'}`}>
              <p className="font-semibold text-lg mb-1">
                {userAnswer === stmt.isTrue ? '✓ Correct!' : '✗ Wrong!'}
                {' '}<span className="text-gold-600">+{lastEarned}pts</span>
              </p>
              <p className="text-ink-700">{stmt.explanation}</p>
            </div>
            <Button variant="primary" onClick={handleNext}>{index + 1 < queue.length ? 'Next Statement →' : 'See Results'}</Button>
          </motion.div>
        )}
      </div>
    </GameLayout>
  );
}
