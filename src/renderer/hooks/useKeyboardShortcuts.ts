/**
 * Keyboard Shortcuts Hook
 * Handles keyboard shortcuts for PDF viewer navigation and controls
 */

import { useEffect } from 'react';

export interface KeyboardShortcutHandlers {
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onFitToWidth?: () => void;
  onFitToPage?: () => void;
  onRotateClockwise?: () => void;
  onRotateCounterClockwise?: () => void;
  onToggleSearch?: () => void;
  onFirstPage?: () => void;
  onLastPage?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const { ctrlKey, shiftKey, key } = event;

      // Navigation shortcuts
      if (key === 'ArrowRight' || key === 'PageDown' || key === ' ') {
        event.preventDefault();
        handlers.onNextPage?.();
      } else if (key === 'ArrowLeft' || key === 'PageUp') {
        event.preventDefault();
        handlers.onPreviousPage?.();
      } else if (key === 'Home') {
        event.preventDefault();
        handlers.onFirstPage?.();
      } else if (key === 'End') {
        event.preventDefault();
        handlers.onLastPage?.();
      }

      // Zoom shortcuts
      else if ((ctrlKey || event.metaKey) && (key === '+' || key === '=')) {
        event.preventDefault();
        handlers.onZoomIn?.();
      } else if ((ctrlKey || event.metaKey) && key === '-') {
        event.preventDefault();
        handlers.onZoomOut?.();
      } else if ((ctrlKey || event.metaKey) && key === '0') {
        event.preventDefault();
        handlers.onResetZoom?.();
      } else if ((ctrlKey || event.metaKey) && key === '1') {
        event.preventDefault();
        handlers.onFitToWidth?.();
      } else if ((ctrlKey || event.metaKey) && key === '2') {
        event.preventDefault();
        handlers.onFitToPage?.();
      }

      // Rotation shortcuts
      else if ((ctrlKey || event.metaKey) && shiftKey && key === 'R') {
        event.preventDefault();
        handlers.onRotateClockwise?.();
      } else if ((ctrlKey || event.metaKey) && key === 'r') {
        event.preventDefault();
        handlers.onRotateCounterClockwise?.();
      }

      // Search shortcut
      else if ((ctrlKey || event.metaKey) && key === 'f') {
        event.preventDefault();
        handlers.onToggleSearch?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
