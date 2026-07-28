'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, Plus, Trash2, ChevronRight, CheckCircle } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { GameLayout } from './GameLayout';

interface Challenge { from: string; to: string; examplePath: string[]; subjects: string; }

const CHALLENGES: Challenge[] = [
  { from: "Mitosis", to: "The French Revolution", examplePath: ["Mitosis", "Cell replication → population growth", "Population pressure in pre-revolutionary France", "Resource scarcity drives social unrest", "The French Revolution"], subjects: "Science → Social Studies" },
  { from: "Shakespeare's Hamlet", to: "Natural Selection", examplePath: ["Hamlet", "Hamlet's indecision as a survival strategy (feigning madness)", "Adaptive behaviour increases fitness", "Organisms with adaptive traits survive", "Natural Selection"], subjects: "Literature → Science" },
  { from: "The Silk Road", to: "The Internet", examplePath: ["The Silk Road", "Trade routes spread goods, ideas, and disease", "Ideas transmitted across networks", "Information networks", "The Internet"], subjects: "Social Studies → Special Area" },
  { from: "Beethoven's Ninth Symphony", to: "The United Nations", examplePath: ["Beethoven's Ninth", "Ode to Joy expresses universal brotherhood", "Universal rights and shared humanity", "Post-WWII human rights framework", "The United Nations"], subjects: "Arts → Social Studies" },
  { from: "Photosynthesis", to: "The Industrial Revolution", examplePath: ["Photosynthesis", "Plants stored solar energy as carbon compounds over millions of years", "Fossil fuels are ancient stored solar energy", "Steam engines burned fossil fuels for power", "The Industrial Revolution"], subjects: "Science → Social Studies" },
  { from: "George Orwell's 1984", to: "Artificial Intelligence", examplePath: ["1984", "Big Brother's surveillance state", "Mass surveillance through technology", "AI-powered facial recognition and data analysis", "Artificial Intelligence"], subjects: "Literature → Special Area" },
  { from: "The Impressionist movement", to: "Climate Change", examplePath: ["Impressionism", "Artists captured atmospheric light and weather conditions", "Weather patterns and atmospheric science", "Human impact on the atmosphere", "Climate Change"], subjects: "Arts → Special Area" },
  { from: "Socrates", to: "Social Media", examplePath: ["Socrates", "Socrates used questioning to challenge assumptions in public dialogue", "Public discourse shapes shared beliefs", "Digital platforms host public discourse at scale", "Social Media"], subjects: "Social Studies → Special Area" },
];

interface SixDegreesProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function SixDegrees({ onExit }: SixDegreesProps) {
  const [queue] = useState(() => [...CHALLENGES].sort(() => Math.random() - 0.5));
  const [index, setIndex] = useState(0);
  const [steps, setSteps] = useState<string[]>(['']);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');

  const ch = queue[index];

  const addStep = () => {
    if (steps.length < 5) setSteps(s => [...s, '']);
  };

  const removeStep = (i: number) => {
    if (steps.length <= 1) return;
    setSteps(s => s.filter((_, idx) => idx !== i));
  };

  const updateStep = (i: number, val: string) => {
    setSteps(s => s.map((v, idx) => idx === i ? val : v));
  };

  const handleSubmit = () => {
    const filled = steps.filter(s => s.trim().length > 3);
    const earned = filled.length <= 4 ? 20 : filled.length <= 5 ? 15 : 10;
    setScore(sc => sc + earned);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (index + 1 >= queue.length) { setPhase('ended'); return; }
    setIndex(i => i + 1);
    setSteps(['']); setSubmitted(false);
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Six Degrees" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Done!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{score}</p>
            <p className="text-ink-500 mb-6">points — shorter chains score more</p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Six Degrees" subtitle="Connect two concepts with the fewest steps" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-5">
          <Badge variant="outline">{ch.subjects}</Badge>
          <span className="text-sm text-ink-500">{index + 1}/{queue.length}</span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 p-4 bg-gold-50 border-2 border-gold-300 rounded-xl text-center">
            <p className="text-xs text-gold-600 uppercase tracking-wide mb-1">Start</p>
            <p className="font-display font-bold text-ink-800">{ch.from}</p>
          </div>
          <Link className="w-5 h-5 text-ink-400 flex-shrink-0" />
          <div className="flex-1 p-4 bg-sage-50 border-2 border-sage-300 rounded-xl text-center">
            <p className="text-xs text-sage-600 uppercase tracking-wide mb-1">End</p>
            <p className="font-display font-bold text-ink-800">{ch.to}</p>
          </div>
        </div>

        {!submitted ? (
          <>
            <p className="text-sm text-ink-500 mb-3">Add connecting steps (fewer = more points):</p>
            <div className="space-y-2 mb-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-ink-200 text-ink-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <input value={step} onChange={e => updateStep(i, e.target.value)}
                    placeholder={`Step ${i + 1}…`}
                    className="flex-1 p-3 border-2 border-ink-200 rounded-xl text-ink-800 focus:border-gold-400 focus:outline-none text-sm" />
                  <button onClick={() => removeStep(i)} className="text-ink-400 hover:text-coral-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              {steps.length < 5 && (
                <Button variant="secondary" onClick={addStep} className="flex-1">
                  <Plus className="w-4 h-4 mr-1" /> Add Step
                </Button>
              )}
              <Button variant="gold" onClick={handleSubmit} className="flex-1"
                disabled={steps.filter(s => s.trim().length > 3).length === 0}>
                Submit Chain
              </Button>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="p-4 bg-sage-50 border border-sage-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-sage-600" />
                <p className="font-semibold text-sage-800">One possible path:</p>
              </div>
              <div className="space-y-2">
                {ch.examplePath.map((node, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {i > 0 && i < ch.examplePath.length - 1 && (
                      <span className="w-5 h-5 rounded-full bg-sage-200 text-sage-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i}</span>
                    )}
                    {(i === 0 || i === ch.examplePath.length - 1) && (
                      <span className="w-5 h-5 rounded-full bg-gold-300 text-gold-800 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">★</span>
                    )}
                    <p className="text-sm text-ink-700">{node}</p>
                  </div>
                ))}
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={handleNext}>
              {index + 1 < queue.length ? 'Next Challenge' : 'See Results'} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </div>
    </GameLayout>
  );
}
