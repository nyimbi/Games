'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Check, X, ChevronRight, Lightbulb } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { GameLayout } from './GameLayout';

interface ShapeClue { clues: string[]; shape: string; icon: string; explanation: string; }

const SHAPES: ShapeClue[] = [
  { shape: "Square", icon: "■", explanation: "4 equal sides + 4 right angles = square.", clues: [
    "I have 4 sides.", "All my sides are equal length.", "All my interior angles are 90°.", "I have 4 lines of symmetry."
  ]},
  { shape: "Rectangle", icon: "▬", explanation: "4 sides with 2 pairs of equal sides and 4 right angles = rectangle.", clues: [
    "I have 4 sides.", "My opposite sides are equal and parallel.", "All my interior angles are 90°.", "I have only 2 lines of symmetry."
  ]},
  { shape: "Equilateral Triangle", icon: "▲", explanation: "3 equal sides and 3×60° angles = equilateral triangle.", clues: [
    "I have 3 sides.", "All my sides are equal.", "All my interior angles are 60°.", "I have 3 lines of symmetry."
  ]},
  { shape: "Right Triangle", icon: "◺", explanation: "3 sides with one 90° angle = right triangle.", clues: [
    "I have 3 sides.", "One of my interior angles is exactly 90°.", "My sides satisfy a² + b² = c².", "I have no lines of symmetry (in general)."
  ]},
  { shape: "Circle", icon: "●", explanation: "All points equidistant from centre, no corners = circle.", clues: [
    "I have no straight sides.", "All points on my boundary are the same distance from my centre.", "My perimeter is called my circumference.", "I have infinite lines of symmetry."
  ]},
  { shape: "Parallelogram", icon: "▱", explanation: "2 pairs of parallel sides but no right angles (in general) = parallelogram.", clues: [
    "I have 4 sides.", "My opposite sides are parallel and equal.", "My interior angles are NOT all 90°.", "I have no lines of symmetry (in general)."
  ]},
  { shape: "Rhombus", icon: "◆", explanation: "All 4 sides equal but angles not 90° = rhombus.", clues: [
    "I have 4 sides.", "All my sides are equal.", "My opposite angles are equal, but angles are not 90°.", "I have 2 lines of symmetry."
  ]},
  { shape: "Regular Pentagon", icon: "⬠", explanation: "5 equal sides, 5 equal 108° angles = regular pentagon.", clues: [
    "I have 5 sides.", "All my sides are equal.", "Each of my interior angles is 108°.", "I have 5 lines of symmetry."
  ]},
  { shape: "Regular Hexagon", icon: "⬡", explanation: "6 equal sides, 6×120° angles = regular hexagon.", clues: [
    "I have 6 sides.", "All my sides are equal.", "Each of my interior angles is 120°.", "I have 6 lines of symmetry."
  ]},
  { shape: "Kite", icon: "◈", explanation: "2 pairs of adjacent equal sides, one axis of symmetry = kite.", clues: [
    "I have 4 sides.", "I have 2 pairs of adjacent (neighbouring) sides that are equal.", "One of my diagonals bisects the other at 90°.", "I have exactly 1 line of symmetry."
  ]},
  { shape: "Trapezoid", icon: "⏢", explanation: "Exactly one pair of parallel sides = trapezoid.", clues: [
    "I have 4 sides.", "Exactly one pair of my sides is parallel.", "My non-parallel sides are called legs.", "I have no lines of symmetry (in general)."
  ]},
];

const ALL_SHAPES = SHAPES.map(s => s.shape);

interface ShapeSherlockProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function ShapeSherlock({ onExit }: ShapeSherlockProps) {
  const [queue] = useState(() => [...SHAPES].sort(() => Math.random() - 0.5).slice(0, 8));
  const [index, setIndex] = useState(0);
  const [clueIdx, setClueIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');

  const q = queue[index];
  const options = [
    q.shape,
    ...ALL_SHAPES.filter(s => s !== q.shape).sort(() => Math.random() - 0.5).slice(0, 3)
  ].sort(() => Math.random() - 0.5);

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    if (selected === q.shape) {
      const pts = clueIdx === 0 ? 20 : clueIdx === 1 ? 15 : clueIdx === 2 ? 10 : 5;
      setScore(s => s + pts);
    }
  };

  const handleNext = () => {
    if (index + 1 >= queue.length) { setPhase('ended'); return; }
    setIndex(i => i + 1);
    setClueIdx(0); setSelected(null); setSubmitted(false);
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Shape Sherlock" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <Eye className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Case Closed!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{score}</p>
            <p className="text-ink-500 mb-6">Fewer clues used = more points</p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Shape Sherlock" subtitle="Deduce the shape — fewer clues means more points" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-gold-500" />
            <span className="text-sm text-ink-600">{clueIdx + 1} clue{clueIdx > 0 ? 's' : ''} used</span>
          </div>
          <span className="text-sm text-ink-500">{index + 1}/{queue.length} · Score: <strong>{score}</strong></span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-5"><CardContent className="p-5">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Clues revealed:</p>
              <div className="space-y-2">
                {q.clues.slice(0, clueIdx + 1).map((clue, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-gold-200 text-gold-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                    <p className="text-sm text-ink-700">{clue}</p>
                  </motion.div>
                ))}
              </div>
              {clueIdx < q.clues.length - 1 && !submitted && (
                <button onClick={() => setClueIdx(c => c + 1)}
                  className="mt-3 text-xs text-gold-600 hover:underline flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Reveal next clue (−5pts potential)
                </button>
              )}
            </CardContent></Card>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {options.map(opt => (
                <button key={opt} onClick={() => !submitted && setSelected(opt)}
                  className={`p-4 rounded-xl border-2 font-semibold text-center transition-all ${
                    submitted
                      ? opt === q.shape ? 'bg-sage-100 border-sage-400 text-sage-800'
                        : opt === selected ? 'bg-coral-100 border-coral-400 text-coral-800'
                        : 'bg-cream-100 border-ink-100 text-ink-400'
                      : opt === selected ? 'bg-gold-100 border-gold-400 text-gold-800'
                        : 'bg-white border-ink-200 hover:border-gold-300 text-ink-700'
                  }`}>
                  {opt}
                </button>
              ))}
            </div>

            {!submitted ? (
              <Button variant="gold" className="w-full" onClick={handleSubmit} disabled={!selected}>
                That's my answer!
              </Button>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className={`p-4 rounded-xl border-2 text-center ${selected === q.shape ? 'bg-sage-100 border-sage-400' : 'bg-coral-100 border-coral-400'}`}>
                  <p className="font-display text-2xl font-bold mb-1">
                    {q.icon} {q.shape}
                  </p>
                  <p className="text-sm">{q.explanation}</p>
                </div>
                <Button variant="primary" className="w-full" onClick={handleNext}>
                  {index + 1 < queue.length ? 'Next Shape' : 'See Results'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}
