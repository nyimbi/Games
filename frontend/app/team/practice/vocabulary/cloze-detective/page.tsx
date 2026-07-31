'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Search, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { PracticeGameLayout, PracticeAnswerButton } from '@/components/practice';
import { vaultApi, WordCatalogItem } from '@/lib/api/vault';
import { useWordVault } from '@/lib/hooks/useVault';

const ROUNDS = 10;

interface Round {
  item: WordCatalogItem;
  passage: string;
  options: string[];
  correct: string;
}

function buildPassage(item: WordCatalogItem): string | null {
  const re = new RegExp(`\\b${item.word}\\b`, 'i');
  if (!re.test(item.example)) return null;
  return item.example.replace(re, '__________');
}

function pickDistractors(
  target: WordCatalogItem,
  pool: WordCatalogItem[],
): string[] {
  const result: string[] = [];
  const used = new Set<string>([target.word.toLowerCase()]);

  const add = (w: string) => {
    if (!used.has(w.toLowerCase()) && result.length < 3) {
      used.add(w.toLowerCase());
      result.push(w);
    }
  };

  // Priority 1: antonyms from catalog item
  for (const ant of target.antonyms ?? []) add(ant);

  // Priority 2: same pos, same level
  if (result.length < 3) {
    const samePosLevel = pool.filter(
      (w) => w.pos === target.pos && w.level === target.level && !used.has(w.word.toLowerCase()),
    );
    // shuffle deterministically enough
    for (const w of samePosLevel) {
      add(w.word);
      if (result.length >= 3) break;
    }
  }

  // Priority 3: random others
  if (result.length < 3) {
    const others = pool.filter((w) => !used.has(w.word.toLowerCase()));
    for (const w of others) {
      add(w.word);
      if (result.length >= 3) break;
    }
  }

  return result.slice(0, 3);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRounds(catalog: WordCatalogItem[]): Round[] {
  const eligible = catalog.filter((item) => buildPassage(item) !== null);
  const shuffled = shuffle(eligible);
  const rounds: Round[] = [];
  const usedWords = new Set<string>();

  for (const item of shuffled) {
    if (rounds.length >= ROUNDS) break;
    if (usedWords.has(item.word.toLowerCase())) continue;

    const passage = buildPassage(item);
    if (!passage) continue;

    const distractors = pickDistractors(item, eligible);
    if (distractors.length < 3) continue;

    const options = shuffle([item.word, ...distractors]);
    rounds.push({ item, passage, options, correct: item.word });
    usedWords.add(item.word.toLowerCase());
  }

  return rounds;
}

type Phase = 'loading' | 'playing' | 'reveal' | 'done';

export default function ClozeDetectivePage() {
  const router = useRouter();
  const { stats, recordEncounter } = useWordVault({ autoLoad: true });

  const [catalog, setCatalog] = useState<WordCatalogItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [phase, setPhase] = useState<Phase>('loading');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<{ word: string; correct: boolean }[]>([]);
  const startMs = useRef<number>(0);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    vaultApi.getWordCatalog({ level: 2 })
      .then((res) => {
        setCatalog(res.words);
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : 'Failed to load catalog');
      });
  }, []);

  useEffect(() => {
    if (catalog.length === 0) return;
    const built = buildRounds(catalog);
    if (built.length < ROUNDS) {
      setLoadError('Not enough words in catalog to build a game.');
      return;
    }
    setRounds(built);
    setPhase('playing');
    startMs.current = Date.now();
  }, [catalog]);

  const currentRound = rounds[round];

  const handleSelect = (word: string) => {
    if (phase !== 'playing' || !currentRound) return;
    const elapsed = Date.now() - startMs.current;
    const isCorrect = word.toLowerCase() === currentRound.correct.toLowerCase();

    setSelected(word);
    setPhase('reveal');
    if (isCorrect) setScore((s) => s + 1);
    setResults((r) => [...r, { word: currentRound.correct, correct: isCorrect }]);

    void recordEncounter({
      word: currentRound.correct,
      pos: currentRound.item.pos ?? null,
      game_id: 'cloze_detective',
      mode: 'cloze',
      correct: isCorrect,
      ms: elapsed,
    });

    revealTimer.current = setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        setPhase('done');
      } else {
        setRound((r) => r + 1);
        setSelected(null);
        setPhase('playing');
        startMs.current = Date.now();
      }
    }, 1200);
  };

  useEffect(() => {
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, []);

  const restart = () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    const built = buildRounds(catalog);
    setRounds(built);
    setRound(0);
    setScore(0);
    setSelected(null);
    setResults([]);
    setPhase('playing');
    startMs.current = Date.now();
  };

  const isCorrectSelected = selected !== null &&
    currentRound &&
    selected.toLowerCase() === currentRound.correct.toLowerCase();

  const connectionNote = useMemo(() => {
    if (!currentRound) return '';
    const { item } = currentRound;
    return `"${item.word}" means ${item.definition.charAt(0).toLowerCase()}${item.definition.slice(1).replace(/\.$/, '')} — that fits this sentence.`;
  }, [currentRound]);

  if (loadError) {
    return (
      <PracticeGameLayout
        title="Cloze Detective"
        onBack={() => router.push('/team/practice/vocabulary')}
      >
        <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
          <XCircle className="w-12 h-12 text-coral-500" />
          <p className="text-ink-700 text-lg font-medium">{loadError}</p>
          <button
            onClick={() => router.push('/team/practice/vocabulary')}
            className="px-6 py-3 rounded-2xl bg-ink-800 text-cream-100 font-display font-bold text-lg"
          >
            Go Back
          </button>
        </div>
      </PracticeGameLayout>
    );
  }

  if (phase === 'loading') {
    return (
      <PracticeGameLayout
        title="Cloze Detective"
        onBack={() => router.push('/team/practice/vocabulary')}
      >
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-4 border-gold-400 border-t-transparent rounded-full"
          />
          <p className="text-ink-500 text-sm">Loading words…</p>
        </div>
      </PracticeGameLayout>
    );
  }

  if (phase === 'done') {
    const newWords = results.map((r, i) => ({ ...r, target: rounds[i]?.correct ?? r.word }));
    return (
      <PracticeGameLayout
        title="Cloze Detective"
        onBack={() => router.push('/team/practice/vocabulary')}
        mastery={{ mastered: stats.mastered, sticky: stats.sticky }}
        rightBadge={
          <span className="font-display font-bold text-lg text-gold-600">{score}/{ROUNDS}</span>
        }
      >
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col items-center gap-3 py-6">
            <Trophy className="w-14 h-14 text-gold-500" />
            <h2 className="font-display font-bold text-3xl text-ink-800">
              {score >= 8 ? 'Brilliant!' : score >= 5 ? 'Nice work!' : 'Keep at it!'}
            </h2>
            <p className="text-ink-500 text-lg">
              {score} out of {ROUNDS} correct
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-ink-100 divide-y divide-ink-100 shadow-sm">
            {newWords.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                {r.correct ? (
                  <CheckCircle2 className="w-5 h-5 text-sage-500 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-coral-500 shrink-0" />
                )}
                <span className="font-display font-bold text-ink-800">{r.target}</span>
                <span className="text-ink-400 text-sm ml-auto">
                  {rounds[i]?.item.pos ?? ''}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={restart}
              className="flex-1 py-4 rounded-2xl bg-gold-500 text-ink-900 font-display font-bold text-lg shadow active:scale-[0.97] transition-transform"
            >
              Play Again
            </button>
            <button
              onClick={() => router.push('/team/practice/vocabulary')}
              className="flex-1 py-4 rounded-2xl bg-ink-100 text-ink-700 font-display font-bold text-lg active:scale-[0.97] transition-transform"
            >
              Back
            </button>
          </div>
        </div>
      </PracticeGameLayout>
    );
  }

  if (!currentRound) return null;

  const optionState = (word: string): 'idle' | 'correct' | 'wrong' | 'muted' => {
    if (phase !== 'reveal' || selected === null) return 'idle';
    if (word.toLowerCase() === currentRound.correct.toLowerCase()) return 'correct';
    if (word === selected) return 'wrong';
    return 'muted';
  };

  return (
    <PracticeGameLayout
      title="Cloze Detective"
      subtitle={`Question ${round + 1} of ${ROUNDS}`}
      onBack={() => router.push('/team/practice/vocabulary')}
      mastery={{ mastered: stats.mastered, sticky: stats.sticky }}
      rightBadge={
        <span className="font-display font-bold text-lg text-gold-600">{score}</span>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Passage card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={round}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-2xl border border-ink-100 shadow-sm px-6 py-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-gold-500 shrink-0" />
              <span className="text-xs font-medium text-gold-600 uppercase tracking-wider">
                Fill in the blank
              </span>
            </div>
            <p className="text-xl leading-relaxed text-ink-800 font-medium">
              {currentRound.passage.split('__________').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="inline-block min-w-24 border-b-4 border-gold-400 mx-1 text-transparent align-bottom">
                      _____
                    </span>
                  )}
                </span>
              ))}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Reveal banner */}
        <AnimatePresence>
          {phase === 'reveal' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed overflow-hidden ${
                isCorrectSelected
                  ? 'bg-sage-50 border border-sage-300 text-sage-800'
                  : 'bg-coral-50 border border-coral-300 text-coral-800'
              }`}
            >
              {isCorrectSelected ? (
                <span className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{connectionNote}</span>
                </span>
              ) : (
                <span className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    The word is <strong className="font-bold">{currentRound.correct}</strong>. {connectionNote}
                  </span>
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer grid */}
        <div className="grid grid-cols-2 gap-3">
          {currentRound.options.map((word) => (
            <PracticeAnswerButton
              key={word}
              onClick={() => handleSelect(word)}
              disabled={phase === 'reveal'}
              state={optionState(word)}
            >
              {word}
            </PracticeAnswerButton>
          ))}
        </div>
      </div>
    </PracticeGameLayout>
  );
}
