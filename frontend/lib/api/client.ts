/** API client for backend communication */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

function getUserIdHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const userId = localStorage.getItem('user_id');
  return userId ? { 'X-User-Id': userId } : {};
}

export async function fetcher<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getUserIdHeader(),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let data;
    try {
      data = await res.json();
    } catch {
      data = await res.text();
    }
    throw new ApiError(res.status, res.statusText, data);
  }

  return res.json();
}

// Auth API - simplified, no passwords
export interface User {
  id: number;
  display_name: string;
  role: 'coach' | 'player';
  team_id: number | null;
  avatar_color: string;
  scholar_code: string | null;
  avatar: string;
  created_at: string;
}

export interface Team {
  id: number;
  name: string;
  join_code: string;
  coach_id: number;
  created_at: string;
}

export interface UserResponse {
  user: User;
}

export interface TeamResponse {
  team: Team;
  members: User[];
}

export const authApi = {
  // Join the platform with just a name and role
  join: (data: {
    display_name: string;
    role: 'coach' | 'player';
    avatar_color?: string;
    avatar?: string;
  }) =>
    fetcher<UserResponse>('/auth/join', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Recover identity using a Scholar Code
  recover: (data: { scholar_code: string }) =>
    fetcher<UserResponse>('/auth/recover', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createTeam: (data: { name: string; join_code?: string }) =>
    fetcher<Team>('/auth/team', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  joinTeam: (data: { join_code: string }) =>
    fetcher<Team>('/auth/team/join', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTeam: () => fetcher<TeamResponse>('/auth/team'),

  listTeams: () => fetcher<Team[]>('/auth/teams'),

  switchTeam: (data: { team_id: number }) =>
    fetcher<TeamResponse>('/auth/team/switch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Sessions API
export interface Session {
  id: number;
  team_id: number | null;
  coach_id: number | null;
  player_id: number | null;
  name: string;
  mode: 'solo_practice' | 'team_practice' | 'free_play';
  status: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  games: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface SessionResponse {
  session: Session;
  player_count: number;
}

export const sessionsApi = {
  create: (data: {
    name: string;
    mode?: 'solo_practice' | 'team_practice' | 'free_play';
    scheduled_at?: string;
    games: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    team_id?: number;
  }) =>
    fetcher<SessionResponse>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (status?: string) =>
    fetcher<{ sessions: Session[] }>(
      `/sessions${status ? `?status=${status}` : ''}`
    ),

  get: (id: number) => fetcher<SessionResponse>(`/sessions/${id}`),

  start: (id: number) =>
    fetcher<SessionResponse>(`/sessions/${id}/start`, { method: 'POST' }),

  end: (id: number) =>
    fetcher<SessionResponse>(`/sessions/${id}/end`, { method: 'POST' }),

  getGames: (id: number) =>
    fetcher<{ session_id: number; games: GameDefinition[]; total: number }>(
      `/sessions/${id}/games`
    ),
};

// Games API
export interface GameDefinition {
  type: string;
  name: string;
  description: string;
  category: string;
  min_players: number;
  max_players: number;
  duration_minutes: number;
  sync_type: string;
  icon: string;
}

export interface Question {
  id: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  options: string[];
  correct_index: number;
  explanation?: string;
  time_limit_seconds: number;
}

export const gamesApi = {
  getDefinitions: () =>
    fetcher<{ categories: Record<string, GameDefinition[]>; total_games: number }>(
      '/games/definitions'
    ),

  getCategory: (category: string) =>
    fetcher<{ category: string; category_name: string; games: GameDefinition[] }>(
      `/games/category/${category}`
    ),

  getDefinition: (gameType: string) =>
    fetcher<GameDefinition>(`/games/definition/${gameType}`),

  getQuestions: (params: {
    subject: string;
    difficulty?: string;
    count?: number;
  }) => {
    const searchParams = new URLSearchParams({ subject: params.subject });
    if (params.difficulty) searchParams.set('difficulty', params.difficulty);
    if (params.count) searchParams.set('count', params.count.toString());
    return fetcher<{ questions: Question[]; total: number }>(
      `/games/questions?${searchParams}`
    );
  },

  getMixedQuestions: (params: { difficulty?: string; count?: number }) => {
    const searchParams = new URLSearchParams();
    if (params.difficulty) searchParams.set('difficulty', params.difficulty);
    if (params.count) searchParams.set('count', params.count.toString());
    return fetcher<{ questions: Question[]; total: number }>(
      `/games/questions/mixed?${searchParams}`
    );
  },

  getSubjects: () =>
    fetcher<{ subjects: { value: string; name: string; question_count: number }[] }>(
      '/games/subjects'
    ),
};
