import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../services/auth-client';
import type { LoginResponse } from '../types';
import { create } from 'zustand';

interface AuthState {
  user: LoginResponse | null;
  setUser: (user: LoginResponse | null) => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

interface AuthContextValue {
  user: LoginResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    // Check authentication status on mount
    authClient.checkAuthentication()
      .then(user => {
        if (user) {
          setUser(user);
        }
      })
      .catch(console.error)
      .finally(() => {
        setHasCheckedAuth(true);
        setIsLoading(false);
      });
  }, [setUser]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      navigate('/studio/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, [navigate, setUser]);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: handleLogout,
  };

  if (!hasCheckedAuth) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 