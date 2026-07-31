'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { PracticeGameLayout, PracticeAnswerButton } from '@/components/practice';
import { vaultApi, WrongWordItem } from '@/lib/api/vault';
import { useWordVault } from '@/lib/hooks/useVault';

type Phase = 'loading' | 'detect' | 'fix' | 'reveal' | 'done';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tokenize(passage: string): { text: string; word: string }[] {
  return passage.split(/\s+/).map(t => ({
    text: t,
    word: t.replace(/[.,!?;:"()]/g, '').toLowerCase(),
  }));
}

export default function WrongWordHuntPage() {
  const router = useRouter();
  const { stats, recordEncounter } = useWordVault({ autoLoad: true });

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<WrongWordItem[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);

  const [flashIdx, setFlashIdx] = useState<number | null>(null);
  const [hadWrongTap, setHadWrongTap] = useState(false);
  const [optionState, setOptionState] = useState<Record<string, 'idle' | 'correct' | 'wrong' | 'muted'>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [step2Correct, setStep2Correct] = useState(false);

  const roundStartMs = useRef(Date.now());
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    vaultApi.getWrongWordItems()
      .then(res => {
        const picked = shuffle(res.items).slice(0, 10);
        if (picked.length === 0) { setError('No items available.'); return; }
        setItems(picked);
        roundStartMs.current = Date.now();
        setPhase('detect');
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load items.'));
    return () => { if (revealTimer.current) clearTimeout(revealTimer.current); };
  }, []);

  const item = items[roundIndex];

  function handleWordTap(token: { text: string; word: string }, idx: number) {
    if (phase !== 'detect') return;
    if (token.word === item.wrong_word.toLowerCase()) {
      setPhase('fix');
      const states: Record<string, 'idle' | 'correct' | 'wrong' | 'muted'> = {};
      item.options.forEach(o => { states[o] = 'idle'; });
      setOptionState(states);
    } else {
      setHadWrongTap(true);
      setScore(s => s - 2);
      setFlashIdx(idx);
      setTimeout(() => setFlashIdx(null), 600);
    }
  }

  function handleOptionPick(option: string) {
    if (phase !== 'fix' || selectedOption !== null) return;
    const correct = option === item.correct_word;
    setSelectedOption(option);
    setStep2Correct(correct);
    setScore(s => correct ? s + 10 : s - 5);

    const newStates: Record<string, 'idle' | 'correct' | 'wrong' | 'muted'> = {};
    item.options.forEach(o => {
      if (o === item.correct_word) newStates[o] = 'correct';
      else if (o === option && !correct) newStates[o] = 'wrong';
      else newStates[o] = 'muted';
    });
    setOptionState(newStates);

    const elapsed = Date.now() - roundStartMs.current;
    void recordEncounter({ word: item.wrong_word, game_id: 'wrong_word_hunt', mode: 'cloze', correct: !hadWrongTap, ms: elapsed });
    void recordEncounter({ word: item.correct_word, game_id: 'wrong_word_hunt', mode: 'cloze', correct: correct, ms: elapsed });

    setPhase('reveal');
    revealTimer.current = setTimeout(() => advanceRound(), 1500);
  }

  function advanceRound() {
    const next = roundIndex + 1;
    if (next >= items.length) {
      setPhase('done');
      return;
    }
    setRoundIndex(next);
    setFlashIdx(null);
    setHadWrongTap(false);
    setSelectedOption(null);
    setOptionState({});
    setStep2Correct(false);
    roundStartMs.current = Date.now();
    setPhase('detect');
  }

  function handlePlayAgain() {
    setItems(prev => shuffle(prev));
    setRoundIndex(0);
    setScore(0);
    setFlashIdx(null);
    setHadWrongTap(false);
    setSelectedOption(null);
    setOptionState({});
    setStep2Correct(false);
    roundStartMs.current = Date.now();
    setPhase('detect');
  }

  if (error) {
    return (
      <PracticeGameLayout title="Wrong Word Hunt" onBack={() => router.push('/team/practice/vocabulary')}>
        <div className="flex flex-col items-center gap-6 pt-16">
          <p className="text-ink-600 text-center">{error}</p>
          <button
            onClick={() => router.push('/team/practice/vocabulary')}
            className="px-6 py-3 rounded-2xl bg-gold-400 font-display font-bold text-ink-800 min-h-14"
          >
            Back
          </button>
        </div>
      </PracticeGameLayout>
    );
  }

  const subtitle =
    phase === 'detect' ? 'Tap the wrong word' :
    phase === 'fix' ? 'Pick the fix' :
    phase === 'reveal' ? "Here's why" :
    undefined;

  return (
    <PracticeGameLayout
      title="Wrong Word Hunt"
      subtitle={subtitle}
      onBack={() => router.push('/team/practice/vocabulary')}
      mastery={{ mastered: stats.mastered, sticky: stats.sticky }}
      rightBadge={<span className="font-display font-bold text-lg text-gold-600">{score}</span>}
    >
      {phase === 'loading' && (
        <div className="flex items-center justify-center pt-24">
          <motion.div
            className="w-10 h-10 rounded-full border-4 border-gold-400 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          />
        </div>
      )}

      {(phase === 'detect' || phase === 'fix' || phase === 'reveal') && item && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-400 font-medium">
              {roundIndex + 1} / {items.length}
            </span>
            <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold-400 rounded-full transition-all duration-300"
                style={{ width: `${(roundIndex / items.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-ink-100">
            <div className="text-lg md:text-xl leading-relaxed flex flex-wrap gap-x-1 gap-y-2">
              {tokenize(item.passage).map((token, idx) => {
                const isWrongWord = token.word === item.wrong_word.toLowerCase();
                const isFlashing = flashIdx === idx;

                if (phase === 'detect') {
                  return (
                    <motion.button
                      key={idx}
                      onClick={() => handleWordTap(token, idx)}
                      animate={isFlashing ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className={`inline-block px-1 py-1 rounded-md transition-colors cursor-pointer min-h-[40px] leading-normal text-ink-800
                        ${isFlashing ? 'bg-coral-200 text-coral-700' : 'hover:bg-gold-100 active:bg-gold-200'}`}
                    >
                      {token.text}
                    </motion.button>
                  );
                }

                return (
                  <span
                    key={idx}
                    className={`inline-block px-1 py-1 leading-normal
                      ${isWrongWord ? 'line-through text-coral-500 font-bold' : 'text-ink-800'}`}
                  >
                    {token.text}
                  </span>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {(phase === 'fix' || phase === 'reveal') && (
              <motion.div
                key="options"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-3"
              >
                {item.options.map(opt => (
                  <PracticeAnswerButton
                    key={opt}
                    onClick={() => handleOptionPick(opt)}
                    disabled={selectedOption !== null}
                    state={optionState[opt] ?? 'idle'}
                  >
                    {opt}
                  </PracticeAnswerButton>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'reveal' && (
              <motion.div
                key="explanation"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl px-5 py-4 border-2 ${step2Correct ? 'bg-sage-50 border-sage-400' : 'bg-coral-50 border-coral-400'}`}
              >
                <p className={`text-sm font-medium leading-relaxed ${step2Correct ? 'text-sage-800' : 'text-coral-800'}`}>
                  {item.explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {phase === 'done' && (
        <div className="flex flex-col items-center gap-8 pt-8">
          <div className="text-center">
            <p className="font-display font-bold text-5xl text-gold-600">{score}</p>
            <p className="text-ink-500 mt-1">points earned</p>
          </div>
          <p className="text-ink-700 text-center text-lg">
            You finished {items.length} rounds of Wrong Word Hunt!
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={handlePlayAgain}
              className="w-full min-h-14 rounded-2xl bg-gold-400 hover:bg-gold-500 active:bg-gold-600 font-display font-bold text-xl text-ink-800 transition-colors shadow-sm"
            >
              Play Again
            </button>
            <button
              onClick={() => router.push('/team/practice/vocabulary')}
              className="w-full min-h-14 rounded-2xl border-2 border-ink-200 hover:bg-ink-50 font-display font-bold text-xl text-ink-700 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </PracticeGameLayout>
  );
}
