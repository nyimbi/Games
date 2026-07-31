/**
 * Vault hooks — the primitives every practice game consumes.
 *
 * useFactVault: pulls due math facts + records attempts
 * useWordVault: pulls due words + records encounters
 * useVaultStats: mastery snapshot for landing page
 * useWarmup: personalized 5+5 pre-session digest
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
	FactAttempt,
	FactCatalogItem,
	FactDueResponse,
	FactType,
	FactVaultItem,
	VaultStats,
	vaultApi,
	WordCatalogItem,
	WordDueResponse,
	WordEncounter,
	WordVaultItem,
	WrongAnswerDigest,
} from '@/lib/api/vault';

// --------------------------------------------------------------------------
// useFactVault — for math drill games
// --------------------------------------------------------------------------

export interface UseFactVaultOpts {
	factType?: FactType;
	limit?: number;
	autoLoad?: boolean;
}

export interface UseFactVaultResult {
	dueItems: FactVaultItem[];
	catalog: FactCatalogItem[];
	stats: { sticky: number; learning: number; mastered: number };
	loading: boolean;
	error: string | null;
	recordAttempt: (attempt: Omit<FactAttempt, 'game_id'> & { game_id: string }) => Promise<FactVaultItem | null>;
	refreshDue: () => Promise<void>;
	loadCatalog: (params?: { tier?: number }) => Promise<void>;
}

export function useFactVault(opts: UseFactVaultOpts = {}): UseFactVaultResult {
	const { factType, limit = 20, autoLoad = true } = opts;
	const [dueItems, setDueItems] = useState<FactVaultItem[]>([]);
	const [catalog, setCatalog] = useState<FactCatalogItem[]>([]);
	const [stats, setStats] = useState({ sticky: 0, learning: 0, mastered: 0 });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const mounted = useRef(true);

	useEffect(() => {
		return () => { mounted.current = false; };
	}, []);

	const refreshDue = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res: FactDueResponse = await vaultApi.getDueFacts({ limit, fact_type: factType });
			if (!mounted.current) return;
			setDueItems(res.items);
			setStats({
				sticky: res.sticky_count,
				learning: res.learning_count,
				mastered: res.mastered_count,
			});
		} catch (e) {
			if (mounted.current) setError(e instanceof Error ? e.message : 'Failed to load');
		} finally {
			if (mounted.current) setLoading(false);
		}
	}, [factType, limit]);

	const loadCatalog = useCallback(async (params?: { tier?: number }) => {
		try {
			const res = await vaultApi.getFactCatalog({ fact_type: factType, tier: params?.tier });
			if (mounted.current) setCatalog(res.facts);
		} catch (e) {
			if (mounted.current) setError(e instanceof Error ? e.message : 'Failed to load catalog');
		}
	}, [factType]);

	const recordAttempt = useCallback(
		async (attempt: FactAttempt) => vaultApi.recordFactAttempt(attempt),
		[],
	);

	useEffect(() => {
		if (autoLoad) void refreshDue();
	}, [autoLoad, refreshDue]);

	return { dueItems, catalog, stats, loading, error, recordAttempt, refreshDue, loadCatalog };
}

// --------------------------------------------------------------------------
// useWordVault — for vocab games
// --------------------------------------------------------------------------

export interface UseWordVaultOpts {
	limit?: number;
	autoLoad?: boolean;
}

export interface UseWordVaultResult {
	dueItems: WordVaultItem[];
	catalog: WordCatalogItem[];
	stats: { totalSeen: number; mastered: number; sticky: number };
	loading: boolean;
	error: string | null;
	recordEncounter: (enc: WordEncounter) => Promise<WordVaultItem | null>;
	refreshDue: () => Promise<void>;
	loadCatalog: (params?: { level?: number; pos?: string; hasMorphology?: boolean }) => Promise<void>;
}

export function useWordVault(opts: UseWordVaultOpts = {}): UseWordVaultResult {
	const { limit = 20, autoLoad = true } = opts;
	const [dueItems, setDueItems] = useState<WordVaultItem[]>([]);
	const [catalog, setCatalog] = useState<WordCatalogItem[]>([]);
	const [stats, setStats] = useState({ totalSeen: 0, mastered: 0, sticky: 0 });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const mounted = useRef(true);

	useEffect(() => {
		return () => { mounted.current = false; };
	}, []);

	const refreshDue = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res: WordDueResponse = await vaultApi.getDueWords({ limit });
			if (!mounted.current) return;
			setDueItems(res.items);
			setStats({
				totalSeen: res.total_seen,
				mastered: res.mastered_count,
				sticky: res.sticky_count,
			});
		} catch (e) {
			if (mounted.current) setError(e instanceof Error ? e.message : 'Failed to load');
		} finally {
			if (mounted.current) setLoading(false);
		}
	}, [limit]);

	const loadCatalog = useCallback(
		async (params?: { level?: number; pos?: string; hasMorphology?: boolean }) => {
			try {
				const res = await vaultApi.getWordCatalog({
					level: params?.level,
					pos: params?.pos,
					has_morphology: params?.hasMorphology,
				});
				if (mounted.current) setCatalog(res.words);
			} catch (e) {
				if (mounted.current) setError(e instanceof Error ? e.message : 'Failed to load catalog');
			}
		},
		[],
	);

	const recordEncounter = useCallback(
		async (enc: WordEncounter) => vaultApi.recordWordEncounter(enc),
		[],
	);

	useEffect(() => {
		if (autoLoad) void refreshDue();
	}, [autoLoad, refreshDue]);

	return { dueItems, catalog, stats, loading, error, recordEncounter, refreshDue, loadCatalog };
}

// --------------------------------------------------------------------------
// useVaultStats — landing page summary
// --------------------------------------------------------------------------

export function useVaultStats(): {
	stats: VaultStats | null;
	loading: boolean;
	refresh: () => Promise<void>;
} {
	const [stats, setStats] = useState<VaultStats | null>(null);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		setLoading(true);
		try {
			const s = await vaultApi.getStats();
			setStats(s);
		} catch {
			setStats(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { void refresh(); }, [refresh]);
	return { stats, loading, refresh };
}

// --------------------------------------------------------------------------
// useWarmup — personalized 5+5 pre-session digest
// --------------------------------------------------------------------------

export function useWarmup(opts?: { facts?: number; words?: number }): {
	digest: WrongAnswerDigest | null;
	loading: boolean;
	refresh: () => Promise<void>;
} {
	const [digest, setDigest] = useState<WrongAnswerDigest | null>(null);
	const [loading, setLoading] = useState(true);
	const factsN = opts?.facts;
	const wordsN = opts?.words;

	const refresh = useCallback(async () => {
		setLoading(true);
		try {
			const d = await vaultApi.getWarmup({ facts: factsN, words: wordsN });
			setDigest(d);
		} catch {
			setDigest(null);
		} finally {
			setLoading(false);
		}
	}, [factsN, wordsN]);

	useEffect(() => { void refresh(); }, [refresh]);
	return { digest, loading, refresh };
}
