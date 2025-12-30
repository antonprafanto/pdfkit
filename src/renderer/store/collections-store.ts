/**
 * Collections Store - Virtual folders for organizing files
 * Allows users to create collections and assign files to them
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionFile {
  collectionId: string;
  filePath: string;
  fileName: string;
  addedAt: Date;
}

interface CollectionsState {
  collections: Collection[];
  collectionFiles: CollectionFile[];
  
  // Collection CRUD
  createCollection: (name: string, color?: string, description?: string) => string;
  updateCollection: (id: string, updates: Partial<Pick<Collection, 'name' | 'description' | 'color'>>) => void;
  deleteCollection: (id: string) => void;
  
  // File assignment
  addFileToCollection: (collectionId: string, filePath: string, fileName: string) => void;
  removeFileFromCollection: (collectionId: string, filePath: string) => void;
  getFilesInCollection: (collectionId: string) => CollectionFile[];
  getCollectionsForFile: (filePath: string) => Collection[];
  isFileInCollection: (collectionId: string, filePath: string) => boolean;
  
  // Utilities
  getCollection: (id: string) => Collection | undefined;
  clearAllCollections: () => void;
}

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export const useCollectionsStore = create<CollectionsState>()(
  persist(
    (set, get) => ({
      collections: [],
      collectionFiles: [],

      createCollection: (name, color, description) => {
        const id = `col_${Date.now()}`;
        const newCollection: Collection = {
          id,
          name,
          description: description || '',
          color: color || DEFAULT_COLORS[get().collections.length % DEFAULT_COLORS.length],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          collections: [...state.collections, newCollection],
        }));

        return id;
      },

      updateCollection: (id, updates) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
        }));
      },

      deleteCollection: (id) => {
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
          collectionFiles: state.collectionFiles.filter((cf) => cf.collectionId !== id),
        }));
      },

      addFileToCollection: (collectionId, filePath, fileName) => {
        const existing = get().collectionFiles.find(
          (cf) => cf.collectionId === collectionId && cf.filePath === filePath
        );
        if (existing) return; // Already in collection

        const newEntry: CollectionFile = {
          collectionId,
          filePath,
          fileName,
          addedAt: new Date(),
        };

        set((state) => ({
          collectionFiles: [...state.collectionFiles, newEntry],
        }));
      },

      removeFileFromCollection: (collectionId, filePath) => {
        set((state) => ({
          collectionFiles: state.collectionFiles.filter(
            (cf) => !(cf.collectionId === collectionId && cf.filePath === filePath)
          ),
        }));
      },

      getFilesInCollection: (collectionId) => {
        return get().collectionFiles.filter((cf) => cf.collectionId === collectionId);
      },

      getCollectionsForFile: (filePath) => {
        const collectionIds = get()
          .collectionFiles.filter((cf) => cf.filePath === filePath)
          .map((cf) => cf.collectionId);
        
        return get().collections.filter((c) => collectionIds.includes(c.id));
      },

      isFileInCollection: (collectionId, filePath) => {
        return get().collectionFiles.some(
          (cf) => cf.collectionId === collectionId && cf.filePath === filePath
        );
      },

      getCollection: (id) => {
        return get().collections.find((c) => c.id === id);
      },

      clearAllCollections: () => {
        set({ collections: [], collectionFiles: [] });
      },
    }),
    {
      name: 'collections-storage',
    }
  )
);

export { DEFAULT_COLORS as COLLECTION_COLORS };
