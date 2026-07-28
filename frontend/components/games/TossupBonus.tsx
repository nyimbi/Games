'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Check, X } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';

const QUESTIONS = [
  { text: "This process, which occurs in the mitochondria, converts glucose and oxygen into ATP, carbon dioxide, and water — a reaction essential to all aerobic life.", options: ["Cellular respiration", "Photosynthesis", "Fermentation", "Osmosis"], correct: 0, subject: "Science" },
  { text: "Born in Stratford-upon-Avon in 1564, this playwright wrote both the tragedy of a Danish prince and the comedy of twins in Illyria.", options: ["William Shakespeare", "Christopher Marlowe", "Ben Jonson", "John Donne"], correct: 0, subject: "Literature" },
  { text: "This 1789 political document, drafted largely by Thomas Jefferson, declared that all men are created equal and listed grievances against the British Crown.", options: ["Declaration of Independence", "US Constitution", "Bill of Rights", "Magna Carta"], correct: 0, subject: "Social Studies" },
  { text: "This mathematical concept, developed simultaneously by Newton and Leibniz in the 17th century, studies rates of change and areas under curves.", options: ["Calculus", "Algebra", "Geometry", "Trigonometry"], correct: 0, subject: "Science" },
  { text: "Painted between 1503 and 1519, this portrait by Leonardo da Vinci hangs in the Louvre and is famous for its subject's enigmatic expression.", options: ["Mona Lisa", "The Last Supper", "Vitruvian Man", "The Birth of Venus"], correct: 0, subject: "Arts" },
];

const POINT_VALUES = [10, 7, 5, 3];
const WORDS_PER_CLUE = 0.25; // reveal 25% of words per stage

interface TossupBonusProps {
  sessionId: string;
  isHost?: boolean;
  onExit?: () => void;
}

export function TossupBonus({ onExit }: TossupBonusProps) {
  const [qIndex, setQIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [clueStage, setClueStage] = useState(0);
  const [buzzed, setBuzzed] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [answerTimer, setAnswerTimer] = useState(10);
  const [phase, setPhase] = useState<'playing' | 'answering' | 'result' | 'ended'>('playing');
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const q = QUESTIONS[qIndex];
  const words = q.text.split(' ');
  const wordsPerStage = Math.ceil(words.length * WORDS_PER_CLUE);
  const visibleWordCount = Math.min(words.length, (clueStage + 1) * wordsPerStage + wordIndex);
  const visibleText = words.slice(0, visibleWordCount).join(' ');
  const pointValue = POINT_VALUES[Math.min(clueStage, POINT_VALUES.length - 1)];

  useEffect(() => {
    if (phase !== 'playing') return;
    intervalRef.current = setInterval(() => {
      setWordIndex(prev => {
        const next = prev + 1;
        if ((clueStage + 1) * wordsPerStage + next >= words.length) {
          clearInterval(intervalRef.current!);
          setTimeout(() => handleReveal(), 1500);
          return prev;
        }
        if (next >= wordsPerStage) {
          setClueStage(s => Math.min(s + 1, POINT_VALUES.length - 1));
          return 0;
        }
        return next;
      });
    }, 300);
    return () => clearInterval(intervalRef.current!);
  }, [phase, clueStage, q]);

  useEffect(() => {
    if (phase !== 'answering') return;
    answerRef.current = setInterval(() => {
      setAnswerTimer(t => {
        if (t <= 1) { clearInterval(answerRef.current!); handleReveal(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(answerRef.current!);
  }, [phase]);

  const handleBuzz = useCallback(() => {
    if (buzzed || phase !== 'playing') return;
    clearInterval(intervalRef.current!);
    setBuzzed(true);
    setPhase('answering');
    setAnswerTimer(10);
  }, [buzzed, phase]);

  const handleReveal = useCallback(() => {
    clearInterval(answerRef.current!);
    setRevealed(true);
    setPhase('result');
    const earned = selected === q.correct ? pointValue : 0;
    setScore(s => s + earned);
    setRoundScores(rs => [...rs, earned]);
  }, [selected, q.correct, pointValue]);

  const handleNext = () => {
    if (qIndex + 1 >= QUESTIONS.length) { setPhase('ended'); return; }
    setQIndex(i => i + 1);
    setWordIndex(0); setClueStage(0); setBuzzed(false);
    setSelected(null); setRevealed(false); setPhase('playing');
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Tossup/Bonus" players={[]} onBack={onExit}>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Card className="max-w-md w-full"><CardContent className="p-8 text-center">
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Game Over!</h2>
            <p className="text-5xl font-bold text-gold-500 my-6">{score} pts</p>
            <div className="flex gap-2 justify-center mb-6">
              {roundScores.map((s, i) => <Badge key={i} variant={s > 0 ? 'gold' : 'outline'}>{s}pts</Badge>)}
            </div>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Tossup/Bonus" subtitle="Buzz in early for maximum points!" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline">{q.subject}</Badge>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-500">Question {qIndex + 1}/{QUESTIONS.length}</span>
            <Badge variant="gold" className="text-lg px-3 py-1">{pointValue} pts</Badge>
          </div>
        </div>

        <Card className="mb-6"><CardContent className="p-6">
          <p className="font-display text-lg text-ink-800 leading-relaxed min-h-[80px]">
            {visibleText}
            {phase === 'playing' && <span className="animate-pulse">▍</span>}
          </p>
          <Progress value={(visibleWordCount / words.length) * 100} className="mt-4" />
        </CardContent></Card>

        <AnimatePresence>
          {phase === 'answering' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 mb-6">
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => !revealed && setSelected(i)}
                  className={`w-full p-4 rounded-xl text-left border-2 transition-all ${
                    revealed
                      ? i === q.correct ? 'bg-sage-100 border-sage-500' : i === selected ? 'bg-coral-100 border-coral-400' : 'bg-cream-100 border-transparent'
                      : selected === i ? 'bg-gold-100 border-gold-400' : 'bg-cream-100 border-ink-200 hover:border-ink-400'
                  }`}>
                  <span className="font-medium text-ink-800">{String.fromCharCode(65 + i)}. {opt}</span>
                </button>
              ))}
              {!revealed && <Button variant="gold" className="w-full" onClick={handleReveal} disabled={selected === null}>Submit ({answerTimer}s)</Button>}
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'result' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
            <p className="text-2xl font-bold">{selected === q.correct ? <span className="text-sage-600">✓ Correct! +{pointValue}pts</span> : <span className="text-coral-600">✗ Wrong — 0pts</span>}</p>
            <Button variant="primary" onClick={handleNext}>{qIndex + 1 < QUESTIONS.length ? 'Next Question →' : 'See Results'}</Button>
          </motion.div>
        )}

        {phase === 'playing' && (
          <div className="text-center mt-auto">
            <motion.button
              onClick={handleBuzz}
              whileTap={{ scale: 0.95 }}
              className="w-32 h-32 rounded-full bg-gold-400 hover:bg-gold-500 shadow-lg flex flex-col items-center justify-center mx-auto cursor-pointer"
            >
              <Zap className="w-8 h-8 text-white" />
              <span className="text-white font-bold mt-1">BUZZ!</span>
            </motion.button>
          </div>
        )}

        <div className="mt-4 text-center text-ink-500 font-medium">Score: {score}</div>
      </div>
    </GameLayout>
  );
}
