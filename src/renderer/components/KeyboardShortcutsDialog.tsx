/**
 * Keyboard Shortcuts Dialog
 * Displays all available keyboard shortcuts
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from './ui';

interface Shortcut {
  key: string;
  description: string;
  category: 'navigation' | 'editing' | 'view' | 'file';
}

const SHORTCUTS: Shortcut[] = [
  // File
  { key: 'Ctrl+O', description: 'shortcuts.openFile', category: 'file' },
  { key: 'Ctrl+S', description: 'shortcuts.saveFile', category: 'file' },
  { key: 'Ctrl+W', description: 'shortcuts.closeFile', category: 'file' },
  { key: 'Ctrl+P', description: 'shortcuts.print', category: 'file' },
  
  // Navigation
  { key: '←', description: 'shortcuts.previousPage', category: 'navigation' },
  { key: '→', description: 'shortcuts.nextPage', category: 'navigation' },
  { key: 'Home', description: 'shortcuts.firstPage', category: 'navigation' },
  { key: 'End', description: 'shortcuts.lastPage', category: 'navigation' },
  { key: 'Page Up', description: 'shortcuts.previousPage', category: 'navigation' },
  { key: 'Page Down', description: 'shortcuts.nextPage', category: 'navigation' },
  
  // View
  { key: 'Ctrl++', description: 'shortcuts.zoomIn', category: 'view' },
  { key: 'Ctrl+-', description: 'shortcuts.zoomOut', category: 'view' },
  { key: 'Ctrl+0', description: 'shortcuts.resetZoom', category: 'view' },
  { key: 'F11', description: 'shortcuts.fullscreen', category: 'view' },
  { key: 'Ctrl+F', description: 'shortcuts.find', category: 'view' },
  
  // Editing
  { key: 'Ctrl+Z', description: 'common.undo', category: 'editing' },
  { key: 'Ctrl+Y', description: 'common.redo', category: 'editing' },
  { key: 'Ctrl+C', description: 'common.copy', category: 'editing' },
  { key: 'Ctrl+V', description: 'common.paste', category: 'editing' },
  { key: 'Delete', description: 'common.delete', category: 'editing' },
  { key: 'Escape', description: 'shortcuts.escape', category: 'editing' },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'file', label: t('shortcuts.file') },
    { id: 'navigation', label: t('shortcuts.navigation') },
    { id: 'view', label: t('shortcuts.view') },
    { id: 'editing', label: t('shortcuts.editing') },
  ];

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return SHORTCUTS;
    
    const query = searchQuery.toLowerCase();
    return SHORTCUTS.filter(
      (s) =>
        s.key.toLowerCase().includes(query) ||
        t(s.description).toLowerCase().includes(query)
    );
  }, [searchQuery, t]);

  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, Shortcut[]> = {};
    
    for (const shortcut of filteredShortcuts) {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = [];
      }
      groups[shortcut.category].push(shortcut);
    }
    
    return groups;
  }, [filteredShortcuts]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('shortcuts.title')}
      size="lg"
    >
      <div className="w-full max-h-[500px] flex flex-col">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder={t('shortcuts.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t('shortcuts.search')}
            />
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {categories.map((category) => {
            const shortcuts = groupedShortcuts[category.id];
            if (!shortcuts || shortcuts.length === 0) return null;

            return (
              <div key={category.id}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {category.label}
                </h3>
                <div className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <div
                      key={`${shortcut.key}-${index}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span className="text-gray-700 dark:text-gray-200">
                        {t(shortcut.description)}
                      </span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-500">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredShortcuts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {t('common.none')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 dark:bg-gray-600 rounded">?</kbd> or <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 dark:bg-gray-600 rounded">F1</kbd> to open this dialog
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
