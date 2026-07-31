'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight, MessageSquare, Search } from 'lucide-react';

interface GameTile {
	slug: string;
	title: string;
	subtitle: string;
	Icon: typeof MessageSquare;
	minutes: number;
}

const GAMES: GameTile[] = [
	{
		slug: 'story-sorter',
		title: 'Story Sorter',
		subtitle: 'Read the problem, pick the right operation',
		Icon: MessageSquare,
		minutes: 4,
	},
	{
		slug: 'missing-number-mystery',
		title: 'Missing Number Mystery',
		subtitle: 'Fill in the blank in the story — inverse thinking',
		Icon: Search,
		minutes: 4,
	},
];

export default function WordProblemsPracticeLanding() {
	const router = useRouter();

	return (
		<div className="min-h-screen bg-gradient-to-b from-sage-50 to-cream-100">
			<div className="max-w-2xl mx-auto px-4 py-6">
				<button
					onClick={() => router.push('/team/practice')}
					className="min-w-14 min-h-14 -ml-2 rounded-2xl hover:bg-white/60 active:bg-white flex items-center justify-center transition-colors"
					aria-label="Back to Practice"
				>
					<ArrowLeft className="w-6 h-6 text-ink-700" />
				</button>

				<div className="mt-2 mb-6">
					<h1 className="font-display font-bold text-3xl text-ink-800">Word Problems</h1>
					<p className="text-ink-600 mt-1">Turn stories into math.</p>
				</div>

				<div className="space-y-3">
					{GAMES.map((g, i) => (
						<motion.button
							key={g.slug}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: i * 0.06 }}
							onClick={() => router.push(`/team/practice/word-problems/${g.slug}`)}
							className="w-full text-left bg-white rounded-3xl p-5 border-2 border-sage-200 hover:border-sage-400 hover:shadow-lg active:scale-[0.99] transition-all"
						>
							<div className="flex items-center gap-4">
								<div className="shrink-0 w-14 h-14 rounded-2xl bg-sage-100 text-sage-700 flex items-center justify-center">
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
