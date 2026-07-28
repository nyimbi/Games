/**
 * Anki .apkg parser — runs entirely in the browser.
 * .apkg = ZIP containing collection.anki2 (SQLite) + media files.
 * sql.js WASM is loaded from CDN to avoid webpack config changes.
 */

import JSZip from 'jszip';

export interface AnkiCard {
  id: number;
  front: string;       // HTML
  back: string;        // HTML
  tags: string[];
  cardType: 'basic' | 'cloze' | 'other';
}

export interface AnkiDeck {
  id: string;          // UUID-like stable key for localStorage
  name: string;
  importedAt: number;
  cards: AnkiCard[];
}

// Resolve cloze markup: {{c1::answer::hint}} → shows [hint] on front, answer revealed on back
function resolveCloze(text: string): { front: string; back: string } {
  const back = text.replace(/\{\{c\d+::(.*?)(?:::[^}]*)?\}\}/g, '<strong>$1</strong>');
  const front = text.replace(/\{\{c\d+::(?:.*?)(?:::([^}]*))?\}\}/g, (_, hint) =>
    hint ? `<span class="anki-cloze">[${hint}]</span>` : '<span class="anki-cloze">[...]</span>'
  );
  return { front, back };
}

function isClozeField(s: string): boolean {
  return /\{\{c\d+::/.test(s);
}

// Strip Anki sound/image tags that can't render in browser without media files
function cleanField(s: string): string {
  return s
    .replace(/\[sound:[^\]]*\]/g, '')          // [sound:foo.mp3]
    .replace(/<img[^>]*src="[^"]*"[^>]*>/g, s => {
      // Keep data-URI images, strip file references
      if (s.includes('data:')) return s;
      return '<span class="anki-media">[image]</span>';
    })
    .trim();
}

export async function parseApkg(file: File): Promise<AnkiDeck[]> {
  // 1. Unzip
  const zip = await JSZip.loadAsync(file);

  // .apkg may contain collection.anki2 or collection.anki21
  const dbEntry = zip.file('collection.anki21') ?? zip.file('collection.anki2');
  if (!dbEntry) throw new Error('Not a valid .apkg file (no collection database found)');

  const dbBuffer = await dbEntry.async('arraybuffer');

  // 2. Load sql.js WASM from CDN
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs({
    locateFile: (f: string) =>
      `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.14.1/${f}`,
  });

  const db = new SQL.Database(new Uint8Array(dbBuffer));

  // 3. Read deck names from col.decks JSON
  const colRows = db.exec('SELECT decks FROM col LIMIT 1');
  const decksJson: Record<string, { id: number; name: string }> = colRows[0]
    ? JSON.parse(colRows[0].values[0][0] as string)
    : {};

  const deckIdToName: Record<number, string> = {};
  for (const d of Object.values(decksJson)) {
    deckIdToName[d.id] = d.name;
  }

  // 4. Read models (note types) to know field order
  const modelsRows = db.exec('SELECT models FROM col LIMIT 1');
  const modelsJson: Record<string, {
    id: number; name: string; type: number;
    flds: Array<{ name: string; ord: number }>;
    tmpls: Array<{ name: string; ord: number; qfmt: string; afmt: string }>;
  }> = modelsRows[0]
    ? JSON.parse(modelsRows[0].values[0][0] as string)
    : {};

  // 5. Read notes + cards
  const rows = db.exec(`
    SELECT n.id, n.flds, n.tags, n.mid, c.did
    FROM notes n
    JOIN cards c ON c.nid = n.id
    GROUP BY n.id
  `);

  db.close();

  if (!rows[0]) return [];

  // Group cards by deck
  const deckMap = new Map<number, AnkiCard[]>();

  for (const row of rows[0].values) {
    const [noteId, fldsRaw, tagsRaw, mid, did] = row as [number, string, string, number, number];

    const fields = (fldsRaw as string).split('\x1f').map(cleanField);
    const tags = (tagsRaw as string).trim().split(/\s+/).filter(Boolean);
    const model = modelsJson[String(mid)];
    const isType1 = model?.type === 1; // 1 = cloze

    let front: string;
    let back: string;
    let cardType: AnkiCard['cardType'];

    if (isType1 || isClozeField(fields[0])) {
      const resolved = resolveCloze(fields[0]);
      front = resolved.front;
      back = resolved.back;
      cardType = 'cloze';
    } else if (fields.length >= 2) {
      front = fields[0];
      back = fields[1] || fields[0];
      cardType = 'basic';
    } else {
      front = fields[0];
      back = fields[0];
      cardType = 'other';
    }

    if (!front.trim()) continue;

    const card: AnkiCard = { id: noteId as number, front, back, tags, cardType };
    const deckId = did as number;
    if (!deckMap.has(deckId)) deckMap.set(deckId, []);
    deckMap.get(deckId)!.push(card);
  }

  // 6. Build deck objects
  const decks: AnkiDeck[] = [];
  for (const [deckId, cards] of deckMap) {
    const name = deckIdToName[deckId] ?? 'Imported Deck';
    // Skip the special "Default" deck if empty
    if (cards.length === 0) continue;
    decks.push({
      id: `${file.name}-${deckId}-${Date.now()}`,
      name,
      importedAt: Date.now(),
      cards,
    });
  }

  return decks;
}

// ─── localStorage persistence ─────────────────────────────────────────────────

const STORAGE_KEY = 'anki_decks';

export function getSavedDecks(): AnkiDeck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveDeck(deck: AnkiDeck): void {
  const all = getSavedDecks().filter(d => d.id !== deck.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([deck, ...all]));
}

export function deleteDeck(id: string): void {
  const all = getSavedDecks().filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  localStorage.removeItem(`anki_progress_${id}`);
}

// Per-deck review progress: tracks which card indices have been seen
export function getDeckProgress(id: string): Set<number> {
  try {
    const raw = localStorage.getItem(`anki_progress_${id}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

export function saveDeckProgress(id: string, seen: Set<number>): void {
  localStorage.setItem(`anki_progress_${id}`, JSON.stringify([...seen]));
}

export function resetDeckProgress(id: string): void {
  localStorage.removeItem(`anki_progress_${id}`);
}
