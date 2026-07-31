'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, CheckCircle2, Swords, Trophy, User } from 'lucide-react';
import { PracticeGameLayout } from '@/components/practice';
import { useFactVault } from '@/lib/hooks/useVault';
import { vaultApi } from '@/lib/api/vault';
import type { FactCatalogItem } from '@/lib/api/vault';

const TOTAL_ROUNDS = 5;
const BOT_SPEED_INITIAL = 4000;
const BOT_SPEED_MIN = 2000;
const BOT_SPEED_DECREMENT = 300;
const FALLBACK_PAIRS: [number, number][] = [[3, 4], [4, 6], [6, 7], [5, 8], [7, 8]];

type Phase = 'loading' | 'playing' | 'round_end' | 'done';

interface RoundData { a: number; b: number; product: number }

interface TemplateRow {
  id: string;
  display: string;
  answer: number;
  options: number[];
  factId: string;
  factType: 'mult' | 'div';
  operands: number[];
}

// ---- pure helpers -----------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeOptions(correct: number): number[] {
  const pool = new Set([correct]);
  for (const d of [-2, -1, 1, 2, 3, -3]) {
    if (pool.size >= 4) break;
    const v = correct + d;
    if (v > 0) pool.add(v);
  }
  return shuffle([...pool].slice(0, 4));
}

function buildTemplates({ a, b, product }: RoundData): TemplateRow[] {
  return [
    { id: 'mult_ab', display: `? × ${b} = ${product}`, answer: a, options: makeOptions(a), factId: `mult_${a}x${b}`, factType: 'mult', operands: [a, b] },
    { id: 'mult_ba', display: `? × ${a} = ${product}`, answer: b, options: makeOptions(b), factId: `mult_${b}x${a}`, factType: 'mult', operands: [b, a] },
    { id: 'div_pa', display: `${product} ÷ ${a} = ?`, answer: b, options: makeOptions(b), factId: `div_${product}_${a}`, factType: 'div', operands: [product, a] },
    { id: 'div_pb', display: `${product} ÷ ${b} = ?`, answer: a, options: makeOptions(a), factId: `div_${product}_${b}`, factType: 'div', operands: [product, b] },
  ];
}

function buildRounds(facts: FactCatalogItem[]): RoundData[] {
  const multFacts = facts.filter(f => f.fact_type === 'mult');
  const source: FactCatalogItem[] = multFacts.length >= TOTAL_ROUNDS
    ? multFacts
    : FALLBACK_PAIRS.map(([a, b]) => ({
        fact_id: `mult_${a}x${b}`,
        fact_type: 'mult' as const,
        operands: [a, b],
        answer: String(a * b),
        tier: 2,
      }));
  return shuffle(source).slice(0, TOTAL_ROUNDS).map(f => {
    const ops = f.operands as number[];
    const a = Math.min(ops[0], ops[1]);
    const b = Math.max(ops[0], ops[1]);
    return { a, b, product: Number(f.answer) };
  });
}

// ---- sub-components ---------------------------------------------------------

function KidCard({
  tmpl, answered, wrongFlash, onTap,
}: {
  tmpl: TemplateRow;
  answered: boolean;
  wrongFlash: boolean;
  onTap: (id: string, val: number) => void;
}) {
  const color = answered
    ? 'border-sage-400 bg-sage-50'
    : wrongFlash
    ? 'border-coral-400 bg-coral-50'
    : 'border-ink-200 bg-white';
  return (
    <div className={`rounded-2xl border-2 p-3 transition-colors ${color}`}>
      <p className="font-display font-bold text-sm text-ink-700 mb-2 text-center tabular-nums">
        {answered ? tmpl.display.replace('?', String(tmpl.answer)) : tmpl.display}
      </p>
      {answered ? (
        <div className="flex justify-center py-1">
          <CheckCircle2 className="w-6 h-6 text-sage-500" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {tmpl.options.map(opt => (
            <button
              key={opt}
              onClick={() => onTap(tmpl.id, opt)}
              className="min-h-14 rounded-xl bg-cream-100 active:bg-gold-100 hover:bg-gold-50 border border-ink-200 font-display font-bold text-lg text-ink-800 transition-colors touch-manipulation"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BotCell({ tmpl, done }: { tmpl: TemplateRow; done: boolean }) {
  return (
    <motion.div
      animate={done ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.25 }}
      className={`rounded-2xl border-2 p-3 flex flex-col items-center justify-center min-h-[5.5rem] transition-colors ${
        done ? 'border-coral-300 bg-coral-50' : 'border-ink-100 bg-ink-50'
      }`}
    >
      <p className={`font-display font-bold text-sm tabular-nums text-center leading-snug ${done ? 'text-coral-800' : 'text-ink-300'}`}>
        {done ? tmpl.display.replace('?', String(tmpl.answer)) : '…'}
      </p>
      {done && <CheckCircle2 className="w-5 h-5 text-coral-400 mt-1" />}
    </motion.div>
  );
}

function DoneScreen({
  youScore, botScore, roundResults, onPlayAgain, onBack,
}: {
  youScore: number;
  botScore: number;
  roundResults: Array<'kid' | 'bot'>;
  onPlayAgain: () => void;
  onBack: () => void;
}) {
  const kidWon = youScore > botScore;
  const draw = youScore === botScore;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-8"
    >
      <div className={`flex flex-col items-center gap-2 p-6 rounded-3xl w-full max-w-sm ${kidWon ? 'bg-sage-100' : draw ? 'bg-cream-200' : 'bg-coral-50'}`}>
        {kidWon ? (
          <Trophy className="w-14 h-14 text-gold-500" />
        ) : (
          <Bot className="w-14 h-14 text-coral-500" />
        )}
        <p className="font-display font-bold text-3xl text-ink-800">
          {kidWon ? 'You won!' : draw ? "It's a draw!" : 'Bot wins!'}
        </p>
        <p className="font-display text-5xl font-bold text-ink-900">
          <span className="text-sage-700">{youScore}</span>
          <span className="text-ink-400 mx-3">–</span>
          <span className="text-coral-700">{botScore}</span>
        </p>
      </div>

      {roundResults.length > 0 && (
        <div className="w-full max-w-sm">
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-2">Round results</p>
          <div className="flex gap-2">
            {roundResults.map((winner, i) => (
              <div
                key={i}
                className={`flex-1 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm ${
                  winner === 'kid' ? 'bg-sage-200 text-sage-800' : 'bg-coral-200 text-coral-800'
                }`}
              >
                {winner === 'kid' ? 'You' : 'Bot'}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={onPlayAgain}
          className="min-h-14 w-full rounded-2xl bg-gold-400 hover:bg-gold-500 active:bg-gold-600 font-display font-bold text-xl text-ink-900 transition-colors"
        >
          Play Again
        </button>
        <button
          onClick={onBack}
          className="min-h-14 w-full rounded-2xl bg-cream-200 hover:bg-cream-300 active:bg-cream-400 font-display font-bold text-lg text-ink-700 transition-colors"
        >
          Back to Math
        </button>
      </div>
    </motion.div>
  );
}

// ---- main page --------------------------------------------------------------

export default function FactFamilyDuelPage() {
  const router = useRouter();
  // useFactVault for recordAttempt + mastery stats; catalog loaded directly to avoid stale-closure issues
  const { stats, recordAttempt } = useFactVault({ factType: 'mult', autoLoad: false });

  const [phase, setPhase] = useState<Phase>('loading');
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [kidAnswers, setKidAnswers] = useState<Record<string, boolean>>({});
  const [wrongFlash, setWrongFlash] = useState<Record<string, boolean>>({});
  const [botDone, setBotDone] = useState<Set<string>>(new Set());
  const [roundWinner, setRoundWinner] = useState<'kid' | 'bot' | null>(null);
  const [youScore, setYouScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [botSpeedMs, setBotSpeedMs] = useState(BOT_SPEED_INITIAL);
  const [roundResults, setRoundResults] = useState<Array<'kid' | 'bot'>>([]);

  const mountedRef = useRef(true);
  // Ref so the bot interval callback always has current templates without re-creating the interval
  const templatesRef = useRef<TemplateRow[]>([]);
  const templateStartRef = useRef<Record<string, number>>({});
  const botTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { mountedRef.current = false; }, []);
  useEffect(() => { templatesRef.current = templates; }, [templates]);

  // Direct API call so we get the catalog value in the .then() callback — avoids stale closure on catalog state
  useEffect(() => {
    let cancelled = false;
    vaultApi.getFactCatalog({ fact_type: 'mult', tier: 2 })
      .then(res => {
        if (!cancelled && mountedRef.current) { setRounds(buildRounds(res.facts)); setPhase('playing'); }
      })
      .catch(() => {
        if (!cancelled && mountedRef.current) { setRounds(buildRounds([])); setPhase('playing'); }
      });
    return () => { cancelled = true; };
  }, []);

  // Reset per-round state whenever we enter a new playing round
  useEffect(() => {
    if (phase !== 'playing' || rounds.length === 0) return;
    const t = buildTemplates(rounds[roundIdx]);
    setTemplates(t);
    setKidAnswers({});
    setWrongFlash({});
    setBotDone(new Set());
    templateStartRef.current = {};
  }, [phase, roundIdx, rounds]);

  // Bot interval — restarted on each new round (phase/templates/botSpeedMs change)
  useEffect(() => {
    if (phase !== 'playing' || templates.length === 0) return;
    botTimerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setBotDone(prev => {
        const remaining = templatesRef.current.filter(t => !prev.has(t.id));
        if (remaining.length === 0) return prev;
        const pick = remaining[Math.floor(Math.random() * remaining.length)];
        return new Set([...prev, pick.id]);
      });
    }, botSpeedMs);
    return () => { if (botTimerRef.current) clearInterval(botTimerRef.current); };
  }, [phase, templates, botSpeedMs]);

  // Win/loss detection
  useEffect(() => {
    if (phase !== 'playing' || templates.length === 0) return;
    const kidCount = templates.filter(t => kidAnswers[t.id]).length;
    const botCount = botDone.size;
    if (kidCount < 4 && botCount < 4) return;
    if (botTimerRef.current) clearInterval(botTimerRef.current);
    const winner: 'kid' | 'bot' = kidCount === 4 ? 'kid' : 'bot';
    setRoundWinner(winner);
    setRoundResults(prev => [...prev, winner]);
    if (winner === 'kid') setYouScore(s => s + 1); else setBotScore(s => s + 1);
    setPhase('round_end');
  }, [kidAnswers, botDone, templates, phase]);

  // Auto-advance after the round-end flash
  useEffect(() => {
    if (phase !== 'round_end') return;
    const t = setTimeout(() => {
      if (!mountedRef.current) return;
      if (roundIdx + 1 >= TOTAL_ROUNDS) {
        setPhase('done');
      } else {
        setBotSpeedMs(s => Math.max(BOT_SPEED_MIN, s - BOT_SPEED_DECREMENT));
        setRoundIdx(i => i + 1);
        setPhase('playing');
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [phase, roundIdx]);

  const handleTap = useCallback((templateId: string, value: number) => {
    const tmpl = templatesRef.current.find(t => t.id === templateId);
    if (!tmpl) return;
    if (!templateStartRef.current[templateId]) {
      templateStartRef.current[templateId] = Date.now();
    }
    const ms = Date.now() - templateStartRef.current[templateId];
    const isCorrect = value === tmpl.answer;
    if (isCorrect) {
      setKidAnswers(prev => prev[templateId] ? prev : { ...prev, [templateId]: true });
    } else {
      setWrongFlash(prev => ({ ...prev, [templateId]: true }));
      setTimeout(() => {
        if (mountedRef.current) setWrongFlash(prev => ({ ...prev, [templateId]: false }));
      }, 600);
    }
    void recordAttempt({
      fact_id: tmpl.factId,
      fact_type: tmpl.factType,
      operands: tmpl.operands,
      answer: isCorrect ? String(tmpl.answer) : String(value),
      game_id: 'fact_family_duel',
      correct: isCorrect,
      ms,
    });
  }, [recordAttempt]);

  const handlePlayAgain = useCallback(() => {
    setRoundIdx(0);
    setYouScore(0);
    setBotScore(0);
    setBotSpeedMs(BOT_SPEED_INITIAL);
    setRoundResults([]);
    setRoundWinner(null);
    vaultApi.getFactCatalog({ fact_type: 'mult', tier: 2 })
      .then(res => { if (mountedRef.current) { setRounds(buildRounds(res.facts)); setPhase('playing'); } })
      .catch(() => { if (mountedRef.current) { setRounds(buildRounds([])); setPhase('playing'); } });
  }, []);

  // ---- render ---------------------------------------------------------------

  if (phase === 'loading') {
    return (
      <PracticeGameLayout title="Fact Family Duel" subtitle="Loading…">
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-4 border-gold-400 border-t-transparent rounded-full"
          />
        </div>
      </PracticeGameLayout>
    );
  }

  if (phase === 'done') {
    return (
      <PracticeGameLayout
        title="Fact Family Duel"
        subtitle="Game over!"
        onBack={() => router.push('/team/practice/math')}
        mastery={{ sticky: stats.sticky, learning: stats.learning, mastered: stats.mastered }}
      >
        <DoneScreen
          youScore={youScore}
          botScore={botScore}
          roundResults={roundResults}
          onPlayAgain={handlePlayAgain}
          onBack={() => router.push('/team/practice/math')}
        />
      </PracticeGameLayout>
    );
  }

  const currentRound = rounds[roundIdx];

  return (
    <PracticeGameLayout
      title="Fact Family Duel"
      subtitle={`Round ${roundIdx + 1} of ${TOTAL_ROUNDS}`}
      onBack={() => router.push('/team/practice/math')}
      mastery={{ sticky: stats.sticky, learning: stats.learning, mastered: stats.mastered }}
      rightBadge={
        <div className="flex items-center gap-1.5 font-display font-bold text-lg">
          <span className="text-sage-700">{youScore}</span>
          <Swords className="w-4 h-4 text-ink-400" />
          <span className="text-coral-700">{botScore}</span>
        </div>
      }
    >
      {/* Round-end overlay */}
      <AnimatePresence>
        {phase === 'round_end' && (
          <motion.div
            key="round-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex items-center justify-center ${
              roundWinner === 'kid' ? 'bg-sage-500/80' : 'bg-coral-500/80'
            }`}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="text-white text-center"
            >
              {roundWinner === 'kid' ? (
                <><Trophy className="w-20 h-20 mx-auto mb-3" /><p className="font-display font-bold text-5xl">You win!</p></>
              ) : (
                <><Bot className="w-20 h-20 mx-auto mb-3" /><p className="font-display font-bold text-5xl">Bot wins!</p></>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fact family header */}
      {currentRound && (
        <div className="text-center mb-5">
          <p className="text-xs font-medium text-ink-400 uppercase tracking-widest mb-1">Fact Family</p>
          <p className="font-display font-bold text-ink-800 tabular-nums">
            <span className="text-4xl">{currentRound.product}</span>
            <span className="text-2xl text-ink-400 mx-2">=</span>
            <span className="text-4xl">{currentRound.a}</span>
            <span className="text-2xl text-ink-400 mx-2">×</span>
            <span className="text-4xl">{currentRound.b}</span>
          </p>
        </div>
      )}

      {/* Duel: kid (wider) vs bot (narrower) */}
      <div className="grid grid-cols-[3fr_2fr] gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <User className="w-4 h-4 text-sage-600" />
            <span className="font-display font-bold text-sm text-sage-700">You</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {templates.map(tmpl => (
              <KidCard
                key={tmpl.id}
                tmpl={tmpl}
                answered={!!kidAnswers[tmpl.id]}
                wrongFlash={!!wrongFlash[tmpl.id]}
                onTap={handleTap}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Bot className="w-4 h-4 text-coral-600" />
            <span className="font-display font-bold text-sm text-coral-700">Bot</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {templates.map(tmpl => (
              <BotCell key={tmpl.id} tmpl={tmpl} done={botDone.has(tmpl.id)} />
            ))}
          </div>
        </div>
      </div>
    </PracticeGameLayout>
  );
}
