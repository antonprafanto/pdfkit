/**
 * Shortcuts Store - Keyboard shortcuts customization
 * Allows users to customize keyboard shortcut bindings
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ShortcutBinding {
  id: string;
  name: string;
  description: string;
  category: 'navigation' | 'zoom' | 'view' | 'file' | 'edit';
  defaultKeys: string[];
  customKeys: string[] | null; // null = use default
}

interface ShortcutsState {
  shortcuts: ShortcutBinding[];
  setShortcut: (id: string, keys: string[]) => void;
  resetShortcut: (id: string) => void;
  resetAllShortcuts: () => void;
  getActiveKeys: (id: string) => string[];
  hasConflict: (id: string, keys: string[]) => string | null; // returns conflicting shortcut id
}

const DEFAULT_SHORTCUTS: ShortcutBinding[] = [
  // Navigation
  { id: 'nextPage', name: 'Next Page', description: 'Go to next page', category: 'navigation', defaultKeys: ['ArrowRight', 'PageDown'], customKeys: null },
  { id: 'prevPage', name: 'Previous Page', description: 'Go to previous page', category: 'navigation', defaultKeys: ['ArrowLeft', 'PageUp'], customKeys: null },
  { id: 'firstPage', name: 'First Page', description: 'Go to first page', category: 'navigation', defaultKeys: ['Home'], customKeys: null },
  { id: 'lastPage', name: 'Last Page', description: 'Go to last page', category: 'navigation', defaultKeys: ['End'], customKeys: null },
  
  // Zoom
  { id: 'zoomIn', name: 'Zoom In', description: 'Increase zoom level', category: 'zoom', defaultKeys: ['Ctrl+=', 'Ctrl++'], customKeys: null },
  { id: 'zoomOut', name: 'Zoom Out', description: 'Decrease zoom level', category: 'zoom', defaultKeys: ['Ctrl+-'], customKeys: null },
  { id: 'zoomReset', name: 'Reset Zoom', description: 'Reset to 100% zoom', category: 'zoom', defaultKeys: ['Ctrl+0'], customKeys: null },
  { id: 'fitToWidth', name: 'Fit to Width', description: 'Fit page to window width', category: 'zoom', defaultKeys: ['Ctrl+1'], customKeys: null },
  { id: 'fitToPage', name: 'Fit to Page', description: 'Fit entire page in window', category: 'zoom', defaultKeys: ['Ctrl+2'], customKeys: null },
  
  // View
  { id: 'toggleSearch', name: 'Toggle Search', description: 'Open/close search panel', category: 'view', defaultKeys: ['Ctrl+F'], customKeys: null },
  { id: 'toggleThumbnails', name: 'Toggle Thumbnails', description: 'Show/hide thumbnail sidebar', category: 'view', defaultKeys: ['Ctrl+T'], customKeys: null },
  { id: 'showShortcuts', name: 'Show Shortcuts', description: 'Open keyboard shortcuts help', category: 'view', defaultKeys: ['F1', '?'], customKeys: null },
  
  // File
  { id: 'openFile', name: 'Open File', description: 'Open a PDF file', category: 'file', defaultKeys: ['Ctrl+O'], customKeys: null },
  { id: 'saveFile', name: 'Save File', description: 'Save current file', category: 'file', defaultKeys: ['Ctrl+S'], customKeys: null },
  { id: 'closeFile', name: 'Close File', description: 'Close current file', category: 'file', defaultKeys: ['Ctrl+W'], customKeys: null },
  { id: 'print', name: 'Print', description: 'Print document', category: 'file', defaultKeys: ['Ctrl+P'], customKeys: null },
  
  // Edit
  { id: 'rotateClockwise', name: 'Rotate Clockwise', description: 'Rotate page 90° clockwise', category: 'edit', defaultKeys: ['Ctrl+Shift+R'], customKeys: null },
  { id: 'rotateCounterClockwise', name: 'Rotate Counter-Clockwise', description: 'Rotate page 90° counter-clockwise', category: 'edit', defaultKeys: ['Ctrl+R'], customKeys: null },
];

export const useShortcutsStore = create<ShortcutsState>()(
  persist(
    (set, get) => ({
      shortcuts: DEFAULT_SHORTCUTS,

      setShortcut: (id, keys) => {
        set((state) => ({
          shortcuts: state.shortcuts.map((s) =>
            s.id === id ? { ...s, customKeys: keys } : s
          ),
        }));
      },

      resetShortcut: (id) => {
        set((state) => ({
          shortcuts: state.shortcuts.map((s) =>
            s.id === id ? { ...s, customKeys: null } : s
          ),
        }));
      },

      resetAllShortcuts: () => {
        set((state) => ({
          shortcuts: state.shortcuts.map((s) => ({ ...s, customKeys: null })),
        }));
      },

      getActiveKeys: (id) => {
        const shortcut = get().shortcuts.find((s) => s.id === id);
        if (!shortcut) return [];
        return shortcut.customKeys || shortcut.defaultKeys;
      },

      hasConflict: (id, keys) => {
        const shortcuts = get().shortcuts;
        for (const shortcut of shortcuts) {
          if (shortcut.id === id) continue;
          const activeKeys = shortcut.customKeys || shortcut.defaultKeys;
          for (const key of keys) {
            if (activeKeys.includes(key)) {
              return shortcut.id;
            }
          }
        }
        return null;
      },
    }),
    {
      name: 'shortcuts-storage',
      partialize: (state) => ({
        shortcuts: state.shortcuts,
      }),
    }
  )
);

// Helper to format key for display
export function formatKeyForDisplay(key: string): string {
  return key
    .replace('Ctrl+', '⌃')
    .replace('Shift+', '⇧')
    .replace('Alt+', '⌥')
    .replace('ArrowLeft', '←')
    .replace('ArrowRight', '→')
    .replace('ArrowUp', '↑')
    .replace('ArrowDown', '↓')
    .replace('PageUp', 'PgUp')
    .replace('PageDown', 'PgDn');
}

// Get shortcuts grouped by category
export function getShortcutsByCategory() {
  const shortcuts = useShortcutsStore.getState().shortcuts;
  const categories: Record<string, ShortcutBinding[]> = {};
  
  for (const shortcut of shortcuts) {
    if (!categories[shortcut.category]) {
      categories[shortcut.category] = [];
    }
    categories[shortcut.category].push(shortcut);
  }
  
  return categories;
}
