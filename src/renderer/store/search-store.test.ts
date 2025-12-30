/**
 * Search Store Tests
 * Test search history and advanced search state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSearchStore } from '../store/search-store';

describe('Search Store', () => {
  beforeEach(() => {
    // Reset store to initial state including all fields
    useSearchStore.setState({ 
      searchHistory: [],
      maxHistorySize: 50,
      currentQuery: '',
      currentFilters: {
        inFavorites: false,
        inCollections: [],
        withTags: [],
        dateFrom: undefined,
        dateTo: undefined,
      },
      isSearching: false,
    });
  });

  describe('Search History', () => {
    it('should add search to history', () => {
      const { addToHistory } = useSearchStore.getState();
      
      addToHistory('invoice', 5);
      
      const { searchHistory } = useSearchStore.getState();
      expect(searchHistory).toHaveLength(1);
      expect(searchHistory[0].query).toBe('invoice');
      expect(searchHistory[0].resultCount).toBe(5);
    });

    it('should update result count for duplicate queries', () => {
      const { addToHistory } = useSearchStore.getState();
      
      addToHistory('invoice', 5);
      addToHistory('invoice', 3); // Same query
      
      const { searchHistory } = useSearchStore.getState();
      expect(searchHistory).toHaveLength(1);
      // Should update result count by moving to front
      expect(searchHistory[0].resultCount).toBe(3);
    });

    it('should not add empty queries', () => {
      const { addToHistory } = useSearchStore.getState();
      
      addToHistory('   ', 0);
      addToHistory('', 0);
      
      const { searchHistory } = useSearchStore.getState();
      expect(searchHistory).toHaveLength(0);
    });

    it('should remove specific item from history', () => {
      // Use setState to directly set up test data with known IDs
      useSearchStore.setState({
        searchHistory: [
          { id: 'test_id_1', query: 'query1', timestamp: new Date(), resultCount: 1 },
          { id: 'test_id_2', query: 'query2', timestamp: new Date(), resultCount: 2 },
        ],
      });
      
      expect(useSearchStore.getState().searchHistory).toHaveLength(2);
      
      useSearchStore.getState().removeFromHistory('test_id_1');
      
      const remaining = useSearchStore.getState().searchHistory;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].query).toBe('query2');
    });

    it('should clear all history', () => {
      const { addToHistory, clearHistory } = useSearchStore.getState();
      
      addToHistory('query1', 1);
      addToHistory('query2', 2);
      addToHistory('query3', 3);
      
      useSearchStore.getState().clearHistory();
      
      expect(useSearchStore.getState().searchHistory).toHaveLength(0);
    });

    it('should get recent searches', () => {
      const { addToHistory, getRecentSearches } = useSearchStore.getState();
      
      addToHistory('query1', 1);
      addToHistory('query2', 2);
      addToHistory('query3', 3);
      
      const recent = useSearchStore.getState().getRecentSearches(2);
      expect(recent).toHaveLength(2);
    });
  });

  describe('Search Query', () => {
    it('should set current query', () => {
      const { setCurrentQuery } = useSearchStore.getState();
      
      setCurrentQuery('invoice 2024');
      
      expect(useSearchStore.getState().currentQuery).toBe('invoice 2024');
    });

    it('should clear query', () => {
      const { setCurrentQuery } = useSearchStore.getState();
      
      setCurrentQuery('invoice');
      expect(useSearchStore.getState().currentQuery).toBe('invoice');
      
      setCurrentQuery('');
      expect(useSearchStore.getState().currentQuery).toBe('');
    });
  });

  describe('Search Filters', () => {
    it('should set favorites filter', () => {
      const { setCurrentFilters } = useSearchStore.getState();
      
      setCurrentFilters({ inFavorites: true });
      
      expect(useSearchStore.getState().currentFilters.inFavorites).toBe(true);
    });

    it('should set collection filters', () => {
      const { setCurrentFilters } = useSearchStore.getState();
      
      setCurrentFilters({ inCollections: ['col1', 'col2'] });
      
      expect(useSearchStore.getState().currentFilters.inCollections).toEqual(['col1', 'col2']);
    });

    it('should set tag filters', () => {
      const { setCurrentFilters } = useSearchStore.getState();
      
      setCurrentFilters({ withTags: ['tag1', 'tag2'] });
      
      expect(useSearchStore.getState().currentFilters.withTags).toEqual(['tag1', 'tag2']);
    });

    it('should reset all filters', () => {
      const { setCurrentFilters, resetFilters } = useSearchStore.getState();
      
      setCurrentFilters({ 
        inFavorites: true, 
        inCollections: ['col1'],
        withTags: ['tag1'] 
      });
      
      useSearchStore.getState().resetFilters();
      
      const { currentFilters } = useSearchStore.getState();
      expect(currentFilters.inFavorites).toBe(false);
      expect(currentFilters.inCollections).toEqual([]);
      expect(currentFilters.withTags).toEqual([]);
    });
  });

  describe('Search State', () => {
    it('should set searching state', () => {
      const { setIsSearching } = useSearchStore.getState();
      
      expect(useSearchStore.getState().isSearching).toBe(false);
      
      setIsSearching(true);
      expect(useSearchStore.getState().isSearching).toBe(true);
      
      setIsSearching(false);
      expect(useSearchStore.getState().isSearching).toBe(false);
    });
  });
});
