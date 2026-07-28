'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GitBranch, Check, X, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';

interface Analogy {
  a: string; b: string; c: string;
  options: string[]; correct: number;
  subjects: string; explanation: string;
}

const ANALOGIES: Analogy[] = [
  { a: "Mitosis", b: "Cell division", c: "Revolution", options: ["Political change", "War", "Democracy", "Law"], correct: 0, subjects: "Science → Social Studies", explanation: "Both are processes that split/transform the existing structure into something new." },
  { a: "Protagonist", b: "Story", c: "Catalyst", options: ["Chemical reaction", "Atom", "Molecule", "Energy"], correct: 0, subjects: "Literature → Science", explanation: "A protagonist drives a story forward; a catalyst drives a chemical reaction forward." },
  { a: "Sonnet", b: "Shakespeare", c: "Symphony", options: ["Beethoven", "Monet", "Dickens", "Darwin"], correct: 0, subjects: "Literature → Arts", explanation: "Shakespeare mastered the sonnet form; Beethoven mastered the symphony form." },
  { a: "Photosynthesis", b: "Glucose", c: "Democracy", options: ["Governance", "Votes", "Citizens", "Constitution"], correct: 3, subjects: "Science → Social Studies", explanation: "Photosynthesis produces glucose as its output; democracy is structured by a constitution." },
  { a: "Fossil fuels", b: "Industrial Revolution", c: "Steam engine", options: ["Railways", "Electricity", "Automobiles", "Combustion engine"], correct: 1, subjects: "Special Area → Social Studies", explanation: "Fossil fuels powered the Industrial Revolution; the steam engine catalysed the age of railways and electricity." },
  { a: "Haiku", b: "Three lines", c: "Sonnet", options: ["Fourteen lines", "Four stanzas", "Ten syllables", "Rhyme scheme"], correct: 0, subjects: "Literature", explanation: "A haiku has three lines; a sonnet has fourteen lines — both are defined by their fixed structure." },
  { a: "Antibiotics", b: "Bacteria", c: "Antivirals", options: ["Viruses", "Fungi", "Parasites", "Toxins"], correct: 0, subjects: "Science", explanation: "Antibiotics target bacteria; antivirals target viruses." },
  { a: "Baroque", b: "Ornate", c: "Minimalism", options: ["Simple", "Modern", "Abstract", "Geometric"], correct: 0, subjects: "Arts", explanation: "Baroque is characterised by ornateness; minimalism is characterised by simplicity." },
  { a: "Keynesian", b: "Government stimulus", c: "Laissez-faire", options: ["Free markets", "Taxation", "Regulation", "Socialism"], correct: 0, subjects: "Social Studies", explanation: "Keynesian economics advocates government intervention; laissez-faire advocates free markets without intervention." },
  { a: "DNA", b: "Blueprint", c: "Constitution", options: ["Instructions for governance", "History of a nation", "Rights of citizens", "Amendments"], correct: 0, subjects: "Science → Social Studies", explanation: "DNA contains the instructions for an organism; a constitution contains the instructions for governing a nation." },
  { a: "Impressionism", b: "Monet", c: "Cubism", options: ["Picasso", "Dalí", "Warhol", "Kahlo"], correct: 0, subjects: "Arts", explanation: "Monet was the defining figure of Impressionism; Picasso was the defining figure of Cubism." },
  { a: "Allegory", b: "Hidden meaning", c: "Satire", options: ["Social criticism", "Literal story", "Exaggeration", "Comedy"], correct: 0, subjects: "Literature", explanation: "Both are literary devices: allegory uses hidden meaning; satire uses criticism and ridicule." },
  { a: "Natural selection", b: "Darwin", c: "Heliocentrism", options: ["Copernicus", "Newton", "Galileo", "Kepler"], correct: 0, subjects: "Science → Social Studies", explanation: "Darwin proposed natural selection; Copernicus proposed heliocentrism — both overturned prevailing worldviews." },
  { a: "Carbon footprint", b: "Greenhouse gases", c: "Ecological footprint", options: ["Biodiversity loss", "Land use", "Water pollution", "Deforestation"], correct: 1, subjects: "Special Area", explanation: "Carbon footprint measures greenhouse gas output; ecological footprint measures total land and resource use." },
  { a: "Metaphor", b: "Direct comparison", c: "Simile", options: ["Indirect comparison", "Contrast", "Repetition", "Alliteration"], correct: 0, subjects: "Literature", explanation: "Metaphor makes a direct comparison ('life is a journey'); simile uses 'like' or 'as' for indirect comparison." },
  { id: 16, a: "Feudalism", b: "Medieval Europe", c: "Caste system", options: ["Ancient India", "Modern China", "Ancient Rome", "Colonial Africa"], correct: 0, subjects: "Social Studies", explanation: "Feudalism was the dominant social hierarchy of medieval Europe; the caste system has structured ancient Indian society." } as any,
  { a: "Thesis", b: "Essay", c: "Hypothesis", options: ["Scientific experiment", "Proof", "Theory", "Data"], correct: 0, subjects: "Literature → Science", explanation: "A thesis is the central claim of an essay; a hypothesis is the central testable claim of a scientific experiment." },
  { a: "Allegro", b: "Fast", c: "Adagio", options: ["Slow", "Soft", "Loud", "Moderate"], correct: 0, subjects: "Arts", explanation: "In music, allegro denotes a fast tempo; adagio denotes a slow one." },
  { a: "Genome", b: "Organism", c: "Constitution", options: ["Nation", "Government", "Law", "Rights"], correct: 0, subjects: "Science → Social Studies", explanation: "A genome is the complete genetic instruction set for an organism; a constitution is the foundational legal document for a nation." },
  { a: "Pandemic", b: "Global disease", c: "Globalisation", options: ["Global trade and culture", "War", "Migration", "Technology"], correct: 0, subjects: "Special Area → Social Studies", explanation: "A pandemic spreads a disease globally; globalisation spreads trade, culture, and ideas globally." },
];

interface AnalogyArenaProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function AnalogyArena({ onExit }: AnalogyArenaProps) {
  const [queue] = useState(() => [...ANALOGIES].sort(() => Math.random() - 0.5));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const q = queue[index];

  const reveal = useCallback((choice: number | null) => {
    clearInterval(timerRef.current!);
    setSelected(choice);
    setRevealed(true);
    if (choice === q.correct) {
      const bonus = Math.ceil(timeLeft / 5);
      setScore(s => s + 10 + bonus);
    }
  }, [q, timeLeft]);

  useEffect(() => {
    setTimeLeft(15); setSelected(null); setRevealed(false);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { reveal(null); clearInterval(timerRef.current!); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [index]);

  const handleNext = () => {
    if (index + 1 >= queue.length) { setPhase('ended'); return; }
    setIndex(i => i + 1);
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Analogy Arena" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Round Complete!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{score}</p>
            <p className="text-ink-500 mb-6">points from {queue.length} analogies</p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Analogy Arena" subtitle="A : B :: C : ?" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline">{q.subjects}</Badge>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-500">{index + 1}/{queue.length}</span>
            <span className={`font-mono font-bold text-xl ${timeLeft <= 5 ? 'text-coral-600' : 'text-ink-700'}`}>{timeLeft}s</span>
          </div>
        </div>
        <Progress value={(timeLeft / 15) * 100} className="mb-6 h-2" />

        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6"><CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="text-center">
                  <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">A</p>
                  <p className="font-display text-xl font-bold text-ink-800 bg-gold-50 px-4 py-2 rounded-lg">{q.a}</p>
                </div>
                <span className="text-ink-400 font-bold text-2xl">:</span>
                <div className="text-center">
                  <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">B</p>
                  <p className="font-display text-xl font-bold text-ink-800 bg-gold-50 px-4 py-2 rounded-lg">{q.b}</p>
                </div>
                <span className="text-ink-400 font-bold text-2xl">::</span>
                <div className="text-center">
                  <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">C</p>
                  <p className="font-display text-xl font-bold text-ink-800 bg-gold-50 px-4 py-2 rounded-lg">{q.c}</p>
                </div>
                <span className="text-ink-400 font-bold text-2xl">:</span>
                <div className="text-center">
                  <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">?</p>
                  <p className="font-display text-2xl font-bold text-gold-500 bg-gold-50 px-4 py-2 rounded-lg min-w-[80px]">?</p>
                </div>
              </div>
            </CardContent></Card>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => !revealed && reveal(i)}
                  className={`p-4 rounded-xl border-2 font-medium transition-all text-left ${
                    revealed
                      ? i === q.correct ? 'bg-sage-100 border-sage-400 text-sage-800' : i === selected ? 'bg-coral-100 border-coral-400 text-coral-800' : 'bg-cream-100 border-ink-200 text-ink-500'
                      : 'bg-white border-ink-200 hover:border-gold-300 hover:bg-gold-50 text-ink-800'
                  }`}>
                  <span className="flex items-center gap-2">
                    {revealed && i === q.correct && <Check className="w-4 h-4 text-sage-600" />}
                    {revealed && i === selected && i !== q.correct && <X className="w-4 h-4 text-coral-600" />}
                    {opt}
                  </span>
                </button>
              ))}
            </div>

            {revealed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className={`p-3 rounded-xl mb-4 text-sm ${selected === q.correct ? 'bg-sage-50 border border-sage-200 text-sage-800' : 'bg-coral-50 border border-coral-200 text-coral-800'}`}>
                  {q.explanation}
                </div>
                <Button variant="primary" className="w-full" onClick={handleNext}>
                  {index + 1 < queue.length ? 'Next' : 'See Results'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-ink-500 text-sm mt-4">Score: <span className="font-bold text-ink-800">{score}</span></p>
      </div>
    </GameLayout>
  );
}
