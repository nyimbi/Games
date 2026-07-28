'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { GameLayout } from './GameLayout';

type GraphType = 'linear' | 'quadratic-up' | 'quadratic-down' | 'exponential' | 'logarithmic' | 'inverse' | 'step' | 'linear-neg';

interface GraphQuestion {
  scenario: string;
  subject: string;
  correctGraph: GraphType;
  options: GraphType[];
  explanation: string;
}

const QUESTIONS: GraphQuestion[] = [
  { scenario: "A car travels at a constant speed. Plot of distance vs time.", subject: "Physics", correctGraph: 'linear', options: ['linear', 'quadratic-up', 'exponential', 'inverse'], explanation: "Constant speed means distance increases at a steady rate — a straight line through the origin." },
  { scenario: "A ball is thrown straight up and falls back down. Plot of height vs time.", subject: "Physics", correctGraph: 'quadratic-down', options: ['linear', 'quadratic-down', 'exponential', 'step'], explanation: "The ball rises (decelerating) and falls (accelerating). Height forms an inverted parabola — quadratic with a maximum." },
  { scenario: "A bank account earns 5% compound interest per year. Plot of balance vs years.", subject: "Finance", correctGraph: 'exponential', options: ['linear', 'quadratic-up', 'exponential', 'logarithmic'], explanation: "Compound interest grows exponentially — each year's increase is proportional to the current balance." },
  { scenario: "The time to complete a task when more workers are added. Plot of time vs number of workers.", subject: "Maths", correctGraph: 'inverse', options: ['linear-neg', 'inverse', 'quadratic-down', 'step'], explanation: "Doubling workers roughly halves the time. This inverse relationship forms a hyperbola (y = k/x)." },
  { scenario: "The loudness (decibels) perceived by the human ear as sound intensity increases.", subject: "Physics/Biology", correctGraph: 'logarithmic', options: ['linear', 'exponential', 'logarithmic', 'quadratic-up'], explanation: "The ear perceives sound logarithmically — equal percentage increases in intensity cause equal increases in perceived loudness." },
  { scenario: "Water temperature as ice melts: it stays at 0°C, then rises after all ice is melted.", subject: "Chemistry", correctGraph: 'step', options: ['linear', 'exponential', 'step', 'quadratic-up'], explanation: "Temperature stays flat during a phase transition (melting), then rises — producing a step/plateau shape." },
  { scenario: "A freely falling object (ignoring air resistance). Plot of speed vs time.", subject: "Physics", correctGraph: 'linear', options: ['linear', 'quadratic-up', 'exponential', 'inverse'], explanation: "Gravitational acceleration is constant (g ≈ 9.8 m/s²), so speed increases linearly with time: v = gt." },
  { scenario: "Population of bacteria doubling every 20 minutes. Plot of population vs time.", subject: "Biology", correctGraph: 'exponential', options: ['linear', 'quadratic-up', 'exponential', 'logarithmic'], explanation: "Doubling repeatedly at fixed intervals is the definition of exponential growth." },
  { scenario: "A car brakes suddenly to a stop. Plot of speed vs time during braking.", subject: "Physics", correctGraph: 'linear-neg', options: ['linear-neg', 'quadratic-down', 'inverse', 'exponential'], explanation: "Constant braking force produces constant deceleration — speed decreases linearly to zero." },
  { scenario: "The perimeter of a square vs its side length.", subject: "Geometry", correctGraph: 'linear', options: ['linear', 'quadratic-up', 'exponential', 'logarithmic'], explanation: "P = 4s — perimeter is directly proportional to side length, producing a straight line." },
];

function GraphSVG({ type, highlighted }: { type: GraphType; highlighted?: boolean }) {
  const w = 80; const h = 60; const pad = 8;
  const stroke = highlighted ? '#f59e0b' : '#6b7280';
  const paths: Record<GraphType, string> = {
    'linear': `M${pad},${h-pad} L${w-pad},${pad+5}`,
    'linear-neg': `M${pad},${pad+5} L${w-pad},${h-pad}`,
    'quadratic-up': `M${pad},${h-pad} Q${w/2},${pad} ${w-pad},${h-pad}`,
    'quadratic-down': `M${pad},${pad+5} Q${w/2},${h-pad} ${w-pad},${pad+5}`,
    'exponential': `M${pad},${h-pad} C${pad+10},${h-pad-5} ${w-15},${pad+20} ${w-pad},${pad}`,
    'logarithmic': `M${pad},${h-pad} C${pad+15},${pad+5} ${w-20},${pad+3} ${w-pad},${pad}`,
    'inverse': `M${pad},${pad} C${pad+8},${h-30} ${w-30},${h-10} ${w-pad},${h-pad}`,
    'step': `M${pad},${h-pad} L${w/2-2},${h-pad} L${w/2-2},${h/2} L${w-pad},${h/2}`,
  };
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      {/* axes */}
      <line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="#d1d5db" strokeWidth="1.5" />
      <line x1={pad} y1={pad} x2={pad} y2={h-pad} stroke="#d1d5db" strokeWidth="1.5" />
      {/* curve */}
      <path d={paths[type]} stroke={stroke} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const GRAPH_LABELS: Record<GraphType, string> = {
  'linear': 'Linear (up)',
  'linear-neg': 'Linear (down)',
  'quadratic-up': 'Quadratic (∪)',
  'quadratic-down': 'Quadratic (∩)',
  'exponential': 'Exponential',
  'logarithmic': 'Logarithmic',
  'inverse': 'Inverse (hyperbola)',
  'step': 'Step / plateau',
};

interface GraphGuesserProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function GraphGuesser({ onExit }: GraphGuesserProps) {
  const [queue] = useState(() => [...QUESTIONS].sort(() => Math.random() - 0.5));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<GraphType | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');

  const q = queue[index];

  const handleSubmit = (choice: GraphType) => {
    if (submitted) return;
    setSelected(choice);
    setSubmitted(true);
    if (choice === q.correctGraph) setScore(s => s + 15);
  };

  const handleNext = () => {
    if (index + 1 >= queue.length) { setPhase('ended'); return; }
    setIndex(i => i + 1);
    setSelected(null); setSubmitted(false);
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Graph Guesser" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Done!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{score}<span className="text-xl text-ink-400">/{queue.length * 15}</span></p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Graph Guesser" subtitle="Which graph matches this real-world scenario?" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline">{q.subject}</Badge>
          <span className="text-sm text-ink-500">{index + 1}/{queue.length} · Score: <strong>{score}</strong></span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-5 bg-gold-50 border-gold-200"><CardContent className="p-5 text-center">
              <p className="font-display text-lg font-semibold text-ink-800">{q.scenario}</p>
            </CardContent></Card>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {q.options.map(g => {
                const isCorrect = submitted && g === q.correctGraph;
                const isWrong = submitted && g === selected && g !== q.correctGraph;
                return (
                  <button key={g} onClick={() => handleSubmit(g)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      isCorrect ? 'bg-sage-100 border-sage-400'
                      : isWrong ? 'bg-coral-100 border-coral-400'
                      : submitted ? 'bg-cream-100 border-ink-100 opacity-60'
                      : g === selected ? 'bg-gold-100 border-gold-400'
                      : 'bg-white border-ink-200 hover:border-gold-300'
                    }`}>
                    <div className="h-20 mb-2">
                      <GraphSVG type={g} highlighted={g === selected} />
                    </div>
                    <p className={`text-xs font-medium ${isCorrect ? 'text-sage-700' : isWrong ? 'text-coral-700' : 'text-ink-600'}`}>
                      {isCorrect && '✓ '}{isWrong && '✗ '}{GRAPH_LABELS[g]}
                    </p>
                  </button>
                );
              })}
            </div>

            {submitted && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className={`p-3 rounded-xl text-sm ${selected === q.correctGraph ? 'bg-sage-50 border border-sage-200 text-sage-800' : 'bg-coral-50 border border-coral-200 text-coral-800'}`}>
                  {q.explanation}
                </div>
                <Button variant="primary" className="w-full" onClick={handleNext}>
                  {index + 1 < queue.length ? 'Next' : 'See Results'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}
