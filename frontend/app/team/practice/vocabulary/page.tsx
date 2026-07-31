'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
	ArrowLeft,
	ChevronRight,
	Search,
	GitBranch,
	Sparkles,
	Filter,
} from 'lucide-react';

import { useWordVault } from '@/lib/hooks/useVault';

interface GameTile {
	slug: string;
	title: string;
	subtitle: string;
	Icon: typeof Search;
	minutes: number;
}

const GAMES: GameTile[] = [
	{
		slug: 'cloze-detective',
		title: 'Cloze Detective',
		subtitle: 'Read the clues, pick the missing word',
		Icon: Search,
		minutes: 4,
	},
	{
		slug: 'root-builder',
		title: 'Root Builder',
		subtitle: 'Build word families with prefixes and suffixes',
		Icon: GitBranch,
		minutes: 3,
	},
	{
		slug: 'word-web',
		title: 'Word Web',
		subtitle: 'Sort synonyms, related words, and opposites',
		Icon: Sparkles,
		minutes: 4,
	},
	{
		slug: 'odd-one-out',
		title: 'Odd One Out',
		subtitle: 'Spot the word that doesn’t belong',
		Icon: Filter,
		minutes: 3,
	},
];

export default function VocabularyPracticeLanding() {
	const router = useRouter();
	const { stats } = useWordVault({ autoLoad: true });

	return (
		<div className="min-h-screen bg-gradient-to-b from-ink-100 to-cream-100">
			<div className="max-w-2xl mx-auto px-4 py-6">
				<button
					onClick={() => router.push('/team/practice')}
					className="min-w-14 min-h-14 -ml-2 rounded-2xl hover:bg-white/60 active:bg-white flex items-center justify-center transition-colors"
					aria-label="Back to Practice"
				>
					<ArrowLeft className="w-6 h-6 text-ink-700" />
				</button>

				<div className="mt-2 mb-6">
					<h1 className="font-display font-bold text-3xl text-ink-800">Vocabulary</h1>
					<p className="text-ink-600 mt-1">Grow your word power.</p>
				</div>

				<div className="mb-6 bg-white/70 backdrop-blur rounded-2xl p-4 border border-ink-200">
					<div className="grid grid-cols-3 gap-3 text-center">
						<div>
							<p className="font-display font-bold text-2xl text-sage-700">{stats.mastered}</p>
							<p className="text-xs uppercase tracking-wide text-ink-500">Mastered</p>
						</div>
						<div>
							<p className="font-display font-bold text-2xl text-gold-700">{stats.totalSeen - stats.mastered - stats.sticky}</p>
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
							onClick={() => router.push(`/team/practice/vocabulary/${g.slug}`)}
							className="w-full text-left bg-white rounded-3xl p-5 border-2 border-ink-200 hover:border-ink-400 hover:shadow-lg active:scale-[0.99] transition-all"
						>
							<div className="flex items-center gap-4">
								<div className="shrink-0 w-14 h-14 rounded-2xl bg-ink-100 text-ink-700 flex items-center justify-center">
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
