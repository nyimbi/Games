'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Lightbulb, Clock, RotateCcw, ArrowRight, LogOut, Star, Lock, Trophy, Flame, Share2, Copy, Check, BookOpen } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { useSounds } from '@/lib/hooks/useSounds';
import { checkAchievements, updatePlayerStats } from '@/lib/games/achievements';
import { useAchievementToast } from '@/components/ui/AchievementToast';
import { getMemoryPairs, type MemoryPair } from '@/lib/games/connections';
import { getStorage, setStorage, STORAGE_KEYS } from '@/lib/storage';
import {
  GRID_CONFIGS,
  calculateScore,
  type GridConfig,
  type MosaicTile,
  type MosaicRecords,
} from '@/lib/games/memoryMosaic';

interface MemoryMosaicProps {
  onExit?: () => void;
}

type GamePhase = 'select_grid' | 'playing' | 'match_found' | 'complete';

const DEFAULT_RECORDS: MosaicRecords = {
  bestScores: {},
  completedGrids: [],
  bestCombo: 0,
  perfectGames: 0,
};

const SUBJECT_BORDER: Record<string, string> = {
  science: 'border-sage-400',
  literature: 'border-ink-400',
  arts: 'border-gold-400',
  social_studies: 'border-coral-400',
  special_area: 'border-purple-400',
};

const SUBJECT_BG: Record<string, string> = {
  science: 'bg-sage-50 border-t-4 border-t-sage-400',
  literature: 'bg-ink-50 border-t-4 border-t-ink-400',
  arts: 'bg-gold-50 border-t-4 border-t-gold-400',
  social_studies: 'bg-coral-50 border-t-4 border-t-coral-400',
  special_area: 'bg-purple-50 border-t-4 border-t-purple-400',
};

function getRecords(): MosaicRecords {
  return getStorage<MosaicRecords>(STORAGE_KEYS.MEMORY_MOSAIC_RECORDS, DEFAULT_RECORDS);
}

function saveRecords(records: MosaicRecords): void {
  setStorage(STORAGE_KEYS.MEMORY_MOSAIC_RECORDS, records);
}

function isGridUnlocked(gridName: string, records: MosaicRecords): boolean {
  const idx = GRID_CONFIGS.findIndex((g) => g.name === gridName);
  if (idx === 0) return true;
  const prev = GRID_CONFIGS[idx - 1];
  return prev ? records.completedGrids.includes(prev.name) : false;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTiles(config: GridConfig): { tiles: MosaicTile[]; pairs: MemoryPair[] } {
  const pairs = getMemoryPairs(undefined, config.pairs);
  const tiles: MosaicTile[] = [];
  pairs.forEach((pair, idx) => {
    const pairId = `pair_${idx}`;
    tiles.push({
      id: `${pairId}_a`,
      pairId,
      text: pair.itemA.text,
      subject: pair.itemA.subject,
      isFlipped: false,
      isMatched: false,
    });
    tiles.push({
      id: `${pairId}_b`,
      pairId,
      text: pair.itemB.text,
      subject: pair.itemB.subject,
      isFlipped: false,
      isMatched: false,
    });
  });
  return { tiles: shuffle(tiles), pairs };
}

function getStarRating(score: number, totalPairs: number): number {
  const maxPossible = totalPairs * 200 + 500;
  const ratio = score / maxPossible;
  if (ratio >= 0.7) return 3;
  if (ratio >= 0.4) return 2;
  return 1;
}

export function MemoryMosaic({ onExit }: MemoryMosaicProps) {
  const { play } = useSounds();
  const { showAchievements } = useAchievementToast();

  const [phase, setPhase] = useState<GamePhase>('select_grid');
  const [records, setRecords] = useState<MosaicRecords>(DEFAULT_RECORDS);
  const [selectedGrid, setSelectedGrid] = useState<GridConfig | null>(null);

  const [tiles, setTiles] = useState<MosaicTile[]>([]);
  const [pairData, setPairData] = useState<MemoryPair[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [misses, setMisses] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [matchConnection, setMatchConnection] = useState<string | null>(null);

  const [peekUsed, setPeekUsed] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [timeUsed, setTimeUsed] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);
  const [hintPairId, setHintPairId] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [showStudyCards, setShowStudyCards] = useState(false);

  const lockRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRecords(getRecords());
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setPhase('complete');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const startGame = useCallback(
    (config: GridConfig) => {
      setSelectedGrid(config);
      const { tiles: built, pairs } = buildTiles(config);
      setTiles(built);
      setPairData(pairs);
      setFlippedIds([]);
      setMatchedCount(0);
      setMisses(0);
      setCombo(0);
      setBestCombo(0);
      setScore(0);
      setTimeLeft(config.timeSeconds);
      setMatchConnection(null);
      setPeekUsed(false);
      setHintUsed(false);
      setTimeUsed(false);
      setIsPeeking(false);
      setHintPairId(null);
      lockRef.current = false;
      setPhase('playing');
    },
    []
  );

  const completeGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('complete');

    if (!selectedGrid) return;
    const newRecords = { ...getRecords() };
    if (!newRecords.completedGrids.includes(selectedGrid.name)) {
      newRecords.completedGrids = [...newRecords.completedGrids, selectedGrid.name];
    }
    if (score > (newRecords.bestScores[selectedGrid.name] ?? 0)) {
      newRecords.bestScores = { ...newRecords.bestScores, [selectedGrid.name]: score };
    }
    if (bestCombo > newRecords.bestCombo) newRecords.bestCombo = bestCombo;
    if (misses === 0) newRecords.perfectGames += 1;
    saveRecords(newRecords);
    setRecords(newRecords);

    const stats = updatePlayerStats((s) => ({
      ...s,
      gamesPlayed: s.gamesPlayed + 1,
      longestStreak: Math.max(s.longestStreak, bestCombo),
      perfectRounds: misses === 0 ? s.perfectRounds + 1 : s.perfectRounds,
    }));
    const newAchievements = checkAchievements(stats);
    if (newAchievements.length) showAchievements(newAchievements);
  }, [selectedGrid, score, bestCombo, misses, showAchievements]);

  const handleTileClick = useCallback(
    (tileId: string) => {
      if (lockRef.current || isPeeking) return;
      if (phase !== 'playing') return;

      const tile = tiles.find((t) => t.id === tileId);
      if (!tile || tile.isMatched || tile.isFlipped) return;
      if (flippedIds.length >= 2) return;

      play('flip');
      const newFlipped = [...flippedIds, tileId];
      setFlippedIds(newFlipped);
      setTiles((prev) => prev.map((t) => (t.id === tileId ? { ...t, isFlipped: true } : t)));

      if (newFlipped.length === 2) {
        lockRef.current = true;
        const [firstId, secondId] = newFlipped;
        const first = tiles.find((t) => t.id === firstId)!;
        const second = tiles.find((t) => t.id === secondId)!;

        if (first.pairId === second.pairId) {
          // Match
          const newCombo = combo + 1;
          const newBest = Math.max(bestCombo, newCombo);
          setCombo(newCombo);
          setBestCombo(newBest);
          play('correct');

          const pairIdx = parseInt(first.pairId.split('_')[1]);
          const pairInfo = pairData[pairIdx];
          const scoreResult = calculateScore(newCombo, timeLeft, misses, selectedGrid?.pairs ?? 0);
          setScore((s) => s + scoreResult.total);

          const newMatchedCount = matchedCount + 1;
          setMatchedCount(newMatchedCount);
          setMatchConnection(pairInfo?.connection ?? null);
          setPhase('match_found');

          setTimeout(() => {
            setTiles((prev) =>
              prev.map((t) => (t.pairId === first.pairId ? { ...t, isMatched: true, isFlipped: false } : t))
            );
            setFlippedIds([]);
            setMatchConnection(null);
            lockRef.current = false;

            if (newMatchedCount >= (selectedGrid?.pairs ?? 0)) {
              completeGame();
            } else {
              setPhase('playing');
            }
          }, 1200);
        } else {
          // No match
          play('wrong');
          setCombo(0);
          setMisses((m) => m + 1);

          setTimeout(() => {
            setTiles((prev) =>
              prev.map((t) =>
                t.id === firstId || t.id === secondId ? { ...t, isFlipped: false } : t
              )
            );
            setFlippedIds([]);
            lockRef.current = false;
          }, 1000);
        }
      }
    },
    [tiles, flippedIds, phase, combo, bestCombo, misses, matchedCount, timeLeft, selectedGrid, pairData, isPeeking, play, completeGame]
  );

  // Power-ups
  const usePeek = useCallback(() => {
    if (peekUsed || isPeeking) return;
    setPeekUsed(true);
    setIsPeeking(true);
    play('powerup');
    setTiles((prev) => prev.map((t) => (t.isMatched ? t : { ...t, isFlipped: true })));
    setTimeout(() => {
      setTiles((prev) => prev.map((t) => (t.isMatched ? t : { ...t, isFlipped: false })));
      setFlippedIds([]);
      setIsPeeking(false);
    }, 2000);
  }, [peekUsed, isPeeking, play]);

  const useHint = useCallback(() => {
    if (hintUsed) return;
    setHintUsed(true);
    play('powerup');
    const unmatched = tiles.filter((t) => !t.isMatched);
    if (unmatched.length >= 2) {
      setHintPairId(unmatched[0].pairId);
      setTimeout(() => setHintPairId(null), 2000);
    }
  }, [hintUsed, tiles, play]);

  const useTimeBonus = useCallback(() => {
    if (timeUsed) return;
    setTimeUsed(true);
    play('powerup');
    setTimeLeft((t) => t + 15);
  }, [timeUsed, play]);

  const timerColor = useMemo(() => {
    if (!selectedGrid) return 'bg-sage-500';
    const ratio = timeLeft / selectedGrid.timeSeconds;
    if (ratio > 0.5) return 'bg-sage-500';
    if (ratio > 0.2) return 'bg-gold-500';
    return 'bg-coral-500';
  }, [timeLeft, selectedGrid]);

  const nextGridConfig = useMemo(() => {
    if (!selectedGrid) return null;
    const idx = GRID_CONFIGS.findIndex((g) => g.name === selectedGrid.name);
    return idx < GRID_CONFIGS.length - 1 ? GRID_CONFIGS[idx + 1] : null;
  }, [selectedGrid]);

  const gridColsClass = useMemo(() => {
    if (!selectedGrid) return '';
    if (selectedGrid.cols === 3) return 'grid-cols-3';
    if (selectedGrid.cols === 4) return 'grid-cols-4';
    return 'grid-cols-6';
  }, [selectedGrid]);

  const shareText = selectedGrid
    ? `🧩 Memory Mosaic (${selectedGrid.name})\n⭐ ${getStarRating(score, selectedGrid.pairs)} stars\n🏆 Score: ${score}\n🔥 Best combo: ${bestCombo}x\n${misses === 0 ? '✨ Perfect game!' : `❌ ${misses} misses`}`
    : '';

  const handleShareCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // =========================================================================
  // Select Grid Phase
  // =========================================================================
  if (phase === 'select_grid') {
    return (
      <div className="min-h-screen bg-cream-50 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-display font-bold text-ink-900">Memory Mosaic</h1>
            <p className="text-ink-600">Match cross-subject concept pairs from memory</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {GRID_CONFIGS.map((config) => {
              const unlocked = isGridUnlocked(config.name, records);
              const best = records.bestScores[config.name];
              return (
                <motion.div
                  key={config.name}
                  whileHover={unlocked ? { scale: 1.03 } : undefined}
                  whileTap={unlocked ? { scale: 0.97 } : undefined}
                >
                  <Card
                    className={`cursor-pointer transition-all ${
                      unlocked
                        ? 'border-ink-200 hover:border-ink-400 hover:shadow-md'
                        : 'opacity-50 cursor-not-allowed border-ink-100'
                    }`}
                    onClick={() => unlocked && startGame(config)}
                  >
                    <CardContent className="p-5 text-center space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        {!unlocked && <Lock className="w-4 h-4 text-ink-400" />}
                        <span className="text-2xl font-display font-bold text-ink-900">
                          {config.name}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-ink-500">{config.pairs} pairs</p>
                        <p className="text-sm text-ink-500">{config.timeSeconds}s</p>
                      </div>
                      {best !== undefined && (
                        <Badge className="bg-gold-100 text-gold-700 border-gold-300">
                          <Trophy className="w-3 h-3 mr-1" />
                          {best}
                        </Badge>
                      )}
                      {!unlocked && (
                        <p className="text-xs text-ink-400">
                          Complete {GRID_CONFIGS[GRID_CONFIGS.findIndex((g) => g.name === config.name) - 1]?.name} first
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {records.perfectGames > 0 && (
            <div className="text-center">
              <Badge className="bg-sage-100 text-sage-700 border-sage-300">
                {records.perfectGames} Perfect Game{records.perfectGames !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}

          {onExit && (
            <div className="text-center">
              <Button variant="ghost" onClick={onExit} className="text-ink-500">
                <LogOut className="w-4 h-4 mr-2" />
                Exit
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // Complete Phase
  // =========================================================================
  if (phase === 'complete') {
    const totalPairs = selectedGrid?.pairs ?? 0;
    const stars = getStarRating(score, totalPairs);
    const newGridUnlocked =
      nextGridConfig && records.completedGrids.includes(selectedGrid?.name ?? '');

    return (
      <div className="min-h-screen bg-cream-50 p-4">
        <div className="max-w-md mx-auto space-y-6 pt-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-2"
          >
            <h2 className="text-2xl font-display font-bold text-ink-900">
              {matchedCount >= totalPairs ? 'Complete!' : 'Time\'s Up!'}
            </h2>
            <div className="flex justify-center gap-1">
              {[1, 2, 3].map((s) => (
                <motion.div
                  key={s}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: s * 0.2, type: 'spring' }}
                >
                  <Star
                    className={`w-8 h-8 ${
                      s <= stars ? 'text-gold-400 fill-gold-400' : 'text-ink-200'
                    }`}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Matches</span>
                <span className="font-semibold text-ink-900">{matchedCount} / {totalPairs}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Misses</span>
                <span className="font-semibold text-ink-900">{misses}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Best Combo</span>
                <span className="font-semibold text-ink-900">{bestCombo}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Time Remaining</span>
                <span className="font-semibold text-ink-900">{timeLeft}s</span>
              </div>
              <div className="border-t border-ink-100 pt-3 flex justify-between">
                <span className="font-display font-bold text-ink-900">Total Score</span>
                <span className="font-display font-bold text-gold-600 text-lg">{score}</span>
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {newGridUnlocked && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Card className="border-sage-300 bg-sage-50">
                  <CardContent className="p-4 text-center space-y-1">
                    <p className="font-display font-bold text-sage-700">New Grid Unlocked!</p>
                    <p className="text-sm text-sage-600">{nextGridConfig?.name} is now available</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Study Cards Toggle */}
          <Button
            variant="secondary"
            onClick={() => setShowStudyCards(!showStudyCards)}
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {showStudyCards ? 'Hide' : 'Study'} Connections ({pairData.length})
          </Button>

          <AnimatePresence>
            {showStudyCards && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-2"
              >
                {pairData.map((pair, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className={`${SUBJECT_BG[pair.itemA.subject] ?? 'bg-white'} border-ink-200`}>
                      <CardContent className="p-3 space-y-1">
                        <div className="flex items-center justify-between text-sm font-semibold text-ink-800">
                          <span>{pair.itemA.text}</span>
                          <span className="text-ink-400 mx-2">&harr;</span>
                          <span>{pair.itemB.text}</span>
                        </div>
                        <p className="text-xs text-ink-500 italic text-center">{pair.connection}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleShareCopy}
              className="bg-gold-500 text-white hover:bg-gold-600"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Share Results'}
            </Button>
            <Button
              onClick={() => { setShowStudyCards(false); selectedGrid && startGame(selectedGrid); }}
              className="bg-ink-900 text-white hover:bg-ink-800"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
            {newGridUnlocked && nextGridConfig && (
              <Button
                onClick={() => startGame(nextGridConfig)}
                className="bg-sage-600 text-white hover:bg-sage-700"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Next Grid ({nextGridConfig.name})
              </Button>
            )}
            <Button variant="ghost" onClick={() => setPhase('select_grid')} className="text-ink-500">
              <LogOut className="w-4 h-4 mr-2" />
              Back to Grid Select
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // Playing / Match Found Phase
  // =========================================================================
  const timerPercent = selectedGrid ? (timeLeft / selectedGrid.timeSeconds) * 100 : 100;

  return (
    <div className="min-h-screen bg-cream-50 p-3 flex flex-col">
      {/* Header */}
      <div className="max-w-2xl mx-auto w-full space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-ink-900 text-lg">{score}</span>
            <Badge className="bg-ink-100 text-ink-600 border-ink-200">
              {matchedCount}/{selectedGrid?.pairs ?? 0}
            </Badge>
          </div>

          {/* Combo counter */}
          <AnimatePresence mode="wait">
            {combo >= 2 && (
              <motion.div
                key={combo}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="flex items-center gap-1"
              >
                <span className="font-display font-bold text-coral-600">{combo}x</span>
                {combo >= 3 && <Flame className="w-4 h-4 text-coral-500" />}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-coral-500' : 'text-ink-400'}`} />
            <span
              className={`font-mono font-semibold ${
                timeLeft <= 10 ? 'text-coral-600' : 'text-ink-700'
              }`}
            >
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Timer bar */}
        <div className="w-full h-1.5 bg-ink-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${timerColor}`}
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Match found toast */}
      <AnimatePresence>
        {matchConnection && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto mb-3 w-full"
          >
            <div className="bg-sage-50 border border-sage-300 rounded-lg px-4 py-2 text-center">
              <p className="text-sm font-semibold text-sage-700">{matchConnection}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tile Grid */}
      <div className="flex-1 flex items-start justify-center">
        <div className={`grid ${gridColsClass} gap-2 max-w-lg w-full`}>
          {tiles.map((tile) => {
            const isHinted = hintPairId === tile.pairId && !tile.isMatched;

            return (
              <motion.button
                key={tile.id}
                onClick={() => handleTileClick(tile.id)}
                disabled={tile.isMatched || lockRef.current}
                className={`aspect-square rounded-xl relative overflow-hidden transition-all ${
                  tile.isMatched
                    ? 'bg-sage-100 opacity-60'
                    : tile.isFlipped
                      ? `bg-white ${SUBJECT_BG[tile.subject] ?? 'bg-white border-t-4 border-t-ink-300'}`
                      : `bg-ink-100 border-2 ${SUBJECT_BORDER[tile.subject] ?? 'border-ink-300'} hover:bg-ink-200`
                } ${isHinted ? 'ring-2 ring-gold-400 ring-offset-2' : ''}`}
                whileTap={!tile.isMatched && !tile.isFlipped ? { scale: 0.95 } : undefined}
                layout
              >
                <div
                  className="absolute inset-0 flex items-center justify-center p-1"
                  style={{ perspective: '600px' }}
                >
                  <AnimatePresence mode="wait">
                    {tile.isMatched ? (
                      <motion.span
                        key="matched"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-sage-500 text-lg"
                      >
                        &#10003;
                      </motion.span>
                    ) : tile.isFlipped ? (
                      <motion.span
                        key="text"
                        initial={{ rotateY: 90 }}
                        animate={{ rotateY: 0 }}
                        exit={{ rotateY: -90 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs sm:text-sm font-semibold text-ink-800 text-center leading-tight"
                      >
                        {tile.text}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="hidden"
                        initial={{ rotateY: -90 }}
                        animate={{ rotateY: 0 }}
                        exit={{ rotateY: 90 }}
                        transition={{ duration: 0.2 }}
                        className="text-lg font-bold text-ink-400"
                      >
                        ?
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Power-up bar */}
      <div className="max-w-lg mx-auto w-full mt-3">
        <div className="flex gap-2 justify-center">
          <Button
            variant="secondary"
            size="sm"
            disabled={peekUsed || isPeeking}
            onClick={usePeek}
            className={peekUsed ? 'opacity-40' : ''}
          >
            <Eye className="w-4 h-4 mr-1" />
            Peek
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={hintUsed}
            onClick={useHint}
            className={hintUsed ? 'opacity-40' : ''}
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            Hint
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={timeUsed}
            onClick={useTimeBonus}
            className={timeUsed ? 'opacity-40' : ''}
          >
            <Clock className="w-4 h-4 mr-1" />
            +15s
          </Button>
        </div>
      </div>
    </div>
  );
}
