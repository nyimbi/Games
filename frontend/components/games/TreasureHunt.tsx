'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Star, Lock, Crown, ArrowLeft, ChevronRight, Gift, Check, X } from 'lucide-react';
import { Button, Card, CardContent, Badge, TimerDisplay, Progress } from '@/components/ui';
import { useSounds } from '@/lib/hooks/useSounds';
import { updatePlayerStats, checkAchievements } from '@/lib/games/achievements';
import { useAchievementToast } from '@/components/ui/AchievementToast';
import { recordWrongAnswer } from '@/lib/games/wrongAnswerJournal';
import { getStorage, setStorage, STORAGE_KEYS } from '@/lib/storage';
import {
  type MapRegion, type MapLocation, type TreasureHuntProgress,
  MAP_REGIONS, BRIDGE_CHALLENGES, getDefaultProgress,
  isLocationUnlocked, calculateStars, getQuestionsForLocation, isRegionComplete,
} from '@/lib/games/treasureHunt';
import type { Question } from '@/lib/games/types';
import { getMixedQuestions } from '@/lib/games/questions';

interface TreasureHuntProps { onExit?: () => void }

type GamePhase = 'map' | 'region' | 'challenge' | 'result' | 'boss_intro';

const REGION_COLORS: Record<string, string> = {
  science_volcano: 'sage', social_studies_city: 'coral', arts_gallery: 'gold',
  literature_library: 'ink', special_observatory: 'purple',
};

const COLOR_MAP: Record<string, { bg: string; bgLight: string; border: string; text: string }> = {
  sage: { bg: 'bg-sage-500', bgLight: 'bg-sage-50', border: 'border-sage-400', text: 'text-sage-700' },
  coral: { bg: 'bg-coral-500', bgLight: 'bg-coral-50', border: 'border-coral-400', text: 'text-coral-700' },
  gold: { bg: 'bg-gold-500', bgLight: 'bg-gold-50', border: 'border-gold-400', text: 'text-gold-700' },
  ink: { bg: 'bg-ink-500', bgLight: 'bg-ink-50', border: 'border-ink-400', text: 'text-ink-700' },
  purple: { bg: 'bg-purple-500', bgLight: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700' },
};

function getRegionStars(regionId: string, progress: TreasureHuntProgress) {
  const region = MAP_REGIONS.find(r => r.id === regionId);
  if (!region) return { earned: 0, possible: 0 };
  let earned = 0;
  for (const loc of region.locations) earned += progress.regions[regionId]?.[loc.id]?.stars ?? 0;
  return { earned, possible: region.locations.length * 3 };
}

function getCompletionPct(regionId: string, progress: TreasureHuntProgress) {
  const region = MAP_REGIONS.find(r => r.id === regionId);
  if (!region) return 0;
  const done = region.locations.filter(l => progress.regions[regionId]?.[l.id]?.completed).length;
  return Math.round((done / region.locations.length) * 100);
}

function getDailyExpeditionLocation(): { regionIdx: number; locationIdx: number } {
  const today = new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash |= 0;
  }
  const regionIdx = Math.abs(hash) % MAP_REGIONS.length;
  const region = MAP_REGIONS[regionIdx];
  const locationIdx = Math.abs(hash >> 4) % region.locations.length;
  return { regionIdx, locationIdx };
}

export function TreasureHunt({ onExit }: TreasureHuntProps) {
  const sounds = useSounds();
  const { showAchievements } = useAchievementToast();

  const [phase, setPhase] = useState<GamePhase>('map');
  const [progress, setProgress] = useState<TreasureHuntProgress>(getDefaultProgress);
  const [activeRegion, setActiveRegion] = useState<MapRegion | null>(null);
  const [activeLocation, setActiveLocation] = useState<MapLocation | null>(null);
  const [activeLocationIndex, setActiveLocationIndex] = useState(0);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [earnedStars, setEarnedStars] = useState(0);
  const [previousStars, setPreviousStars] = useState(0);
  const [regionJustCompleted, setRegionJustCompleted] = useState(false);
  const [bossDefeated, setBossDefeated] = useState(false);
  const [dailyExpedition] = useState(() => getDailyExpeditionLocation());

  useEffect(() => {
    const saved = getStorage<TreasureHuntProgress | null>(STORAGE_KEYS.TREASURE_HUNT_PROGRESS, null);
    if (saved) setProgress(saved);
  }, []);

  const saveProgress = useCallback((p: TreasureHuntProgress) => {
    setProgress(p);
    setStorage(STORAGE_KEYS.TREASURE_HUNT_PROGRESS, p);
  }, []);

  useEffect(() => {
    if (phase !== 'challenge' || isRevealed || timeLeft <= 0) return;
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, isRevealed, timeLeft]);

  useEffect(() => {
    if (phase === 'challenge' && !isRevealed && timeLeft === 0) handleAnswer(-1);
  }, [timeLeft, phase, isRevealed]);

  const enterRegion = useCallback((region: MapRegion) => {
    setActiveRegion(region);
    setPhase('region');
  }, []);

  const startChallenge = useCallback((region: MapRegion, location: MapLocation, locIndex: number) => {
    setActiveRegion(region);
    setActiveLocation(location);
    setActiveLocationIndex(locIndex);
    setQuestions(getQuestionsForLocation(region.subject, location.questionsCount));
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setCorrectCount(0);
    setTimeLeft(20);
    setPhase(location.isBoss ? 'boss_intro' : 'challenge');
  }, []);

  const handleAnswer = useCallback((answerIndex: number) => {
    if (isRevealed || !questions[questionIndex]) return;
    const currentQ = questions[questionIndex];
    const correct = answerIndex === currentQ.correct_index;

    if (correct) {
      sounds.play('correct');
      setCorrectCount(c => c + 1);
    } else {
      sounds.play('wrong');
      recordWrongAnswer(
        currentQ.id, currentQ.text, currentQ.subject,
        answerIndex >= 0 ? currentQ.options[answerIndex] : '(timed out)',
        currentQ.options[currentQ.correct_index], currentQ.explanation, currentQ.deep_explanation
      );
    }

    const updatedStats = updatePlayerStats((stats) => {
      const newStreak = correct ? stats.currentStreak + 1 : 0;
      const subjectAcc = { ...stats.subjectAccuracy };
      const subKey = currentQ.subject || 'mixed';
      const prev = subjectAcc[subKey] || { correct: 0, total: 0 };
      subjectAcc[subKey] = { correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 };
      return {
        ...stats,
        totalQuestionsAnswered: stats.totalQuestionsAnswered + 1,
        correctAnswers: stats.correctAnswers + (correct ? 1 : 0),
        currentStreak: newStreak,
        longestStreak: Math.max(stats.longestStreak, newStreak),
        subjectAccuracy: subjectAcc,
      };
    });

    const newAchievements = checkAchievements(updatedStats);
    if (newAchievements.length > 0) {
      sounds.play('achievement');
      showAchievements(newAchievements);
    }

    setSelectedAnswer(answerIndex);
    setIsRevealed(true);
  }, [isRevealed, questions, questionIndex, sounds, showAchievements]);

  const advanceQuestion = useCallback(() => {
    const nextIdx = questionIndex + 1;
    if (nextIdx >= questions.length) {
      const finalCorrect = correctCount;
      const stars = calculateStars(finalCorrect, questions.length);
      const regionId = activeRegion?.id ?? '';
      const locationId = activeLocation?.id ?? '';
      const prevStarCount = progress.regions[regionId]?.[locationId]?.stars ?? 0;
      setPreviousStars(prevStarCount);
      setEarnedStars(stars);

      const newProgress = { ...progress };
      if (!newProgress.regions[regionId]) newProgress.regions[regionId] = {};
      const currentLoc = newProgress.regions[regionId][locationId] || { stars: 0, completed: false };
      const updatedStars = Math.max(currentLoc.stars, stars);
      newProgress.regions[regionId][locationId] = {
        stars: updatedStars, completed: stars > 0 || currentLoc.completed,
      };
      newProgress.totalStars = (newProgress.totalStars || 0) + (updatedStars - currentLoc.stars);

      const wasComplete = isRegionComplete(regionId, progress);
      const nowComplete = isRegionComplete(regionId, newProgress);
      setRegionJustCompleted(!wasComplete && nowComplete);
      setBossDefeated(activeLocation?.isBoss === true && stars > 0);

      saveProgress(newProgress);
      sounds.play('complete');
      setPhase('result');
    } else {
      setQuestionIndex(nextIdx);
      setSelectedAnswer(null);
      setIsRevealed(false);
      setTimeLeft(20);
    }
  }, [questionIndex, questions, correctCount, activeRegion, activeLocation, progress, saveProgress, sounds]);

  useEffect(() => {
    if (!isRevealed) return;
    const delay = setTimeout(advanceQuestion, 2000);
    return () => clearTimeout(delay);
  }, [isRevealed, advanceQuestion]);

  const backToMap = useCallback(() => {
    setPhase('map'); setActiveRegion(null); setActiveLocation(null);
  }, []);

  const backToRegion = useCallback(() => {
    setPhase('region'); setActiveLocation(null);
  }, []);

  // MAP VIEW
  const renderMapView = () => (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onExit && (
            <Button variant="ghost" size="sm" onClick={onExit}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-800">Treasure Hunt</h1>
            <p className="text-sm text-ink-500">Explore regions and collect stars</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gold-100 px-3 py-1.5 rounded-full">
          <Star className="w-4 h-4 text-gold-600 fill-gold-600" />
          <span className="font-bold text-gold-700">{progress.totalStars}</span>
        </div>
      </div>

      {(() => {
        const daily = dailyExpedition;
        const dailyRegion = MAP_REGIONS[daily.regionIdx];
        const dailyLoc = dailyRegion.locations[daily.locationIdx];
        const locProgress = progress.regions[dailyRegion.id]?.[dailyLoc.id];
        const alreadyDone = locProgress?.completed ?? false;

        return (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 max-w-lg mx-auto w-full"
          >
            <Card className="border-gold-300 bg-gradient-to-r from-gold-50 to-gold-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gold-800">Daily Expedition</p>
                    <p className="text-xs text-gold-600">
                      {dailyRegion.icon} {dailyLoc.name} in {dailyRegion.name}
                    </p>
                  </div>
                  {alreadyDone ? (
                    <Badge className="bg-gold-500 text-white">Done!</Badge>
                  ) : (
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => {
                        enterRegion(dailyRegion);
                        setTimeout(() => {
                          startChallenge(dailyRegion, dailyLoc, daily.locationIdx);
                        }, 100);
                      }}
                    >
                      Go!
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })()}

      <div className="space-y-4 max-w-lg mx-auto w-full">
        {MAP_REGIONS.map((region, rIdx) => {
          const color = REGION_COLORS[region.id] || 'ink';
          const colors = COLOR_MAP[color] || COLOR_MAP.ink;
          const { earned, possible } = getRegionStars(region.id, progress);
          const pct = getCompletionPct(region.id, progress);
          return (
            <div key={region.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rIdx * 0.08 }}
              >
                <Card
                  className={`${colors.bgLight} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => enterRegion(region)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center text-2xl text-white`}>
                        {region.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-display font-bold text-ink-800 truncate">{region.name}</h3>
                          <ChevronRight className="w-4 h-4 text-ink-400 flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-ink-500 mb-2">
                          <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
                          <span>{earned}/{possible}</span>
                          <span className="text-ink-300">|</span>
                          <span>{pct}% complete</span>
                        </div>
                        <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${colors.bg} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: rIdx * 0.08 + 0.2 }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {rIdx < MAP_REGIONS.length - 1 && (() => {
                const bridge = BRIDGE_CHALLENGES[rIdx];
                if (!bridge) return null;
                const fromDone = isRegionComplete(bridge.from, progress);
                const bridgeDone = progress.regions['bridges']?.[bridge.id]?.completed;
                if (!fromDone && !bridgeDone) return null;
                return (
                  <div className="flex justify-center py-2">
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        bridgeDone ? 'bg-gold-100 text-gold-700' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                      }`}
                      onClick={() => {
                        setQuestions(getMixedQuestions(undefined, 4));
                        setActiveRegion(MAP_REGIONS[rIdx]);
                        setActiveLocation({ id: bridge.id, name: bridge.name, isBoss: false, questionsCount: 4 });
                        setActiveLocationIndex(-1);
                        setQuestionIndex(0); setSelectedAnswer(null); setIsRevealed(false);
                        setCorrectCount(0); setTimeLeft(20); setPhase('challenge');
                      }}
                    >
                      <span>{bridge.icon}</span>
                      <span>{bridge.name}</span>
                      {bridgeDone && <Check className="w-3.5 h-3.5" />}
                    </motion.button>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );

  // REGION VIEW
  const renderRegionView = () => {
    if (!activeRegion) return null;
    const color = REGION_COLORS[activeRegion.id] || 'ink';
    const colors = COLOR_MAP[color] || COLOR_MAP.ink;
    return (
      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={backToMap}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-2xl">{activeRegion.icon}</span>
          <h2 className="font-display text-xl font-bold text-ink-800">{activeRegion.name}</h2>
        </div>

        <div className="max-w-md mx-auto w-full space-y-0">
          {activeRegion.locations.map((loc, locIdx) => {
            const unlocked = isLocationUnlocked(activeRegion.id, locIdx, progress);
            const locProgress = progress.regions[activeRegion.id]?.[loc.id];
            const completed = locProgress?.completed ?? false;
            const starCount = locProgress?.stars ?? 0;
            return (
              <div key={loc.id} className="flex flex-col items-center">
                {locIdx > 0 && (
                  <div className={`w-0.5 h-6 ${completed || unlocked ? colors.bg : 'bg-ink-200'}`} />
                )}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: locIdx * 0.05 }}
                  disabled={!unlocked}
                  onClick={() => unlocked && startChallenge(activeRegion, loc, locIdx)}
                  className={`relative flex items-center gap-3 w-full max-w-xs p-3 rounded-2xl transition-all ${
                    !unlocked ? 'bg-ink-100 cursor-not-allowed opacity-60'
                    : completed ? `${colors.bgLight} border-2 ${colors.border}`
                    : 'bg-white border-2 border-ink-200 hover:border-gold-400 hover:shadow-md'
                  } ${loc.isBoss ? 'ring-2 ring-gold-300' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !unlocked ? 'bg-ink-200' : completed ? colors.bg : 'bg-white border-2 border-ink-300'
                  } ${unlocked && !completed ? 'animate-pulse' : ''}`}>
                    {!unlocked ? <Lock className="w-4 h-4 text-ink-400" />
                      : loc.isBoss ? <Crown className={`w-5 h-5 ${completed ? 'text-white' : 'text-gold-500'}`} />
                      : completed ? <Check className="w-4 h-4 text-white" />
                      : <Map className="w-4 h-4 text-ink-500" />}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${!unlocked ? 'text-ink-400' : 'text-ink-800'}`}>{loc.name}</span>
                      {loc.isBoss && (
                        <Badge variant="outline" className="text-xs bg-gold-50 text-gold-700 border-gold-300">Boss</Badge>
                      )}
                      {dailyExpedition.regionIdx === MAP_REGIONS.indexOf(activeRegion) &&
                       dailyExpedition.locationIdx === locIdx && (
                        <Badge variant="outline" className="text-xs bg-gold-50 text-gold-700 border-gold-300">
                          <Gift className="w-3 h-3 mr-1" />Daily
                        </Badge>
                      )}
                    </div>
                    {completed && starCount > 0 && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1, 2, 3].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= starCount ? 'text-gold-500 fill-gold-500' : 'text-ink-200'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  {unlocked && !completed && <ChevronRight className="w-4 h-4 text-ink-400 flex-shrink-0" />}
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // BOSS INTRO
  const renderBossIntro = () => {
    if (!activeRegion || !activeLocation) return null;
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <motion.div
            className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-gold-300 to-gold-500 flex items-center justify-center shadow-lg"
            animate={{ rotate: [0, -3, 3, -3, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <span className="text-5xl">{activeRegion.icon}</span>
          </motion.div>
          <motion.h2
            className="font-display text-3xl font-bold text-gold-700 mb-2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.6, repeat: 2 }}
          >
            Boss Challenge!
          </motion.h2>
          <p className="text-ink-600 mb-2">{activeLocation.name}</p>
          <p className="text-sm text-ink-500 mb-8">
            {activeLocation.questionsCount} questions. Get them right to claim the region treasure!
          </p>
          <Button variant="gold" size="lg" onClick={() => setPhase('challenge')}>Begin</Button>
        </motion.div>
      </div>
    );
  };

  // CHALLENGE
  const renderChallenge = () => {
    const currentQ = questions[questionIndex];
    if (!currentQ) return null;
    const labels = ['A', 'B', 'C', 'D'];
    return (
      <div className="flex-1 flex flex-col p-4">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-ink-500 font-medium">{activeLocation?.name ?? 'Challenge'}</p>
              <p className="text-xs text-ink-400">Question {questionIndex + 1} of {questions.length}</p>
            </div>
            <TimerDisplay time={timeLeft} maxTime={20} size={48} />
          </div>
          <Progress value={questionIndex + 1} max={questions.length} variant="gold" />

          <motion.div key={currentQ.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="mt-4 mb-6">
            <Card className="bg-white">
              <CardContent className="p-5">
                <Badge variant="outline" className="mb-3">{currentQ.subject}</Badge>
                <h2 className="font-display text-lg md:text-xl font-semibold text-ink-800 leading-relaxed">{currentQ.text}</h2>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {currentQ.options.map((option, idx) => {
              const isSel = selectedAnswer === idx;
              const isCorr = isRevealed && currentQ.correct_index === idx;
              const isWrng = isRevealed && isSel && !isCorr;
              return (
                <motion.button
                  key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }} onClick={() => !isRevealed && handleAnswer(idx)} disabled={isRevealed}
                  className={`p-4 rounded-xl text-left transition-all ${
                    isCorr ? 'bg-sage-100 border-2 border-sage-500 ring-2 ring-sage-200'
                    : isWrng ? 'bg-coral-100 border-2 border-coral-500 ring-2 ring-coral-200'
                    : isSel ? 'bg-gold-100 border-2 border-gold-500'
                    : 'bg-cream-100 border-2 border-transparent hover:border-gold-300 active:scale-[0.98]'
                  } ${isRevealed ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      isCorr ? 'bg-sage-500 text-white' : isWrng ? 'bg-coral-500 text-white' : 'bg-ink-100 text-ink-600'
                    }`}>
                      {isCorr ? <Check className="w-4 h-4" /> : isWrng ? <X className="w-4 h-4" /> : labels[idx]}
                    </span>
                    <span className={`text-sm font-medium leading-snug ${
                      isCorr ? 'text-sage-800' : isWrng ? 'text-coral-800' : 'text-ink-700'
                    }`}>{option}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {isRevealed && selectedAnswer !== currentQ.correct_index && currentQ.explanation && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="p-4 bg-coral-50 rounded-xl border border-coral-200 text-sm text-ink-700">
                  <p className="font-medium text-coral-700 mb-1">Explanation:</p>
                  <p>{currentQ.explanation}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  // RESULT
  const renderResult = () => {
    const totalQ = questions.length;
    const improved = earnedStars > previousStars;
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm w-full">
          {bossDefeated && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
              <Badge className="bg-gold-500 text-white text-sm px-3 py-1">Boss Defeated!</Badge>
            </motion.div>
          )}
          {regionJustCompleted && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-4">
              <div className="inline-flex items-center gap-2 bg-gold-100 text-gold-700 px-4 py-2 rounded-full font-bold">
                <Gift className="w-5 h-5" />Region Complete!
              </div>
            </motion.div>
          )}

          <div className="flex items-center justify-center gap-3 mb-6">
            {[1, 2, 3].map(s => (
              <motion.div
                key={s}
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: s <= earnedStars ? 1 : 0.3, scale: 1, rotate: 0 }}
                transition={{ delay: s * 0.25, type: 'spring', stiffness: 200, damping: 12 }}
              >
                <Star className={`w-12 h-12 ${s <= earnedStars ? 'text-gold-500 fill-gold-500' : 'text-ink-200'}`} />
              </motion.div>
            ))}
          </div>

          <h2 className="font-display text-2xl font-bold text-ink-800 mb-1">{correctCount} / {totalQ} Correct</h2>
          <p className="text-ink-500 text-sm mb-2">{activeLocation?.name}</p>

          {improved && previousStars > 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-sm text-sage-600 font-medium mb-4">
              New personal best! {previousStars} → {earnedStars} stars
            </motion.p>
          )}
          {earnedStars === 0 && <p className="text-sm text-coral-600 mb-4">Try again to earn stars and unlock the next location.</p>}
          {earnedStars === 3 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-sm text-gold-600 font-medium mb-4">Perfect score!</motion.p>
          )}

          <div className="flex flex-col gap-2 mt-6">
            {earnedStars < 3 && earnedStars > 0 && activeRegion && activeLocation && (
              <Button variant="ghost" onClick={() => startChallenge(activeRegion, activeLocation, activeLocationIndex)}>
                Try Again for More Stars
              </Button>
            )}
            {earnedStars === 0 && activeRegion && activeLocation && (
              <Button variant="gold" onClick={() => startChallenge(activeRegion, activeLocation, activeLocationIndex)}>Try Again</Button>
            )}
            {activeRegion && (
              <Button variant={earnedStars > 0 ? 'gold' : 'ghost'} onClick={backToRegion}>Back to Region</Button>
            )}
            <Button variant="ghost" onClick={backToMap}>Back to Map</Button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-cream-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col"
        >
          {phase === 'map' && renderMapView()}
          {phase === 'region' && renderRegionView()}
          {phase === 'boss_intro' && renderBossIntro()}
          {phase === 'challenge' && renderChallenge()}
          {phase === 'result' && renderResult()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
