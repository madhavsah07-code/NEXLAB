import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AxiosError } from 'axios';
import { api } from '../lib/api';
import { IUser } from '@nexlab/shared';
import toast from 'react-hot-toast';

interface AuthState {
  user: IUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<{ success: boolean }>;
  setUser: (user: IUser | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,

      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          const userData = response.data.user;
          if (userData && !userData._id && userData.id) {
            userData._id = userData.id;
          }
          set({ user: userData });
          toast.success(`Welcome back, ${userData.name}! 👋`);
          return { success: true };
        } catch (error: any) {
          console.error('Login error:', error);
          const message = error.response?.data?.message || 'Login failed';
          toast.error(message);
          return { 
            success: false, 
            message 
          };
        }
      },

      register: async (name, email, password) => {
        try {
          const response = await api.post('/auth/register', { name, email, password });
          const userData = response.data.user;
          if (userData && !userData._id && userData.id) {
            userData._id = userData.id;
          }
          set({ user: userData });
          toast.success(`Welcome to NexLab, ${name}! 🎉`);
          return { success: true };
        } catch (error: any) {
          console.error('Registration error:', error);
          const message = error.response?.data?.message || 'Registration failed';
          toast.error(message);
          return { 
            success: false, 
            message 
          };
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
          toast.success('Logged out successfully');
        } catch (error) {
          console.error('Logout error:', error);
        }
        set({ user: null });
      },

      checkAuth: async () => {
        try {
          const response = await api.get('/auth/me');
          console.log('🔍 Auth check response:', response.data);
          
          let userData = response.data.user;
          if (userData && !userData._id && userData.id) {
            userData._id = userData.id;
          }
          
          set({ 
            user: userData, 
            isLoading: false 
          });
          return { success: true };
        } catch (error) {
          if (!(error instanceof AxiosError) || error.response?.status !== 401) {
            console.error('Auth check error:', error);
          }
          set({ user: null, isLoading: false });
          return { success: false };
        }
      },

      setUser: (user) => {
        if (user && !user._id && user.id) {
          user._id = user.id;
        }
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user 
      }),
    }
  )
);

// Listen for global 401 events to auto-logout
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().setUser(null);
    toast.error('Session expired. Please login again.');
  });

  // Listen for rate limit events
  window.addEventListener('auth:rate_limited', () => {
    toast.error('⏳ Too many requests. Please wait a moment.');
  });
}