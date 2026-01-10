/**
 * PDF Store - Zustand State Management
 * Manages PDF document state with multi-tab support
 * Each tab has its own document, page, zoom, rotation state
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
  viewMode: 'single' | 'continuous' | 'facing';
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
  viewMode: 'single' | 'continuous' | 'facing';

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
  setViewMode: (mode: 'single' | 'continuous' | 'facing') => void;
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

    set({
      tabs: [...tabs, newTab],
      activeTabId: newTab.id,
      // Update legacy properties
      document: newTab.document,
      metadata: newTab.metadata,
      fileName: newTab.fileName,
      filePath: newTab.filePath,
      totalPages: newTab.totalPages,
      currentPage: newTab.currentPage,
      scale: newTab.scale,
      rotation: newTab.rotation,
      isLoading: newTab.isLoading,
      error: newTab.error,
      viewMode: newTab.viewMode,
    });

    return newTab.id;
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
    
    const newTabs = tabs.map(t => t.id === tabId ? { ...t, ...updates } : t);
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
  setScale: (scale) => updateActiveTabProp(set, get, 'scale', Math.max(0.25, Math.min(5.0, scale))),
  setRotation: (rotation) => updateActiveTabProp(set, get, 'rotation', rotation % 360),
  setIsLoading: (isLoading) => updateActiveTabProp(set, get, 'isLoading', isLoading),
  setError: (error) => updateActiveTabProp(set, get, 'error', error),
  setViewMode: (viewMode) => updateActiveTabProp(set, get, 'viewMode', viewMode),
  setPdfBytes: (pdfBytes) => updateActiveTabProp(set, get, 'pdfBytes', pdfBytes),
  setHasUnsavedChanges: (hasUnsavedChanges) => updateActiveTabProp(set, get, 'hasUnsavedChanges', hasUnsavedChanges),

  // Navigation
  nextPage: () => {
    const tab = getActiveTabFromState(get());
    if (!tab) return;
    
    if (tab.currentPage < tab.totalPages) {
      get().updateTab(tab.id, { currentPage: tab.currentPage + 1 });
    }
  },

  previousPage: () => {
    const tab = getActiveTabFromState(get());
    if (!tab) return;
    
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
    get().updateTab(tab.id, { scale: Math.min(5.0, tab.scale + 0.25) });
  },

  zoomOut: () => {
    const tab = getActiveTabFromState(get());
    if (!tab) return;
    get().updateTab(tab.id, { scale: Math.max(0.25, tab.scale - 0.25) });
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
    const scale = Math.min(5.0, Math.max(0.25, availableWidth / pageWidth));
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
    const scale = Math.min(5.0, Math.max(0.25, Math.min(scaleWidth, scaleHeight)));
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
