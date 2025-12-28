/**
 * Import Images Dialog
 * Dialog for converting images to PDF
 */

import { useState } from 'react';
import { Dialog, Button, Spinner } from '../ui';
import { conversionService, PageSize, FitMode } from '../../lib/conversion.service';

interface ImportImagesDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete?: (pdfBytes: Uint8Array) => void;
}

export function ImportImagesDialog({ open, onClose, onImportComplete }: ImportImagesDialogProps) {
  const [images, setImages] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [fitMode, setFitMode] = useState<FitMode>('fit');
  const [margin, setMargin] = useState(36); // 0.5 inch
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg,image/webp,image/bmp';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const newImages = Array.from(files);
        setImages([...images, ...newImages]);
        setError(null);
      }
    };
    input.click();
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setImages(newImages);
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setImages(newImages);
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setError('Please select at least one image');
      return;
    }

    try {
      setIsConverting(true);
      setError(null);

      // Convert images to PDF
      const pdfBytes = await conversionService.convertImagesToPDF(images, {
        pageSize,
        fitMode,
        margin,
      });

      // Save PDF
      const defaultName = 'images_to_pdf.pdf';
      const filePath = await window.electronAPI.saveFileDialog(defaultName);

      if (filePath) {
        const result = await window.electronAPI.savePdfFile(filePath, pdfBytes);

        if (result.success) {
          if (onImportComplete) {
            onImportComplete(pdfBytes);
          }
          onClose();
          setImages([]);
        } else {
          setError(result.error || 'Failed to save PDF');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to convert images to PDF');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Import from Images"
      description="Convert images to PDF document"
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isConverting}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={images.length === 0 || isConverting}>
            {isConverting ? <Spinner size="sm" /> : `Create PDF from ${images.length} image${images.length !== 1 ? 's' : ''}`}
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

        {/* File selection */}
        <div>
          <Button onClick={triggerFileInput} disabled={isConverting} className="w-full">
            {images.length === 0 ? '+ Select Images' : `+ Add More Images (${images.length} selected)`}
          </Button>
        </div>

        {/* Image list */}
        {images.length > 0 && (
          <div className="max-h-64 space-y-2 overflow-y-auto rounded border border-gray-200 p-2 dark:border-gray-700">
            {images.map((image, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded bg-gray-50 p-2 dark:bg-gray-800"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {index + 1}
                </span>
                <span className="flex-1 truncate text-sm">{image.name}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || isConverting}
                    className="rounded p-1 hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                    title="Move up"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === images.length - 1 || isConverting}
                    className="rounded p-1 hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                    title="Move down"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemoveImage(index)}
                    disabled={isConverting}
                    className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
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

        {/* Page Size */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Page Size</label>
          <div className="grid grid-cols-4 gap-2">
            {(['A4', 'Letter', 'Legal', 'Fit'] as PageSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setPageSize(size)}
                className={`rounded-lg border-2 p-2 text-sm transition-colors ${
                  pageSize === size
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Fit Mode */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Image Fit</label>
          <div className="grid grid-cols-3 gap-2">
            {(['fit', 'fill', 'stretch'] as FitMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setFitMode(mode)}
                className={`rounded-lg border-2 p-2 text-sm capitalize transition-colors ${
                  fitMode === mode
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Margin */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Margin</label>
            <span className="text-sm text-gray-600 dark:text-gray-400">{margin}pt</span>
          </div>
          <input
            type="range"
            min={0}
            max={72}
            step={9}
            value={margin}
            onChange={(e) => setMargin(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Info */}
        <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Tip:</strong> Use "Fit" to preserve aspect ratio, "Fill" to cover page, "Stretch" to ignore aspect ratio.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
