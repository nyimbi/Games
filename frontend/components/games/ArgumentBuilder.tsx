'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers, Trophy, ChevronRight, ChevronLeft, RotateCcw,
  ArrowLeft, Check, Lightbulb, PenTool, Scale, MessageSquare, Flag,
} from 'lucide-react';
import { Button, Card, CardContent, Badge, Progress } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { useSounds } from '@/lib/hooks/useSounds';
import { updatePlayerStats, checkAchievements } from '@/lib/games/achievements';
import { useAchievementToast } from '@/components/ui/AchievementToast';

interface ArgumentBuilderProps {
  onExit?: () => void;
}

type Phase = 'intro' | 'select_topic' | 'building' | 'review' | 'result';

interface ArgumentTopic {
  id: string;
  claim: string;
  category: string;
  evidenceOptions: string[];
  counterargumentHints: string[];
}

const ARGUMENT_TOPICS: ArgumentTopic[] = [
  {
    id: 'at1',
    claim: 'Schools should teach financial literacy as a core subject',
    category: 'Education',
    evidenceOptions: [
      'Studies show 76% of adults wish they had learned about money management in school.',
      'Countries with financial literacy programs have 30% lower household debt rates.',
      'Teen spending has increased 400% in the last two decades, often on credit.',
    ],
    counterargumentHints: ['Curriculum is already overcrowded', 'Parents should teach financial skills', 'Existing math classes cover enough'],
  },
  {
    id: 'at2',
    claim: 'Every student should learn to code before age 14',
    category: 'Technology',
    evidenceOptions: [
      'Computational thinking improves problem-solving skills across all subjects by 15-25%.',
      'By 2030, an estimated 85% of jobs will require some form of digital literacy.',
      'Countries that introduced early coding education saw improved math and logic scores.',
    ],
    counterargumentHints: ['Not all careers need coding', 'Removes time from other subjects', 'Technology changes too fast to teach specific languages'],
  },
  {
    id: 'at3',
    claim: 'Public libraries are more important now than ever before',
    category: 'Society',
    evidenceOptions: [
      'Libraries provide free internet access to 77 million Americans who lack home broadband.',
      'Library usage has increased 14% in the last decade despite predictions of decline.',
      'Libraries serve as community centers offering health resources, job training, and social services.',
    ],
    counterargumentHints: ['Everything is available online now', 'E-books have replaced physical books', 'Government funding could go elsewhere'],
  },
  {
    id: 'at4',
    claim: 'School start times should be pushed to 9:00 AM or later',
    category: 'Health',
    evidenceOptions: [
      'The American Academy of Pediatrics recommends teens get 8-10 hours of sleep; early start times prevent this.',
      'Schools that delayed start times saw a 70% reduction in car accidents among teen drivers.',
      'A study of 9,000 students found later start times correlated with improved grades and attendance.',
    ],
    counterargumentHints: ['Interferes with parent work schedules', 'After-school activities would be affected', 'Teens would just stay up later'],
  },
  {
    id: 'at5',
    claim: 'Plastic packaging should be banned entirely',
    category: 'Environment',
    evidenceOptions: [
      'Only 9% of all plastic ever produced has been recycled; the rest pollutes land and oceans.',
      'Microplastics have been found in human blood, breast milk, and even the deepest ocean trenches.',
      'Paper and plant-based alternatives have been shown to decompose 100x faster than plastic.',
    ],
    counterargumentHints: ['Plastic extends food shelf life', 'Alternatives may be more expensive', 'Some medical equipment requires plastic'],
  },
  {
    id: 'at6',
    claim: 'Museums should always be free to the public',
    category: 'Culture',
    evidenceOptions: [
      'Free museums in the UK saw visitor numbers increase by 150% after dropping admission fees.',
      'Paid admission creates barriers for low-income families, reducing cultural access equity.',
      'Museums that charge admission still receive 40-60% of their funding from public sources.',
    ],
    counterargumentHints: ['Museums need revenue to maintain collections', 'Free entry can lead to overcrowding', 'Voluntary donations could replace fees'],
  },
  {
    id: 'at7',
    claim: 'Physical education should count toward academic grades',
    category: 'Education',
    evidenceOptions: [
      'Regular exercise improves academic performance by increasing blood flow and oxygen to the brain.',
      'Countries that value PE equally with academics (like Finland) consistently outperform others.',
      'Students who are physically active show 40% better concentration in subsequent classes.',
    ],
    counterargumentHints: ['Physical ability is genetic and varies', 'Grading physical performance is unfair', 'PE already counts for participation'],
  },
  {
    id: 'at8',
    claim: 'News media should be required to label opinion pieces clearly',
    category: 'Media',
    evidenceOptions: [
      'Surveys show 60% of adults struggle to distinguish news reporting from opinion columns.',
      'Countries with clear media labeling laws report higher trust in journalism institutions.',
      'Social media algorithms amplify opinion content disguised as news, increasing polarization.',
    ],
    counterargumentHints: ['Freedom of the press concerns', 'Difficult to enforce globally', 'Readers should develop their own media literacy'],
  },
];

interface ArgumentStep {
  key: string;
  label: string;
  icon: typeof Layers;
  guidance: string;
  placeholder: string;
}

const ARGUMENT_STEPS: ArgumentStep[] = [
  {
    key: 'claim',
    label: 'State Your Claim',
    icon: Flag,
    guidance: 'Write a clear, specific statement of your position. A strong claim is debatable and takes a clear side.',
    placeholder: 'I believe that...',
  },
  {
    key: 'evidence',
    label: 'Provide Evidence',
    icon: Lightbulb,
    guidance: 'Support your claim with facts, statistics, examples, or expert opinions. Choose or write evidence that directly supports your position.',
    placeholder: 'The evidence shows that...',
  },
  {
    key: 'reasoning',
    label: 'Connect with Reasoning',
    icon: PenTool,
    guidance: 'Explain HOW your evidence supports your claim. This is the bridge between fact and argument. Why does this evidence matter?',
    placeholder: 'This evidence is important because...',
  },
  {
    key: 'counterargument',
    label: 'Address the Counterargument',
    icon: Scale,
    guidance: 'Acknowledge the strongest argument against your position and explain why your position is still valid despite it.',
    placeholder: 'Some might argue that... However...',
  },
  {
    key: 'conclusion',
    label: 'Write Your Conclusion',
    icon: MessageSquare,
    guidance: 'Restate your claim in a new way, summarize your strongest point, and end with a compelling final thought.',
    placeholder: 'In conclusion...',
  },
];

export function ArgumentBuilder({ onExit }: ArgumentBuilderProps) {
  const { play } = useSounds();
  const { showAchievements } = useAchievementToast();

  const [phase, setPhase] = useState<Phase>('intro');
  const [selectedTopic, setSelectedTopic] = useState<ArgumentTopic | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [completedTopics, setCompletedTopics] = useState(0);

  const startGame = useCallback(() => {
    setPhase('select_topic');
    setResponses({});
    setSelectedEvidence([]);
    setCurrentStep(0);
  }, []);

  const selectTopic = useCallback((topic: ArgumentTopic) => {
    setSelectedTopic(topic);
    setResponses({});
    setSelectedEvidence([]);
    setCurrentStep(0);
    setPhase('building');
    play('powerup');
  }, [play]);

  const updateResponse = useCallback((key: string, value: string) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleEvidence = useCallback((evidence: string) => {
    setSelectedEvidence(prev =>
      prev.includes(evidence) ? prev.filter(e => e !== evidence) : [...prev, evidence]
    );
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < ARGUMENT_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
      play('flip');
    } else {
      play('complete');
      setPhase('review');
    }
  }, [currentStep, play]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  }, [currentStep]);

  const submitArgument = useCallback(() => {
    setCompletedTopics(c => c + 1);
    updatePlayerStats(stats => ({ ...stats, gamesPlayed: stats.gamesPlayed + 1 }));
    const newAchievements = checkAchievements();
    if (newAchievements.length > 0) showAchievements(newAchievements);
    play('complete');
    setPhase('result');
  }, [play, showAchievements]);

  const calculateScore = useCallback(() => {
    let score = 0;
    const filledSteps = ARGUMENT_STEPS.filter(step => (responses[step.key] || '').trim().length > 10);
    score += filledSteps.length * 20;
    score += Math.min(selectedEvidence.length * 10, 30);
    const totalWords = Object.values(responses).join(' ').trim().split(/\s+/).filter(w => w.length > 0).length;
    score += Math.min(Math.floor(totalWords / 10), 30);
    return Math.min(score, 150);
  }, [responses, selectedEvidence]);

  const step = ARGUMENT_STEPS[currentStep];
  const currentResponse = responses[step?.key] || '';

  const isStepComplete = (stepIndex: number) => {
    const key = ARGUMENT_STEPS[stepIndex].key;
    if (key === 'evidence') {
      return (responses[key] || '').trim().length > 10 || selectedEvidence.length > 0;
    }
    return (responses[key] || '').trim().length > 10;
  };

  const renderIntro = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Layers className="w-10 h-10 text-sky-600" />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">Argument Builder</h2>
        <p className="text-ink-600 mb-6">
          Construct a complete argument step by step. Learn the building blocks of persuasive writing through guided practice.
        </p>
        <div className="bg-cream-100 rounded-xl p-4 mb-6 text-left space-y-2 text-sm text-ink-600">
          {ARGUMENT_STEPS.map((s, i) => (
            <p key={i} className="flex items-center gap-2">
              <s.icon className="w-4 h-4 text-sky-500" />
              Step {i + 1}: {s.label}
            </p>
          ))}
        </div>
        <Button variant="gold" size="lg" onClick={startGame} className="w-full">
          <Layers className="w-5 h-5 mr-2" />
          Choose a Topic
        </Button>
      </motion.div>
    </div>
  );

  const renderSelectTopic = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <h2 className="font-display text-xl font-bold text-ink-800 mb-4 text-center">Pick a Claim to Argue</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto pr-2">
          {ARGUMENT_TOPICS.map(topic => (
            <motion.button
              key={topic.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectTopic(topic)}
              className="p-4 rounded-xl border-2 border-ink-200 bg-white hover:border-sky-300 text-left transition-all"
            >
              <Badge variant="outline" className="mb-2">{topic.category}</Badge>
              <p className="font-medium text-ink-800 text-sm leading-relaxed">{topic.claim}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderBuilding = () => {
    if (!step || !selectedTopic) return null;
    const StepIcon = step.icon;
    const isEvidence = step.key === 'evidence';

    return (
      <div className="flex-1 flex flex-col p-4 md:p-6">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
          {/* Stepper */}
          <div className="flex items-center gap-1 mb-6">
            {ARGUMENT_STEPS.map((s, i) => {
              const Icon = s.icon;
              const completed = isStepComplete(i);
              const active = i === currentStep;
              return (
                <div key={i} className="flex items-center flex-1">
                  <button
                    onClick={() => setCurrentStep(i)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      active
                        ? 'bg-sky-500 text-white ring-2 ring-sky-200'
                        : completed
                        ? 'bg-sage-500 text-white'
                        : 'bg-ink-100 text-ink-400'
                    }`}
                  >
                    {completed && !active ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </button>
                  {i < ARGUMENT_STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-1 rounded ${completed ? 'bg-sage-300' : 'bg-ink-100'}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mb-4">
            <Progress value={currentStep + 1} max={ARGUMENT_STEPS.length} variant="gold" />
          </div>

          {/* Topic reference */}
          <div className="bg-cream-100 rounded-lg p-3 mb-4 text-sm text-ink-600">
            <strong>Topic:</strong> {selectedTopic.claim}
          </div>

          {/* Step content */}
          <Card className="mb-4 flex-1 flex flex-col">
            <CardContent className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <StepIcon className="w-5 h-5 text-sky-500" />
                <h3 className="font-display text-lg font-bold text-ink-800">
                  Step {currentStep + 1}: {step.label}
                </h3>
              </div>
              <p className="text-sm text-ink-500 mb-4">{step.guidance}</p>

              {isEvidence && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-ink-500 mb-2">Choose from prepared evidence (or write your own below):</p>
                  <div className="space-y-2">
                    {selectedTopic.evidenceOptions.map((ev, i) => (
                      <button
                        key={i}
                        onClick={() => toggleEvidence(ev)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm ${
                          selectedEvidence.includes(ev)
                            ? 'border-sage-500 bg-sage-50 text-sage-800'
                            : 'border-ink-200 bg-white hover:border-sky-300 text-ink-700'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            selectedEvidence.includes(ev) ? 'bg-sage-500 text-white' : 'bg-ink-100 text-ink-400'
                          }`}>
                            {selectedEvidence.includes(ev) ? <Check className="w-3 h-3" /> : <span className="text-xs">{i + 1}</span>}
                          </span>
                          {ev}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-ink-400 mt-2">You can also add your own evidence below:</p>
                </div>
              )}

              {step.key === 'counterargument' && (
                <div className="mb-4 bg-coral-50 border border-coral-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-coral-600 mb-1">Common counterarguments to consider:</p>
                  <ul className="text-sm text-coral-700 space-y-1">
                    {selectedTopic.counterargumentHints.map((hint, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-coral-400">--</span> {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <textarea
                value={currentResponse}
                onChange={e => updateResponse(step.key, e.target.value)}
                placeholder={step.placeholder}
                className="flex-1 resize-none text-base leading-relaxed min-h-[100px] p-4 rounded-xl border-2 border-ink-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
              />
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Previous
            </Button>
            <Button
              variant="gold"
              size="lg"
              onClick={nextStep}
              className="flex-1"
            >
              {currentStep === ARGUMENT_STEPS.length - 1 ? 'Review' : 'Next Step'}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderReview = () => {
    if (!selectedTopic) return null;
    const score = calculateScore();

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          <div className="text-center mb-6">
            <h2 className="font-display text-xl font-bold text-ink-800 mb-2">Review Your Argument</h2>
            <p className="text-ink-600 text-sm">Look over your complete argument before submitting</p>
          </div>

          <div className="space-y-3 mb-6 max-h-[55vh] overflow-y-auto pr-2">
            {ARGUMENT_STEPS.map((s, i) => {
              const Icon = s.icon;
              const content = responses[s.key] || '';
              const hasContent = content.trim().length > 10;

              return (
                <Card key={i} className={hasContent ? 'border-sage-200' : 'border-coral-200'}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${hasContent ? 'text-sage-500' : 'text-coral-400'}`} />
                      <span className="text-sm font-semibold text-ink-700">{s.label}</span>
                      {hasContent ? (
                        <Badge variant="sage" size="sm">Complete</Badge>
                      ) : (
                        <Badge variant="coral" size="sm">Missing</Badge>
                      )}
                    </div>
                    {hasContent ? (
                      <p className="text-sm text-ink-700 leading-relaxed">{content}</p>
                    ) : (
                      <p className="text-sm text-ink-400 italic">No response written</p>
                    )}
                    {s.key === 'evidence' && selectedEvidence.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {selectedEvidence.map((ev, j) => (
                          <p key={j} className="text-xs text-sage-700 bg-sage-50 rounded p-2">{ev}</p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="bg-cream-100 rounded-xl p-4 mb-4 text-center">
            <p className="text-sm text-ink-500">Estimated Score</p>
            <p className="text-3xl font-bold text-gold-600">{score} / 150</p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => { setCurrentStep(0); setPhase('building'); }}
              className="flex-1"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Edit
            </Button>
            <Button
              variant="gold"
              size="lg"
              onClick={submitArgument}
              className="flex-1"
            >
              Submit Argument
              <Check className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderResult = () => {
    const score = calculateScore();
    const maxScore = 150;
    const percentage = Math.round((score / maxScore) * 100);
    const completedSteps = ARGUMENT_STEPS.filter(s => (responses[s.key] || '').trim().length > 10).length;
    const grade = percentage >= 80 ? 'Outstanding' : percentage >= 60 ? 'Strong' : percentage >= 40 ? 'Developing' : 'Keep Practicing';

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className={`w-24 h-24 ${percentage >= 60 ? 'bg-gold-500' : 'bg-sky-500'} rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl`}>
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="font-display text-3xl font-bold text-ink-800 mb-1">Argument Complete!</h2>
          <p className="text-ink-600 mb-6">{grade} Argument Builder</p>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-3xl font-bold text-gold-600">{score}</p>
                  <p className="text-xs text-ink-400">Score</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-sage-600">{completedSteps}/5</p>
                  <p className="text-xs text-ink-400">Steps Done</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-ink-700">{percentage}%</p>
                  <p className="text-xs text-ink-400">Rating</p>
                </div>
              </div>
              <div className="border-t border-ink-100 pt-4">
                <div className="flex gap-1 justify-center">
                  {ARGUMENT_STEPS.map((s, i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded flex items-center justify-center ${
                        isStepComplete(i) ? 'bg-sage-400 text-white' : 'bg-ink-200 text-ink-400'
                      }`}
                      title={s.label}
                    >
                      <s.icon className="w-5 h-5" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="gold" size="lg" onClick={startGame} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              New Topic
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
      case 'select_topic': return renderSelectTopic();
      case 'building': return renderBuilding();
      case 'review': return renderReview();
      case 'result': return renderResult();
      default: return null;
    }
  };

  return (
    <GameLayout
      title="Argument Builder"
      subtitle={selectedTopic ? selectedTopic.category : 'Step-by-Step Argument Construction'}
      players={[{ id: 'player', display_name: 'You', avatar_color: '#0EA5E9', score: calculateScore(), is_ready: true, is_connected: true }]}
      currentRound={phase === 'building' ? currentStep + 1 : undefined}
      totalRounds={ARGUMENT_STEPS.length}
      showTimer={false}
      showRound={phase === 'building'}
      onBack={onExit}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={phase + currentStep}
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
