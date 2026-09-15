import { create } from 'zustand';
import type { RouterCredentials } from '@/router/gm630/types';

interface RouterStore {
  credentials: RouterCredentials;
  setCredentials: (c: RouterCredentials) => void;
  lastUpdated: number | null;
  setLastUpdated: (ts: number) => void;
}

export const useRouterStore = create<RouterStore>((set) => ({
  credentials: {
    host: '192.168.1.1',
    username: 'admin',
    password: 'admin',
  },
  setCredentials: (c) => set({ credentials: c }),
  lastUpdated: null,
  setLastUpdated: (ts) => set({ lastUpdated: ts }),
}));
