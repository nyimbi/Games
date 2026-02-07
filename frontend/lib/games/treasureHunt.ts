/**
 * Treasure Hunt — map data, progress management, and challenge generation.
 */

import type { Question } from './types';
import { getQuestionsBySubject, getMixedQuestions } from './questions';

export interface MapRegion {
  id: string;
  name: string;
  subject: string;
  icon: string;
  color: string; // tailwind color class
  locations: MapLocation[];
}

export interface MapLocation {
  id: string;
  name: string;
  isBoss: boolean;
  questionsCount: number; // 3-5 questions per location
}

export interface TreasureHuntProgress {
  regions: Record<string, Record<string, { stars: number; completed: boolean }>>;
  totalStars: number;
  treasureCollection: string[];
  dailyBonusClaimed: string | null; // ISO date
}

export const MAP_REGIONS: MapRegion[] = [
  {
    id: 'science_volcano',
    name: 'Science Volcano',
    subject: 'science',
    icon: '\u{1F30B}',
    color: 'sage',
    locations: [
      { id: 'sv1', name: 'Base Camp', isBoss: false, questionsCount: 3 },
      { id: 'sv2', name: 'Mineral Cave', isBoss: false, questionsCount: 3 },
      { id: 'sv3', name: 'Fossil Ridge', isBoss: false, questionsCount: 3 },
      { id: 'sv4', name: 'Crystal Pool', isBoss: false, questionsCount: 4 },
      { id: 'sv5', name: 'Lava Lab', isBoss: false, questionsCount: 3 },
      { id: 'sv6', name: 'Steam Vent', isBoss: false, questionsCount: 4 },
      { id: 'sv7', name: 'Observatory', isBoss: false, questionsCount: 3 },
      { id: 'sv8', name: 'Magma Core', isBoss: false, questionsCount: 4 },
      { id: 'sv9', name: 'Summit Trail', isBoss: false, questionsCount: 5 },
      { id: 'sv10', name: 'Volcano Summit', isBoss: true, questionsCount: 5 },
    ],
  },
  {
    id: 'social_studies_city',
    name: 'Social Studies City',
    subject: 'social_studies',
    icon: '\u{1F3DB}\uFE0F',
    color: 'coral',
    locations: [
      { id: 'sc1', name: 'City Gate', isBoss: false, questionsCount: 3 },
      { id: 'sc2', name: 'Market Square', isBoss: false, questionsCount: 3 },
      { id: 'sc3', name: 'History Museum', isBoss: false, questionsCount: 3 },
      { id: 'sc4', name: 'Town Hall', isBoss: false, questionsCount: 4 },
      { id: 'sc5', name: 'Library Archives', isBoss: false, questionsCount: 3 },
      { id: 'sc6', name: 'Court of Justice', isBoss: false, questionsCount: 4 },
      { id: 'sc7', name: 'Embassy Row', isBoss: false, questionsCount: 3 },
      { id: 'sc8', name: 'Parliament', isBoss: false, questionsCount: 4 },
      { id: 'sc9', name: 'Clock Tower', isBoss: false, questionsCount: 5 },
      { id: 'sc10', name: 'City Summit', isBoss: true, questionsCount: 5 },
    ],
  },
  {
    id: 'arts_gallery',
    name: 'Arts Gallery',
    subject: 'arts',
    icon: '\u{1F3A8}',
    color: 'gold',
    locations: [
      { id: 'ag1', name: 'Entrance Hall', isBoss: false, questionsCount: 3 },
      { id: 'ag2', name: 'Sculpture Garden', isBoss: false, questionsCount: 3 },
      { id: 'ag3', name: 'Music Room', isBoss: false, questionsCount: 3 },
      { id: 'ag4', name: 'Portrait Wing', isBoss: false, questionsCount: 4 },
      { id: 'ag5', name: 'Modern Art Lab', isBoss: false, questionsCount: 3 },
      { id: 'ag6', name: 'Dance Studio', isBoss: false, questionsCount: 4 },
      { id: 'ag7', name: 'Theater Stage', isBoss: false, questionsCount: 3 },
      { id: 'ag8', name: 'Film Archive', isBoss: false, questionsCount: 4 },
      { id: 'ag9', name: 'Grand Ballroom', isBoss: false, questionsCount: 5 },
      { id: 'ag10', name: 'Masterpiece Vault', isBoss: true, questionsCount: 5 },
    ],
  },
  {
    id: 'literature_library',
    name: 'Literature Library',
    subject: 'literature',
    icon: '\u{1F4DA}',
    color: 'ink',
    locations: [
      { id: 'll1', name: 'Reading Nook', isBoss: false, questionsCount: 3 },
      { id: 'll2', name: 'Poetry Corner', isBoss: false, questionsCount: 3 },
      { id: 'll3', name: 'Fiction Floor', isBoss: false, questionsCount: 3 },
      { id: 'll4', name: 'Mythology Alcove', isBoss: false, questionsCount: 4 },
      { id: 'll5', name: 'Drama Stage', isBoss: false, questionsCount: 3 },
      { id: 'll6', name: 'Science Fiction Wing', isBoss: false, questionsCount: 4 },
      { id: 'll7', name: 'Classic Literature', isBoss: false, questionsCount: 3 },
      { id: 'll8', name: 'World Literature', isBoss: false, questionsCount: 4 },
      { id: 'll9', name: 'Author\'s Attic', isBoss: false, questionsCount: 5 },
      { id: 'll10', name: 'Grand Archive', isBoss: true, questionsCount: 5 },
    ],
  },
  {
    id: 'special_observatory',
    name: 'Special Observatory',
    subject: 'special_area',
    icon: '\u{1F52D}',
    color: 'purple',
    locations: [
      { id: 'so1', name: 'Welcome Deck', isBoss: false, questionsCount: 3 },
      { id: 'so2', name: 'Logic Lab', isBoss: false, questionsCount: 3 },
      { id: 'so3', name: 'Puzzle Room', isBoss: false, questionsCount: 3 },
      { id: 'so4', name: 'Strategy Center', isBoss: false, questionsCount: 4 },
      { id: 'so5', name: 'Pattern Gallery', isBoss: false, questionsCount: 3 },
      { id: 'so6', name: 'Code Chamber', isBoss: false, questionsCount: 4 },
      { id: 'so7', name: 'Discovery Bay', isBoss: false, questionsCount: 3 },
      { id: 'so8', name: 'Innovation Hub', isBoss: false, questionsCount: 4 },
      { id: 'so9', name: 'Star Map', isBoss: false, questionsCount: 5 },
      { id: 'so10', name: 'Observatory Peak', isBoss: true, questionsCount: 5 },
    ],
  },
];

// Bridge challenges between regions (mixed subjects)
export const BRIDGE_CHALLENGES = [
  { id: 'bridge_1', name: 'Science-Society Bridge', from: 'science_volcano', to: 'social_studies_city', icon: '\u{1F309}' },
  { id: 'bridge_2', name: 'Society-Arts Bridge', from: 'social_studies_city', to: 'arts_gallery', icon: '\u{1F309}' },
  { id: 'bridge_3', name: 'Arts-Literature Bridge', from: 'arts_gallery', to: 'literature_library', icon: '\u{1F309}' },
  { id: 'bridge_4', name: 'Literature-Special Bridge', from: 'literature_library', to: 'special_observatory', icon: '\u{1F309}' },
];

export function getDefaultProgress(): TreasureHuntProgress {
  const regions: TreasureHuntProgress['regions'] = {};
  for (const region of MAP_REGIONS) {
    regions[region.id] = {};
    for (const loc of region.locations) {
      regions[region.id][loc.id] = { stars: 0, completed: false };
    }
  }
  for (const bridge of BRIDGE_CHALLENGES) {
    if (!regions['bridges']) regions['bridges'] = {};
    regions['bridges'][bridge.id] = { stars: 0, completed: false };
  }
  return { regions, totalStars: 0, treasureCollection: [], dailyBonusClaimed: null };
}

export function isLocationUnlocked(
  regionId: string,
  locationIndex: number,
  progress: TreasureHuntProgress
): boolean {
  if (locationIndex === 0) return true;
  const region = MAP_REGIONS.find(r => r.id === regionId);
  if (!region) return false;
  const prevLoc = region.locations[locationIndex - 1];
  return progress.regions[regionId]?.[prevLoc.id]?.completed ?? false;
}

export function calculateStars(correct: number, total: number): number {
  const pct = correct / total;
  if (pct >= 1) return 3;
  if (pct >= 0.6) return 2;
  if (correct > 0) return 1;
  return 0;
}

export function getQuestionsForLocation(
  subject: string,
  count: number
): Question[] {
  return getQuestionsBySubject(subject, undefined, count);
}

export function isRegionComplete(regionId: string, progress: TreasureHuntProgress): boolean {
  const region = MAP_REGIONS.find(r => r.id === regionId);
  if (!region) return false;
  return region.locations.every(loc => progress.regions[regionId]?.[loc.id]?.completed);
}
