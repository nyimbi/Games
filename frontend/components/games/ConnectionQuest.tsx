'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shuffle, X, Share2, Copy, Check, ArrowLeft, Sparkles, Link2 } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { useSounds } from '@/lib/hooks/useSounds';
import { checkAchievements, updatePlayerStats } from '@/lib/games/achievements';
import { useAchievementToast } from '@/components/ui/AchievementToast';
import {
  type ConnectionPuzzle,
  type ConnectionGroup,
  getDailyPuzzle,
  getRandomPuzzle,
} from '@/lib/games/connections';
import { getStorage, setStorage, STORAGE_KEYS } from '@/lib/storage';

interface ConnectionQuestProps {
  onExit?: () => void;
}

type Phase = 'intro' | 'playing' | 'solved_group' | 'game_over' | 'complete' | 'share';

interface ConnectionQuestStats {
  puzzlesCompleted: number;
  perfectPuzzles: number;
  dailyPuzzlesCompleted: string[];
  currentDailyStreak: number;
}

const DEFAULT_STATS: ConnectionQuestStats = {
  puzzlesCompleted: 0,
  perfectPuzzles: 0,
  dailyPuzzlesCompleted: [],
  currentDailyStreak: 0,
};

const MAX_MISTAKES = 4;

const DIFFICULTY_COLORS: Record<ConnectionGroup['difficulty'], string> = {
  gold: 'bg-gold-200 border-gold-300',
  sage: 'bg-sage-200 border-sage-300',
  coral: 'bg-coral-200 border-coral-300',
  ink: 'bg-ink-200 border-ink-300',
};

const DIFFICULTY_TEXT: Record<ConnectionGroup['difficulty'], string> = {
  gold: 'text-gold-800',
  sage: 'text-sage-800',
  coral: 'text-coral-800',
  ink: 'text-ink-800',
};

const DIFFICULTY_EMOJI: Record<ConnectionGroup['difficulty'], string> = {
  gold: '\uD83D\uDFE8',
  sage: '\uD83D\uDFE9',
  coral: '\uD83D\uDFE7',
  ink: '\u2B1B',
};

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// -- Inline sub-components --

function MistakesIndicator({ mistakes }: { mistakes: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-medium text-ink-600 mr-1">Mistakes:</span>
      {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-colors ${
            i < mistakes ? 'bg-coral-500' : 'bg-ink-200'
          }`}
        />
      ))}
    </div>
  );
}

function SolvedGroupBanner({ group }: { group: ConnectionGroup }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`rounded-xl border p-3 ${DIFFICULTY_COLORS[group.difficulty]}`}
    >
      <p className={`font-display font-bold text-sm ${DIFFICULTY_TEXT[group.difficulty]}`}>
        {group.theme}
      </p>
      <p className={`text-xs mt-0.5 ${DIFFICULTY_TEXT[group.difficulty]} opacity-75`}>
        {group.items.map((it) => it.text).join(', ')}
      </p>
    </motion.div>
  );
}

function ShareModal({
  solveOrder,
  mistakes,
  isDaily,
  onNewPuzzle,
  onExit,
  onClose,
}: {
  solveOrder: ConnectionGroup[];
  mistakes: number;
  isDaily: boolean;
  onNewPuzzle: () => void;
  onExit?: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const shareText = useMemo(() => {
    const header = isDaily
      ? `Connection Quest - Daily ${getTodayString()}`
      : 'Connection Quest';
    const grid = solveOrder
      .map((g) => DIFFICULTY_EMOJI[g.difficulty].repeat(4))
      .join('\n');
    return `${header}\n${grid}\nMistakes: ${mistakes}/${MAX_MISTAKES}`;
  }, [solveOrder, mistakes, isDaily]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  }, [shareText]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-bold text-ink-900 text-center mb-4">
          Share Your Results
        </h3>

        <div className="bg-ink-50 rounded-xl p-4 font-mono text-center text-lg leading-relaxed mb-4 whitespace-pre-line">
          {shareText}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="gold"
            fullWidth
            icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
          <Button variant="secondary" fullWidth onClick={onNewPuzzle}>
            New Puzzle
          </Button>
          {onExit && (
            <Button variant="ghost" fullWidth onClick={onExit}>
              Exit
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * ConnectionQuest - Find 4 groups of 4 related items in a 4x4 grid.
 * Inspired by NYT Connections with cross-subject educational content.
 */
export function ConnectionQuest({ onExit }: ConnectionQuestProps) {
  const { play } = useSounds();
  const { showAchievements } = useAchievementToast();

  const [phase, setPhase] = useState<Phase>('intro');
  const [puzzle, setPuzzle] = useState<ConnectionPuzzle | null>(null);
  const [isDaily, setIsDaily] = useState(false);
  const [items, setItems] = useState<{ text: string; subject: string; groupIdx: number }[]>([]);
  const [selectedTexts, setSelectedTexts] = useState<Set<string>>(new Set());
  const [solvedGroups, setSolvedGroups] = useState<ConnectionGroup[]>([]);
  const [solveOrder, setSolveOrder] = useState<ConnectionGroup[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shakeItems, setShakeItems] = useState(false);
  const [oneAwayToast, setOneAwayToast] = useState(false);
  const [stats, setStats] = useState<ConnectionQuestStats>(DEFAULT_STATS);
  const [lastSolvedGroup, setLastSolvedGroup] = useState<ConnectionGroup | null>(null);
  const [showConnectionPrompt, setShowConnectionPrompt] = useState(false);

  // Load stats on mount
  useEffect(() => {
    setStats(getStorage(STORAGE_KEYS.CONNECTION_QUEST_STATS, DEFAULT_STATS));
  }, []);

  const solvedGroupThemes = useMemo(
    () => new Set(solvedGroups.map((g) => g.theme)),
    [solvedGroups]
  );

  const remainingItems = useMemo(
    () => items.filter((it) => !solvedGroupThemes.has(puzzle?.groups[it.groupIdx]?.theme ?? '')),
    [items, solvedGroupThemes, puzzle]
  );

  const startPuzzle = useCallback(
    (daily: boolean) => {
      const p = daily ? getDailyPuzzle() : getRandomPuzzle();
      setPuzzle(p);
      setIsDaily(daily);

      const allItems = p.groups.flatMap((g, gi) =>
        g.items.map((it) => ({ text: it.text, subject: it.subject, groupIdx: gi }))
      );
      setItems(shuffleArray(allItems));
      setSelectedTexts(new Set());
      setSolvedGroups([]);
      setSolveOrder([]);
      setMistakes(0);
      setShakeItems(false);
      setOneAwayToast(false);
      setLastSolvedGroup(null);
      setShowConnectionPrompt(false);
      setPhase('playing');
    },
    []
  );

  const handleShuffle = useCallback(() => {
    setItems((prev) => {
      const remaining = prev.filter(
        (it) => !solvedGroupThemes.has(puzzle?.groups[it.groupIdx]?.theme ?? '')
      );
      const solved = prev.filter(
        (it) => solvedGroupThemes.has(puzzle?.groups[it.groupIdx]?.theme ?? '')
      );
      return [...solved, ...shuffleArray(remaining)];
    });
  }, [solvedGroupThemes, puzzle]);

  const toggleSelect = useCallback(
    (text: string) => {
      if (phase !== 'playing') return;
      setSelectedTexts((prev) => {
        const next = new Set(prev);
        if (next.has(text)) {
          next.delete(text);
        } else if (next.size < 4) {
          next.add(text);
        }
        return next;
      });
    },
    [phase]
  );

  const deselectAll = useCallback(() => {
    setSelectedTexts(new Set());
  }, []);

  const handleComplete = useCallback(
    (finalMistakes: number) => {
      const isPerfect = finalMistakes === 0;
      const today = getTodayString();

      const updatedStats: ConnectionQuestStats = {
        ...stats,
        puzzlesCompleted: stats.puzzlesCompleted + 1,
        perfectPuzzles: stats.perfectPuzzles + (isPerfect ? 1 : 0),
        dailyPuzzlesCompleted: isDaily
          ? [...new Set([...stats.dailyPuzzlesCompleted, today])]
          : stats.dailyPuzzlesCompleted,
        currentDailyStreak: isDaily ? stats.currentDailyStreak + 1 : stats.currentDailyStreak,
      };
      setStats(updatedStats);
      setStorage(STORAGE_KEYS.CONNECTION_QUEST_STATS, updatedStats);

      const playerStats = updatePlayerStats((s) => ({
        ...s,
        gamesPlayed: s.gamesPlayed + 1,
        perfectRounds: s.perfectRounds + (isPerfect ? 1 : 0),
      }));
      const newAchievements = checkAchievements(playerStats);
      if (newAchievements.length > 0) {
        showAchievements(newAchievements);
      }

      play('complete');
      setPhase('complete');
    },
    [stats, isDaily, showAchievements, play]
  );

  const handleSubmit = useCallback(() => {
    if (!puzzle || selectedTexts.size !== 4) return;

    const selectedItems = remainingItems.filter((it) => selectedTexts.has(it.text));
    const groupIndices = selectedItems.map((it) => it.groupIdx);

    // Check if all 4 selected items belong to the same group
    const allSameGroup = groupIndices.every((gi) => gi === groupIndices[0]);

    if (allSameGroup) {
      const solvedGroup = puzzle.groups[groupIndices[0]];
      const newSolved = [...solvedGroups, solvedGroup];
      const newSolveOrder = [...solveOrder, solvedGroup];
      setSolvedGroups(newSolved);
      setSolveOrder(newSolveOrder);
      setSelectedTexts(new Set());
      setLastSolvedGroup(solvedGroup);
      play('correct');

      if (newSolved.length === 4) {
        // Small delay so the last banner animates in before completion
        setTimeout(() => handleComplete(mistakes), 600);
      } else {
        setShowConnectionPrompt(true);
        setTimeout(() => {
          setShowConnectionPrompt(false);
          setPhase('solved_group');
          setTimeout(() => setPhase('playing'), 1200);
        }, 1500);
      }
    } else {
      // Check for "One Away"
      const groupCounts = new Map<number, number>();
      for (const gi of groupIndices) {
        groupCounts.set(gi, (groupCounts.get(gi) ?? 0) + 1);
      }
      const maxInGroup = Math.max(...groupCounts.values());
      if (maxInGroup === 3) {
        setOneAwayToast(true);
        setTimeout(() => setOneAwayToast(false), 2000);
      }

      play('wrong');
      setShakeItems(true);
      setTimeout(() => setShakeItems(false), 500);

      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      setSelectedTexts(new Set());

      if (newMistakes >= MAX_MISTAKES) {
        // Reveal remaining groups
        const remaining = puzzle.groups.filter(
          (g) => !solvedGroups.some((sg) => sg.theme === g.theme)
        );
        setSolvedGroups([...solvedGroups, ...remaining]);
        setSolveOrder([...solveOrder, ...remaining]);
        setTimeout(() => setPhase('game_over'), 800);
      }
    }
  }, [puzzle, selectedTexts, remainingItems, solvedGroups, solveOrder, mistakes, play, handleComplete]);

  const handleNewPuzzle = useCallback(() => {
    startPuzzle(false);
  }, [startPuzzle]);

  // -- Render phases --

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="text-center">
            <CardContent>
              <div className="mb-6">
                <div className="w-16 h-16 bg-gold-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Link2 className="w-8 h-8 text-gold-600" />
                </div>
                <h1 className="font-display text-3xl font-bold text-ink-900 mb-2">
                  Connection Quest
                </h1>
                <p className="text-ink-600">
                  Find 4 groups of 4 connected items. Can you spot the hidden links?
                </p>
              </div>

              <div className="bg-ink-50 rounded-xl p-4 mb-6 text-left text-sm text-ink-600 space-y-1">
                <p>Select 4 items that share a common theme.</p>
                <p>You have {MAX_MISTAKES} mistakes before the game ends.</p>
                <p>Difficulty ranges from straightforward to tricky.</p>
              </div>

              {stats.puzzlesCompleted > 0 && (
                <div className="flex justify-center gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-ink-900">{stats.puzzlesCompleted}</p>
                    <p className="text-xs text-ink-500">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gold-600">{stats.perfectPuzzles}</p>
                    <p className="text-xs text-ink-500">Perfect</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-sage-600">{stats.currentDailyStreak}</p>
                    <p className="text-xs text-ink-500">Daily Streak</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button variant="gold" fullWidth onClick={() => startPuzzle(true)}>
                  Daily Puzzle
                </Button>
                <Button variant="secondary" fullWidth onClick={() => startPuzzle(false)}>
                  Random Puzzle
                </Button>
                {onExit && (
                  <Button variant="ghost" fullWidth onClick={onExit} icon={<ArrowLeft className="w-4 h-4" />}>
                    Back
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (phase === 'share') {
    return (
      <AnimatePresence>
        <ShareModal
          solveOrder={solveOrder}
          mistakes={mistakes}
          isDaily={isDaily}
          onNewPuzzle={handleNewPuzzle}
          onExit={onExit}
          onClose={() => setPhase('complete')}
        />
      </AnimatePresence>
    );
  }

  // Playing / solved_group / game_over / complete phases
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-ink-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onExit && (
              <button
                onClick={onExit}
                className="p-1 rounded-lg hover:bg-ink-50 text-ink-400"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="font-display font-bold text-ink-900">
              Connection Quest
            </h2>
            {isDaily && (
              <Badge variant="gold" size="sm">Daily</Badge>
            )}
          </div>
          <MistakesIndicator mistakes={mistakes} />
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-4">
        {/* Solved groups stack */}
        <div className="flex flex-col gap-2 mb-4">
          <AnimatePresence>
            {solvedGroups.map((group) => (
              <SolvedGroupBanner key={group.theme} group={group} />
            ))}
          </AnimatePresence>
        </div>

        {/* "One Away!" toast */}
        <AnimatePresence>
          {oneAwayToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gold-100 border border-gold-300 rounded-xl px-4 py-2 text-center mb-3"
            >
              <span className="font-display font-bold text-gold-800">One Away!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection prompt */}
        <AnimatePresence>
          {showConnectionPrompt && lastSolvedGroup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gold-50 border border-gold-300 rounded-xl p-4 mb-4 text-center"
            >
              <p className="text-sm font-semibold text-gold-800 mb-2">What connects them?</p>
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {lastSolvedGroup.items.map(it => (
                  <Badge key={it.text} variant="outline" className="bg-white">{it.text}</Badge>
                ))}
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className={`font-display font-bold ${DIFFICULTY_TEXT[lastSolvedGroup.difficulty]}`}
              >
                {lastSolvedGroup.theme}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Item grid */}
        {(phase === 'playing' || phase === 'solved_group') && (
          <motion.div
            className="grid grid-cols-4 gap-2 mb-4"
            animate={shakeItems ? { x: [0, -6, 6, -6, 6, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <AnimatePresence mode="popLayout">
              {remainingItems.map((item) => {
                const isSelected = selectedTexts.has(item.text);
                return (
                  <motion.button
                    key={item.text}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => toggleSelect(item.text)}
                    className={`rounded-xl p-3 text-sm font-medium text-center transition-colors min-h-[56px] flex items-center justify-center leading-tight ${
                      isSelected
                        ? 'bg-ink-800 text-white border border-ink-800'
                        : 'bg-white text-ink-800 border border-ink-200 hover:border-ink-400'
                    }`}
                  >
                    {item.text}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Submit bar */}
        {(phase === 'playing' || phase === 'solved_group') && (
          <div className="flex items-center justify-center gap-3 mt-auto pb-4">
            <Button
              variant="secondary"
              size="sm"
              icon={<Shuffle className="w-4 h-4" />}
              onClick={handleShuffle}
            >
              Shuffle
            </Button>
            {selectedTexts.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                icon={<X className="w-4 h-4" />}
                onClick={deselectAll}
              >
                Deselect All
              </Button>
            )}
            <Button
              variant="gold"
              size="sm"
              disabled={selectedTexts.size !== 4}
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </div>
        )}

        {/* Game over */}
        {phase === 'game_over' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <div className="w-16 h-16 bg-coral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-coral-600" />
            </div>
            <h3 className="font-display text-2xl font-bold text-ink-900 mb-2">
              Better Luck Next Time
            </h3>
            <p className="text-ink-600 mb-2">
              You found {solveOrder.filter((_, i) => i < solvedGroups.length - (4 - solveOrder.length + (4 - solvedGroups.length))).length > 0 ? solveOrder.length - (4 - solvedGroups.length + mistakes) : 0} group{solveOrder.length !== 1 ? 's' : ''} before running out of guesses.
            </p>
            <p className="text-sm text-ink-500 mb-6">
              The remaining groups have been revealed above.
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button variant="gold" fullWidth onClick={handleNewPuzzle}>
                Try Another Puzzle
              </Button>
              {onExit && (
                <Button variant="ghost" fullWidth onClick={onExit}>
                  Exit
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Complete */}
        {phase === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
              className="w-16 h-16 bg-gold-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <Sparkles className="w-8 h-8 text-gold-600" />
            </motion.div>
            <h3 className="font-display text-2xl font-bold text-ink-900 mb-2">
              {mistakes === 0 ? 'Perfect!' : 'Well Done!'}
            </h3>
            <p className="text-ink-600 mb-1">
              You found all 4 groups{mistakes === 0 ? ' with no mistakes!' : `.`}
            </p>
            {mistakes > 0 && (
              <p className="text-sm text-ink-500 mb-4">
                Mistakes: {mistakes}/{MAX_MISTAKES}
              </p>
            )}
            {mistakes === 0 && <p className="text-sm text-ink-500 mb-4">Flawless solve!</p>}

            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button
                variant="gold"
                fullWidth
                icon={<Share2 className="w-4 h-4" />}
                onClick={() => setPhase('share')}
              >
                Share Results
              </Button>
              <Button variant="secondary" fullWidth onClick={handleNewPuzzle}>
                New Puzzle
              </Button>
              {onExit && (
                <Button variant="ghost" fullWidth onClick={onExit}>
                  Exit
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
