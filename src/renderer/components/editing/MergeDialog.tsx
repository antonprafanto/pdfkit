/**
 * Merge PDFs Dialog
 * Dialog for merging multiple PDF files
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button, Spinner, useToast } from '../ui';
import { pdfManipulationService } from '../../lib/pdf-manipulation.service';
import { useEditingStore } from '../../store/editing-store';
import { usePDFStore } from '../../store/pdf-store';

interface MergeDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FileItem {
  id: string;
  file: File;
  name: string;
  pageCount?: number;
  pageRange?: string; // e.g., "1-5" or "all"
}

const FILE_DRAG_TYPE = 'Files';

const createFileItemId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `merge_file_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

const isPdfFile = (file: { name: string; type?: string }) => {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
};

const reorderFiles = (items: FileItem[], draggedId: string, targetId: string) => {
  const draggedIndex = items.findIndex((item) => item.id === draggedId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
    return items;
  }

  const nextItems = [...items];
  const [draggedItem] = nextItems.splice(draggedIndex, 1);
  nextItems.splice(targetIndex, 0, draggedItem);
  return nextItems;
};

export function MergeDialog({ open, onClose }: MergeDialogProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [includeCurrentPDF, setIncludeCurrentPDF] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFileDragActive, setIsFileDragActive] = useState(false);
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [dragOverFileId, setDragOverFileId] = useState<string | null>(null);
  const fileDragDepthRef = useRef(0);

  const { setModifiedPdf, setProcessing } = useEditingStore();
  const { document: currentDocument, fileName: currentFileName, totalPages: currentTotalPages } = usePDFStore();
  const toast = useToast();
  const { t } = useTranslation();

  const resetDragState = () => {
    setIsFileDragActive(false);
    fileDragDepthRef.current = 0;
    setDraggedFileId(null);
    setDragOverFileId(null);
  };

  useEffect(() => {
    if (!open) {
      resetDragState();
    }
  }, [open]);

  const createFileItems = async (incomingFiles: File[]) => {
    const validFiles = incomingFiles.filter(isPdfFile);

    if (validFiles.length === 0) {
      setError(t('merge.invalidDrop'));
      return;
    }

    setIsLoading(true);

    try {
      const fileItems: FileItem[] = [];

      for (const file of validFiles) {
        const pageCount = await pdfManipulationService.getPageCount(file);
        fileItems.push({
          id: createFileItemId(),
          file,
          name: file.name,
          pageCount,
          pageRange: 'all',
        });
      }

      setFiles((currentFiles) => [...currentFiles, ...fileItems]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load PDF files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFiles = async () => {
    try {
      const selectedFiles = await window.electronAPI.openMultipleFilesDialog();

      if (!selectedFiles || selectedFiles.length === 0) return;

      const incomingFiles = selectedFiles.map(({ name, data }) => {
        const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
        return new File([arrayBuffer], name, { type: 'application/pdf' });
      });

      await createFileItems(incomingFiles);
    } catch (err: any) {
      setError(err.message || 'Failed to load PDF files');
    }
  };

  const isExternalFileDrag = (e: React.DragEvent) => {
    return Array.from(e.dataTransfer?.types ?? []).includes(FILE_DRAG_TYPE);
  };

  const handleFileDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isExternalFileDrag(e)) return;

    e.preventDefault();
    e.stopPropagation();

    fileDragDepthRef.current += 1;
    setIsFileDragActive(true);
  };

  const handleFileDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isExternalFileDrag(e)) return;

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';

    if (!isFileDragActive) {
      setIsFileDragActive(true);
    }
  };

  const handleFileDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isExternalFileDrag(e)) return;

    e.preventDefault();
    e.stopPropagation();

    fileDragDepthRef.current = Math.max(fileDragDepthRef.current - 1, 0);

    if (fileDragDepthRef.current === 0) {
      setIsFileDragActive(false);
    }
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (!isExternalFileDrag(e)) return;

    e.preventDefault();
    e.stopPropagation();

    resetDragState();

    const droppedFiles = Array.from(e.dataTransfer.files ?? []);
    if (droppedFiles.length === 0) {
      setError(t('merge.invalidDrop'));
      return;
    }

    await createFileItems(droppedFiles);
  };

  const handleRowDragStart = (e: React.DragEvent<HTMLDivElement>, fileId: string) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', fileId);

    setDraggedFileId(fileId);
    setDragOverFileId(fileId);
  };

  const handleRowDragOver = (e: React.DragEvent<HTMLDivElement>, fileId: string) => {
    if (isExternalFileDrag(e)) return;
    if (!draggedFileId) return;

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (dragOverFileId !== fileId) {
      setDragOverFileId(fileId);
    }
  };

  const handleRowDrop = (e: React.DragEvent<HTMLDivElement>, targetFileId: string) => {
    if (isExternalFileDrag(e)) return;

    e.preventDefault();
    e.stopPropagation();

    if (!draggedFileId) {
      resetDragState();
      return;
    }

    setFiles((currentFiles) => reorderFiles(currentFiles, draggedFileId, targetFileId));
    setDraggedFileId(null);
    setDragOverFileId(null);
  };

  const handleRowDragEnd = () => {
    setDraggedFileId(null);
    setDragOverFileId(null);
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
      const pdfFiles = files.map((item) => item.file);
      const pageRanges = files.map((item) => item.pageRange || 'all');
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
          toast.success('PDFs merged successfully!', `Saved to ${filePath.split(/[\\/]/).pop()}`);
          resetDragState();
          onClose();
          setFiles([]);
        } else {
          toast.error('Failed to save merged PDF', result.error);
          setError(result.error || 'Failed to save merged PDF');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to merge PDFs');
    } finally {
      setProcessing(false, 0);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((currentFiles) => currentFiles.filter((fileItem) => fileItem.id !== fileId));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    setFiles((currentFiles) => {
      const nextFiles = [...currentFiles];
      [nextFiles[index - 1], nextFiles[index]] = [nextFiles[index], nextFiles[index - 1]];
      return nextFiles;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;

    setFiles((currentFiles) => {
      const nextFiles = [...currentFiles];
      [nextFiles[index], nextFiles[index + 1]] = [nextFiles[index + 1], nextFiles[index]];
      return nextFiles;
    });
  };

  const handlePageRangeChange = (fileId: string, range: string) => {
    setFiles((currentFiles) =>
      currentFiles.map((fileItem) =>
        fileItem.id === fileId
          ? { ...fileItem, pageRange: range }
          : fileItem
      )
    );
  };

  const totalPages = files.reduce((sum, file) => sum + (file.pageCount || 0), 0);

  const fileDropZoneClasses = `
    rounded-lg border-2 border-dashed transition-colors
    ${isFileDragActive
      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
      : 'border-gray-300 dark:border-gray-600'
    }
  `;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('merge.title')}
      description={t('merge.description')}
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSelectFiles} disabled={isLoading}>
              {isLoading ? <Spinner size="sm" /> : t('merge.addFiles')}
            </Button>
            <Button
              onClick={handleMerge}
              disabled={((includeCurrentPDF && currentDocument ? 1 : 0) + files.length < 2) || isLoading}
            >
              {t('merge.mergeButton')} {files.length > 0 && `(${totalPages + (includeCurrentPDF && currentDocument ? currentTotalPages : 0)} pages)`}
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

        <div
          onDragEnter={handleFileDragEnter}
          onDragOver={handleFileDragOver}
          onDragLeave={handleFileDragLeave}
          onDrop={handleFileDrop}
          className={`space-y-3 ${fileDropZoneClasses} ${files.length === 0 ? 'p-8' : 'p-4'}`}
          aria-label={t('merge.dragDrop')}
        >
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center">
              <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-200">{t('merge.dragDrop')}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('merge.dropHint')}</p>
              <Button variant="outline" onClick={handleSelectFiles} className="mt-4" disabled={isLoading}>
                {isLoading ? <Spinner size="sm" /> : 'Select PDF Files'}
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-900/40 dark:text-gray-300">
                <span className="font-medium">{t('merge.dragDrop')}</span> {t('merge.dropHint')}
              </div>

              <div className="max-h-96 space-y-2 overflow-y-auto">
                {files.map((fileItem, index) => (
                  <div
                    key={fileItem.id}
                    draggable={!isLoading}
                    onDragStart={(e) => handleRowDragStart(e, fileItem.id)}
                    onDragOver={(e) => handleRowDragOver(e, fileItem.id)}
                    onDrop={(e) => handleRowDrop(e, fileItem.id)}
                    onDragEnd={handleRowDragEnd}
                    className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${
                      draggedFileId === fileItem.id
                        ? 'border-blue-500 bg-blue-50 opacity-60 dark:border-blue-400 dark:bg-blue-900/20'
                        : dragOverFileId === fileItem.id && draggedFileId !== fileItem.id
                          ? 'border-blue-400 bg-blue-50 dark:border-blue-300 dark:bg-blue-900/10'
                          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                    } ${!isLoading ? 'cursor-move' : ''}`}
                  >
                    <div className="cursor-move text-gray-400" title={t('merge.reorderHint')}>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </div>

                    {/* Order number */}
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {index + 1}
                    </div>

                    {/* File info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {fileItem.name}
                      </p>
                      {fileItem.pageCount && (
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {fileItem.pageCount} pages
                          </p>
                          <span className="text-xs text-gray-400">•</span>
                          <input
                            type="text"
                            value={fileItem.pageRange}
                            onChange={(e) => handlePageRangeChange(fileItem.id, e.target.value)}
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
                        onClick={() => handleRemoveFile(fileItem.id)}
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
            </>
          )}
        </div>

        {/* Info */}
        {files.length > 0 && (
          <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {files.length} file{files.length > 1 ? 's' : ''} • {totalPages} total pages • {t('merge.reorderHint')}
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
