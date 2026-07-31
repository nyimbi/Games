'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Sparkles, RotateCcw } from 'lucide-react';

import { PracticeGameLayout, PracticeAnswerButton } from '@/components/practice';
import { vaultApi, FactCatalogItem, FactVaultItem } from '@/lib/api/vault';
import { Button } from '@/components/ui';

type Question = {
	fact_id: string;
	fact_type: string;
	operands: unknown[];
	answer: string;
	prompt: string;
	options: string[];
};

const GAME_ID = 'practice_warmup';

function makePrompt(f: { fact_type: string; operands: unknown[]; answer: string }): string {
	if (f.fact_type === 'mult') return `${f.operands[0]} × ${f.operands[1]}`;
	if (f.fact_type === 'div') return `${f.operands[0]} ÷ ${f.operands[1]}`;
	if (f.fact_type === 'frac_cmp') return `${f.operands[0]}  ?  ${f.operands[1]}`;
	if (f.fact_type === 'frac_eq') return `${f.operands[0]} = ${f.operands[1]}?`;
	return `${f.operands[0]} + ${f.operands[1]}`;
}

function makeOptions(answer: string, fact_type: string): string[] {
	if (fact_type === 'frac_cmp') return ['<', '=', '>'];
	if (fact_type === 'frac_eq') return ['true', 'false'];
	const correct = parseInt(answer, 10);
	if (!Number.isFinite(correct)) return [answer];
	const wrongs = new Set<number>();
	while (wrongs.size < 3) {
		const w = correct + Math.floor(Math.random() * 11) - 5;
		if (w !== correct && w > 0) wrongs.add(w);
	}
	return [answer, ...Array.from(wrongs).map(String)].sort(() => Math.random() - 0.5);
}

async function buildQuestions(): Promise<Question[]> {
	// Prefer due items from the vault; fall back to fresh multiplication facts
	let facts: (FactVaultItem | FactCatalogItem)[] = [];
	try {
		const due = await vaultApi.getDueFacts({ limit: 5 });
		facts = due.items;
	} catch {
		facts = [];
	}
	if (facts.length < 5) {
		try {
			const cat = await vaultApi.getFactCatalog({ fact_type: 'mult', tier: 2 });
			const shuffled = [...cat.facts].sort(() => Math.random() - 0.5);
			for (const f of shuffled) {
				if (facts.length >= 5) break;
				if (!facts.find((x) => x.fact_id === f.fact_id)) facts.push(f);
			}
		} catch { /* ignore */ }
	}
	return facts.slice(0, 5).map((f) => ({
		fact_id: f.fact_id,
		fact_type: f.fact_type,
		operands: f.operands as unknown[],
		answer: f.answer,
		prompt: makePrompt(f),
		options: makeOptions(f.answer, f.fact_type),
	}));
}

export default function WarmupPage() {
	const router = useRouter();
	const [questions, setQuestions] = useState<Question[]>([]);
	const [idx, setIdx] = useState(0);
	const [phase, setPhase] = useState<'loading' | 'playing' | 'reveal' | 'done'>('loading');
	const [selected, setSelected] = useState<string | null>(null);
	const [correctCount, setCorrectCount] = useState(0);
	const startAt = useRef<number>(Date.now());

	const load = useCallback(async () => {
		setPhase('loading');
		const qs = await buildQuestions();
		if (qs.length === 0) {
			setPhase('done');
			return;
		}
		setQuestions(qs);
		setIdx(0);
		setSelected(null);
		setCorrectCount(0);
		startAt.current = Date.now();
		setPhase('playing');
	}, []);

	useEffect(() => { void load(); }, [load]);

	const currentQ = questions[idx];

	const handleAnswer = useCallback(async (opt: string) => {
		if (phase !== 'playing' || !currentQ) return;
		const ms = Date.now() - startAt.current;
		const isCorrect = opt === currentQ.answer;
		setSelected(opt);
		setPhase('reveal');
		if (isCorrect) setCorrectCount((c) => c + 1);

		void vaultApi.recordFactAttempt({
			fact_id: currentQ.fact_id,
			fact_type: currentQ.fact_type as 'mult',
			operands: currentQ.operands,
			answer: currentQ.answer,
			game_id: GAME_ID,
			correct: isCorrect,
			ms,
		});

		setTimeout(() => {
			if (idx + 1 >= questions.length) {
				setPhase('done');
			} else {
				setIdx((i) => i + 1);
				setSelected(null);
				setPhase('playing');
				startAt.current = Date.now();
			}
		}, 900);
	}, [phase, currentQ, idx, questions.length]);

	const progressText = useMemo(
		() => (questions.length > 0 ? `${Math.min(idx + 1, questions.length)} / ${questions.length}` : ''),
		[idx, questions.length],
	);

	return (
		<PracticeGameLayout
			title="Warmup"
			subtitle="A quick personal drill"
			onBack={() => router.push('/team/practice')}
			rightBadge={
				phase === 'playing' || phase === 'reveal' ? (
					<span className="font-display font-bold text-lg text-ink-700">{progressText}</span>
				) : null
			}
		>
			{phase === 'loading' && (
				<div className="flex flex-col items-center justify-center py-24">
					<div className="w-12 h-12 border-4 border-ink-200 border-t-gold-500 rounded-full animate-spin" />
					<p className="text-ink-500 mt-4">Picking questions just for you…</p>
				</div>
			)}

			{phase === 'done' && questions.length === 0 && (
				<div className="text-center py-16">
					<Sparkles className="w-12 h-12 text-gold-500 mx-auto mb-4" />
					<h2 className="font-display font-bold text-2xl text-ink-800">Nothing to warm up yet</h2>
					<p className="text-ink-600 mt-2 max-w-md mx-auto">
						Play a practice game first — your Warmup will fill up with the facts you're still working on.
					</p>
					<Button className="mt-6" variant="gold" onClick={() => router.push('/team/practice')}>
						Back to Practice
					</Button>
				</div>
			)}

			{phase === 'done' && questions.length > 0 && (
				<div className="text-center py-12">
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ type: 'spring', damping: 15 }}
						className="w-20 h-20 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-4"
					>
						<CheckCircle2 className="w-10 h-10 text-sage-600" />
					</motion.div>
					<h2 className="font-display font-bold text-3xl text-ink-800">
						{correctCount === questions.length ? 'Perfect!' : 'Nice work!'}
					</h2>
					<p className="text-ink-600 mt-2">
						{correctCount} out of {questions.length} correct
					</p>
					<div className="flex gap-3 mt-8 max-w-xs mx-auto">
						<Button variant="secondary" onClick={load} className="flex-1">
							<RotateCcw className="w-4 h-4 mr-1" /> Again
						</Button>
						<Button variant="gold" onClick={() => router.push('/team/practice')} className="flex-1">
							Done
						</Button>
					</div>
				</div>
			)}

			{(phase === 'playing' || phase === 'reveal') && currentQ && (
				<AnimatePresence mode="wait">
					<motion.div
						key={currentQ.fact_id + idx}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.2 }}
					>
						{/* Prompt */}
						<div className={`bg-white rounded-3xl shadow-sm border-2 border-ink-100 py-12 mb-8 text-center transition-colors ${
							phase === 'reveal' && selected === currentQ.answer ? 'border-sage-400 bg-sage-50'
							: phase === 'reveal' && selected !== currentQ.answer ? 'border-coral-400 bg-coral-50'
							: ''
						}`}>
							<p className="font-display font-bold text-5xl md:text-6xl text-ink-800 leading-none">
								{currentQ.prompt}
							</p>
						</div>

						{/* Options — 2×2 grid, large touch targets */}
						<div className={`grid gap-3 ${currentQ.options.length === 2 ? 'grid-cols-2' : currentQ.options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
							{currentQ.options.map((opt) => {
								const isSelected = selected === opt;
								const isCorrect = opt === currentQ.answer;
								let state: 'idle' | 'correct' | 'wrong' | 'muted' = 'idle';
								if (phase === 'reveal') {
									if (isCorrect) state = 'correct';
									else if (isSelected) state = 'wrong';
									else state = 'muted';
								}
								return (
									<PracticeAnswerButton
										key={opt}
										onClick={() => handleAnswer(opt)}
										disabled={phase !== 'playing'}
										state={state}
									>
										{opt}
									</PracticeAnswerButton>
								);
							})}
						</div>

						{/* Reveal feedback */}
						{phase === 'reveal' && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className={`mt-6 rounded-2xl p-4 flex items-center gap-3 ${
									selected === currentQ.answer ? 'bg-sage-50 text-sage-800' : 'bg-coral-50 text-coral-800'
								}`}
							>
								{selected === currentQ.answer ? (
									<CheckCircle2 className="w-6 h-6 shrink-0" />
								) : (
									<XCircle className="w-6 h-6 shrink-0" />
								)}
								<p className="font-medium">
									{selected === currentQ.answer
										? 'Correct!'
										: `The answer is ${currentQ.answer}.`}
								</p>
							</motion.div>
						)}
					</motion.div>
				</AnimatePresence>
			)}
		</PracticeGameLayout>
	);
}
