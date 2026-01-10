import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button } from '../ui';
import { usePDFStore } from '../../store/pdf-store';

interface AddPageNumbersDialogProps {
  open: boolean;
  onClose: () => void;
}

type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
type Format = 'numbers' | 'page-of-total' | 'roman' | 'letters';

export function AddPageNumbersDialog({ open, onClose }: AddPageNumbersDialogProps) {
  const { t } = useTranslation();
  const { document, fileName } = usePDFStore();
  const [position, setPosition] = useState<Position>('bottom-center');
  const [format, setFormat] = useState<Format>('numbers');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(12);
  const [margin, setMargin] = useState<number>(20);
  const [pageRange, setPageRange] = useState<'all' | 'custom'>('all');
  const [customRange, setCustomRange] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddPageNumbers = async () => {
    if (!document || !fileName) {
      setError('No document loaded');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const pdfBytes = await document.getData();
      const result = await window.electronAPI.addPageNumbers(pdfBytes, {
        position,
        format,
        startNumber,
        fontSize,
        margin,
        pageRange: pageRange === 'all' ? 'all' : customRange,
      });

      if (result.success && result.data) {
        const defaultName = fileName.replace('.pdf', '_numbered.pdf');
        const filePath = await window.electronAPI.saveFileDialog(defaultName);

        if (filePath) {
          const saveResult = await window.electronAPI.savePdfFile(filePath, result.data);
          if (saveResult.success) {
            onClose();
          } else {
            setError(saveResult.error || 'Failed to save PDF');
          }
        }
      } else {
        setError(result.error || 'Failed to add page numbers');
      }
    } catch (error: any) {
      console.error('Failed to add page numbers:', error);
      setError(error.message || 'Failed to add page numbers');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('addPageNumbers.title')} description={t('addPageNumbers.description')} size="lg">
      <div className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-3">{t('addPageNumbers.position')}</label>
          <div className="grid grid-cols-3 gap-2">
            {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as Position[]).map((pos) => (
              <button key={pos} onClick={() => setPosition(pos)} className={`p-3 border-2 rounded-lg text-sm transition-colors ${position === pos ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}`}>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 border-2 border-dashed border-gray-400 dark:border-gray-500 rounded relative">
                    <div className={`absolute w-2 h-2 bg-blue-500 rounded-full ${pos.includes('top') ? 'top-1' : 'bottom-1'} ${pos.includes('left') ? 'left-1' : pos.includes('right') ? 'right-1' : 'left-1/2 -ml-1'}`} />
                  </div>
                  <span className="text-xs capitalize">{pos.replace('-', ' ')}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t('addPageNumbers.format')}</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as Format)} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <option value="numbers">{t('addPageNumbers.formatNumbers')} (1, 2, 3...)</option>
            <option value="page-of-total">{t('addPageNumbers.formatPageOfTotal')} (Page 1 of 10)</option>
            <option value="roman">{t('addPageNumbers.formatRoman')} (I, II, III...)</option>
            <option value="letters">{t('addPageNumbers.formatLetters')} (A, B, C...)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('addPageNumbers.startNumber')}</label>
            <input type="number" min="1" value={startNumber} onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('addPageNumbers.fontSize')} (pt)</label>
            <input type="number" min="8" max="72" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value) || 12)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t('addPageNumbers.margin')} (px)</label>
          <input type="range" min="10" max="50" value={margin} onChange={(e) => setMargin(parseInt(e.target.value))} className="w-full" />
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center mt-1">{margin}px</div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t('addPageNumbers.pageRange')}</label>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input type="radio" checked={pageRange === 'all'} onChange={() => setPageRange('all')} className="w-4 h-4" />
              <span className="text-sm">{t('addPageNumbers.allPages')}</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="radio" checked={pageRange === 'custom'} onChange={() => setPageRange('custom')} className="w-4 h-4 mt-1" />
              <div className="flex-1">
                <span className="text-sm block mb-1">{t('addPageNumbers.customRange')}</span>
                <input type="text" placeholder="e.g., 1-5, 8, 10-12" value={customRange} onChange={(e) => { setCustomRange(e.target.value); setPageRange('custom'); }} disabled={pageRange !== 'custom'} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50" />
              </div>
            </label>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium mb-2">{t('addPageNumbers.preview')}</div>
          <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded h-32 relative">
            <div className={`absolute text-gray-600 dark:text-gray-400 ${position.includes('top') ? 'top-2' : 'bottom-2'} ${position.includes('left') ? 'left-2' : position.includes('right') ? 'right-2' : 'left-1/2 -translate-x-1/2'}`} style={{ fontSize: `${fontSize}px` }}>
              {format === 'numbers' && startNumber}
              {format === 'page-of-total' && `Page ${startNumber} of 10`}
              {format === 'roman' && (['I', 'II', 'III', 'IV', 'V'][startNumber - 1] || 'I')}
              {format === 'letters' && String.fromCharCode(64 + startNumber)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" onClick={onClose} disabled={isProcessing}>{t('common.cancel')}</Button>
        <Button onClick={handleAddPageNumbers} disabled={isProcessing}>{isProcessing ? t('addPageNumbers.processing') : t('addPageNumbers.apply')}</Button>
      </div>
    </Dialog>
  );
}
