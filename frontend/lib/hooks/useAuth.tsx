'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { authApi, type User, type Team } from '@/lib/api/client';

interface AuthState {
  user: User | null;
  team: Team | null;
  teams: Team[];
  teamMembers: User[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  join: (data: {
    display_name: string;
    role: 'coach' | 'player';
    avatar_color?: string;
    avatar?: string;
  }) => Promise<User>;
  recover: (scholarCode: string) => Promise<User>;
  logout: () => void;
  createTeam: (name: string) => Promise<Team>;
  joinTeam: (joinCode: string) => Promise<Team>;
  refreshTeam: () => Promise<void>;
  switchTeam: (teamId: number) => Promise<void>;
  loadTeams: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

function storeUser(user: User) {
  localStorage.setItem('user_id', user.id.toString());
  localStorage.setItem('user', JSON.stringify(user));
  if (user.scholar_code) {
    localStorage.setItem('scholar_code', user.scholar_code);
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    team: null,
    teams: [],
    teamMembers: [],
    isLoading: true,
    isAuthenticated: false,
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    const userJson = localStorage.getItem('user');

    if (userId && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        setState((prev) => ({
          ...prev,
          user,
          isAuthenticated: true,
          isLoading: false,
        }));

        // Load team if user has one
        if (user.team_id) {
          loadTeam();
        }

        // Load all teams for coaches
        if (user.role === 'coach') {
          loadTeamsInternal();
        }
      } catch {
        // Invalid stored user, clear it
        localStorage.removeItem('user_id');
        localStorage.removeItem('user');
        localStorage.removeItem('scholar_code');
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Safety timeout - prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      setState((prev) => {
        if (prev.isLoading) {
          return { ...prev, isLoading: false };
        }
        return prev;
      });
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);

  const loadTeam = useCallback(async () => {
    try {
      const teamData = await authApi.getTeam();
      setState((prev) => ({
        ...prev,
        team: teamData.team,
        teamMembers: teamData.members,
      }));
    } catch {
      // Team not found or error, continue without team
    }
  }, []);

  const loadTeamsInternal = useCallback(async () => {
    try {
      const teams = await authApi.listTeams();
      setState((prev) => ({ ...prev, teams }));
    } catch {
      // Continue without teams list
    }
  }, []);

  const loadTeams = useCallback(async () => {
    await loadTeamsInternal();
  }, [loadTeamsInternal]);

  const join = useCallback(
    async (data: {
      display_name: string;
      role: 'coach' | 'player';
      avatar_color?: string;
      avatar?: string;
    }) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const response = await authApi.join(data);
        storeUser(response.user);
        setState({
          user: response.user,
          team: null,
          teams: [],
          teamMembers: [],
          isLoading: false,
          isAuthenticated: true,
        });
        return response.user;
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    []
  );

  const recover = useCallback(async (scholarCode: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await authApi.recover({ scholar_code: scholarCode });
      storeUser(response.user);
      setState({
        user: response.user,
        team: null,
        teams: [],
        teamMembers: [],
        isLoading: false,
        isAuthenticated: true,
      });

      // Load team if user has one
      if (response.user.team_id) {
        loadTeam();
      }

      // Load all teams for coaches
      if (response.user.role === 'coach') {
        loadTeamsInternal();
      }

      return response.user;
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [loadTeam, loadTeamsInternal]);

  const logout = useCallback(() => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user');
    localStorage.removeItem('scholar_code');
    setState({
      user: null,
      team: null,
      teams: [],
      teamMembers: [],
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const createTeam = useCallback(async (name: string) => {
    const team = await authApi.createTeam({ name });
    // Update user with new team_id
    setState((prev) => {
      const updatedUser = prev.user ? { ...prev.user, team_id: team.id } : null;
      if (updatedUser) {
        storeUser(updatedUser);
      }
      return {
        ...prev,
        team,
        teams: [team, ...prev.teams],
        teamMembers: prev.user ? [prev.user] : [],
        user: updatedUser,
      };
    });
    return team;
  }, []);

  const joinTeam = useCallback(async (joinCode: string) => {
    const team = await authApi.joinTeam({ join_code: joinCode });
    // Refresh team data to get members
    const teamData = await authApi.getTeam();
    // Update user with new team_id
    setState((prev) => {
      const updatedUser = prev.user ? { ...prev.user, team_id: team.id } : null;
      if (updatedUser) {
        storeUser(updatedUser);
      }
      return {
        ...prev,
        team: teamData.team,
        teamMembers: teamData.members,
        user: updatedUser,
      };
    });
    return team;
  }, []);

  const switchTeam = useCallback(async (teamId: number) => {
    const response = await authApi.switchTeam({ team_id: teamId });
    setState((prev) => {
      const updatedUser = prev.user ? { ...prev.user, team_id: response.team.id } : null;
      if (updatedUser) {
        storeUser(updatedUser);
      }
      return {
        ...prev,
        team: response.team,
        teamMembers: response.members,
        user: updatedUser,
      };
    });
  }, []);

  const refreshTeam = useCallback(async () => {
    if (!state.user?.team_id) return;
    try {
      const teamData = await authApi.getTeam();
      setState((prev) => ({
        ...prev,
        team: teamData.team,
        teamMembers: teamData.members,
      }));
    } catch {
      // Team might have been deleted
      setState((prev) => ({
        ...prev,
        team: null,
        teamMembers: [],
      }));
    }
  }, [state.user?.team_id]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        join,
        recover,
        logout,
        createTeam,
        joinTeam,
        refreshTeam,
        switchTeam,
        loadTeams,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Helper hook for protected routes
export function useRequireAuth(requiredRole?: 'coach' | 'player') {
  const auth = useAuth();

  const isAllowed =
    auth.isAuthenticated &&
    (!requiredRole || auth.user?.role === requiredRole);

  return {
    ...auth,
    isAllowed,
    isCoach: auth.user?.role === 'coach',
    isPlayer: auth.user?.role === 'player',
    hasTeam: !!auth.team,
  };
}
