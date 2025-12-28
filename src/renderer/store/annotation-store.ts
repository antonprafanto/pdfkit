/**
 * Annotation Store - Zustand State Management
 * Manages annotation state, tool selection, and undo/redo
 * Now with per-document annotation storage
 */

import { create } from 'zustand';

// Annotation Types
export type AnnotationType = 'highlight' | 'sticky-note' | 'drawing' | 'stamp' | 'text';

export interface AnnotationBase {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  createdAt: string;
  updatedAt: string;
  color: string;
}

export interface HighlightAnnotation extends AnnotationBase {
  type: 'highlight';
  rects: Array<{ x: number; y: number; width: number; height: number }>;
  selectedText?: string;
}

export interface StickyNoteAnnotation extends AnnotationBase {
  type: 'sticky-note';
  x: number;
  y: number;
  content: string;
  isExpanded: boolean;
}

export interface DrawingAnnotation extends AnnotationBase {
  type: 'drawing';
  tool: 'pen' | 'rectangle' | 'circle' | 'line' | 'arrow';
  points: Array<{ x: number; y: number }>;
  strokeWidth: number;
  fill?: string;
}

export interface StampAnnotation extends AnnotationBase {
  type: 'stamp';
  x: number;
  y: number;
  stampType: 'approved' | 'rejected' | 'draft' | 'confidential' | 'reviewed' | 'custom';
  customText?: string;
  scale: number;
  rotation: number;
}

export interface TextAnnotation extends AnnotationBase {
  type: 'text';
  x: number;
  y: number;
  content: string;
  fontSize: number;
  fontFamily: string;
}

export type Annotation = 
  | HighlightAnnotation 
  | StickyNoteAnnotation 
  | DrawingAnnotation 
  | StampAnnotation 
  | TextAnnotation;

// Tool Selection
export type AnnotationTool = 
  | 'select' 
  | 'highlight' 
  | 'sticky-note' 
  | 'pen' 
  | 'rectangle' 
  | 'circle' 
  | 'line' 
  | 'arrow' 
  | 'stamp' 
  | 'text';

// Store State
interface AnnotationState {
  // Document tracking
  currentDocumentId: string | null;
  
  // Annotations
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  
  // Tool state
  currentTool: AnnotationTool;
  currentColor: string;
  strokeWidth: number;
  fontSize: number;
  stampType: StampAnnotation['stampType'];
  
  // Undo/Redo
  history: Annotation[][];
  historyIndex: number;
  
  // Actions - Document
  setCurrentDocument: (documentId: string | null) => void;
  
  // Actions - Annotations
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Record<string, any>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  clearAnnotations: () => void;
  loadAnnotations: (annotations: Annotation[]) => void;
  mergeWithImportedAnnotations: (importedAnnotations: Annotation[]) => void;
  
  // Actions - Tools
  setCurrentTool: (tool: AnnotationTool) => void;
  setCurrentColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFontSize: (size: number) => void;
  setStampType: (type: StampAnnotation['stampType']) => void;
  
  // Actions - Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Getters
  getAnnotationsByPage: (pageNumber: number) => Annotation[];
  getAnnotationById: (id: string) => Annotation | undefined;
}

// Generate unique ID
const generateId = () => `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Local storage key prefix
const STORAGE_PREFIX = 'pdf-kit-annotations-';

// Get storage key for a document
const getStorageKey = (documentId: string | null): string => {
  if (!documentId) return STORAGE_PREFIX + 'default';
  // Create a simple hash from the filename
  return STORAGE_PREFIX + documentId.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
};

// Load from localStorage for a specific document
const loadFromStorage = (documentId: string | null): Annotation[] => {
  try {
    const key = getStorageKey(documentId);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save to localStorage for a specific document
const saveToStorage = (documentId: string | null, annotations: Annotation[]) => {
  try {
    const key = getStorageKey(documentId);
    localStorage.setItem(key, JSON.stringify(annotations));
  } catch (e) {
    console.error('Failed to save annotations:', e);
  }
};

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  // Initial state
  currentDocumentId: null,
  annotations: [],
  selectedAnnotationId: null,
  
  currentTool: 'select',
  currentColor: '#FFEB3B', // Yellow highlight default
  strokeWidth: 2,
  fontSize: 14,
  stampType: 'approved',
  
  history: [[]],
  historyIndex: 0,
  
  // Set current document and load its annotations
  setCurrentDocument: (documentId: string | null) => {
    const annotations = loadFromStorage(documentId);
    set({
      currentDocumentId: documentId,
      annotations,
      selectedAnnotationId: null,
      history: [annotations],
      historyIndex: 0,
    });
  },
  
  // Annotation actions
  addAnnotation: (annotation: Annotation) => {
    const newAnnotation = {
      ...annotation,
      id: annotation.id || generateId(),
      createdAt: annotation.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    set((state) => {
      const newAnnotations = [...state.annotations, newAnnotation];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newAnnotations);
      
      saveToStorage(state.currentDocumentId, newAnnotations);
      
      return {
        annotations: newAnnotations,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },
  
  updateAnnotation: (id: string, updates: Record<string, any>) => {
    set((state) => {
      const newAnnotations = state.annotations.map((ann) =>
        ann.id === id
          ? { ...ann, ...updates, updatedAt: new Date().toISOString() } as Annotation
          : ann
      );
      
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newAnnotations);
      
      saveToStorage(state.currentDocumentId, newAnnotations);
      
      return {
        annotations: newAnnotations,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },
  
  deleteAnnotation: (id: string) => {
    set((state) => {
      const newAnnotations = state.annotations.filter((ann) => ann.id !== id);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newAnnotations);
      
      saveToStorage(state.currentDocumentId, newAnnotations);
      
      return {
        annotations: newAnnotations,
        selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },
  
  selectAnnotation: (id: string | null) => {
    set({ selectedAnnotationId: id });
  },
  
  clearAnnotations: () => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([]);
      
      saveToStorage(state.currentDocumentId, []);
      
      return {
        annotations: [],
        selectedAnnotationId: null,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },
  
  loadAnnotations: (annotations: Annotation[]) => {
    set((state) => {
      saveToStorage(state.currentDocumentId, annotations);
      return {
        annotations,
        history: [annotations],
        historyIndex: 0,
      };
    });
  },
  
  // Merge imported annotations from PDF with local annotations from localStorage
  mergeWithImportedAnnotations: (importedAnnotations: Annotation[]) => {
    set((state) => {
      // Get annotations from localStorage
      const localAnnotations = loadFromStorage(state.currentDocumentId);
      
      // Keep local annotations that weren't imported (user-created ones)
      const localOnly = localAnnotations.filter(a => !a.id.startsWith('imported_'));
      
      // Combine: imported (from PDF) + local (from user)
      const merged = [...importedAnnotations, ...localOnly];
      
      // Don't save to storage yet - imported annotations are read-only references
      return {
        annotations: merged,
        history: [merged],
        historyIndex: 0,
      };
    });
  },
  
  // Tool actions
  setCurrentTool: (tool: AnnotationTool) => {
    set({ currentTool: tool, selectedAnnotationId: null });
  },
  
  setCurrentColor: (color: string) => {
    set({ currentColor: color });
  },
  
  setStrokeWidth: (width: number) => {
    set({ strokeWidth: width });
  },
  
  setFontSize: (size: number) => {
    set({ fontSize: size });
  },
  
  setStampType: (type: StampAnnotation['stampType']) => {
    set({ stampType: type });
  },
  
  // Undo/Redo
  undo: () => {
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        const annotations = state.history[newIndex];
        saveToStorage(state.currentDocumentId, annotations);
        return {
          annotations,
          historyIndex: newIndex,
          selectedAnnotationId: null,
        };
      }
      return state;
    });
  },
  
  redo: () => {
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        const annotations = state.history[newIndex];
        saveToStorage(state.currentDocumentId, annotations);
        return {
          annotations,
          historyIndex: newIndex,
          selectedAnnotationId: null,
        };
      }
      return state;
    });
  },
  
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
  
  // Getters
  getAnnotationsByPage: (pageNumber: number) => {
    return get().annotations.filter((ann) => ann.pageNumber === pageNumber);
  },
  
  getAnnotationById: (id: string) => {
    return get().annotations.find((ann) => ann.id === id);
  },
}));
