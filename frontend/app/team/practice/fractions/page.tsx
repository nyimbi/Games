'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight, Pizza, Layers, MoveHorizontal } from 'lucide-react';

import { useFactVault } from '@/lib/hooks/useVault';

interface GameTile {
	slug: string;
	title: string;
	subtitle: string;
	Icon: typeof Pizza;
	minutes: number;
}

const GAMES: GameTile[] = [
	{
		slug: 'pizza-cutter',
		title: 'Pizza Cutter',
		subtitle: 'Slice pies to match a fraction, then compare',
		Icon: Pizza,
		minutes: 4,
	},
	{
		slug: 'fraction-match',
		title: 'Fraction Match',
		subtitle: 'Flip cards to match equivalent fractions',
		Icon: Layers,
		minutes: 3,
	},
	{
		slug: 'fraction-race',
		title: 'Fraction Race',
		subtitle: 'Drop fractions on the number line 0 → 1',
		Icon: MoveHorizontal,
		minutes: 4,
	},
];

export default function FractionsPracticeLanding() {
	const router = useRouter();
	const eq = useFactVault({ factType: 'frac_eq', autoLoad: true });
	const cmp = useFactVault({ factType: 'frac_cmp', autoLoad: true });
	const mastered = eq.stats.mastered + cmp.stats.mastered;
	const learning = eq.stats.learning + cmp.stats.learning;
	const sticky = eq.stats.sticky + cmp.stats.sticky;

	return (
		<div className="min-h-screen bg-gradient-to-b from-coral-50 to-cream-100">
			<div className="max-w-2xl mx-auto px-4 py-6">
				<button
					onClick={() => router.push('/team/practice')}
					className="min-w-14 min-h-14 -ml-2 rounded-2xl hover:bg-white/60 active:bg-white flex items-center justify-center transition-colors"
					aria-label="Back to Practice"
				>
					<ArrowLeft className="w-6 h-6 text-ink-700" />
				</button>

				<div className="mt-2 mb-6">
					<h1 className="font-display font-bold text-3xl text-ink-800">Fractions</h1>
					<p className="text-ink-600 mt-1">Parts, wholes, and comparing.</p>
				</div>

				<div className="mb-6 bg-white/70 backdrop-blur rounded-2xl p-4 border border-coral-200">
					<div className="grid grid-cols-3 gap-3 text-center">
						<div>
							<p className="font-display font-bold text-2xl text-sage-700">{mastered}</p>
							<p className="text-xs uppercase tracking-wide text-ink-500">Mastered</p>
						</div>
						<div>
							<p className="font-display font-bold text-2xl text-gold-700">{learning}</p>
							<p className="text-xs uppercase tracking-wide text-ink-500">Learning</p>
						</div>
						<div>
							<p className="font-display font-bold text-2xl text-coral-700">{sticky}</p>
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
							onClick={() => router.push(`/team/practice/fractions/${g.slug}`)}
							className="w-full text-left bg-white rounded-3xl p-5 border-2 border-coral-200 hover:border-coral-400 hover:shadow-lg active:scale-[0.99] transition-all"
						>
							<div className="flex items-center gap-4">
								<div className="shrink-0 w-14 h-14 rounded-2xl bg-coral-100 text-coral-700 flex items-center justify-center">
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
