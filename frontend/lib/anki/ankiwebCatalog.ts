// Curated AnkiWeb shared decks — open the info page, download .apkg, then import here.

export interface AnkiWebDeck {
  id: number;
  name: string;
  subject: string;
  description: string;
  cardCount: number;
}

export const ANKIWEB_CATALOG: AnkiWebDeck[] = [
  {
    id: 1251099816,
    name: 'Countries: Map, Capital, Flag, Population & Languages',
    subject: 'Geography',
    description: 'Comprehensive world geography — every country with its map, capital, flag, population, area, and languages.',
    cardCount: 1200,
  },
  {
    id: 1080597248,
    name: 'World Capitals',
    subject: 'Geography',
    description: 'Country → capital flashcards for every recognized country.',
    cardCount: 195,
  },
  {
    id: 483356496,
    name: 'Periodic Table of Elements',
    subject: 'Chemistry',
    description: 'All 118 elements — symbol, name, atomic number, and key properties.',
    cardCount: 118,
  },
  {
    id: 1444757005,
    name: 'Comprehensive Swahili Vocabulary (~5000 items)',
    subject: 'Swahili',
    description: 'The most complete Swahili–English vocabulary deck on AnkiWeb, covering everyday speech, grammar, and idioms.',
    cardCount: 5000,
  },
  {
    id: 50460602,
    name: 'Swahili Core 100 — Basic Words with Audio',
    subject: 'Swahili',
    description: 'The 100 most essential Swahili words with native-speaker audio pronunciations.',
    cardCount: 100,
  },
  {
    id: 86901764,
    name: 'Simplified Swahili (Complete)',
    subject: 'Swahili',
    description: 'Full beginner-to-intermediate Swahili course in flashcard form.',
    cardCount: 800,
  },
  {
    id: 504732926,
    name: 'Musical Notes — Bass and Treble Clefs',
    subject: 'Music',
    description: 'Drill reading notes on both staves with visual card fronts showing notation.',
    cardCount: 150,
  },
  {
    id: 1529463835,
    name: 'Music Theory (5 Decks)',
    subject: 'Music',
    description: 'Covers intervals, chords, scales, rhythm, and ear training across five sub-decks.',
    cardCount: 600,
  },
  {
    id: 1929749472,
    name: 'Fundamentals of Music Theory',
    subject: 'Music',
    description: 'Notation, time signatures, key signatures, intervals, and chord construction.',
    cardCount: 300,
  },
  {
    id: 2146896141,
    name: 'General Music Theory',
    subject: 'Music',
    description: 'Broad survey of music theory concepts from basics to advanced harmony.',
    cardCount: 400,
  },
  {
    id: 275584315,
    name: 'Periodic Table with Atomic Data',
    subject: 'Chemistry',
    description: 'Elements with atomic mass, electron configuration, electronegativity, and other key data.',
    cardCount: 118,
  },
  {
    id: 461172745,
    name: "Swahili Beginner's Deck",
    subject: 'Swahili',
    description: "Structured vocabulary for absolute beginners — greetings, numbers, family, and daily objects.",
    cardCount: 250,
  },
];

export function ankiWebInfoUrl(id: number): string {
  return `https://ankiweb.net/shared/info/${id}`;
}
