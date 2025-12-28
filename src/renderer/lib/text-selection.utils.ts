/**
 * Text Selection Handler for PDF Highlighting
 * Captures text selection and converts to highlight rectangles
 */

export interface TextSelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Get rectangles for current text selection within a container
 */
export function getTextSelectionRects(
  containerElement: HTMLElement,
  scale: number = 1
): TextSelectionRect[] {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return [];
  }

  const range = selection.getRangeAt(0);
  if (!range || range.collapsed) {
    return [];
  }

  // Check if selection is within our container
  if (!containerElement.contains(range.commonAncestorContainer)) {
    return [];
  }

  try {
    const rects: TextSelectionRect[] = [];
    const domRects = range.getClientRects();
    const containerRect = containerElement.getBoundingClientRect();

    for (let i = 0; i < domRects.length; i++) {
      const rect = domRects[i];
      
      // Convert to PDF coordinates (relative to container, scaled)
      rects.push({
        x: (rect.left - containerRect.left) / scale,
        y: (rect.top - containerRect.top) / scale,
        width: rect.width / scale,
        height: rect.height / scale,
      });
    }

    return rects;
  } catch (err) {
    console.error('Error getting selection rects:', err);
    return [];
  }
}

/**
 * Get selected text content
 */
export function getSelectedText(): string {
  const selection = window.getSelection();
  return selection ? selection.toString().trim() : '';
}

/**
 * Clear current text selection
 */
export function clearTextSelection(): void {
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
  }
}
