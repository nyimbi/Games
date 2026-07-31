/**
 * Vault API client — shared mastery engine for math facts and vocabulary.
 * Every practice game reads "due items" and posts attempts back through here.
 */

import { fetcher } from './client';

// --------------------------------------------------------------------------
// Types (mirror src/games/models/vault.py)
// --------------------------------------------------------------------------

export type FactType = 'mult' | 'div' | 'add' | 'sub' | 'frac_eq' | 'frac_cmp';
export type FactStatus = 'learning' | 'sticky' | 'mastered';
export type WordMode = 'cloze' | 'morph' | 'network' | 'prod' | 'sound' | 'defn';

export interface FactVaultItem {
	user_id: number;
	fact_id: string;
	fact_type: FactType;
	operands: unknown[];
	answer: string;
	attempts: number;
	correct: number;
	avg_ms: number;
	status: FactStatus;
	ease: number;
	interval_hours: number;
	last_seen_at: string | null;
	due_at: string;
}

export interface WordVaultItem {
	user_id: number;
	word: string;
	pos: string | null;
	mastery_level: number;
	encounters_count: number;
	correct_count: number;
	distinct_games: number;
	ease: number;
	interval_hours: number;
	last_seen_at: string | null;
	due_at: string;
}

export interface FactAttempt {
	fact_id: string;
	fact_type: FactType;
	operands: unknown[];
	answer: string;
	game_id: string;
	correct: boolean;
	ms: number;
}

export interface WordEncounter {
	word: string;
	pos?: string | null;
	game_id: string;
	mode: WordMode;
	correct: boolean;
	ms?: number | null;
}

export interface FactDueResponse {
	items: FactVaultItem[];
	sticky_count: number;
	learning_count: number;
	mastered_count: number;
}

export interface WordDueResponse {
	items: WordVaultItem[];
	total_seen: number;
	mastered_count: number;
	sticky_count: number;
}

export interface VaultStats {
	facts_total: number;
	facts_mastered: number;
	facts_sticky: number;
	facts_learning: number;
	words_seen: number;
	words_mastered: number;
	words_sticky: number;
	last_practice_at: string | null;
}

export interface WrongAnswerDigest {
	facts: FactVaultItem[];
	words: WordVaultItem[];
}

// Catalog types
export interface FactCatalogItem {
	fact_id: string;
	fact_type: FactType;
	operands: unknown[];
	answer: string;
	tier: number;
}

export interface WordCatalogItem {
	word: string;
	pos?: string;
	level: number;
	definition: string;
	example: string;
	morphology?: { prefix?: string; root?: string; suffix?: string };
	family?: string[];
	synonyms?: string[];
	antonyms?: string[];
}

// --------------------------------------------------------------------------
// Offline queue — buffer failed attempts, flush on next success
// --------------------------------------------------------------------------

const OFFLINE_KEY = 'vault_offline_queue';

interface QueuedItem {
	kind: 'fact' | 'word';
	payload: FactAttempt | WordEncounter;
	at: number;
}

function readQueue(): QueuedItem[] {
	if (typeof window === 'undefined') return [];
	try {
		return JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]');
	} catch {
		return [];
	}
}

function writeQueue(items: QueuedItem[]): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(OFFLINE_KEY, JSON.stringify(items));
	} catch {
		/* quota / private mode — silently drop */
	}
}

async function flushQueue(): Promise<void> {
	const queue = readQueue();
	if (queue.length === 0) return;
	const remaining: QueuedItem[] = [];
	for (const item of queue) {
		try {
			if (item.kind === 'fact') {
				await fetcher('/vault/fact/attempt', {
					method: 'POST',
					body: JSON.stringify(item.payload),
				});
			} else {
				await fetcher('/vault/word/encounter', {
					method: 'POST',
					body: JSON.stringify(item.payload),
				});
			}
		} catch {
			remaining.push(item);
		}
	}
	writeQueue(remaining);
}

// --------------------------------------------------------------------------
// API surface
// --------------------------------------------------------------------------

export const vaultApi = {
	// --- Facts ---
	recordFactAttempt: async (attempt: FactAttempt): Promise<FactVaultItem | null> => {
		try {
			const item = await fetcher<FactVaultItem>('/vault/fact/attempt', {
				method: 'POST',
				body: JSON.stringify(attempt),
			});
			void flushQueue();
			return item;
		} catch {
			const q = readQueue();
			q.push({ kind: 'fact', payload: attempt, at: Date.now() });
			writeQueue(q);
			return null;
		}
	},

	getDueFacts: (params?: { limit?: number; fact_type?: FactType }) => {
		const sp = new URLSearchParams();
		if (params?.limit) sp.set('limit', String(params.limit));
		if (params?.fact_type) sp.set('fact_type', params.fact_type);
		const qs = sp.toString();
		return fetcher<FactDueResponse>(`/vault/fact/due${qs ? `?${qs}` : ''}`);
	},

	getRecentWrongFacts: (limit = 10) =>
		fetcher<{ items: (FactVaultItem & { miss_count: number })[] }>(
			`/vault/fact/wrong-recent?limit=${limit}`,
		),

	// --- Words ---
	recordWordEncounter: async (enc: WordEncounter): Promise<WordVaultItem | null> => {
		try {
			const item = await fetcher<WordVaultItem>('/vault/word/encounter', {
				method: 'POST',
				body: JSON.stringify(enc),
			});
			void flushQueue();
			return item;
		} catch {
			const q = readQueue();
			q.push({ kind: 'word', payload: enc, at: Date.now() });
			writeQueue(q);
			return null;
		}
	},

	getDueWords: (params?: { limit?: number }) => {
		const sp = new URLSearchParams();
		if (params?.limit) sp.set('limit', String(params.limit));
		const qs = sp.toString();
		return fetcher<WordDueResponse>(`/vault/word/due${qs ? `?${qs}` : ''}`);
	},

	// --- Aggregate ---
	getStats: () => fetcher<VaultStats>('/vault/stats'),

	getWarmup: (params?: { facts?: number; words?: number }) => {
		const sp = new URLSearchParams();
		if (params?.facts !== undefined) sp.set('facts', String(params.facts));
		if (params?.words !== undefined) sp.set('words', String(params.words));
		const qs = sp.toString();
		return fetcher<WrongAnswerDigest>(`/vault/warmup${qs ? `?${qs}` : ''}`);
	},

	// --- Catalog ---
	getFactCatalog: (params?: { fact_type?: FactType; tier?: number }) => {
		const sp = new URLSearchParams();
		if (params?.fact_type) sp.set('fact_type', params.fact_type);
		if (params?.tier) sp.set('tier', String(params.tier));
		const qs = sp.toString();
		return fetcher<{ facts: FactCatalogItem[]; count: number }>(
			`/vault/catalog/facts${qs ? `?${qs}` : ''}`,
		);
	},

	getWordCatalog: (params?: { level?: number; pos?: string; has_morphology?: boolean }) => {
		const sp = new URLSearchParams();
		if (params?.level) sp.set('level', String(params.level));
		if (params?.pos) sp.set('pos', params.pos);
		if (params?.has_morphology) sp.set('has_morphology', 'true');
		const qs = sp.toString();
		return fetcher<{ words: WordCatalogItem[]; count: number }>(
			`/vault/catalog/words${qs ? `?${qs}` : ''}`,
		);
	},

	getWordDetail: (word: string) =>
		fetcher<WordCatalogItem>(`/vault/catalog/word/${encodeURIComponent(word)}`),

	flushOfflineQueue: flushQueue,
};
