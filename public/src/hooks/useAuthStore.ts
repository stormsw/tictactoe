import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiService from '../services/api';
import type { User, AuthResponse } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const response = await apiService.login(username, password) as AuthResponse;
          const { access_token, user } = response;
          
          set({
            user,
            token: access_token,
            isAuthenticated: true,
          });
          
          // Set token for future API calls
          apiService.setAuthToken(access_token);
          
          return true;
        } catch (error) {
          console.error('Login failed:', error);
          return false;
        }
      },

      register: async (username: string, email: string, password: string) => {
        try {
          const response = await apiService.register(username, email, password) as AuthResponse;
          const { access_token, user } = response;
          
          set({
            user,
            token: access_token,
            isAuthenticated: true,
          });
          
          // Set token for future API calls
          apiService.setAuthToken(access_token);
          
          return true;
        } catch (error) {
          console.error('Registration failed:', error);
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        
        // Clear token from API service
        apiService.setAuthToken(null);
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          return;
        }

        try {
          // Set token for API calls
          apiService.setAuthToken(token);
          
          // Verify token is still valid
          const user = await apiService.getCurrentUser() as User;
          set({
            user,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Auth check failed:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          apiService.setAuthToken(null);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
