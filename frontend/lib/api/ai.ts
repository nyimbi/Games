/**
 * AI client — LiteLLM-backed helpers for AI-dependent practice games.
 */

import { fetcher } from './client';

export interface GradeSentenceRequest {
	sentence: string;
	target_word: string;
	required_elements?: string[];
}

export interface GradeSentenceResponse {
	used_correctly: boolean;
	included_all: boolean;
	feedback: string;
	score: number;
}

export interface GradeStoryProblemRequest {
	kid_story: string;
	equation: string;
}

export interface GradeStoryProblemResponse {
	matches_equation: boolean;
	makes_sense: boolean;
	feedback: string;
	score: number;
	example_story: string;
}

export interface GenerateWordCluesRequest {
	word: string;
	pos?: string | null;
	definition?: string | null;
}

export interface GenerateWordCluesResponse {
	word: string;
	clues: string[];
}

export const aiApi = {
	gradeSentence: (req: GradeSentenceRequest) =>
		fetcher<GradeSentenceResponse>('/ai/grade-sentence', {
			method: 'POST',
			body: JSON.stringify(req),
		}),

	gradeStoryProblem: (req: GradeStoryProblemRequest) =>
		fetcher<GradeStoryProblemResponse>('/ai/grade-story-problem', {
			method: 'POST',
			body: JSON.stringify(req),
		}),

	generateWordClues: (req: GenerateWordCluesRequest) =>
		fetcher<GenerateWordCluesResponse>('/ai/generate-word-clues', {
			method: 'POST',
			body: JSON.stringify(req),
		}),
};
