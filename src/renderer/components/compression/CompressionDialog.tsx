/**
 * Compression Dialog Component
 * Dialog for compressing PDFs with quality options
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button, Spinner, useToast } from '../ui';
import { compressionService, CompressionOptions, CompressionResult } from '../../lib/compression.service';
import { usePDFStore } from '../../store/pdf-store';

interface CompressionDialogProps {
  open: boolean;
  onClose: () => void;
}

type QualityPreset = 'high' | 'medium' | 'low';

export function CompressionDialog({ open, onClose }: CompressionDialogProps) {
  const [quality, setQuality] = useState<QualityPreset>('medium');
  const [removeMetadata, setRemoveMetadata] = useState(true);
  const [optimizeImages, setOptimizeImages] = useState(true);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<CompressionResult | null>(null);
  
  const toast = useToast();
  const { document, fileName } = usePDFStore();
  const { t } = useTranslation();

  // Calculate original size and estimate
  useEffect(() => {
    if (open && document) {
      document.getData().then((data) => {
        const originalSize = data.length;
        const est = compressionService.estimateCompression(originalSize, quality);
        setEstimate(est);
      });
    }
  }, [open, document, quality]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuality('medium');
      setRemoveMetadata(true);
      setOptimizeImages(true);
      setProgress(0);
      setResult(null);
      setError(null);
    }
  }, [open]);

  const handleCompress = async () => {
    if (!document || !fileName) {
      setError('No document loaded');
      return;
    }

    try {
      setIsCompressing(true);
      setError(null);
      setProgress(0);

      // Get PDF data
      const pdfData = await document.getData();
      const pdfBytes = new Uint8Array(pdfData);
      const originalSize = pdfBytes.length;

      // Compress
      const options: CompressionOptions = {
        quality,
        removeMetadata,
        optimizeImages,
      };

      const compressedBytes = await compressionService.compressPDF(
        pdfBytes,
        options,
        (p) => setProgress(p)
      );

      // Get stats
      const stats = compressionService.getCompressionStats(originalSize, compressedBytes.length);
      setResult(stats);

      // Save compressed PDF
      const defaultName = fileName.replace('.pdf', '_compressed.pdf');
      const filePath = await window.electronAPI.saveFileDialog(defaultName);

      if (filePath) {
        const saveResult = await window.electronAPI.savePdfFile(filePath, compressedBytes);

        if (saveResult.success) {
          toast.success(
            'PDF compressed!',
            `${compressionService.formatBytes(stats.savings)} saved (${stats.savingsPercent.toFixed(1)}%)`
          );
          onClose();
        } else {
          setError(saveResult.error || 'Failed to save compressed PDF');
        }
      }
    } catch (err: any) {
      console.error('[Compression] Error:', err);
      setError(err.message || 'Compression failed');
      toast.error('Compression failed', err.message);
    } finally {
      setIsCompressing(false);
    }
  };

  const qualityDescriptions = {
    high: 'Best quality, minimal compression',
    medium: 'Balanced quality and file size',
    low: 'Maximum compression, lower quality',
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`📦 ${t('compress.title')}`}
      description={t('compress.description')}
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isCompressing}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCompress} disabled={!document || isCompressing}>
            {isCompressing ? <Spinner size="sm" /> : t('compress.compressButton')}
          </Button>
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
        {isCompressing && (
          <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="mb-2 flex justify-between text-sm text-blue-700 dark:text-blue-300">
              <span>Compressing...</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
              <div
                className="h-full bg-blue-600 transition-all duration-300 dark:bg-blue-400"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Result */}
        {result && !isCompressing && (
          <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <h4 className="font-medium text-green-800 dark:text-green-200">Compression Complete!</h4>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-green-700 dark:text-green-300">Original Size</p>
                <p className="font-medium text-green-900 dark:text-green-100">
                  {compressionService.formatBytes(result.originalSize)}
                </p>
              </div>
              <div>
                <p className="text-green-700 dark:text-green-300">Compressed Size</p>
                <p className="font-medium text-green-900 dark:text-green-100">
                  {compressionService.formatBytes(result.compressedSize)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm font-medium text-green-800 dark:text-green-200">
              Saved {compressionService.formatBytes(result.savings)} ({result.savingsPercent.toFixed(1)}%)
            </p>
          </div>
        )}

        {/* Settings (only show before compressing) */}
        {!result && !isCompressing && (
          <>
            {/* Quality Preset */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Compression Level
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['high', 'medium', 'low'] as QualityPreset[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className={`rounded-lg border-2 p-3 text-left transition-colors ${
                      quality === q
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <div className="font-medium capitalize text-gray-900 dark:text-white">{q}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {q === 'high' && '~10% smaller'}
                      {q === 'medium' && '~25% smaller'}
                      {q === 'low' && '~40% smaller'}
                    </div>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {qualityDescriptions[quality]}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Options</label>
              <div className="space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeMetadata}
                    onChange={(e) => setRemoveMetadata(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    🗑️ Remove metadata (title, author, etc.)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optimizeImages}
                    onChange={(e) => setOptimizeImages(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    🖼️ Optimize embedded images
                  </span>
                </label>
              </div>
            </div>

            {/* Estimate */}
            {estimate && (
              <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Result</h4>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Before</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {compressionService.formatBytes(estimate.originalSize)}
                    </p>
                  </div>
                  <div className="text-2xl text-gray-400">→</div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">After (est.)</p>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      {compressionService.formatBytes(estimate.compressedSize)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Savings</p>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      ~{estimate.savingsPercent.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                <strong>💡 Note:</strong> Actual compression results may vary depending on PDF content.
                PDFs with many images benefit most from compression.
              </p>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
