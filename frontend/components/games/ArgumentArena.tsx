'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Swords, Shield, Target, Trophy, ChevronRight, RotateCcw,
  ArrowLeft, Zap, Crown, Star, Share2, Copy, Check,
} from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { useSounds } from '@/lib/hooks/useSounds';
import { updatePlayerStats, checkAchievements } from '@/lib/games/achievements';
import { useAchievementToast } from '@/components/ui/AchievementToast';
import {
  type ArgumentCard,
  type CardType,
  type DebateTopicArena,
  type AIOpponent,
  AI_OPPONENTS,
  calculateArgumentStrength,
  aiPlayCards,
  getCardsForTopic,
  getRandomTopics,
} from '@/lib/games/argumentArena';

interface ArgumentArenaProps {
  onExit?: () => void;
}

type Phase = 'select' | 'playing' | 'round_result' | 'match_result';

const ROUNDS_PER_MATCH = 5;
const MAX_PLAYED_CARDS = 4;

const CARD_TYPE_STYLES: Record<CardType, { bg: string; border: string; label: string }> = {
  claim: { bg: 'bg-gold-100', border: 'border-gold-400', label: 'Claim' },
  evidence: { bg: 'bg-sage-100', border: 'border-sage-400', label: 'Evidence' },
  reasoning: { bg: 'bg-ink-100', border: 'border-ink-400', label: 'Reasoning' },
  rebuttal: { bg: 'bg-coral-100', border: 'border-coral-400', label: 'Rebuttal' },
};

const CARD_TYPE_BADGE_VARIANT: Record<CardType, 'gold' | 'sage' | 'ink' | 'coral'> = {
  claim: 'gold',
  evidence: 'sage',
  reasoning: 'ink',
  rebuttal: 'coral',
};

interface RoundRecord {
  playerStrength: number;
  aiStrength: number;
  playerCards: ArgumentCard[];
  aiCards: ArgumentCard[];
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ArgumentArena({ onExit }: ArgumentArenaProps) {
  const { play } = useSounds();
  const { showAchievements } = useAchievementToast();

  // Selection state
  const [topicChoices] = useState<DebateTopicArena[]>(() => getRandomTopics(3));
  const [selectedTopic, setSelectedTopic] = useState<DebateTopicArena | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<AIOpponent | null>(null);

  // Game state
  const [phase, setPhase] = useState<Phase>('select');
  const [round, setRound] = useState(1);
  const [hand, setHand] = useState<ArgumentCard[]>([]);
  const [playedCards, setPlayedCards] = useState<ArgumentCard[]>([]);
  const [aiHand, setAiHand] = useState<ArgumentCard[]>([]);
  const [aiPlayedCards, setAiPlayedCards] = useState<ArgumentCard[]>([]);
  const [rounds, setRounds] = useState<RoundRecord[]>([]);
  const [cardPool, setCardPool] = useState<ArgumentCard[]>([]);
  const [copied, setCopied] = useState(false);

  const playerWins = rounds.filter(r => r.playerStrength > r.aiStrength).length;
  const aiWins = rounds.filter(r => r.aiStrength > r.playerStrength).length;

  // Start the match once both topic and opponent are chosen
  const startMatch = useCallback(() => {
    if (!selectedTopic || !selectedOpponent) return;
    const pool = shuffleArray(getCardsForTopic(selectedTopic.id));
    // If the topic doesn't have enough cards, pad with cards from other topics
    let fullPool = pool;
    if (fullPool.length < 50) {
      const allTopicIds = new Set([selectedTopic.id]);
      const extras = shuffleArray(
        getRandomTopics(5)
          .filter(t => !allTopicIds.has(t.id))
          .flatMap(t => getCardsForTopic(t.id))
      );
      fullPool = [...fullPool, ...extras].slice(0, 60);
    }
    setCardPool(fullPool);
    dealRound(fullPool, 0);
    setRound(1);
    setRounds([]);
    setPhase('playing');
    play('powerup');
  }, [selectedTopic, selectedOpponent, play]);

  const dealRound = (pool: ArgumentCard[], usedCount: number) => {
    const remaining = pool.slice(usedCount);
    const shuffled = shuffleArray(remaining);
    setHand(shuffled.slice(0, 5));
    setAiHand(shuffled.slice(5, 10));
    setPlayedCards([]);
    setAiPlayedCards([]);
  };

  // Play a card from hand
  const playCard = useCallback((card: ArgumentCard) => {
    if (playedCards.length >= MAX_PLAYED_CARDS) return;
    // Only allow one of each type
    if (playedCards.some(c => c.type === card.type)) return;
    setPlayedCards(prev => [...prev, card]);
    setHand(prev => prev.filter(c => c.id !== card.id));
    play('flip');
  }, [playedCards, play]);

  // Remove a card from the played area back to hand
  const unplayCard = useCallback((card: ArgumentCard) => {
    setPlayedCards(prev => prev.filter(c => c.id !== card.id));
    setHand(prev => [...prev, card]);
  }, []);

  // Lock in the argument
  const lockIn = useCallback(() => {
    if (playedCards.length === 0 || !selectedOpponent) return;
    const totalRounds = rounds.length;
    const currentWinRate = totalRounds > 0 ? playerWins / totalRounds : 0.5;
    const aiPlayed = aiPlayCards(aiHand, selectedOpponent.difficulty, currentWinRate);
    setAiPlayedCards(aiPlayed);

    const playerStr = calculateArgumentStrength(playedCards);
    const aiStr = calculateArgumentStrength(aiPlayed);

    const record: RoundRecord = {
      playerStrength: playerStr,
      aiStrength: aiStr,
      playerCards: playedCards,
      aiCards: aiPlayed,
    };
    setRounds(prev => [...prev, record]);

    if (playerStr > aiStr) {
      play('correct');
    } else if (playerStr < aiStr) {
      play('wrong');
    } else {
      play('tick');
    }

    setPhase('round_result');
  }, [playedCards, aiHand, selectedOpponent, play]);

  // Advance to next round or end match
  const nextRound = useCallback(() => {
    if (round >= ROUNDS_PER_MATCH) {
      // Update stats and check achievements
      updatePlayerStats(stats => ({
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
      }));
      const newAchievements = checkAchievements();
      if (newAchievements.length > 0) {
        showAchievements(newAchievements);
      }
      play('complete');
      setPhase('match_result');
    } else {
      setRound(r => r + 1);
      const nextUsed = (round) * 10;
      dealRound(cardPool, nextUsed);
      setPhase('playing');
    }
  }, [round, cardPool, play, showAchievements]);

  // Reset for a new game
  const playAgain = useCallback(() => {
    setSelectedTopic(null);
    setSelectedOpponent(null);
    setPhase('select');
    setRound(1);
    setRounds([]);
    setPlayedCards([]);
    setAiPlayedCards([]);
  }, []);

  // Sorted played cards by type order for display
  const typeOrder: CardType[] = ['claim', 'evidence', 'reasoning', 'rebuttal'];
  const sortedPlayedCards = useMemo(() => {
    return [...playedCards].sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type));
  }, [playedCards]);

  // Current round result
  const currentResult = rounds[rounds.length - 1];

  // Match result stats
  const finalPlayerWins = rounds.filter(r => r.playerStrength > r.aiStrength).length;
  const finalAiWins = rounds.filter(r => r.aiStrength > r.playerStrength).length;
  const draws = rounds.filter(r => r.playerStrength === r.aiStrength).length;
  const playerWon = finalPlayerWins > finalAiWins;
  const isDraw = finalPlayerWins === finalAiWins;

  const bestCard = useMemo(() => {
    const allPlayed = rounds.flatMap(r => r.playerCards);
    if (allPlayed.length === 0) return null;
    return allPlayed.reduce((best, c) => c.strength > best.strength ? c : best, allPlayed[0]);
  }, [rounds]);

  const matchShareText = useMemo(() => {
    if (!selectedOpponent || rounds.length === 0) return '';
    const result = playerWon ? 'Victory' : isDraw ? 'Draw' : 'Defeat';
    return `\u2694\uFE0F Argument Arena\n${playerWon ? '\uD83C\uDFC6' : isDraw ? '\uD83E\uDD1D' : '\uD83D\uDC80'} ${result} vs ${selectedOpponent.emoji} ${selectedOpponent.name}\n\uD83D\uDCCA Score: ${finalPlayerWins}-${finalAiWins}\n${bestCard ? `\uD83C\uDF1F Best card: ${bestCard.text.slice(0, 50)}...` : ''}`;
  }, [selectedOpponent, rounds, playerWon, isDraw, finalPlayerWins, finalAiWins, bestCard]);

  const handleMatchCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(matchShareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [matchShareText]);

  // Players for GameLayout
  const displayPlayers = selectedOpponent
    ? [
        { id: 'player', display_name: 'You', avatar_color: '#3B82F6', score: playerWins, is_ready: true, is_connected: true },
        { id: 'ai', display_name: selectedOpponent.name, avatar_color: '#EF4444', score: aiWins, is_ready: true, is_connected: true },
      ]
    : [{ id: 'player', display_name: 'You', avatar_color: '#3B82F6', score: 0, is_ready: true, is_connected: true }];

  // -----------------------------------------------------------------------
  // RENDER: Select Phase
  // -----------------------------------------------------------------------
  const renderSelect = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Swords className="w-10 h-10 text-gold-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">Argument Arena</h2>
          <p className="text-ink-600">Build the strongest argument to defeat your opponent!</p>
        </div>

        {/* Topic Selection */}
        <div className="mb-8">
          <h3 className="font-display text-lg font-semibold text-ink-800 mb-3">Choose a Topic</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topicChoices.map(topic => (
              <motion.button
                key={topic.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTopic(topic)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedTopic?.id === topic.id
                    ? 'border-gold-500 bg-gold-50 ring-2 ring-gold-200'
                    : 'border-ink-200 bg-white hover:border-ink-300'
                }`}
              >
                <h4 className="font-semibold text-ink-800 text-sm mb-2 leading-tight">{topic.topic}</h4>
                <p className="text-xs text-ink-500 leading-relaxed">{topic.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Opponent Selection */}
        <div className="mb-8">
          <h3 className="font-display text-lg font-semibold text-ink-800 mb-3">Choose an Opponent</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {AI_OPPONENTS.map(opp => (
              <motion.button
                key={opp.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedOpponent(opp)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedOpponent?.id === opp.id
                    ? 'border-gold-500 bg-gold-50 ring-2 ring-gold-200'
                    : 'border-ink-200 bg-white hover:border-ink-300'
                }`}
              >
                <div className="text-3xl mb-2">{opp.emoji}</div>
                <h4 className="font-semibold text-ink-800 text-sm">{opp.name}</h4>
                <div className="flex items-center gap-2 mt-1 mb-1">
                  <Badge
                    variant={opp.difficulty === 'easy' ? 'sage' : opp.difficulty === 'medium' ? 'gold' : 'coral'}
                    size="sm"
                  >
                    {opp.difficulty}
                  </Badge>
                </div>
                <p className="text-xs text-ink-500">{opp.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        <Button
          variant="gold"
          size="lg"
          onClick={startMatch}
          disabled={!selectedTopic || !selectedOpponent}
          className="w-full"
        >
          <Swords className="w-5 h-5 mr-2" />
          Start Battle
        </Button>
      </motion.div>
    </div>
  );

  // -----------------------------------------------------------------------
  // RENDER: Playing Phase
  // -----------------------------------------------------------------------
  const renderPlaying = () => (
    <div className="flex-1 flex flex-col p-4 md:p-6">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
        {/* Round info */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant="gold">Round {round} of {ROUNDS_PER_MATCH}</Badge>
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <span className="font-semibold text-sage-600">{playerWins}</span>
            <span>-</span>
            <span className="font-semibold text-coral-600">{aiWins}</span>
          </div>
        </div>

        {/* Battlefield -- AI area */}
        <Card className="mb-3 bg-coral-50/50 border-coral-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{selectedOpponent?.emoji}</span>
              <span className="text-sm font-semibold text-ink-700">{selectedOpponent?.name}</span>
              <Badge variant="outline" size="sm">Opponent</Badge>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="flex-1 h-16 rounded-lg bg-coral-100/50 border border-coral-200 border-dashed flex items-center justify-center"
                >
                  <span className="text-xs text-coral-400">?</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* VS divider */}
        <div className="flex items-center justify-center gap-3 my-2">
          <div className="h-px flex-1 bg-ink-200" />
          <span className="text-ink-400 font-bold text-sm">VS</span>
          <div className="h-px flex-1 bg-ink-200" />
        </div>

        {/* Argument Sequence -- player's played cards */}
        <Card className="mb-4 bg-sage-50/50 border-sage-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-sage-600" />
              <span className="text-sm font-semibold text-ink-700">Your Argument</span>
              <span className="text-xs text-ink-400">({playedCards.length}/{MAX_PLAYED_CARDS})</span>
            </div>
            <div className="flex items-center gap-1">
              {typeOrder.map((type, i) => {
                const card = sortedPlayedCards.find(c => c.type === type);
                const styles = CARD_TYPE_STYLES[type];
                return (
                  <div key={type} className="flex items-center flex-1 min-w-0">
                    {card ? (
                      <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={() => unplayCard(card)}
                        className={`w-full p-2 rounded-lg ${styles.bg} border ${styles.border} text-left cursor-pointer hover:opacity-80 transition-opacity`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant={CARD_TYPE_BADGE_VARIANT[type]} size="sm">{styles.label}</Badge>
                          <span className="text-xs font-bold text-ink-600">{card.strength}</span>
                        </div>
                        <p className="text-xs text-ink-700 line-clamp-2 leading-tight">{card.text}</p>
                      </motion.button>
                    ) : (
                      <div className="w-full p-2 rounded-lg border-2 border-dashed border-ink-200 h-[72px] flex items-center justify-center">
                        <span className="text-xs text-ink-400">{styles.label}</span>
                      </div>
                    )}
                    {i < typeOrder.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-ink-300 flex-shrink-0 mx-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lock In button */}
        <div className="mb-4">
          <Button
            variant="gold"
            size="lg"
            onClick={lockIn}
            disabled={playedCards.length === 0}
            className="w-full"
          >
            <Shield className="w-5 h-5 mr-2" />
            Lock In Argument ({calculateArgumentStrength(playedCards)} pts)
          </Button>
        </div>

        {/* Hand -- scrollable cards */}
        <div className="mt-auto">
          <h3 className="text-sm font-semibold text-ink-700 mb-2">Your Hand</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
            {hand.map(card => {
              const styles = CARD_TYPE_STYLES[card.type];
              const canPlay = playedCards.length < MAX_PLAYED_CARDS && !playedCards.some(c => c.type === card.type);
              return (
                <motion.button
                  key={card.id}
                  whileHover={canPlay ? { y: -4 } : undefined}
                  whileTap={canPlay ? { scale: 0.96 } : undefined}
                  onClick={() => canPlay && playCard(card)}
                  className={`flex-shrink-0 w-[140px] md:w-[160px] p-3 rounded-xl border-2 text-left transition-all snap-start ${
                    canPlay
                      ? `${styles.bg} ${styles.border} cursor-pointer hover:shadow-md`
                      : 'bg-ink-50 border-ink-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge variant={CARD_TYPE_BADGE_VARIANT[card.type]} size="sm">{styles.label}</Badge>
                    <span className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-xs font-bold text-ink-700 shadow-sm">
                      {card.strength}
                    </span>
                  </div>
                  <p className="text-xs text-ink-700 leading-relaxed line-clamp-3">{card.text}</p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // -----------------------------------------------------------------------
  // RENDER: Round Result
  // -----------------------------------------------------------------------
  const renderRoundResult = () => {
    if (!currentResult || !selectedOpponent) return null;
    const playerWon = currentResult.playerStrength > currentResult.aiStrength;
    const tied = currentResult.playerStrength === currentResult.aiStrength;
    const maxBar = Math.max(currentResult.playerStrength, currentResult.aiStrength, 1);

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          {/* Winner announcement */}
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-center mb-6"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
              playerWon ? 'bg-sage-100' : tied ? 'bg-ink-100' : 'bg-coral-100'
            }`}>
              {playerWon ? <Zap className="w-8 h-8 text-sage-600" /> : tied ? <Shield className="w-8 h-8 text-ink-500" /> : <Target className="w-8 h-8 text-coral-600" />}
            </div>
            <h2 className="font-display text-2xl font-bold text-ink-800">
              {playerWon ? 'You Won This Round!' : tied ? 'Draw!' : `${selectedOpponent.emoji} ${selectedOpponent.name} Wins!`}
            </h2>
          </motion.div>

          {/* Strength bars */}
          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-ink-700">You</span>
                    <span className="font-bold text-sage-600">{currentResult.playerStrength} pts</span>
                  </div>
                  <div className="h-4 bg-cream-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentResult.playerStrength / maxBar) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-sage-500 rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-ink-700">{selectedOpponent.emoji} {selectedOpponent.name}</span>
                    <span className="font-bold text-coral-600">{currentResult.aiStrength} pts</span>
                  </div>
                  <div className="h-4 bg-cream-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentResult.aiStrength / maxBar) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                      className="h-full bg-coral-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card breakdown */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div>
              <p className="text-xs font-semibold text-ink-500 mb-2">Your Cards</p>
              <div className="space-y-1.5">
                {currentResult.playerCards.map(c => (
                  <div key={c.id} className={`p-2 rounded-lg ${CARD_TYPE_STYLES[c.type].bg} border ${CARD_TYPE_STYLES[c.type].border}`}>
                    <div className="flex items-center justify-between">
                      <Badge variant={CARD_TYPE_BADGE_VARIANT[c.type]} size="sm">{CARD_TYPE_STYLES[c.type].label}</Badge>
                      <span className="text-xs font-bold text-ink-600">+{c.strength}</span>
                    </div>
                    <p className="text-xs text-ink-700 mt-1 line-clamp-1">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-500 mb-2">{selectedOpponent.name}&apos;s Cards</p>
              <div className="space-y-1.5">
                {currentResult.aiCards.map(c => (
                  <div key={c.id} className={`p-2 rounded-lg ${CARD_TYPE_STYLES[c.type].bg} border ${CARD_TYPE_STYLES[c.type].border}`}>
                    <div className="flex items-center justify-between">
                      <Badge variant={CARD_TYPE_BADGE_VARIANT[c.type]} size="sm">{CARD_TYPE_STYLES[c.type].label}</Badge>
                      <span className="text-xs font-bold text-ink-600">+{c.strength}</span>
                    </div>
                    <p className="text-xs text-ink-700 mt-1 line-clamp-1">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rebuttal impact */}
          {currentResult.playerCards.some(c => c.type === 'rebuttal') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-coral-50 border border-coral-200 rounded-xl p-3 mb-6 text-center"
            >
              <p className="text-sm font-semibold text-coral-700">
                {'\uD83D\uDDE1\uFE0F'} Rebuttal Impact: +{currentResult.playerCards.filter(c => c.type === 'rebuttal').reduce((sum, c) => sum + c.strength * 2, 0)} bonus points
              </p>
            </motion.div>
          )}

          <Button variant="gold" size="lg" onClick={nextRound} className="w-full">
            {round >= ROUNDS_PER_MATCH ? 'See Final Results' : 'Next Round'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  };

  // -----------------------------------------------------------------------
  // RENDER: Match Result
  // -----------------------------------------------------------------------
  const renderMatchResult = () => {
    if (!selectedOpponent) return null;

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          {/* Trophy / result icon */}
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl ${
              playerWon ? 'bg-gold-500' : isDraw ? 'bg-ink-400' : 'bg-coral-500'
            }`}>
              {playerWon ? <Trophy className="w-12 h-12 text-white" /> : isDraw ? <Shield className="w-12 h-12 text-white" /> : <Crown className="w-12 h-12 text-white" />}
            </div>
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-1">
              {playerWon ? 'Victory!' : isDraw ? 'Draw!' : 'Defeat!'}
            </h2>
            <p className="text-ink-600 mb-6">
              vs {selectedOpponent.emoji} {selectedOpponent.name}
            </p>
          </motion.div>

          {/* Score */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-sm text-ink-500">You</p>
                  <p className="text-3xl font-bold text-sage-600">{finalPlayerWins}</p>
                  <p className="text-xs text-ink-400">rounds won</p>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-ink-300 font-bold text-lg">-</span>
                </div>
                <div>
                  <p className="text-sm text-ink-500">{selectedOpponent.name}</p>
                  <p className="text-3xl font-bold text-coral-600">{finalAiWins}</p>
                  <p className="text-xs text-ink-400">rounds won</p>
                </div>
              </div>
              {draws > 0 && (
                <p className="text-xs text-ink-400 mb-4">{draws} draw{draws > 1 ? 's' : ''}</p>
              )}

              {/* Round-by-round */}
              <div className="border-t border-ink-100 pt-4">
                <p className="text-xs text-ink-400 mb-2">Round by round</p>
                <div className="flex gap-1 justify-center">
                  {rounds.map((r, i) => {
                    const pWon = r.playerStrength > r.aiStrength;
                    const tie = r.playerStrength === r.aiStrength;
                    return (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                          pWon ? 'bg-sage-400 text-white' : tie ? 'bg-gold-300 text-gold-800' : 'bg-coral-400 text-white'
                        }`}
                        title={`R${i + 1}: ${r.playerStrength} vs ${r.aiStrength}`}
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3 justify-center mt-2 text-xs text-ink-400">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-sage-400 inline-block" /> You
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-coral-400 inline-block" /> AI
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gold-300 inline-block" /> Draw
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best card */}
          {bestCard && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                  <span className="text-sm font-semibold text-ink-700">Best Card Played</span>
                </div>
                <div className={`p-3 rounded-lg ${CARD_TYPE_STYLES[bestCard.type].bg} border ${CARD_TYPE_STYLES[bestCard.type].border}`}>
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={CARD_TYPE_BADGE_VARIANT[bestCard.type]} size="sm">
                      {CARD_TYPE_STYLES[bestCard.type].label}
                    </Badge>
                    <span className="text-sm font-bold text-ink-600">Strength: {bestCard.strength}</span>
                  </div>
                  <p className="text-sm text-ink-700">{bestCard.text}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleMatchCopy}
              className="w-full"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Share Results'}
            </Button>
            <div className="flex gap-4">
              <Button variant="gold" size="lg" onClick={playAgain} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
              <Button variant="secondary" size="lg" onClick={onExit} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------
  const renderContent = () => {
    switch (phase) {
      case 'select': return renderSelect();
      case 'playing': return renderPlaying();
      case 'round_result': return renderRoundResult();
      case 'match_result': return renderMatchResult();
      default: return null;
    }
  };

  return (
    <GameLayout
      title="Argument Arena"
      subtitle={selectedTopic ? selectedTopic.topic : 'Card-Based Debate Battle'}
      players={displayPlayers}
      currentRound={phase === 'playing' || phase === 'round_result' ? round : undefined}
      totalRounds={ROUNDS_PER_MATCH}
      showTimer={false}
      showRound={phase === 'playing' || phase === 'round_result'}
      onBack={onExit}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={phase + round}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex flex-col"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </GameLayout>
  );
}
