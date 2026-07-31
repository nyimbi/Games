'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
	Calculator,
	PieChart,
	MessageSquare,
	BookOpen,
	Sparkles,
	Flame,
	ArrowRight,
	ChevronRight,
} from 'lucide-react';

import { useVaultStats } from '@/lib/hooks/useVault';
import { Card, CardContent } from '@/components/ui';

interface Category {
	slug: string;
	title: string;
	subtitle: string;
	Icon: typeof Calculator;
	tint: string;
	tintBar: string;
	gameCount: number;
	comingSoon?: boolean;
}

const CATEGORIES: Category[] = [
	{
		slug: 'math',
		title: 'Times Tables',
		subtitle: 'Multiplication & division',
		Icon: Calculator,
		tint: 'from-gold-100 to-gold-50 border-gold-300',
		tintBar: 'bg-gold-500',
		gameCount: 3,
	},
	{
		slug: 'fractions',
		title: 'Fractions',
		subtitle: 'Parts, wholes, and comparing',
		Icon: PieChart,
		tint: 'from-coral-100 to-coral-50 border-coral-300',
		tintBar: 'bg-coral-500',
		gameCount: 3,
	},
	{
		slug: 'word-problems',
		title: 'Word Problems',
		subtitle: 'Turn stories into math',
		Icon: MessageSquare,
		tint: 'from-sage-100 to-sage-50 border-sage-300',
		tintBar: 'bg-sage-500',
		gameCount: 3,
		comingSoon: true,
	},
	{
		slug: 'vocabulary',
		title: 'Vocabulary',
		subtitle: 'Grow your word power',
		Icon: BookOpen,
		tint: 'from-ink-100 to-ink-50 border-ink-300',
		tintBar: 'bg-ink-700',
		gameCount: 8,
		comingSoon: true,
	},
];

const containerVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
	hidden: { opacity: 0, y: 16 },
	visible: { opacity: 1, y: 0 },
};

export default function PracticeLandingPage() {
	const router = useRouter();
	const { stats, loading } = useVaultStats();

	const totalDue =
		(stats?.facts_sticky ?? 0) +
		(stats?.facts_learning ?? 0) +
		(stats?.words_sticky ?? 0);

	return (
		<div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-200">
			<div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-6"
				>
					<h1 className="font-display font-bold text-3xl md:text-4xl text-ink-800 leading-tight">
						Practice
					</h1>
					<p className="text-ink-600 mt-1">
						Short daily drills that grow with you.
					</p>
				</motion.div>

				{/* Mastery snapshot */}
				{!loading && stats && (stats.facts_total > 0 || stats.words_seen > 0) && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="grid grid-cols-3 gap-3 mb-6"
					>
						<StatCard
							label="Mastered"
							value={stats.facts_mastered + stats.words_mastered}
							color="text-sage-700"
							bg="bg-sage-50 border-sage-200"
						/>
						<StatCard
							label="Learning"
							value={stats.facts_learning + (stats.words_seen - stats.words_mastered - stats.words_sticky)}
							color="text-gold-700"
							bg="bg-gold-50 border-gold-200"
						/>
						<StatCard
							label="Sticky"
							value={stats.facts_sticky + stats.words_sticky}
							color="text-coral-700"
							bg="bg-coral-50 border-coral-200"
						/>
					</motion.div>
				)}

				{/* Personalized warmup — always visible, primary CTA */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="mb-6"
				>
					<button
						onClick={() => router.push('/team/practice/warmup')}
						className="w-full text-left bg-gradient-to-br from-gold-400 to-gold-500 text-white rounded-3xl p-5 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
					>
						<div className="flex items-center gap-4">
							<div className="shrink-0 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
								<Flame className="w-7 h-7" />
							</div>
							<div className="flex-1">
								<h2 className="font-display font-bold text-xl leading-tight flex items-center gap-2">
									Warmup
									<Sparkles className="w-4 h-4 opacity-90" />
								</h2>
								<p className="text-white/90 text-sm leading-snug">
									{totalDue > 0
										? `${totalDue} item${totalDue === 1 ? '' : 's'} due — 5-question personal drill`
										: 'Start with a personalized 5-question drill'}
								</p>
							</div>
							<ArrowRight className="w-6 h-6 opacity-90" />
						</div>
					</button>
				</motion.div>

				{/* Category tiles */}
				<motion.div
					variants={containerVariants}
					initial="hidden"
					animate="visible"
					className="grid grid-cols-1 sm:grid-cols-2 gap-3"
				>
					{CATEGORIES.map((c) => (
						<motion.button
							key={c.slug}
							variants={itemVariants}
							onClick={() =>
								c.comingSoon
									? null
									: router.push(`/team/practice/${c.slug}`)
							}
							disabled={c.comingSoon}
							className={`text-left bg-gradient-to-br ${c.tint} border-2 rounded-3xl p-5 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100`}
						>
							<div className="flex items-start gap-4">
								<div className={`shrink-0 w-12 h-12 rounded-2xl ${c.tintBar} text-white flex items-center justify-center`}>
									<c.Icon className="w-6 h-6" />
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="font-display font-bold text-lg text-ink-800 leading-tight">
										{c.title}
									</h3>
									<p className="text-sm text-ink-600 leading-snug mt-0.5">
										{c.subtitle}
									</p>
									<div className="flex items-center gap-2 mt-2">
										<span className="text-xs font-semibold text-ink-500 bg-white/60 px-2 py-0.5 rounded-full">
											{c.gameCount} game{c.gameCount === 1 ? '' : 's'}
										</span>
										{c.comingSoon && (
											<span className="text-xs font-semibold text-ink-500 bg-white/60 px-2 py-0.5 rounded-full">
												Coming soon
											</span>
										)}
									</div>
								</div>
								{!c.comingSoon && (
									<ChevronRight className="w-5 h-5 text-ink-400 shrink-0 mt-1" />
								)}
							</div>
						</motion.button>
					))}
				</motion.div>

				<p className="text-center text-xs text-ink-400 mt-8">
					Practice a little each day — spaced repetition works best in short, frequent sessions.
				</p>
			</div>
		</div>
	);
}

function StatCard({
	label,
	value,
	color,
	bg,
}: {
	label: string;
	value: number;
	color: string;
	bg: string;
}) {
	return (
		<div className={`rounded-2xl border p-3 text-center ${bg}`}>
			<p className={`font-display font-bold text-2xl ${color}`}>{value}</p>
			<p className="text-xs font-medium text-ink-500 uppercase tracking-wide">
				{label}
			</p>
		</div>
	);
}
