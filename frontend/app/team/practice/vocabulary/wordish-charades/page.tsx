'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, CheckCircle2, XCircle } from 'lucide-react';
import { PracticeGameLayout, PracticeAnswerButton } from '@/components/practice';
import { vaultApi, WordCatalogItem } from '@/lib/api/vault';
import { aiApi } from '@/lib/api/ai';
import { useWordVault } from '@/lib/hooks/useVault';

interface RoundData {
  item: WordCatalogItem;
  clues: string[];
  options: string[];
}

type Phase = 'loading' | 'playing' | 'reveal' | 'done';

const TOTAL_ROUNDS = 5;
const SCORE_CAPS = [15, 10, 5, 0];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDisstractors(target: WordCatalogItem, catalog: WordCatalogItem[], count = 3): string[] {
  const samePos = catalog.filter(w => w.word !== target.word && w.pos === target.pos);
  const pool = samePos.length >= count ? samePos : catalog.filter(w => w.word !== target.word);
  return shuffle(pool)
    .slice(0, count)
    .map(w => w.word);
}

export default function WordishCharadesPage() {
  const router = useRouter();
  const { stats, recordEncounter } = useWordVault({ autoLoad: true });

  const [phase, setPhase] = useState<Phase>('loading');
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [round, setRound] = useState(0);
  const [clueIdx, setClueIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [roundStart, setRoundStart] = useState(0);

  const loadRounds = useCallback(async () => {
    setPhase('loading');
    setLoadProgress(0);
    setLoadError(null);

    let catalog: WordCatalogItem[] = [];
    try {
      const res = await vaultApi.getWordCatalog({ level: 2 });
      catalog = res.words;
    } catch {
      setLoadError('Could not load the word catalog. Please try again.');
      return;
    }

    const shuffled = shuffle(catalog);
    const picked: WordCatalogItem[] = [];
    const seen = new Set<string>();
    for (const w of shuffled) {
      if (!seen.has(w.pos ?? '') || picked.length < TOTAL_ROUNDS) {
        if (!seen.has(w.word)) {
          picked.push(w);
          seen.add(w.word);
          if (picked.length === TOTAL_ROUNDS) break;
        }
      }
    }

    let completed = 0;
    const results = await Promise.all(
      picked.map(async (item) => {
        const attempt = async () => aiApi.generateWordClues({
          word: item.word,
          pos: item.pos,
          definition: item.definition,
        });
        let res;
        try {
          res = await attempt();
        } catch {
          res = await attempt();
        }
        completed++;
        setLoadProgress(Math.round((completed / TOTAL_ROUNDS) * 100));
        return { item, clues: res.clues.slice(0, 3) };
      }).map(p => p.catch(() => null))
    );

    const valid = results.filter((r): r is { item: WordCatalogItem; clues: string[] } => r !== null && r.clues.length > 0);
    if (valid.length < TOTAL_ROUNDS) {
      setLoadError('Some clues could not be generated. Please try again.');
      return;
    }

    const roundData: RoundData[] = valid.slice(0, TOTAL_ROUNDS).map(r => ({
      item: r.item,
      clues: r.clues,
      options: shuffle([r.item.word, ...pickDisstractors(r.item, catalog)]),
    }));

    setRounds(roundData);
    setRound(0);
    setClueIdx(0);
    setSelected(null);
    setTotalScore(0);
    setRoundScores([]);
    setRoundStart(Date.now());
    setPhase('playing');
  }, []);

  useEffect(() => {
    void loadRounds();
  }, [loadRounds]);

  const currentRound = rounds[round];

  function handleAnswer(word: string) {
    if (phase !== 'playing' || selected !== null) return;
    setSelected(word);
    const correct = word === currentRound.item.word;
    const score = correct ? SCORE_CAPS[clueIdx] ?? 0 : 0;
    const ms = Date.now() - roundStart;

    if (correct) {
      const newScores = [...roundScores, score];
      setRoundScores(newScores);
      setTotalScore(prev => prev + score);
      setPhase('reveal');
      void recordEncounter({
        word: currentRound.item.word,
        pos: currentRound.item.pos,
        game_id: 'wordish_charades',
        mode: 'sound',
        correct: true,
        ms,
      });
      setTimeout(() => advanceRound(newScores), 1500);
    } else if (clueIdx < 2) {
      setSelected(null);
    } else {
      const newScores = [...roundScores, 0];
      setRoundScores(newScores);
      setPhase('reveal');
      void recordEncounter({
        word: currentRound.item.word,
        pos: currentRound.item.pos,
        game_id: 'wordish_charades',
        mode: 'sound',
        correct: false,
        ms,
      });
      setTimeout(() => advanceRound(newScores), 2000);
    }
  }

  function showNextClue() {
    if (clueIdx < 2) {
      setClueIdx(prev => prev + 1);
      setSelected(null);
    }
  }

  function advanceRound(scores: number[]) {
    if (round + 1 >= TOTAL_ROUNDS) {
      setPhase('done');
    } else {
      setRound(prev => prev + 1);
      setClueIdx(0);
      setSelected(null);
      setRoundStart(Date.now());
      setPhase('playing');
    }
  }

  const wrongOnCurrentClue = selected !== null && selected !== currentRound?.item.word;

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-200 flex flex-col items-center justify-center gap-6 px-6">
        <motion.div
          className="text-5xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity }}
        >
          🕵️
        </motion.div>
        <h2 className="font-display font-bold text-2xl text-ink-800 text-center">
          Warming up the mystery machine…
        </h2>
        <p className="text-ink-500 text-sm text-center max-w-xs">
          Cooking up 5 riddles — this takes 10–20 seconds. Grab a pencil!
        </p>
        <div className="w-64 h-3 bg-ink-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gold-400 rounded-full"
            animate={{ width: `${loadProgress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-xs text-ink-400">{loadProgress}% ready</p>
        {loadError && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <p className="text-coral-700 text-sm text-center">{loadError}</p>
            <button
              onClick={() => void loadRounds()}
              className="px-6 py-3 rounded-2xl bg-gold-400 text-ink-800 font-display font-bold text-lg"
            >
              Try again
            </button>
            <button
              onClick={() => router.push('/team/practice/vocabulary')}
              className="text-ink-500 text-sm underline"
            >
              Back
            </button>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'done') {
    const clue1Count = roundScores.filter(s => s === 15).length;
    const clue2Count = roundScores.filter(s => s === 10).length;
    const clue3Count = roundScores.filter(s => s === 5).length;
    const missedCount = roundScores.filter(s => s === 0).length;

    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-200 flex flex-col items-center justify-center gap-6 px-6 py-12">
        <div className="text-5xl">🎉</div>
        <h2 className="font-display font-bold text-3xl text-ink-800">Game over!</h2>
        <div className="bg-white rounded-3xl shadow-sm border border-ink-100 p-6 w-full max-w-sm flex flex-col items-center gap-2">
          <span className="text-ink-500 text-sm uppercase tracking-wide font-medium">Total score</span>
          <span className="font-display font-bold text-5xl text-gold-600">{totalScore}</span>
        </div>
        <div className="w-full max-w-sm grid grid-cols-2 gap-3">
          {clue1Count > 0 && (
            <div className="bg-sage-50 border border-sage-200 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-sage-700">{clue1Count}</div>
              <div className="text-xs text-sage-600 mt-1">First clue 🌟</div>
            </div>
          )}
          {clue2Count > 0 && (
            <div className="bg-gold-50 border border-gold-200 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-gold-700">{clue2Count}</div>
              <div className="text-xs text-gold-600 mt-1">Second clue</div>
            </div>
          )}
          {clue3Count > 0 && (
            <div className="bg-cream-100 border border-ink-200 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-ink-600">{clue3Count}</div>
              <div className="text-xs text-ink-500 mt-1">Third clue</div>
            </div>
          )}
          {missedCount > 0 && (
            <div className="bg-coral-50 border border-coral-200 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-coral-700">{missedCount}</div>
              <div className="text-xs text-coral-600 mt-1">Missed</div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            onClick={() => void loadRounds()}
            className="w-full min-h-14 rounded-2xl bg-gold-400 text-ink-800 font-display font-bold text-xl"
          >
            Play again
          </button>
          <button
            onClick={() => router.push('/team/practice/vocabulary')}
            className="w-full min-h-14 rounded-2xl border-2 border-ink-200 text-ink-600 font-display font-bold text-xl bg-white"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!currentRound) return null;

  const isReveal = phase === 'reveal';
  const revealCorrect = selected === currentRound.item.word;

  return (
    <PracticeGameLayout
      title="Wordish Charades"
      subtitle={`Round ${round + 1} of ${TOTAL_ROUNDS} · Clue ${clueIdx + 1}/3`}
      onBack={() => router.push('/team/practice/vocabulary')}
      mastery={{ mastered: stats.mastered, sticky: stats.sticky }}
      rightBadge={
        <span className="font-display font-bold text-lg text-gold-600">{totalScore}</span>
      }
    >
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Clue stack */}
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {currentRound.clues.slice(0, clueIdx + 1).map((clue, idx) => {
              const isCurrent = idx === clueIdx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: isCurrent ? 1 : 0.45, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-3xl border-2 p-5 ${
                    isCurrent
                      ? 'bg-white border-gold-300 shadow-sm'
                      : 'bg-cream-50 border-ink-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb
                      className={`w-5 h-5 ${isCurrent ? 'text-gold-500' : 'text-ink-300'}`}
                    />
                    <span
                      className={`text-xs font-medium uppercase tracking-wide ${
                        isCurrent ? 'text-gold-600' : 'text-ink-400'
                      }`}
                    >
                      Clue {idx + 1} of 3
                    </span>
                    {isCurrent && (
                      <span className="ml-auto text-sm font-bold text-gold-600 bg-gold-50 px-3 py-1 rounded-full border border-gold-200">
                        +{SCORE_CAPS[clueIdx]} pts
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-lg md:text-xl italic leading-relaxed ${
                      isCurrent ? 'text-ink-700' : 'text-ink-400'
                    }`}
                  >
                    &ldquo;{clue}&rdquo;
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Wrong answer flash */}
        <AnimatePresence>
          {wrongOnCurrentClue && (
            <motion.div
              key="wrong-hint"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-coral-50 border border-coral-200 rounded-2xl px-4 py-3 text-coral-700 text-sm font-medium"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              Not quite — {clueIdx < 2 ? 'tap "Next clue" or try again!' : 'last clue revealed below.'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reveal feedback */}
        <AnimatePresence>
          {isReveal && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-4 flex items-start gap-3 ${
                revealCorrect ? 'bg-sage-50 border border-sage-200' : 'bg-coral-50 border border-coral-200'
              }`}
            >
              {revealCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-coral-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-display font-bold text-lg ${revealCorrect ? 'text-sage-800' : 'text-coral-800'}`}>
                  {revealCorrect ? `+${SCORE_CAPS[clueIdx]}! "${currentRound.item.word}"` : `The word was "${currentRound.item.word}"`}
                </p>
                <p className="text-sm text-ink-600 mt-1 leading-snug">{currentRound.item.definition}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next clue button */}
        {phase === 'playing' && clueIdx < 2 && (
          <button
            onClick={showNextClue}
            className="w-full min-h-14 rounded-2xl border-2 border-ink-200 bg-white text-ink-700 font-display font-bold text-lg hover:border-gold-300 hover:bg-gold-50 transition-colors"
          >
            Show next clue ↓
          </button>
        )}

        {/* Answer grid */}
        <div className="grid grid-cols-2 gap-3">
          {currentRound.options.map(opt => {
            let state: 'idle' | 'correct' | 'wrong' | 'muted' = 'idle';
            if (isReveal) {
              if (opt === currentRound.item.word) state = 'correct';
              else if (opt === selected) state = 'wrong';
              else state = 'muted';
            } else if (wrongOnCurrentClue && opt === selected) {
              state = 'wrong';
            }
            return (
              <PracticeAnswerButton
                key={opt}
                onClick={() => handleAnswer(opt)}
                disabled={isReveal}
                state={state}
              >
                {opt}
              </PracticeAnswerButton>
            );
          })}
        </div>
      </div>
    </PracticeGameLayout>
  );
}
