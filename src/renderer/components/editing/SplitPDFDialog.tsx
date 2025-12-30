/**
 * Split PDF Dialog
 * Dialog for splitting a PDF into multiple documents by page ranges
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button, Spinner, useToast } from '../ui';
import { pdfManipulationService, PageRange } from '../../lib/pdf-manipulation.service';
import { useEditingStore } from '../../store/editing-store';
import { usePDFStore } from '../../store/pdf-store';

interface SplitPDFDialogProps {
  open: boolean;
  onClose: () => void;
}

interface SplitRange {
  id: number;
  start: string;
  end: string;
}

type SplitMode = 'ranges' | 'every-n' | 'individual' | 'fixed-intervals';

export function SplitPDFDialog({ open, onClose }: SplitPDFDialogProps) {
  const [mode, setMode] = useState<SplitMode>('ranges');
  const [ranges, setRanges] = useState<SplitRange[]>([{ id: 1, start: '1', end: '' }]);
  const [everyNPages, setEveryNPages] = useState('10');
  const [numberOfFiles, setNumberOfFiles] = useState('5');
  const [nextId, setNextId] = useState(2);
  const [isSplitting, setIsSplitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setModifiedPdf, setProcessing } = useEditingStore();
  const { document, fileName, totalPages } = usePDFStore();
  const toast = useToast();
  const { t } = useTranslation();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setMode('ranges');
      setRanges([{ id: 1, start: '1', end: '' }]);
      setEveryNPages('10');
      setNumberOfFiles('5');
      setNextId(2);
      setError(null);
    }
  }, [open]);

  const addRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const newStart = lastRange.end ? (parseInt(lastRange.end) + 1).toString() : '';
    setRanges([...ranges, { id: nextId, start: newStart, end: '' }]);
    setNextId(nextId + 1);
  };

  const removeRange = (id: number) => {
    if (ranges.length > 1) {
      setRanges(ranges.filter((r) => r.id !== id));
    }
  };

  const updateRange = (id: number, field: 'start' | 'end', value: string) => {
    setRanges(
      ranges.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const validateRanges = (): PageRange[] | null => {
    const validRanges: PageRange[] = [];

    for (const range of ranges) {
      const start = parseInt(range.start);
      const end = parseInt(range.end);

      if (isNaN(start) || isNaN(end)) {
        setError('Please enter valid page numbers for all ranges');
        return null;
      }

      if (start < 1 || end > totalPages) {
        setError(`Page numbers must be between 1 and ${totalPages}`);
        return null;
      }

      if (start > end) {
        setError('Start page must be less than or equal to end page');
        return null;
      }

      validRanges.push({ start, end });
    }

    // Check for overlapping ranges
    for (let i = 0; i < validRanges.length; i++) {
      for (let j = i + 1; j < validRanges.length; j++) {
        const r1 = validRanges[i];
        const r2 = validRanges[j];
        if (
          (r1.start <= r2.end && r1.end >= r2.start) ||
          (r2.start <= r1.end && r2.end >= r1.start)
        ) {
          setError('Page ranges cannot overlap');
          return null;
        }
      }
    }

    return validRanges;
  };

  const handleSplit = async () => {
    if (!document) {
      setError('No document loaded');
      return;
    }

    try {
      setIsSplitting(true);
      setProcessing(true, 0);
      setError(null);

      // Get original file as File object
      const pdfBytes = await document.getData();
      const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const file = new File([arrayBuffer], fileName || 'document.pdf', { type: 'application/pdf' });
      const baseName = fileName?.replace('.pdf', '') || 'document';

      let splitPdfBytes: Uint8Array[];
      let fileNames: string[];

      // Call appropriate service method based on mode
      switch (mode) {
        case 'ranges': {
          const validRanges = validateRanges();
          if (!validRanges) {
            setIsSplitting(false);
            setProcessing(false, 0);
            return;
          }
          splitPdfBytes = await pdfManipulationService.splitPDF(file, validRanges);
          fileNames = validRanges.map((r) => `${baseName}_pages_${r.start}-${r.end}.pdf`);
          break;
        }
        case 'every-n': {
          const n = parseInt(everyNPages);
          if (isNaN(n) || n < 1) {
            setError('Please enter a valid number of pages');
            setIsSplitting(false);
            setProcessing(false, 0);
            return;
          }
          splitPdfBytes = await pdfManipulationService.splitEveryNPages(file, n);
          fileNames = splitPdfBytes.map((_, i) => {
            const start = i * n + 1;
            const end = Math.min((i + 1) * n, totalPages);
            return `${baseName}_pages_${start}-${end}.pdf`;
          });
          break;
        }
        case 'individual': {
          splitPdfBytes = await pdfManipulationService.splitIntoIndividualPages(file);
          fileNames = splitPdfBytes.map((_, i) => `${baseName}_page_${i + 1}.pdf`);
          break;
        }
        case 'fixed-intervals': {
          const n = parseInt(numberOfFiles);
          if (isNaN(n) || n < 2 || n > totalPages) {
            setError('Please enter a valid number of files');
            setIsSplitting(false);
            setProcessing(false, 0);
            return;
          }
          splitPdfBytes = await pdfManipulationService.splitIntoFixedIntervals(file, n);
          const pagesPerFile = Math.ceil(totalPages / n);
          fileNames = splitPdfBytes.map((_, i) => {
            const start = i * pagesPerFile + 1;
            const end = Math.min((i + 1) * pagesPerFile, totalPages);
            return `${baseName}_part_${i + 1}_pages_${start}-${end}.pdf`;
          });
          break;
        }
        default:
          setError('Invalid split mode');
          setIsSplitting(false);
          setProcessing(false, 0);
          return;
      }

      setProcessing(false, 100);

      // Save each split file
      for (let i = 0; i < splitPdfBytes.length; i++) {
        const defaultName = fileNames[i];
        const filePath = await window.electronAPI.saveFileDialog(defaultName);

        if (filePath) {
          const result = await window.electronAPI.savePdfFile(filePath, splitPdfBytes[i]);

          if (!result.success) {
            setError(`Failed to save file ${i + 1}: ${result.error}`);
            setIsSplitting(false);
            setProcessing(false, 0);
            return;
          }
        } else {
          // User cancelled, stop splitting
          setError('Split operation cancelled');
          setIsSplitting(false);
          setProcessing(false, 0);
          return;
        }
      }

      // All files saved successfully
      toast.success('PDF split successfully!', `Created ${splitPdfBytes.length} files`);
      onClose();
      setRanges([{ id: 1, start: '1', end: '' }]);
      setNextId(2);
    } catch (err: any) {
      setError(err.message || 'Failed to split PDF');
    } finally {
      setIsSplitting(false);
      setProcessing(false, 0);
    }
  };

  if (!document) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title={t('split.title')}
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
      title={t('split.title')}
      description={t('split.description')}
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isSplitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSplit} disabled={ranges.length === 0 || isSplitting}>
            {isSplitting ? <Spinner size="sm" /> : t('split.splitButton')}
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

        {/* Info banner */}
        <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Document has {totalPages} pages • Choose how to split the PDF
          </p>
        </div>

        {/* Split Mode Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Split Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('ranges')}
              className={`rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                mode === 'ranges'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-medium">Page Ranges</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Custom ranges</div>
            </button>
            <button
              onClick={() => setMode('every-n')}
              className={`rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                mode === 'every-n'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-medium">Every N Pages</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Split at intervals</div>
            </button>
            <button
              onClick={() => setMode('individual')}
              className={`rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                mode === 'individual'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-medium">Individual Pages</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">1 file per page</div>
            </button>
            <button
              onClick={() => setMode('fixed-intervals')}
              className={`rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                mode === 'fixed-intervals'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-medium">Fixed Intervals</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Split into N files</div>
            </button>
          </div>
        </div>

        {/* Mode-specific UI */}
        {mode === 'ranges' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Page Ranges
              </label>
              <Button size="sm" variant="outline" onClick={addRange} disabled={isSplitting}>
                + Add Range
              </Button>
            </div>

            <div className="max-h-96 space-y-2 overflow-y-auto">
              {ranges.map((range, index) => (
                <div
                  key={range.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">From</label>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={range.start}
                      onChange={(e) => updateRange(range.id, 'start', e.target.value)}
                      disabled={isSplitting}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50"
                      placeholder="1"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">To</label>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={range.end}
                      onChange={(e) => updateRange(range.id, 'end', e.target.value)}
                      disabled={isSplitting}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50"
                      placeholder={totalPages.toString()}
                    />
                  </div>

                  {ranges.length > 1 && (
                    <button
                      onClick={() => removeRange(range.id)}
                      disabled={isSplitting}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                      title="Remove range"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'every-n' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Pages per file
            </label>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={everyNPages}
              onChange={(e) => setEveryNPages(e.target.value)}
              disabled={isSplitting}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              placeholder="10"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Will create ~{Math.ceil(totalPages / parseInt(everyNPages || '1'))} files
            </p>
          </div>
        )}

        {mode === 'individual' && (
          <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              This will split the PDF into <strong>{totalPages} separate files</strong>, one for each page.
            </p>
          </div>
        )}

        {mode === 'fixed-intervals' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Number of files
            </label>
            <input
              type="number"
              min={2}
              max={totalPages}
              value={numberOfFiles}
              onChange={(e) => setNumberOfFiles(e.target.value)}
              disabled={isSplitting}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              placeholder="5"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              ~{Math.ceil(totalPages / parseInt(numberOfFiles || '1'))} pages per file
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Tips:</strong> You'll be prompted to save each split file separately.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
