'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Drama, Clock, Star, ChevronRight, RotateCcw,
  ArrowLeft, Trophy, Sparkles, MessageCircle, HelpCircle,
} from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { useSounds } from '@/lib/hooks/useSounds';
import { updatePlayerStats, checkAchievements } from '@/lib/games/achievements';
import { useAchievementToast } from '@/components/ui/AchievementToast';

interface RolePlayDebatesProps {
  onExit?: () => void;
}

type Phase = 'intro' | 'character_reveal' | 'writing' | 'reflection' | 'result';

interface CharacterTopic {
  id: string;
  character: string;
  characterDescription: string;
  characterEmoji: string;
  era: string;
  topic: string;
  prompt: string;
  reflectionQuestions: string[];
}

const CHARACTER_TOPICS: CharacterTopic[] = [
  {
    id: 'ct1',
    character: 'Marie Curie',
    characterDescription: 'Pioneering physicist and chemist, first woman to win a Nobel Prize, and the only person to win Nobel Prizes in two different sciences.',
    characterEmoji: '👩‍🔬',
    era: '1900s',
    topic: 'Science education funding',
    prompt: 'As Marie Curie, argue passionately for increased funding in science education. Draw on your experiences of overcoming barriers as a woman in science and your discoveries of radioactivity.',
    reflectionQuestions: [
      'Did you capture Marie Curie\'s determination and passion for science?',
      'Did you reference any real historical challenges she faced?',
      'How well did you argue the importance of science education from her perspective?',
    ],
  },
  {
    id: 'ct2',
    character: 'A Medieval Knight',
    characterDescription: 'A noble knight of the 12th century, bound by chivalric code, sworn to protect the realm and uphold honor above all.',
    characterEmoji: '⚔️',
    era: '1100s',
    topic: 'The importance of honor',
    prompt: 'As a medieval knight, debate the supreme importance of honor in life. Use the language and values of chivalry to argue that honor is worth more than gold or power.',
    reflectionQuestions: [
      'Did your argument sound like it came from a medieval worldview?',
      'Did you reference chivalric values like loyalty, courage, and service?',
      'How convincing was your case that honor matters most?',
    ],
  },
  {
    id: 'ct3',
    character: 'Cleopatra',
    characterDescription: 'Last active ruler of the Ptolemaic Kingdom of Egypt, known for her intelligence, political acumen, and ability to speak nine languages.',
    characterEmoji: '👑',
    era: '50 BC',
    topic: 'The power of diplomacy over warfare',
    prompt: 'As Cleopatra, argue that diplomacy and alliance-building are more powerful tools than military conquest. Draw on your experience navigating relationships with Rome.',
    reflectionQuestions: [
      'Did you capture Cleopatra\'s political sophistication?',
      'Did you use examples of diplomacy from the ancient world?',
      'How well did you balance confidence with strategic thinking?',
    ],
  },
  {
    id: 'ct4',
    character: 'Leonardo da Vinci',
    characterDescription: 'Renaissance polymath -- painter, inventor, scientist, and visionary who embodied the ideal of the "universal genius."',
    characterEmoji: '🎨',
    era: '1500s',
    topic: 'Why art and science should never be separated',
    prompt: 'As Leonardo da Vinci, argue that art and science are two sides of the same coin. Use your experience as both a painter and inventor to make the case for interdisciplinary thinking.',
    reflectionQuestions: [
      'Did you demonstrate da Vinci\'s breadth of knowledge?',
      'Did you give specific examples connecting art and science?',
      'How well did you convey his curiosity and creative spirit?',
    ],
  },
  {
    id: 'ct5',
    character: 'A Future Mars Colonist',
    characterDescription: 'One of the first humans to live permanently on Mars in 2075. Left Earth knowing they would never return.',
    characterEmoji: '🚀',
    era: '2075',
    topic: 'Why humanity must become multi-planetary',
    prompt: 'As one of the first Mars colonists, argue why leaving Earth was the most important decision humanity has ever made. Address the sacrifices and the hope.',
    reflectionQuestions: [
      'Did you convey the emotional weight of leaving Earth forever?',
      'Did you present practical and philosophical reasons for colonization?',
      'How well did you balance optimism with acknowledgment of hardship?',
    ],
  },
  {
    id: 'ct6',
    character: 'Confucius',
    characterDescription: 'Ancient Chinese philosopher whose teachings on ethics, family, and governance shaped East Asian civilization for millennia.',
    characterEmoji: '📖',
    era: '500 BC',
    topic: 'Education as the foundation of a good society',
    prompt: 'As Confucius, argue that education and self-cultivation are the most important foundations for building a just and harmonious society.',
    reflectionQuestions: [
      'Did you incorporate Confucian values like ren (benevolence) and li (ritual)?',
      'Did your argument flow with wisdom and measured tone?',
      'How well did you connect individual education to societal harmony?',
    ],
  },
  {
    id: 'ct7',
    character: 'Amelia Earhart',
    characterDescription: 'Aviation pioneer and the first woman to fly solo across the Atlantic Ocean. Championed women\'s equality in all fields.',
    characterEmoji: '✈️',
    era: '1930s',
    topic: 'Why taking risks is essential for progress',
    prompt: 'As Amelia Earhart, argue that calculated risk-taking is essential for human progress. Use your aviation experiences to inspire others to push beyond their comfort zones.',
    reflectionQuestions: [
      'Did you capture Earhart\'s adventurous and determined spirit?',
      'Did you connect personal risk-taking to broader societal progress?',
      'How well did you address the fears that hold people back?',
    ],
  },
  {
    id: 'ct8',
    character: 'An Ancient Greek Philosopher',
    characterDescription: 'A student of Socrates who believes in the power of questioning everything and seeking truth through dialogue.',
    characterEmoji: '🏛️',
    era: '400 BC',
    topic: 'The examined life is the only life worth living',
    prompt: 'As a follower of Socrates, defend the idea that a life without self-reflection and questioning is not worth living. Use the Socratic method in your argument.',
    reflectionQuestions: [
      'Did you use questioning as a rhetorical tool?',
      'Did you reference Greek philosophical concepts?',
      'How well did you make abstract philosophy feel relevant?',
    ],
  },
  {
    id: 'ct9',
    character: 'Nelson Mandela',
    characterDescription: 'Anti-apartheid revolutionary who spent 27 years in prison before becoming South Africa\'s first democratically elected president.',
    characterEmoji: '✊',
    era: '1990s',
    topic: 'Forgiveness is stronger than revenge',
    prompt: 'As Nelson Mandela, argue that forgiveness and reconciliation are more powerful than revenge. Draw on your experience of imprisonment and your decision to unite rather than divide.',
    reflectionQuestions: [
      'Did you convey Mandela\'s dignity and moral authority?',
      'Did you address why forgiveness requires more strength than revenge?',
      'How well did you balance personal experience with universal principles?',
    ],
  },
  {
    id: 'ct10',
    character: 'A Deep-Sea Explorer',
    characterDescription: 'A marine biologist who has spent 20 years exploring the ocean floor and discovering species unknown to science.',
    characterEmoji: '🐋',
    era: 'Present',
    topic: 'The ocean is more important to explore than space',
    prompt: 'As a deep-sea explorer, argue that we should prioritize ocean exploration over space exploration. We know more about Mars than our own ocean floor.',
    reflectionQuestions: [
      'Did you present compelling facts about ocean exploration?',
      'Did you address the counterargument about space exploration?',
      'How well did you convey passion for the underwater world?',
    ],
  },
];

const WRITING_TIME = 180;

export function RolePlayDebates({ onExit }: RolePlayDebatesProps) {
  const { play } = useSounds();
  const { showAchievements } = useAchievementToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [phase, setPhase] = useState<Phase>('intro');
  const [topics, setTopics] = useState<CharacterTopic[]>([]);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(WRITING_TIME);
  const [essay, setEssay] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [selfRating, setSelfRating] = useState(0);
  const [reflectionAnswers, setReflectionAnswers] = useState<string[]>([]);
  const [allResults, setAllResults] = useState<{ topic: CharacterTopic; essay: string; wordCount: number; rating: number }[]>([]);

  const TOTAL_ROUNDS = 3;

  useEffect(() => {
    if (phase === 'writing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === 'writing' && timeLeft === 0) {
      play('tick');
      setPhase('reflection');
    }
  }, [phase, timeLeft, play]);

  useEffect(() => {
    if (phase === 'writing' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [phase]);

  const shuffleAndPick = useCallback(() => {
    const shuffled = [...CHARACTER_TOPICS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, TOTAL_ROUNDS);
  }, []);

  const startGame = useCallback(() => {
    const picked = shuffleAndPick();
    setTopics(picked);
    setRound(0);
    setAllResults([]);
    setPhase('character_reveal');
    play('powerup');
  }, [play, shuffleAndPick]);

  const startWriting = useCallback(() => {
    setTimeLeft(WRITING_TIME);
    setEssay('');
    setWordCount(0);
    setSelfRating(0);
    setReflectionAnswers(topics[round]?.reflectionQuestions.map(() => '') || []);
    setPhase('writing');
    play('flip');
  }, [play, topics, round]);

  const handleEssayChange = useCallback((text: string) => {
    setEssay(text);
    setWordCount(text.trim().split(/\s+/).filter(w => w.length > 0).length);
  }, []);

  const submitWriting = useCallback(() => {
    play('tick');
    setPhase('reflection');
  }, [play]);

  const submitReflection = useCallback(() => {
    const result = { topic: topics[round], essay, wordCount, rating: selfRating };
    setAllResults(prev => [...prev, result]);
    play('correct');

    if (round + 1 >= TOTAL_ROUNDS) {
      updatePlayerStats(stats => ({ ...stats, gamesPlayed: stats.gamesPlayed + 1 }));
      const newAchievements = checkAchievements();
      if (newAchievements.length > 0) showAchievements(newAchievements);
      play('complete');
      setPhase('result');
    } else {
      setRound(r => r + 1);
      setPhase('character_reveal');
    }
  }, [round, topics, essay, wordCount, selfRating, play, showAchievements]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTopic = topics[round];
  const totalScore = allResults.reduce((sum, r) => sum + r.rating, 0);

  const renderIntro = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Drama className="w-10 h-10 text-purple-600" />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">Role-Play Debates</h2>
        <p className="text-ink-600 mb-6">
          Step into the shoes of a historical or fictional character and debate from their perspective. Think, write, and reflect!
        </p>
        <div className="bg-cream-100 rounded-xl p-4 mb-6 text-left space-y-2 text-sm text-ink-600">
          <p className="flex items-center gap-2"><Drama className="w-4 h-4 text-purple-500" /> {TOTAL_ROUNDS} characters to embody</p>
          <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-purple-500" /> 3 minutes per writing round</p>
          <p className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-purple-500" /> Guided reflection after each round</p>
          <p className="flex items-center gap-2"><Star className="w-4 h-4 text-purple-500" /> Rate your own performance</p>
        </div>
        <Button variant="gold" size="lg" onClick={startGame} className="w-full">
          <Drama className="w-5 h-5 mr-2" />
          Meet Your Character
        </Button>
      </motion.div>
    </div>
  );

  const renderCharacterReveal = () => {
    if (!currentTopic) return null;
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
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="text-7xl mb-4"
            >
              {currentTopic.characterEmoji}
            </motion.div>
            <h2 className="font-display text-2xl font-bold text-ink-800 mb-1">{currentTopic.character}</h2>
            <Badge variant="outline" className="mb-3">{currentTopic.era}</Badge>
            <p className="text-ink-600 text-sm mb-4">{currentTopic.characterDescription}</p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-gold-500" />
                <span className="text-sm font-semibold text-ink-700">Your Mission</span>
              </div>
              <Badge variant="outline" className="mb-2">{currentTopic.topic}</Badge>
              <p className="text-ink-800 leading-relaxed">{currentTopic.prompt}</p>
            </CardContent>
          </Card>

          <Button variant="gold" size="lg" onClick={startWriting} className="w-full">
            <Sparkles className="w-5 h-5 mr-2" />
            Begin Writing (3 minutes)
          </Button>
        </motion.div>
      </div>
    );
  };

  const renderWriting = () => {
    if (!currentTopic) return null;
    return (
      <div className="flex-1 flex flex-col p-4 md:p-6">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentTopic.characterEmoji}</span>
              <div>
                <p className="text-sm font-semibold text-ink-700">{currentTopic.character}</p>
                <p className="text-xs text-ink-400">{currentTopic.topic}</p>
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

          <div className="flex-1 flex flex-col">
            <textarea
              ref={textareaRef}
              value={essay}
              onChange={e => handleEssayChange(e.target.value)}
              placeholder={`Speaking as ${currentTopic.character}...`}
              className="flex-1 resize-none text-lg leading-relaxed min-h-[200px] p-4 rounded-xl border-2 border-ink-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="gold" size="lg" onClick={submitWriting} disabled={wordCount < 20}>
              Submit Argument
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderReflection = () => {
    if (!currentTopic) return null;
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <div className="text-center mb-6">
            <HelpCircle className="w-10 h-10 text-purple-500 mx-auto mb-2" />
            <h2 className="font-display text-xl font-bold text-ink-800 mb-2">Reflect on Your Performance</h2>
            <p className="text-ink-600 text-sm">Consider these questions about your writing as {currentTopic.character}</p>
          </div>

          <div className="space-y-3 mb-6">
            {currentTopic.reflectionQuestions.map((question, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-ink-800 mb-2">{question}</p>
                  <textarea
                    value={reflectionAnswers[idx] || ''}
                    onChange={e => {
                      setReflectionAnswers(prev => {
                        const updated = [...prev];
                        updated[idx] = e.target.value;
                        return updated;
                      });
                    }}
                    placeholder="Your reflection..."
                    className="w-full resize-none text-sm p-2 rounded-lg border border-ink-200 focus:border-purple-400 outline-none min-h-[60px]"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-ink-800 mb-2">Overall Rating</h3>
              <p className="text-xs text-ink-500 mb-3">How well did you embody {currentTopic.character}?</p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={value}
                    onClick={() => setSelfRating(value)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        value <= selfRating ? 'text-gold-500 fill-gold-500' : 'text-ink-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            variant="gold"
            size="lg"
            onClick={submitReflection}
            disabled={selfRating === 0}
            className="w-full"
          >
            {round + 1 >= TOTAL_ROUNDS ? 'See Final Results' : 'Next Character'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  };

  const renderResult = () => {
    const maxScore = TOTAL_ROUNDS * 5;
    const percentage = Math.round((totalScore / maxScore) * 100);

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full text-center"
        >
          <div className="w-24 h-24 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="font-display text-3xl font-bold text-ink-800 mb-1">Performance Complete!</h2>
          <p className="text-ink-600 mb-6">You inhabited {TOTAL_ROUNDS} different characters</p>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-3xl font-bold text-gold-600">{totalScore}/{maxScore}</p>
                  <p className="text-xs text-ink-400">Self-Rating</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-sage-600">{percentage}%</p>
                  <p className="text-xs text-ink-400">Score</p>
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
                      <span className="text-lg">{result.topic.characterEmoji}</span>
                      <div className="text-left">
                        <p className="text-ink-700 font-medium">{result.topic.character}</p>
                        <p className="text-xs text-ink-400">{result.wordCount} words</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(v => (
                        <Star
                          key={v}
                          className={`w-4 h-4 ${v <= result.rating ? 'text-gold-500 fill-gold-500' : 'text-ink-200'}`}
                        />
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
      case 'character_reveal': return renderCharacterReveal();
      case 'writing': return renderWriting();
      case 'reflection': return renderReflection();
      case 'result': return renderResult();
      default: return null;
    }
  };

  return (
    <GameLayout
      title="Role-Play Debates"
      subtitle={currentTopic ? `${currentTopic.characterEmoji} ${currentTopic.character}` : 'Character Perspective Debates'}
      players={[{ id: 'player', display_name: 'You', avatar_color: '#9333EA', score: totalScore, is_ready: true, is_connected: true }]}
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
