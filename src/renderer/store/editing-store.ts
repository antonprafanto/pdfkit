/**
 * Editing Store
 * Zustand store for managing PDF editing state
 */

import { create } from 'zustand';

export type EditingOperation =
  | 'merge'
  | 'split'
  | 'delete'
  | 'rotate'
  | 'reorder'
  | 'extract'
  | 'duplicate'
  | null;

interface EditingState {
  // Selection state
  selectedPages: Set<number>;
  isSelectionMode: boolean;

  // Current operation
  currentOperation: EditingOperation;
  isProcessing: boolean;
  progress: number;
  error: string | null;

  // Modified PDF data
  modifiedPdfBytes: Uint8Array | null;
  hasUnsavedChanges: boolean;
  originalFile: File | null;

  // Actions - Selection
  togglePageSelection: (pageNumber: number) => void;
  selectPages: (pageNumbers: number[]) => void;
  selectAllPages: (totalPages: number) => void;
  clearSelection: () => void;
  setSelectionMode: (enabled: boolean) => void;

  // Actions - Operations
  setCurrentOperation: (operation: EditingOperation) => void;
  setProcessing: (isProcessing: boolean, progress?: number) => void;
  setError: (error: string | null) => void;

  // Actions - Modified PDF
  setModifiedPdf: (pdfBytes: Uint8Array | null) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setOriginalFile: (file: File | null) => void;

  // Actions - Reset
  reset: () => void;
}

export const useEditingStore = create<EditingState>((set, get) => ({
  // Initial state
  selectedPages: new Set(),
  isSelectionMode: false,
  currentOperation: null,
  isProcessing: false,
  progress: 0,
  error: null,
  modifiedPdfBytes: null,
  hasUnsavedChanges: false,
  originalFile: null,

  // Selection actions
  togglePageSelection: (pageNumber: number) => {
    set((state) => {
      const newSelection = new Set(state.selectedPages);
      if (newSelection.has(pageNumber)) {
        newSelection.delete(pageNumber);
      } else {
        newSelection.add(pageNumber);
      }
      return { selectedPages: newSelection };
    });
  },

  selectPages: (pageNumbers: number[]) => {
    set({ selectedPages: new Set(pageNumbers) });
  },

  selectAllPages: (totalPages: number) => {
    const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);
    set({ selectedPages: new Set(allPages) });
  },

  clearSelection: () => {
    set({ selectedPages: new Set() });
  },

  setSelectionMode: (enabled: boolean) => {
    set({ isSelectionMode: enabled });
    if (!enabled) {
      get().clearSelection();
    }
  },

  // Operation actions
  setCurrentOperation: (operation: EditingOperation) => {
    set({
      currentOperation: operation,
      error: null,
      progress: 0
    });
  },

  setProcessing: (isProcessing: boolean, progress: number = 0) => {
    set({ isProcessing, progress });
  },

  setError: (error: string | null) => {
    set({ error, isProcessing: false });
  },

  // Modified PDF actions
  setModifiedPdf: (pdfBytes: Uint8Array | null) => {
    set({
      modifiedPdfBytes: pdfBytes,
      hasUnsavedChanges: pdfBytes !== null
    });
  },

  setHasUnsavedChanges: (hasChanges: boolean) => {
    set({ hasUnsavedChanges: hasChanges });
  },

  setOriginalFile: (file: File | null) => {
    set({ originalFile: file });
  },

  // Reset
  reset: () => {
    set({
      selectedPages: new Set(),
      isSelectionMode: false,
      currentOperation: null,
      isProcessing: false,
      progress: 0,
      error: null,
      modifiedPdfBytes: null,
      hasUnsavedChanges: false,
      originalFile: null,
    });
  },
}));
