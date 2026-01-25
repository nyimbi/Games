'use client';

import { createContext, useContext, useReducer, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Channel } from 'pusher-js';
import {
  subscribeToSession,
  unsubscribe,
  bindEvent,
  unbindEvent,
  type GameEvent,
  type PlayerJoinedEvent,
  type PlayerLeftEvent,
  type QuestionEvent,
  type BuzzerEvent,
  type AnswerEvent,
  type ScoreUpdateEvent,
  type GameEndedEvent,
} from '@/lib/ws/client';
import {
  type GameState,
  type GamePlayer,
  type GamePhase,
  type Question,
  type BuzzerBattleState,
  type QuizGameState,
} from '@/lib/games/types';
import { fetcher } from '@/lib/api/client';

// Action types
type Action =
  | { type: 'SET_SESSION'; payload: { sessionId: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PHASE'; payload: GamePhase }
  | { type: 'SET_PLAYERS'; payload: GamePlayer[] }
  | { type: 'PLAYER_JOINED'; payload: PlayerJoinedEvent }
  | { type: 'PLAYER_LEFT'; payload: PlayerLeftEvent }
  | { type: 'SET_QUESTION'; payload: Question }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'BUZZ'; payload: { playerId: string; timestamp: number } }
  | { type: 'ANSWER_SUBMITTED'; payload: { playerId: string; answerIndex: number } }
  | { type: 'REVEAL_ANSWER'; payload: { correctIndex: number } }
  | { type: 'UPDATE_SCORES'; payload: Record<string, number> }
  | { type: 'GAME_ENDED'; payload: { finalScores: Record<string, number>; winnerId?: string } }
  | { type: 'RESET' };

// State shape
interface GameContextState {
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  phase: GamePhase;
  players: GamePlayer[];
  currentQuestion: Question | null;
  timeRemaining: number;
  currentRound: number;
  totalRounds: number;
  buzzedPlayerId: string | null;
  buzzOrder: string[];
  canBuzz: boolean;
  answersSubmitted: Record<string, number>;
  revealed: boolean;
  finalScores: Record<string, number> | null;
  winnerId: string | null;
}

const initialState: GameContextState = {
  sessionId: null,
  isLoading: false,
  error: null,
  phase: 'waiting',
  players: [],
  currentQuestion: null,
  timeRemaining: 0,
  currentRound: 0,
  totalRounds: 0,
  buzzedPlayerId: null,
  buzzOrder: [],
  canBuzz: false,
  answersSubmitted: {},
  revealed: false,
  finalScores: null,
  winnerId: null,
};

function gameReducer(state: GameContextState, action: Action): GameContextState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, sessionId: action.payload.sessionId };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_PHASE':
      return { ...state, phase: action.payload };

    case 'SET_PLAYERS':
      return { ...state, players: action.payload };

    case 'PLAYER_JOINED':
      if (state.players.some((p) => p.id === action.payload.player_id)) {
        return {
          ...state,
          players: state.players.map((p) =>
            p.id === action.payload.player_id ? { ...p, is_connected: true } : p
          ),
        };
      }
      return {
        ...state,
        players: [
          ...state.players,
          {
            id: action.payload.player_id,
            display_name: action.payload.display_name,
            avatar_color: action.payload.avatar_color,
            score: 0,
            is_ready: false,
            is_connected: true,
          },
        ],
      };

    case 'PLAYER_LEFT':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.player_id ? { ...p, is_connected: false } : p
        ),
      };

    case 'SET_QUESTION':
      return {
        ...state,
        currentQuestion: action.payload,
        phase: 'playing',
        buzzedPlayerId: null,
        buzzOrder: [],
        canBuzz: true,
        answersSubmitted: {},
        revealed: false,
        currentRound: state.currentRound + 1,
      };

    case 'SET_TIME':
      return { ...state, timeRemaining: action.payload };

    case 'BUZZ':
      if (state.buzzedPlayerId) return state; // Already buzzed
      return {
        ...state,
        buzzedPlayerId: action.payload.playerId,
        buzzOrder: [...state.buzzOrder, action.payload.playerId],
        canBuzz: false,
        phase: 'answering',
      };

    case 'ANSWER_SUBMITTED':
      return {
        ...state,
        answersSubmitted: {
          ...state.answersSubmitted,
          [action.payload.playerId]: action.payload.answerIndex,
        },
      };

    case 'REVEAL_ANSWER':
      return {
        ...state,
        revealed: true,
        phase: 'revealing',
      };

    case 'UPDATE_SCORES':
      return {
        ...state,
        players: state.players.map((p) => ({
          ...p,
          score: action.payload[p.id] ?? p.score,
        })),
        phase: 'scoring',
      };

    case 'GAME_ENDED':
      return {
        ...state,
        finalScores: action.payload.finalScores,
        winnerId: action.payload.winnerId || null,
        phase: 'ended',
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Context
interface GameContextType extends GameContextState {
  dispatch: React.Dispatch<Action>;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => void;
  buzz: () => Promise<void>;
  submitAnswer: (answerIndex: number) => Promise<void>;
  markReady: () => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGameState() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
}

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Channel reference
  let channel: Channel | null = null;

  const joinSession = useCallback(async (sessionId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Subscribe to session channel
      channel = subscribeToSession(sessionId);

      // Bind presence events
      channel.bind('pusher:subscription_succeeded', (members: any) => {
        const players: GamePlayer[] = [];
        members.each((member: any) => {
          players.push({
            id: member.id,
            display_name: member.info.display_name,
            avatar_color: member.info.avatar_color,
            score: 0,
            is_ready: false,
            is_connected: true,
            role: member.info.role,
          });
        });
        dispatch({ type: 'SET_PLAYERS', payload: players });
      });

      channel.bind('pusher:member_added', (member: any) => {
        dispatch({
          type: 'PLAYER_JOINED',
          payload: {
            player_id: member.id,
            display_name: member.info.display_name,
            avatar_color: member.info.avatar_color,
          },
        });
      });

      channel.bind('pusher:member_removed', (member: any) => {
        dispatch({ type: 'PLAYER_LEFT', payload: { player_id: member.id } });
      });

      // Bind game events
      channel.bind('game:started', (data: any) => {
        dispatch({ type: 'SET_PHASE', payload: 'countdown' });
      });

      channel.bind('game:question', (data: QuestionEvent) => {
        dispatch({
          type: 'SET_QUESTION',
          payload: {
            id: data.question_id,
            text: data.text,
            options: data.options,
            time_limit_seconds: data.time_limit,
            subject: '',
            difficulty: 'medium',
            correct_index: -1, // Not revealed yet
          },
        });
        dispatch({ type: 'SET_TIME', payload: data.time_limit });
      });

      channel.bind('game:buzz', (data: BuzzerEvent) => {
        dispatch({
          type: 'BUZZ',
          payload: { playerId: data.player_id, timestamp: data.timestamp },
        });
      });

      channel.bind('game:answer', (data: AnswerEvent) => {
        dispatch({
          type: 'ANSWER_SUBMITTED',
          payload: { playerId: data.player_id, answerIndex: data.answer_index },
        });
      });

      channel.bind('game:reveal', (data: any) => {
        dispatch({ type: 'REVEAL_ANSWER', payload: { correctIndex: data.correct_index } });
      });

      channel.bind('game:scores', (data: ScoreUpdateEvent) => {
        dispatch({ type: 'UPDATE_SCORES', payload: data.scores });
      });

      channel.bind('game:ended', (data: GameEndedEvent) => {
        dispatch({
          type: 'GAME_ENDED',
          payload: { finalScores: data.final_scores, winnerId: data.winner_id },
        });
      });

      channel.bind('game:timer', (data: { time: number }) => {
        dispatch({ type: 'SET_TIME', payload: data.time });
      });

      dispatch({ type: 'SET_SESSION', payload: { sessionId } });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to join session' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const leaveSession = useCallback(() => {
    if (state.sessionId) {
      unsubscribe(`presence-session-${state.sessionId}`);
    }
    dispatch({ type: 'RESET' });
  }, [state.sessionId]);

  const buzz = useCallback(async () => {
    if (!state.sessionId || !state.canBuzz) return;

    try {
      await fetcher(`/sessions/${state.sessionId}/buzz`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Failed to buzz:', err);
    }
  }, [state.sessionId, state.canBuzz]);

  const submitAnswer = useCallback(async (answerIndex: number) => {
    if (!state.sessionId) return;

    try {
      await fetcher(`/sessions/${state.sessionId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ answer_index: answerIndex }),
      });
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  }, [state.sessionId]);

  const markReady = useCallback(async () => {
    if (!state.sessionId) return;

    try {
      await fetcher(`/sessions/${state.sessionId}/ready`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Failed to mark ready:', err);
    }
  }, [state.sessionId]);

  return (
    <GameContext.Provider
      value={{
        ...state,
        dispatch,
        joinSession,
        leaveSession,
        buzz,
        submitAnswer,
        markReady,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// Timer hook for countdown
export function useGameTimer(initialTime: number, onComplete?: () => void) {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || time <= 0) return;

    const interval = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, time, onComplete]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((newTime?: number) => {
    setTime(newTime ?? initialTime);
    setIsRunning(false);
  }, [initialTime]);

  return { time, isRunning, start, pause, reset };
}

