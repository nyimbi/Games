'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, HelpCircle, BookOpen, ChevronRight, Clock } from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { useSounds } from '@/lib/hooks/useSounds';
import { passages } from '@/lib/games/passages';
import { recordWrongAnswer } from '@/lib/games/wrongAnswerJournal';
import { updatePlayerStats, checkAchievements } from '@/lib/games/achievements';
import type { ReadingPassage, PassageQuestion } from '@/lib/games/types';

interface ScholarReadProps {
  onExit?: () => void;
}

type Phase = 'select' | 'reading' | 'questions' | 'revealing' | 'results';

const READING_TIME_SECONDS = 180; // 3 minutes

export function ScholarRead({ onExit }: ScholarReadProps) {
  const { play } = useSounds();

  const [phase, setPhase] = useState<Phase>('select');
  const [currentPassage, setCurrentPassage] = useState<ReadingPassage | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [highlightedParagraph, setHighlightedParagraph] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [completedPassages, setCompletedPassages] = useState<string[]>([]);
  const [answers, setAnswers] = useState<{ correct: boolean; questionId: string }[]>([]);
  const [timeLeft, setTimeLeft] = useState(READING_TIME_SECONDS);

  // Reading timer
  useEffect(() => {
    if (phase !== 'reading' || timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  // Auto-advance when reading time expires
  useEffect(() => {
    if (phase === 'reading' && timeLeft <= 0) {
      setPhase('questions');
    }
  }, [phase, timeLeft]);

  const currentQuestion: PassageQuestion | null =
    currentPassage && currentPassage.questions[currentQuestionIndex]
      ? currentPassage.questions[currentQuestionIndex]
      : null;

  const handleSelectPassage = (passage: ReadingPassage) => {
    setCurrentPassage(passage);
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers([]);
    setTimeLeft(READING_TIME_SECONDS);
    setHighlightedParagraph(null);
    setPhase('reading');
  };

  const handleDoneReading = () => {
    setPhase('questions');
  };

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (phase !== 'questions' || !currentQuestion || !currentPassage) return;

      const isCorrect = answerIndex === currentQuestion.correctIndex;
      const points = isCorrect ? 20 : 0;

      setSelectedAnswer(answerIndex);
      setScore((prev) => prev + points);
      setPhase('revealing');

      // Highlight the relevant paragraph
      if (currentQuestion.paragraph_ref !== undefined) {
        setHighlightedParagraph(currentQuestion.paragraph_ref);
      }

      if (isCorrect) {
        play('correct');
      } else {
        play('wrong');
        recordWrongAnswer(
          currentQuestion.id,
          currentQuestion.question,
          currentPassage.subject,
          currentPassage.questions[currentQuestionIndex].options[answerIndex],
          currentPassage.questions[currentQuestionIndex].options[currentQuestion.correctIndex],
          currentQuestion.explanation
        );
      }

      setAnswers((prev) => [...prev, { correct: isCorrect, questionId: currentQuestion.id }]);

      setTimeout(() => {
        setHighlightedParagraph(null);
        if (currentQuestionIndex + 1 >= currentPassage.questions.length) {
          const finalScore = score + points;
          setTotalScore((prev) => prev + finalScore);
          setCompletedPassages((prev) => [...prev, currentPassage.id]);

          const correctCount = answers.filter((a) => a.correct).length + (isCorrect ? 1 : 0);
          updatePlayerStats((stats) => ({
            ...stats,
            totalQuestionsAnswered:
              stats.totalQuestionsAnswered + currentPassage.questions.length,
            correctAnswers: stats.correctAnswers + correctCount,
            gamesPlayed: stats.gamesPlayed + 1,
          }));
          checkAchievements();

          play('complete');
          setPhase('results');
        } else {
          setCurrentQuestionIndex((prev) => prev + 1);
          setSelectedAnswer(null);
          setPhase('questions');
        }
      }, 3000);
    },
    [phase, currentQuestion, currentPassage, currentQuestionIndex, score, answers, play]
  );

  const handleNextPassage = () => {
    setCurrentPassage(null);
    setPhase('select');
  };

  const handleExit = () => {
    onExit?.();
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const displayPlayers = [
    {
      id: 'reader',
      display_name: 'You',
      avatar_color: '#8B5CF6',
      score: totalScore + score,
      is_ready: true,
      is_connected: true,
    },
  ];

  const renderContent = () => {
    switch (phase) {
      case 'select':
        return (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-2xl mx-auto w-full">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gold-600" />
                </div>
                <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">
                  Choose a Passage
                </h2>
                <p className="text-ink-600">
                  Read carefully, then answer comprehension questions.
                </p>
              </div>

              <div className="space-y-4">
                {passages.map((passage) => {
                  const isDone = completedPassages.includes(passage.id);
                  return (
                    <motion.div
                      key={passage.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card
                        className={`bg-white ${isDone ? 'opacity-60' : 'hover:shadow-md'} transition-shadow`}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{passage.subject}</Badge>
                                <span className="text-sm text-ink-500">
                                  {passage.questions.length} questions
                                </span>
                                {isDone && <Badge variant="sage">Completed</Badge>}
                              </div>
                              <h3 className="font-display text-lg font-semibold text-ink-800 mb-1">
                                {passage.title}
                              </h3>
                              {passage.theme_connection && (
                                <p className="text-sm text-ink-500 italic">
                                  {passage.theme_connection}
                                </p>
                              )}
                            </div>
                            <Button
                              variant={isDone ? 'secondary' : 'gold'}
                              size="sm"
                              onClick={() => handleSelectPassage(passage)}
                            >
                              {isDone ? 'Reread' : 'Read'}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'reading':
        if (!currentPassage) return null;
        const paragraphs = currentPassage.content.split('\n\n');
        return (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
              {/* Timer bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-display text-xl font-bold text-ink-800">
                    {currentPassage.title}
                  </h2>
                  <div
                    className={`flex items-center gap-2 text-sm font-medium ${
                      timeLeft <= 30 ? 'text-coral-600' : 'text-ink-600'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    {formatTime(timeLeft)}
                  </div>
                </div>
                <Progress
                  value={READING_TIME_SECONDS - timeLeft}
                  max={READING_TIME_SECONDS}
                  variant={timeLeft <= 30 ? 'coral' : 'gold'}
                />
              </div>

              {/* Passage content */}
              <Card className="bg-white flex-1 overflow-y-auto">
                <CardContent className="p-6">
                  <div className="prose prose-ink max-w-none">
                    {paragraphs.map((paragraph, idx) => (
                      <p
                        key={idx}
                        className="text-ink-700 leading-relaxed mb-4 last:mb-0"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="mt-4">
                <Button variant="gold" size="lg" onClick={handleDoneReading} className="w-full">
                  I&apos;m Ready for Questions
                </Button>
              </div>
            </div>
          </div>
        );

      case 'questions':
      case 'revealing':
        if (!currentPassage || !currentQuestion) return null;
        const passageParagraphs = currentPassage.content.split('\n\n');
        const isRevealed = phase === 'revealing';
        return (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-6">
              {/* Passage reference (sidebar on desktop) */}
              <div className="lg:w-2/5 order-2 lg:order-1">
                <Card className="bg-white h-full overflow-y-auto max-h-[400px] lg:max-h-[600px]">
                  <CardContent className="p-4">
                    <p className="text-xs text-ink-400 uppercase tracking-wider mb-3">
                      Passage Reference
                    </p>
                    <div className="text-sm leading-relaxed space-y-3">
                      {passageParagraphs.map((paragraph, idx) => (
                        <motion.p
                          key={idx}
                          animate={{
                            backgroundColor:
                              highlightedParagraph === idx
                                ? 'rgb(var(--sage-100) / 1)'
                                : 'transparent',
                          }}
                          className={`text-ink-600 p-2 rounded-lg transition-colors ${
                            highlightedParagraph === idx
                              ? 'ring-2 ring-sage-300'
                              : ''
                          }`}
                        >
                          {paragraph}
                        </motion.p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Question area */}
              <div className="lg:w-3/5 order-1 lg:order-2 flex flex-col">
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-ink-500 mb-2">
                    <span>
                      Question {currentQuestionIndex + 1} of{' '}
                      {currentPassage.questions.length}
                    </span>
                    <span>{score} points</span>
                  </div>
                  <Progress
                    value={currentQuestionIndex + 1}
                    max={currentPassage.questions.length}
                    variant="gold"
                  />
                </div>

                {/* Question */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                  >
                    <Card className="bg-white mb-4">
                      <CardContent className="p-5">
                        <h3 className="font-display text-lg font-semibold text-ink-800 leading-relaxed">
                          {currentQuestion.question}
                        </h3>
                      </CardContent>
                    </Card>
                  </motion.div>
                </AnimatePresence>

                {/* Options */}
                <div className="space-y-3 mb-4">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = isRevealed && currentQuestion.correctIndex === index;
                    const isWrong = isRevealed && isSelected && !isCorrect;

                    return (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          if (!isRevealed) handleAnswer(index);
                        }}
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
                          <span
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                              isCorrect
                                ? 'bg-sage-500 text-white'
                                : isWrong
                                ? 'bg-coral-500 text-white'
                                : isSelected
                                ? 'bg-gold-500 text-white'
                                : 'bg-ink-200 text-ink-600'
                            }`}
                          >
                            {isCorrect ? (
                              <Check className="w-5 h-5" />
                            ) : isWrong ? (
                              <X className="w-5 h-5" />
                            ) : (
                              String.fromCharCode(65 + index)
                            )}
                          </span>
                          <span
                            className={`flex-1 font-medium ${
                              isCorrect
                                ? 'text-sage-800'
                                : isWrong
                                ? 'text-coral-800'
                                : 'text-ink-800'
                            }`}
                          >
                            {option}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {isRevealed && currentQuestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-sage-50 border border-sage-200 rounded-xl"
                  >
                    <div className="flex items-center gap-2 text-sage-700 font-medium mb-2">
                      <HelpCircle className="w-5 h-5" />
                      <span>Explanation</span>
                    </div>
                    <p className="text-ink-700">{currentQuestion.explanation}</p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        );

      case 'results':
        if (!currentPassage) return null;
        const correctCount = answers.filter((a) => a.correct).length;
        const totalQ = currentPassage.questions.length;
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              <div className="w-24 h-24 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-ink-800 mb-2">
                Passage Complete!
              </h2>
              <p className="text-lg text-ink-600 mb-2">{currentPassage.title}</p>
              <p className="text-xl text-ink-600 mb-6">
                You scored <span className="font-bold text-gold-600">{score}</span> points
              </p>

              <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-sage-600">{correctCount}</p>
                    <p className="text-sm text-ink-500">Correct</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-coral-600">{totalQ - correctCount}</p>
                    <p className="text-sm text-ink-500">Wrong</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-ink-700">
                      {totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0}%
                    </p>
                    <p className="text-sm text-ink-500">Accuracy</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="gold" size="lg" onClick={handleNextPassage} className="flex-1">
                  Next Passage
                </Button>
                <Button variant="secondary" size="lg" onClick={handleExit} className="flex-1">
                  Exit
                </Button>
              </div>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <GameLayout
      title="Scholar Read"
      subtitle={currentPassage ? currentPassage.title : 'Reading Comprehension'}
      players={displayPlayers}
      currentRound={
        phase === 'questions' || phase === 'revealing'
          ? currentQuestionIndex + 1
          : undefined
      }
      totalRounds={currentPassage?.questions.length}
      showTimer={false}
      showRound={phase === 'questions' || phase === 'revealing'}
      onBack={handleExit}
    >
      {renderContent()}
    </GameLayout>
  );
}
