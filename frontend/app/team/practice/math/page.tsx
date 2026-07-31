'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight, Trophy, Swords, Grid3x3 } from 'lucide-react';

import { useFactVault } from '@/lib/hooks/useVault';

interface GameTile {
	slug: string;
	title: string;
	subtitle: string;
	Icon: typeof Trophy;
	minutes: number;
}

const GAMES: GameTile[] = [
	{
		slug: 'multiplication-ladder',
		title: 'Multiplication Ladder',
		subtitle: 'Climb the tower — miss twice and it comes back',
		Icon: Trophy,
		minutes: 5,
	},
	{
		slug: 'fact-family-duel',
		title: 'Fact Family Duel',
		subtitle: 'Race the clock to name all 4 related facts',
		Icon: Swords,
		minutes: 3,
	},
	{
		slug: 'beat-the-clock-grid',
		title: 'Beat-the-Clock Grid',
		subtitle: 'Tap patterns on the 12×12 grid before time runs out',
		Icon: Grid3x3,
		minutes: 2,
	},
];

export default function MathPracticeLanding() {
	const router = useRouter();
	const { stats } = useFactVault({ factType: 'mult', autoLoad: true });

	return (
		<div className="min-h-screen bg-gradient-to-b from-gold-50 to-cream-100">
			<div className="max-w-2xl mx-auto px-4 py-6">
				<button
					onClick={() => router.push('/team/practice')}
					className="min-w-14 min-h-14 -ml-2 rounded-2xl hover:bg-white/60 active:bg-white flex items-center justify-center transition-colors"
					aria-label="Back to Practice"
				>
					<ArrowLeft className="w-6 h-6 text-ink-700" />
				</button>

				<div className="mt-2 mb-6">
					<h1 className="font-display font-bold text-3xl text-ink-800">Times Tables</h1>
					<p className="text-ink-600 mt-1">Multiplication and division facts.</p>
				</div>

				{/* Mastery bar */}
				<div className="mb-6 bg-white/70 backdrop-blur rounded-2xl p-4 border border-gold-200">
					<div className="grid grid-cols-3 gap-3 text-center">
						<div>
							<p className="font-display font-bold text-2xl text-sage-700">{stats.mastered}</p>
							<p className="text-xs uppercase tracking-wide text-ink-500">Mastered</p>
						</div>
						<div>
							<p className="font-display font-bold text-2xl text-gold-700">{stats.learning}</p>
							<p className="text-xs uppercase tracking-wide text-ink-500">Learning</p>
						</div>
						<div>
							<p className="font-display font-bold text-2xl text-coral-700">{stats.sticky}</p>
							<p className="text-xs uppercase tracking-wide text-ink-500">Sticky</p>
						</div>
					</div>
				</div>

				<div className="space-y-3">
					{GAMES.map((g, i) => (
						<motion.button
							key={g.slug}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: i * 0.06 }}
							onClick={() => router.push(`/team/practice/math/${g.slug}`)}
							className="w-full text-left bg-white rounded-3xl p-5 border-2 border-gold-200 hover:border-gold-400 hover:shadow-lg active:scale-[0.99] transition-all"
						>
							<div className="flex items-center gap-4">
								<div className="shrink-0 w-14 h-14 rounded-2xl bg-gold-100 text-gold-700 flex items-center justify-center">
									<g.Icon className="w-7 h-7" />
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="font-display font-bold text-lg text-ink-800 leading-tight">
										{g.title}
									</h3>
									<p className="text-sm text-ink-600 leading-snug mt-0.5">{g.subtitle}</p>
									<span className="inline-block text-xs font-semibold text-ink-500 bg-cream-200 px-2 py-0.5 rounded-full mt-2">
										~{g.minutes} min
									</span>
								</div>
								<ChevronRight className="w-5 h-5 text-ink-400 shrink-0" />
							</div>
						</motion.button>
					))}
				</div>
			</div>
		</div>
	);
}
