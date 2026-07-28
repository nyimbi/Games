'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, Layers, Play, Trash2, RotateCcw, ChevronRight,
  BookOpen, Check, ArrowLeft, Loader2, X,
} from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import {
  parseApkg, getSavedDecks, saveDeck, deleteDeck,
  getDeckProgress, saveDeckProgress, resetDeckProgress,
  type AnkiDeck, type AnkiCard,
} from '@/lib/anki/parser';

// ─── Deck Library ─────────────────────────────────────────────────────────────

function DeckLibrary({ onPlay }: { onPlay: (deck: AnkiDeck) => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [decks, setDecks] = useState<AnkiDeck[]>(() => getSavedDecks());
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.apkg')) {
      setImportError('Please select an Anki .apkg file.');
      return;
    }
    setImporting(true); setImportError(null);
    try {
      const parsed = await parseApkg(file);
      if (parsed.length === 0) {
        setImportError('No cards found in this deck.');
        return;
      }
      for (const deck of parsed) saveDeck(deck);
      setDecks(getSavedDecks());
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Failed to read file.');
    } finally {
      setImporting(false);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleDelete = (id: string) => {
    deleteDeck(id);
    setDecks(getSavedDecks());
  };

  return (
    <div className="min-h-screen bg-cream-100 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()}
          className="flex items-center text-ink-500 hover:text-ink-700 mb-6 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-gold-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-800">Anki Flashcards</h1>
            <p className="text-sm text-ink-500">Import your .apkg decks and review them here</p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !importing && fileRef.current?.click()}
          className={`mb-6 rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-gold-400 bg-gold-50'
              : 'border-ink-200 bg-white hover:border-gold-300 hover:bg-gold-50'
          }`}>
          <input ref={fileRef} type="file" accept=".apkg" onChange={onFileChange} className="hidden" />
          {importing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-gold-400 animate-spin" />
              <p className="text-ink-600 font-medium">Importing deck…</p>
              <p className="text-xs text-ink-400">Loading SQLite parser (first import takes ~2s)</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="w-10 h-10 text-ink-300" />
              <p className="font-semibold text-ink-700">Drop your .apkg file here</p>
              <p className="text-sm text-ink-400">or click to browse</p>
            </div>
          )}
        </div>

        {importError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-coral-100 text-coral-700 flex items-center gap-2 text-sm">
            <X className="w-4 h-4 flex-shrink-0" />{importError}
          </motion.div>
        )}

        {/* Saved decks */}
        {decks.length === 0 ? (
          <p className="text-center text-ink-400 text-sm py-8">
            No decks imported yet — drop an .apkg file above to get started.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Your decks</p>
            {decks.map(deck => {
              const progress = getDeckProgress(deck.id);
              const pct = deck.cards.length > 0 ? Math.round((progress.size / deck.cards.length) * 100) : 0;
              return (
                <motion.div key={deck.id} layout
                  className="bg-white rounded-2xl border border-ink-100 p-4 flex items-center gap-4 hover:border-gold-200 transition-colors">
                  <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Layers className="w-6 h-6 text-gold-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink-800 truncate">{deck.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-ink-500">{deck.cards.length} cards</span>
                      {pct > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-20 h-1.5 bg-ink-100 rounded-full">
                            <div className="h-full bg-gold-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-ink-400">{pct}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {pct > 0 && (
                      <button onClick={() => { resetDeckProgress(deck.id); setDecks(getSavedDecks()); }}
                        title="Reset progress"
                        className="p-2 text-ink-300 hover:text-ink-600 transition-colors">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(deck.id)}
                      title="Delete deck"
                      className="p-2 text-ink-300 hover:text-coral-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Button variant="gold" onClick={() => onPlay(deck)}>
                      <Play className="w-4 h-4 mr-1" />
                      {pct > 0 && pct < 100 ? 'Continue' : pct === 100 ? 'Review' : 'Start'}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card Reviewer ────────────────────────────────────────────────────────────

type Rating = 'again' | 'good' | 'easy';

function CardReviewer({ deck, onDone }: { deck: AnkiDeck; onDone: () => void }) {
  const [seen, setSeen] = useState<Set<number>>(() => getDeckProgress(deck.id));
  const [queue] = useState<AnkiCard[]>(() => {
    const progress = getDeckProgress(deck.id);
    // Unseen cards first, then all (for review mode)
    const unseen = deck.cards.filter((_, i) => !progress.has(i));
    return unseen.length > 0 ? unseen : [...deck.cards];
  });
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  const card = queue[idx];
  const progress = Math.round(((seen.size) / deck.cards.length) * 100);

  const handleFlip = () => { if (!flipped) setFlipped(true); };

  const handleRate = (rating: Rating) => {
    // Find original index in deck.cards
    const origIdx = deck.cards.findIndex(c => c.id === card.id);
    const nextSeen = new Set(seen);
    if (origIdx >= 0 && rating !== 'again') nextSeen.add(origIdx);
    setSeen(nextSeen);
    saveDeckProgress(deck.id, nextSeen);

    if (idx + 1 >= queue.length) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
      setFlipped(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
        <Card className="max-w-sm w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-sage-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">Session Complete!</h2>
            <p className="text-ink-500 mb-2">{deck.name}</p>
            <p className="text-sm text-ink-400 mb-6">
              {progress}% of deck reviewed ({seen.size}/{deck.cards.length} cards)
            </p>
            <div className="h-2 bg-ink-100 rounded-full mb-6">
              <div className="h-full bg-gold-400 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <div className="space-y-2">
              <Button variant="gold" className="w-full" onClick={() => {
                resetDeckProgress(deck.id);
                onDone();
              }}>
                <RotateCcw className="w-4 h-4 mr-2" />Study again from scratch
              </Button>
              <Button variant="secondary" className="w-full" onClick={onDone}>
                Back to decks
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 flex items-center justify-between">
        <button onClick={onDone} className="flex items-center text-ink-500 hover:text-ink-700 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />Decks
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-500">{idx + 1}/{queue.length}</span>
          {card.cardType !== 'basic' && (
            <Badge variant="outline">{card.cardType}</Badge>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-4">
        <div className="h-1.5 bg-ink-100 rounded-full">
          <div className="h-full bg-gold-400 rounded-full transition-all"
            style={{ width: `${Math.round((idx / queue.length) * 100)}%` }} />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div key={`${idx}-${flipped}`}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}>

              {/* Front */}
              <div className={`bg-white rounded-2xl border-2 p-8 min-h-48 flex flex-col justify-center transition-colors ${
                flipped ? 'border-ink-100' : 'border-gold-200 cursor-pointer hover:border-gold-400'
              }`} onClick={handleFlip}>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Front</p>
                <div className="font-display text-xl text-ink-800 leading-relaxed text-center anki-content"
                  dangerouslySetInnerHTML={{ __html: card.front }} />
                {!flipped && (
                  <p className="text-sm text-ink-400 text-center mt-6">Tap to reveal answer</p>
                )}
              </div>

              {/* Back (revealed) */}
              {flipped && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="mt-3 bg-sage-50 rounded-2xl border-2 border-sage-200 p-8 min-h-32 flex flex-col justify-center">
                    <p className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-4">Back</p>
                    <div className="font-display text-xl text-ink-800 leading-relaxed text-center anki-content"
                      dangerouslySetInnerHTML={{ __html: card.back }} />
                  </div>

                  {card.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-3 justify-center">
                      {card.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-ink-100 text-ink-500 text-xs rounded-full">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Rating buttons */}
                  <div className="grid grid-cols-3 gap-3 mt-5">
                    <button onClick={() => handleRate('again')}
                      className="p-4 rounded-xl bg-coral-100 border-2 border-coral-200 hover:bg-coral-200 transition-all text-center">
                      <p className="font-bold text-coral-700">Again</p>
                      <p className="text-xs text-coral-500 mt-0.5">Didn't know</p>
                    </button>
                    <button onClick={() => handleRate('good')}
                      className="p-4 rounded-xl bg-gold-100 border-2 border-gold-200 hover:bg-gold-200 transition-all text-center">
                      <p className="font-bold text-gold-700">Good</p>
                      <p className="text-xs text-gold-500 mt-0.5">Knew it</p>
                    </button>
                    <button onClick={() => handleRate('easy')}
                      className="p-4 rounded-xl bg-sage-100 border-2 border-sage-200 hover:bg-sage-200 transition-all text-center">
                      <p className="font-bold text-sage-700">Easy</p>
                      <p className="text-xs text-sage-500 mt-0.5">Too easy</p>
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnkiPage() {
  const [activeDeck, setActiveDeck] = useState<AnkiDeck | null>(null);

  if (activeDeck) {
    return <CardReviewer deck={activeDeck} onDone={() => setActiveDeck(null)} />;
  }
  return <DeckLibrary onPlay={setActiveDeck} />;
}
