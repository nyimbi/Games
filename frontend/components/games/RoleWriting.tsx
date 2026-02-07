'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PenTool, Clock, Star, ChevronRight, RotateCcw,
  ArrowLeft, Trophy, User, Sparkles,
} from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { useSounds } from '@/lib/hooks/useSounds';
import { updatePlayerStats, checkAchievements } from '@/lib/games/achievements';
import { useAchievementToast } from '@/components/ui/AchievementToast';

interface RoleWritingProps {
  onExit?: () => void;
}

type Phase = 'intro' | 'role_reveal' | 'writing' | 'self_assess' | 'result';

interface RolePrompt {
  id: string;
  role: string;
  roleDescription: string;
  roleEmoji: string;
  topic: string;
  prompt: string;
}

interface Assessment {
  structure: number;
  creativity: number;
  roleAdherence: number;
}

const ROLE_PROMPTS: RolePrompt[] = [
  { id: 'rp1', role: 'Investigative Reporter', roleDescription: 'You uncover facts and present them clearly. Use who, what, where, when, why.', roleEmoji: '📰', topic: 'A new species discovered in the deep ocean', prompt: 'Write a news article about the discovery of a previously unknown creature in the Mariana Trench. Include quotes from the lead scientist.' },
  { id: 'rp2', role: 'Historian', roleDescription: 'You analyze events in context, connecting past to present with evidence and perspective.', roleEmoji: '📜', topic: 'The invention of the printing press', prompt: 'Write about how the printing press changed the world. Consider its effects on education, religion, and politics.' },
  { id: 'rp3', role: 'Film Critic', roleDescription: 'You evaluate art with a sharp eye, balancing personal opinion with objective analysis.', roleEmoji: '🎬', topic: 'A movie about time travel', prompt: 'Write a review of an imaginary film where a teenager discovers they can travel through time by reading old books.' },
  { id: 'rp4', role: 'Environmental Scientist', roleDescription: 'You use data and research to explain natural phenomena and advocate for the planet.', roleEmoji: '🔬', topic: 'Coral reef decline', prompt: 'Write a report explaining why coral reefs are dying and propose three evidence-based solutions.' },
  { id: 'rp5', role: 'Poet', roleDescription: 'You express deep emotions and observations through imagery, rhythm, and carefully chosen words.', roleEmoji: '✨', topic: 'The feeling of a rainy afternoon', prompt: 'Write a poem (or poetic prose) that captures the mood, sounds, and sensations of rain falling on a quiet afternoon.' },
  { id: 'rp6', role: 'Travel Writer', roleDescription: 'You transport readers to far-off places with vivid descriptions and personal anecdotes.', roleEmoji: '🌍', topic: 'Visiting an ancient city', prompt: 'Write about exploring the ruins of an ancient city. Make the reader feel like they are walking alongside you.' },
  { id: 'rp7', role: 'Sports Commentator', roleDescription: 'You bring excitement and drama to athletic events with energetic, vivid narration.', roleEmoji: '🏟️', topic: 'The final moments of a championship', prompt: 'Narrate the last two minutes of an imaginary championship match. Build tension and describe the crowd.' },
  { id: 'rp8', role: 'Philosophy Professor', roleDescription: 'You ask deep questions and explore ideas from multiple angles with careful reasoning.', roleEmoji: '🤔', topic: 'What makes something "real"?', prompt: 'Write a short lecture exploring whether virtual experiences can be as "real" as physical ones.' },
  { id: 'rp9', role: 'Food Critic', roleDescription: 'You describe flavors, textures, and dining experiences with precision and flair.', roleEmoji: '🍽️', topic: 'A meal at a floating restaurant', prompt: 'Review a fictional restaurant that floats on a lake. Describe the setting, the food, and the overall experience.' },
  { id: 'rp10', role: 'Detective', roleDescription: 'You observe details others miss and piece together clues with logical reasoning.', roleEmoji: '🔍', topic: 'The case of the missing library book', prompt: 'Write your case notes as you investigate a mysteriously vanished rare book from the city library.' },
  { id: 'rp11', role: 'Science Fiction Author', roleDescription: 'You imagine future technologies and their impact on humanity with creative vision.', roleEmoji: '🚀', topic: 'Life on a space colony in 2200', prompt: 'Write a diary entry from a teenager living on a Mars colony. What is daily life like?' },
  { id: 'rp12', role: 'Political Speechwriter', roleDescription: 'You craft persuasive, inspiring messages that move people to action.', roleEmoji: '🎤', topic: 'Education for all', prompt: 'Write a speech for a world leader arguing that every child on Earth deserves access to quality education.' },
];

const WRITING_TIME = 180; // 3 minutes
const TOTAL_ROUNDS = 3;

const RUBRIC_CRITERIA = [
  { key: 'structure' as const, label: 'Structure & Organization', description: 'Clear introduction, body, and conclusion. Logical flow of ideas.' },
  { key: 'creativity' as const, label: 'Creativity & Voice', description: 'Original ideas, vivid language, and engaging style.' },
  { key: 'roleAdherence' as const, label: 'Role Adherence', description: 'Writing authentically sounds like the assigned role.' },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function RoleWriting({ onExit }: RoleWritingProps) {
  const { play } = useSounds();
  const { showAchievements } = useAchievementToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [phase, setPhase] = useState<Phase>('intro');
  const [prompts, setPrompts] = useState<RolePrompt[]>([]);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(WRITING_TIME);
  const [essay, setEssay] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [assessment, setAssessment] = useState<Assessment>({ structure: 0, creativity: 0, roleAdherence: 0 });
  const [allResults, setAllResults] = useState<{ prompt: RolePrompt; essay: string; wordCount: number; assessment: Assessment }[]>([]);

  useEffect(() => {
    if (phase === 'writing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === 'writing' && timeLeft === 0) {
      play('tick');
      setPhase('self_assess');
    }
  }, [phase, timeLeft, play]);

  useEffect(() => {
    if (phase === 'writing' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [phase]);

  const startGame = useCallback(() => {
    const shuffled = shuffleArray(ROLE_PROMPTS).slice(0, TOTAL_ROUNDS);
    setPrompts(shuffled);
    setRound(0);
    setAllResults([]);
    setPhase('role_reveal');
    play('powerup');
  }, [play]);

  const startWriting = useCallback(() => {
    setTimeLeft(WRITING_TIME);
    setEssay('');
    setWordCount(0);
    setAssessment({ structure: 0, creativity: 0, roleAdherence: 0 });
    setPhase('writing');
    play('flip');
  }, [play]);

  const handleEssayChange = useCallback((text: string) => {
    setEssay(text);
    setWordCount(text.trim().split(/\s+/).filter(w => w.length > 0).length);
  }, []);

  const submitWriting = useCallback(() => {
    play('tick');
    setPhase('self_assess');
  }, [play]);

  const submitAssessment = useCallback(() => {
    const result = { prompt: prompts[round], essay, wordCount, assessment };
    setAllResults(prev => [...prev, result]);
    play('correct');

    if (round + 1 >= TOTAL_ROUNDS) {
      updatePlayerStats(stats => ({
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
      }));
      const newAchievements = checkAchievements();
      if (newAchievements.length > 0) showAchievements(newAchievements);
      play('complete');
      setPhase('result');
    } else {
      setRound(r => r + 1);
      setPhase('role_reveal');
    }
  }, [round, prompts, essay, wordCount, assessment, play, showAchievements]);

  const setRating = useCallback((key: keyof Assessment, value: number) => {
    setAssessment(prev => ({ ...prev, [key]: value }));
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPrompt = prompts[round];
  const totalScore = allResults.reduce((sum, r) => sum + r.assessment.structure + r.assessment.creativity + r.assessment.roleAdherence, 0);

  const renderIntro = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <PenTool className="w-10 h-10 text-coral-600" />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">Role Writing</h2>
        <p className="text-ink-600 mb-6">
          Step into a role and write from that perspective. Become a reporter, historian, poet, and more!
        </p>
        <div className="bg-cream-100 rounded-xl p-4 mb-6 text-left space-y-2 text-sm text-ink-600">
          <p className="flex items-center gap-2"><User className="w-4 h-4 text-coral-500" /> {TOTAL_ROUNDS} rounds with different roles</p>
          <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-coral-500" /> 3 minutes per writing prompt</p>
          <p className="flex items-center gap-2"><Star className="w-4 h-4 text-coral-500" /> Self-assess your writing after each round</p>
          <p className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-coral-500" /> Rate yourself on structure, creativity, and role fit</p>
        </div>
        <Button variant="gold" size="lg" onClick={startGame} className="w-full">
          <PenTool className="w-5 h-5 mr-2" />
          Start Writing
        </Button>
      </motion.div>
    </div>
  );

  const renderRoleReveal = () => {
    if (!currentPrompt) return null;
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <div className="text-center mb-6">
            <Badge variant="gold" className="mb-3">Round {round + 1} of {TOTAL_ROUNDS}</Badge>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="text-6xl mb-4"
            >
              {currentPrompt.roleEmoji}
            </motion.div>
            <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">Your Role: {currentPrompt.role}</h2>
            <p className="text-ink-600 mb-4">{currentPrompt.roleDescription}</p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-5">
              <Badge variant="outline" className="mb-2">{currentPrompt.topic}</Badge>
              <p className="text-ink-800 font-medium leading-relaxed">{currentPrompt.prompt}</p>
            </CardContent>
          </Card>

          <Button variant="gold" size="lg" onClick={startWriting} className="w-full">
            <PenTool className="w-5 h-5 mr-2" />
            Start Writing (3 minutes)
          </Button>
        </motion.div>
      </div>
    );
  };

  const renderWriting = () => {
    if (!currentPrompt) return null;
    return (
      <div className="flex-1 flex flex-col p-4 md:p-6">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentPrompt.roleEmoji}</span>
              <div>
                <p className="text-sm font-semibold text-ink-700">{currentPrompt.role}</p>
                <p className="text-xs text-ink-400">{currentPrompt.topic}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold text-lg ${
              timeLeft <= 30 ? 'bg-coral-100 text-coral-600 animate-pulse' : 'bg-ink-100 text-ink-700'
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="mb-4">
            <Progress
              value={Math.min((wordCount / 150) * 100, 100)}
              max={100}
              variant={wordCount >= 150 ? 'sage' : wordCount >= 50 ? 'gold' : 'coral'}
            />
            <div className="flex justify-between text-xs text-ink-400 mt-1">
              <span>{wordCount} words</span>
              <span>Target: 150+</span>
            </div>
          </div>

          <Card className="mb-3">
            <CardContent className="p-3">
              <p className="text-sm text-ink-600 italic">{currentPrompt.prompt}</p>
            </CardContent>
          </Card>

          <div className="flex-1 flex flex-col">
            <textarea
              ref={textareaRef}
              value={essay}
              onChange={e => handleEssayChange(e.target.value)}
              placeholder={`Write as a ${currentPrompt.role.toLowerCase()}...`}
              className="flex-1 resize-none text-lg leading-relaxed min-h-[200px] p-4 rounded-xl border-2 border-ink-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none transition-all"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              variant="gold"
              size="lg"
              onClick={submitWriting}
              disabled={wordCount < 20}
            >
              Submit Writing
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderSelfAssess = () => {
    if (!currentPrompt) return null;
    const allRated = assessment.structure > 0 && assessment.creativity > 0 && assessment.roleAdherence > 0;

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <div className="text-center mb-6">
            <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">Self-Assessment</h2>
            <p className="text-ink-600">Rate your writing on each criterion (1-5 stars)</p>
          </div>

          <div className="space-y-4 mb-6">
            {RUBRIC_CRITERIA.map(criterion => (
              <Card key={criterion.key}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-ink-800 mb-1">{criterion.label}</h3>
                  <p className="text-xs text-ink-500 mb-3">{criterion.description}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(value => (
                      <button
                        key={value}
                        onClick={() => setRating(criterion.key, value)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            value <= assessment[criterion.key]
                              ? 'text-gold-500 fill-gold-500'
                              : 'text-ink-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-cream-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-ink-600">
              <strong>Words written:</strong> {wordCount} | <strong>Role:</strong> {currentPrompt.role}
            </p>
          </div>

          <Button
            variant="gold"
            size="lg"
            onClick={submitAssessment}
            disabled={!allRated}
            className="w-full"
          >
            {round + 1 >= TOTAL_ROUNDS ? 'See Final Results' : 'Next Round'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  };

  const renderResult = () => {
    const maxPossible = TOTAL_ROUNDS * 15;
    const percentage = Math.round((totalScore / maxPossible) * 100);

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full text-center"
        >
          <div className="w-24 h-24 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="font-display text-3xl font-bold text-ink-800 mb-1">Writing Complete!</h2>
          <p className="text-ink-600 mb-6">Self-Assessment Score: {totalScore} / {maxPossible}</p>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-3xl font-bold text-gold-600">{totalScore}</p>
                  <p className="text-xs text-ink-400">Total Score</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-sage-600">{percentage}%</p>
                  <p className="text-xs text-ink-400">Rating</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-ink-700">{allResults.reduce((s, r) => s + r.wordCount, 0)}</p>
                  <p className="text-xs text-ink-400">Total Words</p>
                </div>
              </div>
              <div className="border-t border-ink-100 pt-4 space-y-3">
                {allResults.map((result, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{result.prompt.roleEmoji}</span>
                      <span className="text-ink-700 font-medium">{result.prompt.role}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[result.assessment.structure, result.assessment.creativity, result.assessment.roleAdherence].map((v, j) => (
                        <span key={j} className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
                          v >= 4 ? 'bg-sage-100 text-sage-700' : v >= 3 ? 'bg-gold-100 text-gold-700' : 'bg-coral-100 text-coral-700'
                        }`}>
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
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
      case 'role_reveal': return renderRoleReveal();
      case 'writing': return renderWriting();
      case 'self_assess': return renderSelfAssess();
      case 'result': return renderResult();
      default: return null;
    }
  };

  return (
    <GameLayout
      title="Role Writing"
      subtitle={currentPrompt ? currentPrompt.role : 'Perspective Writing Challenge'}
      players={[{ id: 'player', display_name: 'You', avatar_color: '#DC2626', score: totalScore, is_ready: true, is_connected: true }]}
      currentRound={round + 1}
      totalRounds={TOTAL_ROUNDS}
      timeRemaining={phase === 'writing' ? timeLeft : undefined}
      showTimer={phase === 'writing'}
      showRound={phase !== 'intro' && phase !== 'result'}
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
