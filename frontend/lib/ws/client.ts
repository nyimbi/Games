/**
 * Pusher/Soketi client for real-time game communication
 */

import Pusher, { Channel } from 'pusher-js';

// Soketi server configuration
const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || 'app-key';
const PUSHER_HOST = process.env.NEXT_PUBLIC_PUSHER_HOST || '172.236.30.103';
const PUSHER_PORT = parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT || '6001', 10);
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Singleton Pusher instance
let pusherInstance: Pusher | null = null;

export function getPusher(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher(PUSHER_KEY, {
      wsHost: PUSHER_HOST,
      wsPort: PUSHER_PORT,
      forceTLS: false,
      disableStats: true,
      enabledTransports: ['ws', 'wss'],
      cluster: 'mt1', // Required but ignored for self-hosted
      authEndpoint: `${API_URL}/pusher/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''}`,
        },
      },
    });

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      pusherInstance.connection.bind('state_change', (states: { current: string; previous: string }) => {
        console.log('[Pusher] State changed:', states.previous, '->', states.current);
      });

      pusherInstance.connection.bind('error', (err: Error) => {
        console.error('[Pusher] Connection error:', err);
      });
    }
  }

  return pusherInstance;
}

export function disconnectPusher(): void {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
}

// Type definitions for game events
export interface GameEvent {
  type: string;
  payload: any;
  timestamp: string;
  sender_id?: string;
}

export interface PlayerJoinedEvent {
  player_id: string;
  display_name: string;
  avatar_color: string;
}

export interface PlayerLeftEvent {
  player_id: string;
}

export interface GameStartedEvent {
  game_type: string;
  settings: Record<string, any>;
}

export interface QuestionEvent {
  question_id: string;
  text: string;
  options: string[];
  time_limit: number;
}

export interface BuzzerEvent {
  player_id: string;
  timestamp: number;
}

export interface AnswerEvent {
  player_id: string;
  answer_index: number;
  is_correct: boolean;
  points: number;
}

export interface ScoreUpdateEvent {
  scores: Record<string, number>;
}

export interface GameEndedEvent {
  final_scores: Record<string, number>;
  winner_id?: string;
}

// Channel subscription helper
export function subscribeToSession(sessionId: string): Channel {
  const pusher = getPusher();
  return pusher.subscribe(`presence-session-${sessionId}`);
}

export function subscribeToPrivateSession(sessionId: string): Channel {
  const pusher = getPusher();
  return pusher.subscribe(`private-session-${sessionId}`);
}

// Event binding helpers
export function bindEvent<T>(channel: Channel, event: string, callback: (data: T) => void): void {
  channel.bind(event, callback);
}

export function unbindEvent(channel: Channel, event: string): void {
  channel.unbind(event);
}

// Channel management
export function unsubscribe(channelName: string): void {
  const pusher = getPusher();
  pusher.unsubscribe(channelName);
}

// Presence channel helpers
export interface PresenceMember {
  id: string;
  info: {
    display_name: string;
    avatar_color: string;
    role: 'coach' | 'player';
  };
}

export function getPresenceMembers(channel: Channel): PresenceMember[] {
  const presenceChannel = channel as any;
  if (presenceChannel.members) {
    const members: PresenceMember[] = [];
    presenceChannel.members.each((member: PresenceMember) => {
      members.push(member);
    });
    return members;
  }
  return [];
}
