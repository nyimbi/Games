'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { User, MapPin, Smile, CheckCircle, RotateCcw, ChevronRight, Loader2 } from 'lucide-react';
import { PracticeGameLayout } from '@/components/practice';
import { aiApi } from '@/lib/api/ai';
import { vaultApi } from '@/lib/api/vault';
import { useWordVault } from '@/lib/hooks/useVault';
import type { WordCatalogItem } from '@/lib/api/vault';

const CHARACTERS = ['a chef', 'an astronaut', 'my grandma', 'a stray cat', 'a robot', 'a friendly dragon', 'a curious detective', 'a race-car driver', 'a talking bookworm', 'a young inventor'];
const PLACES = ['at the beach', 'on a mountain', 'in a spooky attic', 'inside a submarine', 'in the jungle', 'at the library', 'in a treehouse', 'on a spaceship', 'in a bakery', 'at the zoo'];
const FEELINGS = ['feeling curious', 'feeling grumpy', 'feeling delighted', 'feeling anxious', 'feeling brave', 'feeling weary', 'feeling determined', 'feeling gloomy', 'feeling eager', 'feeling confident'];

const TOTAL_ROUNDS = 5;

function pick<T>(arr: T[], exclude: T[] = []): T {
  const pool = arr.filter(x => !exclude.includes(x));
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

interface Round {
  word: WordCatalogItem;
  character: string;
  place: string;
  feeling: string;
}

type Phase = 'loading' | 'writing' | 'grading' | 'reveal' | 'done';

interface RoundResult {
  word: string;
  score: number;
  used_correctly: boolean;
}

export default function SentenceSpinnerPage() {
  const router = useRouter();
  const { stats, recordEncounter } = useWordVault({ autoLoad: true });

  const [phase, setPhase] = useState<Phase>('loading');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [sentence, setSentence] = useState('');
  const [tooShort, setTooShort] = useState(false);
  const [gradeResult, setGradeResult] = useState<{ used_correctly: boolean; included_all: boolean; feedback: string; score: number } | null>(null);
  const [gradeError, setGradeError] = useState(false);
  const [triedAgain, setTriedAgain] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const startMs = useRef<number>(0);

  useEffect(() => {
    async function loadWords() {
      try {
        const res = await vaultApi.getWordCatalog({ level: 2 });
        const withDef = res.words.filter(w => w.definition && w.definition.length > 0);
        const chosen = pickN(withDef, TOTAL_ROUNDS);
        const built: Round[] = chosen.map(word => ({
          word,
          character: pick(CHARACTERS),
          place: pick(PLACES),
          feeling: pick(FEELINGS),
        }));
        setRounds(built);
        setPhase('writing');
      } catch {
        setPhase('loading');
      }
    }
    void loadWords();
  }, []);

  const currentRound = rounds[roundIndex];

  const wordCount = sentence.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = useCallback(async () => {
    if (wordCount < 3) {
      setTooShort(true);
      return;
    }
    setTooShort(false);
    setGradeError(false);
    setPhase('grading');
    startMs.current = Date.now();

    try {
      const res = await aiApi.gradeSentence({
        sentence: sentence.trim(),
        target_word: currentRound.word.word,
        required_elements: [currentRound.character, currentRound.place, currentRound.feeling],
      });
      const elapsed = Date.now() - startMs.current;
      const correct = res.used_correctly && res.score >= 6;

      void recordEncounter({
        word: currentRound.word.word,
        pos: currentRound.word.pos ?? null,
        game_id: 'sentence_spinner',
        mode: 'prod',
        correct,
        ms: elapsed,
      });

      setGradeResult(res);
      setTotalScore(prev => prev + res.score);
      setResults(prev => [...prev, { word: currentRound.word.word, score: res.score, used_correctly: res.used_correctly }]);
      setPhase('reveal');
    } catch {
      setGradeError(true);
      setPhase('writing');
    }
  }, [sentence, wordCount, currentRound, recordEncounter]);

  const handleNext = useCallback(() => {
    const nextIndex = roundIndex + 1;
    if (nextIndex >= TOTAL_ROUNDS) {
      setPhase('done');
    } else {
      setRoundIndex(nextIndex);
      setSentence('');
      setGradeResult(null);
      setTriedAgain(false);
      setTooShort(false);
      setPhase('writing');
    }
  }, [roundIndex]);

  const handleTryAgain = useCallback(() => {
    setTriedAgain(true);
    setSentence('');
    setGradeResult(null);
    setTooShort(false);
    setPhase('writing');
  }, []);

  const handlePlayAgain = useCallback(() => {
    setRoundIndex(0);
    setSentence('');
    setGradeResult(null);
    setTriedAgain(false);
    setTooShort(false);
    setTotalScore(0);
    setResults([]);
    setRounds([]);
    setPhase('loading');

    async function reload() {
      try {
        const res = await vaultApi.getWordCatalog({ level: 2 });
        const withDef = res.words.filter(w => w.definition && w.definition.length > 0);
        const chosen = pickN(withDef, TOTAL_ROUNDS);
        const built: Round[] = chosen.map(word => ({
          word,
          character: pick(CHARACTERS),
          place: pick(PLACES),
          feeling: pick(FEELINGS),
        }));
        setRounds(built);
        setPhase('writing');
      } catch {
        setPhase('loading');
      }
    }
    void reload();
  }, []);

  const subtitle = phase === 'done' ? 'Game over!' : `Round ${roundIndex + 1} of ${TOTAL_ROUNDS}`;

  return (
    <PracticeGameLayout
      title="Sentence Spinner"
      subtitle={subtitle}
      onBack={() => router.push('/team/practice/vocabulary')}
      mastery={{ mastered: stats.mastered, sticky: stats.sticky }}
      rightBadge={
        <span className="font-display font-bold text-lg text-gold-600">{totalScore}</span>
      }
    >
      <AnimatePresence mode="wait">

        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
            <p className="text-ink-500 font-body text-lg">Loading your words…</p>
          </motion.div>
        )}

        {(phase === 'writing' || phase === 'grading') && currentRound && (
          <motion.div
            key={`writing-${roundIndex}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col gap-6"
          >
            <div className="rounded-3xl border-2 border-ink-100 bg-cream-50 p-6 flex flex-col gap-5 shadow-sm">
              <div className="text-center">
                <p className="text-sm font-body text-ink-400 uppercase tracking-widest mb-1">Use this word</p>
                <h2 className="font-display font-bold text-4xl text-gold-600 uppercase tracking-wide">
                  {currentRound.word.word}
                </h2>
                {currentRound.word.definition && (
                  <p className="text-sm text-ink-500 font-body mt-1 italic">{currentRound.word.definition}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-3">
                  <span className="flex items-center gap-1.5 bg-cream-100 border border-ink-100 rounded-full px-3 py-1.5 text-sm font-body text-ink-700">
                    <User className="w-4 h-4 text-gold-500 shrink-0" />
                    {currentRound.character}
                  </span>
                  <span className="flex items-center gap-1.5 bg-cream-100 border border-ink-100 rounded-full px-3 py-1.5 text-sm font-body text-ink-700">
                    <MapPin className="w-4 h-4 text-sage-500 shrink-0" />
                    {currentRound.place}
                  </span>
                </div>
                <div>
                  <span className="flex items-center gap-1.5 bg-cream-100 border border-ink-100 rounded-full px-3 py-1.5 text-sm font-body text-ink-700 w-fit">
                    <Smile className="w-4 h-4 text-coral-500 shrink-0" />
                    {currentRound.feeling}
                  </span>
                </div>
              </div>

              <textarea
                className="w-full rounded-2xl border-2 border-ink-200 focus:border-gold-400 p-4 text-lg leading-relaxed font-body min-h-24 bg-white text-ink-900 resize-none outline-none transition-colors"
                placeholder="Write your sentence here…"
                rows={3}
                value={sentence}
                onChange={e => { setSentence(e.target.value); setTooShort(false); }}
                disabled={phase === 'grading'}
              />

              {tooShort && (
                <p className="text-sm text-coral-500 font-body -mt-2">Add a few more words to make a complete sentence.</p>
              )}

              {gradeError && (
                <div className="rounded-2xl bg-coral-50 border border-coral-200 p-4 flex flex-col gap-2">
                  <p className="text-sm font-body text-coral-700">The tutor isn't answering — try again.</p>
                  <button
                    onClick={handleSubmit}
                    className="self-start text-sm font-body font-semibold text-coral-600 underline underline-offset-2"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={phase === 'grading'}
              className="w-full min-h-14 rounded-2xl bg-gold-500 hover:bg-gold-600 disabled:opacity-60 text-white font-display font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              {phase === 'grading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  The word tutor is reading your sentence…
                </>
              ) : (
                'Submit for Grading'
              )}
            </button>
          </motion.div>
        )}

        {phase === 'reveal' && gradeResult && currentRound && (
          <motion.div
            key={`reveal-${roundIndex}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col gap-5"
          >
            <div className={`rounded-3xl border-2 p-6 flex flex-col gap-4 shadow-sm ${
              gradeResult.score >= 6
                ? 'bg-sage-50 border-sage-300'
                : 'bg-gold-50 border-gold-300'
            }`}>
              <div className="flex items-center gap-3">
                {gradeResult.score >= 6 ? (
                  <CheckCircle className="w-8 h-8 text-sage-500 shrink-0" />
                ) : (
                  <span className="text-2xl">✏️</span>
                )}
                <div>
                  <p className="text-sm font-body text-ink-400 uppercase tracking-widest">Score</p>
                  <p className="font-display font-bold text-4xl text-ink-900">
                    {gradeResult.score} <span className="text-2xl text-ink-400">/ 10</span>
                  </p>
                </div>
              </div>

              <p className="font-body text-base text-ink-700 leading-relaxed">{gradeResult.feedback}</p>

              {!gradeResult.included_all && (
                <p className="text-sm font-body text-ink-500 italic">
                  Tip: try to include all three elements — the character, place, and feeling.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {gradeResult.score >= 6 ? (
                <button
                  onClick={handleNext}
                  className="w-full min-h-14 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white font-display font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  {roundIndex + 1 >= TOTAL_ROUNDS ? 'See Results' : 'Next'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  {!triedAgain && (
                    <button
                      onClick={handleTryAgain}
                      className="w-full min-h-14 rounded-2xl bg-gold-500 hover:bg-gold-600 text-white font-display font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Try Again
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="w-full min-h-14 rounded-2xl bg-ink-100 hover:bg-ink-200 text-ink-700 font-display font-bold text-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Move On
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6"
          >
            <div className="rounded-3xl border-2 border-gold-300 bg-gold-50 p-6 flex flex-col items-center gap-3 text-center shadow-sm">
              <p className="text-4xl">🎉</p>
              <h2 className="font-display font-bold text-3xl text-ink-900">Game Over!</h2>
              <p className="font-body text-ink-500 text-base">Total score</p>
              <p className="font-display font-bold text-6xl text-gold-600">
                {totalScore}
                <span className="text-3xl text-ink-400"> / {TOTAL_ROUNDS * 10}</span>
              </p>
            </div>

            <div className="rounded-3xl border-2 border-ink-100 bg-cream-50 p-5 flex flex-col gap-3">
              <h3 className="font-display font-bold text-lg text-ink-800">Words practiced</h3>
              <ul className="flex flex-col gap-2">
                {results.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <span className="font-body text-base text-ink-700 capitalize">{r.word}</span>
                    <div className="flex items-center gap-2">
                      {r.used_correctly && (
                        <CheckCircle className="w-4 h-4 text-sage-500" />
                      )}
                      <span className={`font-display font-bold text-sm ${r.score >= 6 ? 'text-sage-600' : 'text-coral-500'}`}>
                        {r.score}/10
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handlePlayAgain}
                className="w-full min-h-14 rounded-2xl bg-gold-500 hover:bg-gold-600 text-white font-display font-bold text-lg transition-colors shadow-md"
              >
                Play Again
              </button>
              <button
                onClick={() => router.push('/team/practice/vocabulary')}
                className="w-full min-h-14 rounded-2xl bg-ink-100 hover:bg-ink-200 text-ink-700 font-display font-bold text-lg transition-colors"
              >
                Back to Vocabulary
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </PracticeGameLayout>
  );
}
