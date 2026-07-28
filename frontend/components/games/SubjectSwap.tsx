'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, X, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';

interface SwapQuestion {
  setup: string; fromSubject: string; toSubject: string;
  pivot: string;
  options: string[]; correct: number; explanation: string;
}

const QUESTIONS: SwapQuestion[] = [
  { setup: "In Literature, Macbeth's 'ambition that o'erleaps itself' leads to his downfall.", fromSubject: "Literature", toSubject: "Social Studies", pivot: "What historical leader does this pattern most closely resemble?", options: ["Napoleon Bonaparte", "Abraham Lincoln", "Nelson Mandela", "George Washington"], correct: 0, explanation: "Napoleon's unchecked imperial ambition — invading Russia, defying his allies — mirrors Macbeth's fatal overreach." },
  { setup: "In Science, natural selection favours traits that improve reproductive fitness.", fromSubject: "Science", toSubject: "Social Studies", pivot: "Which economic concept operates on the same survival logic?", options: ["Free market competition", "Central planning", "Keynesian stimulus", "Tariff protection"], correct: 0, explanation: "Free market competition mirrors natural selection: firms that adapt survive; those that don't are eliminated." },
  { setup: "In Arts, Impressionism captured fleeting moments of light rather than fixed reality.", fromSubject: "Arts", toSubject: "Literature", pivot: "Which literary technique shares this focus on subjective, momentary perception?", options: ["Stream of consciousness", "Allegory", "Dramatic irony", "Epic simile"], correct: 0, explanation: "Stream of consciousness captures the mind's shifting, impressionistic flow — just as Monet captured shifting light." },
  { setup: "In Social Studies, the Cold War was an arms race fought more through proxy conflicts than direct warfare.", fromSubject: "Social Studies", toSubject: "Special Area", pivot: "Which modern competition most resembles the Cold War's indirect rivalry?", options: ["US-China tech and AI rivalry", "Brexit negotiations", "OPEC oil pricing", "WHO pandemic response"], correct: 0, explanation: "The US-China competition in semiconductors, 5G, and AI parallels Cold War logic: indirect competition with massive global stakes." },
  { setup: "In Literature, the tragic hero's hamartia (fatal flaw) causes their own destruction.", fromSubject: "Literature", toSubject: "Science", pivot: "Which scientific concept involves a system's internal flaw leading to self-destruction?", options: ["Positive feedback loop", "Entropy", "Half-life decay", "Osmosis"], correct: 0, explanation: "A positive feedback loop amplifies a flaw until the system collapses — like a tragic hero whose flaw spirals out of control." },
  { setup: "In Arts, the Bauhaus movement argued that form should follow function.", fromSubject: "Arts", toSubject: "Special Area", pivot: "Which technology design philosophy most directly echoes Bauhaus thinking?", options: ["Minimalist UX design", "Skeuomorphism", "Data-heavy dashboards", "Augmented reality overlays"], correct: 0, explanation: "Minimalist UX (Apple, Google's Material Design) strips away decoration to prioritise function — pure Bauhaus translated to software." },
  { setup: "In Science, the placebo effect shows that belief in treatment produces real physiological change.", fromSubject: "Science", toSubject: "Social Studies", pivot: "Which social phenomenon operates through the same 'belief creates reality' mechanism?", options: ["Self-fulfilling prophecy", "Confirmation bias", "Groupthink", "Cognitive dissonance"], correct: 0, explanation: "A self-fulfilling prophecy works like a social placebo: the belief in an outcome triggers behaviours that make it real." },
  { setup: "In Social Studies, colonialism restructured local economies to serve the coloniser's needs.", fromSubject: "Social Studies", toSubject: "Special Area", pivot: "Which contemporary economic pattern most resembles colonial extraction?", options: ["Tech platform data harvesting", "Fair trade certification", "Foreign direct investment", "Development aid"], correct: 0, explanation: "Tech platforms extract user data (the new raw material) to generate value elsewhere — a structural parallel to colonial resource extraction." },
  { setup: "In Literature, Don Quixote mistakes windmills for giants because he sees the world through the lens of chivalric romance.", fromSubject: "Literature", toSubject: "Science", pivot: "Which cognitive or perceptual phenomenon does Don Quixote's delusion most closely illustrate?", options: ["Confirmation bias", "Natural selection", "Cognitive dissonance", "Occam's razor"], correct: 0, explanation: "Don Quixote filters all perception through a pre-existing framework — a perfect literary embodiment of confirmation bias." },
  { setup: "In Arts, Picasso's Cubism showed multiple perspectives of the same object simultaneously.", fromSubject: "Arts", toSubject: "Social Studies", pivot: "Which diplomatic or analytical concept captures the same 'multiple simultaneous viewpoints' idea?", options: ["Multipolar world order", "Unilateralism", "Bilateral treaty", "Soft power"], correct: 0, explanation: "A multipolar world — with the US, China, EU, and others each asserting different realities — is the geopolitical equivalent of Cubism." },
];

interface SubjectSwapProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function SubjectSwap({ onExit }: SubjectSwapProps) {
  const [queue] = useState(() => [...QUESTIONS].sort(() => Math.random() - 0.5));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const q = queue[index];

  useEffect(() => {
    setTimeLeft(20); setSelected(null); setRevealed(false);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); doReveal(null); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [index]);

  const doReveal = (choice: number | null) => {
    clearInterval(timerRef.current!);
    setSelected(choice);
    setRevealed(true);
    if (choice === q.correct) setScore(s => s + 15);
  };

  const handleNext = () => {
    if (index + 1 >= queue.length) { setPhase('ended'); return; }
    setIndex(i => i + 1);
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Subject Swap" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Complete!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{score}<span className="text-xl text-ink-400">/{queue.length * 15}</span></p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Subject Swap" subtitle="A concept from one subject — applied to another" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{q.fromSubject}</Badge>
            <ArrowRight className="w-4 h-4 text-ink-400" />
            <Badge variant="gold">{q.toSubject}</Badge>
          </div>
          <span className={`font-mono font-bold text-xl ${timeLeft <= 5 ? 'text-coral-600' : 'text-ink-700'}`}>{timeLeft}s</span>
        </div>
        <Progress value={(timeLeft / 20) * 100} className="mb-5 h-2" />

        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-2 bg-gold-50 border-gold-200"><CardContent className="p-4 text-sm text-ink-700">{q.setup}</CardContent></Card>
            <Card className="mb-5"><CardContent className="p-5">
              <p className="font-display text-lg font-semibold text-ink-800">{q.pivot}</p>
            </CardContent></Card>

            <div className="grid grid-cols-1 gap-3 mb-4">
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => !revealed && doReveal(i)}
                  className={`p-4 rounded-xl border-2 text-left font-medium transition-all ${
                    revealed
                      ? i === q.correct ? 'bg-sage-100 border-sage-400 text-sage-800' : i === selected ? 'bg-coral-100 border-coral-400 text-coral-800' : 'bg-cream-100 border-ink-100 text-ink-400'
                      : 'bg-white border-ink-200 hover:border-gold-300 hover:bg-gold-50 text-ink-800'
                  }`}>
                  <span className="flex items-center gap-2">
                    {revealed && i === q.correct && <Check className="w-4 h-4 text-sage-600 flex-shrink-0" />}
                    {revealed && i === selected && i !== q.correct && <X className="w-4 h-4 text-coral-600 flex-shrink-0" />}
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
      </div>
    </GameLayout>
  );
}
