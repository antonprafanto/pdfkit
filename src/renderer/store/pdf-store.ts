/**
 * PDF Store - Zustand State Management
 * Manages PDF document state, page navigation, zoom, rotation
 */

import { create } from 'zustand';
import { PDFDocumentProxy } from '../lib/pdf-config';

export interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
}

interface PDFState {
  // Document state
  document: PDFDocumentProxy | null;
  metadata: PDFMetadata | null;
  fileName: string | null;
  filePath: string | null; // Full path for printing
  totalPages: number;

  // View state
  currentPage: number;
  scale: number;
  rotation: number;

  // UI state
  isLoading: boolean;
  error: string | null;

  // View mode
  viewMode: 'single' | 'continuous' | 'facing';

  // Actions
  setDocument: (document: PDFDocumentProxy | null) => void;
  setMetadata: (metadata: PDFMetadata | null) => void;
  setFileName: (fileName: string | null) => void;
  setFilePath: (filePath: string | null) => void;
  setCurrentPage: (page: number) => void;
  setScale: (scale: number) => void;
  setRotation: (rotation: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setViewMode: (mode: 'single' | 'continuous' | 'facing') => void;

  // Navigation
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;

  // Zoom
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToWidth: (containerWidth: number, pageWidth: number) => void;
  fitToPage: (containerWidth: number, containerHeight: number, pageWidth: number, pageHeight: number) => void;

  // Rotation
  rotateClockwise: () => void;
  rotateCounterClockwise: () => void;
  resetRotation: () => void;

  // Reset
  reset: () => void;
}

export const usePDFStore = create<PDFState>((set, get) => ({
  // Initial state
  document: null,
  metadata: null,
  fileName: null,
  filePath: null,
  totalPages: 0,
  currentPage: 1,
  scale: 1.0,
  rotation: 0,
  isLoading: false,
  error: null,
  viewMode: 'single',

  // Setters
  setDocument: (document) => set({
    document,
    totalPages: document?.numPages || 0,
    currentPage: document ? 1 : 0,
  }),
  setMetadata: (metadata) => set({ metadata }),
  setFileName: (fileName) => set({ fileName }),
  setFilePath: (filePath) => set({ filePath }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setScale: (scale) => set({ scale: Math.max(0.25, Math.min(5.0, scale)) }),
  setRotation: (rotation) => set({ rotation: rotation % 360 }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setViewMode: (viewMode) => set({ viewMode }),

  // Navigation
  nextPage: () => {
    const { currentPage, totalPages } = get();
    if (currentPage < totalPages) {
      set({ currentPage: currentPage + 1 });
    }
  },

  previousPage: () => {
    const { currentPage } = get();
    if (currentPage > 1) {
      set({ currentPage: currentPage - 1 });
    }
  },

  goToPage: (page) => {
    const { totalPages } = get();
    if (page >= 1 && page <= totalPages) {
      set({ currentPage: page });
    }
  },

  // Zoom
  zoomIn: () => {
    const { scale } = get();
    set({ scale: Math.min(5.0, scale + 0.25) });
  },

  zoomOut: () => {
    const { scale } = get();
    set({ scale: Math.max(0.25, scale - 0.25) });
  },

  resetZoom: () => set({ scale: 1.0 }),

  fitToWidth: (containerWidth: number, pageWidth: number) => {
    // Calculate scale to fit page width to container width
    // Leave some padding (20px on each side)
    const padding = 40;
    const availableWidth = containerWidth - padding;
    const scale = Math.min(5.0, Math.max(0.25, availableWidth / pageWidth));
    set({ scale });
  },

  fitToPage: (containerWidth: number, containerHeight: number, pageWidth: number, pageHeight: number) => {
    // Calculate scale to fit entire page in container
    const padding = 40;
    const availableWidth = containerWidth - padding;
    const availableHeight = containerHeight - padding;

    const scaleWidth = availableWidth / pageWidth;
    const scaleHeight = availableHeight / pageHeight;

    // Use the smaller scale to ensure page fits both dimensions
    const scale = Math.min(5.0, Math.max(0.25, Math.min(scaleWidth, scaleHeight)));
    set({ scale });
  },

  // Rotation
  rotateClockwise: () => {
    const { rotation } = get();
    set({ rotation: (rotation + 90) % 360 });
  },

  rotateCounterClockwise: () => {
    const { rotation } = get();
    set({ rotation: (rotation - 90 + 360) % 360 });
  },

  resetRotation: () => set({ rotation: 0 }),

  reset: () => set({
    document: null,
    metadata: null,
    fileName: null,
    filePath: null,
    totalPages: 0,
    currentPage: 1,
    scale: 1.0,
    rotation: 0,
    isLoading: false,
    error: null,
    viewMode: 'single',
  }),
}));
