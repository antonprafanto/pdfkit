/**
 * Export Images Dialog
 * Dialog for exporting PDF pages as images (PNG/JPG/WEBP)
 */

import { useState, useEffect } from 'react';
import { Dialog, Button, Spinner } from '../ui';
import { conversionService, ImageFormat } from '../../lib/conversion.service';
import { usePDFStore } from '../../store/pdf-store';

interface ExportImagesDialogProps {
  open: boolean;
  onClose: () => void;
}

type PageSelection = 'all' | 'current' | 'range' | 'custom';

export function ExportImagesDialog({ open, onClose }: ExportImagesDialogProps) {
  const [selection, setSelection] = useState<PageSelection>('all');
  const [rangeStart, setRangeStart] = useState('1');
  const [rangeEnd, setRangeEnd] = useState('');
  const [customPages, setCustomPages] = useState('');
  const [format, setFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState(92);
  const [scale, setScale] = useState(2);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { document, fileName, totalPages, currentPage } = usePDFStore();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelection('all');
      setRangeStart('1');
      setRangeEnd(totalPages.toString());
      setCustomPages('');
      setFormat('png');
      setQuality(92);
      setScale(2);
      setError(null);
      setProgress(0);
    }
  }, [open, totalPages]);

  const getPageNumbers = (): number[] => {
    switch (selection) {
      case 'all':
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      case 'current':
        return [currentPage];
      case 'range': {
        const start = parseInt(rangeStart);
        const end = parseInt(rangeEnd);
        if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
          return [];
        }
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      }
      case 'custom': {
        const pages: number[] = [];
        const parts = customPages.split(',').map((p) => p.trim());
        
        for (const part of parts) {
          if (part.includes('-')) {
            // Range notation: 5-10
            const [startStr, endStr] = part.split('-');
            const start = parseInt(startStr?.trim() || '');
            const end = parseInt(endStr?.trim() || '');
            if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
              for (let i = start; i <= end; i++) {
                pages.push(i);
              }
            }
          } else {
            // Single page
            const page = parseInt(part);
            if (!isNaN(page) && page >= 1 && page <= totalPages) {
              pages.push(page);
            }
          }
        }
        
        return [...new Set(pages)].sort((a, b) => a - b);
      }
      default:
        return [];
    }
  };

  const handleExport = async () => {
    if (!document) {
      setError('No document loaded');
      return;
    }

    const pageNumbers = getPageNumbers();
    if (pageNumbers.length === 0) {
      setError('No valid pages selected');
      return;
    }

    try {
      setIsExporting(true);
      setError(null);
      setProgress(0);

      const baseName = fileName?.replace('.pdf', '') || 'document';
      const ext = format === 'jpeg' ? 'jpg' : format;

      // Export pages
      const blobs = await conversionService.exportPagesAsImages(
        document,
        pageNumbers,
        { format, quality: quality / 100, scale },
        (current, total) => {
          setProgress(Math.round((current / total) * 100));
        }
      );

      // Save each image
      for (let i = 0; i < blobs.length; i++) {
        const pageNum = pageNumbers[i];
        const defaultName = `${baseName}_page_${pageNum}.${ext}`;
        const filePath = await window.electronAPI.saveFileDialog(defaultName);

        if (filePath) {
          const arrayBuffer = await blobs[i].arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const result = await window.electronAPI.savePdfFile(filePath, uint8Array);

          if (!result.success) {
            setError(`Failed to save page ${pageNum}: ${result.error}`);
            setIsExporting(false);
            return;
          }
        } else {
          // User cancelled
          setError('Export cancelled');
          setIsExporting(false);
          return;
        }
      }

      // Success
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to export images');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  if (!document) {
    return (
      <Dialog open={open} onClose={onClose} title="Export as Images" description="No document is currently open">
        <div className="text-center text-gray-600 dark:text-gray-400">Please open a PDF document first</div>
      </Dialog>
    );
  }

  const pageCount = getPageNumbers().length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Export as Images"
      description={`Export pages from ${fileName || 'document'}`}
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={pageCount === 0 || isExporting}>
            {isExporting ? <Spinner size="sm" /> : `Export ${pageCount} page${pageCount !== 1 ? 's' : ''}`}
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

        {/* Progress bar */}
        {isExporting && (
          <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
            <div className="mb-2 flex justify-between text-sm text-blue-700 dark:text-blue-300">
              <span>Exporting...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
              <div
                className="h-full bg-blue-600 transition-all duration-300 dark:bg-blue-400"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Page Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Page Selection</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelection('all')}
              className={`rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                selection === 'all'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-medium">All Pages</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{totalPages} pages</div>
            </button>
            <button
              onClick={() => setSelection('current')}
              className={`rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                selection === 'current'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-medium">Current Page</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Page {currentPage}</div>
            </button>
            <button
              onClick={() => setSelection('range')}
              className={`rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                selection === 'range'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-medium">Page Range</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Specify start &amp; end</div>
            </button>
            <button
              onClick={() => setSelection('custom')}
              className={`rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                selection === 'custom'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-medium">Custom Pages</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Comma separated</div>
            </button>
          </div>

          {/* Range inputs */}
          {selection === 'range' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">From</label>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">To</label>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
            </div>
          )}

          {/* Custom pages input */}
          {selection === 'custom' && (
            <div>
              <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Pages (e.g., 1,3,5-10)</label>
              <input
                type="text"
                value={customPages}
                onChange={(e) => setCustomPages(e.target.value)}
                placeholder="1, 3, 5, 7-10"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
          )}
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Image Format</label>
          <div className="grid grid-cols-3 gap-2">
            {(['png', 'jpeg', 'webp'] as ImageFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                className={`rounded-lg border-2 p-2 text-sm font-medium transition-colors ${
                  format === fmt
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Quality slider (for JPEG/WEBP) */}
        {(format === 'jpeg' || format === 'webp') && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quality</label>
              <span className="text-sm text-gray-600 dark:text-gray-400">{quality}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        {/* Scale/Resolution */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Resolution</label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => setScale(s)}
                className={`rounded-lg border-2 p-2 text-sm transition-colors ${
                  scale === s
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                <div className="font-medium">{s}x</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{s * 72} DPI</div>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Tip:</strong> PNG is lossless, JPEG/WEBP are compressed. Resolution setting scales pixel dimensions (1x/2x/3x size). Note: DPI metadata in file may show 96 DPI, but actual image is scaled correctly.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
