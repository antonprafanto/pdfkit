/**
 * Tags Store - Labels for organizing and filtering files
 * Allows users to create tags with colors and assign them to files
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface FileTag {
  filePath: string;
  tagId: string;
}

interface TagsState {
  tags: Tag[];
  fileTags: FileTag[];
  
  // Tag CRUD
  createTag: (name: string, color: string) => string;
  updateTag: (id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>) => void;
  deleteTag: (id: string) => void;
  
  // Tag assignment
  assignTag: (filePath: string, tagId: string) => void;
  unassignTag: (filePath: string, tagId: string) => void;
  getTagsForFile: (filePath: string) => Tag[];
  getFilesWithTag: (tagId: string) => string[];
  hasTag: (filePath: string, tagId: string) => boolean;
  
  // Utilities
  getTag: (id: string) => Tag | undefined;
  clearAllTags: () => void;
}

const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
  '#f43f5e', // rose
];

export const useTagsStore = create<TagsState>()(
  persist(
    (set, get) => ({
      tags: [],
      fileTags: [],

      createTag: (name, color) => {
        const id = `tag_${Date.now()}`;
        const newTag: Tag = {
          id,
          name,
          color,
          createdAt: new Date(),
        };

        set((state) => ({
          tags: [...state.tags, newTag],
        }));

        return id;
      },

      updateTag: (id, updates) => {
        set((state) => ({
          tags: state.tags.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTag: (id) => {
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== id),
          fileTags: state.fileTags.filter((ft) => ft.tagId !== id),
        }));
      },

      assignTag: (filePath, tagId) => {
        const existing = get().fileTags.find(
          (ft) => ft.filePath === filePath && ft.tagId === tagId
        );
        if (existing) return; // Already assigned

        set((state) => ({
          fileTags: [...state.fileTags, { filePath, tagId }],
        }));
      },

      unassignTag: (filePath, tagId) => {
        set((state) => ({
          fileTags: state.fileTags.filter(
            (ft) => !(ft.filePath === filePath && ft.tagId === tagId)
          ),
        }));
      },

      getTagsForFile: (filePath) => {
        const tagIds = get()
          .fileTags.filter((ft) => ft.filePath === filePath)
          .map((ft) => ft.tagId);
        
        return get().tags.filter((t) => tagIds.includes(t.id));
      },

      getFilesWithTag: (tagId) => {
        return get()
          .fileTags.filter((ft) => ft.tagId === tagId)
          .map((ft) => ft.filePath);
      },

      hasTag: (filePath, tagId) => {
        return get().fileTags.some(
          (ft) => ft.filePath === filePath && ft.tagId === tagId
        );
      },

      getTag: (id) => {
        return get().tags.find((t) => t.id === id);
      },

      clearAllTags: () => {
        set({ tags: [], fileTags: [] });
      },
    }),
    {
      name: 'tags-storage',
    }
  )
);

export { TAG_COLORS };
