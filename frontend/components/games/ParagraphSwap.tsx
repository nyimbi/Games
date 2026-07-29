'use client';
import { formatSubject } from '@/lib/utils/format';

import { useState } from 'react';
import { motion } from 'motion/react';
import { GripVertical, Check, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { GameLayout } from './GameLayout';

interface Essay {
  title: string; subject: string;
  paragraphs: string[];
  correctOrder: number[];
  explanation: string;
}

const ESSAYS: Essay[] = [
  {
    title: "The Causes of World War I",
    subject: "Social Studies",
    paragraphs: [
      "The most immediate trigger was the assassination of Archduke Franz Ferdinand in Sarajevo on June 28, 1914. A Bosnian-Serb nationalist, Gavrilo Princip, shot the heir to the Austro-Hungarian throne, setting off a chain of ultimatums and mobilisations.",
      "World War I emerged from a volatile combination of long-term structural tensions and a short-term crisis that the major powers failed to contain. Understanding the war requires examining both the kindling and the spark.",
      "Beneath these immediate events lay deeper causes: a tangled system of military alliances, an arms race between Britain and Germany, imperial rivalry across Africa and Asia, and a wave of nationalist movements threatening the multi-ethnic empires of Austria-Hungary and Ottoman Turkey.",
      "Within six weeks, the assassination had transformed into a continental war involving all the major European powers. The alliance system had converted a localised political murder into a catastrophe — demonstrating how structural tensions, once ignited, can spiral beyond any single actor's control."
    ],
    correctOrder: [1, 2, 0, 3],
    explanation: "Structure: Introduction (B) → Structural/long-term causes (C) → Immediate trigger (A) → Consequence/conclusion (D). Essays move from general context to specific trigger to outcome."
  },
  {
    title: "Why Impressionism Mattered",
    subject: "Arts",
    paragraphs: [
      "Before the Impressionists, European painting was dominated by the Academy, which prized historical and mythological subjects rendered with polished, invisible brushstrokes. Art was supposed to look effortless and eternal.",
      "Impressionism permanently changed what art was allowed to be. It shifted the subject of painting from the heroic and timeless to the everyday and momentary — and it made the act of looking, rather than the thing looked at, the true subject of art.",
      "Monet, Renoir, Pissarro, and their circle broke these rules deliberately: they painted fleeting weather, working-class leisure, and city life with loose, visible brushstrokes that captured the experience of seeing rather than a polished reconstruction of reality.",
      "The critics mocked them for it. The name 'Impressionism' was itself a jeer, taken from Monet's Impression, Sunrise. But the mockery backfired: by naming the movement, critics gave it identity and coherence."
    ],
    correctOrder: [0, 2, 3, 1],
    explanation: "Structure: Context/status quo (A) → Impressionists' challenge to it (C) → Critical reaction (D) → Significance/conclusion (B)."
  },
  {
    title: "How Natural Selection Works",
    subject: "Science",
    paragraphs: [
      "Over generations, individuals with advantageous traits leave more descendants. Gradually, the proportion of those traits in the population increases. This is not a directed process — there is no goal or design — only differential survival and reproduction.",
      "Natural selection begins with variation: individuals in a population differ from one another in heritable traits — height, colouring, disease resistance, behaviour.",
      "The result, over sufficient time, is adaptation: populations become increasingly well-suited to their environments. New species can arise when populations become reproductively isolated and diverge under different selective pressures.",
      "Some of these variations affect survival and reproduction. An organism whose traits help it find food, avoid predators, or attract mates is more likely to survive and pass those traits to its offspring."
    ],
    correctOrder: [1, 3, 0, 2],
    explanation: "Structure: Variation exists (B) → Variation affects fitness (D) → Fitness affects reproduction over generations (A) → Long-run outcome: adaptation/speciation (C)."
  },
  {
    title: "The Power of Allegory in Animal Farm",
    subject: "Literature",
    paragraphs: [
      "By the novel's end, the pigs have become indistinguishable from the human farmers they overthrew: 'The creatures outside looked from pig to man, and from man to pig, and from pig to man again; but already it was impossible to say which was which.' Orwell's allegory collapses the distinction between oppressor and revolutionary.",
      "George Orwell wrote Animal Farm in 1945 as a fable about the Soviet Revolution — but he insisted it was not merely a historical satire. He wanted to show how revolutions in general can be corrupted from within.",
      "The animal rebellion against Farmer Jones maps precisely onto the Bolshevik Revolution of 1917. Old Major is Marx/Lenin; Napoleon is Stalin; Snowball is Trotsky. The Seven Commandments of Animalism parallel the promises of communist ideology.",
      "The allegory's power is that it works on two levels simultaneously: as a children's fable, it is charming and simple; as political philosophy, it is devastating. Orwell chose animals precisely because they disarm the reader's defences before delivering the argument."
    ],
    correctOrder: [1, 2, 3, 0],
    explanation: "Structure: Context/author's intent (B) → How the allegory maps (C) → Why allegory is the right form (D) → Conclusion: what the allegory proves (A)."
  },
];

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

interface ParagraphSwapProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function ParagraphSwap({ onExit }: ParagraphSwapProps) {
  const [queue] = useState(() => ESSAYS.map(e => ({ ...e, shuffled: shuffle([0, 1, 2, 3]) })).sort(() => Math.random() - 0.5));
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState<number[]>(() => queue[0].shuffled);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');

  const essay = queue[index];

  const move = (i: number, dir: -1 | 1) => {
    if (submitted) return;
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  const handleSubmit = () => {
    const correct = essay.correctOrder;
    const matches = order.filter((v, i) => v === correct[i]).length;
    const earned = matches === 4 ? 20 : matches === 3 ? 15 : matches === 2 ? 10 : 0;
    setScore(s => s + earned);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (index + 1 >= queue.length) { setPhase('ended'); return; }
    const next = index + 1;
    setIndex(next);
    setOrder(queue[next].shuffled);
    setSubmitted(false);
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Paragraph Swap" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Done!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{score}<span className="text-xl text-ink-400">/{queue.length * 20}</span></p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Paragraph Swap" subtitle="Drag paragraphs into the correct essay order" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-display font-bold text-ink-800">{essay.title}</p>
            <Badge variant="outline">{formatSubject(essay.subject)}</Badge>
          </div>
          <span className="text-sm text-ink-500">{index + 1}/{queue.length}</span>
        </div>

        <div className="space-y-3 mb-5">
          {order.map((paraIdx, pos) => {
            const isCorrect = submitted && essay.correctOrder[pos] === paraIdx;
            const isWrong = submitted && essay.correctOrder[pos] !== paraIdx;
            return (
              <motion.div key={paraIdx} layout
                className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors ${
                  isCorrect ? 'bg-sage-100 border-sage-400' : isWrong ? 'bg-coral-50 border-coral-300' : 'bg-white border-ink-200'
                }`}>
                <div className="flex flex-col gap-1 flex-shrink-0 mt-1">
                  <button onClick={() => move(pos, -1)} disabled={pos === 0 || submitted} className="text-ink-400 hover:text-ink-700 disabled:opacity-30">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <GripVertical className="w-4 h-4 text-ink-300" />
                  <button onClick={() => move(pos, 1)} disabled={pos === order.length - 1 || submitted} className="text-ink-400 hover:text-ink-700 disabled:opacity-30">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <span className="inline-block w-6 h-6 rounded-full bg-ink-200 text-ink-600 text-xs font-bold text-center leading-6 mr-2 flex-shrink-0">{pos + 1}</span>
                  <p className="text-sm text-ink-700 inline">{essay.paragraphs[paraIdx]}</p>
                </div>
                {submitted && isCorrect && <Check className="w-5 h-5 text-sage-600 flex-shrink-0" />}
              </motion.div>
            );
          })}
        </div>

        {!submitted ? (
          <Button variant="gold" className="w-full" onClick={handleSubmit}>Submit Order</Button>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="p-3 rounded-xl bg-sage-50 border border-sage-200 text-sm text-sage-800">
              <strong>Essay structure:</strong> {essay.explanation}
            </div>
            <Button variant="primary" className="w-full" onClick={handleNext}>
              {index + 1 < queue.length ? 'Next Essay' : 'See Results'} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </div>
    </GameLayout>
  );
}
