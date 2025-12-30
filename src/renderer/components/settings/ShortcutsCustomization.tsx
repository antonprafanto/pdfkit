/**
 * Shortcuts Customization Component
 * UI for viewing and customizing keyboard shortcuts
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { 
  useShortcutsStore, 
  ShortcutBinding, 
  formatKeyForDisplay 
} from '../../store/shortcuts-store';

interface ShortcutsCustomizationProps {
  className?: string;
}

export const ShortcutsCustomization: React.FC<ShortcutsCustomizationProps> = ({ 
  className = '' 
}) => {
  const { t } = useTranslation();
  const { shortcuts, setShortcut, resetShortcut, resetAllShortcuts, hasConflict } = useShortcutsStore();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const [conflictId, setConflictId] = useState<string | null>(null);

  const categories = {
    navigation: t('settings.shortcuts.navigation', 'Navigation'),
    zoom: t('settings.shortcuts.zoom', 'Zoom'),
    view: t('settings.shortcuts.view', 'View'),
    file: t('settings.shortcuts.file', 'File'),
    edit: t('settings.shortcuts.edit', 'Edit'),
  };

  const handleStartEdit = (shortcut: ShortcutBinding) => {
    setEditingId(shortcut.id);
    setRecordedKeys([]);
    setConflictId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.key === 'Escape') {
      setEditingId(null);
      setRecordedKeys([]);
      return;
    }

    // Build key string
    let keyString = '';
    if (e.ctrlKey || e.metaKey) keyString += 'Ctrl+';
    if (e.shiftKey) keyString += 'Shift+';
    if (e.altKey) keyString += 'Alt+';
    
    // Don't add modifier-only keys
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      keyString += e.key.length === 1 ? e.key.toUpperCase() : e.key;
      
      // Check for conflicts
      const conflict = hasConflict(editingId!, [keyString]);
      setConflictId(conflict);
      setRecordedKeys([keyString]);
    }
  };

  const handleSaveShortcut = () => {
    if (editingId && recordedKeys.length > 0 && !conflictId) {
      setShortcut(editingId, recordedKeys);
      setEditingId(null);
      setRecordedKeys([]);
    }
  };

  const handleResetShortcut = (id: string) => {
    resetShortcut(id);
  };

  const groupedShortcuts: Record<string, ShortcutBinding[]> = {};
  for (const shortcut of shortcuts) {
    if (!groupedShortcuts[shortcut.category]) {
      groupedShortcuts[shortcut.category] = [];
    }
    groupedShortcuts[shortcut.category].push(shortcut);
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Reset All */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          {t('settings.shortcuts.title', 'Keyboard Shortcuts')}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={resetAllShortcuts}
        >
          {t('settings.shortcuts.resetAll', 'Reset All')}
        </Button>
      </div>

      {/* Shortcuts by Category */}
      {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {categories[category as keyof typeof categories] || category}
          </h4>
          
          <div className="space-y-1">
            {categoryShortcuts.map((shortcut) => {
              const isEditing = editingId === shortcut.id;
              const activeKeys = shortcut.customKeys || shortcut.defaultKeys;
              const isCustomized = shortcut.customKeys !== null;
              
              return (
                <div
                  key={shortcut.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    isEditing ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {shortcut.name}
                      {isCustomized && (
                        <span className="ml-2 text-xs text-primary">
                          ({t('settings.shortcuts.customized', 'customized')})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{shortcut.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          className={`w-32 px-2 py-1 text-sm text-center rounded border ${
                            conflictId 
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                              : 'border-border bg-card'
                          } focus:outline-none focus:ring-2 focus:ring-primary`}
                          placeholder={t('settings.shortcuts.pressKey', 'Press key...')}
                          value={recordedKeys.join(', ')}
                          onKeyDown={handleKeyDown}
                          autoFocus
                          readOnly
                        />
                        {conflictId && (
                          <span className="text-xs text-red-500">
                            {t('settings.shortcuts.conflict', 'Conflict!')}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSaveShortcut}
                          disabled={recordedKeys.length === 0 || !!conflictId}
                        >
                          ✓
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          ✕
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex gap-1">
                          {activeKeys.map((key, idx) => (
                            <kbd
                              key={idx}
                              className="px-2 py-1 text-xs rounded bg-secondary text-foreground font-mono"
                            >
                              {formatKeyForDisplay(key)}
                            </kbd>
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(shortcut)}
                          className="opacity-0 group-hover:opacity-100 hover:opacity-100"
                        >
                          ✏️
                        </Button>
                        {isCustomized && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetShortcut(shortcut.id)}
                          >
                            ↺
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Info */}
      <p className="text-xs text-muted-foreground">
        {t('settings.shortcuts.hint', 'Click the edit button to customize a shortcut. Press Escape to cancel.')}
      </p>
    </div>
  );
};
