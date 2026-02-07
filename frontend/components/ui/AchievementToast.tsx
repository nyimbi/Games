'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getAchievementById } from '@/lib/games/achievements';

interface ToastEntry {
  id: string;
  achievementId: string;
}

interface AchievementToastContextValue {
  showAchievement: (achievementId: string) => void;
  showAchievements: (achievementIds: string[]) => void;
}

const AchievementToastContext = createContext<AchievementToastContextValue>({
  showAchievement: () => {},
  showAchievements: () => {},
});

export function useAchievementToast() {
  return useContext(AchievementToastContext);
}

export function AchievementToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showAchievement = useCallback((achievementId: string) => {
    const id = `${achievementId}_${Date.now()}`;
    setToasts((prev) => [...prev, { id, achievementId }]);
  }, []);

  const showAchievements = useCallback(
    (achievementIds: string[]) => {
      achievementIds.forEach((aid, i) => {
        setTimeout(() => showAchievement(aid), i * 500);
      });
    },
    [showAchievement]
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AchievementToastContext.Provider value={{ showAchievement, showAchievements }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <AchievementToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </AchievementToastContext.Provider>
  );
}

function AchievementToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastEntry;
  onDismiss: (id: string) => void;
}) {
  const achievement = getAchievementById(toast.achievementId);

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  if (!achievement) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="pointer-events-auto bg-gradient-to-r from-gold-50 to-gold-100 border border-gold-300 rounded-card shadow-lg p-4 min-w-[280px] max-w-[340px] cursor-pointer"
      onClick={() => onDismiss(toast.id)}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gold-400 flex items-center justify-center text-xl shrink-0">
          {achievement.icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gold-700 uppercase tracking-wider">
            Achievement Unlocked!
          </p>
          <p className="font-display font-bold text-ink-900 truncate">{achievement.name}</p>
          <p className="text-sm text-ink-600 truncate">{achievement.description}</p>
        </div>
      </div>
    </motion.div>
  );
}
