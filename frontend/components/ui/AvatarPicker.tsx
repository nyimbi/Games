'use client';

import { motion } from 'motion/react';
import { ANIMAL_AVATARS, type AnimalAvatar } from '@/lib/games/avatars';

interface AvatarPickerProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {ANIMAL_AVATARS.map((avatar) => {
        const isSelected = avatar.id === selected;
        return (
          <motion.button
            key={avatar.id}
            type="button"
            onClick={() => onSelect(avatar.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
              isSelected
                ? 'ring-3 ring-gold-400 bg-gold-50 shadow-md'
                : 'hover:bg-cream-100'
            }`}
          >
            <span className="text-3xl">{avatar.emoji}</span>
            <span className={`text-xs font-medium ${isSelected ? 'text-gold-700' : 'text-ink-500'}`}>
              {avatar.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
