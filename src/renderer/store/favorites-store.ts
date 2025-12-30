/**
 * Favorites Store - Manage starred/favorite files
 * Allows users to quickly access frequently used PDFs
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoriteFile {
  id: string;
  path: string;
  name: string;
  addedAt: Date;
  lastOpened?: Date;
}

interface FavoritesState {
  favorites: FavoriteFile[];
  addFavorite: (path: string, name: string) => void;
  removeFavorite: (path: string) => void;
  isFavorite: (path: string) => boolean;
  getFavorite: (path: string) => FavoriteFile | undefined;
  updateLastOpened: (path: string) => void;
  clearAllFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (path, name) => {
        const existing = get().favorites.find((f) => f.path === path);
        if (existing) return; // Already a favorite

        const newFavorite: FavoriteFile = {
          id: `fav_${Date.now()}`,
          path,
          name,
          addedAt: new Date(),
        };

        set((state) => ({
          favorites: [newFavorite, ...state.favorites],
        }));
      },

      removeFavorite: (path) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.path !== path),
        }));
      },

      isFavorite: (path) => {
        return get().favorites.some((f) => f.path === path);
      },

      getFavorite: (path) => {
        return get().favorites.find((f) => f.path === path);
      },

      updateLastOpened: (path) => {
        set((state) => ({
          favorites: state.favorites.map((f) =>
            f.path === path ? { ...f, lastOpened: new Date() } : f
          ),
        }));
      },

      clearAllFavorites: () => {
        set({ favorites: [] });
      },
    }),
    {
      name: 'favorites-storage',
    }
  )
);
