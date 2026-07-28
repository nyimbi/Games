'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Grid, RotateCcw } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { generateNumberConnectionsPuzzle, type NumberGroup } from '@/lib/games/mathGenerators';

const COLOR_STYLES = {
  yellow: { bg: 'bg-gold-200',   border: 'border-gold-500',   text: 'text-gold-900',   dot: 'bg-gold-400'   },
  green:  { bg: 'bg-sage-200',   border: 'border-sage-500',   text: 'text-sage-900',   dot: 'bg-sage-500'   },
  blue:   { bg: 'bg-blue-100',   border: 'border-blue-400',   text: 'text-blue-900',   dot: 'bg-blue-400'   },
  purple: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-900', dot: 'bg-purple-400' },
};

type GroupColor = keyof typeof COLOR_STYLES;

function newPuzzle() {
  const p = generateNumberConnectionsPuzzle();
  const all = p.groups.flatMap(g => g.numbers);
  return {
    puzzle: p,
    grid: [...all].sort(() => Math.random() - 0.5),
  };
}

interface NumberConnectionsProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function NumberConnections({ onExit }: NumberConnectionsProps) {
  const [puzzleNum, setPuzzleNum] = useState(1);
  const [{ puzzle, grid }, setPuzzleState] = useState(newPuzzle);
  const [selection, setSelection] = useState<number[]>([]);
  const [solved, setSolved] = useState<NumberGroup[]>([]);
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
    setPuzzleNum(n => n + 1);
    setPuzzleState(newPuzzle());
    setSolved([]); setSelection([]); setWrong(0); setMessage(''); setPhase('playing');
  };

  const score = Math.max((4 - wrong) * 10 + solved.length * 5, 0);

  if (phase === 'ended') {
    return (
      <GameLayout title="Number Connections" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full"><CardContent className="p-8 text-center">
            <Grid className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-4">Solved! ({puzzleNum} puzzles)</h2>
            <div className="space-y-2 mb-6">
              {puzzle.groups.map(g => {
                const c = COLOR_STYLES[g.color as GroupColor];
                return (
                  <div key={g.label} className={`p-3 rounded-xl ${c.bg} border ${c.border}`}>
                    <p className={`font-semibold ${c.text} mb-1 text-sm`}>{g.label}</p>
                    <p className={`text-sm ${c.text} opacity-80`}>{g.numbers.join(', ')}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={nextPuzzle}>New Puzzle</Button>
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
          <span className="text-sm font-medium text-ink-600">Puzzle {puzzleNum}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-500">Mistakes: <span className="text-coral-600 font-bold">{wrong}</span></span>
            <span className="text-sm text-ink-500">{4 - solved.length} groups left</span>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          {solved.map(g => {
            const c = COLOR_STYLES[g.color as GroupColor];
            return (
              <motion.div key={g.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className={`p-3 rounded-xl ${c.bg} border ${c.border}`}>
                <p className={`font-semibold ${c.text} text-sm`}>{g.label}</p>
                <p className={`text-xs ${c.text} opacity-70`}>{g.numbers.join(' · ')}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {remaining.map(n => (
            <button key={n} onClick={() => toggle(n)}
              className={`h-14 rounded-xl font-bold text-xl border-2 transition-all ${
                selection.includes(n)
                  ? 'bg-gold-200 border-gold-500 text-gold-900 scale-95'
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
          {(['yellow','green','blue','purple'] as GroupColor[]).map(c => (
            <div key={c} className={`w-4 h-4 rounded-full ${COLOR_STYLES[c].dot} ${
              solved.map(g => g.color).includes(c) ? 'opacity-40' : 'opacity-100'
            }`} />
          ))}
        </div>
      </div>
    </GameLayout>
  );
}
