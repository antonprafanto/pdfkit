/**
 * PDF Store - Zustand State Management
 * Manages PDF document state with multi-tab support
 * Each tab has its own document, page, zoom, rotation state
 */

import { create } from 'zustand';
import { PDFDocumentProxy } from '../lib/pdf-config';
import { normalizeViewMode, type ViewMode } from '../lib/view-mode';

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

// Tab state - each open document is a tab
export interface TabState {
  id: string;
  document: PDFDocumentProxy | null;
  metadata: PDFMetadata | null;
  fileName: string | null;
  filePath: string | null;
  pdfBytes: Uint8Array | null;
  totalPages: number;
  currentPage: number;
  scale: number;
  rotation: number;
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
}

// Generate unique tab ID
const generateTabId = () => `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Create empty tab state
const createEmptyTab = (id?: string): TabState => ({
  id: id || generateTabId(),
  document: null,
  metadata: null,
  fileName: null,
  filePath: null,
  pdfBytes: null,
  totalPages: 0,
  currentPage: 1,
  scale: 1.0,
  rotation: 0,
  viewMode: 'continuous',
  isLoading: false,
  error: null,
  hasUnsavedChanges: false,
});

// Maximum number of tabs allowed
const MAX_TABS = 10;

interface PDFTabsState {
  // Tab management
  tabs: TabState[];
  activeTabId: string | null;

  // Tab actions
  addTab: (initialState?: Partial<TabState>) => string; // Returns new tab ID
  removeTab: (tabId: string) => boolean; // Returns true if removed
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<TabState>) => void;
  getActiveTab: () => TabState | null;
  getTabById: (tabId: string) => TabState | undefined;
  findTabByFilePath: (filePath: string) => TabState | undefined;
  canAddTab: () => boolean;
  getTabCount: () => number;

  // Legacy compatibility - operate on active tab
  document: PDFDocumentProxy | null;
  metadata: PDFMetadata | null;
  fileName: string | null;
  filePath: string | null;
  totalPages: number;
  currentPage: number;
  scale: number;
  rotation: number;
  isLoading: boolean;
  error: string | null;
  viewMode: ViewMode;

  // Setters (operate on active tab)
  setDocument: (document: PDFDocumentProxy | null) => void;
  setMetadata: (metadata: PDFMetadata | null) => void;
  setFileName: (fileName: string | null) => void;
  setFilePath: (filePath: string | null) => void;
  setCurrentPage: (page: number) => void;
  setScale: (scale: number) => void;
  setRotation: (rotation: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setPdfBytes: (bytes: Uint8Array | null) => void;
  setHasUnsavedChanges: (value: boolean) => void;

  // Navigation (operate on active tab)
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;

  // Zoom (operate on active tab)
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToWidth: (containerWidth: number, pageWidth: number) => void;
  fitToPage: (containerWidth: number, containerHeight: number, pageWidth: number, pageHeight: number) => void;

  // Rotation (operate on active tab)
  rotateClockwise: () => void;
  rotateCounterClockwise: () => void;
  resetRotation: () => void;

  // Reset
  reset: () => void;
  closeAllTabs: () => void;
}

// Helper to get active tab from state
const getActiveTabFromState = (state: { tabs: TabState[]; activeTabId: string | null }): TabState | null => {
  if (!state.activeTabId) return null;
  return state.tabs.find(t => t.id === state.activeTabId) || null;
};

const normalizeTabState = (tab: TabState): TabState => ({
  ...tab,
  viewMode: normalizeViewMode(tab.viewMode),
});

const MIN_SCALE = 0.25;
const MAX_SCALE = 5.0;
const ZOOM_STEP = 0.05;

const clampScale = (scale: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
const roundScale = (scale: number) => Math.round(scale * 100) / 100;

const getNextZoomScale = (scale: number, direction: 'in' | 'out') => {
  const currentPercent = scale * 100;
  const remainder = currentPercent % 5;

  if (direction === 'in') {
    if (remainder === 0) {
      return clampScale(roundScale(scale + ZOOM_STEP));
    }

    return clampScale(roundScale((currentPercent + (5 - remainder)) / 100));
  }

  if (remainder === 0) {
    return clampScale(roundScale(scale - ZOOM_STEP));
  }

  return clampScale(roundScale((currentPercent - remainder) / 100));
};

// Helper to update active tab's property
const updateActiveTabProp = <K extends keyof TabState>(
  set: (fn: (state: PDFTabsState) => Partial<PDFTabsState>) => void,
  get: () => PDFTabsState,
  key: K,
  value: TabState[K]
) => {
  const { activeTabId, tabs } = get();
  if (!activeTabId) return;
  
  set(() => ({
    tabs: tabs.map(t => t.id === activeTabId ? { ...t, [key]: value } : t),
    [key]: value, // Also update legacy property
  }));
};

export const usePDFStore = create<PDFTabsState>((set, get) => ({
  // Initial state - no tabs
  tabs: [],
  activeTabId: null,

  // Legacy compatibility properties (reflect active tab)
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
  viewMode: 'continuous',

  // Tab management actions
  addTab: (initialState?: Partial<TabState>) => {
    const { tabs } = get();
    
    // Check max tabs
    if (tabs.length >= MAX_TABS) {
      console.warn(`[PDFStore] Cannot add tab: maximum ${MAX_TABS} tabs reached`);
      return '';
    }

    const newTab = createEmptyTab();
    if (initialState) {
      Object.assign(newTab, initialState);
    }
    const normalizedTab = normalizeTabState(newTab);

    set({
      tabs: [...tabs, normalizedTab],
      activeTabId: normalizedTab.id,
      // Update legacy properties
      document: normalizedTab.document,
      metadata: normalizedTab.metadata,
      fileName: normalizedTab.fileName,
      filePath: normalizedTab.filePath,
      totalPages: normalizedTab.totalPages,
      currentPage: normalizedTab.currentPage,
      scale: normalizedTab.scale,
      rotation: normalizedTab.rotation,
      isLoading: normalizedTab.isLoading,
      error: normalizedTab.error,
      viewMode: normalizedTab.viewMode,
    });

    return normalizedTab.id;
  },

  removeTab: (tabId: string) => {
    const { tabs, activeTabId } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    
    if (tabIndex === -1) return false;

    const newTabs = tabs.filter(t => t.id !== tabId);
    
    // Determine new active tab
    let newActiveTabId: string | null = null;
    let newActiveTab: TabState | null = null;

    if (newTabs.length > 0) {
      if (activeTabId === tabId) {
        // Closed the active tab - switch to adjacent
        const newIndex = Math.min(tabIndex, newTabs.length - 1);
        newActiveTab = newTabs[newIndex];
        newActiveTabId = newActiveTab.id;
      } else {
        // Closed a different tab - keep current active
        newActiveTabId = activeTabId;
        newActiveTab = newTabs.find(t => t.id === newActiveTabId) || null;
      }
    }

    set({
      tabs: newTabs,
      activeTabId: newActiveTabId,
      // Update legacy properties
      document: newActiveTab?.document || null,
      metadata: newActiveTab?.metadata || null,
      fileName: newActiveTab?.fileName || null,
      filePath: newActiveTab?.filePath || null,
      totalPages: newActiveTab?.totalPages || 0,
      currentPage: newActiveTab?.currentPage || 1,
      scale: newActiveTab?.scale || 1.0,
      rotation: newActiveTab?.rotation || 0,
      isLoading: newActiveTab?.isLoading || false,
      error: newActiveTab?.error || null,
      viewMode: newActiveTab?.viewMode || 'single',
    });

    return true;
  },

  setActiveTab: (tabId: string) => {
    const { tabs } = get();
    const tab = tabs.find(t => t.id === tabId);
    
    if (!tab) return;

    set({
      activeTabId: tabId,
      // Update legacy properties
      document: tab.document,
      metadata: tab.metadata,
      fileName: tab.fileName,
      filePath: tab.filePath,
      totalPages: tab.totalPages,
      currentPage: tab.currentPage,
      scale: tab.scale,
      rotation: tab.rotation,
      isLoading: tab.isLoading,
      error: tab.error,
      viewMode: tab.viewMode,
    });
  },

  updateTab: (tabId: string, updates: Partial<TabState>) => {
    const { tabs, activeTabId } = get();
    
    const newTabs = tabs.map(t => t.id === tabId ? normalizeTabState({ ...t, ...updates }) : t);
    const updateState: Partial<PDFTabsState> = { tabs: newTabs };

    // If updating active tab, also update legacy properties
    if (tabId === activeTabId) {
      if (updates.document !== undefined) updateState.document = updates.document;
      if (updates.metadata !== undefined) updateState.metadata = updates.metadata;
      if (updates.fileName !== undefined) updateState.fileName = updates.fileName;
      if (updates.filePath !== undefined) updateState.filePath = updates.filePath;
      if (updates.totalPages !== undefined) updateState.totalPages = updates.totalPages;
      if (updates.currentPage !== undefined) updateState.currentPage = updates.currentPage;
      if (updates.scale !== undefined) updateState.scale = updates.scale;
      if (updates.rotation !== undefined) updateState.rotation = updates.rotation;
      if (updates.isLoading !== undefined) updateState.isLoading = updates.isLoading;
      if (updates.error !== undefined) updateState.error = updates.error;
      if (updates.viewMode !== undefined) updateState.viewMode = updates.viewMode;
    }

    set(updateState);
  },

  getActiveTab: () => getActiveTabFromState(get()),

  getTabById: (tabId: string) => get().tabs.find(t => t.id === tabId),

  findTabByFilePath: (filePath: string) => get().tabs.find(t => t.filePath === filePath),

  canAddTab: () => get().tabs.length < MAX_TABS,

  getTabCount: () => get().tabs.length,

  // Legacy setters - operate on active tab
  setDocument: (document) => {
    const { activeTabId, tabs } = get();
    if (!activeTabId) return;
    
    set({
      tabs: tabs.map(t => t.id === activeTabId ? { 
        ...t, 
        document,
        totalPages: document?.numPages || 0,
        currentPage: document ? 1 : 0,
      } : t),
      document,
      totalPages: document?.numPages || 0,
      currentPage: document ? 1 : 0,
    });
  },

  setMetadata: (metadata) => updateActiveTabProp(set, get, 'metadata', metadata),
  setFileName: (fileName) => updateActiveTabProp(set, get, 'fileName', fileName),
  setFilePath: (filePath) => updateActiveTabProp(set, get, 'filePath', filePath),
  setCurrentPage: (currentPage) => updateActiveTabProp(set, get, 'currentPage', currentPage),
  setScale: (scale) => updateActiveTabProp(set, get, 'scale', clampScale(scale)),
  setRotation: (rotation) => updateActiveTabProp(set, get, 'rotation', rotation % 360),
  setIsLoading: (isLoading) => updateActiveTabProp(set, get, 'isLoading', isLoading),
  setError: (error) => updateActiveTabProp(set, get, 'error', error),
  setViewMode: (viewMode) => updateActiveTabProp(set, get, 'viewMode', normalizeViewMode(viewMode)),
  setPdfBytes: (pdfBytes) => updateActiveTabProp(set, get, 'pdfBytes', pdfBytes),
  setHasUnsavedChanges: (hasUnsavedChanges) => updateActiveTabProp(set, get, 'hasUnsavedChanges', hasUnsavedChanges),

  // Navigation
  nextPage: () => {
    const tab = getActiveTabFromState(get());
    if (!tab) return;

    if (tab.viewMode === 'two-page') {
      const spreadStart = tab.currentPage % 2 === 0 ? tab.currentPage - 1 : tab.currentPage;
      if (spreadStart + 2 <= tab.totalPages) {
        get().updateTab(tab.id, { currentPage: spreadStart + 2 });
      }
      return;
    }

    if (tab.viewMode === 'book') {
      if (tab.currentPage === 1) {
        if (tab.totalPages > 1) {
          get().updateTab(tab.id, { currentPage: 2 });
        }
        return;
      }

      const spreadStart = tab.currentPage % 2 === 0 ? tab.currentPage : tab.currentPage - 1;
      if (spreadStart + 2 <= tab.totalPages) {
        get().updateTab(tab.id, { currentPage: spreadStart + 2 });
      }
      return;
    }

    if (tab.currentPage < tab.totalPages) {
      get().updateTab(tab.id, { currentPage: tab.currentPage + 1 });
    }
  },

  previousPage: () => {
    const tab = getActiveTabFromState(get());
    if (!tab) return;

    if (tab.viewMode === 'two-page') {
      const spreadStart = tab.currentPage % 2 === 0 ? tab.currentPage - 1 : tab.currentPage;
      if (spreadStart > 1) {
        get().updateTab(tab.id, { currentPage: spreadStart - 2 });
      }
      return;
    }

    if (tab.viewMode === 'book') {
      if (tab.currentPage <= 1) {
        return;
      }

      const spreadStart =
        tab.currentPage === 1
          ? 1
          : tab.currentPage % 2 === 0
            ? tab.currentPage
            : tab.currentPage - 1;

      if (spreadStart === 2) {
        get().updateTab(tab.id, { currentPage: 1 });
        return;
      }

      if (spreadStart > 2) {
        get().updateTab(tab.id, { currentPage: spreadStart - 2 });
      }
      return;
    }

    if (tab.currentPage > 1) {
      get().updateTab(tab.id, { currentPage: tab.currentPage - 1 });
    }
  },

  goToPage: (page) => {
    const tab = getActiveTabFromState(get());
    if (!tab) return;
    
    if (page >= 1 && page <= tab.totalPages) {
      get().updateTab(tab.id, { currentPage: page });
    }
  },

  // Zoom
  zoomIn: () => {
    const tab = getActiveTabFromState(get());
    if (!tab) return;
    get().updateTab(tab.id, { scale: getNextZoomScale(tab.scale, 'in') });
  },

  zoomOut: () => {
    const tab = getActiveTabFromState(get());
    if (!tab) return;
    get().updateTab(tab.id, { scale: getNextZoomScale(tab.scale, 'out') });
  },

  resetZoom: () => {
    const tab = getActiveTabFromState(get());
    if (tab) get().updateTab(tab.id, { scale: 1.0 });
  },

  fitToWidth: (containerWidth: number, pageWidth: number) => {
    const tab = getActiveTabFromState(get());
    if (!tab) return;
    
    const padding = 40;
    const availableWidth = containerWidth - padding;
    const scale = clampScale(availableWidth / pageWidth);
    get().updateTab(tab.id, { scale });
  },

  fitToPage: (containerWidth: number, containerHeight: number, pageWidth: number, pageHeight: number) => {
    const tab = getActiveTabFromState(get());
    if (!tab) return;

    const padding = 40;
    const availableWidth = containerWidth - padding;
    const availableHeight = containerHeight - padding;

    const scaleWidth = availableWidth / pageWidth;
    const scaleHeight = availableHeight / pageHeight;
    const scale = clampScale(Math.min(scaleWidth, scaleHeight));
    get().updateTab(tab.id, { scale });
  },

  // Rotation
  rotateClockwise: () => {
    const tab = getActiveTabFromState(get());
    if (tab) get().updateTab(tab.id, { rotation: (tab.rotation + 90) % 360 });
  },

  rotateCounterClockwise: () => {
    const tab = getActiveTabFromState(get());
    if (tab) get().updateTab(tab.id, { rotation: (tab.rotation - 90 + 360) % 360 });
  },

  resetRotation: () => {
    const tab = getActiveTabFromState(get());
    if (tab) get().updateTab(tab.id, { rotation: 0 });
  },

  // Reset active tab (for compatibility)
  reset: () => {
    const { activeTabId } = get();
    if (activeTabId) {
      get().removeTab(activeTabId);
    }
  },

  // Close all tabs
  closeAllTabs: () => {
    set({
      tabs: [],
      activeTabId: null,
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
    });
  },
}));
