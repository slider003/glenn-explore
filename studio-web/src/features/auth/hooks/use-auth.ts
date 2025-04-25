import { create } from 'zustand';
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authClient } from '../services/auth-client';
import type { LoginResponse } from '../types';

interface AuthState {
  user: LoginResponse | null;
  setUser: (user: LoginResponse | null) => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

export function useAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuthStore();

  const login = useCallback((loginResponse: LoginResponse) => {
    setUser(loginResponse);
    const state = location.state as { from?: { pathname: string } };
    const from = state?.from?.pathname || '/studio/';
    window.location.href = from;
  }, [navigate, location, setUser]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      navigate('/studio/login');
    }
  }, [navigate, setUser]);

  const checkAuth = useCallback(async () => {
    try {
      const user = await authClient.checkAuthentication();
      if (user) {
        setUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }, [setUser]);

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };
}