/**
 * Reorder Pages Dialog
 * Dialog for reordering pages in a PDF document
 */

import { useState, useEffect } from 'react';
import { Dialog, Button, Spinner } from '../ui';
import { pdfManipulationService } from '../../lib/pdf-manipulation.service';
import { useEditingStore } from '../../store/editing-store';
import { usePDFStore } from '../../store/pdf-store';

interface ReorderPagesDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ReorderPagesDialog({ open, onClose }: ReorderPagesDialogProps) {
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const { setModifiedPdf, setProcessing } = useEditingStore();
  const { document, fileName, totalPages } = usePDFStore();

  // Initialize page order when dialog opens
  useEffect(() => {
    if (open && totalPages) {
      setPageOrder(Array.from({ length: totalPages }, (_, i) => i + 1));
      setError(null);
    }
  }, [open, totalPages]);

  const movePageUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...pageOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setPageOrder(newOrder);
  };

  const movePageDown = (index: number) => {
    if (index === pageOrder.length - 1) return;
    const newOrder = [...pageOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setPageOrder(newOrder);
  };

  const resetOrder = () => {
    setPageOrder(Array.from({ length: totalPages }, (_, i) => i + 1));
  };

  const hasChanges = () => {
    return !pageOrder.every((page, index) => page === index + 1);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...pageOrder];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    setPageOrder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleReorder = async () => {
    if (!hasChanges()) {
      setError('No changes made to page order');
      return;
    }

    if (!document) {
      setError('No document loaded');
      return;
    }

    try {
      setIsReordering(true);
      setProcessing(true, 0);
      setError(null);

      // Get original file as File object
      const pdfBytes = await document.getData();
      const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const file = new File([arrayBuffer], fileName || 'document.pdf', { type: 'application/pdf' });

      // Reorder pages
      const modifiedPdfBytes = await pdfManipulationService.reorderPages(file, pageOrder);

      setModifiedPdf(modifiedPdfBytes);
      setProcessing(false, 100);

      // Save the modified PDF
      const defaultName = fileName?.replace('.pdf', '_reordered.pdf') || 'reordered.pdf';
      const filePath = await window.electronAPI.saveFileDialog(defaultName);

      if (filePath) {
        const result = await window.electronAPI.savePdfFile(filePath, modifiedPdfBytes);

        if (result.success) {
          onClose();
          resetOrder();
        } else {
          setError(result.error || 'Failed to save PDF');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reorder pages');
    } finally {
      setIsReordering(false);
      setProcessing(false, 0);
    }
  };

  if (!document) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title="Reorder Pages"
        description="No document is currently open"
      >
        <div className="text-center text-gray-600 dark:text-gray-400">
          Please open a PDF document first
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Reorder Pages"
      description={`Rearrange pages in ${fileName || 'document'}`}
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isReordering}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetOrder} disabled={isReordering || !hasChanges()}>
              Reset Order
            </Button>
            <Button onClick={handleReorder} disabled={!hasChanges() || isReordering}>
              {isReordering ? <Spinner size="sm" /> : 'Save Reordered PDF'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Info banner */}
        <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Document has {totalPages} pages • Drag & drop or use arrows to reorder
            {hasChanges() && ' • Modified'}
          </p>
        </div>

        {/* Page list */}
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {pageOrder.map((pageNum, index) => (
            <div
              key={`${pageNum}-${index}`}
              draggable={!isReordering}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-3 rounded-md border p-3 transition-all
                ${
                  draggedIndex === index
                    ? 'border-blue-500 bg-blue-50 opacity-50 dark:border-blue-400 dark:bg-blue-900/20'
                    : dragOverIndex === index
                      ? 'border-blue-400 bg-blue-50 dark:border-blue-300 dark:bg-blue-900/10'
                      : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                }
                ${!isReordering ? 'cursor-move hover:border-gray-300 dark:hover:border-gray-600' : ''}
              `}
            >
              {/* Drag handle */}
              {!isReordering && (
                <div className="cursor-move text-gray-400" title="Drag to reorder">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </div>
              )}

              {/* New position */}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {index + 1}
              </div>

              {/* Page info */}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Page {pageNum}
                  {pageNum !== index + 1 && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      (originally #{pageNum})
                    </span>
                  )}
                </p>
              </div>

              {/* Move buttons */}
              <div className="flex gap-1">
                <button
                  onClick={() => movePageUp(index)}
                  disabled={index === 0 || isReordering}
                  className="rounded p-1 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
                  title="Move up"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => movePageDown(index)}
                  disabled={index === pageOrder.length - 1 || isReordering}
                  className="rounded p-1 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
                  title="Move down"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
