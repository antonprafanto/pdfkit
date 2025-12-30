/**
 * Delete Pages Dialog
 * Dialog for deleting specific pages from a PDF document
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button, Spinner } from '../ui';
import { pdfManipulationService } from '../../lib/pdf-manipulation.service';
import { useEditingStore } from '../../store/editing-store';
import { usePDFStore } from '../../store/pdf-store';

interface DeletePagesDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DeletePagesDialog({ open, onClose }: DeletePagesDialogProps) {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setModifiedPdf, setProcessing } = useEditingStore();
  const { document, fileName, totalPages } = usePDFStore();
  const { t } = useTranslation();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedPages(new Set());
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

  const handleDelete = async () => {
    if (selectedPages.size === 0) {
      setError('Please select at least one page to delete');
      return;
    }

    if (selectedPages.size >= totalPages) {
      setError('Cannot delete all pages. At least one page must remain.');
      return;
    }

    if (!document) {
      setError('No document loaded');
      return;
    }

    try {
      setIsDeleting(true);
      setProcessing(true, 0);
      setError(null);

      // Get original file as File object
      const pdfBytes = await document.getData();
      const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const file = new File([arrayBuffer], fileName || 'document.pdf', { type: 'application/pdf' });

      // Delete selected pages
      const pagesToDelete = Array.from(selectedPages).sort((a, b) => a - b);
      const modifiedPdfBytes = await pdfManipulationService.deletePages(file, pagesToDelete);

      setModifiedPdf(modifiedPdfBytes);
      setProcessing(false, 100);

      // Save the modified PDF
      const defaultName = fileName?.replace('.pdf', '_deleted.pdf') || 'deleted_pages.pdf';
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
      setError(err.message || 'Failed to delete pages');
    } finally {
      setIsDeleting(false);
      setProcessing(false, 0);
    }
  };

  if (!document) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title={t('tools.delete')}
        description={t('errors.fileNotFound')}
      >
        <div className="text-center text-gray-600 dark:text-gray-400">
          {t('common.openFile')}
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('tools.delete')}
      description={t('split.description')}
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {t('common.cancel')}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={selectAll} disabled={isDeleting}>
              {t('common.selectAll')}
            </Button>
            <Button variant="outline" onClick={clearSelection} disabled={isDeleting}>
              {t('common.none')}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={selectedPages.size === 0 || isDeleting}
              variant="danger"
            >
              {isDeleting ? <Spinner size="sm" /> : `Delete ${selectedPages.size} page${selectedPages.size !== 1 ? 's' : ''}`}
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
            Document has {totalPages} pages • {selectedPages.size} selected for deletion
            {selectedPages.size > 0 && ` • ${totalPages - selectedPages.size} will remain`}
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
                  disabled={isDeleting}
                  className={`
                    relative flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all
                    ${
                      isSelected
                        ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  title={isSelected ? `Remove page ${pageNum} from selection` : `Select page ${pageNum} for deletion`}
                >
                  {/* Page icon */}
                  <svg
                    className={`h-8 w-8 ${isSelected ? 'text-white' : 'text-gray-400'}`}
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

                  {/* Page number */}
                  <span className={`mt-1 text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {pageNum}
                  </span>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute right-1 top-1">
                      <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
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

        {/* Warning */}
        {selectedPages.size > 0 && (
          <div className="rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              ⚠️ Warning: This action cannot be undone. The selected pages will be permanently removed from the new PDF.
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
