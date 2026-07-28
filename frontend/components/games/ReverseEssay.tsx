'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Check, X, ChevronRight, Lightbulb } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { GameLayout } from './GameLayout';

interface ReverseQ {
  subject: string;
  body: string;
  thesisOptions: string[];
  correctThesis: number;
  explanation: string;
}

const QUESTIONS: ReverseQ[] = [
  {
    subject: "Social Studies",
    body: `The printing press enabled Luther's 95 Theses to spread across Europe within weeks. Where the Church had previously controlled the reproduction of texts, laypeople could now read religious arguments in their own language. Protestant literacy campaigns drove demand for translated Bibles, which Gutenberg's technology could supply at scale. The resulting information environment fundamentally undermined the Church's monopoly on scriptural interpretation.`,
    thesisOptions: [
      "The printing press was a necessary enabler of the Protestant Reformation by democratising access to religious information.",
      "Martin Luther was a brave reformer who challenged Church corruption.",
      "The Catholic Church was too powerful in 16th-century Europe.",
      "Religious wars devastated Europe after the Reformation."
    ],
    correctThesis: 0,
    explanation: "The body paragraph traces a specific causal chain: printing press → mass distribution → undermined Church authority. The thesis must capture that causal argument, not just describe actors."
  },
  {
    subject: "Literature",
    body: `In Act 3, Macbeth has already murdered Duncan but cannot stop. He arranges Banquo's death to silence a witness, then Fleance's to prevent the prophecy's fulfillment. Each murder requires another to cover the last. Lady Macbeth, who initially drove the ambition, retreats into guilty madness while Macbeth becomes colder. The court that once honoured him now fears him. By Act 5, he fights alone, abandoned by allies who recognise what he has become.`,
    thesisOptions: [
      "Macbeth demonstrates that unchecked ambition is self-defeating: each act it demands makes the next inevitable, until it destroys everything it sought to protect.",
      "Macbeth is a tragedy about murder and its consequences.",
      "Lady Macbeth is the real villain of the play.",
      "Shakespeare believed that kings should be chosen carefully."
    ],
    correctThesis: 0,
    explanation: "The body shows a specific mechanism: ambition compels escalating violence that progressively destroys Macbeth's relationships, sanity, and power. The thesis must name that self-defeating spiral, not just summarise the plot."
  },
  {
    subject: "Science",
    body: `In environments polluted by industrial soot, dark-coloured peppered moths survived at higher rates than light ones — birds couldn't spot them against blackened bark. When clean-air legislation reduced pollution, the light form's survival rate recovered. The trait (colouration) had not changed; only the environment that determined its value had. The same alleles that were disadvantageous in clean forests became advantageous in soot-covered ones.`,
    thesisOptions: [
      "The peppered moth case shows that natural selection is entirely dependent on environment: the same trait can be advantageous or fatal depending on context.",
      "Peppered moths are an example of how pollution harms wildlife.",
      "Industrial pollution caused moths to evolve darker colouring.",
      "Natural selection always produces better-adapted organisms over time."
    ],
    correctThesis: 0,
    explanation: "The body illustrates a specific theoretical point: fitness is context-dependent. The same alleles shift from adaptive to maladaptive and back as the environment changes. Option C is a common misconception the paragraph actually refutes."
  },
  {
    subject: "Arts",
    body: `Warhol silkscreened Marilyn Monroe's face in garish, misregistered colours — pink skin, yellow hair, turquoise eyeshadow. He reproduced the same image dozens of times with slight colour variations. The technical 'errors' were deliberate. Mass reproduction drains an image of individuality; Marilyn becomes a logo. Warhol wanted viewers to feel the difference between a person and a commodity — and to realise, uncomfortably, that in consumer culture they are often the same thing.`,
    thesisOptions: [
      "Warhol's Marilyn Diptych uses mechanical reproduction and deliberate distortion to expose how consumer culture transforms people into commodities.",
      "Andy Warhol was a talented artist who made colourful paintings.",
      "Pop Art was a reaction against the seriousness of Abstract Expressionism.",
      "Celebrity culture in America was very powerful in the 1960s."
    ],
    correctThesis: 0,
    explanation: "The body describes specific formal choices (silkscreen, repetition, colour errors) and their intended effect (exposing commodification). The thesis must state that argument, not merely describe Warhol or Pop Art in general."
  },
  {
    subject: "Special Area",
    body: `Between 1990 and 2015, the share of the global population living in extreme poverty fell from 36% to 10%. Much of this occurred in China and South-East Asia, where export-led growth raised rural incomes. Yet within those same countries, Gini coefficients — measures of income inequality — rose sharply. Urban elites and factory owners captured a disproportionate share of growth. In sub-Saharan Africa, absolute poverty fell more slowly, while inequality between Africa and wealthy nations widened.`,
    thesisOptions: [
      "Globalisation has reduced absolute poverty in aggregate but has simultaneously deepened inequality within and between countries, making its benefits uneven rather than universal.",
      "Globalisation has been a great success for the world's poor.",
      "Income inequality is the most important economic problem today.",
      "China's economic growth has benefited millions of people."
    ],
    correctThesis: 0,
    explanation: "The body holds two simultaneous truths: aggregate poverty declined AND inequality rose. The thesis must hold both — a 'yes, but' structure. Options B and D capture only the positive side; option C makes a different argument entirely."
  },
];

interface ReverseEssayProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function ReverseEssay({ onExit }: ReverseEssayProps) {
  const [queue] = useState(() => [...QUESTIONS].sort(() => Math.random() - 0.5));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');

  const q = queue[index];

  const doReveal = (choice: number) => {
    if (revealed) return;
    setSelected(choice);
    setRevealed(true);
    if (choice === q.correctThesis) setScore(s => s + (showHint ? 10 : 15));
  };

  const handleNext = () => {
    if (index + 1 >= queue.length) { setPhase('ended'); return; }
    setIndex(i => i + 1);
    setSelected(null); setRevealed(false); setShowHint(false);
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Reverse Essay" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Done!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{score}<span className="text-xl text-ink-400">/{queue.length * 15}</span></p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Reverse Essay" subtitle="Read the body — find the thesis it argues" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline">{q.subject}</Badge>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowHint(!showHint)}
              className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full border transition-colors ${showHint ? 'bg-gold-100 border-gold-300 text-gold-700' : 'border-ink-200 text-ink-500 hover:border-gold-300'}`}>
              <Lightbulb className="w-3 h-3" /> Hint (-5pts)
            </button>
            <span className="text-sm text-ink-500">{index + 1}/{queue.length}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-5"><CardContent className="p-5">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Essay Body Paragraph:</p>
              <p className="text-sm text-ink-700 leading-relaxed">{q.body}</p>
            </CardContent></Card>

            {showHint && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-3 mb-4 bg-gold-50 border border-gold-200 rounded-xl text-sm text-gold-800">
                <strong>Hint:</strong> Look for the option that names the specific mechanism or argument illustrated in the paragraph — not just the topic.
              </motion.div>
            )}

            <p className="text-sm font-semibold text-ink-600 mb-3">Which thesis does this body paragraph argue?</p>
            <div className="space-y-3 mb-4">
              {q.thesisOptions.map((opt, i) => (
                <button key={i} onClick={() => doReveal(i)}
                  className={`w-full p-4 rounded-xl border-2 text-left text-sm transition-all ${
                    revealed
                      ? i === q.correctThesis ? 'bg-sage-100 border-sage-400 text-sage-800' : i === selected ? 'bg-coral-100 border-coral-400 text-coral-800' : 'bg-cream-100 border-ink-100 text-ink-400'
                      : 'bg-white border-ink-200 hover:border-gold-300 hover:bg-gold-50 text-ink-800'
                  }`}>
                  <span className="flex items-start gap-2">
                    {revealed && i === q.correctThesis && <Check className="w-4 h-4 text-sage-600 flex-shrink-0 mt-0.5" />}
                    {revealed && i === selected && i !== q.correctThesis && <X className="w-4 h-4 text-coral-600 flex-shrink-0 mt-0.5" />}
                    {opt}
                  </span>
                </button>
              ))}
            </div>

            {revealed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className={`p-3 rounded-xl mb-4 text-sm ${selected === q.correctThesis ? 'bg-sage-50 border border-sage-200 text-sage-800' : 'bg-coral-50 border border-coral-200 text-coral-800'}`}>
                  {q.explanation}
                </div>
                <Button variant="primary" className="w-full" onClick={handleNext}>
                  {index + 1 < queue.length ? 'Next Essay' : 'See Results'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}
