'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { getStorage, setStorage, STORAGE_KEYS } from '@/lib/storage';

/**
 * Web Audio API synthesized sound effects — no audio files needed.
 * Each effect is a short oscillator-based tone designed for game feedback.
 */

type SoundEffect = 'correct' | 'wrong' | 'streak' | 'achievement' | 'tick' | 'complete' | 'flip' | 'powerup';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  ramp?: number;
  gain?: number;
  secondFreq?: number;
}

const SOUND_CONFIGS: Record<SoundEffect, SoundConfig> = {
  correct: { frequency: 880, duration: 0.15, type: 'sine', ramp: 1320, gain: 0.3 },
  wrong: { frequency: 220, duration: 0.3, type: 'square', ramp: 110, gain: 0.15 },
  streak: { frequency: 660, duration: 0.1, type: 'sine', ramp: 1100, gain: 0.25, secondFreq: 1320 },
  achievement: { frequency: 523, duration: 0.5, type: 'sine', ramp: 1047, gain: 0.25 },
  tick: { frequency: 1000, duration: 0.05, type: 'sine', gain: 0.1 },
  complete: { frequency: 440, duration: 0.4, type: 'sine', ramp: 880, gain: 0.2 },
  flip: { frequency: 600, duration: 0.08, type: 'sine', ramp: 900, gain: 0.15 },
  powerup: { frequency: 523, duration: 0.12, type: 'sine', ramp: 784, gain: 0.25, secondFreq: 1047 },
};

function playTone(ctx: AudioContext, config: SoundConfig) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = config.type;
  osc.frequency.setValueAtTime(config.frequency, ctx.currentTime);
  if (config.ramp) {
    osc.frequency.linearRampToValueAtTime(config.ramp, ctx.currentTime + config.duration);
  }

  gainNode.gain.setValueAtTime(config.gain ?? 0.2, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + config.duration);

  // Second tone for effects like streak (arpeggio)
  if (config.secondFreq) {
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = config.type;
    osc2.frequency.setValueAtTime(config.secondFreq, ctx.currentTime + config.duration * 0.5);
    gain2.gain.setValueAtTime(config.gain ?? 0.2, ctx.currentTime + config.duration * 0.5);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration * 1.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + config.duration * 0.5);
    osc2.stop(ctx.currentTime + config.duration * 1.5);
  }
}

export function useSounds() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(getStorage(STORAGE_KEYS.SOUND_MUTED, false));
  }, []);

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (effect: SoundEffect) => {
      if (muted) return;
      try {
        const ctx = getContext();
        playTone(ctx, SOUND_CONFIGS[effect]);
      } catch {
        // Audio unavailable
      }
    },
    [muted, getContext]
  );

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      setStorage(STORAGE_KEYS.SOUND_MUTED, next);
      return next;
    });
  }, []);

  return { play, muted, toggleMute };
}
