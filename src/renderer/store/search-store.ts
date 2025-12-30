/**
 * Search Store - Search history and advanced search state
 * Tracks search history and provides filtering capabilities
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  resultCount?: number;
}

export interface SearchFilter {
  inFavorites: boolean;
  inCollections: string[]; // collection IDs
  withTags: string[]; // tag IDs
  dateFrom?: Date;
  dateTo?: Date;
}

interface SearchState {
  // Search history
  searchHistory: SearchHistoryItem[];
  maxHistorySize: number;
  
  // Current search state
  currentQuery: string;
  currentFilters: SearchFilter;
  isSearching: boolean;
  
  // History actions
  addToHistory: (query: string, resultCount?: number) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  getRecentSearches: (limit?: number) => SearchHistoryItem[];
  
  // Search state actions
  setCurrentQuery: (query: string) => void;
  setCurrentFilters: (filters: Partial<SearchFilter>) => void;
  resetFilters: () => void;
  setIsSearching: (isSearching: boolean) => void;
}

const DEFAULT_FILTERS: SearchFilter = {
  inFavorites: false,
  inCollections: [],
  withTags: [],
  dateFrom: undefined,
  dateTo: undefined,
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      searchHistory: [],
      maxHistorySize: 50,
      currentQuery: '',
      currentFilters: { ...DEFAULT_FILTERS },
      isSearching: false,

      addToHistory: (query, resultCount) => {
        if (!query.trim()) return;
        
        const trimmedQuery = query.trim();
        const existingIndex = get().searchHistory.findIndex(
          (item) => item.query.toLowerCase() === trimmedQuery.toLowerCase()
        );

        const newItem: SearchHistoryItem = {
          id: `search_${Date.now()}`,
          query: trimmedQuery,
          timestamp: new Date(),
          resultCount,
        };

        set((state) => {
          let newHistory = [...state.searchHistory];
          
          // Remove existing entry if it exists
          if (existingIndex >= 0) {
            newHistory.splice(existingIndex, 1);
          }
          
          // Add to beginning
          newHistory = [newItem, ...newHistory];
          
          // Trim to max size
          if (newHistory.length > state.maxHistorySize) {
            newHistory = newHistory.slice(0, state.maxHistorySize);
          }
          
          return { searchHistory: newHistory };
        });
      },

      removeFromHistory: (id) => {
        set((state) => ({
          searchHistory: state.searchHistory.filter((item) => item.id !== id),
        }));
      },

      clearHistory: () => {
        set({ searchHistory: [] });
      },

      getRecentSearches: (limit = 10) => {
        return get().searchHistory.slice(0, limit);
      },

      setCurrentQuery: (query) => {
        set({ currentQuery: query });
      },

      setCurrentFilters: (filters) => {
        set((state) => ({
          currentFilters: { ...state.currentFilters, ...filters },
        }));
      },

      resetFilters: () => {
        set({ currentFilters: { ...DEFAULT_FILTERS } });
      },

      setIsSearching: (isSearching) => {
        set({ isSearching });
      },
    }),
    {
      name: 'search-storage',
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        maxHistorySize: state.maxHistorySize,
      }),
    }
  )
);
