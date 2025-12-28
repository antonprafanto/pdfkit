/**
 * Merge PDFs Dialog
 * Dialog for merging multiple PDF files
 */

import { useState } from 'react';
import { Dialog, Button, Spinner } from '../ui';
import { pdfManipulationService } from '../../lib/pdf-manipulation.service';
import { useEditingStore } from '../../store/editing-store';
import { usePDFStore } from '../../store/pdf-store';

interface MergeDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FileItem {
  file: File;
  name: string;
  pageCount?: number;
  pageRange?: string; // e.g., "1-5" or "all"
}

export function MergeDialog({ open, onClose }: MergeDialogProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [includeCurrentPDF, setIncludeCurrentPDF] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setModifiedPdf, setProcessing } = useEditingStore();
  const { document: currentDocument, fileName: currentFileName, totalPages: currentTotalPages } = usePDFStore();

  const handleSelectFiles = async () => {
    try {
      const selectedFiles = await window.electronAPI.openMultipleFilesDialog();

      if (!selectedFiles || selectedFiles.length === 0) return;

      setIsLoading(true);
      const fileItems: FileItem[] = [];

      for (const { name, data } of selectedFiles) {
        const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
        const file = new File([arrayBuffer], name, { type: 'application/pdf' });
        const pageCount = await pdfManipulationService.getPageCount(file);
        fileItems.push({ file, name, pageCount, pageRange: 'all' });
      }

      // APPEND instead of REPLACE
      setFiles([...files, ...fileItems]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load PDF files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMerge = async () => {
    // Need at least 2 total files
    const totalFiles = (includeCurrentPDF && currentDocument ? 1 : 0) + files.length;
    if (totalFiles < 2) {
      setError('Please select at least ' + (includeCurrentPDF && currentDocument ? '1 PDF file' : '2 PDF files') + ' to merge');
      return;
    }

    try {
      setProcessing(true, 0);
      setError(null);

      // Build final files array
      const finalFiles: File[] = [];
      const finalRanges: string[] = [];

      // Include current PDF if checkbox is enabled and document is open
      if (includeCurrentPDF && currentDocument && currentFileName) {
        const pdfBytes = await currentDocument.getData();
        const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
        const currentFile = new File([arrayBuffer], currentFileName, { type: 'application/pdf' });
        finalFiles.push(currentFile);
        finalRanges.push('all');
      }

      // Add selected files
      const pdfFiles = files.map(item => item.file);
      const pageRanges = files.map(item => item.pageRange || 'all');
      finalFiles.push(...pdfFiles);
      finalRanges.push(...pageRanges);

      const mergedPdfBytes = await pdfManipulationService.mergePDFs(finalFiles, finalRanges);

      setModifiedPdf(mergedPdfBytes);
      setProcessing(false, 100);

      // Save the merged PDF
      const defaultName = 'merged.pdf';
      const filePath = await window.electronAPI.saveFileDialog(defaultName);

      if (filePath) {
        const result = await window.electronAPI.savePdfFile(filePath, mergedPdfBytes);

        if (result.success) {
          onClose();
          setFiles([]);
        } else {
          setError(result.error || 'Failed to save merged PDF');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to merge PDFs');
    } finally {
      setProcessing(false, 0);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    setFiles(newFiles);
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setFiles(newFiles);
  };

  const handlePageRangeChange = (index: number, range: string) => {
    const newFiles = [...files];
    newFiles[index].pageRange = range;
    setFiles(newFiles);
  };

  const totalPages = files.reduce((sum, file) => sum + (file.pageCount || 0), 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Merge PDF Files"
      description="Select and reorder PDF files to merge into a single document"
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSelectFiles} disabled={isLoading}>
              {isLoading ? <Spinner size="sm" /> : 'Add Files'}
            </Button>
            <Button 
              onClick={handleMerge} 
              disabled={((includeCurrentPDF && currentDocument ? 1 : 0) + files.length < 2) || isLoading}
            >
              Merge {files.length > 0 && `(${totalPages + (includeCurrentPDF && currentDocument ? currentTotalPages : 0)} pages)`}
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

        {/* Include current PDF checkbox */}
        {currentDocument && (
          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <input
              type="checkbox"
              id="include-current"
              checked={includeCurrentPDF}
              onChange={(e) => setIncludeCurrentPDF(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="include-current" className="flex-1 text-sm text-blue-700 dark:text-blue-300">
              Include current PDF: <strong>{currentFileName}</strong> ({currentTotalPages} pages) as first file
            </label>
          </div>
        )}

        {/* File list */}
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 dark:border-gray-600">
            <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">No files selected</p>
            <Button variant="outline" onClick={handleSelectFiles} className="mt-4">
              Select PDF Files
            </Button>
          </div>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {files.map((fileItem, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Order number */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {index + 1}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {fileItem.name}
                  </p>
                  {fileItem.pageCount && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {fileItem.pageCount} pages
                      </p>
                      <span className="text-xs text-gray-400">•</span>
                      <input
                        type="text"
                        value={fileItem.pageRange}
                        onChange={(e) => handlePageRangeChange(index, e.target.value)}
                        placeholder="all or 1-5,10-15"
                        className="w-32 rounded border border-gray-300 px-2 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="rounded p-1 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
                    title="Move up"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === files.length - 1}
                    className="rounded p-1 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
                    title="Move down"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    title="Remove"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        {files.length > 0 && (
          <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {files.length} file{files.length > 1 ? 's' : ''} • {totalPages} total pages
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
