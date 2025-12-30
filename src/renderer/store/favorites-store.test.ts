/**
 * Favorites Store Tests
 * Test favorites/starred file management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useFavoritesStore } from '../store/favorites-store';

describe('Favorites Store', () => {
  beforeEach(() => {
    // Reset store
    useFavoritesStore.setState({ favorites: [] });
  });

  describe('Add Favorite', () => {
    it('should add a file to favorites', () => {
      const { addFavorite } = useFavoritesStore.getState();
      
      addFavorite('/path/to/document.pdf', 'document.pdf');
      
      const { favorites } = useFavoritesStore.getState();
      expect(favorites).toHaveLength(1);
      expect(favorites[0].path).toBe('/path/to/document.pdf');
      expect(favorites[0].name).toBe('document.pdf');
    });

    it('should not add duplicate favorites', () => {
      const { addFavorite } = useFavoritesStore.getState();
      
      addFavorite('/path/to/document.pdf', 'document.pdf');
      addFavorite('/path/to/document.pdf', 'document.pdf');
      
      const { favorites } = useFavoritesStore.getState();
      expect(favorites).toHaveLength(1);
    });

    it('should add multiple different files', () => {
      const { addFavorite } = useFavoritesStore.getState();
      
      addFavorite('/path/to/doc1.pdf', 'doc1.pdf');
      addFavorite('/path/to/doc2.pdf', 'doc2.pdf');
      addFavorite('/path/to/doc3.pdf', 'doc3.pdf');
      
      const { favorites } = useFavoritesStore.getState();
      expect(favorites).toHaveLength(3);
    });
  });

  describe('Remove Favorite', () => {
    it('should remove a file from favorites', () => {
      const { addFavorite, removeFavorite } = useFavoritesStore.getState();
      
      addFavorite('/path/to/document.pdf', 'document.pdf');
      expect(useFavoritesStore.getState().favorites).toHaveLength(1);
      
      removeFavorite('/path/to/document.pdf');
      expect(useFavoritesStore.getState().favorites).toHaveLength(0);
    });

    it('should not fail when removing non-existent favorite', () => {
      const { removeFavorite } = useFavoritesStore.getState();
      
      // Should not throw
      expect(() => removeFavorite('/non/existent.pdf')).not.toThrow();
    });
  });

  describe('Check Favorite', () => {
    it('should correctly identify if file is favorite', () => {
      const { addFavorite, isFavorite } = useFavoritesStore.getState();
      
      addFavorite('/path/to/document.pdf', 'document.pdf');
      
      const isDocFavorite = useFavoritesStore.getState().isFavorite('/path/to/document.pdf');
      const isOtherFavorite = useFavoritesStore.getState().isFavorite('/other/file.pdf');
      
      expect(isDocFavorite).toBe(true);
      expect(isOtherFavorite).toBe(false);
    });
  });

  describe('Get Favorite', () => {
    it('should get favorite by path', () => {
      const { addFavorite, getFavorite } = useFavoritesStore.getState();
      
      addFavorite('/path/to/document.pdf', 'document.pdf');
      
      const favorite = useFavoritesStore.getState().getFavorite('/path/to/document.pdf');
      expect(favorite).toBeDefined();
      expect(favorite?.name).toBe('document.pdf');
    });

    it('should return undefined for non-favorite', () => {
      const { getFavorite } = useFavoritesStore.getState();
      
      const favorite = getFavorite('/non/existent.pdf');
      expect(favorite).toBeUndefined();
    });
  });

  describe('Clear All Favorites', () => {
    it('should clear all favorites', () => {
      const { addFavorite, clearAllFavorites } = useFavoritesStore.getState();
      
      addFavorite('/path/to/doc1.pdf', 'doc1.pdf');
      addFavorite('/path/to/doc2.pdf', 'doc2.pdf');
      expect(useFavoritesStore.getState().favorites).toHaveLength(2);
      
      useFavoritesStore.getState().clearAllFavorites();
      expect(useFavoritesStore.getState().favorites).toHaveLength(0);
    });
  });
});
