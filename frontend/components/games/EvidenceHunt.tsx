'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Check, X, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';

interface EvidenceQ {
  claim: string; subject: string;
  evidence: string[]; supports: number;
  explanation: string;
}

const QUESTIONS: EvidenceQ[] = [
  {
    claim: "The printing press accelerated the Protestant Reformation.",
    subject: "Social Studies",
    evidence: [
      "Martin Luther's 95 Theses were printed and distributed across Europe within weeks of posting, reaching tens of thousands of readers.",
      "Gutenberg invented the printing press around 1440.",
      "The Catholic Church had a large number of monasteries.",
      "Protestant hymns became popular in the 16th century."
    ],
    supports: 0,
    explanation: "Only option A directly shows the mechanism: mass reproduction of Luther's ideas bypassed Church control of information, making the Reformation viral."
  },
  {
    claim: "Natural selection acts on variation in a population.",
    subject: "Science",
    evidence: [
      "Peppered moths with darker colouring survived at higher rates in industrial England because they blended into soot-blackened trees.",
      "Charles Darwin sailed on the HMS Beagle.",
      "Fossils of extinct species have been found worldwide.",
      "Gregor Mendel studied pea plants."
    ],
    supports: 0,
    explanation: "The peppered moth example directly demonstrates selection acting on a specific variation (colour) under a specific environmental pressure — textbook evidence for the claim."
  },
  {
    claim: "Impressionist painters prioritised capturing light over depicting precise forms.",
    subject: "Arts",
    evidence: [
      "Monet painted the same Rouen Cathedral 30 times at different times of day to capture how light transformed its appearance.",
      "Pierre-Auguste Renoir was a French painter.",
      "The Impressionists often painted outdoors.",
      "Edgar Degas was known for his ballet paintings."
    ],
    supports: 0,
    explanation: "Monet's Cathedral series directly illustrates the priority: the subject (stone architecture) is static, but he painted it repeatedly to track light alone. That is the claim in action."
  },
  {
    claim: "Shakespeare's language shaped modern English vocabulary.",
    subject: "Literature",
    evidence: [
      "Over 1,700 words and phrases first recorded in Shakespeare's works — including 'bedroom', 'generous', and 'lonely' — are in everyday use today.",
      "Shakespeare lived in the 16th and 17th centuries.",
      "Hamlet is one of the most performed plays in history.",
      "Shakespeare wrote in iambic pentameter."
    ],
    supports: 0,
    explanation: "Option A provides specific, countable evidence of vocabulary impact. The others are biographical or performance facts that don't address the claim about language shaping modern English."
  },
  {
    claim: "Social media amplifies political polarisation.",
    subject: "Special Area",
    evidence: [
      "A 2018 MIT study found that false political news spread six times faster on Twitter than true news, reaching more people and triggering stronger emotional responses.",
      "Facebook was founded in 2004.",
      "Many politicians use Twitter.",
      "People spend an average of 2.5 hours on social media daily."
    ],
    supports: 0,
    explanation: "The MIT study directly measures the amplification mechanism — falsehoods spread faster and farther — and links this to the emotional intensity that drives polarisation."
  },
  {
    claim: "The Marshall Plan helped prevent communism from spreading in Western Europe after WWII.",
    subject: "Social Studies",
    evidence: [
      "Countries that received the most Marshall Plan aid — West Germany, France, Italy — saw communist party support drop sharply as economic recovery stabilised governments.",
      "The Marshall Plan was proposed by Secretary of State George Marshall in 1947.",
      "The Soviet Union rejected Marshall Plan aid.",
      "The plan provided $13 billion to European nations."
    ],
    supports: 0,
    explanation: "Option A is the only one showing the causal chain: aid → recovery → declining communist support. The others describe the plan itself without linking it to anti-communist outcomes."
  },
  {
    claim: "Biodiversity is essential for ecosystem stability.",
    subject: "Science",
    evidence: [
      "Experimental plots with higher plant species diversity withstand drought, pest outbreaks, and climate fluctuations better than monocultures, recovering faster after disturbance.",
      "The Amazon rainforest contains approximately 10% of all species on Earth.",
      "Many medicines derive from rainforest plants.",
      "The IUCN classifies thousands of species as endangered."
    ],
    supports: 0,
    explanation: "Option A provides experimental evidence directly linking biodiversity to stability outcomes (drought resistance, recovery). The others are facts about biodiversity but don't demonstrate the stability connection."
  },
  {
    claim: "Post-colonial literature challenges Eurocentric narratives of history.",
    subject: "Literature",
    evidence: [
      "Chinua Achebe's Things Fall Apart retells the story of colonialism from the perspective of an Igbo community, explicitly rewriting Conrad's Heart of Darkness.",
      "Chinua Achebe was from Nigeria.",
      "Post-colonial literature emerged in the 20th century.",
      "Many post-colonial writers write in English."
    ],
    supports: 0,
    explanation: "Option A names a specific work and shows how it works as a challenge: it rewrites a canonical Eurocentric text from the colonised perspective — this is the claim in literary practice."
  },
];

interface EvidenceHuntProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function EvidenceHunt({ onExit }: EvidenceHuntProps) {
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
    if (choice === q.supports) setScore(s => s + 15);
  };

  const handleNext = () => {
    if (index + 1 >= queue.length) { setPhase('ended'); return; }
    setIndex(i => i + 1);
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Evidence Hunt" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <Search className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Case Closed!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{score}<span className="text-xl text-ink-400">/{queue.length * 15}</span></p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Evidence Hunt" subtitle="Which piece of evidence BEST supports the claim?" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline">{q.subject}</Badge>
          <span className={`font-mono font-bold text-xl ${timeLeft <= 5 ? 'text-coral-600' : 'text-ink-700'}`}>{timeLeft}s</span>
        </div>
        <Progress value={(timeLeft / 20) * 100} className="mb-5 h-2" />

        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-5 border-2 border-gold-200 bg-gold-50"><CardContent className="p-5">
              <p className="text-xs font-semibold text-gold-600 uppercase tracking-wide mb-2">Claim:</p>
              <p className="font-display text-lg text-ink-800">{q.claim}</p>
            </CardContent></Card>

            <p className="text-sm font-semibold text-ink-600 mb-3">Select the strongest supporting evidence:</p>
            <div className="space-y-3 mb-4">
              {q.evidence.map((ev, i) => (
                <button key={i} onClick={() => !revealed && doReveal(i)}
                  className={`w-full p-4 rounded-xl border-2 text-left text-sm transition-all ${
                    revealed
                      ? i === q.supports ? 'bg-sage-100 border-sage-400 text-sage-800' : i === selected ? 'bg-coral-100 border-coral-400 text-coral-800' : 'bg-cream-100 border-ink-100 text-ink-400'
                      : 'bg-white border-ink-200 hover:border-gold-300 hover:bg-gold-50 text-ink-800'
                  }`}>
                  <span className="flex items-start gap-2">
                    <span className="font-bold text-ink-400 flex-shrink-0">{String.fromCharCode(65 + i)}.</span>
                    <span className="flex-1">{ev}</span>
                    {revealed && i === q.supports && <Check className="w-4 h-4 text-sage-600 flex-shrink-0" />}
                    {revealed && i === selected && i !== q.supports && <X className="w-4 h-4 text-coral-600 flex-shrink-0" />}
                  </span>
                </button>
              ))}
            </div>

            {revealed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className={`p-3 rounded-xl mb-4 text-sm ${selected === q.supports ? 'bg-sage-50 border border-sage-200 text-sage-800' : 'bg-coral-50 border border-coral-200 text-coral-800'}`}>
                  {q.explanation}
                </div>
                <Button variant="primary" className="w-full" onClick={handleNext}>
                  {index + 1 < queue.length ? 'Next Question' : 'See Results'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}
