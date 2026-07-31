'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { GitBranch, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { PracticeGameLayout } from '@/components/practice';
import { useWordVault } from '@/lib/hooks/useVault';
import type { WordCatalogItem } from '@/lib/api/vault';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MorphemeKind = 'prefix' | 'root' | 'suffix';

interface MorphemeTile {
  id: string;
  text: string;
  kind: MorphemeKind;
}

interface RoundA {
  type: 'build';
  item: WordCatalogItem;
  root: string;
  tiles: MorphemeTile[];
  target: string;
}

interface RoundB {
  type: 'break';
  item: WordCatalogItem;
  chips: MorphemeTile[];
  slots: MorphemeKind[];
}

type Round = RoundA | RoundB;

type Phase = 'loading' | 'playing' | 'reveal' | 'done';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRoundA(item: WordCatalogItem, allItems: WordCatalogItem[]): RoundA {
  const m = item.morphology!;
  const root = m.root!;
  const targetParts: MorphemeTile[] = [];
  if (m.prefix) targetParts.push({ id: 'prefix', text: m.prefix, kind: 'prefix' });
  targetParts.push({ id: 'root', text: root, kind: 'root' });
  if (m.suffix) targetParts.push({ id: 'suffix', text: m.suffix, kind: 'suffix' });

  // Collect distractors from other items
  const distractors: MorphemeTile[] = [];
  for (const other of allItems) {
    if (other.word === item.word || !other.morphology) continue;
    const om = other.morphology;
    if (om.prefix && om.prefix !== m.prefix)
      distractors.push({ id: `d-pre-${other.word}`, text: om.prefix, kind: 'prefix' });
    if (om.suffix && om.suffix !== m.suffix)
      distractors.push({ id: `d-suf-${other.word}`, text: om.suffix, kind: 'suffix' });
    if (distractors.length >= 6) break;
  }

  // Pick 2-3 distractors to fill up to 5 tiles total
  const needed = Math.max(0, 5 - targetParts.length);
  const picked = shuffle(distractors).slice(0, needed);

  const tiles = shuffle([...targetParts, ...picked]);
  return { type: 'build', item, root, tiles, target: item.word };
}

function buildRoundB(item: WordCatalogItem): RoundB {
  const m = item.morphology!;
  const chips: MorphemeTile[] = [];
  const slots: MorphemeKind[] = [];
  if (m.prefix) { chips.push({ id: 'prefix', text: m.prefix, kind: 'prefix' }); slots.push('prefix'); }
  chips.push({ id: 'root', text: m.root!, kind: 'root' });
  slots.push('root');
  if (m.suffix) { chips.push({ id: 'suffix', text: m.suffix, kind: 'suffix' }); slots.push('suffix'); }
  return { type: 'break', item, chips: shuffle(chips), slots };
}

function buildRounds(catalog: WordCatalogItem[]): Round[] {
  // Filter: must have morphology with at least prefix or suffix (not root-only)
  const eligible = catalog.filter(
    (w) => w.morphology?.root && (w.morphology.prefix || w.morphology.suffix),
  );
  if (eligible.length < 4) return [];

  const picked = shuffle(eligible).slice(0, 8);
  const rounds: Round[] = [];
  for (let i = 0; i < picked.length; i++) {
    if (i % 2 === 0) rounds.push(buildRoundA(picked[i], eligible));
    else rounds.push(buildRoundB(picked[i]));
  }
  return rounds;
}

// ---------------------------------------------------------------------------
// Chip style helpers
// ---------------------------------------------------------------------------

const kindBg: Record<MorphemeKind, string> = {
  prefix: 'bg-gold-100 border-gold-400 text-gold-800',
  root:   'bg-sage-100 border-sage-400 text-sage-800',
  suffix: 'bg-coral-100 border-coral-400 text-coral-800',
};

const slotLabel: Record<MorphemeKind, string> = {
  prefix: 'Prefix',
  root:   'Root',
  suffix: 'Suffix',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Chip({
  tile,
  selected,
  placed,
  onTap,
}: {
  tile: MorphemeTile;
  selected: boolean;
  placed: boolean;
  onTap: () => void;
}) {
  return (
    <motion.button
      layout
      whileTap={{ scale: 0.93 }}
      onClick={onTap}
      disabled={placed}
      className={[
        'px-4 py-3 rounded-2xl border-2 font-display font-bold text-xl min-h-14 shadow-sm transition-all select-none',
        kindBg[tile.kind],
        selected ? 'ring-4 ring-ink-400 ring-offset-1 scale-105' : '',
        placed ? 'opacity-30 cursor-not-allowed' : 'active:scale-95 cursor-pointer',
      ].join(' ')}
    >
      {tile.text}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Round A: Build the word
// ---------------------------------------------------------------------------

function RoundAView({
  round,
  onResult,
}: {
  round: RoundA;
  onResult: (correct: boolean, ms: number) => void;
}) {
  const [built, setBuilt] = useState<MorphemeTile[]>([]);
  const [wrong, setWrong] = useState(false);
  const [hints, setHints] = useState(0);
  const startMs = useRef(Date.now());

  const builtWord = built.map((t) => t.text).join('');
  const placedIds = new Set(built.map((t) => t.id));

  function tapTile(tile: MorphemeTile) {
    if (placedIds.has(tile.id)) {
      setBuilt((prev) => prev.filter((t) => t.id !== tile.id));
    } else {
      setBuilt((prev) => [...prev, tile]);
    }
  }

  function check() {
    const correct = builtWord === round.target;
    if (correct) {
      onResult(true, Date.now() - startMs.current);
    } else {
      setWrong(true);
      setHints((h) => h + 1);
      if (hints >= 1) {
        // 2nd wrong — give up
        setTimeout(() => onResult(false, Date.now() - startMs.current), 900);
      }
      setTimeout(() => setWrong(false), 600);
    }
  }

  const hint1 = hints >= 1 ? round.item.morphology?.prefix ?? null : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Definition */}
      <div className="bg-white/80 rounded-3xl p-5 shadow-sm border border-ink-100">
        <p className="text-sm font-medium text-ink-500 mb-1">Build the word that means:</p>
        <p className="font-display font-bold text-xl text-ink-800">{round.item.definition}</p>
        {hint1 && (
          <p className="mt-2 text-sm text-gold-700">
            Hint: starts with <span className="font-bold">{hint1}-</span>
          </p>
        )}
      </div>

      {/* Root (fixed) */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs font-medium text-ink-400 uppercase tracking-wide">Root</span>
        <span className="px-4 py-3 rounded-2xl border-2 border-sage-400 bg-sage-100 text-sage-800 font-display font-bold text-xl shadow-sm">
          {round.root}
        </span>
        <span className="text-xs text-ink-400">= to carry</span>
      </div>

      {/* Build zone */}
      <div
        className={[
          'min-h-16 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 px-4 py-3 transition-colors',
          wrong ? 'border-coral-400 bg-coral-50' : 'border-ink-200 bg-white/60',
        ].join(' ')}
      >
        {built.length === 0 ? (
          <span className="text-ink-300 font-display text-lg">Tap tiles below →</span>
        ) : (
          built.map((t) => (
            <motion.span
              key={t.id}
              layout
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`px-3 py-2 rounded-xl border-2 font-display font-bold text-xl ${kindBg[t.kind]}`}
            >
              {t.text}
            </motion.span>
          ))
        )}
      </div>

      {/* Tiles */}
      <div className="flex flex-wrap gap-3 justify-center">
        {round.tiles.map((tile) => (
          <Chip
            key={tile.id}
            tile={tile}
            selected={placedIds.has(tile.id)}
            placed={false}
            onTap={() => tapTile(tile)}
          />
        ))}
      </div>

      {/* Check */}
      <button
        onClick={check}
        disabled={built.length === 0}
        className="w-full py-4 rounded-2xl bg-sage-400 text-white font-display font-bold text-xl disabled:opacity-40 active:scale-95 transition-transform"
      >
        Check
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Round B: Break the word
// ---------------------------------------------------------------------------

function RoundBView({
  round,
  onResult,
}: {
  round: RoundB;
  onResult: (correct: boolean, ms: number) => void;
}) {
  const [placement, setPlacement] = useState<Partial<Record<MorphemeKind, MorphemeTile>>>({});
  const [selected, setSelected] = useState<MorphemeTile | null>(null);
  const [wrong, setWrong] = useState(false);
  const startMs = useRef(Date.now());

  const placedIds = new Set(Object.values(placement).map((t) => t?.id));

  function tapChip(tile: MorphemeTile) {
    if (selected?.id === tile.id) {
      setSelected(null);
      return;
    }
    // If already in a slot, remove it first
    const inSlot = (Object.entries(placement) as [MorphemeKind, MorphemeTile][]).find(
      ([, t]) => t.id === tile.id,
    );
    if (inSlot) {
      setPlacement((prev) => {
        const next = { ...prev };
        delete next[inSlot[0]];
        return next;
      });
    }
    setSelected(tile);
  }

  function tapSlot(kind: MorphemeKind) {
    if (!selected) return;
    // If slot already occupied, return that chip to pool
    setPlacement((prev) => ({ ...prev, [kind]: selected }));
    setSelected(null);
  }

  function check() {
    const correct = round.slots.every((kind) => placement[kind]?.kind === kind);
    if (correct) {
      onResult(true, Date.now() - startMs.current);
    } else {
      setWrong(true);
      setTimeout(() => {
        setWrong(false);
        onResult(false, Date.now() - startMs.current);
      }, 800);
    }
  }

  const allFilled = round.slots.every((k) => placement[k]);

  return (
    <div className="flex flex-col gap-6">
      {/* Word to break */}
      <div className="bg-white/80 rounded-3xl p-5 shadow-sm border border-ink-100 text-center">
        <p className="text-sm font-medium text-ink-500 mb-1">Break this word into parts:</p>
        <p className="font-display font-bold text-3xl text-ink-800">{round.item.word}</p>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-3 justify-center">
        {round.chips.map((tile) => (
          <Chip
            key={tile.id}
            tile={tile}
            selected={selected?.id === tile.id}
            placed={placedIds.has(tile.id)}
            onTap={() => tapChip(tile)}
          />
        ))}
      </div>

      {/* Slots */}
      <div className="flex gap-3 justify-center flex-wrap">
        {round.slots.map((kind) => {
          const filled = placement[kind];
          return (
            <button
              key={kind}
              onClick={() => tapSlot(kind)}
              className={[
                'flex flex-col items-center gap-1 min-w-24 min-h-20 px-4 py-3 rounded-2xl border-2 transition-all',
                filled
                  ? `border-solid ${kindBg[kind]}`
                  : selected
                  ? 'border-dashed border-ink-400 bg-white/60 hover:bg-ink-50'
                  : 'border-dashed border-ink-200 bg-white/40',
                wrong && !filled ? 'border-coral-400' : '',
              ].join(' ')}
            >
              <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">
                {slotLabel[kind]}
              </span>
              {filled && (
                <motion.span
                  initial={{ scale: 0.7 }}
                  animate={{ scale: 1 }}
                  className={`font-display font-bold text-xl ${kindBg[kind]}`}
                >
                  {filled.text}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={check}
        disabled={!allFilled}
        className="w-full py-4 rounded-2xl bg-sage-400 text-white font-display font-bold text-xl disabled:opacity-40 active:scale-95 transition-transform"
      >
        Check
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reveal screen (brief)
// ---------------------------------------------------------------------------

function RevealView({
  correct,
  round,
  onNext,
}: {
  correct: boolean;
  round: Round;
  onNext: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onNext, 1200);
    return () => clearTimeout(t);
  }, [onNext]);

  const item = round.item;
  const family = item.family?.slice(0, 4) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-5 items-center text-center"
    >
      {correct ? (
        <CheckCircle2 className="w-16 h-16 text-sage-500" />
      ) : (
        <XCircle className="w-16 h-16 text-coral-400" />
      )}
      <p className="font-display font-bold text-2xl text-ink-800">
        {correct ? 'Correct!' : `It was: ${item.word}`}
      </p>

      {round.type === 'build' && family.length > 0 && (
        <div className="bg-white/80 rounded-3xl p-4 border border-ink-100 w-full">
          <div className="flex items-center gap-2 mb-3 justify-center">
            <GitBranch className="w-4 h-4 text-ink-400" />
            <span className="text-sm font-medium text-ink-500">Word Family</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {family.map((w) => (
              <span
                key={w}
                className={`px-3 py-1 rounded-xl font-display font-bold text-base border-2 ${
                  w === item.word
                    ? 'bg-sage-200 border-sage-500 text-sage-900'
                    : 'bg-cream-100 border-ink-200 text-ink-700'
                }`}
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {round.type === 'break' && (
        <div className="bg-white/80 rounded-3xl p-4 border border-ink-100 w-full">
          <p className="text-sm text-ink-500 mb-2">Meaning breakdown</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {round.slots.map((kind) => {
              const text = round.item.morphology?.[kind];
              return text ? (
                <span
                  key={kind}
                  className={`px-3 py-2 rounded-xl border-2 font-display font-bold text-lg ${kindBg[kind]}`}
                >
                  {text}{' '}
                  <span className="text-xs font-normal">({slotLabel[kind].toLowerCase()})</span>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Done screen
// ---------------------------------------------------------------------------

function DoneView({
  score,
  rounds,
  onPlayAgain,
  onBack,
}: {
  score: number;
  rounds: Round[];
  onPlayAgain: () => void;
  onBack: () => void;
}) {
  const wordsExplored = rounds.map((r) => r.item.word);
  const uniqueRoots = [...new Set(rounds.map((r) => r.item.morphology?.root).filter(Boolean))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 items-center text-center"
    >
      <Trophy className="w-20 h-20 text-gold-500" />
      <div>
        <p className="font-display font-bold text-4xl text-ink-800">{score}</p>
        <p className="text-ink-500 font-medium">points</p>
      </div>

      <div className="bg-white/80 rounded-3xl p-5 border border-ink-100 w-full text-left">
        <p className="text-sm font-medium text-ink-500 mb-2">Words explored</p>
        <div className="flex flex-wrap gap-2">
          {wordsExplored.map((w) => (
            <span key={w} className="px-3 py-1 rounded-xl bg-cream-100 border border-ink-200 font-display font-bold text-base text-ink-700">
              {w}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white/80 rounded-3xl p-5 border border-ink-100 w-full text-left">
        <p className="text-sm font-medium text-ink-500 mb-2">Roots you unlocked</p>
        <div className="flex flex-wrap gap-2">
          {uniqueRoots.map((r) => (
            <span key={r} className="px-3 py-1 rounded-xl bg-sage-100 border-2 border-sage-400 font-display font-bold text-base text-sage-800">
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl border-2 border-ink-300 text-ink-700 font-display font-bold text-xl active:scale-95 transition-transform"
        >
          Back
        </button>
        <button
          onClick={onPlayAgain}
          className="flex-1 py-4 rounded-2xl bg-sage-400 text-white font-display font-bold text-xl active:scale-95 transition-transform"
        >
          Play Again
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function RootBuilderPage() {
  const router = useRouter();
  const { stats, loadCatalog, error, recordEncounter } = useWordVault({ autoLoad: true });

  const [catalog, setCatalog] = useState<WordCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [score, setScore] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [completedRounds, setCompletedRounds] = useState<Round[]>([]);

  // Load morphology catalog
  useEffect(() => {
    (async () => {
      try {
        // loadCatalog doesn't return the items, call the API directly via hook workaround
        const { vaultApi } = await import('@/lib/api/vault');
        const res = await vaultApi.getWordCatalog({ has_morphology: true });
        setCatalog(res.words);
      } catch (e) {
        setCatalogError(e instanceof Error ? e.message : 'Failed to load catalog');
      } finally {
        setCatalogLoading(false);
      }
    })();
  }, []);

  // Build rounds once catalog is ready
  useEffect(() => {
    if (catalogLoading || catalog.length === 0) return;
    const built = buildRounds(catalog);
    if (built.length === 0) {
      setCatalogError('Not enough morphology words in catalog.');
      return;
    }
    setRounds(built);
    setPhase('playing');
  }, [catalog, catalogLoading]);

  function handleResult(correct: boolean, ms: number) {
    const round = rounds[roundIdx];
    setLastCorrect(correct);
    setScore((s) => s + (correct ? 10 : -3));
    setCompletedRounds((prev) => [...prev, round]);
    void recordEncounter({
      word: round.item.word,
      pos: round.item.pos ?? null,
      game_id: 'root_builder',
      mode: 'morph',
      correct,
      ms,
    });
    setPhase('reveal');
  }

  function handleNext() {
    if (roundIdx + 1 >= rounds.length) {
      setPhase('done');
    } else {
      setRoundIdx((i) => i + 1);
      setPhase('playing');
    }
  }

  function handlePlayAgain() {
    const built = buildRounds(catalog);
    if (built.length > 0) {
      setRounds(built);
      setRoundIdx(0);
      setScore(0);
      setCompletedRounds([]);
      setPhase('playing');
    }
  }

  const loadingState = catalogLoading;
  const errorState = catalogError ?? error;
  const currentRound = rounds[roundIdx];

  return (
    <PracticeGameLayout
      title="Root Builder"
      subtitle={phase === 'playing' || phase === 'reveal' ? `Round ${roundIdx + 1} of ${rounds.length}` : undefined}
      onBack={() => router.push('/team/practice/vocabulary')}
      mastery={{ mastered: stats.mastered, sticky: stats.sticky }}
      rightBadge={
        <span className="font-display font-bold text-lg text-gold-600">{score}</span>
      }
    >
      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {loadingState && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-4 py-20"
            >
              <div className="w-12 h-12 rounded-full border-4 border-sage-300 border-t-sage-600 animate-spin" />
              <p className="text-ink-500 font-medium">Loading word catalog…</p>
            </motion.div>
          )}

          {!loadingState && errorState && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-20 text-center"
            >
              <XCircle className="w-12 h-12 text-coral-400" />
              <p className="font-display font-bold text-xl text-ink-800">Could not load words</p>
              <p className="text-ink-500 text-sm">{errorState}</p>
              <button
                onClick={() => router.push('/team/practice/vocabulary')}
                className="mt-2 px-6 py-3 rounded-2xl border-2 border-ink-300 font-display font-bold text-ink-700 active:scale-95 transition-transform"
              >
                Go Back
              </button>
            </motion.div>
          )}

          {phase === 'playing' && currentRound && (
            <motion.div
              key={`round-${roundIdx}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              {currentRound.type === 'build' ? (
                <RoundAView round={currentRound} onResult={handleResult} />
              ) : (
                <RoundBView round={currentRound} onResult={handleResult} />
              )}
            </motion.div>
          )}

          {phase === 'reveal' && currentRound && (
            <motion.div
              key={`reveal-${roundIdx}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <RevealView correct={lastCorrect} round={currentRound} onNext={handleNext} />
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <DoneView
                score={score}
                rounds={completedRounds}
                onPlayAgain={handlePlayAgain}
                onBack={() => router.push('/team/practice/vocabulary')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PracticeGameLayout>
  );
}
