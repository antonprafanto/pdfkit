import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button } from '../ui';
import { usePDFStore } from '../../store/pdf-store';

interface OverlayPDFDialogProps {
  open: boolean;
  onClose: () => void;
}

type OverlayPosition = 'background' | 'foreground';
type PageApplication = 'all' | 'first' | 'last' | 'custom';
type ImagePosition = 'top' | 'bottom' | 'center' | 'full';

export function OverlayPDFDialog({ open, onClose }: OverlayPDFDialogProps) {
  const { t } = useTranslation();
  const { document, fileName } = usePDFStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [overlayFile, setOverlayFile] = useState<File | null>(null);
  const [position, setPosition] = useState<OverlayPosition>('foreground');
  const [pageApplication, setPageApplication] = useState<PageApplication>('all');
  const [customPages, setCustomPages] = useState('');
  const [opacity, setOpacity] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImageOverlay, setIsImageOverlay] = useState(false);
  const [imagePosition, setImagePosition] = useState<ImagePosition>('top');

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setOverlayFile(file);
      setError(null);
      // Detect if file is image
      const isImage = file.type.startsWith('image/') || 
        /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(file.name);
      setIsImageOverlay(isImage);
    }
  }, []);

  const handleOverlay = async () => {
    if (!document || !fileName) {
      setError('No document loaded');
      return;
    }

    if (!overlayFile) {
      setError(t('overlay.noOverlayFile'));
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const basePdfBytes = await document.getData();
      const overlayPdfBytes = await overlayFile.arrayBuffer();
      
      // Determine which pages to apply overlay
      let pageNumbers: number[] = [];
      const totalPages = document.numPages;
      
      switch (pageApplication) {
        case 'all':
          pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
          break;
        case 'first':
          pageNumbers = [1];
          break;
        case 'last':
          pageNumbers = [totalPages];
          break;
        case 'custom':
          pageNumbers = parseCustomPages(customPages, totalPages);
          break;
      }

      const result = await window.electronAPI.overlayPDF(basePdfBytes, new Uint8Array(overlayPdfBytes), {
        position,
        pageNumbers,
        opacity: opacity / 100,
        isImage: isImageOverlay,
        imagePosition: isImageOverlay ? imagePosition : undefined,
      });

      if (result.success && result.data) {
        const defaultName = fileName.replace('.pdf', '_overlayed.pdf');
        const filePath = await window.electronAPI.saveFileDialog(defaultName);

        if (filePath) {
          const saveResult = await window.electronAPI.savePdfFile(filePath, result.data);
          if (saveResult.success) {
            setOverlayFile(null);
            onClose();
          } else {
            setError(saveResult.error || 'Failed to save PDF');
          }
        }
      } else {
        setError(result.error || 'Failed to overlay PDFs');
      }
    } catch (error: any) {
      console.error('Failed to overlay PDF:', error);
      setError(error.message || 'Failed to overlay PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCustomPages = (input: string, total: number): number[] => {
    const pages: number[] = [];
    const parts = input.split(',');
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
        for (let i = start; i <= Math.min(end, total); i++) {
          if (i >= 1 && !pages.includes(i)) pages.push(i);
        }
      } else {
        const num = parseInt(trimmed);
        if (num >= 1 && num <= total && !pages.includes(num)) pages.push(num);
      }
    }
    
    return pages.sort((a, b) => a - b);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('overlay.title')}
      description={t('overlay.description')}
      size="md"
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Overlay File Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('overlay.overlayFile')}
          </label>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleFileSelect}>
              {t('overlay.selectFile')}
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
              {overlayFile ? overlayFile.name : t('overlay.noFileSelected')}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {t('overlay.fileHintWithImage')}
          </p>
        </div>

        {/* Image Position - only show for images */}
        {isImageOverlay && (
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('overlay.imagePositionLabel')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'top', label: t('overlay.positionTop') },
                { value: 'bottom', label: t('overlay.positionBottom') },
                { value: 'center', label: t('overlay.positionCenter') },
                { value: 'full', label: t('overlay.positionFull') },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setImagePosition(opt.value as ImagePosition)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    imagePosition === opt.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Position Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('overlay.position')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPosition('foreground')}
              className={`p-3 border-2 rounded-lg text-left transition-colors ${
                position === 'foreground'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">{t('overlay.foreground')}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {t('overlay.foregroundDesc')}
              </div>
            </button>
            <button
              onClick={() => setPosition('background')}
              className={`p-3 border-2 rounded-lg text-left transition-colors ${
                position === 'background'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">{t('overlay.background')}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {t('overlay.backgroundDesc')}
              </div>
            </button>
          </div>
        </div>

        {/* Page Application */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('overlay.applyTo')}
          </label>
          <select
            value={pageApplication}
            onChange={(e) => setPageApplication(e.target.value as PageApplication)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm"
          >
            <option value="all">{t('overlay.allPages')}</option>
            <option value="first">{t('overlay.firstPage')}</option>
            <option value="last">{t('overlay.lastPage')}</option>
            <option value="custom">{t('overlay.customPages')}</option>
          </select>
          
          {pageApplication === 'custom' && (
            <input
              type="text"
              value={customPages}
              onChange={(e) => setCustomPages(e.target.value)}
              placeholder="1, 3-5, 8"
              className="w-full mt-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          )}
        </div>

        {/* Opacity Slider */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('overlay.opacity')}: {opacity}%
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={opacity}
            onChange={(e) => setOpacity(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            ℹ️ {t('overlay.info')}
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
          onClick={handleOverlay}
          disabled={isProcessing || !document || !overlayFile}
        >
          {isProcessing ? t('overlay.processing') : t('overlay.apply')}
        </Button>
      </div>
    </Dialog>
  );
}
