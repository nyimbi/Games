'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Sparkles, Trophy, XCircle } from 'lucide-react';
import { PracticeGameLayout } from '@/components/practice';
import { useWordVault } from '@/lib/hooks/useVault';
import type { WordCatalogItem } from '@/lib/api/vault';

type ChipKind = 'synonym' | 'opposite' | 'related' | 'distractor';
type BucketId = 'synonyms' | 'related' | 'opposites';
type Phase = 'loading' | 'placing' | 'checked' | 'advancing' | 'done';

interface Chip {
  id: string;
  word: string;
  kind: ChipKind;
}

interface Round {
  centerWord: string;
  definition: string;
  chips: Chip[];
}

const TOTAL_ROUNDS = 5;
const CHIPS_PER_ROUND = 6;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRound(item: WordCatalogItem, catalog: WordCatalogItem[]): Round {
  const chips: Chip[] = [];

  // Synonyms (2–3)
  const syns = shuffle(item.synonyms ?? []).slice(0, 3);
  syns.forEach((w, i) => chips.push({ id: `syn-${i}`, word: w, kind: 'synonym' }));

  // Opposites (1–2)
  const opps = shuffle(item.antonyms ?? []).slice(0, 2);
  opps.forEach((w, i) => chips.push({ id: `opp-${i}`, word: w, kind: 'opposite' }));

  // Related: family members or same pos+level peers
  const usedWords = new Set([item.word, ...syns, ...opps]);
  const relatedPool: string[] = item.family
    ? item.family.filter(w => !usedWords.has(w))
    : catalog
        .filter(c => c !== item && c.pos === item.pos && c.level === item.level && !usedWords.has(c.word))
        .map(c => c.word);

  const spaceLeft = CHIPS_PER_ROUND - chips.length;
  const usedRelated = shuffle(relatedPool).slice(0, Math.min(relatedPool.length, Math.floor(spaceLeft / 2), 2));
  usedRelated.forEach(w => usedWords.add(w));
  usedRelated.forEach((w, i) => chips.push({ id: `rel-${i}`, word: w, kind: 'related' }));

  // Distractors to fill up to CHIPS_PER_ROUND
  const distNeeded = CHIPS_PER_ROUND - chips.length;
  const distPool = shuffle(catalog.filter(c => !usedWords.has(c.word)).map(c => c.word));
  distPool.slice(0, distNeeded).forEach((w, i) => chips.push({ id: `dist-${i}`, word: w, kind: 'distractor' }));

  return {
    centerWord: item.word,
    definition: item.definition,
    chips: shuffle(chips).slice(0, CHIPS_PER_ROUND),
  };
}

function pickRoundItems(catalog: WordCatalogItem[], count: number): WordCatalogItem[] {
  let pool = catalog.filter(w => (w.synonyms?.length ?? 0) >= 2 && (w.antonyms?.length ?? 0) >= 1);
  if (pool.length < count) {
    pool = catalog.filter(w => (w.synonyms?.length ?? 0) >= 1 && (w.antonyms?.length ?? 0) >= 1);
  }
  return shuffle(pool).slice(0, count);
}

const BUCKET_CONFIG: {
  id: BucketId;
  label: string;
  bg: string;
  border: string;
  borderDashed: string;
  labelColor: string;
}[] = [
  {
    id: 'synonyms',
    label: 'Synonyms',
    bg: 'bg-sage-50',
    border: 'border-sage-300',
    borderDashed: 'border-dashed border-sage-300',
    labelColor: 'text-sage-700',
  },
  {
    id: 'related',
    label: 'Related',
    bg: 'bg-gold-50',
    border: 'border-gold-300',
    borderDashed: 'border-dashed border-gold-300',
    labelColor: 'text-gold-700',
  },
  {
    id: 'opposites',
    label: 'Opposites',
    bg: 'bg-coral-50',
    border: 'border-coral-300',
    borderDashed: 'border-dashed border-coral-300',
    labelColor: 'text-coral-700',
  },
];

export default function WordWebPage() {
  const router = useRouter();
  const {
    stats,
    loading: vaultLoading,
    error: vaultError,
    recordEncounter,
    loadCatalog,
    catalog,
  } = useWordVault({ autoLoad: true });

  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [placements, setPlacements] = useState<Record<string, BucketId>>({});
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [gameError, setGameError] = useState<string | null>(null);
  const roundStartMs = useRef(Date.now());

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (catalog.length === 0) return;
    const items = pickRoundItems(catalog, TOTAL_ROUNDS);
    if (items.length === 0) {
      setGameError('Not enough vocabulary words with synonyms and antonyms available.');
      return;
    }
    const builtRounds = items.map(item => buildRound(item, catalog));
    setRounds(builtRounds);
    setRoundIdx(0);
    setScore(0);
    setTotalCorrect(0);
    setPlacements({});
    setSelectedChipId(null);
    setResults({});
    roundStartMs.current = Date.now();
    setPhase('placing');
  }, [catalog]);

  const currentRound = rounds[roundIdx];

  const poolChips = useMemo((): Chip[] => {
    if (!currentRound) return [];
    return currentRound.chips.filter(c => !(c.id in placements));
  }, [currentRound, placements]);

  const bucketChips = useMemo((): Record<BucketId, Chip[]> => {
    const b: Record<BucketId, Chip[]> = { synonyms: [], related: [], opposites: [] };
    if (!currentRound) return b;
    for (const [chipId, bucketId] of Object.entries(placements)) {
      const chip = currentRound.chips.find(c => c.id === chipId);
      if (chip) b[bucketId].push(chip);
    }
    return b;
  }, [currentRound, placements]);

  function handleChipTap(chip: Chip) {
    if (phase !== 'placing') return;
    setSelectedChipId(prev => (prev === chip.id ? null : chip.id));
  }

  function handlePlacedChipTap(chip: Chip, e: MouseEvent) {
    e.stopPropagation();
    if (phase !== 'placing') return;
    setPlacements(prev => {
      const next = { ...prev };
      delete next[chip.id];
      return next;
    });
    setSelectedChipId(chip.id);
  }

  function handleBucketTap(bucketId: BucketId) {
    if (phase !== 'placing' || !selectedChipId) return;
    setPlacements(prev => ({ ...prev, [selectedChipId]: bucketId }));
    setSelectedChipId(null);
  }

  function checkAnswers() {
    if (!currentRound) return;
    const elapsedMs = Date.now() - roundStartMs.current;
    const newResults: Record<string, 'correct' | 'wrong'> = {};
    let roundScore = 0;
    let allCorrect = true;
    let correctCount = 0;

    for (const chip of currentRound.chips) {
      const placed = placements[chip.id] as BucketId | undefined;
      let correct = false;

      if (chip.kind === 'distractor') {
        correct = placed === undefined;
      } else if (chip.kind === 'synonym') {
        correct = placed === 'synonyms';
      } else if (chip.kind === 'opposite') {
        correct = placed === 'opposites';
      } else {
        // related
        correct = placed === 'related';
      }

      newResults[chip.id] = correct ? 'correct' : 'wrong';
      if (!correct) allCorrect = false;

      if (chip.kind !== 'distractor' && placed !== undefined) {
        if (correct) {
          roundScore += 5;
          correctCount++;
        } else {
          roundScore -= 2;
        }
      } else if (chip.kind === 'distractor' && placed !== undefined) {
        roundScore -= 2;
      }
    }

    for (const chip of currentRound.chips) {
      if (chip.kind !== 'distractor') {
        void recordEncounter({
          word: chip.word,
          game_id: 'word_web',
          mode: 'network',
          correct: newResults[chip.id] === 'correct',
          ms: elapsedMs,
        });
      }
    }
    void recordEncounter({
      word: currentRound.centerWord,
      game_id: 'word_web',
      mode: 'network',
      correct: allCorrect,
      ms: elapsedMs,
    });

    setScore(prev => Math.max(0, prev + roundScore));
    setTotalCorrect(prev => prev + correctCount);
    setResults(newResults);
    setPhase('checked');
  }

  function advanceRound() {
    const nextIdx = roundIdx + 1;
    if (nextIdx >= TOTAL_ROUNDS || nextIdx >= rounds.length) {
      setPhase('done');
      return;
    }
    setPhase('advancing');
    setTimeout(() => {
      setRoundIdx(nextIdx);
      setPlacements({});
      setSelectedChipId(null);
      setResults({});
      roundStartMs.current = Date.now();
      setPhase('placing');
    }, 1500);
  }

  function resetGame() {
    if (catalog.length === 0) return;
    const items = pickRoundItems(catalog, TOTAL_ROUNDS);
    const builtRounds = items.map(item => buildRound(item, catalog));
    setRounds(builtRounds);
    setRoundIdx(0);
    setScore(0);
    setTotalCorrect(0);
    setPlacements({});
    setSelectedChipId(null);
    setResults({});
    roundStartMs.current = Date.now();
    setPhase('placing');
  }

  // --- Error screen ---
  const errorMsg = vaultError ?? gameError;
  if (errorMsg) {
    return (
      <PracticeGameLayout title="Word Web" onBack={() => router.push('/team/practice/vocabulary')}>
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <XCircle className="w-12 h-12 text-coral-500" />
          <p className="font-display text-lg text-ink-600">{errorMsg}</p>
          <button
            onClick={() => router.push('/team/practice/vocabulary')}
            className="px-6 py-3 rounded-2xl bg-sage-500 text-white font-display font-bold"
          >
            Go Back
          </button>
        </div>
      </PracticeGameLayout>
    );
  }

  // --- Loading screen ---
  if (phase === 'loading' || vaultLoading || rounds.length === 0) {
    return (
      <PracticeGameLayout title="Word Web" onBack={() => router.push('/team/practice/vocabulary')}>
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full border-4 border-gold-300 border-t-gold-600"
          />
          <p className="font-display text-ink-500">Loading words…</p>
        </div>
      </PracticeGameLayout>
    );
  }

  // --- Done screen ---
  if (phase === 'done') {
    return (
      <PracticeGameLayout
        title="Word Web"
        onBack={() => router.push('/team/practice/vocabulary')}
        mastery={{ mastered: stats.mastered, sticky: stats.sticky }}
      >
        <div className="flex flex-col items-center gap-6 py-8 text-center">
          <Trophy className="w-16 h-16 text-gold-500" />
          <h2 className="font-display font-bold text-3xl text-ink-800">Done!</h2>
          <div className="bg-white rounded-3xl border-2 border-gold-200 px-8 py-6 flex flex-col gap-3 w-full max-w-xs shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-ink-600">Score</span>
              <span className="font-display font-bold text-2xl text-gold-600">{score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-600">Correct placements</span>
              <span className="font-display font-bold text-xl text-sage-600">{totalCorrect}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={resetGame}
              className="w-full py-4 rounded-2xl bg-gold-400 hover:bg-gold-500 text-ink-800 font-display font-bold text-lg transition-colors"
            >
              <Sparkles className="inline w-5 h-5 mr-2" />
              Play Again
            </button>
            <button
              onClick={() => router.push('/team/practice/vocabulary')}
              className="w-full py-4 rounded-2xl border-2 border-ink-200 text-ink-700 font-display font-bold text-lg hover:bg-cream-100 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </PracticeGameLayout>
    );
  }

  if (!currentRound) return null;

  const hasAnyPlacement = Object.keys(placements).length > 0;
  const isTarget = selectedChipId !== null && phase === 'placing';

  return (
    <PracticeGameLayout
      title="Word Web"
      subtitle={`Round ${roundIdx + 1} of ${TOTAL_ROUNDS}`}
      onBack={() => router.push('/team/practice/vocabulary')}
      mastery={{ mastered: stats.mastered, sticky: stats.sticky }}
      rightBadge={<span className="font-display font-bold text-lg text-gold-600">{score}</span>}
    >
      <div className="flex flex-col gap-5">
        {/* Center word */}
        <motion.div
          key={currentRound.centerWord}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="px-8 py-4 rounded-full bg-sage-100 border-2 border-gold-400 shadow-sm">
            <span className="font-display font-bold text-3xl text-ink-800">{currentRound.centerWord}</span>
          </div>
          {currentRound.definition && (
            <p className="text-sm text-ink-500 text-center max-w-xs leading-snug">{currentRound.definition}</p>
          )}
        </motion.div>

        {/* Buckets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {BUCKET_CONFIG.map(bucket => {
            const chipsInBucket = bucketChips[bucket.id];
            const isEmpty = chipsInBucket.length === 0;
            return (
              <div
                key={bucket.id}
                role="button"
                tabIndex={isTarget ? 0 : -1}
                onClick={() => handleBucketTap(bucket.id)}
                onKeyDown={e => e.key === 'Enter' && handleBucketTap(bucket.id)}
                className={[
                  'rounded-2xl p-3 min-h-28 flex flex-col gap-2 transition-all select-none',
                  bucket.bg,
                  'border-2',
                  isEmpty ? bucket.borderDashed : bucket.border,
                  isTarget ? 'ring-2 ring-gold-300 ring-offset-1 cursor-pointer' : 'cursor-default',
                ].join(' ')}
              >
                <span className={`text-xs uppercase tracking-wide font-semibold ${bucket.labelColor}`}>
                  {bucket.label}
                </span>
                <div className="flex flex-wrap gap-1">
                  {chipsInBucket.map(chip => {
                    const result = results[chip.id];
                    return (
                      <motion.button
                        key={chip.id}
                        initial={{ scale: 0.85 }}
                        animate={{ scale: 1 }}
                        onClick={e => handlePlacedChipTap(chip, e)}
                        disabled={phase === 'checked'}
                        className={[
                          'px-3 py-2 rounded-xl border-2 bg-white font-display font-bold text-sm min-h-[44px] shadow-sm transition-colors',
                          result === 'correct' ? 'border-sage-500 ring-2 ring-sage-400 text-sage-800' : '',
                          result === 'wrong' ? 'border-coral-500 ring-2 ring-coral-400 text-coral-800' : '',
                          !result ? 'border-ink-200 hover:border-gold-300' : '',
                          'disabled:cursor-default',
                        ].join(' ')}
                      >
                        {result === 'correct' && <CheckCircle2 className="inline w-3 h-3 text-sage-600 mr-1" />}
                        {result === 'wrong' && <XCircle className="inline w-3 h-3 text-coral-600 mr-1" />}
                        {chip.word}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Chip pool */}
        <div className="flex flex-wrap gap-2 min-h-[3rem]">
          <AnimatePresence>
            {poolChips.map(chip => {
              const isSelected = selectedChipId === chip.id;
              // Distractors left in pool after check = correct (sage ring); others = no ring
              const poolResult: 'correct' | undefined =
                phase === 'checked' && chip.kind === 'distractor' ? 'correct' : undefined;

              return (
                <motion.button
                  key={chip.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  onClick={() => handleChipTap(chip)}
                  disabled={phase === 'checked'}
                  className={[
                    'px-4 py-3 rounded-2xl border-2 bg-white font-display font-bold text-lg min-h-[44px] shadow-sm transition-all',
                    isSelected
                      ? 'ring-4 ring-gold-300 border-gold-400 bg-gold-50'
                      : 'border-ink-200 hover:border-gold-300',
                    poolResult === 'correct' ? 'border-sage-400 ring-2 ring-sage-300' : '',
                    'disabled:cursor-default',
                  ].join(' ')}
                >
                  {poolResult === 'correct' && (
                    <CheckCircle2 className="inline w-4 h-4 text-sage-600 mr-1" />
                  )}
                  {chip.word}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Action button */}
        <div className="flex justify-center pt-1">
          {phase === 'placing' && (
            <button
              onClick={checkAnswers}
              disabled={!hasAnyPlacement}
              className="px-8 py-4 rounded-2xl bg-gold-400 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-ink-800 font-display font-bold text-lg transition-colors shadow-sm"
            >
              Check Answers
            </button>
          )}
          {phase === 'checked' && (
            <button
              onClick={advanceRound}
              className="px-8 py-4 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white font-display font-bold text-lg transition-colors shadow-sm"
            >
              {roundIdx + 1 >= TOTAL_ROUNDS ? 'See Results' : 'Next Round →'}
            </button>
          )}
          {phase === 'advancing' && (
            <p className="py-4 font-display text-ink-400">Next round…</p>
          )}
        </div>
      </div>
    </PracticeGameLayout>
  );
}
