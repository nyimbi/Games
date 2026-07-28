'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { generateHangmanTargets, type HangmanTarget } from '@/lib/games/mathGenerators';

const TOTAL_ROUNDS = 10;
const MAX_WRONG = 7;

const HANGMAN_PARTS = [
  <line key="pole"    x1="20" y1="90" x2="80" y2="90" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />,
  <line key="upright" x1="50" y1="90" x2="50" y2="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />,
  <line key="top"     x1="50" y1="10" x2="75" y2="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />,
  <line key="rope"    x1="75" y1="10" x2="75" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  <circle key="head"  cx="75" cy="28" r="6" stroke="currentColor" strokeWidth="2" fill="none" />,
  <line key="body"    x1="75" y1="34" x2="75" y2="56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  <line key="larm"    x1="75" y1="40" x2="62" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  <line key="rarm"    x1="75" y1="40" x2="88" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  <line key="lleg"    x1="75" y1="56" x2="62" y2="68" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  <line key="rleg"    x1="75" y1="56" x2="88" y2="68" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
];

function buildClues(t: HangmanTarget): string[] {
  const n = parseInt(t.word);
  const digitSum = t.word.split('').reduce((a, d) => a + parseInt(d), 0);
  return [
    `I am a ${t.word.length}-digit ${n % 2 === 0 ? 'even' : 'odd'} number.`,
    t.hint,
    `The sum of my digits is ${digitSum}.`,
    `I belong to the category: ${t.category}.`,
  ];
}

interface MathHangmanProps { sessionId: string; isHost?: boolean; onExit?: () => void; }

export function MathHangman({ onExit }: MathHangmanProps) {
  const [pool] = useState(() => generateHangmanTargets(TOTAL_ROUNDS * 3));
  const [round, setRound] = useState(1);
  const [poolIdx, setPoolIdx] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost' | 'ended'>('playing');
  const [score, setScore] = useState(0);
  const [clueIdx, setClueIdx] = useState(0);

  const puzzle: HangmanTarget = pool[poolIdx % pool.length];
  const clues = buildClues(puzzle);
  const uniqueDigits = [...new Set(puzzle.word.split(''))];
  const wrongGuesses = [...guessed].filter(d => !uniqueDigits.includes(d));
  const wrongCount = wrongGuesses.length;
  const revealed = puzzle.word.split('').map(d => guessed.has(d) ? d : '_');
  const won = revealed.every(d => d !== '_');

  const guess = (digit: string) => {
    if (guessed.has(digit) || phase !== 'playing') return;
    const next = new Set(guessed);
    next.add(digit);
    setGuessed(next);

    const newWrong = [...next].filter(d => !uniqueDigits.includes(d)).length;
    if (uniqueDigits.every(d => next.has(d))) {
      setScore(s => s + Math.max(20 - newWrong * 3, 5));
      setPhase('won');
    } else if (newWrong >= MAX_WRONG) {
      setPhase('lost');
    }
  };

  const nextRound = () => {
    if (round >= TOTAL_ROUNDS) { setPhase('ended'); return; }
    setPoolIdx(i => i + 1);
    setGuessed(new Set());
    setPhase('playing');
    setRound(r => r + 1);
    setClueIdx(0);
  };

  if (phase === 'ended') {
    return (
      <GameLayout title="Math Hangman" players={[]} onBack={onExit}>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full"><CardContent className="p-8 text-center">
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">Done!</h2>
            <p className="text-5xl font-bold text-gold-500 my-4">{score}</p>
            <Button variant="primary" onClick={onExit}>Done</Button>
          </CardContent></Card>
        </div>
      </GameLayout>
    );
  }

  const visibleParts = 3 + wrongCount;

  return (
    <GameLayout title="Math Hangman" subtitle="Guess the digits of the mystery number" players={[]} onBack={onExit}>
      <div className="flex-1 flex flex-col p-6 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline">Round {round}/{TOTAL_ROUNDS}</Badge>
          <div className="flex items-center gap-3">
            <Badge variant={puzzle.difficulty === 'hard' ? 'coral' : puzzle.difficulty === 'medium' ? 'gold' : 'outline'}>
              {puzzle.difficulty}
            </Badge>
            <span className="text-sm text-ink-500">Score: <strong>{score}</strong></span>
          </div>
        </div>

        <div className="flex gap-6 mb-5">
          <svg viewBox="0 0 100 100" className="w-28 h-28 text-ink-700 flex-shrink-0">
            {HANGMAN_PARTS.slice(0, visibleParts)}
          </svg>

          <div className="flex-1">
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Clues</p>
            {clues.slice(0, clueIdx + 1).map((clue, i) => (
              <motion.p key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="text-sm text-ink-700 mb-1 flex items-start gap-1">
                <span className="text-gold-500 flex-shrink-0">•</span>{clue}
              </motion.p>
            ))}
            {clueIdx < clues.length - 1 && phase === 'playing' && (
              <button onClick={() => setClueIdx(c => c + 1)}
                className="text-xs text-gold-600 hover:underline mt-1">+ More clue</button>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          {revealed.map((ch, i) => (
            <div key={i} className="w-12 h-14 border-b-4 border-ink-700 flex items-end justify-center pb-1">
              <span className={`font-display text-2xl font-bold ${ch === '_' ? 'text-ink-200' : 'text-gold-600'}`}>
                {ch === '_' ? '_' : ch}
              </span>
            </div>
          ))}
        </div>

        {phase === 'playing' && (
          <div>
            <p className="text-xs text-ink-400 text-center mb-3">
              Wrong: {wrongCount}/{MAX_WRONG}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {['0','1','2','3','4','5','6','7','8','9'].map(d => {
                const isGuessedD = guessed.has(d);
                const isCorrectD = isGuessedD && uniqueDigits.includes(d);
                const isWrongD = isGuessedD && !uniqueDigits.includes(d);
                return (
                  <button key={d} onClick={() => guess(d)} disabled={isGuessedD}
                    className={`h-12 rounded-xl font-bold text-xl border-2 transition-all ${
                      isCorrectD ? 'bg-sage-100 border-sage-400 text-sage-700'
                      : isWrongD  ? 'bg-coral-100 border-coral-300 text-coral-400 line-through'
                      : 'bg-white border-ink-200 hover:border-gold-400 hover:bg-gold-50 text-ink-800'
                    }`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(phase === 'won' || phase === 'lost') && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl text-center ${phase === 'won' ? 'bg-sage-100 border-2 border-sage-400' : 'bg-coral-100 border-2 border-coral-400'}`}>
            <p className="font-display text-xl font-bold mb-1">
              {phase === 'won'
                ? `Correct! ${puzzle.word} — ${puzzle.hint}`
                : `The number was ${puzzle.word} (${puzzle.category})`}
            </p>
            <Button variant="primary" onClick={nextRound} className="mt-3">
              {round < TOTAL_ROUNDS ? 'Next Number' : 'See Results'} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </div>
    </GameLayout>
  );
}
