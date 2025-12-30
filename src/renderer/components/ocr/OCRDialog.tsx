/**
 * OCR Dialog Component
 * Dialog for performing OCR on scanned PDFs
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button, Spinner, useToast } from '../ui';
import { ocrService, OCR_LANGUAGES, OCRProgress, OCRResult } from '../../lib/ocr.service';
import { usePDFStore } from '../../store/pdf-store';

interface OCRDialogProps {
  open: boolean;
  onClose: () => void;
}

type PageSelection = 'all' | 'current' | 'range';

export function OCRDialog({ open, onClose }: OCRDialogProps) {
  const [language, setLanguage] = useState('eng');
  const [selection, setSelection] = useState<PageSelection>('all');
  const [rangeStart, setRangeStart] = useState('1');
  const [rangeEnd, setRangeEnd] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<OCRProgress | null>(null);
  const [results, setResults] = useState<OCRResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outputMode, setOutputMode] = useState<'text' | 'searchable'>('text');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toast = useToast();
  const { document, fileName, totalPages, currentPage } = usePDFStore();
  const { t } = useTranslation();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setLanguage('eng');
      setSelection('all');
      setRangeStart('1');
      setRangeEnd(totalPages.toString());
      setProgress(null);
      setResults(null);
      setError(null);
      setOutputMode('text');
    }
  }, [open, totalPages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ocrService.terminate();
    };
  }, []);

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
      default:
        return [];
    }
  };

  const renderPageToCanvas = async (pageNum: number): Promise<HTMLCanvasElement> => {
    if (!document) throw new Error('No document loaded');
    
    const page = await document.getPage(pageNum);
    const scale = 2; // Higher scale for better OCR accuracy
    const viewport = page.getViewport({ scale });
    
    const canvas = window.document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;
    
    return canvas;
  };

  const handleOCR = async () => {
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
      setIsProcessing(true);
      setError(null);
      setResults(null);
      setProgress({ status: 'Rendering pages...', progress: 0 });

      // Render pages to canvas
      const pageImages: HTMLCanvasElement[] = [];
      for (let i = 0; i < pageNumbers.length; i++) {
        setProgress({
          status: `Rendering page ${i + 1} of ${pageNumbers.length}...`,
          progress: (i / pageNumbers.length) * 0.3, // 30% for rendering
          page: i + 1,
          totalPages: pageNumbers.length,
        });
        
        const canvas = await renderPageToCanvas(pageNumbers[i]);
        pageImages.push(canvas);
      }

      // Perform OCR
      setProgress({ status: 'Initializing OCR engine...', progress: 0.3 });
      
      const ocrResults = await ocrService.recognizePDFPages(
        pageImages,
        { language },
        (p) => {
          setProgress({
            ...p,
            progress: 0.3 + (p.progress * 0.6), // 30-90% for OCR
          });
        }
      );

      setResults(ocrResults);
      setProgress({ status: 'Complete', progress: 1 });

      // Show confidence
      const avgConfidence = ocrService.getAverageConfidence(ocrResults);
      toast.success(
        'OCR completed!',
        `${pageNumbers.length} page(s) processed • ${avgConfidence.toFixed(1)}% confidence`
      );

      // If searchable PDF mode, create and save
      if (outputMode === 'searchable') {
        setProgress({ status: 'Creating searchable PDF...', progress: 0.95 });
        
        const pdfBytes = await document.getData();
        const originalBytes = new Uint8Array(pdfBytes);
        const searchablePdf = await ocrService.createSearchablePDF(originalBytes, ocrResults, pageImages);
        
        // Save
        const defaultName = fileName?.replace('.pdf', '_searchable.pdf') || 'searchable.pdf';
        const filePath = await window.electronAPI.saveFileDialog(defaultName);
        
        if (filePath) {
          const result = await window.electronAPI.savePdfFile(filePath, searchablePdf);
          if (result.success) {
            toast.success('Searchable PDF saved!', filePath.split(/[\\/]/).pop());
            onClose();
          } else {
            setError(result.error || 'Failed to save PDF');
          }
        }
      }
    } catch (err: any) {
      console.error('[OCR] Error:', err);
      setError(err.message || 'OCR failed');
      toast.error('OCR failed', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = () => {
    if (!results) return;
    
    const text = results.map((r) => r.text).join('\n\n--- Page Break ---\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Text copied to clipboard!');
  };

  const handleSaveText = async () => {
    if (!results) return;
    
    const text = results.map((r) => r.text).join('\n\n--- Page Break ---\n\n');
    const defaultName = fileName?.replace('.pdf', '_ocr.txt') || 'ocr_result.txt';
    const filePath = await window.electronAPI.saveFileDialog(defaultName);
    
    if (filePath) {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(text);
      const result = await window.electronAPI.savePdfFile(filePath, bytes);
      
      if (result.success) {
        toast.success('Text saved!', filePath.split(/[\\/]/).pop());
      } else {
        setError(result.error || 'Failed to save text');
      }
    }
  };

  const pageCount = getPageNumbers().length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`🔍 ${t('ocr.title')}`}
      description={t('ocr.description')}
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            {results ? t('common.close') : t('common.cancel')}
          </Button>
          {!results ? (
            <Button onClick={handleOCR} disabled={pageCount === 0 || isProcessing}>
              {isProcessing ? <Spinner size="sm" /> : `Run OCR (${pageCount} page${pageCount !== 1 ? 's' : ''})`}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopyText}>
                📋 Copy Text
              </Button>
              <Button onClick={handleSaveText}>
                💾 Save as TXT
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Error */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Progress */}
        {isProcessing && progress && (
          <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="mb-2 flex justify-between text-sm text-blue-700 dark:text-blue-300">
              <span>{progress.status}</span>
              <span>{Math.round(progress.progress * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
              <div
                className="h-full bg-blue-600 transition-all duration-300 dark:bg-blue-400"
                style={{ width: `${progress.progress * 100}%` }}
              />
            </div>
            {progress.page && progress.totalPages && (
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                Page {progress.page} of {progress.totalPages}
              </p>
            )}
          </div>
        )}

        {/* Results */}
        {results && !isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Extracted Text ({results.length} page{results.length !== 1 ? 's' : ''})
              </span>
              <span className="text-xs text-gray-500">
                Avg. confidence: {ocrService.getAverageConfidence(results).toFixed(1)}%
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                {results.map((r) => r.text).join('\n\n')}
              </pre>
            </div>
          </div>
        )}

        {/* Settings (only show before processing) */}
        {!results && !isProcessing && (
          <>
            {/* Language */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              >
                {OCR_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Page Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pages
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelection('all')}
                  className={`rounded-lg border-2 p-2 text-sm transition-colors ${
                    selection === 'all'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                >
                  All ({totalPages})
                </button>
                <button
                  onClick={() => setSelection('current')}
                  className={`rounded-lg border-2 p-2 text-sm transition-colors ${
                    selection === 'current'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                >
                  Current ({currentPage})
                </button>
                <button
                  onClick={() => setSelection('range')}
                  className={`rounded-lg border-2 p-2 text-sm transition-colors ${
                    selection === 'range'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                >
                  Range
                </button>
              </div>

              {selection === 'range' && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                    placeholder="From"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                    placeholder="To"
                  />
                </div>
              )}
            </div>

            {/* Output Mode */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Output
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOutputMode('text')}
                  className={`rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                    outputMode === 'text'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <div className="font-medium">📄 Text Only</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Extract text to copy/save
                  </div>
                </button>
                <button
                  onClick={() => setOutputMode('searchable')}
                  className={`rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                    outputMode === 'searchable'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <div className="font-medium">🔍 Searchable PDF</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Add invisible text layer
                  </div>
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                <strong>⚠️ Note:</strong> OCR works best on scanned documents with clear text.
                First-time usage may take longer as language data is downloaded.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} className="hidden" />
    </Dialog>
  );
}
