import { create } from 'zustand';
import type { User } from '@memestar/shared';

interface UserState {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
