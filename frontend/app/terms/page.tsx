'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

const sections = [
  {
    title: 'Acceptance of Terms',
    content:
      'By accessing and using WSC Scholar Games, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform. These terms apply to all users, including students, coaches, and visitors.',
  },
  {
    title: 'Use of Service',
    content:
      'WSC Scholar Games is provided as an educational tool for World Scholars Cup preparation. The platform is intended for practicing trivia, writing, debate, and challenge activities. You may use the service for personal educational purposes and team-based practice sessions. Any use of the platform for purposes other than education is not permitted.',
  },
  {
    title: 'User Conduct',
    content:
      'You agree to use appropriate display names and conduct yourself respectfully when interacting with other users. You will not attempt to disrupt the service, exploit bugs, or interfere with other users\' experiences. Coaches are responsible for overseeing the conduct of scholars on their teams. We reserve the right to remove users who violate these guidelines.',
  },
  {
    title: 'Intellectual Property',
    content:
      'All content, design, and functionality of WSC Scholar Games is the property of its creators. Game questions, scoring systems, and platform features are provided for educational use only. You may not reproduce, distribute, or create derivative works from the platform content without permission.',
  },
  {
    title: 'Disclaimers',
    content:
      'WSC Scholar Games is provided "as is" without warranties of any kind. We do not guarantee that scores, rankings, or analytics reflect actual World Scholars Cup performance. The platform is a practice tool and should be used alongside other preparation methods. We are not affiliated with or endorsed by the World Scholar\'s Cup organization.',
  },
  {
    title: 'Limitation of Liability',
    content:
      'WSC Scholar Games and its creators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. This includes but is not limited to loss of data, interruption of service, or inaccuracies in game content. Our total liability shall not exceed the amount you have paid to use the service.',
  },
  {
    title: 'Changes to Terms',
    content:
      'We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated revision date. Continued use of the platform after changes are posted constitutes acceptance of the modified terms. We encourage you to review these terms periodically.',
  },
];

export default function TermsPage() {
  const router = useRouter();

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
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gold-100 rounded-xl">
              <FileText className="w-7 h-7 text-gold-700" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-800">
                Terms of Service
              </h1>
              <p className="text-ink-500 mt-1">Last updated: February 2026</p>
            </div>
          </div>

          <p className="text-ink-600 text-lg leading-relaxed mb-8">
            Please read these terms carefully before using WSC Scholar Games.
            By using the platform, you agree to these terms and conditions.
          </p>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h2 className="font-display text-xl font-semibold text-ink-800 mb-3">
                      {section.title}
                    </h2>
                    <p className="text-ink-600 leading-relaxed">
                      {section.content}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
