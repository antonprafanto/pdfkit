import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button } from '../ui';
import { usePDFStore } from '../../store/pdf-store';

interface WebOptimizePDFDialogProps {
  open: boolean;
  onClose: () => void;
}

type QualityLevel = 'screen' | 'ebook' | 'printer' | 'prepress';

const QUALITY_OPTIONS: { value: QualityLevel; dpi: number }[] = [
  { value: 'screen', dpi: 72 },
  { value: 'ebook', dpi: 150 },
  { value: 'printer', dpi: 300 },
  { value: 'prepress', dpi: 300 },
];

export function WebOptimizePDFDialog({ open, onClose }: WebOptimizePDFDialogProps) {
  const { t } = useTranslation();
  const { document, fileName } = usePDFStore();
  
  const [quality, setQuality] = useState<QualityLevel>('ebook');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ originalSize: number; newSize: number } | null>(null);

  const handleOptimize = async () => {
    if (!document || !fileName) {
      setError('No document loaded');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const pdfBytes = await document.getData();
      const originalSize = pdfBytes.length;
      
      const optimizeResult = await window.electronAPI.webOptimizePDF(pdfBytes, {
        quality,
      });

      if (optimizeResult.success && optimizeResult.data) {
        const newSize = optimizeResult.data.length;
        setResult({ originalSize, newSize });
        
        // Prompt to save
        const defaultName = fileName.replace('.pdf', '_optimized.pdf');
        const filePath = await window.electronAPI.saveFileDialog(defaultName);

        if (filePath) {
          const saveResult = await window.electronAPI.savePdfFile(filePath, optimizeResult.data);
          if (saveResult.success) {
            setTimeout(() => {
              onClose();
            }, 2000);
          } else {
            setError(saveResult.error || 'Failed to save PDF');
          }
        }
      } else {
        setError(optimizeResult.error || 'Failed to optimize PDF');
      }
    } catch (error: any) {
      console.error('Failed to optimize PDF:', error);
      setError(error.message || 'Failed to optimize PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const calculateSavings = (): string => {
    if (!result) return '';
    const savings = ((result.originalSize - result.newSize) / result.originalSize) * 100;
    return savings.toFixed(1);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('webOptimize.title')}
      description={t('webOptimize.description')}
      size="md"
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
              ✓ {t('webOptimize.success')}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">{t('webOptimize.originalSize')}:</span>
                <span className="ml-2 font-medium">{formatFileSize(result.originalSize)}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">{t('webOptimize.newSize')}:</span>
                <span className="ml-2 font-medium text-green-600">{formatFileSize(result.newSize)}</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
              {t('webOptimize.savings', { percent: calculateSavings() })}
            </p>
          </div>
        )}

        {/* Quality Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">
            {t('webOptimize.quality')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {QUALITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setQuality(option.value)}
                className={`p-3 border-2 rounded-lg text-left transition-colors ${
                  quality === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">{t(`webOptimize.${option.value}`)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {t(`webOptimize.${option.value}Desc`)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            ℹ️ {t('webOptimize.info')}
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
          onClick={handleOptimize}
          disabled={isProcessing || !document}
        >
          {isProcessing ? t('webOptimize.optimizing') : t('webOptimize.optimize')}
        </Button>
      </div>
    </Dialog>
  );
}
