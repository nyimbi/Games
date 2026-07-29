'use client';
import { formatSubject } from '@/lib/utils/format';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Check, X, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';

interface Argument {
  claim: string; subject: string;
  counterOptions: string[]; bestCounter: number;
  explanation: string;
}

const ARGUMENTS: Argument[] = [
  {
    claim: "Social media has made people more politically informed and engaged.",
    subject: "Special Area",
    counterOptions: [
      "Social media creates echo chambers that reinforce existing beliefs rather than broadening political understanding.",
      "People simply don't use social media for political information.",
      "Print newspapers are more reliable.",
      "Political engagement was higher before the internet."
    ],
    bestCounter: 0,
    explanation: "The strongest counter attacks the premise directly: filter bubbles and algorithm-driven feeds mean users see more politics, but of an increasingly polarised, confirmation-biased kind — engagement up, understanding down."
  },
  {
    claim: "The Industrial Revolution improved living standards for ordinary people.",
    subject: "Social Studies",
    counterOptions: [
      "Early industrialisation created urban slums, child labour, and working conditions worse than rural poverty for at least two generations before benefits spread.",
      "The Industrial Revolution only helped factory owners.",
      "People were happy before the Industrial Revolution.",
      "Machines replaced all workers."
    ],
    bestCounter: 0,
    explanation: "The strongest counter acknowledges the long-run gains but attacks the timeline: the first generations of industrial workers lived shorter, harder lives than pre-industrial peasants. Progress came much later."
  },
  {
    claim: "Democracy is the most effective form of government.",
    subject: "Social Studies",
    counterOptions: [
      "Democratic short electoral cycles incentivise policies that win the next election rather than solve long-term problems like climate change or debt.",
      "Dictators are smarter than elected leaders.",
      "Voting is too complicated for most people.",
      "Ancient monarchies were more stable."
    ],
    bestCounter: 0,
    explanation: "The strongest counter doesn't attack democracy broadly but identifies its structural weakness: short-termism. Voters punish politicians for necessary painful reforms, creating a systematic bias toward short-term populism."
  },
  {
    claim: "Shakespeare's plays remain relevant because they explore timeless human nature.",
    subject: "Literature",
    counterOptions: [
      "Their apparent timelessness reflects the cultural dominance of English literature curricula, not universal appeal — many cultures find them alien and inaccessible.",
      "Shakespeare used complicated language that nobody understands.",
      "Modern films are better than plays.",
      "Shakespeare stole plots from other writers."
    ],
    bestCounter: 0,
    explanation: "The strongest counter questions 'timelessness' as a neutral claim — it may be a product of institutional power, not intrinsic value. Post-colonial literary criticism makes exactly this argument."
  },
  {
    claim: "Scientific progress always benefits humanity.",
    subject: "Science",
    counterOptions: [
      "Science has produced nuclear weapons, chemical warfare agents, and surveillance technologies that have caused unprecedented harm — the benefits depend entirely on who controls the applications.",
      "Scientists make mistakes sometimes.",
      "Science is too complicated for ordinary people.",
      "Religion provides better answers."
    ],
    bestCounter: 0,
    explanation: "The strongest counter is not anti-science but pro-ethics: the same knowledge that cures diseases enables mass destruction. 'Science benefits humanity' conflates discovery with application, ignoring the political question of who controls it."
  },
  {
    claim: "Globalisation has reduced global poverty.",
    subject: "Special Area",
    counterOptions: [
      "Aggregate poverty statistics mask growing within-country inequality; globalisation has enriched elites and the urban middle class while leaving the rural poor behind, increasing relative deprivation.",
      "Poor countries don't trade internationally.",
      "Globalisation only benefits the USA.",
      "Trade statistics are unreliable."
    ],
    bestCounter: 0,
    explanation: "The strongest counter uses the evidence against itself: absolute poverty has fallen, but relative inequality within many countries has risen sharply. 'Less poverty' and 'more equality' are different claims."
  },
  {
    claim: "The Impressionists revolutionised art because they broke with academic tradition.",
    subject: "Arts",
    counterOptions: [
      "Calling it a 'revolution' overstates the break — Impressionism built on Romanticism's subjectivism and Barbizon landscape painting; it was evolution within a tradition, not rupture from it.",
      "Impressionism is too colourful.",
      "Academic art was always bad.",
      "No one liked Impressionism at the time."
    ],
    bestCounter: 0,
    explanation: "The strongest counter questions the 'revolution' framing: historians of art often trace continuous threads from Courbet's Realism and the Barbizon School. 'Revolution' is a retrospective label that obscures the continuity."
  },
  {
    claim: "Nuclear energy is the solution to climate change.",
    subject: "Special Area",
    counterOptions: [
      "Nuclear plants take 10–20 years to build and cost billions — the climate crisis requires deployment of solutions now, and renewables can be scaled far faster and more cheaply.",
      "Nuclear energy is always dangerous.",
      "Countries don't have enough uranium.",
      "Nuclear energy produces too much noise."
    ],
    bestCounter: 0,
    explanation: "The strongest counter doesn't dispute nuclear's low-carbon credentials but attacks the timeline mismatch: we need rapid decarbonisation by 2030–2050, and nuclear's lead times and cost overruns make it a poor fit for that urgency."
  },
];

interface DevilsAdvocateProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function DevilsAdvocate({ onExit }: DevilsAdvocateProps) {
  const [queue] = useState(() => [...ARGUMENTS].sort(() => Math.random() - 0.5));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const q = queue[index];

  useEffect(() => {
    setTimeLeft(25); setSelected(null); setRevealed(false);
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
    if (choice === q.bestCounter) setScore(s => s + 15);
  };

  const handleNext = () => {
    if (index + 1 >= queue.length) { setPhase('ended'); return; }
    setIndex(i => i + 1);
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Devil's Advocate" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <Swords className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Done!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{score}<span className="text-xl text-ink-400">/{queue.length * 15}</span></p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Devil's Advocate" subtitle="Find the STRONGEST counter-argument" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline">{formatSubject(q.subject)}</Badge>
          <span className={`font-mono font-bold text-xl ${timeLeft <= 7 ? 'text-coral-600' : 'text-ink-700'}`}>{timeLeft}s</span>
        </div>
        <Progress value={(timeLeft / 25) * 100} className="mb-5 h-2" />

        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-5 border-2 border-gold-200 bg-gold-50"><CardContent className="p-5">
              <p className="text-xs font-semibold text-gold-600 uppercase tracking-wide mb-2">Claim to challenge:</p>
              <p className="font-display text-lg text-ink-800">"{q.claim}"</p>
            </CardContent></Card>

            <p className="text-sm font-semibold text-ink-600 mb-3">Which is the strongest counter-argument?</p>

            <div className="space-y-3 mb-4">
              {q.counterOptions.map((opt, i) => (
                <button key={i} onClick={() => !revealed && doReveal(i)}
                  className={`w-full p-4 rounded-xl border-2 text-left text-sm transition-all ${
                    revealed
                      ? i === q.bestCounter ? 'bg-sage-100 border-sage-400 text-sage-800' : i === selected ? 'bg-coral-100 border-coral-400 text-coral-800' : 'bg-cream-100 border-ink-100 text-ink-400'
                      : 'bg-white border-ink-200 hover:border-gold-300 hover:bg-gold-50 text-ink-800'
                  }`}>
                  <span className="flex items-start gap-2">
                    {revealed && i === q.bestCounter && <Check className="w-4 h-4 text-sage-600 flex-shrink-0 mt-0.5" />}
                    {revealed && i === selected && i !== q.bestCounter && <X className="w-4 h-4 text-coral-600 flex-shrink-0 mt-0.5" />}
                    {opt}
                  </span>
                </button>
              ))}
            </div>

            {revealed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className={`p-3 rounded-xl mb-4 text-sm ${selected === q.bestCounter ? 'bg-sage-50 border border-sage-200 text-sage-800' : 'bg-coral-50 border border-coral-200 text-coral-800'}`}>
                  <strong>Why this is the strongest:</strong> {q.explanation}
                </div>
                <Button variant="primary" className="w-full" onClick={handleNext}>
                  {index + 1 < queue.length ? 'Next Argument' : 'See Results'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}
