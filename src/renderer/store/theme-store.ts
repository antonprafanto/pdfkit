/**
 * Theme Store
 * Manages dark/light theme state with localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',

      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';

          // Update document class (with safety check)
          if (typeof document !== 'undefined' && document.documentElement) {
            if (newTheme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }

          return { theme: newTheme };
        }),

      setTheme: (theme) =>
        set(() => {
          // Update document class (with safety check)
          if (typeof document !== 'undefined' && document.documentElement) {
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }

          return { theme };
        }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
