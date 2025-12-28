/**
 * Rotate Pages Dialog
 * Dialog for rotating specific pages in a PDF document
 */

import { useState, useEffect } from 'react';
import { Dialog, Button, Spinner } from '../ui';
import { pdfManipulationService } from '../../lib/pdf-manipulation.service';
import { useEditingStore } from '../../store/editing-store';
import { usePDFStore } from '../../store/pdf-store';

interface RotatePagesDialogProps {
  open: boolean;
  onClose: () => void;
}

export function RotatePagesDialog({ open, onClose }: RotatePagesDialogProps) {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [isRotating, setIsRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setModifiedPdf, setProcessing } = useEditingStore();
  const { document, fileName, totalPages } = usePDFStore();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedPages(new Set());
      setRotation(90);
      setError(null);
    }
  }, [open]);

  const togglePageSelection = (pageNumber: number) => {
    const newSelection = new Set(selectedPages);
    if (newSelection.has(pageNumber)) {
      newSelection.delete(pageNumber);
    } else {
      newSelection.add(pageNumber);
    }
    setSelectedPages(newSelection);
  };

  const selectAll = () => {
    const allPages = new Set<number>();
    for (let i = 1; i <= totalPages; i++) {
      allPages.add(i);
    }
    setSelectedPages(allPages);
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  };

  const handleRotate = async () => {
    if (selectedPages.size === 0) {
      setError('Please select at least one page to rotate');
      return;
    }

    if (!document) {
      setError('No document loaded');
      return;
    }

    try {
      setIsRotating(true);
      setProcessing(true, 0);
      setError(null);

      // Get original file as File object
      const pdfBytes = await document.getData();
      const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const file = new File([arrayBuffer], fileName || 'document.pdf', { type: 'application/pdf' });

      // Rotate selected pages
      const pagesToRotate = Array.from(selectedPages);
      const modifiedPdfBytes = await pdfManipulationService.rotatePages(file, pagesToRotate, rotation);

      setModifiedPdf(modifiedPdfBytes);
      setProcessing(false, 100);

      // Save the modified PDF
      const defaultName = fileName?.replace('.pdf', '_rotated.pdf') || 'rotated_pages.pdf';
      const filePath = await window.electronAPI.saveFileDialog(defaultName);

      if (filePath) {
        const result = await window.electronAPI.savePdfFile(filePath, modifiedPdfBytes);

        if (result.success) {
          onClose();
          setSelectedPages(new Set());
        } else {
          setError(result.error || 'Failed to save PDF');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to rotate pages');
    } finally {
      setIsRotating(false);
      setProcessing(false, 0);
    }
  };

  if (!document) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title="Rotate Pages"
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
      title="Rotate Pages"
      description={`Select pages to rotate in ${fileName || 'document'}`}
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isRotating}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={selectAll} disabled={isRotating}>
              Select All
            </Button>
            <Button variant="outline" onClick={clearSelection} disabled={isRotating}>
              Clear
            </Button>
            <Button onClick={handleRotate} disabled={selectedPages.size === 0 || isRotating}>
              {isRotating ? <Spinner size="sm" /> : `Rotate ${selectedPages.size} page${selectedPages.size !== 1 ? 's' : ''}`}
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

        {/* Rotation selector */}
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Rotation Angle
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setRotation(90)}
              disabled={isRotating}
              className={`
                flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all
                ${
                  rotation === 90
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <svg className={`h-8 w-8 ${rotation === 90 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className={`text-sm font-medium ${rotation === 90 ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                90° CW
              </span>
            </button>
            <button
              onClick={() => setRotation(180)}
              disabled={isRotating}
              className={`
                flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all
                ${
                  rotation === 180
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <svg className={`h-8 w-8 ${rotation === 180 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className={`text-sm font-medium ${rotation === 180 ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                180°
              </span>
            </button>
            <button
              onClick={() => setRotation(270)}
              disabled={isRotating}
              className={`
                flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all
                ${
                  rotation === 270
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <svg className={`h-8 w-8 ${rotation === 270 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className={`text-sm font-medium ${rotation === 270 ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                270° CW
              </span>
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Document has {totalPages} pages • {selectedPages.size} selected for rotation
            {selectedPages.size > 0 && ` • Will rotate ${rotation}° clockwise`}
          </p>
        </div>

        {/* Page grid */}
        <div className="max-h-96 overflow-y-auto">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const isSelected = selectedPages.has(pageNum);
              return (
                <button
                  key={pageNum}
                  onClick={() => togglePageSelection(pageNum)}
                  disabled={isRotating}
                  className={`
                    relative flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  title={isSelected ? `Remove page ${pageNum} from selection` : `Select page ${pageNum} for rotation`}
                >
                  {/* Page icon with rotation indicator */}
                  <div className={`transform transition-transform ${isSelected ? `rotate-${rotation}` : ''}`}>
                    <svg
                      className={`h-8 w-8 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  {/* Page number */}
                  <span className={`mt-1 text-xs font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {pageNum}
                  </span>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute right-1 top-1">
                      <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
