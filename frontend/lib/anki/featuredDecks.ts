// Metadata for decks distributed as .apkg files under /public/anki-decks/
// Run `pnpm run generate-decks` to regenerate the .apkg files.

export interface FeaturedDeck {
  slug: string;
  name: string;
  cardCount: number;
}

export const FEATURED_DECKS: FeaturedDeck[] = [
  { slug: 'music-notes',        name: '🎵 Reading Musical Notes',                    cardCount: 74  },
  { slug: 'swahili-greetings',  name: '🇰🇪 Swahili: Greetings, Phrases & Travel',     cardCount: 110 },
  { slug: 'swahili-numbers',    name: '🔢 Swahili: Numbers, Time, Calendar & Colors', cardCount: 146 },
  { slug: 'swahili-vocabulary', name: '🗣️ Swahili: Nouns, Verbs & Adjectives',        cardCount: 387 },
  { slug: 'periodic-table',     name: '⚗️ Periodic Table Memory Pegs',               cardCount: 118 },
];

export function apkgPath(slug: string): string {
  return `/anki-decks/${slug}.apkg`;
}
