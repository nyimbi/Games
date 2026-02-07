'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, ChevronUp, HelpCircle, ArrowLeft } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

const faqData: FAQSection[] = [
  {
    title: 'Getting Started',
    items: [
      {
        question: 'How do I join WSC Scholar Games?',
        answer:
          'Click "I\'m a Scholar" or "I\'m a Coach" on the home page. Enter a display name, pick an animal avatar, and you will receive a unique Scholar Code. Save this code -- it is your login credential.',
      },
      {
        question: 'What is a Scholar Code?',
        answer:
          'A Scholar Code is your unique identifier in the format ANIMAL-NAME (e.g., OWL-SIPHO). It replaces traditional email/password login. Use it to recover your account on any device.',
      },
      {
        question: 'How do I find my team code?',
        answer:
          'If you are on a team, go to your Team page. The team join code is displayed at the top of the page. Share this code with teammates so they can join your team.',
      },
      {
        question: 'Can I change my display name or avatar?',
        answer:
          'Currently, display names and avatars are set during account creation. Your Scholar Code is based on your avatar and name, so changing them would change your code.',
      },
      {
        question: 'Do I need an email to sign up?',
        answer:
          'No. WSC Scholar Games does not require any email, phone number, or personal information. You only need a display name to get started.',
      },
    ],
  },
  {
    title: 'Playing Games',
    items: [
      {
        question: 'How do I play solo?',
        answer:
          'Navigate to Play > Solo Practice from the menu. Choose a game category and start playing. Your scores are tracked and visible in your analytics.',
      },
      {
        question: 'What game categories are available?',
        answer:
          "There are four main categories: Scholar's Bowl (trivia), Writing (collaborative writing challenges), Challenge (puzzles and problem-solving), and Debate (argumentation practice).",
      },
      {
        question: 'How does scoring work?',
        answer:
          'Each game has its own scoring system. Generally, you earn points for correct answers, speed bonuses for quick responses, and streak bonuses for consecutive correct answers. Check the analytics page for detailed breakdowns.',
      },
      {
        question: 'Can I play the same game multiple times?',
        answer:
          'Yes. You can replay any game as many times as you like. Your best scores are tracked, and repeated practice helps improve your performance.',
      },
      {
        question: 'How do team games work?',
        answer:
          'In team mode, a coach or team member starts a game session. All team members join on their own devices and play simultaneously with real-time score syncing.',
      },
    ],
  },
  {
    title: 'Teams',
    items: [
      {
        question: 'How do I create a team?',
        answer:
          'Go to the Team page and click "Create Team". Enter a team name, and you will receive a unique join code. Share this code with up to 5 other members.',
      },
      {
        question: 'What is the maximum team size?',
        answer:
          'Teams can have up to 6 members. This matches the standard World Scholars Cup team format with room for alternates.',
      },
      {
        question: 'How do I leave a team?',
        answer:
          'Currently, contact your coach or team creator to be removed from a team. Self-removal is planned for a future update.',
      },
      {
        question: 'Can I be on multiple teams?',
        answer:
          'No. Each scholar can only belong to one team at a time. You must leave your current team before joining another.',
      },
    ],
  },
  {
    title: 'For Coaches',
    items: [
      {
        question: 'How do I schedule a practice session?',
        answer:
          'Go to Coach > Schedule and click "New Session". Select a game, set the date and time, and your team members will see it on their dashboard.',
      },
      {
        question: 'How do I view team analytics?',
        answer:
          'Navigate to Coach > Analytics to see performance data for your entire team. You can view individual scholar progress, category breakdowns, and improvement trends.',
      },
      {
        question: 'Can I manage multiple teams?',
        answer:
          'Currently, each coach account is associated with one team. To manage multiple teams, you would need separate coach accounts.',
      },
      {
        question: 'How do I add scholars to my team?',
        answer:
          'Share your team join code with scholars. They can enter it on their Team page to join. You can find your code on the Coach > Team page.',
      },
    ],
  },
  {
    title: 'Troubleshooting',
    items: [
      {
        question: 'I cannot log in. What should I do?',
        answer:
          'Use the "Sign in here" link on the home page and enter your Scholar Code. If you have lost your code, check if it was saved in your browser. Scholar Codes are displayed prominently after account creation.',
      },
      {
        question: 'A game is not loading properly.',
        answer:
          'Try refreshing the page. If the issue persists, clear your browser cache and try again. Make sure you have a stable internet connection for multiplayer games.',
      },
      {
        question: 'I lost my Scholar Code.',
        answer:
          'If you are still logged in on any device, your Scholar Code is visible on your profile/dashboard. If you are fully logged out and cannot remember your code, you may need to create a new account.',
      },
      {
        question: 'My scores are not showing in analytics.',
        answer:
          'Scores may take a moment to sync. Refresh the analytics page. If scores are still missing, ensure you completed the game fully before exiting.',
      },
    ],
  },
];

export default function HelpPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const filteredSections = faqData
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <main className="min-h-screen bg-cream-100 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-8 text-ink-600 hover:text-ink-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-coral-100 rounded-xl">
              <HelpCircle className="w-7 h-7 text-coral-700" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-800">
                Help & FAQ
              </h1>
              <p className="text-ink-500 mt-1">
                Find answers to common questions
              </p>
            </div>
          </div>

          <div className="relative mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
            <input
              type="text"
              placeholder="Search for a question..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-ink-200 bg-white text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
            />
          </div>

          {filteredSections.length === 0 && (
            <div className="text-center py-12 text-ink-500">
              <p className="text-lg">No results found for &quot;{searchTerm}&quot;</p>
              <p className="mt-2">Try a different search term.</p>
            </div>
          )}

          <div className="space-y-8">
            {filteredSections.map((section) => (
              <div key={section.title}>
                <h2 className="font-display text-xl font-semibold text-ink-800 mb-4">
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.items.map((item) => {
                    const key = `${section.title}-${item.question}`;
                    const isExpanded = expandedItems.has(key);

                    return (
                      <Card
                        key={key}
                        className="bg-white/80 backdrop-blur-sm overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(key)}
                          className="w-full flex items-center justify-between p-5 text-left hover:bg-cream-50 transition-colors"
                          aria-expanded={isExpanded}
                        >
                          <span className="font-medium text-ink-800 pr-4">
                            {item.question}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-ink-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-ink-400 flex-shrink-0" />
                          )}
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                            >
                              <CardContent className="px-5 pb-5 pt-0">
                                <p className="text-ink-600 leading-relaxed">
                                  {item.answer}
                                </p>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
