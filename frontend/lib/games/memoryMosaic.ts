/**
 * Memory Mosaic — grid logic, scoring, and progression.
 */

export interface GridConfig {
  rows: number;
  cols: number;
  pairs: number;
  timeSeconds: number;
  name: string;
}

export const GRID_CONFIGS: GridConfig[] = [
  { rows: 3, cols: 4, pairs: 6, timeSeconds: 60, name: '3x4' },
  { rows: 4, cols: 4, pairs: 8, timeSeconds: 90, name: '4x4' },
  { rows: 4, cols: 6, pairs: 12, timeSeconds: 150, name: '4x6' },
  { rows: 6, cols: 6, pairs: 18, timeSeconds: 240, name: '6x6' },
];

export interface MosaicTile {
  id: string;
  pairId: string;
  text: string;
  subject: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function calculateScore(
  combo: number,
  timeRemaining: number,
  totalMisses: number,
  totalPairs: number
): { matchScore: number; comboBonus: number; timeBonus: number; perfectBonus: number; total: number } {
  const matchScore = 100;
  let comboBonus = 0;
  if (combo >= 5) comboBonus = 100;
  else if (combo >= 3) comboBonus = 50;
  else if (combo >= 2) comboBonus = 25;

  const timeBonus = timeRemaining * 5;
  const perfectBonus = totalMisses === 0 ? 500 : 0;

  return {
    matchScore,
    comboBonus,
    timeBonus,
    perfectBonus,
    total: matchScore + comboBonus + timeBonus + perfectBonus,
  };
}

export interface MosaicRecords {
  bestScores: Record<string, number>;
  completedGrids: string[];
  bestCombo: number;
  perfectGames: number;
}
