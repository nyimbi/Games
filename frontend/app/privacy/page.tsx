'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

const sections = [
  {
    title: 'What We Collect',
    content:
      'WSC Scholar Games stores minimal data to provide you with a seamless experience. We collect your chosen display name, avatar selection, and scholar code. Game progress, scores, and team membership are stored to track your learning journey. All user preferences are stored locally in your browser using localStorage.',
  },
  {
    title: 'How We Use Data',
    content:
      'Your data is used solely to provide the WSC Scholar Games experience. This includes displaying your profile to teammates and coaches, tracking game scores and progress, generating analytics to help you improve, and enabling team-based practice sessions. We do not use your data for advertising or marketing purposes.',
  },
  {
    title: "Children's Privacy",
    content:
      'WSC Scholar Games is designed for educational use by students participating in the World Scholars Cup. We do not knowingly collect personal information beyond what is necessary for the platform to function. No email addresses, phone numbers, or real names are required. Students identify themselves using display names and scholar codes only.',
  },
  {
    title: 'Data Storage',
    content:
      'Session data (user ID, display name, scholar code) is stored in your browser\'s localStorage and is never transmitted to third parties. Game data and team information are stored on our servers to enable multiplayer features. You can clear your local data at any time by logging out or clearing your browser storage.',
  },
  {
    title: 'Third Parties',
    content:
      'We do not sell, trade, or share your personal data with third parties. We do not embed third-party tracking scripts, social media widgets, or advertising networks. The platform operates independently to protect user privacy.',
  },
  {
    title: 'Contact',
    content:
      'If you have questions about this privacy policy or how your data is handled, please contact us at team@wscscholargames.com. We are committed to transparency and will respond to inquiries promptly.',
  },
];

export default function PrivacyPage() {
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
            <div className="inline-flex items-center justify-center w-14 h-14 bg-sage-100 rounded-xl">
              <Shield className="w-7 h-7 text-sage-700" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-800">
                Privacy Policy
              </h1>
              <p className="text-ink-500 mt-1">Last updated: February 2026</p>
            </div>
          </div>

          <p className="text-ink-600 text-lg leading-relaxed mb-8">
            WSC Scholar Games is an educational platform built for World
            Scholars Cup preparation. Your privacy matters to us. This policy
            explains what data we collect and how we use it.
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
