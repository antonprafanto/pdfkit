/**
 * Field Keyboard Shortcuts Hook
 * Handles keyboard shortcuts for form field manipulation
 */

import { useEffect, useCallback } from 'react';
import { useFormsStore } from '../store/forms-store';
import { useToast } from '../components/ui/Toast';

export function useFieldKeyboardShortcuts() {
  const { 
    selectedField, 
    fields, 
    editMode,
    removeField, 
    updateField, 
    addField,
    selectField,
  } = useFormsStore();
  const toast = useToast();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle if not in edit mode
    if (!editMode) return;

    // Don't handle if typing in input/textarea
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }

    const selectedFieldData = fields.find(f => f.id === selectedField);

    // Escape - deselect field
    if (event.key === 'Escape') {
      event.preventDefault();
      selectField(null);
      return;
    }

    // The rest require a selected field
    if (!selectedField || !selectedFieldData) return;

    // Delete or Backspace - delete selected field
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      removeField(selectedField);
      toast.success('Field deleted', selectedFieldData.name);
      return;
    }

    // Arrow keys - nudge field position
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1; // Shift for larger steps
      const [x, y, width, height] = selectedFieldData.rect;
      
      let newRect: [number, number, number, number] = [x, y, width, height];
      
      switch (event.key) {
        case 'ArrowUp':
          newRect = [x, y - step, width, height];
          break;
        case 'ArrowDown':
          newRect = [x, y + step, width, height];
          break;
        case 'ArrowLeft':
          newRect = [x - step, y, width, height];
          break;
        case 'ArrowRight':
          newRect = [x + step, y, width, height];
          break;
      }
      
      updateField(selectedField, { rect: newRect });
      return;
    }

    // Ctrl+D - duplicate field
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
      event.preventDefault();
      
      const newField = {
        ...selectedFieldData,
        id: `field_${Date.now()}`,
        name: `${selectedFieldData.name}_copy`,
        rect: [
          selectedFieldData.rect[0] + 20,
          selectedFieldData.rect[1] + 20,
          selectedFieldData.rect[2],
          selectedFieldData.rect[3],
        ] as [number, number, number, number],
      };
      
      addField(newField);
      selectField(newField.id);
      toast.success('Field duplicated', newField.name);
      return;
    }

    // Ctrl+C - copy field to clipboard (store in memory for now)
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      event.preventDefault();
      // Store in a global variable for paste
      (window as any).__copiedField = { ...selectedFieldData };
      toast.info('Field copied');
      return;
    }

    // Ctrl+V - paste field
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      event.preventDefault();
      const copiedField = (window as any).__copiedField;
      
      if (copiedField) {
        const newField = {
          ...copiedField,
          id: `field_${Date.now()}`,
          name: `${copiedField.name}_pasted`,
          rect: [
            copiedField.rect[0] + 30,
            copiedField.rect[1] + 30,
            copiedField.rect[2],
            copiedField.rect[3],
          ] as [number, number, number, number],
        };
        
        addField(newField);
        selectField(newField.id);
        toast.success('Field pasted', newField.name);
      }
      return;
    }
  }, [editMode, selectedField, fields, removeField, updateField, addField, selectField, toast]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
