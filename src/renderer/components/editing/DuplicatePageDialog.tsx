/**
 * Duplicate Page Dialog
 * Dialog for duplicating a specific page in a PDF document
 */

import { useState, useEffect } from 'react';
import { Dialog, Button, Spinner } from '../ui';
import { pdfManipulationService } from '../../lib/pdf-manipulation.service';
import { useEditingStore } from '../../store/editing-store';
import { usePDFStore } from '../../store/pdf-store';

interface DuplicatePageDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DuplicatePageDialog({ open, onClose }: DuplicatePageDialogProps) {
  const [pageNumber, setPageNumber] = useState('1');
  const [insertAfter, setInsertAfter] = useState(true);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setModifiedPdf, setProcessing } = useEditingStore();
  const { document, fileName, totalPages } = usePDFStore();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPageNumber('1');
      setInsertAfter(true);
      setError(null);
    }
  }, [open]);

  const handleDuplicate = async () => {
    const pageNum = parseInt(pageNumber);

    if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
      setError(`Please enter a valid page number between 1 and ${totalPages}`);
      return;
    }

    if (!document) {
      setError('No document loaded');
      return;
    }

    try {
      setIsDuplicating(true);
      setProcessing(true, 0);
      setError(null);

      // Get original file as File object
      const pdfBytes = await document.getData();
      const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const file = new File([arrayBuffer], fileName || 'document.pdf', { type: 'application/pdf' });

      // Duplicate page
      const modifiedPdfBytes = await pdfManipulationService.duplicatePage(file, pageNum, insertAfter);

      setModifiedPdf(modifiedPdfBytes);
      setProcessing(false, 100);

      // Save the modified PDF
      const defaultName = fileName?.replace('.pdf', '_duplicated.pdf') || 'duplicated_page.pdf';
      const filePath = await window.electronAPI.saveFileDialog(defaultName);

      if (filePath) {
        const result = await window.electronAPI.savePdfFile(filePath, modifiedPdfBytes);

        if (result.success) {
          onClose();
          setPageNumber('1');
        } else {
          setError(result.error || 'Failed to save PDF');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate page');
    } finally {
      setIsDuplicating(false);
      setProcessing(false, 0);
    }
  };

  if (!document) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title="Duplicate Page"
        description="No document is currently open"
      >
        <div className="text-center text-gray-600 dark:text-gray-400">
          Please open a PDF document first
        </div>
      </Dialog>
    );
  }

  const pageNum = parseInt(pageNumber);
  const isValidPage = !isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages;
  const newPosition = isValidPage ? (insertAfter ? pageNum + 1 : pageNum) : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Duplicate Page"
      description={`Duplicate a page in ${fileName || 'document'}`}
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isDuplicating}>
            Cancel
          </Button>
          <Button onClick={handleDuplicate} disabled={!isValidPage || isDuplicating}>
            {isDuplicating ? <Spinner size="sm" /> : 'Duplicate Page'}
          </Button>
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

        {/* Page number input */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Page to Duplicate
          </label>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={pageNumber}
            onChange={(e) => setPageNumber(e.target.value)}
            disabled={isDuplicating}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50"
            placeholder={`1-${totalPages}`}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enter a page number between 1 and {totalPages}
          </p>
        </div>

        {/* Insert position */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Insert Position
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setInsertAfter(false)}
              disabled={isDuplicating}
              className={`
                flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all
                ${
                  !insertAfter
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <svg className={`h-6 w-6 ${!insertAfter ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className={`text-xs font-medium ${!insertAfter ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                Before Page
              </span>
            </button>
            <button
              onClick={() => setInsertAfter(true)}
              disabled={isDuplicating}
              className={`
                flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all
                ${
                  insertAfter
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <svg className={`h-6 w-6 ${insertAfter ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className={`text-xs font-medium ${insertAfter ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                After Page
              </span>
            </button>
          </div>
        </div>

        {/* Preview */}
        {isValidPage && newPosition && (
          <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Page {pageNum} will be duplicated and inserted at position {newPosition}
              <br />
              New document will have {totalPages + 1} pages
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
