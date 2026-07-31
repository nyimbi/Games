'use client';

import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { ReactNode } from 'react';

/**
 * Shared shell for practice/drill games (grade 3–4).
 * Mobile-first, big touch targets, mastery bar at top.
 */
export interface PracticeGameLayoutProps {
	title: string;
	subtitle?: string;
	onBack?: () => void;
	// Mastery breakdown for the meter at the top
	mastery?: {
		sticky?: number;
		learning?: number;
		mastered?: number;
	};
	// Right-side status (streak, score, etc.)
	rightBadge?: ReactNode;
	children: ReactNode;
	background?: string;
}

export function PracticeGameLayout({
	title,
	subtitle,
	onBack,
	mastery,
	rightBadge,
	children,
	background = 'bg-gradient-to-b from-cream-100 to-cream-200',
}: PracticeGameLayoutProps) {
	const total = (mastery?.sticky ?? 0) + (mastery?.learning ?? 0) + (mastery?.mastered ?? 0);
	const stickyPct = total > 0 ? ((mastery?.sticky ?? 0) / total) * 100 : 0;
	const learningPct = total > 0 ? ((mastery?.learning ?? 0) / total) * 100 : 0;
	const masteredPct = total > 0 ? ((mastery?.mastered ?? 0) / total) * 100 : 0;

	return (
		<div className={`min-h-screen ${background}`}>
			{/* Header — sticky, compact */}
			<header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-ink-100">
				<div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
					{onBack && (
						<button
							onClick={onBack}
							aria-label="Back"
							className="min-w-14 min-h-14 -ml-2 rounded-2xl hover:bg-cream-100 active:bg-cream-200 flex items-center justify-center transition-colors"
						>
							<ArrowLeft className="w-6 h-6 text-ink-700" />
						</button>
					)}
					<div className="flex-1 min-w-0">
						<h1 className="font-display font-bold text-xl text-ink-800 leading-tight truncate">
							{title}
						</h1>
						{subtitle && (
							<p className="text-sm text-ink-500 leading-snug truncate">{subtitle}</p>
						)}
					</div>
					{rightBadge && <div className="shrink-0">{rightBadge}</div>}
				</div>
				{/* Mastery meter */}
				{total > 0 && (
					<div className="max-w-2xl mx-auto px-4 pb-2">
						<div className="flex h-2 rounded-full overflow-hidden bg-ink-100">
							<motion.div
								initial={{ width: 0 }}
								animate={{ width: `${masteredPct}%` }}
								transition={{ duration: 0.6, ease: 'easeOut' }}
								className="bg-sage-500"
							/>
							<motion.div
								initial={{ width: 0 }}
								animate={{ width: `${learningPct}%` }}
								transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
								className="bg-gold-400"
							/>
							<motion.div
								initial={{ width: 0 }}
								animate={{ width: `${stickyPct}%` }}
								transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
								className="bg-coral-500"
							/>
						</div>
						<div className="flex justify-between mt-1 text-[10px] font-medium text-ink-500 uppercase tracking-wide">
							<span>
								<span className="inline-block w-2 h-2 rounded-full bg-sage-500 mr-1 align-middle" />
								{mastery?.mastered ?? 0} mastered
							</span>
							<span>
								<span className="inline-block w-2 h-2 rounded-full bg-gold-400 mr-1 align-middle" />
								{mastery?.learning ?? 0} learning
							</span>
							<span>
								<span className="inline-block w-2 h-2 rounded-full bg-coral-500 mr-1 align-middle" />
								{mastery?.sticky ?? 0} sticky
							</span>
						</div>
					</div>
				)}
			</header>

			{/* Game body */}
			<main className="max-w-2xl mx-auto px-4 py-6 min-h-[calc(100vh-8rem)]">
				{children}
			</main>
		</div>
	);
}

/**
 * Big touch-friendly answer button for drill games.
 * Min 64px tall, generous padding, distinct correct/wrong states.
 */
export interface PracticeAnswerButtonProps {
	children: ReactNode;
	onClick: () => void;
	disabled?: boolean;
	state?: 'idle' | 'correct' | 'wrong' | 'muted';
	className?: string;
	'aria-label'?: string;
}

export function PracticeAnswerButton({
	children,
	onClick,
	disabled,
	state = 'idle',
	className = '',
	...props
}: PracticeAnswerButtonProps) {
	const stateClass = {
		idle: 'bg-white border-ink-200 hover:border-gold-400 hover:bg-gold-50 text-ink-800',
		correct: 'bg-sage-100 border-sage-500 text-sage-800',
		wrong: 'bg-coral-100 border-coral-500 text-coral-800',
		muted: 'bg-ink-50 border-ink-100 text-ink-400',
	}[state];

	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`min-h-16 px-5 py-4 rounded-2xl border-2 font-display font-bold text-2xl transition-all active:scale-[0.97] shadow-sm disabled:opacity-70 disabled:active:scale-100 ${stateClass} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
}
