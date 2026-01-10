import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button } from '../ui';

interface WebpageToPDFDialogProps {
  open: boolean;
  onClose: () => void;
}

export function WebpageToPDFDialog({ open, onClose }: WebpageToPDFDialogProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Legal' | 'A3'>('A4');
  const [landscape, setLandscape] = useState(false);
  const [margins, setMargins] = useState<'none' | 'minimal' | 'normal'>('normal');
  const [printBackground, setPrintBackground] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleConvert = async () => {
    if (!url.trim()) {
      setError(t('webpageToPdf.errorEmptyUrl', 'Please enter a URL'));
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(t('webpageToPdf.loading', 'Loading webpage...'));

    try {
      setStatus(t('webpageToPdf.converting', 'Converting to PDF...'));
      
      const result = await window.electronAPI.webpageToPDF({
        url: url.trim(),
        pageSize,
        landscape,
        margins,
        printBackground,
        timeout: 30,
      });

      if (result.success) {
        setStatus(t('webpageToPdf.success', 'PDF created successfully!'));
        setTimeout(() => {
          onClose();
          setUrl('');
          setStatus('');
        }, 1500);
      } else {
        setError(result.error || t('webpageToPdf.error', 'Failed to convert webpage'));
        setStatus('');
      }
    } catch (err: any) {
      setError(err.message || t('webpageToPdf.error', 'Failed to convert webpage'));
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const pageSizes = [
    { value: 'A4', label: 'A4' },
    { value: 'Letter', label: 'Letter' },
    { value: 'Legal', label: 'Legal' },
    { value: 'A3', label: 'A3' },
  ];

  const marginOptions = [
    { value: 'none', label: t('webpageToPdf.marginsNone', 'None') },
    { value: 'minimal', label: t('webpageToPdf.marginsMinimal', 'Minimal') },
    { value: 'normal', label: t('webpageToPdf.marginsNormal', 'Normal') },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('webpageToPdf.title', 'Webpage to PDF')}
      description={t('webpageToPdf.description', 'Convert any webpage to a PDF document')}
      size="lg"
    >
      <div className="space-y-4">
        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('webpageToPdf.urlLabel', 'Website URL')}
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('webpageToPdf.urlPlaceholder', 'https://example.com')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={loading}
          />
        </div>

        {/* Page Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('webpageToPdf.pageSize', 'Page Size')}
          </label>
          <div className="flex gap-2">
            {pageSizes.map((size) => (
              <button
                key={size.value}
                onClick={() => setPageSize(size.value as any)}
                disabled={loading}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  pageSize === size.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orientation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('webpageToPdf.orientation', 'Orientation')}
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setLandscape(false)}
              disabled={loading}
              className={`flex-1 px-3 py-1.5 text-sm rounded-md border transition-colors ${
                !landscape
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {t('webpageToPdf.portrait', 'Portrait')}
            </button>
            <button
              onClick={() => setLandscape(true)}
              disabled={loading}
              className={`flex-1 px-3 py-1.5 text-sm rounded-md border transition-colors ${
                landscape
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {t('webpageToPdf.landscape', 'Landscape')}
            </button>
          </div>
        </div>

        {/* Margins */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('webpageToPdf.margins', 'Margins')}
          </label>
          <div className="flex gap-2">
            {marginOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setMargins(option.value as any)}
                disabled={loading}
                className={`flex-1 px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  margins === option.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Print Background */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="printBackground"
            checked={printBackground}
            onChange={(e) => setPrintBackground(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="printBackground" className="text-sm text-gray-700 dark:text-gray-300">
            {t('webpageToPdf.includeBackground', 'Include background graphics and colors')}
          </label>
        </div>

        {/* Status/Error Messages */}
        {status && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm text-blue-700 dark:text-blue-300">{status}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md">
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {/* Info */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            💡 {t('webpageToPdf.info', 'The webpage will be loaded and rendered before converting to PDF. This may take a few seconds.')}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleConvert} disabled={loading || !url.trim()}>
            {loading ? t('webpageToPdf.converting', 'Converting...') : t('webpageToPdf.convert', 'Convert to PDF')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
