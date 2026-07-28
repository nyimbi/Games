'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Star, RotateCcw } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function makeQuestion(table: number | 'random') {
  const a = table === 'random' ? Math.floor(Math.random() * 11) + 2 : table;
  const b = Math.floor(Math.random() * 12) + 1;
  const answer = a * b;
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const w = answer + (Math.floor(Math.random() * 10) - 5);
    if (w !== answer && w > 0) wrongs.add(w);
  }
  return { a, b, answer, options: shuffle([answer, ...Array.from(wrongs)]) };
}

interface TimesTableBlitzProps {
  sessionId: string;
  isHost?: boolean;
  onExit?: () => void;
}

export function TimesTableBlitz({ onExit }: TimesTableBlitzProps) {
  const [table, setTable] = useState<number | 'random' | null>(null);
  const [q, setQ] = useState(() => makeQuestion(2));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [total, setTotal] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [phase, setPhase] = useState<'select' | 'playing' | 'ended'>('select');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); setPhase('ended'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  const startGame = (t: number | 'random') => {
    setTable(t);
    setQ(makeQuestion(t));
    setScore(0); setStreak(0); setBest(0); setTotal(0); setCorrect(0);
    setTimeLeft(60); setPhase('playing');
  };

  const handleAnswer = useCallback((chosen: number) => {
    if (feedback) return;
    const isCorrect = chosen === q.answer;
    setTotal(n => n + 1);
    if (isCorrect) {
      const newStreak = streak + 1;
      const multiplier = Math.min(Math.floor(newStreak / 3) + 1, 5);
      const earned = 10 * multiplier;
      setScore(s => s + earned);
      setStreak(newStreak);
      setBest(b => Math.max(b, newStreak));
      setCorrect(c => c + 1);
    } else {
      setStreak(0);
    }
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => {
      setFeedback(null);
      setQ(makeQuestion(table!));
    }, 400);
  }, [q.answer, streak, table, feedback]);

  if (phase === 'select') {
    return (
      <GameLayout title="Times Table Blitz" subtitle="60 seconds — how many can you get?" players={[]} onBack={onExit}>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-ink-600 mb-6 text-center">Choose a times table or go random:</p>
          <div className="grid grid-cols-4 gap-3 mb-6 max-w-xs">
            {[2,3,4,5,6,7,8,9,10,11,12].map(n => (
              <button key={n} onClick={() => startGame(n)}
                className="w-14 h-14 rounded-xl bg-white border-2 border-ink-200 hover:border-gold-400 hover:bg-gold-50 font-bold text-xl text-ink-800 transition-all">
                ×{n}
              </button>
            ))}
            <button onClick={() => startGame('random')}
              className="col-span-1 h-14 rounded-xl bg-gold-400 hover:bg-gold-500 font-bold text-white transition-all">
              ?
            </button>
          </div>
        </div>
      </GameLayout>
    );
  }

  if (phase === 'ended') {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <GameLayout title="Times Table Blitz" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-4">Time's Up!</h2>
            <p className="text-5xl font-bold text-gold-500 mb-2">{score}</p>
            <p className="text-ink-500 mb-4">points</p>
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div><p className="text-2xl font-bold text-ink-800">{correct}</p><p className="text-xs text-ink-500">correct</p></div>
              <div><p className="text-2xl font-bold text-ink-800">{accuracy}%</p><p className="text-xs text-ink-500">accuracy</p></div>
              <div><p className="text-2xl font-bold text-ink-800">{best}</p><p className="text-xs text-ink-500">best streak</p></div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setPhase('select')} className="flex-1"><RotateCcw className="w-4 h-4 mr-1" />Again</Button>
              <Button variant="primary" onClick={onExit} className="flex-1">Done</Button>
            </div>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  const multiplier = Math.min(Math.floor(streak / 3) + 1, 5);
  const timePercent = (timeLeft / 60) * 100;

  return (
    <GameLayout title="Times Table Blitz" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-gold-500" />
            <span className="font-bold text-ink-800">{score}</span>
            {multiplier > 1 && <Badge variant="gold">×{multiplier}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-gold-400" />
            <span className="text-sm text-ink-600">streak {streak}</span>
          </div>
          <div className={`font-mono font-bold text-xl ${timeLeft <= 10 ? 'text-coral-600' : 'text-ink-700'}`}>{timeLeft}s</div>
        </div>

        <Progress value={timePercent} className="mb-8 h-2" />

        <AnimatePresence mode="wait">
          <motion.div key={`${q.a}x${q.b}`} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.1, opacity: 0 }}
            className={`w-full mb-8 p-8 rounded-3xl text-center transition-colors ${feedback === 'correct' ? 'bg-sage-100' : feedback === 'wrong' ? 'bg-coral-100' : 'bg-white shadow-md'}`}>
            <p className="font-display text-5xl font-bold text-ink-800">
              {q.a} × {q.b} = <span className="text-gold-500">?</span>
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-4 w-full">
          {q.options.map((opt) => (
            <button key={opt} onClick={() => handleAnswer(opt)}
              className="p-5 rounded-2xl bg-white border-2 border-ink-200 hover:border-gold-400 hover:bg-gold-50 font-bold text-2xl text-ink-800 transition-all active:scale-95 shadow-sm">
              {opt}
            </button>
          ))}
        </div>
      </div>
    </GameLayout>
  );
}
