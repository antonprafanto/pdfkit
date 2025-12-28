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
          const htmlDoc = window.document;
          if (htmlDoc && htmlDoc.documentElement) {
            if (newTheme === 'dark') {
              htmlDoc.documentElement.classList.add('dark');
            } else {
              htmlDoc.documentElement.classList.remove('dark');
            }
          }

          return { theme: newTheme };
        }),

      setTheme: (theme) =>
        set(() => {
          // Update document class (with safety check)
          const htmlDoc = window.document;
          if (htmlDoc && htmlDoc.documentElement) {
            if (theme === 'dark') {
              htmlDoc.documentElement.classList.add('dark');
            } else {
              htmlDoc.documentElement.classList.remove('dark');
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
