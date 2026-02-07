'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Trophy, Clock, ChevronRight, RotateCcw,
  ArrowLeft, Zap, Star, Lightbulb,
} from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { useSounds } from '@/lib/hooks/useSounds';
import { updatePlayerStats, checkAchievements } from '@/lib/games/achievements';
import { useAchievementToast } from '@/components/ui/AchievementToast';

interface ScavengerBowlProps {
  onExit?: () => void;
}

type Phase = 'intro' | 'playing' | 'result';

interface Clue {
  id: string;
  clue: string;
  options: string[];
  correctIndex: number;
  category: string;
}

const CLUES: Clue[] = [
  { id: 'c1', clue: 'I am a force you cannot see, yet I keep you grounded to the Earth. Without me, you would float away into the cosmos.', options: ['Magnetism', 'Gravity', 'Friction', 'Inertia'], correctIndex: 1, category: 'Science' },
  { id: 'c2', clue: 'I was built to keep invaders out and stretches over 21,000 kilometers. Astronauts once claimed they could see me from space.', options: ['Hadrian\'s Wall', 'Berlin Wall', 'Great Wall of China', 'Wall of Babylon'], correctIndex: 2, category: 'History' },
  { id: 'c3', clue: 'I am the largest ocean on Earth, covering more area than all the land combined. My name means "peaceful."', options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'], correctIndex: 2, category: 'Geography' },
  { id: 'c4', clue: 'I wrote about a boy wizard who discovered he was magical on his eleventh birthday. My books have sold over 500 million copies.', options: ['Roald Dahl', 'J.R.R. Tolkien', 'C.S. Lewis', 'J.K. Rowling'], correctIndex: 3, category: 'Literature' },
  { id: 'c5', clue: 'I painted a ceiling lying on my back for four years. My most famous scene shows two fingers almost touching.', options: ['Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Donatello'], correctIndex: 1, category: 'Arts' },
  { id: 'c6', clue: 'I am a gas that makes up about 78% of the air you breathe, but your body mostly ignores me in favor of my rarer companion.', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium'], correctIndex: 2, category: 'Science' },
  { id: 'c7', clue: 'I am the longest river in Africa. Ancient civilizations flourished along my banks, and my annual floods brought fertile soil.', options: ['Congo River', 'Zambezi River', 'Niger River', 'Nile River'], correctIndex: 3, category: 'Geography' },
  { id: 'c8', clue: 'I led an army across the Alps using elephants to attack Rome. My strategy is still studied in military academies today.', options: ['Julius Caesar', 'Alexander the Great', 'Hannibal Barca', 'Genghis Khan'], correctIndex: 2, category: 'History' },
  { id: 'c9', clue: 'I am a play about a Danish prince who sees his father\'s ghost and famously asks whether existing is worthwhile.', options: ['Macbeth', 'Hamlet', 'King Lear', 'Othello'], correctIndex: 1, category: 'Literature' },
  { id: 'c10', clue: 'I am an instrument with 88 keys, but none of them open doors. I can play the lowest and highest notes in the orchestra.', options: ['Organ', 'Harpsichord', 'Piano', 'Accordion'], correctIndex: 2, category: 'Arts' },
  { id: 'c11', clue: 'I am the smallest planet in our solar system and the closest to the Sun. A year on me lasts only 88 Earth days.', options: ['Venus', 'Mars', 'Mercury', 'Pluto'], correctIndex: 2, category: 'Science' },
  { id: 'c12', clue: 'I am a continent that contains only one country, and I am home to animals found nowhere else, including kangaroos and platypuses.', options: ['Antarctica', 'Australia', 'New Zealand', 'Madagascar'], correctIndex: 1, category: 'Geography' },
  { id: 'c13', clue: 'I was a revolution that began in France in 1789. The people stormed a prison, and a queen supposedly said "let them eat cake."', options: ['American Revolution', 'Industrial Revolution', 'French Revolution', 'Russian Revolution'], correctIndex: 2, category: 'History' },
  { id: 'c14', clue: 'I am a novel about a girl who follows a white rabbit down a hole into a strange world of tea parties and talking cats.', options: ['Peter Pan', 'The Wizard of Oz', 'Alice\'s Adventures in Wonderland', 'Narnia'], correctIndex: 2, category: 'Literature' },
  { id: 'c15', clue: 'I cut off my own ear and painted swirling night skies. During my lifetime I sold only one painting, but now I am one of the most famous artists in history.', options: ['Claude Monet', 'Vincent van Gogh', 'Pablo Picasso', 'Salvador Dali'], correctIndex: 1, category: 'Arts' },
  { id: 'c16', clue: 'I am the process by which plants turn sunlight into food. Without me, most life on Earth would not exist.', options: ['Respiration', 'Fermentation', 'Photosynthesis', 'Decomposition'], correctIndex: 2, category: 'Science' },
  { id: 'c17', clue: 'I am an ancient wonder, a massive stone structure in Egypt built as a tomb for pharaohs. I am the only ancient wonder still standing.', options: ['Colosseum', 'Hanging Gardens', 'Great Pyramid of Giza', 'Lighthouse of Alexandria'], correctIndex: 2, category: 'History' },
  { id: 'c18', clue: 'I am the deepest point in the ocean, located in the western Pacific. I am deeper than Mount Everest is tall.', options: ['Puerto Rico Trench', 'Mariana Trench', 'Java Trench', 'Tonga Trench'], correctIndex: 1, category: 'Geography' },
];

const TOTAL_ROUNDS = 10;
const TIME_PER_QUESTION = 20;
const MAX_SPEED_BONUS = 100;
const BASE_POINTS = 50;

const CATEGORY_COLORS: Record<string, string> = {
  Science: 'sage',
  History: 'gold',
  Geography: 'sky',
  Literature: 'coral',
  Arts: 'purple',
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ScavengerBowl({ onExit }: ScavengerBowlProps) {
  const { play } = useSounds();
  const { showAchievements } = useAchievementToast();

  const [phase, setPhase] = useState<Phase>('intro');
  const [clues, setClues] = useState<Clue[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);

  useEffect(() => {
    if (phase === 'playing' && !isRevealed && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === 'playing' && !isRevealed && timeLeft === 0) {
      handleAnswer(-1);
    }
  }, [phase, isRevealed, timeLeft]);

  const startGame = useCallback(() => {
    const shuffled = shuffleArray(CLUES).slice(0, TOTAL_ROUNDS);
    setClues(shuffled);
    setRound(0);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setRoundScores([]);
    setTimeLeft(TIME_PER_QUESTION);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setPhase('playing');
    play('powerup');
  }, [play]);

  const handleAnswer = useCallback((index: number) => {
    if (isRevealed) return;
    const currentClue = clues[round];
    const correct = index === currentClue.correctIndex;
    const speedBonus = Math.round((timeLeft / TIME_PER_QUESTION) * MAX_SPEED_BONUS);
    const points = correct ? BASE_POINTS + speedBonus : 0;

    setSelectedAnswer(index);
    setIsRevealed(true);
    setRoundScores(prev => [...prev, points]);

    if (correct) {
      play('correct');
      setScore(s => s + points);
      setCorrectCount(c => c + 1);
      setStreak(s => s + 1);
    } else {
      play('wrong');
      setStreak(0);
    }
  }, [isRevealed, clues, round, timeLeft, play]);

  const nextRound = useCallback(() => {
    if (round + 1 >= TOTAL_ROUNDS) {
      updatePlayerStats(stats => ({
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        totalQuestionsAnswered: stats.totalQuestionsAnswered + TOTAL_ROUNDS,
        correctAnswers: stats.correctAnswers + correctCount + (selectedAnswer === clues[round]?.correctIndex ? 1 : 0),
      }));
      const newAchievements = checkAchievements();
      if (newAchievements.length > 0) {
        showAchievements(newAchievements);
      }
      play('complete');
      setPhase('result');
    } else {
      setRound(r => r + 1);
      setTimeLeft(TIME_PER_QUESTION);
      setSelectedAnswer(null);
      setIsRevealed(false);
    }
  }, [round, correctCount, selectedAnswer, clues, play, showAchievements]);

  const currentClue = clues[round];
  const categoryColor = currentClue ? (CATEGORY_COLORS[currentClue.category] || 'ink') : 'ink';

  const renderIntro = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-10 h-10 text-gold-600" />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">Scavenger Bowl</h2>
        <p className="text-ink-600 mb-6">
          Read the riddle-style clue and figure out what it describes. Answer fast for bonus points!
        </p>
        <div className="bg-cream-100 rounded-xl p-4 mb-6 text-left space-y-2 text-sm text-ink-600">
          <p className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-gold-500" /> 10 clue-based riddles to solve</p>
          <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-gold-500" /> 20 seconds per question</p>
          <p className="flex items-center gap-2"><Zap className="w-4 h-4 text-gold-500" /> Speed bonus: faster answers = more points</p>
          <p className="flex items-center gap-2"><Star className="w-4 h-4 text-gold-500" /> Topics: Science, History, Geography, Literature, Arts</p>
        </div>
        <Button variant="gold" size="lg" onClick={startGame} className="w-full">
          <Search className="w-5 h-5 mr-2" />
          Start Scavenger Bowl
        </Button>
      </motion.div>
    </div>
  );

  const renderPlaying = () => {
    if (!currentClue) return null;
    return (
      <div className="flex-1 flex flex-col p-4 md:p-6">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="gold">Round {round + 1} of {TOTAL_ROUNDS}</Badge>
            <div className="flex items-center gap-3">
              {streak >= 3 && (
                <Badge variant="coral">
                  <Zap className="w-3 h-3 mr-1" />
                  {streak} Streak
                </Badge>
              )}
              <span className="text-sm font-bold text-gold-600">{score} pts</span>
            </div>
          </div>

          <div className="mb-4">
            <Progress value={round + 1} max={TOTAL_ROUNDS} variant="gold" />
          </div>

          <Card className="mb-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant={categoryColor as 'gold' | 'sage' | 'coral'}>{currentClue.category}</Badge>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                  timeLeft <= 5 ? 'bg-coral-100 text-coral-600 animate-pulse' : 'bg-ink-100 text-ink-600'
                }`}>
                  {timeLeft}
                </div>
              </div>
              <div className="flex items-start gap-3 mb-2">
                <Lightbulb className="w-6 h-6 text-gold-500 shrink-0 mt-1" />
                <p className="text-lg text-ink-800 leading-relaxed font-medium italic">
                  &quot;{currentClue.clue}&quot;
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3 mb-6">
            {currentClue.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = isRevealed && currentClue.correctIndex === index;
              const isWrong = isRevealed && isSelected && !isCorrect;

              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => !isRevealed && handleAnswer(index)}
                  disabled={isRevealed}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    isCorrect
                      ? 'bg-sage-100 border-2 border-sage-500 ring-2 ring-sage-200'
                      : isWrong
                      ? 'bg-coral-100 border-2 border-coral-500 ring-2 ring-coral-200'
                      : isSelected
                      ? 'bg-gold-100 border-2 border-gold-500'
                      : 'bg-cream-100 border-2 border-transparent hover:border-gold-300 active:scale-[0.98]'
                  } ${isRevealed ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                      isCorrect ? 'bg-sage-500 text-white'
                      : isWrong ? 'bg-coral-500 text-white'
                      : isSelected ? 'bg-gold-500 text-white'
                      : 'bg-ink-200 text-ink-600'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className={`flex-1 font-medium text-lg ${
                      isCorrect ? 'text-sage-800' : isWrong ? 'text-coral-800' : 'text-ink-800'
                    }`}>
                      {option}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {isRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-auto"
            >
              {roundScores[roundScores.length - 1] > 0 ? (
                <div className="text-center mb-4">
                  <span className="text-sage-600 font-bold text-lg">
                    +{roundScores[roundScores.length - 1]} points
                  </span>
                  <span className="text-ink-400 text-sm ml-2">(speed bonus included)</span>
                </div>
              ) : (
                <div className="text-center mb-4">
                  <span className="text-coral-600 font-medium">
                    The answer was: {currentClue.options[currentClue.correctIndex]}
                  </span>
                </div>
              )}
              <Button variant="gold" size="lg" onClick={nextRound} className="w-full">
                {round + 1 >= TOTAL_ROUNDS ? 'See Results' : 'Next Clue'}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  const renderResult = () => {
    const accuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);
    const grade = accuracy >= 90 ? 'S' : accuracy >= 70 ? 'A' : accuracy >= 50 ? 'B' : 'C';
    const gradeColor = grade === 'S' ? 'bg-gold-500' : grade === 'A' ? 'bg-sage-500' : grade === 'B' ? 'bg-sky-500' : 'bg-ink-400';

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={`w-24 h-24 ${gradeColor} rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl`}>
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h2 className="font-display text-3xl font-bold text-ink-800 mb-1">Scavenger Bowl Complete!</h2>
            <p className="text-ink-600 mb-6">Grade: {grade}</p>
          </motion.div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-3xl font-bold text-gold-600">{score}</p>
                  <p className="text-xs text-ink-400">Total Points</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-sage-600">{correctCount}</p>
                  <p className="text-xs text-ink-400">Correct</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-ink-700">{accuracy}%</p>
                  <p className="text-xs text-ink-400">Accuracy</p>
                </div>
              </div>
              <div className="border-t border-ink-100 pt-4">
                <p className="text-xs text-ink-400 mb-2">Round by round</p>
                <div className="flex gap-1 justify-center">
                  {roundScores.map((rs, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                        rs > 0 ? 'bg-sage-400 text-white' : 'bg-coral-400 text-white'
                      }`}
                      title={`R${i + 1}: ${rs} pts`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="gold" size="lg" onClick={startGame} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
            <Button variant="secondary" size="lg" onClick={onExit} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderContent = () => {
    switch (phase) {
      case 'intro': return renderIntro();
      case 'playing': return renderPlaying();
      case 'result': return renderResult();
      default: return null;
    }
  };

  return (
    <GameLayout
      title="Scavenger Bowl"
      subtitle="Clue-Based Quiz Challenge"
      players={[{ id: 'player', display_name: 'You', avatar_color: '#D97706', score, is_ready: true, is_connected: true }]}
      currentRound={phase === 'playing' ? round + 1 : undefined}
      totalRounds={TOTAL_ROUNDS}
      timeRemaining={phase === 'playing' && !isRevealed ? timeLeft : undefined}
      showTimer={phase === 'playing' && !isRevealed}
      showRound={phase === 'playing'}
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
