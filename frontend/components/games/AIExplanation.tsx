'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Lightbulb, Loader2, BookOpen } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { getEffectiveLevel, getStudentProfile } from '@/lib/games/studentLevel';
import type { Question } from '@/lib/games/types';

interface AIExplanationProps {
  question: Question;
  userAnswer: number | null;
  wasCorrect: boolean;
}

interface ExplainResponse {
  explanation: string;
  funFact?: string;
  relatedConcepts?: string[];
  encouragement: string;
}

// Cache to avoid re-fetching the same explanation
const explanationCache = new Map<string, ExplainResponse>();

export function AIExplanation({ question, userAnswer, wasCorrect }: AIExplanationProps) {
  const [response, setResponse] = useState<ExplainResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const fetchedRef = useRef(false);

  const cacheKey = `${question.id}-${wasCorrect}`;

  const fetchExplanation = useCallback(async () => {
    if (fetchedRef.current) return;

    // Check cache first
    const cached = explanationCache.get(cacheKey);
    if (cached) {
      setResponse(cached);
      setIsOpen(true);
      return;
    }

    fetchedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const profile = getStudentProfile();
      const level = getEffectiveLevel();

      const res = await fetch('/api/explain-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: question.text,
          options: question.options,
          correctIndex: question.correct_index,
          userAnswer,
          wasCorrect,
          subject: question.subject,
          existingExplanation: question.explanation,
          themeConnection: question.theme_connection,
          studentLevel: {
            grade: profile.gradeLevel,
            level,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get explanation');
      }

      const data: ExplainResponse = await res.json();
      explanationCache.set(cacheKey, data);
      setResponse(data);
      setIsOpen(true);
    } catch {
      setError('Could not load AI explanation. Try again.');
      fetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, question, userAnswer, wasCorrect]);

  return (
    <div className="mt-3">
      {/* Trigger Button */}
      {!isOpen && !isLoading && (
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchExplanation}
          className="gap-2"
        >
          {wasCorrect ? (
            <>
              <Lightbulb className="w-4 h-4 text-gold-600" />
              Why is this right?
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-purple-600" />
              Ask AI to Explain
            </>
          )}
        </Button>
      )}

      {/* Loading */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-ink-500 py-2"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          AI is thinking...
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-coral-600 mt-1">{error}</p>
      )}

      {/* Response */}
      <AnimatePresence>
        {isOpen && response && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-3"
          >
            {/* Main Explanation */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-800">AI Explanation</span>
              </div>
              <p className="text-ink-700 text-sm leading-relaxed">{response.explanation}</p>
            </div>

            {/* Fun Fact */}
            {response.funFact && (
              <div className="p-3 bg-gold-50 border border-gold-200 rounded-xl">
                <p className="text-sm text-gold-800">
                  <span className="font-semibold">Fun fact:</span> {response.funFact}
                </p>
              </div>
            )}

            {/* Related Concepts */}
            {response.relatedConcepts && response.relatedConcepts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <BookOpen className="w-4 h-4 text-ink-400 mt-0.5" />
                {response.relatedConcepts.map((concept, i) => (
                  <Badge key={i} variant="outline" size="sm">
                    {concept}
                  </Badge>
                ))}
              </div>
            )}

            {/* Encouragement */}
            <p className="text-sm text-sage-700 font-medium">{response.encouragement}</p>

            {/* Collapse */}
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-ink-400 hover:text-ink-600"
            >
              Hide AI explanation
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
