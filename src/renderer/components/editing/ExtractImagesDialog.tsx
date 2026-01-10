import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button } from '../ui';
import { usePDFStore } from '../../store/pdf-store';

interface ExtractImagesDialogProps {
  open: boolean;
  onClose: () => void;
}

type ImageFormat = 'png' | 'jpeg';

export function ExtractImagesDialog({ open, onClose }: ExtractImagesDialogProps) {
  const { t } = useTranslation();
  const { document, fileName } = usePDFStore();
  
  const [format, setFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState<number>(90);
  const [minWidth, setMinWidth] = useState<number>(100);
  const [minHeight, setMinHeight] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedCount, setExtractedCount] = useState<number | null>(null);

  const handleExtract = async () => {
    if (!document || !fileName) {
      setError('No document loaded');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setExtractedCount(null);

    try {
      // Get PDF bytes from document
      const pdfBytes = await document.getData();
      
      // Call IPC handler to extract images
      const result = await window.electronAPI.extractImages(pdfBytes, {
        format,
        quality: format === 'jpeg' ? quality : 100,
        minWidth,
        minHeight,
        fileName: fileName,
      });

      if (result.success && result.count !== undefined) {
        setExtractedCount(result.count);
        if (result.count === 0) {
          setError('No images found in the PDF');
        } else {
          // Success! Images have been extracted and saved
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } else {
        setError(result.error || 'Failed to extract images');
      }
    } catch (error: any) {
      console.error('Failed to extract images:', error);
      setError(error.message || 'Failed to extract images');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('extractImages.title')}
      description={t('extractImages.description')}
      size="md"
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {extractedCount !== null && extractedCount > 0 && (
          <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
            <p className="text-sm text-green-700 dark:text-green-300">
              ✓ {t('extractImages.success', { count: extractedCount })}
            </p>
          </div>
        )}

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('extractImages.format')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('png')}
              className={`p-3 border-2 rounded-lg text-sm transition-colors ${
                format === 'png'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">PNG</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {t('extractImages.lossless')}
              </div>
            </button>
            <button
              onClick={() => setFormat('jpeg')}
              className={`p-3 border-2 rounded-lg text-sm transition-colors ${
                format === 'jpeg'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">JPEG</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {t('extractImages.smaller')}
              </div>
            </button>
          </div>
        </div>

        {/* Quality Slider (JPEG only) */}
        {format === 'jpeg' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('extractImages.quality')} ({quality}%)
            </label>
            <input
              type="range"
              min="50"
              max="100"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span>{t('extractImages.smaller')}</span>
              <span>{t('extractImages.betterQuality')}</span>
            </div>
          </div>
        )}

        {/* Minimum Size Filters */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('extractImages.minSize')}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t('extractImages.minWidth')} (px)
              </label>
              <input
                type="number"
                min="0"
                value={minWidth}
                onChange={(e) => setMinWidth(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t('extractImages.minHeight')} (px)
              </label>
              <input
                type="number"
                min="0"
                value={minHeight}
                onChange={(e) => setMinHeight(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {t('extractImages.minSizeHint')}
          </p>
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            ℹ️ {t('extractImages.info')}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isProcessing}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleExtract}
          disabled={isProcessing || !document}
        >
          {isProcessing ? t('extractImages.extracting') : t('extractImages.extract')}
        </Button>
      </div>
    </Dialog>
  );
}
