'use client';
import { formatSubject } from '@/lib/utils/format';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Calendar, Check, RotateCcw, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';

interface TimelineEvent { text: string; year: number; }
interface TimelineSet { title: string; subject: string; events: TimelineEvent[]; }

const TIMELINES: TimelineSet[] = [
  { title: "History of Science", subject: "Science", events: [
    { text: "Newton publishes Principia Mathematica", year: 1687 },
    { text: "Darwin publishes On the Origin of Species", year: 1859 },
    { text: "Einstein publishes Special Relativity", year: 1905 },
    { text: "Watson & Crick describe DNA's double helix", year: 1953 },
    { text: "First CRISPR gene editing demonstrated", year: 2012 },
  ]},
  { title: "World Political History", subject: "Social Studies", events: [
    { text: "Magna Carta signed by King John", year: 1215 },
    { text: "American Declaration of Independence", year: 1776 },
    { text: "Storming of the Bastille — French Revolution", year: 1789 },
    { text: "United Nations founded", year: 1945 },
    { text: "Fall of the Berlin Wall", year: 1989 },
  ]},
  { title: "Art & Literature", subject: "Arts / Literature", events: [
    { text: "Gutenberg prints first Bible on movable type", year: 1455 },
    { text: "Shakespeare writes Hamlet", year: 1600 },
    { text: "Beethoven premieres Ninth Symphony (deaf)", year: 1824 },
    { text: "Picasso paints Guernica", year: 1937 },
    { text: "García Márquez wins Nobel Prize in Literature", year: 1982 },
  ]},
  { title: "Technology Milestones", subject: "Special Area", events: [
    { text: "First telegraph message sent", year: 1844 },
    { text: "First powered aeroplane flight by Wright Brothers", year: 1903 },
    { text: "First Moon landing — Apollo 11", year: 1969 },
    { text: "World Wide Web invented by Berners-Lee", year: 1989 },
    { text: "First iPhone released", year: 2007 },
  ]},
  { title: "Empires & Civilisations", subject: "Social Studies", events: [
    { text: "Alexander the Great begins conquests", year: -334 },
    { text: "Roman Republic established", year: -509 },
    { text: "Fall of the Western Roman Empire", year: 476 },
    { text: "Mongol Empire founded by Genghis Khan", year: 1206 },
    { text: "Ottoman Empire falls; Republic of Turkey declared", year: 1923 },
  ]},
];

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

interface TimelineRaceProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function TimelineRace({ onExit }: TimelineRaceProps) {
  const [setIndex, setSetIndex] = useState(0);
  const [shuffled, setShuffled] = useState(() => shuffle(TIMELINES[0].events));
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [totalScore, setTotalScore] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'result' | 'ended'>('playing');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tl = TIMELINES[setIndex];
  const correct = [...tl.events].sort((a, b) => a.year - b.year);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current!); handleSubmit(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [setIndex]);

  const handleSelect = (idx: number) => {
    if (submitted) return;
    setSelected(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx].slice(0, 5));
  };

  const handleSubmit = (auto = false) => {
    clearInterval(timerRef.current!);
    const order = auto ? shuffled.map((_, i) => i) : selected;
    const orderedEvents = order.map(i => shuffled[i]);
    const earned = orderedEvents.reduce((acc, ev, i) => acc + (ev.year === correct[i].year ? 20 : 0), 0);
    setScore(earned);
    setTotalScore(ts => ts + earned);
    setSubmitted(true);
    setPhase('result');
  };

  const handleNext = () => {
    if (setIndex + 1 >= TIMELINES.length) { setPhase('ended'); return; }
    const next = setIndex + 1;
    setSetIndex(next);
    setShuffled(shuffle(TIMELINES[next].events));
    setSelected([]); setSubmitted(false); setTimeLeft(45); setPhase('playing');
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Timeline Race" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">All Done!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{totalScore}<span className="text-xl text-ink-400">/{TIMELINES.length * 100}</span></p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Timeline Race" subtitle="Click events from EARLIEST to LATEST" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <div><p className="font-display font-bold text-ink-800">{tl.title}</p><Badge variant="outline">{formatSubject(tl.subject)}</Badge></div>
          <div className="flex items-center gap-3">
            <span className={`font-mono font-bold text-xl ${timeLeft <= 10 ? 'text-coral-600' : 'text-ink-700'}`}>{timeLeft}s</span>
          </div>
        </div>
        <Progress value={(timeLeft / 45) * 100} className="mb-6" />

        {!submitted && (
          <p className="text-sm text-ink-500 mb-3 text-center">
            Selected {selected.length}/5 — click in chronological order
          </p>
        )}

        <div className="space-y-3 mb-6">
          {shuffled.map((ev, i) => {
            const selOrder = selected.indexOf(i);
            const isSelected = selOrder !== -1;
            const correctIdx = submitted ? correct.findIndex(c => c.year === ev.year) : -1;
            const actualOrder = submitted ? selected.indexOf(i) : -1;
            const isCorrect = submitted && actualOrder === correctIdx;
            const isWrong = submitted && isSelected && !isCorrect;

            return (
              <motion.button key={ev.year} onClick={() => handleSelect(i)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                  submitted
                    ? isCorrect ? 'bg-sage-100 border-sage-400' : isWrong ? 'bg-coral-100 border-coral-400' : isSelected ? 'bg-gold-50 border-gold-300' : 'bg-cream-100 border-ink-200'
                    : isSelected ? 'bg-gold-100 border-gold-400' : 'bg-white border-ink-200 hover:border-gold-300'
                }`}>
                {isSelected && !submitted && (
                  <span className="w-7 h-7 rounded-full bg-gold-400 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {selOrder + 1}
                  </span>
                )}
                {submitted && <span className="flex-shrink-0">{isCorrect ? <Check className="w-5 h-5 text-sage-600" /> : isWrong ? '✗' : '·'}</span>}
                <span className="font-medium text-ink-800 flex-1">{ev.text}</span>
                {submitted && <span className="text-sm text-ink-500 flex-shrink-0">{ev.year < 0 ? `${Math.abs(ev.year)} BCE` : ev.year}</span>}
              </motion.button>
            );
          })}
        </div>

        {!submitted ? (
          <Button variant="gold" className="w-full" onClick={() => handleSubmit()} disabled={selected.length < 5}>
            Submit Order
          </Button>
        ) : (
          <div className="text-center space-y-3">
            <p className="text-2xl font-bold text-ink-800">
              {score}/100 — {score === 100 ? '🏆 Perfect!' : score >= 60 ? '👍 Good!' : '📚 Keep practising'}
            </p>
            <Button variant="primary" onClick={handleNext} className="w-full">
              {setIndex + 1 < TIMELINES.length ? 'Next Timeline' : 'See Results'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
