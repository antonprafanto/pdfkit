/**
 * Collections Store Tests
 * Test virtual folders/collections management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCollectionsStore } from '../store/collections-store';

describe('Collections Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useCollectionsStore.setState({ 
      collections: [], 
      collectionFiles: [] 
    }, true); // Replace entire state
  });

  describe('Create Collection', () => {
    it('should create a new collection with explicit color', () => {
      const { createCollection } = useCollectionsStore.getState();
      
      createCollection('Work Documents', '#3B82F6');
      
      const { collections } = useCollectionsStore.getState();
      expect(collections).toHaveLength(1);
      expect(collections[0].name).toBe('Work Documents');
      expect(collections[0].color).toBe('#3B82F6');
    });

    it('should create a collection with default color when not provided', () => {
      const { createCollection } = useCollectionsStore.getState();
      
      createCollection('Test Collection');
      
      const { collections } = useCollectionsStore.getState();
      expect(collections).toHaveLength(1);
      expect(collections[0].name).toBe('Test Collection');
      expect(collections[0].color).toBeDefined();
    });
  });

  describe('Update Collection', () => {
    it('should update collection name', () => {
      useCollectionsStore.setState({
        collections: [{
          id: 'test_col_1',
          name: 'Old Name',
          color: '#3B82F6',
          description: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        collectionFiles: [],
      }, true);
      
      useCollectionsStore.getState().updateCollection('test_col_1', { name: 'New Name' });
      
      expect(useCollectionsStore.getState().collections[0].name).toBe('New Name');
    });
  });

  describe('Delete Collection', () => {
    it('should delete collection and its files', () => {
      useCollectionsStore.setState({
        collections: [{
          id: 'test_col_1',
          name: 'To Delete',
          color: '#3B82F6',
          description: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        collectionFiles: [{
          collectionId: 'test_col_1',
          filePath: '/doc.pdf',
          fileName: 'doc.pdf',
          addedAt: new Date(),
        }],
      }, true);
      
      expect(useCollectionsStore.getState().collections).toHaveLength(1);
      expect(useCollectionsStore.getState().collectionFiles).toHaveLength(1);
      
      useCollectionsStore.getState().deleteCollection('test_col_1');
      
      expect(useCollectionsStore.getState().collections).toHaveLength(0);
      expect(useCollectionsStore.getState().collectionFiles).toHaveLength(0);
    });
  });

  describe('Collection Files', () => {
    it('should add file to collection', () => {
      useCollectionsStore.setState({
        collections: [{
          id: 'test_col_1',
          name: 'Test',
          color: '#3B82F6',
          description: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        collectionFiles: [],
      }, true);
      
      useCollectionsStore.getState().addFileToCollection('test_col_1', '/file.pdf', 'file.pdf');
      
      const { collectionFiles } = useCollectionsStore.getState();
      expect(collectionFiles).toHaveLength(1);
      expect(collectionFiles[0].fileName).toBe('file.pdf');
    });

    it('should check if file is in collection', () => {
      useCollectionsStore.setState({
        collections: [{
          id: 'test_col_1',
          name: 'Test',
          color: '#3B82F6',
          description: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        collectionFiles: [{
          collectionId: 'test_col_1',
          filePath: '/doc.pdf',
          fileName: 'doc.pdf',
          addedAt: new Date(),
        }],
      }, true);
      
      expect(useCollectionsStore.getState().isFileInCollection('test_col_1', '/doc.pdf')).toBe(true);
      expect(useCollectionsStore.getState().isFileInCollection('test_col_1', '/other.pdf')).toBe(false);
    });
  });
});
