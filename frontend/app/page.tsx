'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { BookOpen, Users, Trophy, Sparkles, GraduationCap, Gamepad2 } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';

const features = [
  {
    icon: Gamepad2,
    title: '16 Learning Games',
    description: 'Trivia, writing, puzzles, and debates designed for World Scholars Cup prep',
  },
  {
    icon: Users,
    title: 'Team Practice',
    description: 'Play together on separate devices with real-time sync',
  },
  {
    icon: Trophy,
    title: 'Track Progress',
    description: 'Earn badges, climb leaderboards, and see your improvement',
  },
  {
    icon: Sparkles,
    title: 'Solo Practice',
    description: 'Practice on your own anytime, anywhere',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect authenticated users to their dashboard
      if (user.role === 'coach') {
        router.push('/coach');
      } else {
        router.push('/team');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-ink-200 border-t-gold-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream-100 overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-6 py-16">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold-200 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sage-200 rounded-full blur-3xl opacity-40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-coral-100 rounded-full blur-3xl opacity-20" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          {/* Logo / Brand */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-ink-800 rounded-2xl shadow-xl mb-6">
              <GraduationCap className="w-10 h-10 text-gold-400" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-ink-800 mb-6 leading-tight"
          >
            WSC Scholar
            <span className="block text-gold-600">Games</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-ink-600 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Real-time multiplayer learning games for World Scholars Cup preparation.
            Practice together, learn faster.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              variant="gold"
              size="lg"
              onClick={() => router.push('/login?role=coach')}
              className="min-w-[200px] text-lg"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              I'm a Coach
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/login?role=player')}
              className="min-w-[200px] text-lg"
            >
              <Users className="w-5 h-5 mr-2" />
              I'm a Scholar
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative px-6 py-16 bg-gradient-to-b from-cream-100 to-cream-200">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="max-w-6xl mx-auto"
        >
          <motion.h2
            variants={itemVariants}
            className="font-display text-3xl md:text-4xl font-bold text-ink-800 text-center mb-12"
          >
            Everything you need to prepare
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gold-100 rounded-xl mb-4">
                      <feature.icon className="w-7 h-7 text-gold-600" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-ink-800 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-ink-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Game Categories Preview */}
      <section className="px-6 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.h2
            variants={itemVariants}
            className="font-display text-3xl md:text-4xl font-bold text-ink-800 mb-4"
          >
            Four categories of games
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-xl text-ink-600 mb-10"
          >
            From quick trivia to collaborative writing challenges
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { name: "Scholar's Bowl", color: 'bg-coral-100 text-coral-700', emoji: '🎯' },
              { name: 'Writing', color: 'bg-sage-100 text-sage-700', emoji: '✍️' },
              { name: 'Challenge', color: 'bg-gold-100 text-gold-700', emoji: '⚡' },
              { name: 'Debate', color: 'bg-ink-100 text-ink-700', emoji: '🗣️' },
            ].map((category) => (
              <div
                key={category.name}
                className={`${category.color} rounded-xl p-6 font-medium text-center`}
              >
                <span className="text-3xl mb-2 block">{category.emoji}</span>
                <span className="font-display text-lg">{category.name}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 bg-ink-800 text-white">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.h2
            variants={itemVariants}
            className="font-display text-3xl md:text-4xl font-bold mb-6"
          >
            Ready to start practicing?
          </motion.h2>
          <motion.p variants={itemVariants} className="text-xl text-cream-200 mb-8">
            Join your team or create one to begin your Scholar's Cup journey.
          </motion.p>
          <motion.div variants={itemVariants}>
            <Button
              variant="gold"
              size="lg"
              onClick={() => router.push('/login')}
              className="text-lg px-10"
            >
              Get Started
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 bg-ink-900 text-cream-300">
        <div className="max-w-6xl mx-auto text-center text-sm">
          <p>WSC Scholar Games • Built for World Scholars Cup preparation</p>
        </div>
      </footer>
    </main>
  );
}
