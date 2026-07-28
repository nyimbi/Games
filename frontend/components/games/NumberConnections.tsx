'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Grid, ChevronRight, RotateCcw } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { GameLayout } from './GameLayout';

interface Group { label: string; numbers: number[]; color: 'yellow' | 'green' | 'blue' | 'purple'; }
interface Puzzle { title: string; groups: Group[]; }

const COLOR_STYLES = {
  yellow: { bg: 'bg-gold-200', border: 'border-gold-500', text: 'text-gold-900', dot: 'bg-gold-400' },
  green: { bg: 'bg-sage-200', border: 'border-sage-500', text: 'text-sage-900', dot: 'bg-sage-500' },
  blue: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-900', dot: 'bg-blue-400' },
  purple: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-900', dot: 'bg-purple-400' },
};

const PUZZLES: Puzzle[] = [
  {
    title: "Puzzle 1",
    groups: [
      { label: "Perfect squares", numbers: [4, 9, 16, 25], color: 'yellow' },
      { label: "Triangular numbers", numbers: [1, 3, 6, 10], color: 'green' },
      { label: "Prime numbers", numbers: [11, 13, 17, 19], color: 'blue' },
      { label: "Multiples of 8", numbers: [8, 24, 32, 40], color: 'purple' },
    ]
  },
  {
    title: "Puzzle 2",
    groups: [
      { label: "Powers of 2", numbers: [2, 4, 8, 16], color: 'yellow' },
      { label: "Fibonacci numbers", numbers: [1, 5, 13, 21], color: 'green' },
      { label: "Multiples of 7", numbers: [7, 14, 28, 35], color: 'blue' },
      { label: "Even perfect squares", numbers: [36, 64, 100, 144], color: 'purple' },
    ]
  },
  {
    title: "Puzzle 3",
    groups: [
      { label: "Multiples of 6", numbers: [6, 12, 18, 24], color: 'yellow' },
      { label: "Perfect cubes", numbers: [8, 27, 64, 125], color: 'green' },
      { label: "Lesser of twin primes", numbers: [3, 5, 29, 41], color: 'blue' },
      { label: "Number palindromes", numbers: [11, 22, 33, 44], color: 'purple' },
    ]
  },
  {
    title: "Puzzle 4 (Hard)",
    groups: [
      { label: "Factorials (2!–5!)", numbers: [2, 6, 24, 120], color: 'yellow' },
      { label: "Powers of 3", numbers: [3, 27, 81, 243], color: 'green' },
      { label: "Numbers with exactly 3 factors", numbers: [4, 49, 121, 169], color: 'blue' },
      { label: "Multiples of 25", numbers: [25, 50, 75, 100], color: 'purple' },
    ]
  },
];

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

interface NumberConnectionsProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function NumberConnections({ onExit }: NumberConnectionsProps) {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = PUZZLES[puzzleIdx];
  const allNumbers = puzzle.groups.flatMap(g => g.numbers);
  const [grid] = useState(() => shuffle(allNumbers));
  const [selection, setSelection] = useState<number[]>([]);
  const [solved, setSolved] = useState<Group[]>([]);
  const [wrong, setWrong] = useState(0);
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');

  const remaining = grid.filter(n => !solved.flatMap(g => g.numbers).includes(n));

  const toggle = (n: number) => {
    if (selection.includes(n)) setSelection(s => s.filter(x => x !== n));
    else if (selection.length < 4) setSelection(s => [...s, n]);
  };

  const submit = () => {
    if (selection.length !== 4) return;
    const match = puzzle.groups.find(g =>
      g.numbers.every(n => selection.includes(n)) && selection.every(n => g.numbers.includes(n))
    );
    if (match) {
      const next = [...solved, match];
      setSolved(next);
      setSelection([]);
      setMessage(`✓ ${match.label}!`);
      setTimeout(() => setMessage(''), 2000);
      if (next.length === 4) setPhase('ended');
    } else {
      setWrong(w => w + 1);
      setMessage('Not quite — try again');
      setTimeout(() => setMessage(''), 1500);
      setSelection([]);
    }
  };

  const nextPuzzle = () => {
    if (puzzleIdx + 1 >= PUZZLES.length) return;
    setPuzzleIdx(p => p + 1);
    setSolved([]); setSelection([]); setWrong(0); setMessage(''); setPhase('playing');
  };

  const score = Math.max((4 - wrong) * 10 + solved.length * 5, 0);

  if (phase === 'ended') {
    return (
      <GameLayout title="Number Connections" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full"><CardContent className="p-8 text-center">
            <Grid className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-4">Solved!</h2>
            <div className="space-y-2 mb-6">
              {puzzle.groups.map(g => {
                const c = COLOR_STYLES[g.color];
                return (
                  <div key={g.label} className={`p-3 rounded-xl ${c.bg} border ${c.border}`}>
                    <p className={`font-semibold ${c.text} mb-1 text-sm`}>{g.label}</p>
                    <p className={`text-sm ${c.text} opacity-80`}>{g.numbers.join(', ')}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              {puzzleIdx + 1 < PUZZLES.length && (
                <Button variant="secondary" className="flex-1" onClick={nextPuzzle}>Next Puzzle</Button>
              )}
              <Button variant="primary" className="flex-1" onClick={onExit}>Done</Button>
            </div>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Number Connections" subtitle="Select 4 numbers that share a hidden property" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-ink-600">{puzzle.title}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-500">Mistakes: <span className="text-coral-600 font-bold">{wrong}</span>/4</span>
            <span className="text-sm text-ink-500">{4 - solved.length} groups left</span>
          </div>
        </div>

        {/* Solved groups */}
        <div className="space-y-2 mb-3">
          {solved.map(g => {
            const c = COLOR_STYLES[g.color];
            return (
              <motion.div key={g.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className={`p-3 rounded-xl ${c.bg} border ${c.border}`}>
                <p className={`font-semibold ${c.text} text-sm`}>{g.label}</p>
                <p className={`text-xs ${c.text} opacity-70`}>{g.numbers.join(' · ')}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {remaining.map(n => (
            <button key={n} onClick={() => toggle(n)}
              className={`h-14 rounded-xl font-bold text-xl border-2 transition-all ${
                selection.includes(n) ? 'bg-gold-200 border-gold-500 text-gold-900 scale-95'
                : 'bg-white border-ink-200 hover:border-gold-300 text-ink-800'
              }`}>
              {n}
            </button>
          ))}
        </div>

        {message && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`text-center font-semibold mb-3 ${message.startsWith('✓') ? 'text-sage-600' : 'text-coral-600'}`}>
            {message}
          </motion.p>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setSelection([])} disabled={selection.length === 0} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-1" />Clear
          </Button>
          <Button variant="gold" onClick={submit} disabled={selection.length !== 4} className="flex-1">
            Submit Group
          </Button>
        </div>

        <div className="mt-3 flex justify-center gap-2">
          {['yellow','green','blue','purple'].map(c => (
            <div key={c} className={`w-4 h-4 rounded-full ${COLOR_STYLES[c as keyof typeof COLOR_STYLES].dot} ${solved.map(g => g.color).includes(c as any) ? 'opacity-40' : 'opacity-100'}`} />
          ))}
        </div>
      </div>
    </GameLayout>
  );
}
