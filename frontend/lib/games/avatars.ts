export interface AnimalAvatar {
  id: string;
  emoji: string;
  name: string;
  color: string;
}

export const ANIMAL_AVATARS: AnimalAvatar[] = [
  { id: 'fox', emoji: '🦊', name: 'Fox', color: '#F97316' },
  { id: 'owl', emoji: '🦉', name: 'Owl', color: '#A855F7' },
  { id: 'dolphin', emoji: '🐬', name: 'Dolphin', color: '#06B6D4' },
  { id: 'lion', emoji: '🦁', name: 'Lion', color: '#F59E0B' },
  { id: 'panda', emoji: '🐼', name: 'Panda', color: '#6B7280' },
  { id: 'butterfly', emoji: '🦋', name: 'Butterfly', color: '#EC4899' },
  { id: 'turtle', emoji: '🐢', name: 'Turtle', color: '#22C55E' },
  { id: 'eagle', emoji: '🦅', name: 'Eagle', color: '#92400E' },
  { id: 'octopus', emoji: '🐙', name: 'Octopus', color: '#E11D48' },
  { id: 'parrot', emoji: '🦜', name: 'Parrot', color: '#84CC16' },
  { id: 'wolf', emoji: '🐺', name: 'Wolf', color: '#64748B' },
  { id: 'shark', emoji: '🦈', name: 'Shark', color: '#3B82F6' },
  { id: 'bee', emoji: '🐝', name: 'Bee', color: '#FACC15' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', color: '#D946EF' },
  { id: 'frog', emoji: '🐸', name: 'Frog', color: '#4ADE80' },
  { id: 'penguin', emoji: '🐧', name: 'Penguin', color: '#1E293B' },
  { id: 'lizard', emoji: '🦎', name: 'Lizard', color: '#16A34A' },
  { id: 'koala', emoji: '🐨', name: 'Koala', color: '#9CA3AF' },
  { id: 'seal', emoji: '🦭', name: 'Seal', color: '#78716C' },
  { id: 'tiger', emoji: '🐯', name: 'Tiger', color: '#EA580C' },
];

const avatarMap = new Map(ANIMAL_AVATARS.map((a) => [a.id, a]));

export function getAvatarById(id: string): AnimalAvatar {
  return avatarMap.get(id) ?? ANIMAL_AVATARS[0];
}

export function getAvatarEmoji(id: string): string {
  return getAvatarById(id).emoji;
}

export function getAvatarColor(id: string): string {
  return getAvatarById(id).color;
}
